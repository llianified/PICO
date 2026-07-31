# PICO — Pixel Adventure

A mobile-first, pixel-art quest and rewards app. Players complete quests to earn XP,
coins, keys and Rupiah balance, open chests for collectible items, claim achievements,
and withdraw earnings to an Indonesian e-wallet.

> **Project status: front-end prototype.** There is no backend, no authentication and no
> persistence. All state lives in React memory and resets on every page reload. See
> [Current project status](#current-project-status) before planning any work against this
> repository.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js `16.2.6` (App Router) |
| UI runtime | React 19 (`react` / `react-dom` ^19) |
| Language | TypeScript `5.7.3` |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss`, `tw-animate-css` |
| Animation | `motion` v12 |
| Icons | `lucide-react` |
| Primitives | `@base-ui/react`, `shadcn` CLI, `class-variance-authority` |
| Utilities | `clsx`, `tailwind-merge` |
| Analytics | `@vercel/analytics` |
| Package manager | pnpm (`pnpm-lock.yaml`, `pnpm.overrides` pins `hono@4.12.25`) |

No database, ORM, auth library or state-management library is installed. Tailwind v4 is
configured entirely in `app/globals.css` — there is no `tailwind.config.js`.

## Features

Implemented and reachable in the running app:

- **Home** — level/XP header, energy meter, daily streak, and a rewards activity feed
  (empty on a fresh account).
- **Adventure** — quest catalogue across `Story`, `Daily`, `Weekly`, `Event` and `Side`
  tabs, quest detail with reward preview, energy-gated completion, and optional
  in-quest surveys.
- **Inventory** — chest opening (consumes a chest + key), item collection with rarity,
  equipment slots, a coin shop selling keys and chests, and a 12-item inventory cap.
- **Wallet** — balance, transaction history, payment-method connection (GoPay, DANA,
  OVO, ShopeePay) and a withdrawal flow with a `Rp10.000` minimum.
- **Profile** — avatar selection, achievements with claimable rewards, referral modal,
  and a settings sheet (language, theme, notifications, sound).
- **Global overlays** — level-up, reward and achievement celebration modals, plus a
  toast system.

Deliberately disabled: the rewarded sponsor-video quest is filtered out of the
catalogue by `REWARDED_VIDEO_ENABLED = false` in `lib/mock-data.ts`. See
[P0-2](./PICO_PRODUCTION_AUDIT.md#p0-2--watch-sponsor-video-pays-out-without-ever-showing-a-video).

## Folder structure

```
app/
  globals.css              Tailwind v4 config, design tokens, color-scheme
  layout.tsx               Root layout, metadata, viewport
  page.tsx                 Renders <AppShell />
components/
  app-shell.tsx            Tab shell + bottom nav + StoreProvider
  overlays.tsx             Level-up / reward / achievement modals
  pixel-sprite.tsx         Pixel-art sprite renderer
  primitives.tsx           Shared layout & display primitives
  referral-modal.tsx       Referral code sharing
  profile/
    achievements-sheet.tsx
    avatar-sheet.tsx
    settings-sheet.tsx
  screens/
    home-screen.tsx
    adventure-screen.tsx
    inventory-screen.tsx
    wallet-screen.tsx
    profile-screen.tsx
  ui/
    action-button.tsx      Async button with pending/success lifecycle
    button.tsx
    count-up.tsx           Animated number transitions
    modal.tsx              Hand-rolled dialog
    sheet.tsx              Hand-rolled bottom sheet
    skeleton.tsx
    toaster.tsx
  wallet/
    withdraw-sheet.tsx     Amount entry, presets, method selection, confirm
lib/
  mock-data.ts             Types, seed data, reward formulas, feature flags
  store.tsx                Single React Context holding all app state
  utils.ts                 cn() class merger
public/
  pixel/                   avatar.png, chest.png, mascot.png
  icon.svg, icon-*.png, apple-icon.png, placeholder-*
```

27 source files, ~5,000 LOC. `lib/store.tsx` is the largest file at 968 LOC.

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The app is designed for a
`420px`-wide viewport; on desktop it renders inside a centered phone frame.

Type-checking:

```bash
pnpm exec tsc --noEmit
```

> **Note:** `package.json` defines a `lint` script (`eslint .`) but ESLint is **not**
> installed as a dependency, so `pnpm lint` fails. See
> [inconsistencies](./PICO_PRODUCTION_AUDIT.md#appendix--documentation-drift-and-stale-findings).

## Build

```bash
pnpm build
pnpm start
```

Build-time TypeScript checking is enabled — `typescript.ignoreBuildErrors` was removed
from `next.config.mjs` as part of
[P1-5](./PICO_P1_REMEDIATION.md#p1-5--processachievementqueue-exported-through-context-but-absent-from-storevalue),
so type errors now fail the build.

`next.config.mjs` also sets `images.unoptimized: true` and these response headers:
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`X-Frame-Options: SAMEORIGIN`, `Permissions-Policy: camera=(), microphone=(),
geolocation=()`. There is no Content-Security-Policy yet
([P3-9](./PICO_PRODUCTION_AUDIT.md#p3--low)).

## Deployment

Deployed on Vercel. The repository is linked to a v0 project; every merge to `main`
deploys automatically. Feature work happens on branches and lands through pull requests
— see [CONTRIBUTING.md](./CONTRIBUTING.md).

No environment variables are required to run the app, because no external service is
integrated.

## Current project status

Audited on 2026-07-31 at **31 / 100** production readiness, rising to roughly
**41 / 100** after the P0 pass. The score is dominated by the absence of a backend, not
by UI quality (the UI layer alone scores in the 80s).

| Priority | Total | Fixed | Mitigated | Open |
|---|---|---|---|---|
| P0 — Critical | 5 | 3 | 2 | 0 |
| P1 — High | 6 | 3 | 0 | 3 |
| P2 — Medium | 12 | 2 | 0 | 10 |
| P3 — Low | 12 | 0 | 0 | 12 |

Known hard limitations, all confirmed against the current code:

- **No persistence.** Every reload resets XP, level, balance and inventory to seed values.
- **No server authority over money.** `withdraw()` validates and mutates local state only.
  Hardened against client-side minting and double-spend, but not server-verified.
- **No authentication** and no Telegram Mini App integration.
- **Hard-locked to dark mode.** The theme setting is inert
  ([P1-6](./PICO_PRODUCTION_AUDIT.md#p1-6--theme-setting-is-inert-app-is-hard-locked-to-dark)).

Live progress is tracked in [TASKS.md](./TASKS.md); sequencing in
[ROADMAP.md](./ROADMAP.md).

## Documentation index

| Document | Purpose |
|---|---|
| [PICO_PRODUCTION_AUDIT.md](./PICO_PRODUCTION_AUDIT.md) | Full audit: every P0–P3 finding, scores, effort estimates, Telegram and a11y review |
| [PICO_P0_REMEDIATION.md](./PICO_P0_REMEDIATION.md) | Change log for the P0 pass |
| [PICO_P1_REMEDIATION.md](./PICO_P1_REMEDIATION.md) | Change log for P1 fixes, updated incrementally |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Current architecture, state, data flow, limitations, planned backend |
| [ROADMAP.md](./ROADMAP.md) | Phased plan derived from the audit |
| [TASKS.md](./TASKS.md) | Production-readiness checklist by priority |
| [CHANGELOG.md](./CHANGELOG.md) | Keep a Changelog history |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Branch naming, commits, PR checklist, doc requirements |
