# Changelog

## 2026-07-31

### Fixed
- P1-1 — Made the Withdraw sheet's empty payment-method state actionable with inline connect buttons.
- Auto-selected the just-connected method so Continue is no longer blocked afterwards.
- Verified the new-user connect flow and the existing connected withdrawal flow end-to-end.
- P1-5 — Removed `processAchievementQueue` from the store context value and its `useMemo` dependency array, so the exported object matches the `StoreValue` type exactly.
- Re-enabled build-time TypeScript checking by removing `typescript.ignoreBuildErrors` from `next.config.mjs`.
- Verified no consumer read `processAchievementQueue` off the store; achievement queue behavior unchanged.
