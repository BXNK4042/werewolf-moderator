# Werewolf Moderator — Master Plan

A mobile-first web app that lets any player act as the moderator for
**Werewolf: Ultimate Deluxe Edition**. It prevents the human errors that
plague manual moderation (forgotten roles, night-action mistakes) while
keeping the moderator in full control of every game state.

---

## 1. Goals & Non-Goals

### Goals
- **Faster setup** — create a game, add players, pick roles in seconds.
- **Error prevention** — guided night-action queue; nothing forgotten.
- **Beautiful UI** — shadcn/ui + lucide-react, mobile-first, dark phase-aware theme.
- **Full moderator control** — override, revive, change roles, undo, skip phases.
- **Always-on situational awareness** — alive/dead, phase, night #, pending
  actions, active effects, live win conditions.
- **Replayable & verifiable** — history log, timeline, rollback.

### Non-Goals (this version)
- No online/multiplayer — **local-only** (single device, board-game use).
- No backend, auth, or database — pure client-side SPA.
- No automated vote tallying — moderator runs votes out loud and records results.
- No pass-the-phone role reveal — moderator announces / uses physical cards.
- No Statistics dashboard or Replay player UI (deferred — data model captures the
  log so these are additive later).
- No custom/infinite roles — **only** the official Ultimate Deluxe Edition roles.

---

## 2. Confirmed Decisions

| Area | Decision | Rationale |
|---|---|---|
| Runtime | Client-only SPA | Single-device board-game tool; server state buys only latency + complexity. |
| State | `useReducer` + snapshot history | Deterministic transitions, free undo/redo/rollback, no state lib. |
| Persistence | `localStorage` | Survive refresh + finished-game history; no DB. |
| Rules source | `Ultimate-Werewolf-Manual.txt` (official rulebook, text-extracted, repo root) | Implement all 45 roles from the manual; tag uncertain rules `ponytail:` for review. |
| Night engine | Guided reorderable queue + dawn resolve | Rulebook (manual.txt, p.8) lists a *suggested* call order ("e.g. Werewolves before Witch"), not an enforced one; effects resolve at dawn. Matches physical play, far less code than a dependency solver. |
| Role reveal | Moderator announces/cards | No reveal screen. |
| Day voting | Manual, record result only | No tally engine. |
| Scope | Core game + overrides | Stats & Replay deferred. |
| Stack | Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui · lucide-react · Vercel | As specified. |

---

## 3. Next.js 16 Conventions (the "not the Next.js you know" guardrails)

This project is effectively a client-side SPA; nearly all server-side features are
irrelevant. Key rules to follow:

- **Root `app/layout.tsx`** = Server Component: owns `<html>/<body>`, `next/font`,
  static `metadata`, imports `./globals.css`, wraps children in a `'use client'`
  `GameProvider`.
- **Interactive screens** = `'use client'`, standard React state/hooks
  (`useState`/`useReducer`/`useEffect`). Landing + play pages are client components.
- **`params` / `searchParams` are Promises** in v16 — must be `await`ed. (We largely
  avoid dynamic routes, so minimal impact.)
- **Metadata API only in Server Components** — keep `metadata` in `layout.tsx`.
- **Tailwind v4**: `@tailwindcss/postcss` + `@import 'tailwindcss'` + `@theme` in
  CSS. **No** `tailwind.config.js`.
- **Add `app/error.tsx`** (`'use client'`) + `app/not-found.tsx` for robustness.
- **`useSearchParams()`** in a static-prerendered client component must be wrapped in
  `<Suspense>` or the prod build fails.
- **Ignore:** Server Actions, `'use cache'`, `cookies`/`headers`, `generateStaticParams`,
  `proxy.ts`, route-segment caching, `cacheComponents` — none apply to a local app.

---

## 4. Core Data Model

```ts
type Phase = 'setup' | 'night' | 'day' | 'gameover'
type Team  = 'village' | 'werewolf' | 'vampire' | 'cult' | 'neutral'

interface Role {
  id: RoleId
  name: string
  team: Team
  description: string
  nightAction?: { defaultOrder: number; prompt: string }  // suggested, reorderable
  firstNightOnly?: boolean
}

interface Effect {
  type: 'protected' | 'diseased' | 'cursed' | 'amulet' | 'lover-link' | 'cult' | ...
  source?: string
  nightApplied: number
}

interface Player {
  id: string
  name: string
  roleId: RoleId | null            // assigned Night 1
  alive: boolean
  effects: Effect[]
  diedAt?: { night: number; cause: string }
}

interface LogEntry {
  night: number
  phase: Phase
  text: string
  at: number                       // timestamp
}

interface Snapshot {
  label: string                    // e.g. "Start of Night 2"
  state: GameState
  at: number
}

interface GameState {
  players: Player[]
  rolePool: RoleId[]               // selected in setup, dealt Night 1
  phase: Phase
  nightNumber: number
  log: LogEntry[]                  // human-readable timeline (feeds future Replay)
  past: Snapshot[]                 // undo stack
  future: Snapshot[]               // redo stack
  winner?: Team
}
```

---

## 5. The Night Engine

The one genuinely hard part — kept deliberately simple.

1. **Guided prompt queue.** At night, build an ordered list of alive roles that have
   a night action. Moderator walks each prompt ("Werewolves: choose victim",
   "Seer: choose target"), entering outcomes. Default order is sensible
   (Cursed/Doppelgänger/Cupid early → seeing roles → wolves → Witch/Bodyguard) but
   **freely reorderable** — the rulebook (p.8) lists a suggested call order
   ("e.g. Werewolves before Witch"), not an enforced one.
2. **Dawn resolution.** At phase end, apply effects in a fixed priority:
   `protection → kills → conversions/links → deaths`. Surface who died + any info
   the moderator needs, then check win conditions.
3. **Moderator overrides everything.** Skip any prompt, force a result, revive,
   change role, jump phase.

> `ponytail: guided queue + dawn resolve; upgrade to a dependency graph only if
> specific role interactions break.`

---

## 6. Game Flow

```
Create Lobby → Add Players → Add Roles (unassigned)
        ↓
Night 1 (assign roles, first-night-only actions)
        ↓
Day 1 (discussion only, vote skipped)
        ↓
Night 2 (game begins — nightly actions)  ←┐
        ↓                                   │
Day N (discussion, manual vote/record)   └──┘ repeat
        ↓
Win condition met → Game End (winner declared)
```

Win-condition matrix evaluated after every resolution: village (all wolves dead),
werewolves (wolves ≥ villagers), plus Tanner (dies = wins), Cult Leader (all alive
are cult), Vampire, and other role-specific conditions — encoded from the manual.

---

## 7. Build Phases (core scope)

Each phase is independently shippable.

- **P0 · Foundation** — install shadcn/ui + lucide-react; Tailwind v4 `@theme`
  tokens (night/day palette); `next/font`; `metadata`; `GameProvider` shell;
  `error.tsx` / `not-found.tsx`.
- **P1 · Domain** — `roles.ts` (all 45 roles: id, team, description, default night
  order, first-night flags) encoded from `Ultimate-Werewolf-Manual.txt`; `types.ts`;
  win-condition matrix.
- **P2 · Setup flow** — lobby: add/rename/reorder players; pick role counts;
  validate (players == roles, sane wolf count, required roles present); autosave.
- **P3 · Engine** — reducer: `setup→night1(deal)→day1(skip)→night2→dayN→gameover`;
  guided night queue; dawn resolver; effect model; death/revive; manual day death
  recording.
- **P4 · Moderator board** — always-on status bar (phase, night #, alive/dead,
  pending actions, active effects, live win-conditions) + player grid (tap to
  target/kill/revive/inspect) + night wizard + override panel.
- **P5 · Undo / timeline / rollback** — snapshot on every action → undo/redo,
  labeled timeline drawer, jump-to-snapshot.
- **P6 · Game end** — win detection post-resolution; winner screen; mark game
  finished in storage (data only — no Stats UI yet).
- **P7 · Polish** — mobile-first responsive, transitions, a11y (focus, aria),
  `metadata`, Vercel deploy.

### Deferred (later milestones)
- **Statistics** — games played, win rates by team/role (data already captured).
- **Replay** — step-through a finished game from the log.

---

## 8. File Structure

```
app/
  layout.tsx            # server: html/body, font, metadata, <GameProvider>
  globals.css           # tailwind v4 + @theme tokens (phase palette)
  page.tsx              # 'use client' landing: New game / Continue
  play/page.tsx         # 'use client' — the moderator board
  error.tsx  not-found.tsx
components/
  ui/                   # shadcn primitives
  game/
    status-bar.tsx  player-grid.tsx  player-card.tsx
    night-wizard.tsx  override-panel.tsx  timeline-drawer.tsx
    role-picker.tsx  lobby.tsx  winner-screen.tsx
lib/
  game/
    types.ts  roles.ts  reducer.ts  engine.ts
    win-conditions.ts  effects.ts  history.ts  storage.ts
  hooks/use-game.ts     # reducer + autosave + undo/redo
  utils.ts              # cn()
```

---

## 9. Official Roles (45) — Ultimate Deluxe Edition

Villager · Werewolf · Seer · Apprentice Seer · Aura Seer · Beholder · Bodyguard ·
Cupid · The Count · Diseased · Fruit Brute · Ghost · Hunter · Village Idiot ·
Insomniac · Lycan · Wolf Man · Martyr · Tough Guy · Troublemaker · The Amulet of
Protection · White Wolf · Thing · Witch · Sorcerer · Minion · Wolf Cub · Dream Wolf ·
Cursed · Doppelgänger · Drunk · Cult Leader · Hoodlum · Tanner · Lone Wolf · Vampire ·
Little Girl · Wild Child · Sasquatch · Leprechaun · Bloody Mary · Chupacabra ·
Nostradamus · Dire Wolf · Fortune Teller · Black Wolf · Big Bad Wolf

Exact team / power / night behavior for each is encoded from
`Ultimate-Werewolf-Manual.txt` (official rulebook, repo root) in **P1**; any
uncertain rule is tagged `ponytail:` for review. Because the night queue is
reorderable and the moderator overrides everything, an imperfect role detail never
breaks a game.

> The rulebook is committed as a text file (`Ultimate-Werewolf-Manual.txt`) so it's
> directly searchable. It was extracted from the PDF with
> `pdftotext -layout Ultimate-Werewolf-Manual.pdf` (keep `-layout` — role
> descriptions are multi-column); re-run that if the PDF is ever updated. 13 pages.

---

## 10. Risk

- **Role accuracy** — 45 roles' exact powers/teamings are the main risk. Mitigated
  by sourcing directly from the official manual (`Ultimate-Werewolf-Manual.txt`),
  `ponytail:` tagging, and the override-everything design.
- **Scope creep** — Stats/Replay explicitly deferred to protect the core build.
