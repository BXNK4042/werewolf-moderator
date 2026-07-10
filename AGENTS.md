<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

Next.js 16.2.10 has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Werewolf Moderator — project rules

## What this app is
A local-only moderator tool for Werewolf: Ultimate Deluxe Edition. Single device, board-game use. No backend, auth, or database — a pure client-side SPA. Full scope, data model, and build-phase notes live in `docs/01_master_plan/01_master_plan.md` (phase-by-phase notes in `phase_0..7_implementation.md` alongside it). Read the master plan before non-trivial work.

## Stack
- Next.js 16 (App Router), React 19, Tailwind v4, TypeScript
- shadcn/ui + lucide-react — **installed**. Configure/add components via `components.json`.
- Deploy: Vercel

## shadcn here is built on Base UI, NOT Radix
This project uses the shadcn **`base-nova`** registry. Generated components import primitives from `@base-ui/react/*` (e.g. `@base-ui/react/button`), **not** `@radix-ui/*`. Do not hand-write Radix imports or assume the Radix-based shadcn API you may know. Add new components with `npx shadcn@latest add <name>` and let the registry generate the Base UI version.

## It is a client-side SPA
Almost all logic/UI is interactive, so most components are `'use client'`. Conventions:
- `app/layout.tsx` = the one Server Component: `<html>/<body>`, `next/font`, static `metadata`/`viewport`, `import './globals.css'`, wrap children in the `'use client'` `GameProvider` (from `lib/hooks/use-game.tsx`).
- `metadata` / `viewport` exports only in Server Components.
- Dark mode is **forced** — the `dark` class is always on `<html>`. There is no theme toggle; design for dark.
- Tailwind v4: `@import "tailwindcss"` + `@import "tw-animate-css"` + `@import "shadcn/tailwind.css"` + `@theme` in `app/globals.css`. No `tailwind.config.js`.
- Maintain `app/error.tsx` (`'use client'`) and `app/not-found.tsx`.
- Ignore Server Actions, `'use cache'`, `cookies`/`headers`, `generateStaticParams`, `proxy.ts`, `cacheComponents`, route-segment caching — not relevant to a local app.
- `params`/`searchParams` are Promises in v16 — `await` them. `useSearchParams()` in a static client component needs a `<Suspense>` wrapper or the prod build fails.
- Path alias: `@/*` → repo root (see `tsconfig.json` `paths`).

## Code layout
- `app/` — routes (App Router). `app/play/` is the game screen; `app/page.tsx` is the landing/redirect.
- `components/game/` — domain UI (lobby, role-picker, night-wizard, player-grid/sheet, status-bar, timeline-drawer, winner-screen).
- `components/ui/` — shadcn primitives (Base UI backed). Prefer extending these over new primitives.
- `lib/game/` — the engine: `types.ts` (all domain types), `roles.ts` (role registry), `reducer.ts` + `effects.ts` (state transitions + dawn resolution), `win-conditions.ts`, `history.ts` (finished-game archive), `storage.ts` (localStorage), `setup.ts` (initial state), `role-art.ts` + `team-style.ts` (presentation).
- `lib/hooks/use-game.tsx` — `GameProvider` + `useGame()`; the single state entrypoint.

## State & persistence
- `useReducer` for all game state (see `lib/game/reducer.ts`). Every action pushes a `Snapshot` to `state.past` for undo/redo/rollback; `state.future` holds redo targets.
- `lib/game/storage.ts` autosaves to `localStorage` on every state change. `lib/game/history.ts` archives a game once when it ends.
- The provider hydrates from `localStorage` in a `useEffect` **after mount**, not in the reducer initializer — this is deliberate, to avoid SSR/client hydration mismatch (server and first client render agree on empty). Don't "fix" it by reading storage in the initializer.
- No state lib, no DB.

## Domain rules
- Night call order is NOT enforced — the rulebook lists a *suggested* call order ("e.g. Werewolves before Witch"), and effects resolve at dawn. It's a guided, **reorderable** night queue (`NightQueue` in `types.ts`) + a dawn resolver (`effects.ts`), **not** a dependency solver. `NightAction.defaultOrder` is authored, not from the manual.
- Roles: there are **46** `RoleId`s in `types.ts` (the Amulet of Protection is modeled as an `Effect`, not a role). The role registry is in `lib/game/roles.ts`.
- The committed rulebook is `docs/ultimate_werewolf_manual.txt` — but it is the **base** Ultimate Werewolf manual, **not** Ultimate Deluxe Edition. It documents ~26 of the 46 roles; the remaining ~20 are **stubbed** (team only, placeholder description) and tagged `ponytail:` in `roles.ts`. Treat their powers as unverified, and tag any change to them the same way.
- A secondary role reference is `docs/werewolf_role.md`.
- Moderator can override anything. Day voting is manual (record result only). No role-reveal screen.

## No tests
There is no test runner and no `test`/`lint` script. Don't invent test commands. Verify with `npm run typecheck` and `npm run build`. Non-trivial logic carries `ponytail:` self-checks or relies on typecheck — keep new logic type-safe.

## Conventions
- Follow existing code style; reuse helpers/patterns already in `lib/game` and `components/game` before writing new ones.
- Minimal diffs. Deletion over addition. No speculative abstractions.
- Don't add comments unless asked (allowed: brief `ponytail:` tags marking deliberate simplifications or unverified rules, with the ceiling/upgrade path noted).
- Don't commit unless explicitly asked.

## Commands
- `npm run dev` — dev server
- `npm run build` — production build (run before declaring work done)
- `npm run typecheck` — `tsc --noEmit`, run before declaring work done
