# Phase 3 — Engine (Implementation Record)

The game engine: a `useReducer` core that drives
`setup → night1(deal) → day1(skip) → night2 → dayN → gameover`, with a guided
reorderable night queue, a dawn resolver, an effect model, death/revive, manual
day-death recording, and snapshot-based undo/redo.

Scope reference: `MASTER_PLAN.md` §7 (P3). This phase is **pure logic + wiring**;
the moderator board UI is P4.

---

## Files

| File | Status | Purpose |
|---|---|---|
| `lib/game/types.ts` | edited | `NightOutcome`, `NightStep`, `NightQueue`; `nightQueue?` on `GameState`; `witch-heal-used` / `witch-kill-used` effects |
| `lib/game/effects.ts` | **new** | effect helpers on `Player.effects` |
| `lib/game/engine.ts` | **new** | dealing, night-queue builder, dawn resolver, day recording, phase advancement |
| `lib/game/reducer.ts` | **new** | `Action` union + `reducer`, snapshot discipline, undo/redo/rollback/hydrate |
| `lib/game/win-conditions.ts` | edited | TODO comment updated (heartbreak now resolved in engine) |
| `lib/hooks/use-game.tsx` | edited | `useState` → `useReducer`; exposes `dispatch` |
| `components/game/lobby.tsx` | edited | migrated to `dispatch`; Start → `startGame` (deals → night 1) |
| `components/game/role-picker.tsx` | edited | migrated to `dispatch` |
| `app/page.tsx` | edited | migrated to `dispatch` |
| `app/play/page.tsx` | edited | routes night/day/gameover; temporary **dev board** drives the flow end-to-end |

No new dependencies.

---

## Type model additions (`types.ts`)

```ts
// The in-progress night queue lives in GameState (not ephemeral component
// state) so a mid-night browser refresh survives autosave and undo reaches
// inside a night.
export interface GameState {
  // ...existing fields...
  nightQueue?: NightQueue; // present only during phase === "night"
}

export type NightOutcome =
  | { kind: "none" }
  | { kind: "kill"; targetIds: string[] }      // wolves, vampires, witch-kill, hunter
  | { kind: "protect"; targetIds: string[] }   // bodyguard, witch-heal
  | { kind: "convert"; targetIds: string[] }   // cult-leader
  | { kind: "link"; targetIds: [string, string] } // cupid soulmates
  | { kind: "note"; text: string };            // seer/sorcerer/aura info

export interface NightStep {
  playerId: string;   // real player id, or synthetic group id ("__wolves")
  roleId: RoleId;     // whose prompt this step shows
  prompt: string;
  outcome?: NightOutcome; // undefined until the moderator records it
}

export interface NightQueue {
  steps: NightStep[]; // ordered, freely reorderable
  cursor: number;
}
```

`EffectType` extended with once-per-game usage flags:
`"witch-heal-used" | "witch-kill-used"` — these live on the acting player and
mirror the existing effect-on-player pattern.

---

## Effects (`effects.ts`)

Pure, idempotent helpers around `Player.effects`:

- `hasEffect(p, type)`
- `addEffect(p, type, nightApplied, source?)` — no-op if already present
- `removeEffect(p, type)`
- `clearNightProtections(p)` — drops `protected` (Bodyguard "not same target two nights")
- `effectAt(p, type)` — returns the `Effect` or undefined

The `diseased` effect doubles as the "sickened wolves skip next kill" flag —
applied to wolf-team players when the Diseased is eaten, cleared after the skip.

---

## Engine (`engine.ts`)

### Grouping constants
```ts
const PACK_WOLF_IDS = ["werewolf", "wolf-cub", "lone-wolf"]; // share one victim
const VAMPIRE_IDS   = ["vampire"];
export const WOLVES = "__wolves";      // synthetic night-queue player id
export const VAMPIRES = "__vampires";
```
`ponytail:` other wolf roles (dream-wolf, white-wolf, dire-wolf, fruit-brute,
wolf-man, black-wolf, big-bad-wolf) and vampire-team roles (the-count,
bloody-mary, chupacabra) are stubs — add to these sets once their rules are
confirmed from the Deluxe rulebook.

### `dealRoles(state)`
Fisher–Yates shuffle of `rolePool` (Math.random — board-game shuffle, not a
secret), dealt to seats in order. Logs "Roles dealt — Night 1 begins."

### `buildNightQueue(state) → NightQueue`
1. Collect alive players whose role has a `nightAction`.
2. Group pack-wolf players into one `__wolves` step, vampires into `__vampires`.
3. Drop `firstNightOnly` steps when `nightNumber > 1`.
4. Skip `apprentice-seer` while the Seer is alive; `drunk` except on night 3.
5. Sort by each role's `defaultOrder`.

### `resolveDawn(state) → GameState`
Consumes `nightQueue.steps[].outcome` in `MASTER_PLAN.md` §5.2 priority:

1. **Protection** — union all `protect` targetIds.
2. **Diseased skip** — if any wolf-team player has `diseased`, drop all wolf
   kills this night and clear the effect.
3. **Kills → deaths**, per target (first source wins):
   - wolves cannot kill vampires (`vampire` is immune to wolf kills);
   - a protected target survives;
   - the **Cursed** targeted by wolves joins the wolves (`roleId → "werewolf"`)
     instead of dying;
   - otherwise the target dies (`diedAt = { night, cause }`).
4. **Conversions** — Cult Leader converts add the `cult` effect (role unchanged).
5. **Links** — Cupid adds `lover-link` to both, `effect.source = partner id`.
6. **Heartbreak cascade** — loop: any dead Soulmate whose partner is alive kills
   the partner (cause `"heartbreak"`), until stable.
7. **Diseased trigger** — if a Diseased player died to wolves this night, sicken
   all wolf-team players (skips next night's kill).
8. **Hunter reminder** — logs that a Hunter died (mod takes the reprisal via
   override; not auto-resolved).
9. **Win check** — `checkWinner`; if a team wins, `phase → "gameover"`, else
   `phase → "day"`. Clear `nightQueue`.

### `recordDayDeath(state, targetId, cause) → GameState`
Records a lynch result (vote is manual/out-loud): applies the death, runs the
heartbreak cascade, surfaces a Hunter reminder, then `checkWinner`.

### `advancePhase(state) → GameState`
- `night` → `resolveDawn` → `day` (or `gameover` on a win).
- `day` → `nightNumber + 1`, rebuild night queue. Day 1 is discussion-only
  (no vote) — just no `recordDayDeath` calls before advancing.

`applyDeaths` is the shared death + heartbreak helper used by both dawn and day.

---

## Reducer (`reducer.ts`)

### Action union
```
setup      addPlayer · renamePlayer · removePlayer · movePlayer
           addRole · removeRole · resetSetup
engine     startGame · setNightOutcome · reorderNightStep
           advancePhase · recordDayDeath
override   killPlayer · revivePlayer · setRole · addEffect · removeEffect
history    undo · redo · rollback · hydrate
```

Setup cases delegate **verbatim** to `setup.ts` (`addPlayer`, `movePlayer`, …);
`killPlayer` reuses `recordDayDeath` (it is an override-named day death +
cascade + win-check).

### Snapshot discipline
State is treated immutably everywhere, so the pre-action **reference** is stored
directly in `past` (no deep clone needed). Every mutating action calls:
```ts
const commit = (pre, post, label) => ({ ...post,
  past: [...pre.past, { label, state: pre, at: Date.now() }], future: [] });
```
No-op transitions (e.g. blank `addPlayer`) return the same reference and do not
snapshot. `undo`/`redo` swap between `past` and `future`; `rollback` jumps to a
past index and drops the redo branch; `hydrate` (localStorage restore on mount)
sets state without snapshotting.

---

## Hook (`use-game.tsx`)
`useReducer(reducer, undefined, createInitialState)`. Kept the two `useEffect`s:
hydrate from `loadGame()` on mount (avoids SSR mismatch), autosave on every
change. Context exposes `{ state, dispatch }` (the old `setState` is gone).

---

## Wiring
- **Lobby Start** → `dispatch({ type: "startGame" })` (deals + night 1). The old
  `started` confirmation shim was removed.
- **Landing "New Game"** → `dispatch({ type: "resetSetup" })`.
- **`play/page.tsx`** routes by phase. A temporary **dev board** (marked
  `ponytail:`, replaced by P4) makes the engine drivable end-to-end:
  - *night*: lists queue steps; per-step target selector(s) record outcomes
    (kind derived from `roleId`); "Resolve dawn" advances.
  - *day*: eliminate buttons + "Begin next night".
  - *gameover*: winner label + New game.

---

## Verification
- `npm run typecheck` — clean (`tsc --noEmit`, strict).
- `npm run build` — green; all three routes static-prerender.
- Each new module carries a `selfCheck()` (`assert` + `console.log`, gated on
  `NODE_ENV !== "production"`). All five pass:
  `[setup] [effects] [win-conditions] [engine] [reducer] selfCheck ok`

SelfCheck coverage: deal preserves the pool; queue drops firstNightOnly after N1
and groups wolves; protection cancels a wolf kill; Cursed turns instead of
dying; Diseased wolves skip + clear; heartbreak cascade on lynch; wolves win at
parity; `startGame` deals + builds a queue; full
`startGame → setNightOutcome → advancePhase → gameover` round-trip; undo/redo
invert; `commit` clears `future`.

---

## Deferred (tagged `ponytail:`)
- **Hunter reprisal / Tough-guy delayed death** — surfaced as a log reminder;
  moderator uses `killPlayer` override until auto-resolution is added.
- **Other wolf/vampire roles** joining the pack — stubs pending Deluxe rulebook.
- **Cupid pair-win override, Lone Wolf "last wolf", Hoodlum marks** —
  role-specific win conditions; `win-conditions.ts` documents the gap.
  Heartbreak (the common case) is already resolved in the engine.
- **Undo/redo/timeline UI** — the snapshot mechanism is in place; the drawer is
  P5. **Moderator board / night wizard / status bar / override panel** — P4.
  **Winner screen** — P6.
