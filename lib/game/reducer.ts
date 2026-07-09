import type { EffectType, GameState, NightOutcome, RoleId } from "./types";
import {
  addPlayer,
  addRole,
  createInitialState,
  movePlayer,
  removePlayer,
  removeRole,
  renamePlayer,
} from "./setup";
import {
  addEffect as addEffectP,
  removeEffect as removeEffectP,
} from "./effects";
import {
  advancePhase,
  buildNightQueue,
  dealRoles,
  recordDayDeath,
} from "./engine";

export type Action =
  // --- setup (wrap setup.ts verbatim) ---
  | { type: "addPlayer"; name: string }
  | { type: "renamePlayer"; id: string; name: string }
  | { type: "removePlayer"; id: string }
  | { type: "movePlayer"; id: string; dir: -1 | 1 }
  | { type: "addRole"; roleId: RoleId }
  | { type: "removeRole"; roleId: RoleId }
  | { type: "resetSetup" }
  // --- engine ---
  | { type: "startGame" }
  | { type: "setNightOutcome"; stepIndex: number; outcome: NightOutcome }
  | { type: "reorderNightStep"; from: number; to: number }
  | { type: "advancePhase" }
  | { type: "recordDayDeath"; targetId: string; cause: string }
  // --- override (moderator overrides everything) ---
  | { type: "killPlayer"; targetId: string; cause: string }
  | { type: "revivePlayer"; targetId: string }
  | { type: "setRole"; targetId: string; roleId: RoleId }
  | { type: "addEffect"; targetId: string; effect: EffectType; source?: string }
  | { type: "removeEffect"; targetId: string; effect: EffectType }
  // --- undo / redo / rollback (UI lands in P5) ---
  | { type: "undo" }
  | { type: "redo" }
  | { type: "rollback"; to: number }
  // --- hydrate from localStorage on mount (no snapshot) ---
  | { type: "hydrate"; state: GameState };

// State is treated immutably everywhere, so storing the pre-state reference in
// `past` is safe — nothing mutates it after the fact.
const commit = (pre: GameState, post: GameState, label: string): GameState => ({
  ...post,
  past: [...pre.past, { label, state: pre, at: Date.now() }],
  future: [],
});

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    // setup
    case "addPlayer": {
      const next = addPlayer(state, action.name);
      return next === state ? state : commit(state, next, "Add player");
    }
    case "renamePlayer":
      return commit(state, renamePlayer(state, action.id, action.name), "Rename player");
    case "removePlayer":
      return commit(state, removePlayer(state, action.id), "Remove player");
    case "movePlayer":
      return commit(state, movePlayer(state, action.id, action.dir), "Reorder player");
    case "addRole":
      return commit(state, addRole(state, action.roleId), "Add role");
    case "removeRole":
      return commit(state, removeRole(state, action.roleId), "Remove role");
    case "resetSetup":
      return commit(state, createInitialState(), "Reset setup");

    // engine
    case "startGame": {
      if (state.phase !== "setup") return state;
      const dealt = dealRoles(state);
      const nightQueue = buildNightQueue({
        ...dealt,
        phase: "night",
        nightNumber: 1,
      });
      return commit(
        state,
        { ...dealt, phase: "night", nightNumber: 1, nightQueue },
        "Start of game",
      );
    }
    case "setNightOutcome": {
      const q = state.nightQueue;
      if (!q) return state;
      const steps = q.steps.map((st, i) =>
        i === action.stepIndex ? { ...st, outcome: action.outcome } : st,
      );
      return commit(state, { ...state, nightQueue: { ...q, steps } }, "Record night action");
    }
    case "reorderNightStep": {
      const q = state.nightQueue;
      if (!q || action.from === action.to) return state;
      const steps = [...q.steps];
      const [moved] = steps.splice(action.from, 1);
      steps.splice(action.to, 0, moved);
      return commit(state, { ...state, nightQueue: { ...q, steps } }, "Reorder night step");
    }
    case "advancePhase": {
      const next = advancePhase(state);
      return next === state ? state : commit(state, next, "Advance phase");
    }
    case "recordDayDeath":
      return commit(state, recordDayDeath(state, action.targetId, action.cause), "Day death");

    // override
    case "killPlayer":
      return commit(
        state,
        recordDayDeath(state, action.targetId, action.cause),
        `Override: kill`,
      );
    case "revivePlayer":
      return commit(
        state,
        {
          ...state,
          players: state.players.map((p) =>
            p.id === action.targetId ? { ...p, alive: true, diedAt: undefined } : p,
          ),
        },
        "Override: revive",
      );
    case "setRole":
      return commit(
        state,
        {
          ...state,
          players: state.players.map((p) =>
            p.id === action.targetId ? { ...p, roleId: action.roleId } : p,
          ),
        },
        "Override: change role",
      );
    case "addEffect":
      return commit(
        state,
        {
          ...state,
          players: state.players.map((p) =>
            p.id === action.targetId
              ? addEffectP(p, action.effect, state.nightNumber, action.source)
              : p,
          ),
        },
        "Override: add effect",
      );
    case "removeEffect":
      return commit(
        state,
        {
          ...state,
          players: state.players.map((p) =>
            p.id === action.targetId ? removeEffectP(p, action.effect) : p,
          ),
        },
        "Override: remove effect",
      );

    // undo / redo / rollback
    case "undo": {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      return {
        ...prev.state,
        past: state.past.slice(0, -1),
        future: [
          { label: "current", state, at: Date.now() },
          ...state.future,
        ],
      };
    }
    case "redo": {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        ...next.state,
        past: [...state.past, { label: next.label, state, at: Date.now() }],
        future: state.future.slice(1),
      };
    }
    case "rollback": {
      const target = state.past[action.to];
      if (!target) return state;
      return {
        ...target.state,
        past: state.past.slice(0, action.to + 1),
        future: [], // ponytail: drop redo branch on rollback; revisit if rollback-with-redo is wanted
      };
    }
    case "hydrate":
      return action.state;
    default:
      return state;
  }
}

function selfCheck() {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error("reducer selfCheck failed: " + msg);
  };
  let s = createInitialState();
  s = reducer(s, { type: "addPlayer", name: "Ava" });
  s = reducer(s, { type: "addPlayer", name: "Bo" });
  assert(s.players.length === 2, "addPlayer via reducer");
  assert(s.past.length === 2, "each mutation snapshots");

  s = reducer(s, { type: "undo" });
  assert(s.players.length === 1, "undo reverts addPlayer");
  s = reducer(s, { type: "redo" });
  assert(s.players.length === 2, "redo re-applies");

  // startGame deals roles and builds a night queue.
  let game = createInitialState();
  game = reducer(game, { type: "addPlayer", name: "A" });
  game = reducer(game, { type: "addPlayer", name: "B" });
  game = reducer(game, { type: "addRole", roleId: "werewolf" });
  game = reducer(game, { type: "addRole", roleId: "villager" });
  game = reducer(game, { type: "startGame" });
  assert(game.phase === "night" && game.nightNumber === 1, "startGame → night 1");
  assert(game.players.every((p) => p.roleId !== null), "startGame deals roles");
  assert((game.nightQueue?.steps.length ?? 0) > 0, "night queue built");
  assert(game.future.length === 0, "commit clears future");

  // record the wolves' victim + advance → dawn kills it.
  const wolvesStep = game.nightQueue!.steps.findIndex(
    (st) => st.playerId === "__wolves",
  );
  const villager = game.players.find((p) => p.roleId === "villager")!;
  game = reducer(game, {
    type: "setNightOutcome",
    stepIndex: wolvesStep,
    outcome: { kind: "kill", targetIds: [villager.id] },
  });
  game = reducer(game, { type: "advancePhase" });
  // 1 wolf vs 0 villagers → werewolves win.
  assert(game.phase === "gameover" && game.winner === "werewolf", "full flow reaches gameover");

  console.log("[reducer] selfCheck ok");
}

if (process.env.NODE_ENV !== "production") selfCheck();
