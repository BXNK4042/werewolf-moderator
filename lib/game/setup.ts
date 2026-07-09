import type { GameState, Player, RoleId } from "./types";
import { ROLES } from "./roles";

export function createInitialState(): GameState {
  return {
    players: [],
    rolePool: [],
    phase: "setup",
    nightNumber: 0,
    log: [],
    past: [],
    future: [],
  };
}

export const resetSetup = createInitialState;

const blankPlayer = (name: string): Player => ({
  id: crypto.randomUUID(),
  name: name.trim(),
  roleId: null,
  alive: true,
  effects: [],
});

export function addPlayer(state: GameState, name: string): GameState {
  const trimmed = name.trim();
  if (!trimmed) return state;
  return { ...state, players: [...state.players, blankPlayer(trimmed)] };
}

export function renamePlayer(
  state: GameState,
  id: string,
  name: string,
): GameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === id ? { ...p, name: name.trim() } : p,
    ),
  };
}

export function removePlayer(state: GameState, id: string): GameState {
  return { ...state, players: state.players.filter((p) => p.id !== id) };
}

export function movePlayer(
  state: GameState,
  id: string,
  dir: -1 | 1,
): GameState {
  const i = state.players.findIndex((p) => p.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= state.players.length) return state;
  const players = [...state.players];
  [players[i], players[j]] = [players[j], players[i]];
  return { ...state, players };
}

export function addRole(state: GameState, roleId: RoleId): GameState {
  return { ...state, rolePool: [...state.rolePool, roleId] };
}

export function removeRole(state: GameState, roleId: RoleId): GameState {
  const i = state.rolePool.lastIndexOf(roleId);
  if (i < 0) return state;
  const rolePool = [...state.rolePool];
  rolePool.splice(i, 1);
  return { ...state, rolePool };
}

export function countRole(state: GameState, roleId: RoleId): number {
  return state.rolePool.filter((r) => r === roleId).length;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

// ponytail: warn-only (mod overrides everything). The only hard block is
// players !== roles — you can't physically deal M cards to N seats. Wolf-count
// "range" heuristics were dropped: the official scenario chart (manual
// l.85-117) is too variable (10p→1 wolf, 9p→2 wolves) to flag without
// false-positiving on real setups; shown as static guidance in the lobby.
export function validateSetup(state: GameState): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { players, rolePool } = state;
  const n = players.length;

  if (n === 0) errors.push("Add at least one player.");
  if (n !== rolePool.length)
    errors.push(`Players (${n}) must equal roles (${rolePool.length}).`);

  const wolves = rolePool.filter((id) => ROLES[id]?.team === "werewolf").length;
  if (wolves === 0)
    warnings.push("No Werewolf-team role — the village wins at dawn. (l.17)");
  if (!rolePool.includes("seer"))
    warnings.push("No Seer in the pool. (l.17; Seer-less variant at l.105)");
  if (n > 0 && n < 5)
    warnings.push("Fewer than 5 players — below the smallest official scenario.");

  const names = players.map((p) => p.name.trim().toLowerCase());
  if (new Set(names).size !== names.length)
    warnings.push("Duplicate player names.");

  return { errors, warnings };
}

function selfCheck() {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error("setup selfCheck failed: " + msg);
  };
  const mk = (overrides?: Partial<GameState>): GameState => ({
    ...createInitialState(),
    ...overrides,
  });
  const ids = (): RoleId[] => ["werewolf", "seer", "villager", "villager"];

  let s = createInitialState();
  s = addPlayer(s, "Ava");
  s = addPlayer(s, "Bo ");
  assert(s.players.length === 2 && s.players[1].name === "Bo", "addPlayer");
  s = addPlayer(s, "   ");
  assert(s.players.length === 2, "blank name ignored");

  s = renamePlayer(s, s.players[0].id, "Avalon");
  assert(s.players[0].name === "Avalon", "renamePlayer");

  s = movePlayer(s, s.players[1].id, -1);
  assert(s.players[0].name === "Bo", "movePlayer up");
  s = movePlayer(s, s.players[0].id, -1); // out of bounds, no-op
  assert(s.players[0].name === "Bo", "movePlayer bounds");

  s = removePlayer(s, s.players[0].id);
  assert(s.players.length === 1, "removePlayer");

  for (const id of ids()) s = addRole(s, id);
  assert(countRole(s, "villager") === 2, "countRole");
  s = removeRole(s, "villager");
  assert(countRole(s, "villager") === 1, "removeRole removes one");

  assert(
    validateSetup(mk({ players: [], rolePool: [] })).errors.length > 0,
    "empty players errors",
  );
  assert(
    validateSetup(
      mk({ players: [{ id: "a", name: "A", roleId: null, alive: true, effects: [] }] }),
    ).errors.some((e) => e.includes("must equal")),
    "count mismatch errors",
  );
  const hasNoSeerWarning = (s: GameState) =>
    validateSetup(s).warnings.some((w) => w.includes("No Seer"));
  assert(
    !hasNoSeerWarning(mk({ rolePool: ["villager", "seer", "werewolf"] })),
    "seer present → no no-seer warning",
  );
  assert(
    hasNoSeerWarning(mk({ rolePool: ["villager", "werewolf"] })),
    "no seer → no-seer warning",
  );

  console.log("[setup] selfCheck ok");
}

if (process.env.NODE_ENV !== "production") selfCheck();
