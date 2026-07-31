# PICO — P3 Remediation Log

Companion to [`PICO_PRODUCTION_AUDIT.md`](./PICO_PRODUCTION_AUDIT.md). The P0 pass is
logged in [`PICO_P0_REMEDIATION.md`](./PICO_P0_REMEDIATION.md), the P1 pass in
[`PICO_P1_REMEDIATION.md`](./PICO_P1_REMEDIATION.md) and the P2 pass in
[`PICO_P2_REMEDIATION.md`](./PICO_P2_REMEDIATION.md).

P3 issues are remediated **one at a time**, not as a batch. Each entry records the root
cause, exactly what changed, how it was verified, and what was deliberately left alone.
Issues absent from this log have not been addressed.

Every entry uses the same sections: **Issue · Status · Root cause · Solution ·
Verification · Files changed · Notes.** When adding an entry, append it in issue-number
order and follow that template — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Status

| Issue | Title | Status | Date |
|---|---|---|---|
| [P3-1](./PICO_PRODUCTION_AUDIT.md#p3--low) | Unused dependencies shipped | ⬜ Open | — |
| [P3-2](./PICO_PRODUCTION_AUDIT.md#p3--low) | Dead code and unreachable fallback | ⬜ Open | — |
| [P3-3](#p3-3--initiallogindates--makeconsecutivedays0-always-returns-an-empty-array) | `initialLoginDates = makeConsecutiveDays(0)` | ✅ Fixed | 2026-08-01 |
| [P3-4](./PICO_PRODUCTION_AUDIT.md#p3--low) | Hardcoded "Good Evening" greeting | ⬜ Open | — |
| [P3-5](./PICO_PRODUCTION_AUDIT.md#p3--low) | `unlockedAt: 'Just now'` frozen as a string | ⬜ Open | — |
| [P3-6](#p3-6--non-null-assertion-on-the-nav-lookup) | Non-null assertion on nav lookup | ✅ Fixed | 2026-08-01 |
| [P3-7](./PICO_PRODUCTION_AUDIT.md#p3--low) | Redundant `onAction` / `onClick` aliases | ⬜ Open | — |
| [P3-8](./PICO_PRODUCTION_AUDIT.md#p3--low) | `CountUp` cleanup writes on interrupted animations | ⬜ Open | — |
| [P3-9](./PICO_PRODUCTION_AUDIT.md#p3--low) | No Content-Security-Policy | ⬜ Open | — |
| [P3-10](./PICO_PRODUCTION_AUDIT.md#p3--low) | `userScalable: false` blocks pinch-zoom | ⬜ Open | — |
| [P3-11](./PICO_PRODUCTION_AUDIT.md#p3--low) | Achievement queue timers not cleared | ⬜ Open | — |
| [P3-12](./PICO_PRODUCTION_AUDIT.md#p3--low) | `md:h-[860px]` fixed desktop frame | ⬜ Open | — |

---

## P3-3 · `initialLoginDates = makeConsecutiveDays(0)` always returns an empty array

### Issue

Audit [P3-3](./PICO_PRODUCTION_AUDIT.md#p3--low). The login-streak seed was produced by a
function call that could only ever return `[]`, obscuring the fact that a new player starts
with no recorded login days.

### Status

✅ **Fixed** — 2026-08-01

### Root cause

Presentational, not behavioral. `makeConsecutiveDays(count)` loops `for (i = 0; i < count; i++)`,
so `count = 0` returns an empty array without iterating. Writing the seed as a call implied
a computed value that varied, when it was a constant. A reader had to open the helper to
learn that the streak seed is empty — and the call's shape invited the misreading that it
seeded *today* as a login day.

### Solution

`lib/mock-data.ts`

```ts
export const initialLoginDates: string[] = []
```

The explicit `string[]` annotation is load-bearing: a bare `[]` would infer `never[]`, which
would reject every later `push`/spread of a day key and change the exported type that
`lib/store.tsx` consumes. Annotating preserves the previous type exactly.

### Verification

- `pnpm exec tsc --noEmit` — passes clean, confirming the exported type is unchanged for
  `lib/store.tsx`, the only consumer.
- No browser pass was warranted: the emitted value is identical (`[]` in both cases), so
  there is no observable surface to exercise. The type-check is the meaningful check here,
  since the only risk in this change was type inference, not runtime behavior.

### Files changed

- `lib/mock-data.ts` — `initialLoginDates` seed.

### Notes

**Deliberately not changed:**

- **`makeConsecutiveDays` itself.** It is now exported but unreferenced. Removing it is
  in scope for [P3-2](./PICO_PRODUCTION_AUDIT.md#p3--low) (dead code), not P3-3, and it is
  a plausible utility for seeding a streak in testing or for a future backend fixture. Left
  in place with its doc comment intact.
- **The streak feature.** No streak logic, counting or display was touched.

---

## P3-6 · Non-null assertion on the nav lookup

### Issue

Audit [P3-6](./PICO_PRODUCTION_AUDIT.md#p3--low). `AppShell` resolved the active screen with
`nav.find((n) => n.id === tab)!.Screen`. If `tab` ever held a value absent from `nav`, the
assertion would silently pass type-checking and throw at runtime.

### Status

✅ **Fixed** — 2026-08-01

### Root cause

The `!` suppressed the exact case worth handling. `find` returns `NavItem | undefined`, and
the assertion asserted away the `undefined` rather than dealing with it, so reading `.Screen`
on a miss would throw `Cannot read properties of undefined`. Because the throw happens during
`Shell`'s render — above `<main>` and outside any error boundary — a single bad `tab` value
would blank the entire app rather than degrade one screen.

The `TabId` type made a miss unlikely but not impossible: `tab` is state, and any future
persistence layer (restoring a tab from `localStorage`, a deep link, or a Telegram start
param) can produce a stale or unrecognised id that satisfies `TabId` at compile time while
matching nothing in `nav` at runtime. The assertion was a promise the type system could not
keep.

### Solution

`components/app-shell.tsx`

```ts
const ActiveScreen = (nav.find((n) => n.id === tab) ?? nav[0]).Screen
```

`nav` is declared `as const`, so TypeScript types it as a non-empty tuple and knows `nav[0]`
is present. The fallback therefore needs no assertion of its own — the `!` is not relocated,
it is eliminated. `nav[0]` is the Home entry, matching the audit's recommended fix ("fall
back to home") and the app's own default `tab` value, so a desync lands on the same screen a
fresh session would.

### Verification

- `pnpm exec tsc --noEmit` — passes clean with no assertion present.
- Live browser walkthrough at 384×639, dark mode. All five tabs were exercised — Home,
  Adventure, Inventory, Wallet, Profile — and each still resolved to its own screen, which is
  the property at risk when replacing a lookup: a fallback that swallowed a legitimate match
  would show Home everywhere and still type-check.
- Browser console free of errors and warnings.

### Files changed

- `components/app-shell.tsx` — `ActiveScreen` lookup in `Shell`.

### Notes

**Deliberately not changed:**

- **Navigation behavior in the normal case.** Every id in `nav` resolves exactly as before;
  only the previously-throwing path differs.
- **No error boundary or diagnostic added.** A `console.warn` on the fallback path was
  considered and left out: the branch is currently unreachable, and P3-6 asks for a safe
  fallback, not for observability. If tab state ever becomes persisted, logging the
  unrecognised id belongs with that change.
- **`TabId` and the store's `navigate`.** Tightening the type or validating in `navigate`
  would be a broader change than the assertion this issue names.
- **`md:h-[860px]` on the very next line**, which is [P3-12](./PICO_PRODUCTION_AUDIT.md#p3--low) —
  same file, separate finding, still open.
