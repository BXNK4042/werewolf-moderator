# Phase 7 — Polish (Implementation Record)

The final milestone: responsive widening, motion, a11y, metadata/icons, and
deploy readiness. P7 is **pure polish** — no engine, reducer, type, or logic
changes. Every edit is a class swap, an ARIA attribute, a metadata route, or a
deleted boilerplate file.

Scope reference: `MASTER_PLAN.md` §7 (P7).

---

## Locked decisions (confirmed before build)

| Fork | Decision | Why |
|---|---|---|
| Desktop width | **Widen play board to `max-w-2xl`** | The whole app was capped at `max-w-md` (448px) — a phone strip on a laptop. A moderator on a tablet/laptop gets a 4-col player grid. Lobby + winner screen stay `max-w-md` (centered, readable). |
| Motion library | **CSS-only (tw-animate-css, already installed)** | No `framer-motion`. Board-game tool; phase-swap fade + death fade is enough polish. tw-animate-css was imported in P0 but had zero `animate-*` consumers until now. |
| Motion scope | **Phase-swap fade + winner fade + card death fade** | The genuinely abrupt moments. Sheets already animate (P4 Base UI Dialog). Wizard slide / FLIP lists = scope creep. |
| `aria-live` | **`role="status"` on status counts, wizard progress, winner** | SR users get dynamic updates without a new dep. One wrapper per region. |
| Icons | **`app/icon.svg` (static) + `app/apple-icon.tsx` (ImageResponse)** | No PNG asset pipeline. SVG favicon is sharpest; apple-icon needs raster → `next/og` `ImageResponse`. |
| Manifest | **Add `app/manifest.ts`** | "Add to home screen" at a game table is real utility for a single-device tool. Cheap. |
| `vercel.json` | **No** | Auto-detects Next.js. YAGNI. |
| Stock `public/` SVGs | **Delete** | `next.svg`/`vercel.svg`/etc. were create-next-app boilerplate, never imported. |
| New deps / types / engine | **None** | Polish only. |

---

## Files

| File | Status | Purpose |
|---|---|---|
| `app/icon.svg` | **new** | Werewolf-moon SVG favicon (dark rounded square + amber crescent); Next auto-emits `<link rel="icon" type="image/svg+xml">` |
| `app/apple-icon.tsx` | **new** | 180×180 PNG home-screen icon via `next/og` `ImageResponse`; auto-emits `<link rel="apple-touch-icon">` |
| `app/manifest.ts` | **new** | PWA manifest: name/short_name, `theme_color`/`background_color #0a0a0a`, `display:"standalone"`, icon → `/icon.svg` |
| `app/layout.tsx` | edited | `metadata` expanded: `metadataBase`, `title.template`, `openGraph`, `twitter`, `applicationName` |
| `app/play/page.tsx` | edited | Play board `max-w-md → max-w-2xl` (NightBoard + DayBoard `<main>` + BottomBar); `animate-in fade-in duration-300` on both mains |
| `components/game/player-grid.tsx` | edited | `lg:grid-cols-4` added (2/3/4 cols by breakpoint) |
| `components/game/status-bar.tsx` | edited | Container `max-w-md → max-w-2xl`; icon/badge row gets `flex-wrap justify-end`; count badges wrapped in `role="status" aria-live="polite"` |
| `components/game/player-card.tsx` | edited | `transition-colors → transition-all duration-300` (death opacity/strikethrough now animate) |
| `components/game/night-wizard.tsx` | edited | `aria-live="polite"` on progress row; `aria-current="step"` on current step in "All steps" list; dual `link` selects stack on `max-sm:` |
| `components/game/player-sheet.tsx` | edited | Subtitle `<p>` → `SheetDescription` (Base UI Dialog expects Title+Description); `aria-label` on the `title`-only "Clear protections" button |
| `components/game/winner-screen.tsx` | edited | Banner gets `role="status" aria-live="assertive"` + `animate-in fade-in duration-500` |
| `app/favicon.ico` | **deleted** | Stock create-next-app favicon; superseded by `icon.svg` |
| `public/{next,vercel,file,globe,window}.svg` | **deleted** | Unused create-next-app boilerplate |

No new dependencies. No engine/reducer/types changes.

---

## 1. Responsive — widen the play board

The entire app was capped at `max-w-md` (28rem / 448px) since P2 — a phone-width
strip on any larger screen. P7 widens only the **moderator board** (where extra
space helps); setup/lobby and the winner screen stay centered at `max-w-md`.

- **`app/play/page.tsx`** — `NightBoard` + `DayBoard` `<main>` and the shared
  `BottomBar` inner container: `max-w-md → max-w-2xl`. Mobile layout is
  unchanged (the column was never wider than its content).
- **`player-grid.tsx`** — `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`. Two cols
  on phones, three at `sm:`, four on desktop. Cards reflow; no layout work per
  card needed.
- **`status-bar.tsx`** — header container widens to `max-w-2xl` to match.
- **`night-wizard.tsx`** — dual `link` target selects (Cupid/Hoodlum) were
  side-by-side in `flex gap-1.5` — cramped on small phones inside the
  already-wide card. Now `flex-col gap-1.5 sm:flex-row` (stacked on mobile,
  side-by-side from `sm:`).

Lobby + winner-screen intentionally left at `max-w-md` — single-column forms and
a centered recap read best narrow.

---

## 2. Transitions (CSS-only via tw-animate-css)

`tw-animate-css` has been imported since P0 (`globals.css:2`) but had **zero**
`animate-*` consumers. P7 lights it up for the two genuinely abrupt state
changes, plus the death toggle:

- **Phase-swap fade** — `NightBoard`/`DayBoard` `<main>` get
  `animate-in fade-in duration-300`. The boards remount on phase change
  (they're different components in `play/page.tsx`), so the fade replays on each
  swap automatically — no keyed wrapper needed. Resolving dawn no longer
  hard-cuts to the day board.
- **Winner banner fade** — `animate-in fade-in duration-500` on the trophy
  banner section.
- **Card death fade** — player-card root swaps `transition-colors` for
  `transition-all duration-300`, so the `opacity-50` + `line-through` death
  state animates instead of snapping.

Sheets (player-sheet, timeline-drawer) already animate via Base UI Dialog's
built-in enter/exit transitions (P4) — unchanged.

---

## 3. Accessibility

The biggest pre-P7 gap was **zero `aria-live`** anywhere — dynamic,
screen-reader-relevant updates went unannounced. P7 adds live regions and fixes
the remaining smaller issues:

- **StatusBar counts** — the pending-actions + dead/total badges are wrapped in
  `<span role="status" aria-live="polite" aria-atomic="true">`. SR users now
  hear count changes as the game progresses. (The Undo/Redo/Timeline icon
  buttons stay outside the live region — they're already labeled.)
- **NightWizard progress** — the "Step X of N / N pending / All recorded" row
  gets `role="status" aria-live="polite"`.
- **Winner banner** — `role="status" aria-live="assertive"` so the winner is
  announced immediately on game end.
- **`aria-current="step"`** on the current step's button in the wizard "All
  steps" jump list (previously indicated only by `bg-muted`).
- **PlayerSheet `SheetDescription`** — the role/team subtitle was a plain `<p>`;
  Base UI Dialog expects a `Description` for complete a11y (the timeline drawer
  already had one). Converted to `<SheetDescription className="text-xs">`.
- **`aria-label`** on the "Clear protections" `title`-only button (`title` is
  not a reliable accessible name).

Already sound (no change needed): icon-only buttons were well-labeled across all
components (P2–P6); keyboard nav works end-to-end (cards are `role="button"`
with Enter/Space, all controls are native `<button>`/`<select>`); Base UI Dialog
handles focus trap + restore automatically. The role/effect `<select>`s in
player-sheet use **wrapping `<label>` elements** — valid HTML association, no
`htmlFor`/`id` needed.

---

## 4. Metadata & icons

Pre-P7: title + description only (`layout.tsx`), the stock create-next-app
`favicon.ico`, no manifest, no app icons, no OG/Twitter. P7 adds the full set:

- **`app/icon.svg`** (new) — a 32×32 werewolf-moon favicon: dark rounded square
  (`#0a0a0a`, matching `themeColor`) + amber crescent (`#fbbf24`, the lucide
  `moon` path). Next auto-emits `<link rel="icon" type="image/svg+xml"
  sizes="any">`. SVG scales to all favicon sizes.
- **`app/apple-icon.tsx`** (new) — 180×180 PNG via `next/og` `ImageResponse`
  (same moon on dark). Next auto-emits `<link rel="apple-touch-icon"
  type="image/png" sizes="180x180">`. Needed a raster (iOS); no PNG asset
  pipeline so it's generated at build time.
- **`app/manifest.ts`** (new) — `MetadataRoute.Manifest`: name "Werewolf
  Moderator", short_name "Werewolf", description, `start_url "/"`,
  `display "standalone"`, `theme_color`/`background_color "#0a0a0a"`, icon →
  `/icon.svg` (`sizes:"any"`, scalable SVG). Auto-emits
  `<link rel="manifest" href="/manifest.webmanifest">`.
- **`layout.tsx` metadata** — `metadataBase` (resolves relative OG URLs),
  `title: { default, template: "%s · Werewolf Moderator" }` (no per-route titles
  yet — both pages are client components — but the template is ready),
  `openGraph` + `twitter` cards, `applicationName`.

Verified build output (`<head>`): all three links present and correct — manifest,
`icon.svg`, `apple-icon`. The manifest's `icon.src "/icon.svg"` resolves: Next
serves `app/icon.svg` as a route handler at `/icon.svg` (cache-busting query
appended for the auto `<link>`, but the bare path works for the manifest).

**Deleted:** stock `app/favicon.ico` (superseded by `icon.svg`) and the five
create-next-app boilerplate SVGs in `public/` (`next`, `vercel`, `file`,
`globe`, `window`) — none were imported anywhere.

---

## What P7 deliberately does NOT do (→ later / out of scope)

- **Stats / Replay viewer UI** — deferred milestone (data already captured in
  `history.ts` from P6).
- **Light mode / theme toggle** — dark-only by design (P0 decision).
- **`vercel.json`** — YAGNI; Vercel auto-detects Next.js.
- **framer-motion / wizard slide / FLIP list transitions** — CSS-only polish.
- **Per-route metadata** — both `/` and `/play` are `'use client'` (metadata is
  Server-Components-only). The `title.template` is in place for when a server
  wrapper is added.
- **Role-stub accuracy pass** (20 `ponytail:` stubs in `roles.ts`) — separate
  milestone; needs the real Deluxe rulebook in `docs/`.
- **ESLint** — not present, not a deploy blocker.
- **"Clear protections" label/behavior mismatch** — that button dispatches
  `removeEffect("diseased")` but is labeled "Clear protections" (pre-existing
  from P4). P7 only gave it an accessible name matching its title; the
  label-vs-action discrepancy is out of scope for a polish phase.

---

## Verification

- `npm run typecheck` — clean (`tsc --noEmit`, strict).
- `npm run build` — green; all routes prerender static:
  `/`, `/_not-found`, `/play`, `/icon.svg`, `/apple-icon`, `/manifest.webmanifest`.
- `<head>` output confirmed: `<link rel="manifest">`, `<link rel="icon"
  type="image/svg+xml">`, `<link rel="apple-touch-icon" type="image/png"
  sizes="180x180">` all present.
- Self-checks (`setup`, `effects`, `win-conditions`, `engine`, `reducer`,
  `history`) — unaffected (P7 adds no logic).

### Manual (to run before declaring P7 done)
1. **Desktop**: open `/play` on a wide screen — the board fills `max-w-2xl`;
   player grid shows 4 columns; status bar spans the same width. Lobby and
   winner screen stay narrow-centered.
2. **Mobile (≤640px)**: player grid is 2 cols; wizard dual-selects (Cupid)
   stack vertically; status-bar badges wrap rather than overflow when there are
   many pending + the icon cluster.
3. **Transitions**: resolve dawn — the day board fades in; eliminate a player —
   the card fades to `opacity-50`/strikethrough; reach gameover — the winner
   banner fades in.
4. **A11y**: with a screen reader / VoiceOver, navigate the board — pending
   count, dead count, and wizard step progress are announced on change; the
   winner is announced on game end; the current wizard step in "All steps"
   reports as current.
5. **Home screen**: "Add to Home Screen" on iOS shows the apple-icon; Android
   install prompt shows the manifest name/icon/theme-color; launching standalone
   opens fullscreen at `/`.
6. **Tab/favicon**: browser tab shows the amber-moon favicon.
