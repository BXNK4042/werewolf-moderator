import type { GameState, LogEntry, RoleId, Team } from "./types";
import { checkWinner } from "./win-conditions";

export interface FinishedGame {
  id: string;
  endedAt: number;
  nights: number;
  winner?: Team;
  sideWins: RoleId[];
  players: { name: string; roleId: RoleId | null; alive: boolean }[];
  log: LogEntry[];
}

const KEY = "werewolf-mod:history";
const MAX = 50;

// Pure: derive the archive record from a game state (no localStorage).
export function buildFinishedGame(state: GameState): FinishedGame {
  const { winner, sideWins } = checkWinner(state);
  return {
    id: crypto.randomUUID(),
    endedAt: Date.now(),
    nights: state.nightNumber,
    winner,
    sideWins,
    players: state.players.map((p) => ({
      name: p.name,
      roleId: p.roleId,
      alive: p.alive,
    })),
    log: state.log,
  };
}

// Signature used to dedup: the same final roster + winner + length is the same
// game. Guards against a refresh mid-gameover re-archiving (the ref in the hook
// is the primary guard; this is belt-and-suspenders).
const sig = (r: FinishedGame) =>
  `${r.winner ?? "none"}:${r.nights}:${r.players.map((p) => p.roleId).join(",")}`;

export function loadHistory(): FinishedGame[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FinishedGame[]) : [];
  } catch {
    return [];
  }
}

export function archiveGame(state: GameState): void {
  if (typeof window === "undefined") return;
  try {
    const record = buildFinishedGame(state);
    const prev = loadHistory();
    if (prev.length && sig(prev[0]) === sig(record)) return;
    const next = [record, ...prev].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ponytail: best-effort — private mode / quota just means no archive.
  }
}

// --- selfCheck -------------------------------------------------------------

function selfCheck() {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error("history selfCheck failed: " + msg);
  };
  const mk = (
    rs: Array<[string, RoleId, boolean]>,
  ): GameState => ({
    players: rs.map(([id, roleId, alive]) => ({
      id,
      name: id,
      roleId,
      alive,
      effects: [],
    })),
    rolePool: [],
    phase: "gameover",
    nightNumber: 3,
    log: [
      { night: 3, phase: "night", text: "Roles dealt — Night 1 begins.", at: 1 },
    ],
    past: [],
    future: [],
    winner: "werewolf",
  });

  // wolves at parity → werewolf winner; roster + nights carried through.
  const rec = buildFinishedGame(
    mk([
      ["a", "villager", false],
      ["b", "werewolf", true],
    ]),
  );
  assert(rec.winner === "werewolf", "builds winner from final state");
  assert(rec.nights === 3, "carries night count");
  assert(rec.players.length === 2, "maps full roster");
  assert(rec.players[0].roleId === "villager", "roster keeps roleIds");
  assert(rec.log.length === 1, "carries the event log");

  // tanner dead → sideWins carries it alongside the team winner.
  const tanner = buildFinishedGame(
    mk([
      ["a", "villager", false],
      ["b", "werewolf", true],
      ["c", "tanner", false],
    ]),
  );
  assert(tanner.sideWins.includes("tanner"), "sideWins includes tanner");

  // dedup signature: identical roster+winner+nights → same sig.
  const a = buildFinishedGame(mk([["a", "werewolf", true]]));
  const b = buildFinishedGame(mk([["a", "werewolf", true]]));
  assert(sig(a) === sig(b), "same game produces same dedup signature");
  const c = buildFinishedGame(mk([["a", "villager", true]]));
  assert(sig(a) !== sig(c), "different roster differs in signature");

  console.log("[history] selfCheck ok");
}

if (process.env.NODE_ENV !== "production") selfCheck();
