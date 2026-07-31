# PICO — P1 Remediation Log

Companion to [`PICO_PRODUCTION_AUDIT.md`](./PICO_PRODUCTION_AUDIT.md). P1 issues are
remediated one at a time; each entry below records exactly what changed and how it
was verified. Issues not listed here have not been addressed yet.

---

## P1-1 · Withdraw sheet dead-ends when no payment method is connected

**Date:** 2026-07-31
**Status:** ✅ Fixed

### What was wrong

With zero connected methods — the default, since all four ship `connected: false` —
the Withdraw sheet's payment-method section rendered a static `div` reading
*"Connect a payment method first."* next to a decorative, non-interactive `Plus`
icon. Continue was permanently disabled and there was no path forward. The only
connect flow lived on the Wallet screen behind "Manage", which the user had to guess
at after closing the sheet. Every new user hit this on their first withdrawal attempt.

### Change made

`components/wallet/withdraw-sheet.tsx`

- The empty state keeps its dashed container, `Plus` icon and original copy, and now
  additionally renders one `ActionButton` per unconnected method.
- Each button awaits `connectPaymentMethod(m.id)`, then calls `setMethodId(m.id)` and
  raises the same success toast the Wallet screen uses.
- Destructured `connectPaymentMethod` from `useStore()` and imported `ActionButton`.

### Why `setMethodId` is part of the fix, not a nicety

`methodId` is seeded once, at mount, via `useState(connected[0]?.id ?? '')`. Because
`WithdrawSheet` is always mounted inside `WalletScreen`, that seed runs while nothing
is connected and yields `''`. Connecting alone would therefore have left `methodId`
empty, so `error` would still read *"Select a payment method."* and Continue would
still be disabled — relocating the dead-end one step later rather than removing it.
Selecting the just-connected method is what actually unblocks the flow.

### What was deliberately not changed

- No redesign: the container, dashed border, `Plus` icon and original sentence are
  all preserved; the connect affordances were added beneath them.
- The connected branch (the radio list) is byte-identical — the edit is confined to
  the `connected.length === 0` branch.
- `ActionButton` was reused rather than a new button written, matching the existing
  connect pattern in `wallet-screen.tsx`.
- No wallet logic touched: `withdraw()`, its validation, the idempotency key, and
  `connectPaymentMethod` in `lib/store.tsx` are all unchanged.
- The Wallet screen's "Manage" sheet was left alone; the inline route is additive.

### Verification

Live browser walkthrough at 384×639, light mode.

- **New-user flow:** Wallet → Withdraw with zero methods connected now shows four
  real connect buttons. Tapping GoPay showed the "Connecting" spinner, then a
  "GoPay connected" toast, and the sheet re-rendered with GoPay **selected**
  (checkmark) instead of stalling.
- **End-to-end:** with the balance temporarily seeded to `50000` to clear
  `MIN_WITHDRAW`, connecting DANA inline → entering `25.000` → Continue → Confirm
  produced *"Withdrawal successful — Rp25.000 sent to DANA"* and the "Withdrawal
  Sent" screen, proving the store's `METHOD_UNAVAILABLE` check accepts a method
  connected through the new inline path. The seed was reverted afterwards;
  `git diff` confirms `lib/store.tsx` is unmodified.
- **Existing connected flow:** connecting via the Wallet "Manage" sheet and then
  opening Withdraw renders the original radio list, not the empty state, and the
  method remains selectable. Unchanged from before.
- Browser console clean; `npx tsc --noEmit` exit 0; `pnpm build` succeeds.

### Known pre-existing behavior, out of scope

When a method is connected via the Wallet "Manage" sheet while `WithdrawSheet` is
already mounted, the method appears in the withdraw list **unselected**, because
`methodId` was seeded at mount and only re-seeded by `reset()` on sheet close. The
user must tap it once. This predates this change, is not a dead-end (the row is
interactive, and reopening the sheet re-seeds the selection), and lies outside P1-1's
scope, so it was left as-is.

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
