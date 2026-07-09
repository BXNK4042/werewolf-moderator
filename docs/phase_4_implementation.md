# Phase 4 — Moderator Board (Implementation Record)

The moderator board: the always-on status bar, the player grid, the focused
night wizard, and the per-player override sheet. P4 is **pure UI** — it adds
no engine/reducer logic. Every interaction dispatches an existing P3 action.

Scope reference: `MASTER_PLAN.md` §7 (P4). This phase replaces the temporary
P3 dev board in `app/play/page.tsx`.

---

## Locked decisions (confirmed before build)

| Fork | Decision | Why |
|---|---|---|
| Night wizard style | **Focused step-at-a-time** | "Guided" — one prompt prominent, progress bar, Prev/Next, auto-advance to first unrecorded step. Best for preventing missed actions. |
| Override surface | **Per-player bottom sheet** | Tap a card → sheet scoped to that player with inspect + all overrides. Most direct on mobile; uses new shadcn `sheet`. |
| Role visibility | **Always visible** | Moderator's own single device; roles must be visible to run night actions. |
| New reducer actions | **None** | All needed actions exist in P3 (`setNightOutcome`, `reorderNightStep`, `advancePhase`, `recordDayDeath`, `killPlayer`, `revivePlayer`, `setRole`, `addEffect`, `removeEffect`). |
| Team-color dedupe | **Extract `lib/game/team-style.ts`** | 3 consumers now (role-picker, player-card, status-bar) — worth one tiny shared module over 3 copies. |

---

## Files

| File | Status | Purpose |
|---|---|---|
| `app/globals.css` | edited | Phase palette tokens `--night-tint` / `--day-tint` (`:root`) + `--color-night-tint` / `--color-day-tint` (`@theme inline`) — gives `bg-night-tint` / `bg-day-tint` utilities. Deferred from P0, now consumed by the status bar. |
| `lib/game/team-style.ts` | **new** | `TEAM_ORDER`, `TEAM_LABEL`, `TEAM_DOT` (shared by role-picker, player-card, status-bar) |
| `components/ui/sheet.tsx` | **new** | shadcn `sheet` (`npx shadcn add sheet`) — Base UI `Dialog`, bottom-sheet variant |
| `components/game/status-bar.tsx` | **new** | Sticky always-on status bar |
| `components/game/player-grid.tsx` | **new** | Responsive 2/3-col grid; owns the selected-player + sheet-open state |
| `components/game/player-card.tsx` | **new** | Single player: name, role+team dot, alive/dead, effect badges, tap→sheet; inline Eliminate in day mode |
| `components/game/night-wizard.tsx` | **new** | Focused reorderable night-queue wizard |
| `components/game/player-sheet.tsx` | **new** | Per-player bottom sheet: inspect + overrides |
| `components/game/role-picker.tsx` | edited | Imports team constants from `team-style.ts` instead of declaring them locally |
| `app/play/page.tsx` | edited | Stripped the P3 dev board; routes night/day/gameover to the new components; keeps the `<Lobby/>` branch |

New dependency: none beyond the `sheet` shadcn primitive (Base UI was already installed).

---

## Component detail

### `status-bar.tsx` — sticky, phase-tinted
Read-only (no dispatch). Horizontally-laid rows:
- **Phase** — Moon/Sun icon + "Night/Day N"; background tinted via `bg-night-tint/60` or `bg-day-tint/60`.
- **Counts** — pending night actions (night only); dead/total.
- **Win readout** — inline `winReadout(state)`: alive team counts as colored chips (`TEAM_DOT`), a Tanner "has won" note (via `checkWinner().sideWins`), and a proximity hint (`Werewolves at parity` / `1 from parity`, etc.) in destructive tone. ~15 lines derived from `state.players`; no new logic module.
- **Active effects** — counts of the effects that actually persist on players during play: `cult`, `diseased`, `lover-link`. (Others — `protected`, `cursed`, `amulet`, witch flags — are defined but not yet wired into the engine; `SURFACED_EFFECTS` is the single place to expand them. Tagged `ponytail:`.)

### `player-card.tsx`
- Root is a `<div role="button">` (NOT a `<button>`) so the inline day-mode Eliminate `<Button>` is valid HTML — nested buttons are illegal. Includes keyboard handler (Enter/Space, `preventDefault` on Space).
- Always-visible role name + team-color dot; dead → dimmed + strikethrough + `diedAt` caption; effect badges (only for the persisted set).
- Day mode: inline "Eliminate" (`recordDayDeath`, cause `"lynched"`) with `stopPropagation` so the card tap doesn't also fire.
- `EFFECT_BADGE` maps effect types to tint colors.

### `player-grid.tsx`
- `grid-cols-2 sm:grid-cols-3`.
- Owns `selected` (the tapped `Player`) + derives `live` from current state so the sheet reflects overrides instantly. One `<PlayerSheet>` serves the whole grid.

### `night-wizard.tsx` — the core surface
- **Current step** = the step at a local `view` index; initialized to 0 and clamped. Auto-advance: after a non-`none` outcome is recorded, `goToNextPending` jumps to the next unrecorded step (wrapping). The existing `NightQueue.cursor` field remains unused (ephemeral nav in component state is enough; outcomes persist via autosave). Tagged `ponytail:`.
- **Header** — "Step X of N" + pending count.
- **StepCard** — role/group label, prompt, a target picker shaped by `kindFor(roleId)`:
  - `kill`/`protect`/`convert`/`view` → single target select
  - `link` → two selects (Cupid / Hoodlum)
  - `note` → text input (Cursed/Minion/Ghost)
  - `witch` → **Heal/Kill mode toggle** + target (the witch can heal→`protect` or kill→`kill` within the single-outcome-per-step model)
  - Group steps (`__wolves`/`__vampires`, from `engine.ts` constants) render as "Werewolves"/"Vampires".
- **Record / Skip** buttons (Skip = `{kind:"none"}`).
- **Reorder** — ▲/▼ dispatch `reorderNightStep` and follow the moved step (`setView(to)`).
- **Prev/Next** — manual navigation.
- **All steps** — collapsible `<details>` list with per-step status badges; click to jump.

### `player-sheet.tsx` — bottom sheet
`<Sheet side="bottom">` controlled via `open`/`onOpenChange`. Scoped to one player (`key={player.id}` resets local state on switch). Sections:
- **Header** — name, role + team, alive/dead badge, full role description, died-cause.
- **Effects** — current effects as removable badges + an "add effect" `<select>` over `EffectType`.
- **Role** — `<select>` over all 46 roles grouped by team (`optgroup`) → `setRole`.
- **Override** — Kill (`killPlayer`) / Revive (`revivePlayer`) toggle by alive state + a "clear" button.
- `Body` re-reads the live player from state so each dispatch updates the sheet immediately.

### `app/play/page.tsx`
- `setup` → `<Lobby/>`.
- `night` → `<StatusBar/>` + `<NightWizard/>` + `<PlayerGrid/>` + bottom bar "Resolve dawn".
- `day` → `<StatusBar/>` + `<PlayerGrid dayMode={!day1}>` + bottom bar "Begin next night". Day 1 hides eliminate.
- `gameover` → unchanged minimal placeholder (winner screen is P6).
- Shared `<BottomBar>` for the fixed advance button.

---

## What P4 deliberately does NOT do (→ later phases)

- **Timeline drawer / undo UI** — P5. The snapshot/undo/redo machinery is already in the reducer; a status-bar Undo button is a trivial P5 add.
- **Winner screen** — P6 (placeholder stays).
- **Stats / Replay** — deferred milestone.
- **Witch double-action in one night** — the engine model is one outcome per step; the wizard's Heal/Kill toggle expresses one action, and the moderator uses the Kill override for the second if both are wanted in a night. Tagged `ponytail:`.
- **Hunter reprisal / Tough-guy auto-death** — still surfaced as log reminders; mod uses the override sheet (P3 deferral).

---

## Verification

- `npm run typecheck` — clean (`tsc --noEmit`, strict).
- `npm run build` — green; `/`, `/_not-found`, `/play` all static-prerender.
- Self-checks (`setup`, `effects`, `win-conditions`, `engine`, `reducer`) — pass on both server and browser import (P4 added no logic, so these are unaffected).
- Dev smoke — `/` and `/play` return 200; recompile after edits is clean (no runtime/parse errors).

### Manual (to run before declaring P4 done)
Full game on the new board: night1 → day1 (no vote) → night2 → day2 (eliminate via card + via sheet) → gameover. Check: status bar counts/effects/win-readout accurate; wizard records/reorders/skips/auto-advances; witch Heal/Kill toggle; bottom sheet kill/revive/role-change/effects all dispatch and survive a refresh; phase tint visible on the status bar.
