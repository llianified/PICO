# PICO — P1 Remediation Log

Companion to [`PICO_PRODUCTION_AUDIT.md`](./PICO_PRODUCTION_AUDIT.md). The P0 pass is
logged in [`PICO_P0_REMEDIATION.md`](./PICO_P0_REMEDIATION.md).

P1 issues are remediated **one at a time**, not as a batch. Each entry records the root
cause, exactly what changed, how it was verified, and what was deliberately left alone.
Issues absent from this log have not been addressed.

Every entry uses the same sections: **Issue · Status · Root cause · Solution ·
Verification · Files changed · Notes.** When adding an entry, append it in issue-number
order and follow that template — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Status

| Issue | Title | Status | Date |
|---|---|---|---|
| [P1-1](#p1-1--withdraw-sheet-dead-ends-when-no-payment-method-is-connected) | Withdraw sheet dead-ends with no payment method | ✅ Fixed | 2026-07-31 |
| [P1-2](#p1-2--max-button-produces-a-guaranteed-invalid-amount-below-the-minimum) | "Max" produces an invalid amount below the minimum | ✅ Fixed | 2026-08-01 |
| [P1-3](./PICO_PRODUCTION_AUDIT.md#p1-3--only-the-last-level-up-is-announced-when-several-happen-at-once) | Only the last level-up is announced | ⬜ Open | — |
| [P1-4](./PICO_PRODUCTION_AUDIT.md#p1-4--weekly-and-event-tabs-are-permanently-empty) | Weekly and Event tabs permanently empty | ⬜ Open | — |
| [P1-5](#p1-5--processachievementqueue-exported-through-context-but-absent-from-storevalue) | `processAchievementQueue` type/value drift | ✅ Fixed | 2026-07-31 |
| [P1-6](./PICO_PRODUCTION_AUDIT.md#p1-6--theme-setting-is-inert-app-is-hard-locked-to-dark) | Theme setting inert; hard-locked to dark | ⬜ Open | — |

---

## P1-1 · Withdraw sheet dead-ends when no payment method is connected

### Issue

Audit [P1-1](./PICO_PRODUCTION_AUDIT.md#p1-1--withdraw-sheet-dead-ends-when-no-payment-method-is-connected).
The primary monetization flow — cashing out — was blocked for every new user on their
first attempt.

### Status

✅ **Fixed** — 2026-07-31

### Root cause

With zero connected methods — the default, since all four ship `connected: false` — the
Withdraw sheet's payment-method section rendered a static `div` reading *"Connect a
payment method first."* next to a decorative, non-interactive `Plus` icon. Continue was
permanently disabled and there was no path forward. The only connect flow lived on the
Wallet screen behind "Manage", which the user had to guess at after closing the sheet.

### Solution

`components/wallet/withdraw-sheet.tsx`

- The empty state keeps its dashed container, `Plus` icon and original copy, and now
  additionally renders one `ActionButton` per unconnected method.
- Each button awaits `connectPaymentMethod(m.id)`, then calls `setMethodId(m.id)` and
  raises the same success toast the Wallet screen uses.
- Destructured `connectPaymentMethod` from `useStore()` and imported `ActionButton`.

**Why `setMethodId` is part of the fix, not a nicety.** `methodId` is seeded once, at
mount, via `useState(connected[0]?.id ?? '')`. Because `WithdrawSheet` is always mounted
inside `WalletScreen`, that seed runs while nothing is connected and yields `''`.
Connecting alone would therefore have left `methodId` empty, so `error` would still read
*"Select a payment method."* and Continue would still be disabled — relocating the
dead-end one step later rather than removing it. Selecting the just-connected method is
what actually unblocks the flow.

### Verification

Live browser walkthrough at 384×639, light mode.

- **New-user flow:** Wallet → Withdraw with zero methods connected now shows four real
  connect buttons. Tapping GoPay showed the "Connecting" spinner, then a "GoPay
  connected" toast, and the sheet re-rendered with GoPay **selected** (checkmark) instead
  of stalling.
- **End-to-end:** with the balance temporarily seeded to `50000` to clear `MIN_WITHDRAW`,
  connecting DANA inline → entering `25.000` → Continue → Confirm produced *"Withdrawal
  successful — Rp25.000 sent to DANA"* and the "Withdrawal Sent" screen, proving the
  store's `METHOD_UNAVAILABLE` check accepts a method connected through the new inline
  path. The seed was reverted afterwards; `git diff` confirms `lib/store.tsx` is
  unmodified.
- **Existing connected flow:** connecting via the Wallet "Manage" sheet and then opening
  Withdraw renders the original radio list, not the empty state, and the method remains
  selectable. Unchanged from before.
- Browser console clean; `npx tsc --noEmit` exit 0; `pnpm build` succeeds.

### Files changed

| File | Change |
|---|---|
| `components/wallet/withdraw-sheet.tsx` | Inline connect buttons in the empty branch; auto-select connected method |

### Notes

**Deliberately not changed:**

- No redesign — the container, dashed border, `Plus` icon and original sentence are all
  preserved; the connect affordances were added beneath them.
- The connected branch (the radio list) is byte-identical; the edit is confined to the
  `connected.length === 0` branch.
- `ActionButton` was reused rather than a new button written, matching the existing
  connect pattern in `wallet-screen.tsx`.
- No wallet logic touched: `withdraw()`, its validation, the idempotency key, and
  `connectPaymentMethod` in `lib/store.tsx` are all unchanged.
- The Wallet screen's "Manage" sheet was left alone; the inline route is additive.

**Known pre-existing behavior, out of scope.** When a method is connected via the Wallet
"Manage" sheet while `WithdrawSheet` is already mounted, the method appears in the
withdraw list **unselected**, because `methodId` was seeded at mount and only re-seeded by
`reset()` on sheet close. The user must tap it once. This predates the change, is not a
dead-end (the row is interactive, and reopening the sheet re-seeds the selection), and
lies outside P1-1's scope, so it was left as-is.

---

## P1-2 · "Max" button produces a guaranteed-invalid amount below the minimum

### Issue

Audit [P1-2](./PICO_PRODUCTION_AUDIT.md#p1-2--max-button-produces-a-guaranteed-invalid-amount-below-the-minimum).
Users below the threshold — i.e. all new users — hit a confusing, self-inflicted error on
the money screen.

### Status

✅ **Fixed** — 2026-08-01

### Root cause

The three `QUICK` presets each carried `disabled={q > balance}`, but "Max" had no disabled
condition at all and unconditionally ran `setAmount(String(balance))`. Whenever
`balance < MIN_WITHDRAW` (`10000`) that amount is invalid by definition, so the button's
only possible effect was to fill the field and immediately trip the validator's *"Minimum
withdrawal is Rp10.000."* — an error triggered by the app's own affordance.

The helper line underneath also only ever read *"Minimum Rp10.000. No fees on
withdrawals."*, which states the rule but not the shortfall, so a user at `Rp200` was left
to do the arithmetic themselves.

### Solution

`components/wallet/withdraw-sheet.tsx`

- Added `disabled={balance < MIN_WITHDRAW}` to the "Max" button, mirroring the condition
  the `QUICK` presets already used.
- The helper line below the preset row now branches: when `balance < MIN_WITHDRAW` it
  reads `{formatRp(MIN_WITHDRAW - balance)} more to withdraw. Minimum
  {formatRp(MIN_WITHDRAW)}.` (e.g. *"Rp9.800 more to withdraw. Minimum Rp10.000."*);
  otherwise it keeps the original *"Minimum Rp10.000. No fees on withdrawals."*

**Why the hint reuses the existing slot rather than adding one.** The helper line already
occupied that position and was already swapped out for the validation error when
`touched && error`. Extending that same ternary with a third branch keeps the layout,
spacing and design identical — no new element, no shift — and guarantees the explanation
and the error can never render simultaneously and contradict each other.

**Why "Max" can no longer produce an invalid amount.** With the guard in place the button
is only clickable when `balance >= MIN_WITHDRAW`, and in that case `amount = balance`
satisfies every validator rule: it is `> 0`, `>= MIN_WITHDRAW`, and `<= balance` (equal).
The integer rule holds too — `balance` is only ever seeded to `37500` and mutated by
integer addition (`prev + reward`) and integer subtraction (`prev - amount`), so
`String(balance)` never yields a decimal that the input's `replace(/\D/g, '')` would
silently mangle into a larger number.

### Verification

Live browser walkthrough at 384×720, light mode.

- **Below minimum** (balance temporarily seeded to `200` to reproduce the audit's
  scenario): the accessibility snapshot reports `button "Max" [disabled]` alongside all
  three presets disabled, and the helper line reads *"Rp9.800 more to withdraw. Minimum
  Rp10.000."* Clicking "Max" is inert — the amount field stays empty and **no error
  appears**, which is the exact behavior the audit asked for. Screenshot confirms the
  design is unchanged.
- **Above minimum** (seed reverted to the real `37500`): "Max" is enabled, fills `37.500`,
  and the field reports `aria-invalid=false` with no amount error — only *"Select a
  payment method."* remained, which is a separate control. Connecting GoPay inline cleared
  it and **Continue became enabled**, proving the Max-filled amount is fully valid
  end-to-end. Note `Rp50.000` stayed correctly disabled at this balance while "Max" did
  not.
- The temporary balance seed was reverted; `git status --porcelain` is empty, confirming
  `lib/store.tsx` and every other source file are unmodified by this remediation.
- Browser console free of errors/warnings; `npx tsc --noEmit` exit 0.

### Files changed

| File | Change |
|---|---|
| `components/wallet/withdraw-sheet.tsx` | `disabled` guard on "Max"; shortfall hint branch in the helper line |

### Notes

**Deliberately not changed:**

- **No withdraw business logic touched.** `withdraw()`, its `validate()` closure,
  `MIN_WITHDRAW`, the in-flight guard and the idempotency key in `lib/store.tsx` are all
  byte-identical. The store still re-validates independently; this change only stops the
  UI from offering an input it knows will be rejected.
- The `error` `useMemo` in the sheet is unchanged — the fix prevents the invalid amount
  rather than altering how an invalid amount is judged.
- The `QUICK` presets, the amount input, the payment-method section and the
  confirm/success steps are untouched.
- No styling, class names, spacing or component names were changed.

---

## P1-5 · `processAchievementQueue` exported through context but absent from `StoreValue`

### Issue

Audit [P1-5](./PICO_PRODUCTION_AUDIT.md#p1-5--processachievementqueue-is-exported-through-context-but-absent-from-the-storevalue-type).
Maintainability / type safety: the type contract had silently drifted from the runtime
value, and `ignoreBuildErrors` was hiding all type regressions from CI.

### Status

✅ **Fixed** — 2026-07-31

### Root cause

`processAchievementQueue` — an internal scheduling primitive for the achievement toast
queue — was included in the context value object passed to `StoreContext.Provider`, but
was never declared in the `StoreValue` type. The mismatch went undetected because the
object literal is contextually typed through `useMemo<StoreValue>` and because
`next.config.mjs` set `typescript.ignoreBuildErrors: true`, which suppressed all type
errors at build time.

### Solution

`lib/store.tsx`

- Removed `processAchievementQueue` from the context value object.
- Removed `processAchievementQueue` from the `useMemo` dependency array.

The exported value and the exported `StoreValue` type now match exactly.

`next.config.mjs`

- Removed the `typescript.ignoreBuildErrors: true` block so type errors fail the build.

### Verification

- `npx tsc --noEmit` — exit 0, no errors (before and after).
- `pnpm build` — succeeds; the `Running TypeScript` step now executes as part of the build
  and passes, confirming checking is genuinely re-enabled rather than skipped.
- A repository-wide search confirmed `processAchievementQueue` was referenced only inside
  `lib/store.tsx`; no component ever read it off the store, so removing it from the
  context surface is not a breaking change. Achievement queueing and toast sequencing are
  unaffected.

### Files changed

| File | Change |
|---|---|
| `lib/store.tsx` | Removed the function from the context value and its `useMemo` deps |
| `next.config.mjs` | Removed `typescript.ignoreBuildErrors` |

### Notes

**Behavior impact: none.**

**Deliberately not changed:**

- The `processAchievementQueue` function itself is untouched. It remains a `useCallback`
  inside `StoreProvider` and is still invoked internally by `unlockAchievementProgress`,
  which keeps it in its own dependency array.
- `StoreValue` was **not** extended to declare the function. The audit's expected behavior
  is that internal helpers stay internal, so the value was narrowed to the type rather
  than the type widened to the value.
- No unrelated type errors were fixed, because there were none — `tsc --noEmit` already
  passed clean before the change.
