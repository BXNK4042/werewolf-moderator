import type { GameState, Player, RoleId, Team } from "./types";
import { ROLES } from "./roles";

export interface WinResult {
  winner?: Team;
  sideWins: RoleId[];
}

const teamOf = (p: Player): Team | undefined =>
  p.roleId ? ROLES[p.roleId]?.team : undefined;

const isCult = (p: Player): boolean =>
  p.roleId === "cult-leader" || p.effects.some((e) => e.type === "cult");

export function checkWinner(state: GameState): WinResult {
  const alive = state.players.filter((p) => p.alive);
  const sideWins: RoleId[] = [];

  // Tanner wins upon death; the game continues (manual l.183).
  if (state.players.some((p) => p.roleId === "tanner" && !p.alive)) {
    sideWins.push("tanner");
  }

  if (alive.length === 0) return { sideWins };

  const wolves = alive.filter((p) => teamOf(p) === "werewolf").length;
  const vamps = alive.filter((p) => teamOf(p) === "vampire").length;

  // Cult: wins if every surviving player is in the cult (manual l.139).
  if (alive.every(isCult)) return { winner: "cult", sideWins };

  // ponytail: 3-team rule — a predator must clear the rival predator to win
  // (manual l.189). 2-team parity is the common case.
  if (wolves > 0 && vamps === 0 && wolves >= alive.length - wolves) {
    return { winner: "werewolf", sideWins };
  }
  if (vamps > 0 && wolves === 0 && vamps >= alive.length - vamps) {
    return { winner: "vampire", sideWins };
  }
  if (wolves === 0 && vamps === 0) {
    return { winner: "village", sideWins };
  }
  // ponytail: not yet decidable — Lone Wolf override (l.157), Hoodlum marks
  // (l.153), and the Cupid soulmate pair-win (l.141 — Soulmates on different
  // teams win as the last two, overriding other conditions) need first-night
  // target / lover-link-pair data. The heartbreak cascade (one Soulmate dies
  // → the other dies) is handled in engine.ts applyDeaths before this runs, so
  // team composition here already reflects it. Revisit pair-win + Lone Wolf +
  // Hoodlum once those roles' rules are confirmed from the Deluxe rulebook.
  return { sideWins };
}

function selfCheck() {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error("win-conditions selfCheck failed: " + msg);
  };
  const mk = (
    rs: Array<[string, RoleId, boolean]>,
    state?: Partial<GameState>,
  ): GameState => ({
    players: rs.map(([id, roleId, alive]) => ({
      id,
      name: id,
      roleId,
      alive,
      effects: [],
    })),
    rolePool: [],
    phase: "day",
    nightNumber: 2,
    log: [],
    past: [],
    future: [],
    ...state,
  });

  assert(
    checkWinner(
      mk([
        ["a", "villager", true],
        ["b", "seer", true],
        ["c", "werewolf", false],
      ]),
    ).winner === "village",
    "village wins when wolves are dead",
  );

  assert(
    checkWinner(
      mk([
        ["a", "villager", true],
        ["b", "werewolf", true],
        ["c", "werewolf", true],
      ]),
    ).winner === "werewolf",
    "werewolves win at parity (no vampires)",
  );

  assert(
    checkWinner(
      mk([
        ["a", "villager", true],
        ["b", "werewolf", true],
        ["c", "vampire", true],
      ]),
    ).winner === undefined,
    "no winner while rival predators are both alive",
  );

  const cultGrowing = mk([
    ["a", "cult-leader", true],
    ["b", "villager", true],
  ]);
  assert(
    checkWinner(cultGrowing).winner !== "cult",
    "cult has not won while a non-cult survives",
  );
  cultGrowing.players[1].effects.push({ type: "cult", nightApplied: 1 });
  assert(
    checkWinner(cultGrowing).winner === "cult",
    "cult wins once every survivor is in the cult",
  );

  const tannerCase = checkWinner(
    mk([
      ["a", "villager", true],
      ["b", "werewolf", true],
      ["c", "tanner", false],
    ]),
  );
  assert(tannerCase.sideWins.includes("tanner"), "tanner side-wins on death");
  assert(
    tannerCase.winner === "werewolf",
    "tanner side-win does not block the team win",
  );

  console.log("[win-conditions] selfCheck ok");
}

if (process.env.NODE_ENV !== "production") selfCheck();
