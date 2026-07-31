# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project does not yet publish versioned releases — dated sections below correspond to
merged remediation passes. Issue identifiers (`P0-1`, `P1-2`, …) refer to
[`PICO_PRODUCTION_AUDIT.md`](./PICO_PRODUCTION_AUDIT.md).

## [Unreleased]

### Added

- `README.md` — project overview, tech stack, features, folder structure, development,
  build, deployment, current status and a documentation index.
- `PICO_P0_REMEDIATION.md` — P0 change log, reconstructed from the audit's inline status
  entries and commit `6680ce7`. The audit had linked to this file since the P0 pass, but
  it was never committed.
- `ARCHITECTURE.md` — current app structure, state management, data flow, mock data,
  limitations and planned backend.
- `ROADMAP.md` — phased plan derived from the audit.
- `TASKS.md` — production-readiness checklist covering all 35 findings.
- `CONTRIBUTING.md` — branch naming, commit style, PR checklist, code style and the
  documentation-update requirement for every future fix.
- Status summary tables at the top of `PICO_PRODUCTION_AUDIT.md` and
  `PICO_P1_REMEDIATION.md`, with cross-links to the remediation logs.
- `PICO_P3_REMEDIATION.md` — P3 change log, created with the first two P3 fixes (P3-3,
  P3-6). The band previously had no log, as anticipated by `CONTRIBUTING.md`.
- Appendix to `PICO_PRODUCTION_AUDIT.md` recording documentation drift, obsolete premises,
  incidentally-closed findings, and one newly discovered tooling issue (the `lint` script
  references ESLint, which is not installed).

### Changed

- Standardized `PICO_P1_REMEDIATION.md` so every entry uses the same sections — Issue,
  Status, Root cause, Solution, Verification, Files changed, Notes — without altering any
  recorded outcome.
- Reformatted `CHANGELOG.md` to Keep a Changelog structure; all previously recorded
  entries are preserved verbatim in dated sections below.
- Marked `P2-10` and `P2-11` as fixed in the audit. Both were closed as side effects of
  the P0 pass and had remained listed as open; the original findings are retained.
- Corrected the Phase 1 checklist in the audit, which still marked `P1-5` as open after it
  had been fixed on 2026-07-31.
- P3-3 — `initialLoginDates` is now the literal `[]` instead of `makeConsecutiveDays(0)`, a
  call whose only possible result was an empty array. Recorded as Changed rather than Fixed
  because the seeded value is byte-for-byte identical; only the intent is now legible.

### Fixed

- P2-2 — The quest detail reward preview no longer inlines a copy of the key-reward
  formula. It now derives the value from the shared `questKeyReward()` helper and
  pluralizes "Key"/"Keys" from that value, so the preview cannot drift from what
  `applyQuestReward` actually grants. Reward values are unchanged.
- P2-3 — The quest detail progress row no longer shows a half-filled bar next to a
  "0 / 1" label. The bar percentage and the numeric label are both derived from one
  `{ current, total }` value, so they can no longer disagree. Quests without a `progress`
  object are treated as a single-step objective (`0 / 1` until done, `1 / 1` after)
  instead of the previous magic 50% for the `active` state. Gameplay, rewards and the
  existing bar transition are unchanged.
- P2-9 — The referral modal no longer claims a copy succeeded when it did not. `handleCopy`
  now awaits a `copyText()` helper that guards on `navigator.clipboard?.writeText`, catches a
  denied permission, falls back to `document.execCommand('copy')` for insecure origins, and
  returns a boolean rather than throwing. On failure the modal shows an error toast and
  returns before `setCopied(true)`, so the success toast and the checkmark are unreachable
  unless text actually reached the clipboard.
- P3-2 — Removed dead code and one unreachable fallback. The adventure screen's
  `quest.survey?.length ? quest.survey : DEFAULT_SURVEY` implied quests could ship without a
  survey and still render one, but every read was gated behind the same `length` check, so the
  `DEFAULT_SURVEY` arm could never be taken; it is now `quest.survey ?? []`. Also dropped an
  unused `ENERGY_MAX` import from the home screen. Behaviour is unchanged.
- P3-5 — `InventoryItem.unlockedAt` is now a `number` (epoch ms) instead of a string frozen at
  `'Just now'`, so an item found an hour ago no longer reads the same as one found a second
  ago. `openChest` stamps `Date.now()`, and a new `UnlockedAtLabel` formats it at render time
  with the shared `formatRelativeTime` in both the item grid and the detail sheet. The label
  mirrors `TimeAgoDisplay` from P0-1 — filled in after mount, not during render — so it does
  not reintroduce the P0-1 hydration mismatch, and a one-minute interval keeps it current.
- P3-6 — Removed the non-null assertion from the `AppShell` screen lookup
  (`nav.find(...)!.Screen`), which would have thrown and taken down the React tree if `tab`
  ever held a value absent from `nav`. The lookup now falls back to the Home screen. Because
  `nav` is a non-empty `as const` tuple, the fallback needs no assertion of its own. All five
  tabs still resolve to their own screens, so navigation is unchanged in the normal case.
- P3-11 — The achievement modal queue's timers are now cancellable and cleared on unmount, so
  neither the 2.5s display timer nor the 300ms gap timer can fire against a dead tree. The gap
  timer previously had no stored handle at all, making it uncancellable by construction; it now
  has a dedicated `achievementGapTimeoutRef`, kept separate from `achievementTimeoutRef`
  because that ref doubles as the "queue is draining" guard. An `achievementMountedRef` check
  at the top of `processAchievementQueue` closes the window `clearTimeout` cannot cover — a
  callback already dequeued and mid-flight. Queue ordering and the 2.5s / 300ms timings are
  unchanged.

### Removed

- P3-7 — Removed `ActionButton`'s redundant `onClick` prop, which duplicated `onAction` and was
  resolved internally with `onAction ?? onClick`. The name was actively misleading: on a
  component wrapping a `<button>` it read as the DOM handler, but it was swallowed and run
  through the loading/success/error lifecycle instead, and passing both silently discarded one.
  `onAction` survived because the prop is an async action whose promise drives the button's
  state, not a click handler. The two `onClick` callers — the profile avatar and settings
  sheets — were migrated. The lifecycle, `resetDelay`, `aria-busy` and the `type="submit"`
  branch are untouched; this was an API change, not a behaviour change.
- P3-2 — Deleted `components/ui/button.tsx`, which had no importer, along with the unrendered
  `SkeletonCard` preset and `Skeleton`'s public export (now an internal block). Also removed
  `DEFAULT_SURVEY` and leftover seed helpers from `lib/mock-data.ts`, including
  `makeConsecutiveDays` — which P3-3 had left exported and unreferenced and explicitly deferred
  here. `SkeletonRow` was deliberately kept despite having no consumer, since the store's
  simulated `delay()` calls are where a skeleton belongs once a real backend lands.

## 2026-08-01

### Fixed

- P1-2 — Disabled Max button below minimum withdrawal.
- Added remaining balance hint.
- Verified existing withdrawal flow.

## 2026-07-31

### Fixed

- P1-1 — Made the Withdraw sheet's empty payment-method state actionable with inline connect buttons.
- Auto-selected the just-connected method so Continue is no longer blocked afterwards.
- Verified the new-user connect flow and the existing connected withdrawal flow end-to-end.
- P1-5 — Removed `processAchievementQueue` from the store context value and its `useMemo` dependency array, so the exported object matches the `StoreValue` type exactly.
- Re-enabled build-time TypeScript checking by removing `typescript.ignoreBuildErrors` from `next.config.mjs`.
- Verified no consumer read `processAchievementQueue` off the store; achievement queue behavior unchanged.
- P0-1 — Emptied `initialRewardsFeed` and deferred relative-time rendering to after mount, eliminating the hydration mismatch and the click-blocking dev overlay.
- P0-4 — Removed the three fabricated "Recent Rewards" entries and added an `EmptyRewards` state on Home.
- P0-5 — Derived `artifacts`, `badges` and `collectionOwned` from `inventoryItems` and `achievements` instead of storing them, making counter drift structurally impossible.

### Changed

- P0-3 — Moved withdrawal validation from the sheet into `withdraw()` in `lib/store.tsx`:
  integer/positive amount checks, ref-based live balance and payment-method checks,
  re-validation after the await, an in-flight guard, an idempotency key, and typed
  `WithdrawError` rejections. Closes the client-side mint and double-spend paths; still
  not server-authoritative.

### Removed

- P0-2 — Filtered every `state: 'video'` quest out of the catalogue behind
  `REWARDED_VIDEO_ENABLED = false`, with a `VIDEO_UNAVAILABLE` backstop in `startQuest`.
  Removes the advertising-fraud payout path; the rewarded-video feature itself is not
  built.

## Earlier history

Before 2026-07-31 the repository carried several ad-hoc summary documents —
`AUDIT_REPORT.md`, `ALL_FIXES_SUMMARY.md`, `P0_FIXES_SUMMARY.md` and the default v0
`README.md` — which were deleted in commits `6893c8d`, `80ef4e2`, `43031e8` and `c3553c4`
and superseded by `PICO_PRODUCTION_AUDIT.md`. Fix commits from that period
(`4d2d8fe`, `76e2ec8`, `0c9e0e6`, `1474a46`) predate this changelog and are not itemized
here; consult `git log` for detail.

[Unreleased]: https://github.com/llianified/pico/compare/main...HEAD
