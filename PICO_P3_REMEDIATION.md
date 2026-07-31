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
| [P3-2](#p3-2--dead-code-and-an-unreachable-fallback) | Dead code and unreachable fallback | ✅ Fixed | 2026-08-01 |
| [P3-3](#p3-3--initiallogindates--makeconsecutivedays0-always-returns-an-empty-array) | `initialLoginDates = makeConsecutiveDays(0)` | ✅ Fixed | 2026-08-01 |
| [P3-4](./PICO_PRODUCTION_AUDIT.md#p3--low) | Hardcoded "Good Evening" greeting | ⬜ Open | — |
| [P3-5](#p3-5--unlockedat-just-now-frozen-as-a-string) | `unlockedAt: 'Just now'` frozen as a string | ✅ Fixed | 2026-08-01 |
| [P3-6](#p3-6--non-null-assertion-on-the-nav-lookup) | Non-null assertion on nav lookup | ✅ Fixed | 2026-08-01 |
| [P3-7](#p3-7--redundant-onaction--onclick-prop-aliases-on-actionbutton) | Redundant `onAction` / `onClick` aliases | ✅ Fixed | 2026-08-01 |
| [P3-8](./PICO_PRODUCTION_AUDIT.md#p3--low) | `CountUp` cleanup writes on interrupted animations | ⬜ Open | — |
| [P3-9](./PICO_PRODUCTION_AUDIT.md#p3--low) | No Content-Security-Policy | ⬜ Open | — |
| [P3-10](./PICO_PRODUCTION_AUDIT.md#p3--low) | `userScalable: false` blocks pinch-zoom | ⬜ Open | — |
| [P3-11](#p3-11--achievement-modal-queue-timers-not-cleared-on-unmount) | Achievement queue timers not cleared | ✅ Fixed | 2026-08-01 |
| [P3-12](./PICO_PRODUCTION_AUDIT.md#p3--low) | `md:h-[860px]` fixed desktop frame | ⬜ Open | — |

---

## P3-2 · Dead code and an unreachable fallback

### Issue

Audit [P3-2](./PICO_PRODUCTION_AUDIT.md#p3--low). Several exports and one import existed
without a caller, and `DEFAULT_SURVEY` was wired into a branch that could never be taken.

### Status

✅ **Fixed** — 2026-08-01

### Root cause

Three unrelated kinds of dead weight had accumulated behind one issue number:

- **An unreachable fallback.** `surveyQuestions = quest.survey?.length ? quest.survey : DEFAULT_SURVEY`
  looked like a safety net, but every read of `surveyQuestions` was gated behind
  `hasSurvey`, which itself required `quest.survey?.length`. The `DEFAULT_SURVEY` arm was
  therefore unreachable by construction — the most misleading form of dead code, because it
  implied quests could ship without their own survey and still render one.
- **Unreferenced components.** `components/ui/button.tsx` (58 lines) had no importer, and
  `skeleton.tsx` exported its base `Skeleton` block alongside presets that nothing rendered.
- **Unused imports and helpers.** `ENERGY_MAX` was imported into `home-screen.tsx` without
  being read, and `lib/mock-data.ts` carried seed helpers left behind by earlier fixes.

### Solution

- `components/screens/adventure-screen.tsx` — dropped the `DEFAULT_SURVEY` import and
  replaced the fallback with `const surveyQuestions = quest.survey ?? []`, carrying a
  comment recording that the `[]` is type narrowing and never renders. Behaviour is
  identical because the removed arm was unreachable; the `??` now says so.
- `components/ui/button.tsx` — deleted.
- `components/ui/skeleton.tsx` — `Skeleton` is no longer exported (it is now an internal
  block documented as such) and `SkeletonCard` was removed, leaving only `SkeletonRow`.
- `components/screens/home-screen.tsx` — removed the unused `ENERGY_MAX` import.
- `lib/mock-data.ts` — removed `DEFAULT_SURVEY` and the unused seed helpers, including
  `makeConsecutiveDays`, which [P3-3](#p3-3--initiallogindates--makeconsecutivedays0-always-returns-an-empty-array)
  had left exported and unreferenced and explicitly deferred to this issue.

### Verification

- `pnpm exec tsc --noEmit` — passes clean, which is the load-bearing check for a deletion
  pass: any surviving importer of `button.tsx`, `Skeleton`, `SkeletonCard`, `DEFAULT_SURVEY`
  or the removed helpers would fail the build.
- Live browser walkthrough at 384×639, dark mode. The survey quest ("Complete Daily
  Survey") was started and completed end-to-end so the touched `surveyQuestions` expression
  was actually exercised rather than merely type-checked, and its questions still rendered
  and gated completion as before. Console free of errors and warnings.

### Files changed

- `components/screens/adventure-screen.tsx`, `components/screens/home-screen.tsx`,
  `components/ui/skeleton.tsx`, `lib/mock-data.ts`; `components/ui/button.tsx` deleted.
- `CHANGELOG.md`, `TASKS.md`, `PICO_PRODUCTION_AUDIT.md`, `ROADMAP.md` and this log —
  documentation.

### Notes

**Known residue, deliberately left:**

- **`SkeletonRow` is still exported and still unreferenced.** Every item the audit *named*
  is gone, but the file's remaining preset has no consumer, because no screen has a loading
  state yet. It was kept rather than deleted: the store's simulated `delay()` calls are the
  places a skeleton belongs, and removing the last preset would mean rewriting it when they
  are wired to a real backend. If the backend work does not adopt it, delete the file then.

**Deliberately not changed:**

- **`lib/store.tsx`'s imports.** The audit suspected `Avatar`, `formatRp`, `formatCompact`
  and `avatars` were unused there; re-checked against the current tree, all four are read.
  No change was warranted, and the audit's suspicion is noted here rather than acted on.
- **`class-variance-authority`**, the one dependency [P3-1](./PICO_PRODUCTION_AUDIT.md#p3--low)
  named that is still installed. It was `button.tsx`'s only consumer, so deleting that file
  made the package genuinely unused — but pruning `package.json` is P3-1's scope, and P3-1
  is still open.

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

- **`makeConsecutiveDays` itself.** It was left exported but unreferenced, since removing
  it was in scope for [P3-2](#p3-2--dead-code-and-an-unreachable-fallback) (dead code), not
  P3-3. *Update: P3-2 has since deleted it.*
- **The streak feature.** No streak logic, counting or display was touched.

---

## P3-5 · `unlockedAt: 'Just now'` frozen as a string

### Issue

Audit [P3-5](./PICO_PRODUCTION_AUDIT.md#p3--low). `openChest` stamped every new inventory
item with the literal string `'Just now'`, so an item found an hour ago and one found a
second ago both read "Just now", permanently.

### Status

✅ **Fixed** — 2026-08-01

### Root cause

The type was the bug. `InventoryItem.unlockedAt` was declared `string`, so the field held a
*rendered label* rather than a *time*, and the label was computed once at creation and then
frozen. Nothing downstream could recover the real time to reformat it, because the
information had already been thrown away — this is not a formatting oversight but a data
model that stored the presentation instead of the fact.

### Solution

- `lib/mock-data.ts` — `unlockedAt` is now `number`, documented as *"Epoch ms of when the
  item was unlocked. Formatted only at render time."* `formatRelativeTime`'s doc comment was
  widened to name the inventory as a second consumer alongside the reward feed.
- `lib/store.tsx` — `openChest` now stamps `unlockedAt: Date.now()`.
- `components/screens/inventory-screen.tsx` — added an `UnlockedAtLabel` component that
  formats the timestamp with the shared `formatRelativeTime`, and used it in both places the
  raw field used to be printed: the item detail sheet and `ItemRow` in the grid.

`UnlockedAtLabel` deliberately mirrors `TimeAgoDisplay` from the P0-1 fix rather than
formatting inline. It holds `display` as `string | null`, renders a stable `—` on the first
pass and fills the real label in a `useEffect` after mount, with a comment recording why:
reading `Date.now()` during render is exactly what caused **P0-1**, and reintroducing it in
a second component would have reintroduced the hydration mismatch on the Inventory screen.
A `setInterval(update, 60000)` keeps the label honest as time passes, so "Just now" now
actually becomes "1m ago".

### Verification

- `pnpm exec tsc --noEmit` — passes clean. This is the check that mattered most: changing
  the field from `string` to `number` would fail the build at every remaining site that
  rendered it raw, so a clean type-check proves none were missed.
- Live browser walkthrough at 384×639, dark mode. A chest was opened and the new item
  inspected in both surfaces — grid row and detail sheet — reading "Just now" on arrival and
  "1m ago" after waiting past the first tick, which is the behaviour the frozen string could
  never produce.
- Browser console free of errors and warnings, and specifically free of hydration warnings —
  the regression this change was most at risk of causing.

### Files changed

- `lib/mock-data.ts` — `InventoryItem.unlockedAt` type; `formatRelativeTime` doc comment.
- `lib/store.tsx` — `openChest` item stamp.
- `components/screens/inventory-screen.tsx` — `UnlockedAtLabel`; detail sheet and `ItemRow`.
- `CHANGELOG.md`, `TASKS.md`, `PICO_PRODUCTION_AUDIT.md`, `ROADMAP.md` and this log —
  documentation.

### Notes

**Deliberately not changed:**

- **`formatRelativeTime` itself.** The existing shared helper was reused rather than
  extended, so the inventory and the reward feed cannot phrase the same age differently —
  the concern behind [P2-11](./PICO_PRODUCTION_AUDIT.md#p2-11--two-parallel-time-ago-implementations-one-unused).
- **`initialInventoryItems`.** Still `[]` per P0-5, so no seed data needed migrating from
  strings to timestamps.

**Known interaction with an open issue:**

- **This adds per-item timers, which is [P2-12](./PICO_PRODUCTION_AUDIT.md#p2-12--per-item-interval-timers-in-the-rewards-feed)'s
  defect in a second location.** Each `UnlockedAtLabel` mounts its own one-minute interval,
  exactly as each feed row does. It was written this way on purpose: matching the existing
  pattern keeps P2-12 a single consolidation with one shared ticker, whereas inventing a
  bespoke clock here would leave two patterns to reconcile. The inventory is capped at
  `INVENTORY_CAP`, so the count is bounded. **P2-12 must now cover the Inventory screen as
  well as the Home feed.**

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

---

## P3-7 · Redundant `onAction` / `onClick` prop aliases on `ActionButton`

### Issue

Audit [P3-7](./PICO_PRODUCTION_AUDIT.md#p3--low). `ActionButton` accepted two props for one
behaviour — `onAction` and `onClick` — resolved internally with `const handler = onAction ?? onClick`.

### Status

✅ **Fixed** — 2026-08-01

### Root cause

The alias made the component's contract ambiguous in a way its name actively worked against.
`onClick` on a component that wraps a `<button>` reads as the DOM handler, but this one was
swallowed and run through the loading/success/error lifecycle instead — so passing it got
behaviour the prop name did not advertise, and passing both silently discarded one. The
`??` also meant the precedence rule existed only in the implementation, nowhere in the type.

### Solution

- `components/ui/action-button.tsx` — removed the `onClick` prop and its type entry, deleted
  the `handler` indirection so `run` awaits `onAction?.()` directly, and updated the
  `useCallback` dependency array from `handler` to `onAction`. Added a doc comment on
  `onAction` recording the one case where omitting it is correct: `type="submit"`, where the
  enclosing form drives submission and the component's `onClick` is left `undefined`.
- `components/profile/avatar-sheet.tsx` and `components/profile/settings-sheet.tsx` — the two
  remaining `onClick` callers were migrated to `onAction`.

`onAction` was kept as the survivor rather than `onClick` precisely because the prop is not a
DOM click handler: it is an async action whose promise drives the button's own state. Keeping
`onClick` would have preserved the misleading name.

### Verification

- `pnpm exec tsc --noEmit` — passes clean. This is the decisive check for removing a prop:
  any missed `onClick` caller becomes a compile error, since `ActionButton`'s props are an
  exact object type with no index signature.
- Live browser walkthrough at 384×639, dark mode, exercising both migrated call sites through
  the full lifecycle — Profile → avatar sheet (select an avatar: loading → success) and
  Profile → settings sheet (the destructive delete action). Both still showed the spinner,
  the success state and the reset after `resetDelay`, confirming the migration preserved the
  lifecycle rather than degrading to a plain click.
- Console free of errors and warnings, including React's unknown-prop warning, which a
  leftover `onClick` forwarded to the DOM would have produced.

### Files changed

- `components/ui/action-button.tsx` — prop removed, `handler` indirection deleted, deps updated.
- `components/profile/avatar-sheet.tsx`, `components/profile/settings-sheet.tsx` — migrated callers.
- `CHANGELOG.md`, `TASKS.md`, `PICO_PRODUCTION_AUDIT.md`, `ROADMAP.md` and this log —
  documentation.

### Notes

**Deliberately not changed:**

- **The lifecycle itself.** Status transitions, `resetDelay`, `aria-busy`, and the
  `type === 'submit'` branch that leaves the DOM `onClick` undefined are all untouched. This
  was an API rename, not a behaviour change.
- **`Toggle`'s own `onClick`.** It lives in the same file but is a real DOM handler on a
  `role="switch"` button, not an alias, so it was correctly left alone.
- **Other components' `onClick` props.** Plain buttons across the app still use `onClick` as
  the DOM handler, which is right — the finding was specifically about the duplicate on
  `ActionButton`.

---

## P3-11 · Achievement modal queue timers not cleared on unmount

### Issue

Audit [P3-11](./PICO_PRODUCTION_AUDIT.md#p3--low). The achievement queue chained a 2.5s
display timer and a 300ms gap timer with no cleanup, so either could fire after the provider
had unmounted and call `setState` on a dead tree.

### Status

✅ **Fixed** — 2026-08-01

### Root cause

Two problems, and the second is why the obvious fix would not have worked. The gap timer was
started as a bare `setTimeout(processAchievementQueue, 300)` whose handle was never stored,
so it was uncancellable by construction. And `achievementTimeoutRef` could not simply be
reused to hold it: that ref does double duty as the *"queue is draining"* flag that stops
`unlockAchievementProgress` from starting a second concurrent drain, so parking the gap
handle in it would have made the two roles fight — clearing the flag to cancel a timer would
have re-opened the guard.

### Solution

`lib/store.tsx`

- Added `achievementGapTimeoutRef`, a dedicated handle for the 300ms gap, with a comment
  recording exactly why it cannot share `achievementTimeoutRef`: that ref doubles as the
  drain flag. The chained call is now
  `achievementGapTimeoutRef.current = setTimeout(processAchievementQueue, 300)`.
- Added `achievementMountedRef` and an early `if (!achievementMountedRef.current) return` at
  the top of `processAchievementQueue`, so a timer that has already fired cannot proceed.
- Added a cleanup effect that sets `achievementMountedRef.current = false`, clears both
  handles and nulls them.

The mounted flag is belt-and-braces on top of the `clearTimeout` calls, and deliberately so:
`clearTimeout` cannot catch a callback that has already been dequeued and is mid-flight, so
the guard closes the window the clears cannot.

### Verification

- `pnpm exec tsc --noEmit` — passes clean.
- Live browser walkthrough at 384×639, dark mode. Achievements were unlocked to enqueue more
  than one modal, confirming the queue still drains in order with the 300ms gap between
  entries — the property most at risk, since moving the gap handle to a new ref could have
  broken the chain rather than just made it cancellable.
- The teardown path was exercised by triggering a queued achievement and forcing a Fast
  Refresh remount mid-drain. React's *"Can't perform a React state update on an unmounted
  component"* warning, which the old chain produced, no longer appears; the console is clean.

### Files changed

- `lib/store.tsx` — `achievementGapTimeoutRef`, `achievementMountedRef`, the guard in
  `processAchievementQueue`, and the cleanup effect.
- `CHANGELOG.md`, `TASKS.md`, `PICO_PRODUCTION_AUDIT.md`, `ROADMAP.md` and this log —
  documentation.

### Notes

**Deliberately not changed:**

- **The 2.5s / 300ms timings and the queue's ordering.** Unchanged; this fix made the timers
  cancellable, it did not retune them.
- **`achievementTimeoutRef`'s double role as the drain flag.** Left as-is. Splitting the flag
  from the handle would be a clearer design, but it is a refactor of the queue's concurrency
  model rather than the cleanup this issue asks for; the new ref plus the comment records the
  constraint for whoever does that work.
- **The toast timers** in `toast()`, which are separate and were not named by the finding.
- **[P1-3](./PICO_PRODUCTION_AUDIT.md#p1-3--only-the-last-level-up-is-announced-when-several-happen-at-once)
  (level-up queue).** Still open, and still expected to reuse this queue's pattern — it now
  inherits the cleanup discipline added here.
