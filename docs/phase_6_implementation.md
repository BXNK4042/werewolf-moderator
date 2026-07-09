# Phase 6 — Game End (Implementation Record)

Win detection post-resolution was **already built in P3** (`checkWinner` runs
inside `resolveDawn` and `recordDayDeath` in `engine.ts`, setting
`phase:"gameover"` + `winner`). P6 consumes it unchanged and adds the two
remaining pieces from `MASTER_PLAN.md` §7 (P6): the **winner screen** and
**marking a game finished in storage** (data only — no Stats UI yet).

Scope reference: `MASTER_PLAN.md` §7 (P6).

---

## Locked decisions

| Fork | Decision | Why |
|---|---|---|
| Win-detection logic | **Reuse P3 `checkWinner` unchanged** | Already runs at dawn + day-death; P6 only reads it. Lone Wolf / Hoodlum / Cupid pair-win remain deferred from P1/P3. |
| Side-wins (Tanner) | **Recompute `checkWinner(state)` at render** | Pure fn; avoids storing `sideWins` in state. No reducer/type/engine change. |
| Archive module | **New `lib/game/history.ts`** | Matches MASTER_PLAN §8. Self-contained: owns `FinishedGame`, its own localStorage key, and `archiveGame`/`loadHistory`. `storage.ts` stays focused on the active game. |
| Pure record-builder | **`buildFinishedGame(state)` extracted** | Separates the derivable record (testable, no localStorage) from the I/O in `archiveGame`. Lets the module carry a self-check like every other logic module. |
| Archive dedup across refresh | **`useRef` guard in the hook, set on hydrate** | A `gameId` field would work but is more touches. The ref prevents re-archive on refresh (hydrate sets it true) and resets when a new game starts. `archiveGame` re-checks via a roster/winner signature as belt-and-suspenders. |
| History cap | **50 games** (`slice(-50)`) | Board-game use, infrequent; bounds localStorage. |
| Winner screen richness | **Full recap** | Winner banner + Tanner callout + summary + final roster + collapsible log + New game / Home. |
| StatusBar on gameover | **None** (unchanged from P4/P5) | Gameover is a terminal screen; undo/timeline out of scope there. |
| Clear active game on "New game" | **No extra work** | `resetSetup` already overwrites the active slot; on refresh/home-back the gameover state persists so the winner screen is reviewable. |

No new dependencies. No reducer / types / engine / win-conditions changes.

---

## Files

| File | Status | Purpose |
|---|---|---|
| `lib/game/history.ts` | **new** | `FinishedGame` type; `buildFinishedGame(state)` (pure); `archiveGame(state)` (dedup + cap + write); `loadHistory()`; self-check |
| `components/game/winner-screen.tsx` | **new** | Full recap winner screen |
| `lib/hooks/use-game.tsx` | edited | `archivedRef` guard: archive once on `phase→gameover`, reset on non-gameover; set ref in the hydrate effect so refresh doesn't re-archive |
| `app/play/page.tsx` | edited | Replaced inline `GameOver()` placeholder with `<WinnerScreen/>`; removed the dead placeholder function |

---

## `history.ts`

```ts
export interface FinishedGame {
  id: string; endedAt: number; nights: number;
  winner?: Team; sideWins: RoleId[];
  players: { name: string; roleId: RoleId | null; alive: boolean }[];
  log: LogEntry[];
}
```

The record captures what future Stats / Replay need: when the game ended, who
won (team + any side-wins), how many nights, the final roster with role
assignments, and the full event log. `roleId` stays `RoleId | null` to match
`Player` — by gameover every seat is dealt, but the type is honest.

- **`buildFinishedGame(state)`** — pure. Derives `winner`/`sideWins` via
  `checkWinner`, maps players (name/roleId/alive), copies `log`. `id` is
  `crypto.randomUUID()`, `endedAt` is `Date.now()` (client-only; storage
  functions guard `typeof window === "undefined"`).
- **`sig(r)`** — `${winner}:${nights}:${roleIds}`. Dedup key: the same final
  roster + winner + length is the same game.
- **`archiveGame(state)`** — builds the record, loads history, skips if the
  head entry's `sig` matches, else prepends + `slice(0, 50)` + writes.
  Best-effort `try/catch` (mirrors `storage.ts`).
- **`loadHistory()`** — JSON in/out with the same guard + `try/catch`.

Key: `werewolf-mod:history` (separate from `storage.ts`'s
`werewolf-mod:active-game`).

### Self-check
`buildFinishedGame` + `sig` exercised on fixtures: winner/roster/nights/log
carry through; Tanner death surfaces in `sideWins`; identical games share a sig,
different rosters differ. Runs on import when `NODE_ENV !== "production"`
(verified: `[history] selfCheck ok`). `archiveGame`/`loadHistory` are pure I/O
(like `storage.ts`, no self-check) — covered by manual verification.

---

## `winner-screen.tsx`

Single-column, mobile-first. Sections:

- **Banner** — `Trophy` colored by team (local `TEAM_TEXT` mirror of
  `TEAM_DOT`), heading "`{Team}` win" (e.g. "Werewolves win"); fallback
  "Game over" when `winner` is undefined. Sub-line: "Ended on Night N".
- **Tanner callout** — amber chip ("Tanner also won") when
  `checkWinner(state).sideWins` includes `tanner`.
- **Summary** — nights played · player total · dead count (lucide icons).
- **Final roster** — seat order; each row: seat number, team dot, name
  (strikethrough if dead), role name. Reuses `getRole` + `TEAM_DOT` (same
  patterns as `player-card.tsx`).
- **Event log** — `<details>` (collapsible), max-height scroll, one line per
  `LogEntry` with a phase glyph (`Moon`/`Sunrise`/`Settings`/`HistoryIcon`).
  Feeds future Replay; no new UI.
- **Actions** — New game (`resetSetup`) + Home (`router.push("/")`).

---

## `use-game.tsx` — archive guard

```ts
const archivedRef = useRef(false);

// hydrate effect: if (saved?.phase === "gameover") archivedRef.current = true;
//   // restored gameover was already archived before the reload
// autosave effect:
//   saveGame(state);
//   if (phase === "gameover" && !archivedRef.current) { archiveGame(state); archivedRef.current = true; }
//   else if (phase !== "gameover") archivedRef.current = false;
```

Trace (why no duplicates):
1. Game reaches gameover → autosave effect archives, sets ref `true`.
2. Refresh → mount → hydrate restores gameover, sets ref `true` → autosave
   effect sees ref set → skips.
3. "New game" (`resetSetup`) → `phase:"setup"` → autosave effect resets ref
   `false` → the next game's gameover archives fresh.

---

## What P6 deliberately does NOT do (→ later)

- **Stats / Replay viewer UI** — deferred milestone. `archiveGame` captures the
  data; no viewer yet (call `loadHistory()` from a console to inspect).
- **Lone Wolf / Hoodlum / Cupid soulmate pair-win** win conditions — remain
  `ponytail:`-deferred in `win-conditions.ts` (need first-night target /
  lover-link-pair data). Heartbreak cascade is already resolved in the engine.
- **All-players-dead edge case** — `checkWinner` returns no winner at
  `alive.length === 0`, so gameover isn't reached; recoverable via the
  override (revive). Noted, out of scope.
- **History viewer on the landing page** — "Continue" after gameover still
  shows the winner screen (harmless, reviewable); no landing change.
- **`TEAM_TEXT` hoisted to `team-style.ts`** — kept local to `winner-screen.tsx`
  (one consumer). Hoist if a second consumer appears.

---

## Verification

- `npm run typecheck` — clean (`tsc --noEmit`, strict).
- `npm run build` — green; `/`, `/_not-found`, `/play` all static-prerender.
- Self-checks — `[win-conditions]`, `[history]` confirmed via `tsx` import;
  `setup` / `effects` / `engine` / `reducer` unaffected (no logic touched).

### Manual (to run before declaring P6 done)
1. Play to a **werewolves-at-parity** win and a **village-clears-wolves** win —
   winner banner color/label correct; final roster shows roles + dead status;
   event log lists the game timeline.
2. A game where the **Tanner dies** alongside a team win shows both the team
   banner and the "Tanner also won" chip.
3. On the gameover screen, **refresh** the page — the winner screen reappears
   and `localStorage["werewolf-mod:history"]` has **one** entry for the game
   (no duplicate).
4. "New game" returns to setup; playing a second game to a win adds a **second**
   history entry (head of the array).
5. "Home" returns to the landing page; "Continue" reopens the winner screen.
