# PICO — P0 Remediation Log

Companion to [`PICO_PRODUCTION_AUDIT.md`](./PICO_PRODUCTION_AUDIT.md).
Covers the five P0 findings. P1 work is logged separately in
[`PICO_P1_REMEDIATION.md`](./PICO_P1_REMEDIATION.md).

**Pass completed:** 2026-07-31
**Branch:** `production-audit-remediation` (merged via PR #20)
**Commits:** `6680ce7` (source changes), `2ec5524` (audit status update)

> **Provenance note.** The audit linked to this file from the day the P0 pass landed,
> but the file itself was never committed — the per-issue outcomes were recorded only
> inline in `PICO_PRODUCTION_AUDIT.md`. This log was reconstructed on 2026-08-01 from
> those inline status entries and from the actual diff of commit `6680ce7`. No outcome,
> verification claim or file path here is new; everything is carried over from those two
> sources. Entries are therefore less granular than the P1 log, which is written at the
> time of each fix.

## Outcome summary

| Issue | Status | Closed by |
|---|---|---|
| [P0-1](#p0-1--hydration-failure-crashes-the-react-tree-on-every-page-load) | ✅ Fixed | Front-end fix |
| [P0-2](#p0-2--watch-sponsor-video-pays-out-without-ever-showing-a-video) | ⚠️ Mitigated | Feature flagged off; needs ad provider |
| [P0-3](#p0-3--withdrawals-mutate-balance-client-side-with-no-server-authority-or-idempotency) | ⚠️ Mitigated | Hardened client-side; needs server ledger |
| [P0-4](#p0-4--seeded-recent-rewards-feed-fabricates-rewards-the-player-never-earned) | ✅ Fixed | Front-end fix |
| [P0-5](#p0-5--seeded-inventorycollection-counters-contradict-the-empty-inventory) | ✅ Fixed | Front-end fix |

**Three of five are fully closed. P0-2 and P0-3 are mitigated, not closed** — neither can
be genuinely fixed without a backend. The fraud path and the free-money path were
removed; the underlying client-authoritative architecture was not changed. Both carry
forward into Phase 2 of [ROADMAP.md](./ROADMAP.md).

## Files changed in this pass

From commit `6680ce7` (`+247 / −91` across 5 files):

| File | Issues |
|---|---|
| `lib/store.tsx` | P0-3, P0-5 |
| `lib/mock-data.ts` | P0-1, P0-2, P0-4 |
| `components/screens/home-screen.tsx` | P0-1, P0-4 |
| `components/wallet/withdraw-sheet.tsx` | P0-3 |
| `components/screens/adventure-screen.tsx` | P0-2 |

---

## P0-1 · Hydration failure crashes the React tree on every page load

**Date:** 2026-07-31
**Status:** ✅ Fixed

### Root cause

`initialRewardsFeed` called `Date.now()` at **module scope**. The server evaluated it at
request time and the client re-evaluated it at hydration time, producing different
`createdAt` values. `TimeAgoDisplay` rendered those into text, so server and client HTML
disagreed and React discarded the server tree.

### Solution

- `initialRewardsFeed` is now `[]`, so no `Date.now()` runs at module scope.
- `TimeAgoDisplay` renders a stable `—` placeholder on the first pass and resolves the
  real label in a `useEffect` after mount.

### Verification

Console is clean and the `nextjs-portal` error overlay — which had been covering the
bottom-left UI and intercepting nav-bar clicks in development — is gone.

### Files changed

`lib/mock-data.ts`, `components/screens/home-screen.tsx`

### Notes

The hardcoded `"Good Evening,"` greeting is a separate, still-open item
([P3-4](./PICO_PRODUCTION_AUDIT.md#p3--low)); it is safe only because it is not
time-derived. If it is ever made time-based it must resolve after mount for the same
reason.

---

## P0-2 · "Watch Sponsor Video" pays out without ever showing a video

**Date:** 2026-07-31
**Status:** ⚠️ Mitigated — payout path removed, feature not built

### Root cause

`state: 'video'` only changed the button *label* to "Watch Video". `handleStart` called
the same `startQuest()` as any other quest — no player, no ad SDK, no completion
callback, no watch-duration gate. Tapping through granted +Rp200, +50 XP and +1 Key with
no video ever displayed.

### Solution

- Added a `REWARDED_VIDEO_ENABLED` flag, default `false`, which filters every
  `state: 'video'` quest out of the catalogue so the quest is unreachable.
- `startQuest` throws `VIDEO_UNAVAILABLE` as a backstop if such a quest ever does reach
  the store.

### Verification

The sponsor-video quest no longer appears in the Adventure catalogue.

### Files changed

`lib/mock-data.ts`, `components/screens/adventure-screen.tsx`

### Notes

> **Do not flip `REWARDED_VIDEO_ENABLED` to `true`** until an ad provider, a real player,
> and a server-verified completion callback all exist. Flipping the flag alone restores
> the original advertising-fraud path exactly as audited.

---

## P0-3 · Withdrawals mutate balance client-side with no server authority or idempotency

**Date:** 2026-07-31
**Status:** ⚠️ Mitigated — hardened, still client-authoritative

### Root cause

`withdraw()` performed no server call: it resolved a fake `delay(1600)` then subtracted
from local state. All validation (`MIN_WITHDRAW`, balance check) lived in the client
component and was trivially bypassable. There was no idempotency key, so a retry
double-spent.

### Solution

Validation was moved out of the sheet and into `withdraw()`, next to the ledger it
guards:

- `MIN_WITHDRAW` now lives in `lib/store.tsx`.
- Amounts must be positive, finite integers.
- Balance and payment-method checks read live state via refs, never caller-supplied
  values.
- Rules are re-checked *after* the await, not only before it.
- An in-flight guard blocks concurrent submits.
- An idempotency key makes a retry of the same attempt a no-op.
- Rejections surface as a typed `WithdrawError` with a machine-readable
  `WithdrawErrorCode` (`INVALID_AMOUNT`, `BELOW_MINIMUM`, `INSUFFICIENT_FUNDS`,
  `METHOD_UNAVAILABLE`, `IN_FLIGHT`).

### Verification

The client-side mint and double-spend paths are closed. Balance still decrements locally
and is not persisted — a refresh restores the spent balance.

### Files changed

`lib/store.tsx`, `components/wallet/withdraw-sheet.tsx`

### Notes

**This is not server authority.** A determined user can still edit client memory. Closing
this requires the Phase 2 server-authoritative ledger. The store's `withdraw()` was
deliberately shaped as validate → await → re-validate → commit so that Phase 2 becomes
swapping the fake `delay()` for a real mutation rather than a rewrite.

---

## P0-4 · Seeded "Recent Rewards" feed fabricates rewards the player never earned

**Date:** 2026-07-31
**Status:** ✅ Fixed

### Root cause

`initialRewardsFeed` shipped three hardcoded fake entries — *"Quest Completed +150 XP"*,
*"Chest Opened — Legendary Sword"*, *"Money Earned +5,000 Rp"* — while
`initialTransactions`, `initialInventoryItems` and XP were all genuinely empty or zero.
Home and Wallet therefore contradicted each other on a fresh account.

### Solution

- `initialRewardsFeed = []`, with a comment recording **both** reasons it must stay empty:
  user trust *and* the module-scope hydration bug in P0-1.
- Home renders a new `EmptyRewards` state — "No rewards yet" plus a "Start a quest"
  button routing to Adventure — following the existing
  `EmptyTransactions`/`EmptyInventory` pattern.

### Verification

On a fresh account, Home and Wallet no longer contradict each other.

### Files changed

`lib/mock-data.ts`, `components/screens/home-screen.tsx`

---

## P0-5 · Seeded inventory/collection counters contradict the empty inventory

**Date:** 2026-07-31
**Status:** ✅ Fixed

### Root cause

Hardcoded starting state `artifacts=1, badges=1, collectionOwned=12` while
`initialInventoryItems = []` and every achievement was unclaimed. Inventory read
*"Collections 12 / 48", "Artifacts 1", "Badges 1"* directly above *"Nothing unlocked yet"*.
Nothing reconciled the counters, so they could drift indefinitely.

### Solution

`artifacts`, `badges` and `collectionOwned` are no longer stored — they are `useMemo`
values derived from `inventoryItems` and `achievements`, making drift structurally
impossible rather than merely corrected. The `setArtifacts`/`setBadges`/
`setCollectionOwned` calls in `claimAchievement`, the achievement queue, and `openChest`
were removed.

`chests=2, keys=1, coins=5000` were **kept** as a deliberate, documented starter grant so
a new player can open their first chest.

### Verification

Inventory shows Artifacts 0, Badges 0, Collections 0 / 48 above the empty inventory.

### Files changed

`lib/store.tsx`

### Notes

This fix also incidentally resolved **P2-10** (badge double-counting), which the audit
still lists as open: `badges` is now `achievements.filter(a => a.claimed).length`, exactly
the fix P2-10 recommended, and no `setBadges` call remains. Recorded in the audit's
[drift appendix](./PICO_PRODUCTION_AUDIT.md#appendix--documentation-drift-and-stale-findings).
