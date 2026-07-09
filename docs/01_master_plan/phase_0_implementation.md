# Phase 0 — Foundation Implementation

Status: **Complete** · Commit `364927c`

> Scope source: `MASTER_PLAN.md` §7 (P0 · Foundation)

---

## Goal

Lay the project foundation before any game logic: the UI primitive library,
theme system, fonts, metadata, and a `GameProvider` state shell that later
phases build on. Independently shippable — the app compiles, renders a
branded landing, and has robust error/404 handling.

## Decisions (locked before implementation)

| Area | Decision | Rationale |
|---|---|---|
| State typing | Minimal type skeleton now (`lib/game/types.ts`); P1 extends with `Role` powers + win matrix | The provider shell needs something to hold; the structural types are foundation, not duplication. |
| Dark mode | Dark-only, hardcoded `<html class="dark">` | Single-user board-game tool, often in a dim room. No toggle, no `next-themes` — YAGNI. |
| Phase palette | Adopt shadcn default tokens only | Phase-specific tokens (`bg-night`/`bg-day`) added in P3/P4 when the night wizard + status bar actually read them — no unused tokens left in the foundation. |
| UI library | shadcn/ui **base-ui** (nova preset), neutral base color | Base UI has first-class React 19 support; Nova matches the Geist/lucide stack. |

## What was built

### 1. shadcn/ui + lucide-react
- `npx shadcn@latest init -b base -p nova` → `components.json`, `lib/utils.ts` (`cn()`), rewritten `app/globals.css` (v4 structure).
- `npx shadcn@latest add button card` → `components/ui/{button,card}.tsx`.
- Installed: `@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `lucide-react`, `shadcn`.

### 2. Theme & fonts (`app/globals.css`, `app/layout.tsx`)
- shadcn rewrote `globals.css` to Tailwind v4 conventions: `:root` + `.dark` CSS vars (oklch), `@theme inline`, `@custom-variant dark` (class-based dark mode), `@layer base`.
- **Fix:** shadcn left a stale `--font-geist-mono` reference in `@theme inline`; corrected to `--font-mono` and aligned `next/font` variable names to `--font-sans` / `--font-mono` so the `font-sans` utility resolves through the html className.
- `metadata` set to the app title/description; separate `viewport` export carries `themeColor` (Next 14+ convention — `themeColor` no longer lives in `metadata`).

### 3. GameProvider shell
- `lib/game/types.ts` — `Phase`, `Team`, and a structural `GameState` / `Player` / `LogEntry` / `Snapshot` / `Effect`. `RoleId` is a `string` alias; full `Role` definition deferred to P1.
- `lib/hooks/use-game.tsx` (`'use client'`) — `GameProvider` holds `initialState` via `useState`; exports `useGame()` (throws if used outside the provider). Real reducer / autosave / undo land in P3.
- Layout wraps children in `<GameProvider>`.

### 4. Screens
- `app/page.tsx` — branded landing stub (Moon icon, title, disabled "New Game" button). Smoke-tests shadcn + theme + provider; the real lobby wires up in P2.
- `app/error.tsx` (`'use client'`) — minimal fallback using **`unstable_retry`**.
- `app/not-found.tsx` — Server Component, link-as-button via `buttonVariants()`.

## Next.js 16 gotchas (from bundled docs)

- **`error.tsx` uses `unstable_retry`** (not the legacy `reset` prop) as of v16.2.0. Confirmed in `node_modules/next/dist/docs/.../error.md`.
- **`themeColor` belongs in the `viewport` export**, not `metadata`.
- **Tailwind v4:** no `tailwind.config.js`; all theming in CSS via `@theme inline`.
- `next/font` behavior unchanged; kept the Geist variable-font approach.

## Verification

- `npm run build` — clean (Turbopack, TypeScript passes, `/` and `/_not-found` prerendered as static).
- Dev smoke — `GET /` returns 200; branded landing renders with correct title/heading/button; no console errors.

## File manifest

```
app/
  globals.css        # rewritten by shadcn (v4 theme), font refs reconciled
  layout.tsx         # metadata + viewport, dark class, fonts, <GameProvider>
  page.tsx           # branded landing stub
  error.tsx          # 'use client', unstable_retry
  not-found.tsx      # Server Component
components/
  ui/button.tsx      # shadcn (base-ui)
  ui/card.tsx        # shadcn (base-ui)
lib/
  utils.ts           # cn()
  game/types.ts      # minimal type skeleton
  hooks/use-game.tsx # GameProvider + useGame()
components.json      # shadcn config (base-nova, neutral)
```

## Deferred to later phases

| Item | Phase |
|---|---|
| Full `Role` definitions (45 roles from the rulebook), `Effect` detail, win-condition matrix | P1 |
| Real reducer, `localStorage` autosave, undo/redo/rollback, dawn resolver, effect model | P3 |
| Phase-aware palette tokens (`bg-night`/`bg-day`) consumed by night wizard + status bar | P3/P4 |
| Lobby + role-picker setup flow | P2 |
| Light mode / theme toggle | not planned (unless requested) |
