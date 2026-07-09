<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Werewolf Moderator — project rules

Read `MASTER_PLAN.md` before any work. It is the source of truth for scope, data model, and build phases.

## What this app is
A local-only moderator tool for Werewolf: Ultimate Deluxe Edition. Single device, board-game use. No backend, auth, or database. Scope is in MASTER_PLAN.md §1.

## Stack
- Next.js 16 (App Router), React 19, Tailwind v4, TypeScript
- shadcn/ui + lucide-react (install in P0 — not yet present)
- Deploy: Vercel

## It is a client-side SPA
Almost all logic/UI is interactive, so most components are `'use client'`. Conventions:
- `app/layout.tsx` = Server Component: `<html>/<body>`, `next/font`, static `metadata`, `import './globals.css'`, wrap children in the `'use client'` `GameProvider`.
- `metadata` exports only in Server Components.
- Tailwind v4: `@tailwindcss/postcss` + `@import 'tailwindcss'` + `@theme` in CSS. No `tailwind.config.js`.
- Maintain `app/error.tsx` (`'use client'`) and `app/not-found.tsx`.
- Ignore Server Actions, `'use cache'`, `cookies`/`headers`, `generateStaticParams`, `proxy.ts`, `cacheComponents`, route-segment caching — not relevant to a local app.
- `params`/`searchParams` are Promises in v16 — `await` them. `useSearchParams()` in a static client component needs a `<Suspense>` wrapper or the prod build fails.

## State & persistence
- `useReducer` for all game state. Every action pushes a snapshot for undo/redo/rollback.
- `localStorage` for autosave + finished-game history.
- No state lib, no DB.

## Domain rules
- Night call order is NOT enforced — the rulebook (`Ultimate-Werewolf-Manual.txt`, p.8) lists a *suggested* call order ("e.g. Werewolves before Witch"), and effects resolve at dawn. Implement a guided, reorderable night queue + a dawn resolver, **not** a dependency solver.
- Only the 45 official Ultimate Deluxe roles. Encode from `Ultimate-Werewolf-Manual.txt` (official rulebook, text-extracted at repo root), not a wiki; tag any uncertain rule with a `ponytail:` comment for review.
- The rulebook is committed as searchable text (`Ultimate-Werewolf-Manual.txt`). It was extracted with `pdftotext -layout Ultimate-Werewolf-Manual.pdf` (keep `-layout`; role descriptions are multi-column) — re-run if the PDF changes.
- Moderator can override anything. Day voting is manual (record result only). No role-reveal screen.

## Conventions
- Follow existing code style; reuse helpers/patterns already in the repo before writing new ones.
- Minimal diffs. Deletion over addition. No speculative abstractions.
- Don't add comments unless asked (allowed: brief `ponytail:` tags for deliberate simplifications).
- Don't commit unless explicitly asked.

## Commands
- `npm run dev` — dev server
- `npm run build` — production build (run before declaring work done)
- No lint/typecheck script yet — when adding tooling, record the command here.
