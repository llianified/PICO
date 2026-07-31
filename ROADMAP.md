# PICO — Roadmap

Derived from [`PICO_PRODUCTION_AUDIT.md`](./PICO_PRODUCTION_AUDIT.md). Phases map to
priority bands: **Phase 1 → P0, Phase 2 → P1, Phase 3 → P2, Phase 4 → P3.**

Item-level checkboxes live in [`TASKS.md`](./TASKS.md); this document covers sequencing,
dependencies and rationale. Effort figures are the audit's own estimates.

> **Ordering caveat carried over from the audit.** Two P0 items (P0-2, P0-3) cannot be
> closed without a backend, so the front-end portion of Phase 1 is complete while the
> remainder is blocked. The audit's own implementation order therefore interleaves the
> backend build between P1 items — see [Dependencies](#dependencies) before assuming the
> phases can run strictly in sequence.

## Status at a glance

| Phase | Band | Items | Status |
|---|---|---|---|
| [Phase 0](#phase-0--decide-the-architecture) | Blocker | Architecture decision | ⬜ Not started |
| [Phase 1](#phase-1--p0--critical) | P0 | 5 | 🟡 3 fixed, 2 mitigated — backend remainder open |
| [Phase 2](#phase-2--p1--high) | P1 | 6 | 🟡 3 of 6 done |
| [Phase 3](#phase-3--p2--medium) | P2 | 12 | 🟡 5 of 12 done |
| [Phase 4](#phase-4--p3--low) | P3 | 12 | 🟡 6 of 12 done |

> **Phases are not running in sequence.** P2 and P3 items have been fixed individually and
> out of order, interleaved with P1, so "Phase 4 in progress" does not mean Phases 2 and 3
> are finished — they are not. Per-issue status lives in
> [`TASKS.md`](./TASKS.md) and the remediation logs; this document is the recommended
> sequencing for what remains, not a record of what happened.

---

## Phase 0 — Decide the architecture

**Blocks everything. Not started.**

Choose the backend and decide whether real money is in scope. Every P0 either depends on
this decision or is invalidated by it. Do not build further UI on client-authoritative
state.

If Telegram is the sole target, decide that now too — it changes the auth model
(`initData` HMAC verification) and makes `userScalable: false` defensible rather than a
WCAG failure.

---

## Phase 1 — P0 · Critical

**Front-end portion: ✅ complete (2026-07-31, ~1 day, no backend needed).
Remainder: ⬜ blocked on Phase 0.** Log: [`PICO_P0_REMEDIATION.md`](./PICO_P0_REMEDIATION.md).

| Item | Status |
|---|---|
| P0-1 · Hydration failure | ✅ Fixed |
| P0-4 · Fabricated rewards feed | ✅ Fixed |
| P0-5 · Contradictory inventory counters | ✅ Fixed |
| P0-2 · Sponsor-video payout | ⚠️ Mitigated — quest hidden behind `REWARDED_VIDEO_ENABLED` |
| P0-3 · Client-authoritative withdrawals | ⚠️ Mitigated — validation, in-flight guard, idempotency key |

**Remaining P0 work, deferred into Phase 2's backend build (~3–4 weeks):**

1. Auth + persistence — for Telegram, server-side `initData` HMAC verification.
2. Server-authoritative economy ledger: XP, coins, balance, inventory.
3. **P0-3** real withdraw mutation with server-side validation and idempotency. `withdraw()`
   already has the right shape, so this is swapping the simulated `delay()` for the mutation.
4. **P0-2** real rewarded-video provider with a server-verified completion callback, *then*
   flip `REWARDED_VIDEO_ENABLED`.

> Flipping `REWARDED_VIDEO_ENABLED` without all three of provider, player and
> server-verified callback restores the original advertising-fraud path exactly as audited.

---

## Phase 2 — P1 · High

**Estimate: 4–6 days for the front-end items. 3 of 6 done.**
Log: [`PICO_P1_REMEDIATION.md`](./PICO_P1_REMEDIATION.md).

| Item | Status | Note |
|---|---|---|
| P1-5 · `processAchievementQueue` type drift | ✅ Fixed | Done first, deliberately — also re-enabled build-time type checking so later phases are type-checked |
| P1-1 · Withdraw sheet dead-end | ✅ Fixed | Inline connect + auto-select |
| P1-2 · "Max" invalid amount | ✅ Fixed | Disabled below minimum + shortfall hint |
| P1-3 · Only the last level-up announced | ⬜ Open | Reuse the existing `achievementQueueRef`/`processAchievementQueue` pattern rather than inventing a new one |
| P1-4 · Weekly/Event tabs empty | ⬜ Open | Either derive `tabs` from categories present in `quests`, or seed the missing categories |
| P1-6 · Theme inert, locked to dark | ⬜ Open | Largest of the three: needs light-mode tokens across every component. Either implement properly or remove the Theme/Language rows — do not toast success for a no-op |

The remaining withdraw work is **not** in this phase — it is the Phase 1/2 server ledger
(P0-3). P1-1 and P1-2 addressed the UX dead-ends only.

---

## Phase 3 — P2 · Medium

**Estimate: 5–8 days, ~3–5 days remaining. 5 of 12 done.**
Log: [`PICO_P2_REMEDIATION.md`](./PICO_P2_REMEDIATION.md).

| Item | Status |
|---|---|
| P2-10 · Badge counter overrun | ✅ Fixed incidentally by P0-5 (badges now derived) |
| P2-11 · Duplicate "time ago" implementations | ✅ Fixed incidentally by P0-1 |
| P2-2 · Key formula duplicated inline | ✅ Fixed — preview derives from `questKeyReward()` |
| P2-3 · Progress bar 50% vs "0 / 1" label | ✅ Fixed — bar and label share one `{ current, total }` |
| P2-9 · `navigator.clipboard` without fallback | ✅ Fixed — guarded API, `execCommand` fallback, no false success toast |
| P2-1 · Reward preview omits coins | ⬜ Open |
| P2-4 · Chest affordability check bypassed | ⬜ Open |
| P2-5 · Energy consumed on uncompletable quest | ⬜ Open |
| P2-6 · Energy economy: 5 quests then a 9-minute wall | ⬜ Open |
| P2-7 · Dialogs lack focus trapping/restoration | ⬜ Open |
| P2-8 · `ReferralModal` is not a modal | ⬜ Open |
| P2-12 · Per-item interval timers in the feed | ⬜ Open — **and now the Inventory screen too** |

Suggested grouping:

- **Reward-preview parity** — P2-1 + P2-2 together, both via the shared helpers. ⚠️ P2-2 has
  since been done on its own, so P2-1 (the missing coins row) is what remains here — and
  `questCoinReward()` is the helper it should use, mirroring what P2-2 did for keys.
- **Guards** — P2-4 + P2-5 should move server-side *alongside* the new ledger, not before
  it; doing them against client-only state means writing the code twice.
- **Economy tuning** — P2-6; also give the 5,000 starting coins a purpose.
- **Dialogs** — P2-7 + P2-8 together. ⚠️ The audit's recommended fix (migrate to
  `@radix-ui/react-dialog`, "already a dependency") is **stale** — that package is no
  longer installed; `@base-ui/react` is present instead. Re-decide the vehicle before
  starting.
- **Performance** — P2-12 with a single shared ticker, now driving **two** screens: the Home
  rewards feed and the Inventory list, which gained the same per-item interval from the P3-5
  fix. Doing it once for both is the point of the consolidation.

---

## Phase 4 — P3 · Low

**Estimate: 2–3 days, ~1–1.5 days remaining. 6 of 12 done — fixed individually and ahead of
this phase, not as the sweep the plan anticipated.**
Log: [`PICO_P3_REMEDIATION.md`](./PICO_P3_REMEDIATION.md).

All twelve items (P3-1 … P3-12) are listed in
[the audit's P3 table](./PICO_PRODUCTION_AUDIT.md#p3--low) and tracked in
[`TASKS.md`](./TASKS.md).

| Item | Status |
|---|---|
| P3-2 · Dead code and unreachable fallback | ✅ Fixed |
| P3-3 · `initialLoginDates = makeConsecutiveDays(0)` | ✅ Fixed |
| P3-5 · `unlockedAt` frozen as a string | ✅ Fixed |
| P3-6 · Non-null assertion on nav lookup | ✅ Fixed |
| P3-7 · Redundant `onAction` / `onClick` aliases | ✅ Fixed |
| P3-11 · Achievement queue timers not cleared | ✅ Fixed |
| P3-1 · Unused dependencies | ⬜ Open |
| P3-4 · Hardcoded "Good Evening" greeting | ⬜ Open |
| P3-8 · `CountUp` cleanup on interrupted animations | ⬜ Open |
| P3-9 · No Content-Security-Policy | ⬜ Open |
| P3-10 · `userScalable: false` blocks pinch-zoom | ⬜ Open |
| P3-12 · `md:h-[860px]` fixed desktop frame | ⬜ Open |

Themes for the remainder:

- **Pruning** — P3-1 only; P3-2 and P3-3 are done. ⚠️ P3-1 is largely obsolete: six of the
  seven packages it names are no longer installed. What remains is `class-variance-authority`,
  which P3-2 made genuinely unused when it deleted its only consumer — a one-line prune.
- **Correctness polish** — P3-4 and P3-8 remain; P3-5, P3-6 and P3-11 are done. P3-4 must
  resolve the local hour *after mount*, or it reintroduces P0-1's hydration mismatch — the
  pattern to copy is `TimeAgoDisplay` / `UnlockedAtLabel`.
- **API cleanup** — done (P3-7).
- **Security & a11y** — P3-9 (the baseline headers already exist in `next.config.mjs`; only
  the CSP is missing — ship report-only, then enforce), P3-10 (re-enable pinch-zoom — decide
  against the Telegram question from Phase 0), P3-12.

Also fold in the accessibility items the audit lists outside the numbered findings:
`prefers-reduced-motion` support, `role="progressbar"` on `SegmentedProgress`, 44×44px tap
targets, and keyboard access for the `motion.div` achievement row.

---

## Beyond the priority bands

Two tracks from the audit fall outside P0–P3:

**Telegram Mini App (~1 week, only if targeted).** SDK integration, `ready()`/`expand()`,
`BackButton`/`MainButton`, `themeParams`, haptics, closing confirmation. Depends on the
Phase 0 decision and on P1-6, since `themeParams` presupposes a working theme layer.

**Tooling.** ESLint is referenced by the `lint` script but not installed, so there is no
working linter; there is also no test suite. Neither is in the audit's numbered findings.

---

## Dependencies

- **Phase 0 blocks the remainder of Phase 1.** No backend decision, no ledger.
- **P1-5 was intentionally done first** so that everything after it is type-checked at
  build time.
- **P2-4 and P2-5 should follow the ledger**, not precede it.
- **P1-6 blocks Telegram `themeParams`.**
- **P0-2 needs an ad provider** before its flag can flip; nothing else unblocks it.
- **P3-10 depends on the Telegram decision** — Mini Apps generally want
  `userScalable: false`, which conflicts with WCAG 1.4.4 for a web build.

## Effort summary

| Scope | Estimate |
|---|---|
| Front-end only, all phases | ~2.5–4 weeks |
| Genuinely production-ready, incl. backend, auth, persistence, real ads, server ledger | ~8–11 weeks |

Readiness scored **31 / 100** at audit, ~**41 / 100** after the P0 pass. `Persistence &
backend` remains at 5 / 100 and caps the total — the remaining ceiling is architectural,
not cosmetic.
