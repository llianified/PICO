# PICO — Architecture

Describes the architecture **as it exists today**. Anything not yet built is confined to
[Planned backend](#planned-backend) and is explicitly marked as not implemented.

---

## App structure

A single-route Next.js App Router application. There is exactly one page; navigation is
tab state, not routing.

```
app/layout.tsx      Root layout — fonts, metadata, viewport, <html> tokens
  app/page.tsx      Renders <AppShell /> inside a centering wrapper
    components/app-shell.tsx
      <StoreProvider>          One React Context for all app state
        <Shell>
          <main>               Renders exactly one active screen
          <nav>                Five-tab bottom navigation
          <Toaster />          Toast queue
          <GlobalOverlays />   Level-up / reward / achievement modals
```

`AppShell` holds a `nav` array of five entries, each pairing a `TabId`, label,
`lucide-react` icon and screen component:

| Tab | Screen |
|---|---|
| `home` | `components/screens/home-screen.tsx` |
| `adventure` | `components/screens/adventure-screen.tsx` |
| `inventory` | `components/screens/inventory-screen.tsx` |
| `wallet` | `components/screens/wallet-screen.tsx` |
| `profile` | `components/screens/profile-screen.tsx` |

The active screen is resolved with `nav.find((n) => n.id === tab)!.Screen`. The non-null
assertion is a known fragility ([P3-6](./PICO_PRODUCTION_AUDIT.md#p3--low)).

The shell is a fixed-width phone frame — `mx-auto max-w-[420px] h-dvh` — that becomes a
bordered, rounded card with `md:h-[860px]` on desktop. Safe-area insets are handled
throughout via `env(safe-area-inset-*)` in the shell, sheets, modals and toaster.

**Layered sub-UI.** Sheets and modals are not routes; they are components mounted inside
their parent screen and toggled by local state:

- `components/wallet/withdraw-sheet.tsx` — always mounted inside `WalletScreen`, which is
  why its `methodId` seeding behaves as documented in
  [P1-1's notes](./PICO_P1_REMEDIATION.md#notes).
- `components/profile/{achievements,avatar,settings}-sheet.tsx` — mounted inside
  `ProfileScreen`.
- `components/referral-modal.tsx` — bypasses the shared `Modal`
  ([P2-8](./PICO_PRODUCTION_AUDIT.md#p2-8--referralmodal-is-not-a-modal-and-duplicates-dialog-logic)).

**Shared UI.** `components/ui/` holds `action-button` (async button with
idle → pending → success lifecycle, used for every awaited action), `modal`, `sheet`,
`toaster`, `count-up` (animated numbers), `button` and `skeleton`.
`components/primitives.tsx` and `components/pixel-sprite.tsx` provide layout primitives
and the pixel-art sprite renderer.

**Styling.** Tailwind CSS v4 configured entirely in `app/globals.css` — no
`tailwind.config.js`. Design tokens live in that file; `color-scheme: dark` is hardcoded
there. Animation is `motion` v12, applied directly in components.

---

## State management

**One React Context provider, `StoreProvider` in `lib/store.tsx` (968 LOC), holds all
application state.** There is no Redux, Zustand, Jotai, SWR or React Query. Consumers call
the `useStore()` hook; the exported shape is the `StoreValue` type.

State is a flat collection of ~35 `useState` hooks inside the single provider, grouped by
domain:

| Domain | State |
|---|---|
| Navigation | `tab` |
| Identity | `name`, `avatarId` |
| Progression | `level`, `totalXp`, `levelXp`, `levelXpNeeded`, `questsCompletedTotal`, `daysActive` |
| Streak | `loginDates`, `dailyResetDay` |
| Energy | `energy`, `nextEnergyAt` |
| Money | `balance`, `totalEarned`, `transactions`, `paymentMethods` |
| Quests | `quests` |
| Inventory | `chests`, `keys`, `coins`, `inventoryItems`, `equipped` |
| Achievements | `achievements` |
| Feed | `rewardsFeed` |
| Settings | `language`, `theme`, `notificationsEnabled`, `soundEnabled` |
| Ephemeral UI | `toasts`, `levelUp`, `rewardEvent`, `achievementEvent` |

**Derived state is computed, not stored.** `artifacts`, `badges` and `collectionOwned` are
`useMemo` values over `inventoryItems` and `achievements`. This was the P0-5 fix and is
load-bearing: storing them independently is what allowed the counters to contradict the
inventory, so new counters should follow the same pattern.

**Economy constants are exported from the store**, deliberately co-located with the logic
they guard: `MIN_WITHDRAW = 10000`, `KEY_COST = 800`, `CHEST_COST = 2000`,
`ENERGY_MAX = 30`, `ENERGY_COST = 6`, `ENERGY_REGEN_MS = 90_000`, `INVENTORY_CAP = 12`.

**Error signalling.** `withdraw()` rejects with a typed `WithdrawError` carrying a
`WithdrawErrorCode` (`INVALID_AMOUNT`, `BELOW_MINIMUM`, `INSUFFICIENT_FUNDS`,
`METHOD_UNAVAILABLE`, `IN_FLIGHT`) so the UI can map reasons to copy. Other actions throw
string codes such as `NO_ENERGY` and `VIDEO_UNAVAILABLE`; this inconsistency is noted in
[P2-4](./PICO_PRODUCTION_AUDIT.md#p2-4--chest-opening-bypasses-the-affordability-check-it-appears-to-enforce).

**Known structural weaknesses** (from the audit, still open): the provider is a single
oversized context with no memo splitting, so any state change re-renders every consumer;
timer-based flows (`achievementTimeoutRef`, energy regen) use chained `setTimeout`s whose
cleanup is incomplete ([P3-11](./PICO_PRODUCTION_AUDIT.md#p3--low)).

---

## Data flow

All flows are **client-only**. There is no `fetch`, no route handler, no server action and
no external API call anywhere in the codebase. Async is simulated with `await delay(ms)`.

The canonical write path is:

```
Screen/sheet component
  → useStore() action (lib/store.tsx)
    → validate (throws typed error on rejection)
    → await delay(...)            ← where a server mutation would go
    → re-validate                 ← guards against state changing during the await
    → setState(...) commit
    → side effects: transaction row, rewards-feed entry, toast, overlay event
```

**Quest completion**, the most involved flow: `completeQuest` re-checks the target quest,
consumes energy, awaits, then calls `applyQuestReward`, which grants XP, coins
(`questCoinReward`), keys (`questKeyReward`), money (`questMoneyReward`) and a possible
chest, appends a transaction and a feed entry, and may fire a level-up overlay.
`applyQuestReward` is called **twice in one tick** when the "Complete 3 Quests" bonus
fires, which is the mechanism behind
[P1-3](./PICO_PRODUCTION_AUDIT.md#p1-3--only-the-last-level-up-is-announced-when-several-happen-at-once).

**Withdrawal**, the most hardened flow, follows validate → await → re-validate → commit
with an in-flight guard and an idempotency key, reading live balance and method state
through refs rather than caller-supplied arguments. Full rationale in
[`PICO_P0_REMEDIATION.md`](./PICO_P0_REMEDIATION.md#p0-3--withdrawals-mutate-balance-client-side-with-no-server-authority-or-idempotency).

**Reconciliation helpers** in `lib/mock-data.ts` are applied to quest state rather than
mutating it ad hoc: `reconcileQuestAvailability(quests, level)` unlocks level-gated quests
and `resetDailyQuests(quests)` rolls dailies over when `toDayKey(new Date())` no longer
matches `dailyResetDay`.

**Level curve.** `LEVEL_XP_BASE = 500` with `xpNeededForLevel(level)`; the level-up loop
awards multiple levels per payout but announces only the last.

---

## Mock data

`lib/mock-data.ts` (418 LOC) is the **only** data source. It exports the domain types
(`Quest`, `Transaction`, `PaymentMethod`, `InventoryItem`, `Achievement`, `Avatar`,
`RewardFeedItem`, `SurveyQuestion`), the seed values, the reward formulas and the feature
flag.

Seed state on a fresh session:

| Seed | Value | Note |
|---|---|---|
| `initialQuests` | `questCatalogue` filtered by `REWARDED_VIDEO_ENABLED` | 8 reachable quests: 4 `Daily`, 4 `Story`, 1 `Side` |
| `initialTransactions` | `[]` | |
| `initialInventoryItems` | `[]` | |
| `initialAchievements` | all unclaimed | |
| `initialRewardsFeed` | `[]` | Must stay empty — trust (P0-4) **and** hydration (P0-1) |
| `initialPaymentMethods` | 4 methods, all `connected: false` | GoPay, DANA, OVO, ShopeePay |
| `initialLoginDates` | `makeConsecutiveDays(0)` → `[]` | Obfuscated intent, [P3-3](./PICO_PRODUCTION_AUDIT.md#p3--low) |
| `balance` | `37500` | Set in `lib/store.tsx`, not `mock-data.ts` |
| `chests` / `keys` / `coins` | `2` / `1` / `5000` | Deliberate starter grant so a new player can open one chest |

**Feature flag.** `REWARDED_VIDEO_ENABLED = false` filters every `state: 'video'` quest out
of the catalogue. Do not flip it without an ad provider, a player and a server-verified
completion callback — see
[P0-2](./PICO_P0_REMEDIATION.md#p0-2--watch-sponsor-video-pays-out-without-ever-showing-a-video).

**Shared formulas** exist so the reward *preview* and the reward *grant* cannot disagree:
`questKeyReward(xp)`, `questCoinReward(xp)`, `questMoneyReward(xp)`. The Adventure screen
currently inlines a copy of the key formula instead of calling it
([P2-2](./PICO_PRODUCTION_AUDIT.md#p2-2--key-reward-formula-duplicated-inline-instead-of-using-the-shared-helper)).

Formatting helpers: `formatRp`, `formatCompact`, `formatRelativeTime`.

---

## Current limitations

Confirmed against the current tree. These are architectural, not cosmetic.

1. **No persistence of any kind.** No database, no `localStorage`, no cookies, no session.
   Every reload resets XP, level, balance, inventory and streak to seed values.
2. **No authentication.** No user identity, no accounts, no sessions. `name` and
   `avatarId` are local state.
3. **No server authority over money.** `withdraw()` is hardened but still mutates local
   state after a simulated delay. A user who edits client memory can still influence
   balance; nothing is verified or recorded server-side.
4. **No backend at all** — no route handlers, no server actions, no external requests.
5. **Hard-locked to dark mode.** `setTheme` writes state that nothing consumes;
   `app/globals.css` hardcodes `color-scheme: dark` and `app/layout.tsx` sets
   `colorScheme: 'dark'`. The Language setting is likewise cosmetic — there is no i18n
   layer ([P1-6](./PICO_PRODUCTION_AUDIT.md#p1-6--theme-setting-is-inert-app-is-hard-locked-to-dark)).
6. **No Telegram Mini App integration.** No SDK, no `initData` validation, no
   `ready()`/`expand()`, no `BackButton`/`MainButton`, no haptics. Safe-area handling is
   the only Telegram-friendly piece in place.
7. **Accessibility gaps.** Dialogs have no focus trapping or restoration; `motion` ignores
   `prefers-reduced-motion`; `SegmentedProgress` exposes no `role="progressbar"`; pinch-zoom
   is disabled.
8. **Single-context re-render cost.** Every state change re-renders all consumers.
9. **Content is thin.** 8 reachable quests; the `Weekly` and `Event` tabs are permanently
   empty ([P1-4](./PICO_PRODUCTION_AUDIT.md#p1-4--weekly-and-event-tabs-are-permanently-empty)).
10. **No test suite** and no working linter — the `lint` script calls ESLint, which is not
    installed.

---

## Planned backend

**Not implemented.** Recorded here only to capture intended direction, per the audit's
Phase 2. No provider has been chosen and no dependency for any of this is installed.

The audit specifies:

- **Auth + persistence.** For a Telegram Mini App this means HMAC-verifying `initData`
  server-side, which is the only legitimate way a Mini App authenticates a user.
- **A server-authoritative economy ledger** covering XP, coins, balance and inventory. The
  client value becomes display-only; a client-supplied amount is never trusted.
- **Withdrawal as a real mutation** against that ledger: the server re-derives the balance
  from its own records, validates minimum and sufficiency, and enforces the idempotency
  key. `withdraw()` was deliberately shaped as validate → await → re-validate → commit so
  this becomes swapping the simulated `delay()` for the mutation rather than a rewrite.
- **A rewarded-video provider** with a server-verified completion callback gating
  `completeQuest`, after which `REWARDED_VIDEO_ENABLED` may be flipped.
- **Economy guards moved server-side** alongside the ledger — the chest/key checks of P2-4
  and the energy handling of P2-5 belong there rather than in components.

Sequencing and dependencies are in [`ROADMAP.md`](./ROADMAP.md). Until Phase 2 lands, the
`Persistence & backend` and `Security` audit dimensions cap the overall readiness score
regardless of front-end work.
