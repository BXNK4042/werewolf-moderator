import type { GameState, NightQueue, NightStep, Player, RoleId } from "./types";
import { getRole } from "./roles";
import { addEffect, effectAt, hasEffect, removeEffect } from "./effects";
import { checkWinner } from "./win-conditions";

// Roles that wake together as the Werewolf pack (one shared victim).
// ponytail: other wolf roles (dream-wolf, white-wolf, dire-wolf, fruit-brute,
// wolf-man, black-wolf, big-bad-wolf) are stubs — add here once confirmed.
const PACK_WOLF_IDS: RoleId[] = ["werewolf", "wolf-cub", "lone-wolf"];
const VAMPIRE_IDS: RoleId[] = ["vampire"]; // the-count/bloody-mary/chupacabra are stubs

export const WOLVES = "__wolves";
export const VAMPIRES = "__vampires";

const isWolfTeam = (p: Player): boolean =>
  p.roleId ? getRole(p.roleId).team === "werewolf" : false;

function killSource(roleId: RoleId): "wolf" | "vampire" | "witch" | "hunter" {
  if (PACK_WOLF_IDS.includes(roleId)) return "wolf";
  if (VAMPIRE_IDS.includes(roleId)) return "vampire";
  if (roleId === "witch") return "witch";
  return "hunter";
}

const MAX_LOG = 200;

const withLog = (state: GameState, text: string): GameState => ({
  ...state,
  log: [
    ...state.log,
    { night: state.nightNumber, phase: state.phase, text, at: Date.now() },
  ].slice(-MAX_LOG),
});

// --- Dealing --------------------------------------------------------------

export function dealRoles(state: GameState): GameState {
  // Fisher–Yates over the pool, dealt to seats in order. Math.random is fine
  // here — this is a board-game shuffle, not a secret.
  const pool = [...state.rolePool];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const players = state.players.map((p, i) => ({ ...p, roleId: pool[i] ?? null }));
  return withLog({ ...state, players }, "Roles dealt — Night 1 begins.");
}

// --- Night queue ----------------------------------------------------------

export function buildNightQueue(state: GameState): NightQueue {
  const alive = state.players.filter((p) => p.alive && p.roleId);
  const seerAlive = alive.some((p) => p.roleId === "seer");

  const wolves = alive.filter((p) => p.roleId && PACK_WOLF_IDS.includes(p.roleId));
  const vampires = alive.filter((p) => p.roleId && VAMPIRE_IDS.includes(p.roleId));
  const grouped = new Set([...wolves.map((p) => p.id), ...vampires.map((p) => p.id)]);
  const others = alive.filter((p) => !grouped.has(p.id));

  const steps: NightStep[] = [];
  if (wolves.length) {
    const hasBonus = wolves.some((p) => hasEffect(p, "wolf-cub-bonus") && effectAt(p, "wolf-cub-bonus")?.nightApplied === state.nightNumber - 1);
    const prompt = hasBonus
      ? "Werewolves: Wolf Cub died last night — choose TWO victims (not other Werewolves)."
      : getRole("werewolf").nightAction!.prompt;
    steps.push({
      playerId: WOLVES,
      roleId: "werewolf",
      prompt,
    });
  }
  if (vampires.length)
    steps.push({
      playerId: VAMPIRES,
      roleId: "vampire",
      prompt: getRole("vampire").nightAction!.prompt,
    });

  for (const p of others) {
    const role = getRole(p.roleId!);
    const na = role.nightAction;
    if (!na) continue;
    if (na.firstNightOnly && state.nightNumber > 1) continue;
    if (role.id === "apprentice-seer" && seerAlive) continue; // only once Seer is dead
    if (role.id === "drunk" && state.nightNumber !== 3) continue; // night-3 reveal
    steps.push({ playerId: p.id, roleId: role.id, prompt: na.prompt });
  }

  steps.sort(
    (a, b) =>
      getRole(a.roleId).nightAction!.defaultOrder -
      getRole(b.roleId).nightAction!.defaultOrder,
  );

  return { steps, cursor: 0 };
}

// --- Death application + heartbreak cascade (shared by dawn & day) --------

function applyDeaths(
  players: Player[],
  deaths: { id: string; cause: string }[],
  night: number,
): { players: Player[]; died: string[] } {
  const byId = new Map(players.map((p) => [p.id, p]));
  const died: string[] = [];

  const kill = (id: string, cause: string) => {
    const p = byId.get(id);
    if (!p || !p.alive) return;
    byId.set(id, { ...p, alive: false, diedAt: { night, cause } });
    died.push(id);
  };

  for (const d of deaths) kill(d.id, d.cause);

  // Wolf Cub bonus: if Wolf Cub died, werewolves get 2 kills next night.
  const wolfCubDied = died.some((id) => {
    const p = byId.get(id);
    return p?.roleId === "wolf-cub";
  });
  if (wolfCubDied) {
    for (const p of players) {
      if (p.alive && p.roleId && PACK_WOLF_IDS.includes(p.roleId)) {
        const existing = byId.get(p.id);
        if (existing && !hasEffect(existing, "wolf-cub-bonus")) {
          byId.set(p.id, addEffect(existing, "wolf-cub-bonus", night));
        }
      }
    }
  }

  // Heartbreak cascade: a dead Soulmate takes their partner. Loop until stable.
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of died) {
      const p = byId.get(id)!;
      const link = effectAt(p, "lover-link");
      if (!link?.source) continue;
      const partner = byId.get(link.source);
      if (partner?.alive) {
        kill(partner.id, "heartbreak");
        changed = true;
      }
    }
  }

  return { players: players.map((p) => byId.get(p.id) ?? p), died };
}

// --- Dawn resolution ------------------------------------------------------

export function resolveDawn(state: GameState): GameState {
  const queue = state.nightQueue;
  let players = state.players.map((p) => ({ ...p, effects: [...p.effects] }));
  let logs: string[] = [];

  const protectedSet = new Set<string>();
  const kills: { targetId: string; source: "wolf" | "vampire" | "witch" | "hunter" }[] = [];
  const converts: string[] = [];
  const links: [string, string][] = [];

  if (queue) {
    for (const step of queue.steps) {
      const o = step.outcome;
      if (!o) continue;
      if (o.kind === "protect") o.targetIds.forEach((t) => protectedSet.add(t));
      else if (o.kind === "kill") {
        const source = killSource(step.roleId);
        o.targetIds.forEach((t) => kills.push({ targetId: t, source }));
      } else if (o.kind === "convert") o.targetIds.forEach((t) => converts.push(t));
      else if (o.kind === "link") links.push(o.targetIds);
    }
  }

  // Diseased: if wolves ate the Diseased last night, they skip this night and
  // the sickness clears. (Effect lives on wolf-team players.)
  const wolvesSick = players.some((p) => isWolfTeam(p) && hasEffect(p, "diseased"));
  let activeKills = kills;
  if (wolvesSick) {
    activeKills = kills.filter((k) => k.source !== "wolf");
    players = players.map((p) => (isWolfTeam(p) ? removeEffect(p, "diseased") : p));
    logs.push("Werewolves are diseased — they skip killing this night.");
  }

  // Resolve kills → deaths.
  const deaths: { id: string; cause: string }[] = [];
  const seen = new Set<string>();
  for (const k of activeKills) {
    if (seen.has(k.targetId)) continue;
    seen.add(k.targetId);
    const target = players.find((p) => p.id === k.targetId);
    if (!target || !target.alive) continue;

    if (k.source === "wolf" && target.roleId === "vampire") continue; // wolves can't kill vampires
    if (protectedSet.has(k.targetId)) {
      logs.push(`${target.name} was attacked but survived (protected).`);
      continue;
    }
    if (k.source === "wolf" && target.roleId === "cursed") {
      // Cursed joins the wolves instead of dying.
      players = players.map((p) =>
        p.id === target.id ? { ...p, roleId: "werewolf" } : p,
      );
      logs.push(`${target.name} (Cursed) was turned to the Werewolf team.`);
      continue;
    }
    const cause =
      k.source === "wolf"
        ? "werewolves"
        : k.source === "vampire"
          ? "vampire"
          : k.source === "witch"
            ? "witch"
            : "hunter";
    deaths.push({ id: target.id, cause });
  }

  // Conversions (Cult): keep role, add cult effect to the target only.
  for (const id of converts) {
    const target = players.find((p) => p.id === id);
    if (target?.alive) {
      players = players.map((p) =>
        p.id === id ? addEffect(p, "cult", state.nightNumber, "cult-leader") : p,
      );
      logs.push(`${target.name} joined the cult.`);
    }
  }

  // Soulmates (Cupid): pair via effect.source = partner id.
  for (const [a, b] of links) {
    players = players.map((p) => {
      if (p.id === a) return addEffect(p, "lover-link", state.nightNumber, b);
      if (p.id === b) return addEffect(p, "lover-link", state.nightNumber, a);
      return p;
    });
    logs.push(`${players.find((p) => p.id === a)?.name} and ${players.find((p) => p.id === b)?.name} are Soulmates.`);
  }

  // Apply deaths + heartbreak cascade.
  const { players: deadApplied, died } = applyDeaths(players, deaths, state.nightNumber);
  players = deadApplied;
  for (const id of died) {
    const p = players.find((x) => x.id === id);
    if (p) logs.push(`${p.name} died (${p.diedAt?.cause}).`);
  }

  // Diseased trigger: if a Diseased player died to wolves this night, sicken them.
  const diseasedDied = died.some((id) => {
    const p = players.find((x) => x.id === id);
    const wasWolfKill = deaths.some((d) => d.id === id && d.cause === "werewolves");
    return p?.roleId === "diseased" && wasWolfKill;
  });
  if (diseasedDied) {
    players = players.map((p) => (isWolfTeam(p) ? addEffect(p, "diseased", state.nightNumber) : p));
    logs.push("The Diseased was eaten — Werewolves are sickened and skip next night's kill.");
  }

  // Hunter reprisal is a moderator prompt, not auto-resolved (the Hunter chooses).
  if (died.some((id) => players.find((x) => x.id === id)?.roleId === "hunter")) {
    logs.push("A Hunter died — they may take a player with them (use the override).");
  }

  // Clean up wolf-cub-bonus after it's used (was applied on previous night).
  players = players.map((p) => {
    const bonus = effectAt(p, "wolf-cub-bonus");
    if (bonus && bonus.nightApplied === state.nightNumber - 1) {
      return removeEffect(p, "wolf-cub-bonus");
    }
    return p;
  });

  let next: GameState = { ...state, players, nightQueue: undefined };

  // Win check (tanner side-win, team wins, lover-link override handled there).
  const { winner } = checkWinner(next);
  if (winner) {
    next = { ...next, phase: "gameover", winner };
    logs.push(`${winner.toUpperCase()} team wins!`);
  } else {
    next = { ...next, phase: "day" };
  }

  for (const l of logs) next = withLog(next, l);
  return next;
}

// --- Day death recording --------------------------------------------------

export function recordDayDeath(
  state: GameState,
  targetId: string,
  cause: string,
): GameState {
  let players = state.players.map((p) => ({ ...p }));
  const target = players.find((p) => p.id === targetId);
  if (!target?.alive) return state;

  const { players: applied, died } = applyDeaths(players, [{ id: targetId, cause }], state.nightNumber);
  players = applied;

  let next: GameState = { ...state, players };
  next = withLog(next, `${target.name} was eliminated (${cause}).`);
  for (const id of died) {
    if (id === targetId) continue;
    const p = players.find((x) => x.id === id);
    if (p) next = withLog(next, `${p.name} died (${p.diedAt?.cause}).`);
  }
  if (died.includes(targetId) && target.roleId === "hunter") {
    next = withLog(next, "A Hunter died — they may take a player with them (use the override).");
  }

  const { winner } = checkWinner(next);
  if (winner) next = { ...next, phase: "gameover", winner };
  return next;
}

// --- Phase advancement ----------------------------------------------------

export function advancePhase(state: GameState): GameState {
  if (state.phase === "night") {
    const resolved = resolveDawn(state);
    if (resolved.winner) return resolved;
    return withLog({ ...resolved, phase: "day" }, `Day ${resolved.nightNumber} — discussion${resolved.nightNumber === 1 ? " (no vote on day 1)" : ""}.`);
  }
  if (state.phase === "day") {
    const nightNumber = state.nightNumber + 1;
    const nightQueue = buildNightQueue({ ...state, nightNumber });
    return withLog(
      { ...state, phase: "night", nightNumber, nightQueue },
      `Night ${nightNumber} begins.`,
    );
  }
  return state;
}

// --- selfCheck ------------------------------------------------------------

function selfCheck() {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error("engine selfCheck failed: " + msg);
  };
  const mkPlayer = (id: string, roleId: RoleId, alive = true): Player => ({
    id,
    name: id,
    roleId,
    alive,
    effects: [],
  });
  const base = (
    players: Player[],
    overrides?: Partial<GameState>,
  ): GameState => ({
    players,
    rolePool: players.map((p) => p.roleId!),
    phase: "night",
    nightNumber: 2,
    log: [],
    past: [],
    future: [],
    ...overrides,
  });
  const find = (s: GameState, id: string) => s.players.find((p) => p.id === id)!;
  const queueWith = (
    steps: NightStep[],
  ): NightQueue => ({ steps, cursor: 0 });

  // dealRoles: every seat gets a role, pool exhausted.
  let s = base([
    mkPlayer("a", "villager" as RoleId),
    mkPlayer("b", "seer" as RoleId),
  ]);
  s = { ...s, phase: "setup", nightNumber: 0 };
  // ponytail: deal mutates roleId; build a pool-aligned state then deal.
  const dealt = dealRoles({
    ...s,
    rolePool: ["werewolf", "villager"],
    players: [
      { id: "a", name: "A", roleId: null, alive: true, effects: [] },
      { id: "b", name: "B", roleId: null, alive: true, effects: [] },
    ],
  });
  assert(dealt.players.every((p) => p.roleId !== null), "deal assigns all roles");
  assert(
    ["werewolf", "villager"].every((r) => dealt.players.some((p) => p.roleId === r)),
    "deal preserves the pool",
  );

  // buildNightQueue: first-night-only roles drop after night 1; wolves grouped.
  const n1 = buildNightQueue(
    base(
      [mkPlayer("w", "werewolf"), mkPlayer("c", "cupid"), mkPlayer("v", "villager")],
      { nightNumber: 1 },
    ),
  );
  assert(n1.steps.some((st) => st.playerId === WOLVES), "wolves grouped");
  assert(n1.steps.some((st) => st.roleId === "cupid"), "cupid on night 1");
  const n2 = buildNightQueue(
    base([mkPlayer("w", "werewolf"), mkPlayer("c", "cupid"), mkPlayer("v", "villager")]),
  );
  assert(!n2.steps.some((st) => st.roleId === "cupid"), "cupid drops after night 1");
  assert(n2.steps.some((st) => st.playerId === WOLVES), "wolves still grouped");

  // resolveDawn: protection cancels a wolf kill.
  let night = base([mkPlayer("w", "werewolf"), mkPlayer("v", "villager"), mkPlayer("b", "bodyguard")]);
  night = {
    ...night,
    nightQueue: queueWith([
      { playerId: WOLVES, roleId: "werewolf", prompt: "", outcome: { kind: "kill", targetIds: ["v"] } },
      { playerId: "b", roleId: "bodyguard", prompt: "", outcome: { kind: "protect", targetIds: ["v"] } },
    ]),
  };
  let dawn = resolveDawn(night);
  assert(find(dawn, "v").alive, "protected victim survives");

  // resolveDawn: unprotected kill lands.
  night = {
    ...base([mkPlayer("w", "werewolf"), mkPlayer("v", "villager")]),
    nightQueue: queueWith([
      { playerId: WOLVES, roleId: "werewolf", prompt: "", outcome: { kind: "kill", targetIds: ["v"] } },
    ]),
  };
  dawn = resolveDawn(night);
  assert(!find(dawn, "v").alive, "unprotected victim dies");
  assert(dawn.players.filter((p) => p.alive).length === 1, "one survivor");

  // resolveDawn: wolves eating the Cursed turns them, no death.
  night = {
    ...base([mkPlayer("w", "werewolf"), mkPlayer("c", "cursed")]),
    nightQueue: queueWith([
      { playerId: WOLVES, roleId: "werewolf", prompt: "", outcome: { kind: "kill", targetIds: ["c"] } },
    ]),
  };
  dawn = resolveDawn(night);
  assert(find(dawn, "c").alive, "cursed survives");
  assert(find(dawn, "c").roleId === "werewolf", "cursed turns wolf");

  // resolveDawn: Diseased skip — wolves are sick, kill is skipped.
  night = {
    ...base([
      { ...mkPlayer("w", "werewolf"), effects: [{ type: "diseased", nightApplied: 1 }] },
      mkPlayer("v", "villager"),
    ]),
    nightQueue: queueWith([
      { playerId: WOLVES, roleId: "werewolf", prompt: "", outcome: { kind: "kill", targetIds: ["v"] } },
    ]),
  };
  dawn = resolveDawn(night);
  assert(find(dawn, "v").alive, "diseased wolves skip the kill");
  assert(!find(dawn, "w").effects.some((e) => e.type === "diseased"), "sickness clears");

  // resolveDawn: a `view` outcome (Seer etc.) is info-only — target untouched.
  night = {
    ...base([mkPlayer("s", "seer"), mkPlayer("v", "villager")]),
    nightQueue: queueWith([
      { playerId: "s", roleId: "seer", prompt: "", outcome: { kind: "view", targetIds: ["v"] } },
    ]),
  };
  dawn = resolveDawn(night);
  assert(find(dawn, "v").alive, "view target survives");
  assert(find(dawn, "v").effects.length === 0, "view adds no effects");

  // recordDayDeath + heartbreak cascade: lynching a Soulmate kills the partner.
  const linked = (id: string, partner: string): Player => ({
    id,
    name: id,
    roleId: "villager",
    alive: true,
    effects: [{ type: "lover-link", nightApplied: 1, source: partner }],
  });
  const day: GameState = {
    ...base([]),
    players: [linked("a", "b"), linked("b", "a")],
    phase: "day",
    nightNumber: 2,
  };
  const afterLynch = recordDayDeath(day, "a", "lynched");
  assert(!find(afterLynch, "a").alive, "lynched player dies");
  assert(!find(afterLynch, "b").alive, "soulmate dies of heartbreak");

  // advancePhase: night → day → night increments nightNumber + rebuilds queue.
  let flow = base([mkPlayer("w", "werewolf"), mkPlayer("v", "villager")], { nightNumber: 1 });
  flow = {
    ...flow,
    nightQueue: queueWith([
      { playerId: WOLVES, roleId: "werewolf", prompt: "", outcome: { kind: "kill", targetIds: ["v"] } },
    ]),
  };
  flow = advancePhase(flow); // dawn kills v → village loses? 1 wolf vs 0 villagers
  // 1 wolf alive, 0 villagers → werewolves win at parity → gameover.
  assert(flow.phase === "gameover" && flow.winner === "werewolf", "wolves win at parity");

  // Wolf Cub bonus: wolf-cub dies → wolves get 2 kills next night.
  let wolfCubGame = base([
    mkPlayer("w", "werewolf"),
    mkPlayer("c", "wolf-cub"),
    mkPlayer("v1", "villager"),
    mkPlayer("v2", "villager"),
    mkPlayer("v3", "villager"),
    mkPlayer("v4", "villager"),
  ], { nightNumber: 1 });
  wolfCubGame = {
    ...wolfCubGame,
    nightQueue: queueWith([
      { playerId: WOLVES, roleId: "werewolf", prompt: "", outcome: { kind: "kill", targetIds: ["v4"] } },
    ]),
  };
  wolfCubGame = resolveDawn(wolfCubGame);
  assert(find(wolfCubGame, "v4").alive === false, "v4 dies night 1");
  // Day kill the Wolf Cub.
  wolfCubGame = recordDayDeath(wolfCubGame, "c", "lynched");
  assert(find(wolfCubGame, "c").alive === false, "wolf-cub dies day 1");
  assert(hasEffect(find(wolfCubGame, "w"), "wolf-cub-bonus"), "wolf gets bonus effect");
  // Night 2: build queue should show "TWO victims" prompt.
  wolfCubGame = advancePhase(wolfCubGame);
  assert(wolfCubGame.phase === "night" && wolfCubGame.nightNumber === 2, "night 2 begins");
  const n2Queue = wolfCubGame.nightQueue!;
  const wolvesStep = n2Queue.steps.find((st) => st.playerId === WOLVES);
  assert(wolvesStep?.prompt?.includes("TWO victims") === true, "bonus prompt shows on night 2");
  // Wolves kill 2 targets.
  wolfCubGame = {
    ...wolfCubGame,
    nightQueue: {
      ...n2Queue,
      steps: n2Queue.steps.map((st) =>
        st.playerId === WOLVES
          ? { ...st, outcome: { kind: "kill", targetIds: ["v1", "v2"] } }
          : st,
      ),
    },
  };
  wolfCubGame = resolveDawn(wolfCubGame);
  assert(find(wolfCubGame, "v1").alive === false && find(wolfCubGame, "v2").alive === false, "both targets die");
  assert(!hasEffect(find(wolfCubGame, "w"), "wolf-cub-bonus"), "bonus cleared after use");

  console.log("[engine] selfCheck ok");
}

if (process.env.NODE_ENV !== "production") selfCheck();
