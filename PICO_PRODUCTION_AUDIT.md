# PICO — Production Readiness Audit

**Repository:** `llianified/pico`
**Branch audited:** `main`
**Date:** 2026-07-31

**Scope:** 25 source files / ~4,700 LOC. Next.js 15.2.4, React 19, Tailwind v4, `motion` v12, single-page tab shell, all state in one React Context (`lib/store.tsx`, 859 LOC).

**Verification method:** static review + `tsc --noEmit` (passes clean) + live browser walkthrough of quest → reward → wallet → withdraw → inventory flows at 384×639.

> No files were modified during the audit itself. This document was the only artifact added.

> **Remediation update — 2026-07-31, branch `production-audit-remediation`.** All five P0 items have since been addressed on the front end. P0-1, P0-4 and P0-5 are fully closed. P0-2 and P0-3 are **mitigated, not closed** — they cannot be genuinely fixed without a backend, so the fraud and free-money paths were removed rather than the underlying architecture changed. Per-issue status is recorded inline below; the full change log is in [`PICO_P0_REMEDIATION.md`](./PICO_P0_REMEDIATION.md).

> **Remediation update — P1 pass, in progress.** P1 items are being fixed individually rather than as one batch. Per-issue status is recorded inline below; the change log is in [`PICO_P1_REMEDIATION.md`](./PICO_P1_REMEDIATION.md).

---

## Status summary

Status as of 2026-08-01. Legend: ✅ Fixed · ⚠️ Mitigated (risk reduced, root cause requires a backend) · ⬜ Open.

| Priority | Total | ✅ Fixed | ⚠️ Mitigated | ⬜ Open | Remediation log |
|---|---|---|---|---|---|
| P0 — Critical | 5 | 3 | 2 | 0 | [`PICO_P0_REMEDIATION.md`](./PICO_P0_REMEDIATION.md) |
| P1 — High | 6 | 3 | 0 | 3 | [`PICO_P1_REMEDIATION.md`](./PICO_P1_REMEDIATION.md) |
| P2 — Medium | 12 | 3 | 0 | 9 | [`PICO_P2_REMEDIATION.md`](./PICO_P2_REMEDIATION.md) |
| P3 — Low | 12 | 0 | 0 | 12 | — |
| **Total** | **35** | **9** | **2** | **24** | |

| Issue | Title | Status | Detail |
|---|---|---|---|
| P0-1 | Hydration failure crashes the React tree | ✅ Fixed | [log](./PICO_P0_REMEDIATION.md#p0-1--hydration-failure-crashes-the-react-tree-on-every-page-load) |
| P0-2 | Sponsor video pays out without showing a video | ⚠️ Mitigated | [log](./PICO_P0_REMEDIATION.md#p0-2--watch-sponsor-video-pays-out-without-ever-showing-a-video) |
| P0-3 | Withdrawals have no server authority | ⚠️ Mitigated | [log](./PICO_P0_REMEDIATION.md#p0-3--withdrawals-mutate-balance-client-side-with-no-server-authority-or-idempotency) |
| P0-4 | Seeded rewards feed fabricates rewards | ✅ Fixed | [log](./PICO_P0_REMEDIATION.md#p0-4--seeded-recent-rewards-feed-fabricates-rewards-the-player-never-earned) |
| P0-5 | Seeded counters contradict empty inventory | ✅ Fixed | [log](./PICO_P0_REMEDIATION.md#p0-5--seeded-inventorycollection-counters-contradict-the-empty-inventory) |
| P1-1 | Withdraw sheet dead-ends without a method | ✅ Fixed | [log](./PICO_P1_REMEDIATION.md#p1-1--withdraw-sheet-dead-ends-when-no-payment-method-is-connected) |
| P1-2 | "Max" produces an invalid amount | ✅ Fixed | [log](./PICO_P1_REMEDIATION.md#p1-2--max-button-produces-a-guaranteed-invalid-amount-below-the-minimum) |
| P1-3 | Only the last level-up is announced | ⬜ Open | — |
| P1-4 | Weekly and Event tabs permanently empty | ⬜ Open | — |
| P1-5 | `processAchievementQueue` type/value drift | ✅ Fixed | [log](./PICO_P1_REMEDIATION.md#p1-5--processachievementqueue-exported-through-context-but-absent-from-storevalue) |
| P1-6 | Theme setting inert; locked to dark | ⬜ Open | — |
| P2-1, P2-3 … P2-9, P2-12 | See [P2 — Medium](#p2--medium) | ⬜ Open | — |
| P2-2 | Key reward formula duplicated inline | ✅ Fixed | [log](./PICO_P2_REMEDIATION.md#p2-2--key-reward-formula-duplicated-inline-instead-of-using-the-shared-helper) |
| P2-10 | Achievement counters can overrun the total | ✅ Fixed | Incidental — see [appendix](#appendix--documentation-drift-and-stale-findings) |
| P2-11 | Two parallel "time ago" implementations | ✅ Fixed | Incidental — see [appendix](#appendix--documentation-drift-and-stale-findings) |
| P3-1 … P3-12 | See [P3 — Low](#p3--low) | ⬜ Open | P3-1 partly obsolete — see [appendix](#appendix--documentation-drift-and-stale-findings) |

Progress is tracked as a checklist in [`TASKS.md`](./TASKS.md) and sequenced in [`ROADMAP.md`](./ROADMAP.md).

---

## Table of contents

- [Status summary](#status-summary)
- [Architectural reality check](#architectural-reality-check)
- [P0 — Critical](#p0--critical)
- [P1 — High](#p1--high)
- [P2 — Medium](#p2--medium)
- [P3 — Low](#p3--low)
- [Telegram Mini App compatibility](#telegram-mini-app-compatibility)
- [Responsiveness & accessibility summary](#responsiveness--accessibility-summary)
- [1. Overall production readiness score](#1-overall-production-readiness-score)
- [2. Estimated effort to fix](#2-estimated-effort-to-fix)
- [3. Suggested order of implementation](#3-suggested-order-of-implementation)
- [Appendix — documentation drift and stale findings](#appendix--documentation-drift-and-stale-findings)

---

## Architectural reality check

Before the issue list, the single most important finding:

> **This is a front-end prototype, not a production app.** There is no backend, no auth, no persistence, and no server-side validation. `lib/mock-data.ts` is the only data source; all economy state lives in `useState` inside one provider. `@supabase/ssr` and `@supabase/supabase-js` are installed but **never imported anywhere**.

Consequences that make "production readiness" partly a category question rather than a bug list:

- **All progress is lost on refresh.** No `localStorage`, no DB. Every reload resets XP, balance, level, and inventory to the seed values. Verified: reloading returned the account to Level 1 / 0 XP.
- **The wallet pays out real Rupiah with zero server authority.** `withdraw()` is `await delay(1600)` then `setBalance(prev => prev - amount)`. Any user can edit client state and "withdraw" arbitrary amounts.

Everything below is real and worth fixing, but items P0-2 and P0-3 in particular cannot be genuinely fixed without a backend.

---

## P0 — Critical

### P0-1 · Hydration failure crashes the React tree on every page load

- **Status:** ✅ **Fixed.** `initialRewardsFeed` is now `[]`, so no `Date.now()` runs at module scope. `TimeAgoDisplay` renders a stable `—` placeholder on the first pass and resolves the real label in `useEffect` after mount. Verified live: the console is clean and the `nextjs-portal` overlay is gone.
- **Severity:** P0
- **Files:** `lib/mock-data.ts:398,406,414` (`initialRewardsFeed`), `components/screens/home-screen.tsx:120`
- **Root cause:** `initialRewardsFeed` calls `Date.now()` at **module scope**. The server evaluates it at request time and the client re-evaluates it at hydration time, producing different `createdAt` values. `TimeAgoDisplay` renders those into text, so server HTML and client HTML disagree.
- **Current behavior:** Verified live — Next.js reports `Recoverable Error: Hydration failed because the server rendered text didn't match the client`. React discards the server tree and re-renders the whole app on the client. A `nextjs-portal` error overlay covers the bottom-left UI in development and intercepts clicks on the nav bar.
- **Expected behavior:** No hydration mismatch; server and client markup identical.
- **Recommended fix:** Never derive timestamps at module scope. Either store fixed relative offsets and resolve them to absolute times inside a `useEffect` after mount, or render the time-ago label only after mount (`const [mounted, setMounted] = useState(false)`). The same applies to the hardcoded `"Good Evening,"` greeting (`home-screen.tsx:120`) if it is ever made time-based.
- **Risk if unfixed:** Full client re-render on every load (measurable TTI cost), dev overlay blocking interaction, and this class of bug escalates to blank screens in production when the mismatch lands inside a Suspense boundary.

### P0-2 · "Watch Sponsor Video" pays out without ever showing a video

- **Status:** ⚠️ **Mitigated — the payout path is removed, the feature is not built.** A `REWARDED_VIDEO_ENABLED` flag (default `false`) filters every `state: 'video'` quest out of the catalogue, so the quest is no longer reachable, and `startQuest` throws `VIDEO_UNAVAILABLE` as a backstop if one ever does reach the store. **No ad provider, player, or server-verified completion callback exists.** Do not flip the flag until all three are in place — flipping it alone restores the original fraud.
- **Severity:** P0
- **Files:** `components/screens/adventure-screen.tsx:330-352`, `lib/mock-data.ts:137-147`
- **Root cause:** `state: 'video'` only changes the button *label* to "Watch Video". `handleStart` calls the same `startQuest()` as any other quest; there is no player, no ad SDK, no completion callback, no watch-duration gate.
- **Current behavior:** Verified live — tapping "Watch Video" flips the quest to `active` and immediately renders "Complete Quest". Tapping that grants +Rp200, +50 XP, +1 Key. No video is ever displayed.
- **Expected behavior:** Reward is granted only after a verified full view, confirmed by the ad provider's completion callback.
- **Recommended fix:** Integrate a real rewarded-video provider and gate `completeQuest` on its server-verified completion signal. Until then this quest should be hidden rather than shipped.
- **Risk if unfixed:** This is **advertising fraud** if any sponsor is billed for these "views," and it is free money for users. Also breaks sponsor contracts and app-store ad-network policies.

### P0-3 · Withdrawals mutate balance client-side with no server authority or idempotency

- **Status:** ⚠️ **Hardened — still client-authoritative.** Validation moved out of the sheet and into `withdraw()` next to the ledger it guards: `MIN_WITHDRAW` now lives in `lib/store.tsx`, amounts must be positive finite integers, balance and payment-method checks read live state via refs (never caller-supplied values), rules are re-checked *after* the await, an in-flight guard blocks concurrent submits, and an idempotency key makes a retry of the same attempt a no-op. Rejections surface as a typed `WithdrawError`. **This removes the mint/double-spend paths but is not server authority** — a determined user can still edit client memory. Closing this requires the Phase 2 ledger.
- **Severity:** P0
- **Files:** `lib/store.tsx:469-486`, `components/wallet/withdraw-sheet.tsx:52-76`
- **Root cause:** `withdraw()` performs no server call. It resolves a fake delay, then subtracts from local state. All validation (`MIN_WITHDRAW`, balance check) lives in the client component and is trivially bypassed. There is no idempotency key, so a retry double-spends.
- **Current behavior:** Balance decrements locally and a "completed" transaction is appended. Nothing is persisted; a refresh restores the spent balance.
- **Expected behavior:** Client posts an intent; the server re-derives the balance from its own ledger, validates minimum/sufficiency, enforces an idempotency key, and returns the authoritative new balance.
- **Recommended fix:** Move the ledger server-side and make `withdraw` a mutation against it. Treat the client value as display-only. Never trust a client-supplied amount.
- **Risk if unfixed:** Direct financial loss. A user can mint balance by editing memory and repeatedly cash out; a network retry can pay twice.

### P0-4 · Seeded "Recent Rewards" feed fabricates rewards the player never earned

- **Status:** ✅ **Fixed.** `initialRewardsFeed = []` with a comment recording both reasons it must stay empty (trust *and* the hydration bug in P0-1). Home renders a new `EmptyRewards` state — "No rewards yet" plus a "Start a quest" button routing to Adventure. Verified live on a fresh account: Home and Wallet no longer contradict each other.
- **Severity:** P0 (data integrity / trust)
- **Files:** `lib/mock-data.ts:391-415`, consumed at `components/screens/home-screen.tsx:196-224`
- **Root cause:** `initialRewardsFeed` ships three hardcoded fake entries, contradicting the genuinely-empty `initialTransactions`, `initialInventoryItems`, and zeroed XP.
- **Current behavior:** Verified live on a fresh account — Home shows Level 1, **0 XP**, and a feed claiming *"Quest Completed +150 XP"*, *"Chest Opened — Legendary Sword"*, and *"Money Earned +5,000 Rp"*. The Wallet simultaneously and correctly shows `Rp200` / one transaction. The two screens directly contradict each other.
- **Expected behavior:** The feed is derived purely from real events; a new account shows an empty state.
- **Recommended fix:** Set `initialRewardsFeed = []` and add an empty state to the Home feed section (the pattern already exists in `EmptyTransactions`/`EmptyInventory`).
- **Risk if unfixed:** Users see rewards they didn't get and money that isn't in their wallet — a direct trust and support-ticket problem, and arguably deceptive for a real-money app.

### P0-5 · Seeded inventory/collection counters contradict the empty inventory

- **Status:** ✅ **Fixed.** `artifacts`, `badges` and `collectionOwned` are no longer stored — they are `useMemo` values derived from `inventoryItems` and `achievements`, so drift is now structurally impossible rather than merely corrected. The `setArtifacts`/`setBadges`/`setCollectionOwned` calls in `claimAchievement`, the achievement queue, and `openChest` were removed. `chests=2, keys=1, coins=5000` are kept as a deliberate, documented starter grant so a new player can open their first chest. Verified live: Artifacts 0, Badges 0, Collections 0 / 48 above the empty inventory.
- **Severity:** P0 (data integrity)
- **Files:** `lib/store.tsx:232-239`
- **Root cause:** Hardcoded starting state `chests=2, keys=1, coins=5000, artifacts=1, badges=1, collectionOwned=12` while `initialInventoryItems = []` and `initialAchievements` are all unclaimed.
- **Current behavior:** Verified live — Inventory reads *"Collection Progress 25%"*, *"Collections 12 / 48"*, *"Artifacts 1"*, *"Badges 1"* directly above *"Nothing unlocked yet — Open a chest to discover your first item."* `badges=1` also contradicts zero claimed achievements.
- **Expected behavior:** Counters derive from actual owned items; a new account starts consistent (whether at zero or at a deliberate, coherent starter grant).
- **Recommended fix:** Derive `artifacts`/`badges`/`collectionOwned` from `inventoryItems` and `achievements` rather than storing them independently. If a starter grant is intended, seed the corresponding items so the numbers agree.
- **Risk if unfixed:** The inventory economy is visibly incoherent, and `collectionOwned` can drift from reality indefinitely since nothing reconciles them.

---

## P1 — High

### P1-1 · Withdraw sheet dead-ends when no payment method is connected

- **Status:** ✅ **Fixed.** The empty state keeps its dashed container, `Plus` icon and copy, and now also renders one real `ActionButton` per unconnected method that calls `connectPaymentMethod(m.id)` inline — no need to leave the sheet. Crucially it also calls `setMethodId(m.id)`: `methodId` is only seeded on mount, so connecting without selecting would have moved the dead-end one step later ("Select a payment method", Continue still disabled). Reuses the existing `ActionButton` for the Connecting/Connected lifecycle, so no new UI patterns were introduced. Verified live at 384×639 end-to-end.
- **Severity:** P1
- **Files:** `components/wallet/withdraw-sheet.tsx:160-168`
- **Root cause:** The empty branch renders static text *"Connect a payment method first."* with a decorative `Plus` icon that is **not a button** and has no handler. The connect flow only exists on the Wallet screen behind "Manage".
- **Current behavior:** Verified live — with zero methods connected (the default; all four ship `connected: false`), the withdraw sheet shows an unactionable message and a permanently disabled Continue. The user must guess to close the sheet and find "Manage".
- **Expected behavior:** The empty state offers an inline "Connect a payment method" action, or deep-links to the manage sheet.
- **Recommended fix:** Make the empty state a real button that opens the manage sheet (or inlines `connectPaymentMethod`).
- **Risk if unfixed:** The primary monetization flow — cashing out — is blocked for every new user at first attempt.

### P1-2 · "Max" button produces a guaranteed-invalid amount below the minimum

- **Status:** ✅ **Fixed.** "Max" now carries `disabled={balance < MIN_WITHDRAW}`, matching the `disabled={q > balance}` condition the `QUICK` presets already used, so the control can no longer fill an amount the validator will reject. The helper line below the presets swaps from the generic *"Minimum Rp10.000. No fees on withdrawals."* to *"Rp9.800 more to withdraw. Minimum Rp10.000."* whenever `balance < MIN_WITHDRAW`, so the disabled state explains itself and quantifies the shortfall instead of leaving the user to guess. Design, layout and the existing error slot are unchanged; no withdraw business logic was touched. Verified live at `Rp200` (Max inert, hint shown) and at `Rp37.500` (Max fills the full balance, `aria-invalid=false`, Continue enabled).
- **Severity:** P1
- **Files:** `components/wallet/withdraw-sheet.tsx:139-147`
- **Root cause:** Unlike the `QUICK` presets (which carry `disabled={q > balance}`), "Max" has no disabled condition and blindly sets `amount = balance`. When `balance < MIN_WITHDRAW` this is always invalid.
- **Current behavior:** Verified live at `Rp200` balance — tapping "Max" fills `200` and immediately shows the error *"Minimum withdrawal is Rp10.000."* The control's only effect is to create an error.
- **Expected behavior:** "Max" is disabled when `balance < MIN_WITHDRAW`, ideally with a hint about how much more is needed.
- **Recommended fix:** Add `disabled={balance < MIN_WITHDRAW}` and surface a "Rp9.800 more to withdraw" affordance.
- **Risk if unfixed:** Users below the threshold — i.e. all new users — hit a confusing self-inflicted error on the money screen.

### P1-3 · Only the last level-up is announced when several happen at once

- **Severity:** P1
- **Files:** `lib/store.tsx:416-448`
- **Root cause:** The `while (xp >= needed)` loop overwrites `newLevel` each iteration and fires a single `setLevelUp({ level: newLevel })`. Additionally, `completeQuest` calls `applyQuestReward` **twice** in the same tick when the "Complete 3 Quests" bonus fires (`store.tsx:599-603`), so the second `addXp` overwrites the first modal's pending state.
- **Current behavior:** Skipping from level 1 to level 4 in one payout shows one modal ("4"); the intermediate level-ups are silently swallowed. Simulated the reducer: a quest+bonus in one tick yields one modal, not two.
- **Expected behavior:** Each level gained is acknowledged, or a single consolidated "Level 1 → 4" modal is shown.
- **Recommended fix:** Collect gained levels into an array and drive a queue — the file already has this exact pattern in `achievementQueueRef`/`processAchievementQueue`. Reuse it.
- **Risk if unfixed:** The core progression reward — the level-up moment — is lost precisely on the biggest, most exciting payouts.

### P1-4 · Weekly and Event tabs are permanently empty

- **Severity:** P1
- **Files:** `components/screens/adventure-screen.tsx:13`, `lib/mock-data.ts:100-198`
- **Root cause:** `tabs` advertises five categories but `initialQuests` contains only `Daily`, `Side`, and `Story`. No quest has `category: 'Weekly'` or `'Event'`.
- **Current behavior:** Verified live — the Weekly tab (and Event) shows "No quests here yet" with no path to content, permanently.
- **Expected behavior:** Either ship Weekly/Event quests or hide tabs with no content.
- **Recommended fix:** Derive the tab list from the categories actually present in `quests`, or seed the missing categories.
- **Risk if unfixed:** 40% of the primary content navigation is dead, reading as a broken or abandoned app.

### P1-5 · `processAchievementQueue` is exported through context but absent from the `StoreValue` type

- **Status:** ✅ **Fixed.** `processAchievementQueue` was removed from the context value object and from the `useMemo` dependency array in `lib/store.tsx`, so the exported value now matches `StoreValue` exactly. The function itself is unchanged and still used internally by `unlockAchievementProgress`; grep confirmed no consumer ever read it off the context, so behavior is identical. Separately, `typescript.ignoreBuildErrors` was removed from `next.config.mjs` — `tsc --noEmit` was already clean, so type errors now fail the build instead of shipping silently. Verified with `pnpm build` (TypeScript step runs and passes).
- **Severity:** P1 (maintainability / type safety)
- **Files:** `lib/store.tsx:74-162` (type), `768`, `829`
- **Root cause:** The function is added to the context object and dependency array but never declared in the `StoreValue` type. It passes `tsc` only because the object is contextually typed rather than checked for excess properties through a fresh literal assignment — and `next.config.mjs` sets `typescript.ignoreBuildErrors: true`, removing the safety net entirely.
- **Current behavior:** An internal scheduling primitive is silently part of the public store surface. Any consumer calling it would corrupt the achievement queue, and the type gives no warning.
- **Expected behavior:** Internal helpers stay internal; the exported type matches the exported value exactly.
- **Recommended fix:** Remove it from the context value and both dependency arrays. Separately, **turn off `ignoreBuildErrors`** — it currently hides all type regressions from CI.
- **Risk if unfixed:** Type contract silently drifts from runtime; with `ignoreBuildErrors` on, genuine type errors ship undetected.

### P1-6 · Theme setting is inert; app is hard-locked to dark

- **Severity:** P1
- **Files:** `components/profile/settings-sheet.tsx:143-165`, `lib/store.tsx:250,702`, `app/globals.css:31`, `app/layout.tsx:31`
- **Root cause:** `setTheme` writes a string to state and nothing consumes it. There is no `dark` class toggle, no `documentElement` mutation, no `next-themes`. `globals.css` hardcodes `color-scheme: dark` and the viewport hardcodes `colorScheme: 'dark'`.
- **Current behavior:** Selecting "Light" shows a success toast *"Theme set to Light"* and changes nothing. Same for Language — all four options are cosmetic; there is no i18n layer at all.
- **Expected behavior:** Either the setting works, or it isn't offered.
- **Recommended fix:** Wire theme to a real provider and add light-mode tokens, or remove the Theme/Language rows until implemented. Do not toast success for a no-op.
- **Risk if unfixed:** Settings actively lie to users; a light-mode user in a bright environment has no recourse. Note the preview is currently requested in light mode and the app ignores it.

---

## P2 — Medium

### P2-1 · Quest reward preview omits coins that are actually granted

- **Files:** `components/screens/adventure-screen.tsx:213-260`, `lib/store.tsx:532-549`
- **Root cause:** The detail screen lists money, XP, keys, and "Chance of a Chest" but never coins, even though `applyQuestReward` grants `questCoinReward(xp)` (300 coins for a 500 XP quest). The completion toast also omits coins.
- **Current behavior:** Users silently receive a currency that the preview never promised.
- **Recommended fix:** Add a coins row using the shared `questCoinReward()` helper (it exists precisely so preview and grant agree) and include coins in the toast.
- **Risk:** Coins feel arbitrary; the shop's purpose is obscured.

### P2-2 · Key reward formula duplicated inline instead of using the shared helper

> **Status — ✅ Fixed, 2026-08-01.** The quest detail screen now derives `keyReward` from `questKeyReward(quest.xpValue)` and pluralizes from that value, so the preview cannot drift from what `applyQuestReward` grants. Reward values are unchanged (500 XP → 2 Keys, below 500 XP → 1 Key), verified in the browser at 384×639. The original finding is preserved below.

- **Files:** `components/screens/adventure-screen.tsx:245-247` vs `lib/mock-data.ts:277-279`
- **Root cause:** The JSX inlines `quest.xpValue >= 500 ? 2 : 1` — a copy of `questKeyReward()`. The file's own comment says these helpers exist "so the numbers always agree."
- **Recommended fix:** Call `questKeyReward(quest.xpValue)`.
- **Risk:** The two will diverge the first time the formula is tuned.

### P2-3 · Progress bar shows 50% while the label reads "0 / 1"

- **Files:** `components/screens/adventure-screen.tsx:137-143`
- **Root cause:** For quests without a `progress` object, `progressPct` falls back to a magic `50` for `active` state, while the adjacent label independently prints `0 / 1`.
- **Current behavior:** Verified live on the sponsor-video quest — half-filled bar labelled "0 / 1".
- **Recommended fix:** Make the numeric label and the bar read from one source.
- **Risk:** Users distrust progress indicators.

### P2-4 · Chest opening bypasses the affordability check it appears to enforce

- **Files:** `lib/store.tsx:618-653`, `components/screens/inventory-screen.tsx:49-77`
- **Root cause:** Chest/key sufficiency is checked **only** in the component before calling. `openChest()` itself re-validates *inventory cap* after the delay but not chest/key counts, then does `setChests(c => Math.max(0, c - 1))` — silently clamping instead of failing. Two rapid triggers can consume one chest twice.
- **Recommended fix:** Move chest/key validation inside `openChest` alongside the existing cap re-check, and throw `NO_CHEST`/`NO_KEY` like the `NO_ENERGY` precedent.
- **Risk:** Inconsistent guard style; state can drift under rapid input.

### P2-5 · Energy is consumed even when the quest turns out to be uncompletable

- **Files:** `lib/store.tsx:551-564`
- **Root cause:** `consumeEnergy(ENERGY_COST)` runs *before* the delay and before the `!target || target.state === 'done'` guard. On that early return it hands back a zeroed reward but the energy is already gone.
- **Recommended fix:** Validate the target first, or refund on the early-return path.
- **Risk:** Users lose 6 of 30 energy (a 20% tank, ~9 minutes of regen) for nothing.

### P2-6 · Energy economy allows only 5 quests, then a 9-minute wall

- **Files:** `lib/store.tsx:64-67`
- **Root cause:** `ENERGY_MAX=30`, `ENERGY_COST=6`, `ENERGY_REGEN_MS=90_000`. Computed: 5 completions from full, 45 minutes for a full refill.
- **Current behavior:** There are only 8 quests total, so a user exhausts the content and hits the energy wall almost immediately, with no way to buy energy (the shop sells only keys and chests).
- **Recommended fix:** Retune, or add energy to the coin shop so the 5,000 starting coins have a progression purpose.
- **Risk:** New-user session ends abruptly in a forced wait — a severe retention problem for a first session.

### P2-7 · Modals lack focus trapping and focus restoration

- **Files:** `components/ui/modal.tsx`, `components/ui/sheet.tsx`, `components/referral-modal.tsx`
- **Root cause:** Hand-rolled dialogs set `role="dialog"`/`aria-modal` and handle Escape, but never trap Tab, never move focus into the dialog on open, and never restore it on close. Background content stays reachable to screen readers and keyboards. `@radix-ui/react-dialog` **is already a dependency** and is unused.
- **Recommended fix:** Rebuild these on the installed Radix Dialog primitive, which handles focus, trapping, and `aria-hidden` correctly.
- **Risk:** Keyboard and screen-reader users can tab into hidden content behind the overlay; fails WCAG 2.4.3.

### P2-8 · `ReferralModal` is not a modal and duplicates dialog logic

- **Files:** `components/referral-modal.tsx`
- **Root cause:** Bypasses the shared `Modal` entirely — bare `if (!isOpen) return null`, so no `AnimatePresence` exit animation (its `exit` prop never runs), no Escape handling, no `role="dialog"`, and it uses raw `bg-black/50` instead of design tokens.
- **Recommended fix:** Render it through the shared `Modal`.
- **Risk:** Inconsistent behavior/animation and an inaccessible dialog.

### P2-9 · `navigator.clipboard` used without a fallback or error handling

- **Files:** `components/referral-modal.tsx:24-30`
- **Root cause:** Calls `navigator.clipboard.writeText(...)` without awaiting or catching, then unconditionally shows *"Copied to clipboard!"*. The API is undefined on non-secure origins and rejects when permission is denied.
- **Recommended fix:** `await` inside try/catch; only toast success on resolve; provide a select-the-text fallback.
- **Risk:** Unhandled promise rejection and a false success message; the referral quest can be completed with nothing copied.

### P2-10 · Achievement counters can display a claim state that overruns the total

- **Status:** ✅ **Fixed incidentally by the P0-5 remediation (2026-07-31).** `badges` is now `useMemo(() => achievements.filter((a) => a.claimed).length, [achievements])` — exactly the fix recommended below — and no `setBadges` call remains anywhere, so the double-increment path is gone. Verified against the current `lib/store.tsx`. The original finding is retained below for history.
- **Files:** `components/screens/profile-screen.tsx:180-186`, `lib/store.tsx:397-414`
- **Root cause:** `claimAchievement` increments `badges` and `unlockAchievementProgress` *also* increments `badges` on unlock, so a single achievement can award two badges. `badges` is never derived from `achievements`.
- **Recommended fix:** Derive `badges` from `achievements.filter(a => a.claimed).length`.
- **Risk:** Badge count drifts upward and disagrees with the achievements list.

### P2-11 · Two parallel "time ago" implementations, one unused

- **Status:** ✅ **Fixed incidentally by the P0-1 remediation (2026-07-31).** `home-screen.tsx` now imports `formatRelativeTime` from `lib/mock-data.ts` and `TimeAgoDisplay` calls it (`setDisplay(formatRelativeTime(ts))`) instead of reimplementing the logic — exactly the fix recommended below. The casing divergence is therefore also resolved. The original finding is retained below for history.
- **Files:** `lib/mock-data.ts:258-269` (`formatRelativeTime`, **never imported**) vs `components/screens/home-screen.tsx:12-47` (`TimeAgoDisplay`, reimplements the same logic inline)
- **Recommended fix:** Have `TimeAgoDisplay` call `formatRelativeTime`.
- **Risk:** Divergent labels ("just now" vs "Just now" — they already differ in casing).

### P2-12 · Per-item interval timers in the rewards feed

- **Files:** `components/screens/home-screen.tsx:28-45`
- **Root cause:** Every feed row mounts its own `setInterval(…, 60000)`. The feed holds up to 40 entries (`store.tsx:303`), so up to 40 independent timers run concurrently, each triggering its own state update and re-render.
- **Recommended fix:** One shared ticker at the list level (or a context clock) driving all rows.
- **Risk:** Needless wakeups and battery drain on mobile; scales linearly with feed length.

---

## P3 — Low

| # | Issue | Files | Fix |
|---|---|---|---|
| P3-1 | **Unused dependencies shipped:** `@supabase/ssr`, `@supabase/supabase-js`, `sonner`, `@radix-ui/react-progress`, `@radix-ui/react-tabs`, `@radix-ui/react-slot`, `class-variance-authority` — all installed, none imported (verified by grep). Supabase in particular implies a backend that doesn't exist. | `package.json` | Remove, or actually adopt Radix/Supabase |
| P3-2 | **Dead code:** `Avatar`/`formatRp`/`formatCompact`/`avatars` imported into `store.tsx` but several are unused there; `components/ui/button.tsx` and `components/ui/skeleton.tsx`'s `Skeleton` export are unreferenced; `DEFAULT_SURVEY` is imported and assigned to `surveyQuestions` but `hasSurvey` requires `quest.survey?.length`, so the fallback is unreachable. | `lib/store.tsx:13-40`, `adventure-screen.tsx:131-133` | Prune |
| P3-3 | **`initialLoginDates = makeConsecutiveDays(0)`** — a function call that always returns `[]`. Obfuscates intent. | `lib/mock-data.ts:385` | Use `[]` |
| P3-4 | **Hardcoded "Good Evening"** greeting regardless of actual time of day. | `home-screen.tsx:120` | Derive from local hour *after mount* (see P0-1) |
| P3-5 | **`unlockedAt: 'Just now'`** stored as a frozen string, so every chest item reads "Just now" forever. | `store.tsx:640` | Store a timestamp; format at render |
| P3-6 | **Non-null assertion on nav lookup:** `nav.find(...)!.Screen` throws if `tab` ever desyncs. | `app-shell.tsx:23` | Fall back to home |
| P3-7 | **Redundant prop API:** `ActionButton` accepts both `onAction` and `onClick` as aliases for the same thing. | `ui/action-button.tsx:55-70` | Collapse to one |
| P3-8 | **`CountUp` cleanup writes `fromRef.current = to`** on unmount even if the animation was interrupted mid-flight, so a remount jumps rather than resuming. | `ui/count-up.tsx:44-47` | Store the last displayed value |
| P3-9 | **No CSP.** `next.config.mjs` sets good baseline headers (nosniff, Referrer-Policy, X-Frame-Options, Permissions-Policy) but no `Content-Security-Policy`. | `next.config.mjs` | Add report-only CSP, then enforce |
| P3-10 | **`userScalable: false` / `maximumScale: 1`** blocks pinch-zoom. | `app/layout.tsx:31-36` | Remove; fails WCAG 1.4.4 |
| P3-11 | **Achievement modal queue timing is fragile:** 2.5s + 300ms chained `setTimeout`s with no cleanup on unmount, so timers can fire after teardown. | `store.tsx:264-279` | Clear `achievementTimeoutRef` in a cleanup effect |
| P3-12 | **`md:h-[860px]` fixed desktop frame** can clip content on short viewports. | `app-shell.tsx:26` | Use `max-h` with `dvh` |

---

## Telegram Mini App compatibility

**No Telegram integration exists.** Grep for `telegram`, `WebApp`, `tg-` returns nothing; `@twa-dev/sdk` / `telegram-web-app.js` are absent. The audit brief lists this as a requirement, so treating it as a gap:

| Requirement | Status |
|---|---|
| `telegram-web-app.js` script | Missing — `window.Telegram.WebApp` never referenced |
| `ready()` / `expand()` lifecycle | Missing — viewport won't expand past the default sheet height |
| `initData` validation | Missing — this is the **only** way a Mini App authenticates a user, and it must be HMAC-verified server-side |
| Theme params (`themeParams`) | Missing — hardcoded dark (see P1-6) |
| `BackButton` | Missing — uses in-app back only; hardware/Telegram back is unhandled |
| `MainButton` | Not used |
| `HapticFeedback` | Not used |
| Safe-area insets | **Correctly handled** — `env(safe-area-inset-*)` used in shell, sheet, modal, toaster |
| Viewport/layout | **Good** — `max-w-[420px]`, `h-dvh`, mobile-first; well suited |
| `CloseButton` / closing confirmation | Not used — unsaved withdraw state can be lost |

Note P3-10: Telegram Mini Apps generally *want* `userScalable: false`, so that one is defensible **if** Telegram is the sole target — but it conflicts with WCAG for a web build.

Also relevant: with no persistence (see the architectural note), a Mini App that gets backgrounded and reloaded by Telegram loses all progress.

---

## Responsiveness & accessibility summary

**Good:** consistent safe-area handling; mobile-first `max-w-[420px]` shell; `aria-busy` on async buttons; `aria-label` on icon-only controls; `aria-current="page"` on nav; `role="switch"`/`aria-checked` on `Toggle`; `sr-only` text for equipped-gear badges; `aria-invalid` on the withdraw input; verified clean at 384×639 with no horizontal overflow.

**Gaps:**

- No focus trapping/restoration in dialogs (P2-7)
- Zoom disabled (P3-10)
- `motion` animations ignore `prefers-reduced-motion` throughout
- `SegmentedProgress` renders 16–24 bare `<span>`s with no `role="progressbar"` / `aria-valuenow`, so progress is invisible to assistive tech
- Several tap targets (the 24×24px `h-6 w-6` toast dismiss, `h-5 w-5` sheet close) fall below the 44×44px recommendation
- `motion.div` used as a clickable achievement row (`profile-screen.tsx:163`) is a non-focusable `div` with an `onClick` and no keyboard handler

---

## 1. Overall production readiness score

# 31 / 100

| Dimension | Score | Notes |
|---|---|---|
| Visual design & UI craft | 88 | Genuinely strong, cohesive, well-executed |
| Component structure | 74 | Clean separation; store is oversized |
| TypeScript hygiene | 45 | `tsc` clean, but `ignoreBuildErrors` voids it; type/value drift |
| State management | 40 | Single mega-context, no memo splitting, derived state stored |
| Core flow correctness | 26 | Video quest fraudulent, withdraw dead-ends, level-ups swallowed |
| Data consistency | 15 | Seed data contradicts itself on three screens |
| Error handling | 55 | Good toast coverage; guards inconsistently placed |
| Accessibility | 48 | Good labels, no focus management |
| Persistence & backend | 5 | None exists |
| Security | 8 | Client-authoritative money |
| Telegram readiness | 12 | Safe areas only |

The UI layer would score in the 80s on its own. The score is dominated by the absence of a backend and by economy logic that is exploitable and self-contradictory.

**Post-remediation (P0 pass only):** roughly **41 / 100**. Data consistency moves 15 → 80 (seed contradictions eliminated and the counters are now derived, so they cannot drift again), core flow correctness 26 → 45 (video quest withdrawn, withdraw validation enforced at the store), security 8 → 22 (no client-side mint or double-spend, though still not server-authoritative). **Persistence & backend stays at 5** — nothing in this pass added a server, and that single dimension is what caps the score. The remaining ceiling is architectural, not cosmetic.

---

## 2. Estimated effort to fix

| Priority | Scope | Effort |
|---|---|---|
| **P0** | 5 issues. P0-1/-4/-5 are contained front-end fixes (~0.5–1 day) — **now done**. **P0-2 and P0-3 require a backend, an ad-network integration, and a server-authoritative ledger** — mitigated on the client, remainder folded into Phase 2. | **3–4 weeks** (front-end portion ✅ complete) |
| **P1** | 6 issues — withdraw dead-end, Max guard, level-up queue, tab derivation, type cleanup, theme wiring (theme needs light tokens across all components). | **4–6 days** |
| **P2** | 12 issues — reward-preview parity, guard relocation, economy retune, Radix dialog migration, timer consolidation, derived counters. | **5–8 days** |
| **P3** | 12 issues — mostly mechanical pruning and polish. | **2–3 days** |

- **Front-end-only total: ~2.5–4 weeks.**
- **Genuinely production-ready** (with backend, auth, persistence, real ad integration, server-side ledger): **~8–11 weeks.**

---

## 3. Suggested order of implementation

### Phase 0 — Decide the architecture (blocks everything)

Choose the backend and whether real money is in scope. Every P0 either depends on this or is invalidated by it. Do not build further UI on client-authoritative state.

### Phase 1 — Stop the bleeding (~1 day, no backend needed) — ✅ **done**

1. ✅ **P0-1** hydration (`Date.now()` out of module scope) — unblocks clean dev/QA and removes the click-blocking overlay
2. ✅ **P0-4 + P0-5** seed-data consistency — empty feed, derived counters
3. ✅ **P1-5** disable `ignoreBuildErrors` and fix what surfaces — do this early so later phases are type-checked *(done 2026-07-31; `tsc --noEmit` was already clean, so nothing further surfaced)*
4. ✅ **P0-2** *hide* the sponsor-video quest as an immediate stopgap against ad fraud
5. ✅ **P0-3 (partial)** withdrawal validation moved into the store with an in-flight guard and idempotency keys — closes the client-side mint/double-spend paths ahead of the real ledger

### Phase 2 — Backend foundation (~3–4 weeks) — ⬜ not started

6. Auth + persistence (for Telegram, `initData` HMAC verification server-side)
7. Server-authoritative economy ledger: XP, coins, balance, inventory
8. **P0-3** real withdraw mutation with idempotency keys and server-side validation — the store's `withdraw()` already has the right shape (validate → await → re-validate → commit), so this becomes swapping the fake `delay()` for the mutation
9. **P0-2** real rewarded-video provider with server-verified completion callback, then flip `REWARDED_VIDEO_ENABLED`

### Phase 3 — Repair core loops (~1 week)

9. ✅ **P1-1 + P1-2** withdraw flow (inline connect, Max guard) — *both done; the remaining withdraw work is the Phase 2 server ledger (P0-3)*
10. **P1-3** level-up queue (reuse the existing achievement-queue pattern)
11. **P2-4 + P2-5** move guards server-side alongside the new ledger
12. **P1-4** derive tabs from real content

### Phase 4 — Consistency & economy tuning (~1 week)

13. **P2-1 + P2-2** reward preview parity via shared helpers
14. **P2-6** retune energy; give the 5,000 starting coins a purpose
15. **P2-10 + P2-11** derive badges, dedupe time formatting
16. **P1-6** theme: implement properly or remove the setting

### Phase 5 — Accessibility, performance, polish (~1 week)

17. **P2-7 + P2-8** migrate dialogs to the already-installed Radix Dialog
18. `prefers-reduced-motion`; `role="progressbar"` on `SegmentedProgress`; tap-target sizing
19. **P2-12** consolidate feed timers
20. **P3** sweep: prune unused deps and dead code; add report-only CSP

### Phase 6 — Telegram Mini App (~1 week, if targeted)

21. SDK, `ready()`/`expand()`, `BackButton`/`MainButton`, `themeParams`, haptics, closing confirmation

---

**Rationale for the ordering:** Phase 1 is deliberately front-loaded with cheap, high-impact fixes that make the app testable and stop the most embarrassing data contradictions — and it disables `ignoreBuildErrors` before the large Phase 2 changes land, so the compiler helps rather than hides. Phase 2 is sequenced before the remaining loop repairs because fixing withdraw-flow UX (P1-1/-2) or moving economy guards (P2-4/-5) against client-only state means writing that code twice.

---

## Appendix — documentation drift and stale findings

Added 2026-08-01 during a documentation audit. **No finding above was deleted or renumbered.** This appendix records where the original 2026-07-31 audit text no longer matches the repository, so readers do not act on stale premises. Every row was verified against the current working tree.

### Environment facts that have since changed

| Audit statement | Current reality |
|---|---|
| "Next.js 15.2.4" (scope line) | **`next@16.2.6`**. The app has been upgraded a major version since the audit. |
| "25 source files / ~4,700 LOC" | **27 files / ~5,014 LOC** across `app/`, `components/`, `lib/`. |
| "`lib/store.tsx`, 859 LOC" | **968 LOC.** |
| "`typescript.ignoreBuildErrors: true`" (P1-5) | **Removed** from `next.config.mjs`; build-time checking is active. |

### Findings whose premise is now obsolete

- **P3-1 (unused dependencies) — mostly obsolete.** Of the seven packages listed, six are **no longer in `package.json` at all**: `@supabase/ssr`, `@supabase/supabase-js`, `sonner`, `@radix-ui/react-progress`, `@radix-ui/react-tabs`, `@radix-ui/react-slot`. Only `class-variance-authority` remains installed. The dependency list has since gained `@base-ui/react`, `shadcn` and `@vercel/analytics`. The finding survives only as "audit `class-variance-authority` usage".
- **The architectural reality check's Supabase note is stale.** It states `@supabase/ssr` and `@supabase/supabase-js` "are installed but never imported anywhere." They are no longer installed. The substantive point is unaffected and remains true: **there is still no backend, no auth and no persistence.**
- **P2-7's recommended fix is no longer available as written.** It advises rebuilding the dialogs on `@radix-ui/react-dialog` because it "**is already a dependency** and is unused." That package is no longer installed; `@base-ui/react` is present instead. **The underlying defect is still real and still open** — `components/ui/modal.tsx`, `components/ui/sheet.tsx` and `components/referral-modal.tsx` remain hand-rolled with no focus trapping or restoration. Only the suggested vehicle for the fix needs revisiting.

### Findings closed as a side effect of other work

Both were verified fixed in the current code and are marked inline above:

- **P2-10** — closed by the P0-5 remediation, which derived `badges` from `achievements`.
- **P2-11** — closed by the P0-1 remediation, which rewrote `TimeAgoDisplay` to call the shared `formatRelativeTime`.

### Findings re-confirmed as still valid

Spot-checked against the current tree and unchanged: **P1-3** (single `setLevelUp` per payout), **P1-4** (`tabs` still advertises five categories; `questCatalogue` still contains only `Daily`, `Side` and `Story`), **P1-6** (`app/globals.css:31` still hardcodes `color-scheme: dark` and `app/layout.tsx` still sets `colorScheme: 'dark'`), **P2-12** (per-row `setInterval(update, 60000)` in the feed), **P3-3** (`initialLoginDates = makeConsecutiveDays(0)`), **P3-5** (`unlockedAt: 'Just now'`), **P3-9** (no CSP in `next.config.mjs`), **P3-10** (`maximumScale: 1` / `userScalable: false`).

### New issue discovered during the documentation audit

- **Broken `lint` script.** `package.json` defines `"lint": "eslint ."`, but **ESLint is not in `devDependencies`**, so `pnpm lint` fails. This was not in the original audit because the audit's verification method used `tsc --noEmit` only. Not assigned a P-number here to keep the audit's numbering stable; tracked in [`TASKS.md`](./TASKS.md) under Tooling.
