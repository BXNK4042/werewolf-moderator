# Phase 2 — Setup Flow (Implementation Record)

Status: **shipped** (commit `a496b9e`). Independently shippable per MASTER_PLAN §7.

P2 delivers everything needed to configure a game: add/rename/reorder/remove
players, pick role counts from the 45-role pool, validate the setup, and
autosave to `localStorage` so a refresh never loses work. The actual game
start (dealing roles, entering Night 1) is P3.

---

## Scope decisions (confirmed before build)

| Fork | Decision | Why |
|---|---|---|
| State mechanism | Keep `useState` + **pure transition functions**; defer the reducer to P3 | The existing `use-game.tsx` ponytail comment already planned this. The pure functions become the P3 reducer's body verbatim — zero throwaway code, smallest diff now. |
| "Start Game" boundary | Stop at **validated + persisted** setup | P3 owns `setup→night1(deal)` (§7). P2's Start validates, persists, and confirms; P3 wires the real deal behind the same button. |
| Validation strictness | **Warn, don't block** | "Moderator overrides everything" (AGENTS.md). The only hard block is `players ≠ roles` — you can't physically deal M cards to N seats. Everything else (no wolves, no seer, dup names, <5 players) is a non-blocking warning. |
| Role picker UX | Grouped steppers only | 46 roles grouped by team with `− count +` rows. Scenario presets deferred (the manual's scenario chart is too variable to be a clean rule). |

---

## Files

### `lib/game/setup.ts` — NEW (pure logic, the heart of P2)
No React. Pure `(state, ...args) => GameState` transitions + validation + a
self-check. This is the module a future reducer wraps directly.

**Transitions:**
- `createInitialState()` / `resetSetup` — fresh empty setup state (centralized; `use-game.tsx` and the landing both use it).
- `addPlayer(state, name)` — ignores blank names; assigns `crypto.randomUUID()` (stdlib, no nanoid).
- `renamePlayer(state, id, name)`
- `removePlayer(state, id)`
- `movePlayer(state, id, -1 | 1)` — array swap; no-op at bounds. Up/down buttons (drag-and-drop is heavier and worse on mobile).
- `addRole(state, roleId)` / `removeRole(state, roleId)` — `rolePool` is a multiset (`RoleId[]`); remove splices the last occurrence.
- `countRole(state, roleId)` — occurrences in the pool (drives the steppers).

**Validation** (`validateSetup(state) → { errors, warnings }`):
Grounded in `docs/ultimate_werewolf_manual.txt`:

| Severity | Condition | Source |
|---|---|---|
| error | `players.length === 0` | — |
| error | `players.length !== rolePool.length` | can't deal M cards to N seats |
| warning | no Werewolf-team role in pool | manual l.17, l.195 |
| warning | no Seer in pool | l.17 (but l.105 "Village with No Seer" is official → warn only) |
| warning | fewer than 5 players | smallest official scenario is 5p (l.85) |
| warning | duplicate player names | — |

A wolf-count **range heuristic was deliberately dropped**: the scenario chart
(l.85-117) is too variable (10p→1 wolf, 9p→2 wolves) to flag without
false-positiving on real setups. Instead the lobby shows static guidance
("~1 wolf per 4–5 players") in the footer. Tagged `ponytail:` in the source.

**Self-check:** `if (NODE_ENV !== 'production')` block asserting the
transitions and validation behave correctly. Mirrors the pattern in
`win-conditions.ts:49`. Verified passing.

### `lib/game/storage.ts` — NEW
```ts
loadGame(): GameState | null
saveGame(state: GameState): void
clearGame(): void
```
- One `localStorage` key (`werewolf-mod:active-game`); JSON-serialized state.
- All three guard `typeof window === "undefined"` (SSR-safe — client components still SSR their initial HTML).
- Best-effort: quota/private-mode failures are swallowed (autosave just stops; tagged `ponytail:`).
- **Finished-game history is P6** — not built here, but this is its future home (§8 lists one storage module).

### `lib/hooks/use-game.tsx` — EDITED
Kept `useState<GameState>` (reducer is P3). Added:
- **Hydrate on mount:** a `useEffect(() => { const s = loadGame(); if (s) setState(s) }, [])`. Done in an effect, *not* the `useState` initializer, to avoid an SSR hydration mismatch (server and first client render agree on the empty initial state; the saved state replaces it after mount — a brief, acceptable flash for a local tool).
- **Autosave:** `useEffect(() => saveGame(state), [state])` — fires on every change.
- Exposes `{ state, setState }` unchanged. Components import pure helpers from `setup.ts` directly (no new hook surface — YAGNI).

`initialState` was removed in favor of `createInitialState()` from `setup.ts`.

### `components/game/role-picker.tsx` — NEW (`'use client'`)
- Groups the 46 roles by `team` (village / werewolf / vampire / cult / neutral) via `ROLE_LIST` from `roles.ts`.
- Each team is a native `<details open>` accordion — free toggle, keyboard, and a11y; no JS lib. Village + Werewolves default open; the `open` prop is a *constant per group* so React never fights a user's manual toggle on re-render.
- Each role row: team-color dot (plain `<span>`, no new dep), name, `− count +` stepper. Full description is available via the `title` attribute.
- Reads/writes through `useGame()` + `countRole`/`addRole`/`removeRole`.

### `components/game/lobby.tsx` — NEW (`'use client'`)
The setup-phase screen:
1. **Players** — rows with an inline-rename `<Input>`, ▲/▼ move, ✕ remove, and an add-player field (Enter or `+`).
2. **Roles** — embeds `<RolePicker />`.
3. **Fixed footer** — `roles / players` count (red when mismatched), the live error + warning lists, the wolf-ratio tip, and a **Start** button disabled iff `errors.length > 0`.
- On valid Start → a "Setup complete" confirmation card (local `started` state). P3 replaces this with the real deal. A refresh returns to the editable lobby (data intact via autosave) — intentional, lets the mod double-check.

### `app/play/page.tsx` — NEW (`'use client'`)
Phase-driven single route (matches §8: only `/` and `/play`). Renders `<Lobby />`
when `state.phase === 'setup'`; otherwise a P4 placeholder. P4 swaps the
placeholder for the moderator board.

### `app/page.tsx` — EDITED (`'use client'` now)
Became a client component (needs `localStorage` to gate Continue; consistent
with "effectively a client-side SPA," §3). No `metadata` is lost — it lives in
`layout.tsx` (Server Component) where it belongs.
- **New Game:** `setState(resetSetup())` → `router.push('/play')`.
- **Continue:** gated on `loadGame() !== null` (checked in a mount effect to stay SSR-safe) → routes to `/play`.
- `GameProvider` lives in the root layout, so it persists across `/` ↔ `/play` navigation and hydrates from storage exactly once per full page load.

### shadcn primitives added
`npx shadcn add input badge` — both needed by the lobby (player fields, count/team tags). They use the project's `@base-ui/react` + base-nova style.

---

## How state moves (the data flow)

```
component event handler
   │  setState(s => addPlayer(s, name))      ← pure transition from setup.ts
   ▼
useReducer-free useState in GameProvider      ← single source of truth
   │  useEffect([state]) → saveGame(state)   ← autosave
   ▼
all consumers re-render via useGame()         ← lobby, role-picker, footer counts
```

Because every mutation routes through one pure module (`setup.ts`) and one
state holder (`GameProvider`), P3's upgrade path is mechanical:

```ts
// P3: the reducer IS the setup transitions + new engine actions
function reducer(state, action) {
  switch (action.type) {
    case 'ADD_PLAYER': return addPlayer(state, action.name);
    case 'ADD_ROLE':   return addRole(state, action.roleId);
    // ... + deal / night / dawn actions
  }
}
```

No component changes required — only the provider swaps `useState` → `useReducer`.

---

## What P2 does NOT do (→ later phases)

- **Reducer + undo/redo snapshots** — P3/P5. `setup.ts` transitions are its foundation.
- **Role deal + `setup→night1`** — P3. Behind the existing Start button.
- **Drag-to-reorder players** — up/down buttons cover it on mobile.
- **Scenario presets** — the manual's chart is too variable to encode as clean rules; deferred.
- **Finished-game history UI** — P6 (the storage module is its home).
- **Moderator board** (status bar, player grid, night wizard) — P4.

---

## Verification

Run before declaring P2 work done (AGENTS.md):
- `npm run typecheck` — `tsc --noEmit` ✓
- `npm run build` — production build; `/play` prerenders statically ✓
- Self-checks (`setup`, `win-conditions`) — pass on import in dev ✓
- Manual: add/remove/reorder players; adjust role counts until counts match → Start enables; refresh mid-setup → state restored; mismatched counts → Start blocked.

---

## Notes / known limitations

- **~20 stubbed roles** (`roles.ts`, tagged `ponytail:`) — teams are assigned, so they group correctly in the picker; powers are unverified but irrelevant to setup/validation. No P2 blocker.
- **SSR hydration** — hydrate-from-storage happens in a mount effect (not the initializer) to avoid mismatch warnings.
- **No throwaway code** — `setup.ts` transitions + `validateSetup` become the P3 reducer's body verbatim.
