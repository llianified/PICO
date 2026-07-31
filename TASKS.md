# Production Readiness Progress

Checklist for every finding in [`PICO_PRODUCTION_AUDIT.md`](./PICO_PRODUCTION_AUDIT.md).
Sequencing and rationale are in [`ROADMAP.md`](./ROADMAP.md).

**17 of 35 fixed · 2 mitigated · 16 open.**

> **Reconciled 2026-08-01.** Five fixes had shipped without being ticked here — P2-9, P3-2,
> P3-5, P3-7 and P3-11 — and the P2/P3 band headings carried counts their own checkboxes did
> not support. Every box below was re-verified against the current tree; the band counts are
> now derived from the boxes.

Legend: `[x]` fixed · `[~]` mitigated (risk reduced, root cause needs a backend) ·
`[ ]` open.

When you complete an item, tick it here **and** update the four documents listed under
[Definition of done](#definition-of-done).

---

## P0

Log: [`PICO_P0_REMEDIATION.md`](./PICO_P0_REMEDIATION.md) · 3 fixed, 2 mitigated.

- [x] **P0-1** — Hydration failure crashes the React tree on every page load
- [~] **P0-2** — "Watch Sponsor Video" pays out without showing a video
  - [x] Hide the quest behind `REWARDED_VIDEO_ENABLED = false` + `VIDEO_UNAVAILABLE` backstop
  - [ ] Integrate a real rewarded-video provider
  - [ ] Gate `completeQuest` on a server-verified completion callback
  - [ ] Only then flip `REWARDED_VIDEO_ENABLED`
- [~] **P0-3** — Withdrawals mutate balance client-side with no server authority
  - [x] Move validation into `withdraw()`; integer/positive checks; ref-based live state
  - [x] Re-validate after the await; in-flight guard; idempotency key; typed `WithdrawError`
  - [ ] Server-authoritative ledger; `withdraw()` becomes a real mutation
- [x] **P0-4** — Seeded "Recent Rewards" feed fabricates rewards
- [x] **P0-5** — Seeded inventory/collection counters contradict the empty inventory

### P0 blockers

- [ ] **Phase 0 architecture decision** — choose the backend; decide if real money is in
      scope. Blocks the remainder of P0-2 and P0-3.
- [ ] Auth + persistence (Telegram: server-side `initData` HMAC verification)
- [ ] Server-authoritative economy ledger: XP, coins, balance, inventory

## P1

Log: [`PICO_P1_REMEDIATION.md`](./PICO_P1_REMEDIATION.md) · 3 of 6 fixed.

- [x] **P1-1** — Withdraw sheet dead-ends when no payment method is connected
- [x] **P1-2** — "Max" button produces a guaranteed-invalid amount below the minimum
- [ ] **P1-3** — Only the last level-up is announced when several happen at once
  - Reuse the existing `achievementQueueRef` / `processAchievementQueue` queue pattern
  - Note `applyQuestReward` runs twice in one tick when the 3-quest bonus fires
- [ ] **P1-4** — Weekly and Event tabs are permanently empty
  - Derive `tabs` from categories present in `quests`, or seed `Weekly`/`Event` quests
- [x] **P1-5** — `processAchievementQueue` exported through context but absent from `StoreValue`
  - [x] Also removed `typescript.ignoreBuildErrors` from `next.config.mjs`
- [ ] **P1-6** — Theme setting is inert; app is hard-locked to dark
  - Needs light-mode tokens across every component, or remove the Theme/Language rows
  - Do not toast success for a no-op

## P2

Log: [`PICO_P2_REMEDIATION.md`](./PICO_P2_REMEDIATION.md) · 5 of 12 fixed — P2-10 and P2-11
incidentally during the P0 pass; P2-2, P2-3 and P2-9 addressed in recent commits.

- [ ] **P2-1** — Quest reward preview omits coins that are actually granted
- [x] **P2-2** — Key reward formula duplicated inline instead of using `questKeyReward()`
  - Quest detail preview now derives keys from `questKeyReward(quest.xpValue)` via commit `08ef31a`
- [x] **P2-3** — Progress bar shows 50% while the label reads "0 / 1"
  - Bar and label now derive from one `{ current, total }` value via commit `a8adc46`
- [ ] **P2-4** — Chest opening bypasses the affordability check it appears to enforce
  - Do this *with* the server ledger, not before it
- [ ] **P2-5** — Energy consumed even when the quest turns out to be uncompletable
  - Do this *with* the server ledger, not before it
- [ ] **P2-6** — Energy economy allows only 5 quests, then a 9-minute wall
- [ ] **P2-7** — Modals lack focus trapping and focus restoration
  - ⚠️ The audit's suggested fix names `@radix-ui/react-dialog`, which is **no longer
    installed**. Re-decide the vehicle (`@base-ui/react` is present).
- [ ] **P2-8** — `ReferralModal` is not a modal and duplicates dialog logic
- [x] **P2-9** — `navigator.clipboard` used without a fallback or error handling
  - `copyText()` guards the async API, falls back to `execCommand`, returns a boolean; the
    success toast is now unreachable on a failed copy — commit `aae448d`
- [x] **P2-10** — Achievement counters can display a claim state that overruns the total
  - Closed by P0-5: `badges` is now derived from `achievements`
- [x] **P2-11** — Two parallel "time ago" implementations, one unused
  - Closed by P0-1: `TimeAgoDisplay` now calls the shared `formatRelativeTime`
- [ ] **P2-12** — Per-item interval timers in the rewards feed
  - Scope widened by the P3-5 fix: `UnlockedAtLabel` adds the same per-item interval to the
    Inventory screen. One shared ticker must now cover both screens.

## P3

Log: [`PICO_P3_REMEDIATION.md`](./PICO_P3_REMEDIATION.md) · 6 of 12 fixed — P3-2, P3-3, P3-5,
P3-6, P3-7 and P3-11.

- [ ] **P3-1** — Unused dependencies shipped
  - ⚠️ Largely obsolete: six of the seven named packages are no longer installed. Only
    `class-variance-authority` remains. Verify before acting.
  - Now a one-line prune: P3-2 deleted `components/ui/button.tsx`, which was that package's
    only consumer.
- [x] **P3-2** — Dead code (unused imports, unreferenced `button`/`Skeleton`, unreachable `DEFAULT_SURVEY` fallback)
  - Commit `5f8ad7c`: `button.tsx` deleted, `Skeleton` unexported and `SkeletonCard` removed,
    `DEFAULT_SURVEY` replaced with `?? []`, unused mock helpers and the `ENERGY_MAX` import gone
  - The `store.tsx` imports the audit suspected (`Avatar`, `formatRp`, `formatCompact`,
    `avatars`) were re-checked and are all in fact used — nothing to prune there
  - Residue, knowingly left: `SkeletonRow` is still exported and unreferenced, since no screen
    has a loading state yet. Delete the file if the backend work does not adopt it.
- [x] **P3-3** — `initialLoginDates = makeConsecutiveDays(0)` always returns `[]`
  - Now the literal `[]` via commit `ec436aa`; `makeConsecutiveDays` was left unused and has
    since been deleted by P3-2 (`5f8ad7c`)
- [ ] **P3-4** — Hardcoded "Good Evening" greeting
  - Must resolve after mount, or it reintroduces P0-1
- [x] **P3-5** — `unlockedAt: 'Just now'` frozen as a string
  - Field is now `number`, stamped `Date.now()` in `openChest`, formatted after mount by
    `UnlockedAtLabel` via the shared `formatRelativeTime` — commit `1399020`
  - Adds per-item timers on the Inventory screen; folded into P2-12 rather than solved twice
- [x] **P3-6** — Non-null assertion on nav lookup (`nav.find(...)!.Screen`)
  - Falls back to `nav[0]` via commits `3cf3136` and `ec436aa`
- [x] **P3-7** — Redundant `onAction` / `onClick` prop aliases on `ActionButton`
  - `onClick` and the `handler = onAction ?? onClick` indirection removed; `AvatarSheet` and
    `SettingsSheet` migrated to `onAction` — commit `4c9196e`
- [ ] **P3-8** — `CountUp` cleanup writes `fromRef.current = to` on interrupted animations
- [ ] **P3-9** — No Content-Security-Policy
  - Ship report-only first, then enforce
  - The other baseline headers (nosniff, Referrer-Policy, X-Frame-Options,
    Permissions-Policy) already exist in `next.config.mjs`; only the CSP is missing
- [ ] **P3-10** — `userScalable: false` / `maximumScale: 1` blocks pinch-zoom
  - Depends on the Telegram decision (Phase 0)
- [x] **P3-11** — Achievement modal queue timers not cleared on unmount
  - The 300ms gap timer got its own `achievementGapTimeoutRef` — the original ref doubles as
    the "queue is draining" flag and could not hold both — plus a mounted guard in
    `processAchievementQueue` and a cleanup effect clearing both handles — commit `375d6ec`
- [ ] **P3-12** — `md:h-[860px]` fixed desktop frame can clip content

## Accessibility

Listed in the audit's summary rather than as numbered findings.

- [ ] `prefers-reduced-motion` respected across all `motion` animations
- [ ] `role="progressbar"` + `aria-valuenow` on `SegmentedProgress`
- [ ] Tap targets at 44×44px (toast dismiss `h-6 w-6`, sheet close `h-5 w-5`)
- [ ] Keyboard access for the `motion.div` achievement row in `profile-screen.tsx`
- [ ] Focus trapping and restoration in dialogs (tracked as P2-7)

## Telegram Mini App

Only if targeted — depends on the Phase 0 decision. Nothing is implemented.

- [ ] Load `telegram-web-app.js`
- [ ] `ready()` / `expand()` lifecycle
- [ ] `initData` HMAC validation server-side (the only real auth path for a Mini App)
- [ ] `themeParams` support — blocked by P1-6
- [ ] `BackButton` and `MainButton`
- [ ] `HapticFeedback`
- [ ] Closing confirmation so in-progress withdraw state is not lost
- [x] Safe-area insets — already handled correctly in shell, sheet, modal, toaster

## Tooling

Discovered during the 2026-08-01 documentation audit; not in the original findings.

- [ ] **Broken `lint` script** — `package.json` defines `"lint": "eslint ."` but ESLint is
      not in `devDependencies`, so `pnpm lint` fails. Install and configure ESLint, or
      remove the script.
- [ ] No test suite exists — no runner, no tests
- [ ] Keep the audit's environment facts current (it still cites Next.js 15.2.4; the repo
      is on 16.2.6)

---

## Definition of done

Every fix must also update, per [`CONTRIBUTING.md`](./CONTRIBUTING.md):

1. [`CHANGELOG.md`](./CHANGELOG.md) — under `## Unreleased`
2. This file — tick the item
3. The relevant remediation log — `PICO_P0_REMEDIATION.md`, `PICO_P1_REMEDIATION.md` or
   `PICO_P2_REMEDIATION.md`
4. [`PICO_PRODUCTION_AUDIT.md`](./PICO_PRODUCTION_AUDIT.md) — inline **Status** line and the
   status summary table, keeping the original finding intact
