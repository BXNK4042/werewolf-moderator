# Phase 5 — Undo / Timeline / Rollback (Implementation Record)

P5 is **pure UI** — the snapshot engine (undo/redo/rollback, slimmed
snapshots, `MAX_HISTORY` cap, labeled commits) was fully built in P3
(`reducer.ts`). P5 adds the surfaces to drive it: undo/redo buttons and a
labeled timeline drawer with jump-to-snapshot.

Scope reference: `MASTER_PLAN.md` §7 (P5).

---

## Locked decisions

| Fork | Decision | Why |
|---|---|---|
| Undo/redo/timeline placement | **Status bar icon cluster** | Always visible during night/day play (where mistakes matter). P4 already named the status bar as the home. Three `ghost` `icon-sm` buttons, compact on mobile. |
| Timeline drawer side | **`side="right"`** | Differentiates from the player-sheet (bottom). A vertical list reads well; near-full-width on mobile (`w-full sm:max-w-sm`). |
| Rollback confirmation | **None** | Board-game tool; undo is cheap, snapshot survives refresh. Extra tap slows the moderator. |
| New `history.ts` module | **No** | `canUndo`/`canRedo` are `past.length > 0` one-liners. MASTER_PLAN §8 lists it but YAGNI — extract if a second consumer appears. |
| Setup/gameover undo | **Out of scope** | Setup edits are trivially reversible. GameOver is a P6 placeholder without `<StatusBar/>`. |
| Keyboard shortcuts | **No** | Mobile-first; buttons are primary. |
| New reducer actions / types / deps | **None** | `undo`/`redo`/`rollback(to)` all exist from P3. `Sheet` primitive already installed (P4). |

---

## Files

| File | Status | Purpose |
|---|---|---|
| `components/game/timeline-drawer.tsx` | **new** | Right-side `<Sheet>`: reverse-chronological snapshot list with phase/night context, click-to-rollback |
| `components/game/status-bar.tsx` | edited | Undo/Redo/Timeline icon cluster in header row + owns drawer open state via `useState` |

No new dependencies. No reducer/type/engine changes.

---

## Component detail

### `status-bar.tsx` — icon cluster added to header row

The existing row 1 (`flex justify-between`: phase label left, badges right)
gains three `ghost` `icon-sm` `<Button>`s before the badges:

- **Undo** (`Undo2`) → `dispatch({ type: "undo" })`; `disabled` when
  `state.past.length === 0`.
- **Redo** (`Redo2`) → `dispatch({ type: "redo" })`; `disabled` when
  `state.future.length === 0`.
- **Timeline** (`History`) → `setTimelineOpen(true)`.

`StatusBar` owns `const [timelineOpen, setTimelineOpen] = useState(false)`
and renders `<TimelineDrawer open={timelineOpen} onOpenChange={setTimelineOpen} />`
as a sibling of `<header>` (wrapped in a fragment). The Sheet's portal means
DOM position is irrelevant; `z-50` sits above the header's `z-20`.

### `timeline-drawer.tsx` — labeled history with jump-to-snapshot

`<Sheet side="right">` controlled via `open`/`onOpenChange` props (same pattern
as `PlayerSheet`).

**Content:**
- **Header** — "History" + action count (`SheetDescription`).
- **Snapshot list** — `state.past` reversed (newest first). Each entry is a
  `<button>`:
  - Phase glyph (`Moon`/`Sunrise`/`Settings`/`History`) from
    `snap.state.phase`.
  - `snap.label` (e.g. "Record night action", "Override: kill", "Day death").
  - Subtext: `phaseLabel` (e.g. "Night 2") + alive count + relative timestamp
    (`timeAgo`).
  - Click → `dispatch({ type: "rollback", to: state.past.length - 1 - i })` +
    close drawer.
- **Current marker** — non-clickable highlighted row after the last past entry:
  "Current" with live phase/night + alive count.
- **Redo note** — if `state.future.length > 0`, a one-line count of actions
  available to redo (informational; redo is driven by the status-bar button).

**Index mapping:** reversed position `i` → original `past` index
`state.past.length - 1 - i`. The `rollback(to)` action restores
`past[to].state`, keeps `past[0..to]`, and wipes `future`.

**Helpers (inline, no module):**
- `PhaseGlyph` — maps `Phase` to a lucide icon.
- `phaseLabel(phase, nightNumber)` — "Setup" / "Night N" / "Day N" / "Game over".
- `timeAgo(ts)` — relative time via stdlib `Date` ("just now" / "5m ago" /
  "2h ago").

---

## What P5 deliberately does NOT do (→ later phases)

- **Winner screen** — P6 (placeholder stays in `GameOver`).
- **Stats / Replay** — deferred milestone. The `log` array feeds Replay; the
  timeline drawer is undo-history only (snapshots, not log entries).
- **Undo during setup / gameover** — out of scope (see decisions).
- **`history.ts` module** — YAGNI; selectors inlined.
- **Click-to-redo from timeline** — the reducer supports sequential redo only;
  future entries are shown as a count, not clickable. Multi-redo can be added
  if needed.

---

## Verification

- `npm run typecheck` — clean (`tsc --noEmit`, strict).
- `npm run build` — green; `/`, `/_not-found`, `/play` all static-prerender.
- Reducer self-checks (`setup`, `effects`, `win-conditions`, `engine`,
  `reducer`) — unaffected (P5 adds no logic).

### Manual (to run before declaring P5 done)
Full game on the board: night1 → day1 → night2 → day2. After several actions:
1. Undo reverses the last action; redo re-applies it.
2. Undo/redo buttons are `disabled` when the respective stack is empty.
3. Timeline drawer shows labeled entries with correct phase/night context,
   alive count, and relative timestamps.
4. Clicking an older snapshot rollbacks to that point and closes the drawer.
5. After rollback, `future` is empty (redo disabled); the "N actions available
   to redo" note appears.
6. Undo/redo survive a page refresh (state persists via autosave, including
   `past`/`future` arrays).
