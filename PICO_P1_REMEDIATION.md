# PICO — P1 Remediation Log

Companion to [`PICO_PRODUCTION_AUDIT.md`](./PICO_PRODUCTION_AUDIT.md). P1 issues are
remediated one at a time; each entry below records exactly what changed and how it
was verified. Issues not listed here have not been addressed yet.

---

## P1-5 · `processAchievementQueue` exported through context but absent from `StoreValue`

**Date:** 2026-07-31
**Status:** ✅ Fixed

### What was wrong

`processAchievementQueue` — an internal scheduling primitive for the achievement
toast queue — was included in the context value object passed to
`StoreContext.Provider`, but was never declared in the `StoreValue` type. The
mismatch went undetected because the object literal is contextually typed through
`useMemo<StoreValue>` and because `next.config.mjs` set
`typescript.ignoreBuildErrors: true`, which suppressed all type errors at build time.

### Change made

`lib/store.tsx`

- Removed `processAchievementQueue` from the context value object.
- Removed `processAchievementQueue` from the `useMemo` dependency array.

The exported value and the exported `StoreValue` type now match exactly.

`next.config.mjs`

- Removed the `typescript.ignoreBuildErrors: true` block so type errors fail the build.

### What was deliberately not changed

- The `processAchievementQueue` function itself is untouched. It remains a
  `useCallback` inside `StoreProvider` and is still invoked internally by
  `unlockAchievementProgress`, which keeps `processAchievementQueue` in its own
  dependency array.
- `StoreValue` was **not** extended to declare the function. The audit's expected
  behavior is that internal helpers stay internal, so the value was narrowed to the
  type rather than the type widened to the value.
- No unrelated type errors were fixed, because there were none — `tsc --noEmit`
  already passed clean before the change.

### Behavior impact

None. A repository-wide search confirmed `processAchievementQueue` was referenced
only inside `lib/store.tsx`; no component ever read it off the store, so removing it
from the context surface is not a breaking change. Achievement queueing and toast
sequencing are unaffected.

### Verification

- `npx tsc --noEmit` — exit 0, no errors (before and after).
- `pnpm build` — succeeds; the `Running TypeScript` step now executes as part of the
  build and passes, confirming checking is genuinely re-enabled rather than skipped.
