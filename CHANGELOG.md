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

### Fixed

- Documentation only; no application code was modified in this pass.

### Removed

- Nothing.

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
