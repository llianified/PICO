# Contributing to PICO

Conventions below reflect what this repository already does — branch names, commit
subjects and PR flow are taken from the existing `git log`, not invented.

Read [`ARCHITECTURE.md`](./ARCHITECTURE.md) before your first change; the single-context
state model and the "derive, don't store" rule explain most of the codebase's constraints.

---

## Branch naming

Never commit directly to `main`. `main` auto-deploys to Vercel on every merge.

Use lowercase, hyphen-separated, descriptive branch names:

```
withdrawal-module
production-audit-remediation
storevalue-type-remediation
pico-production-audit
frontend-bug-resolution
```

For audit work, prefer naming the issue or module being remediated — e.g.
`p1-3-levelup-queue`, `p2-7-dialog-focus`. One branch per issue: P1 and P2 items are
remediated **one at a time**, not batched, so that each fix has its own reviewable diff and
its own verification record.

## Commit style

Existing history uses Conventional-Commit-style prefixes:

```
feat: fix "Max" button invalid amount below minimum withdrawal and add balance hint
feat: add withdrawal balance check and minimum threshold message
feat: enhance Withdraw sheet with inline payment method connection
feat: fix type mismatch and re-enable TypeScript checks for P1-5
feat: resolve P0 issues and update remediation status in production audit doc
docs: standardize documentation set and add missing remediation log
```

Rules:

- Prefix with `feat:`, `fix:`, `docs:`, `refactor:`, `chore:` or `test:`.
  Prefer `fix:` for genuine bug fixes — the history over-uses `feat:` for repairs; do not
  copy that habit.
- Imperative mood, lowercase after the colon, no trailing period.
- Reference the audit ID when the commit closes one: `fix: disable Max below minimum (P1-2)`.
- Keep source changes and documentation changes in the same commit when the docs describe
  that change. Use a separate `docs:` commit for documentation-only passes.
- Never mix two audit issues in one commit.

## Pull request checklist

Copy into the PR description:

```markdown
### Issue
Closes P?-? — <title>

### Change
<what changed, and why this approach>

### Verification
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] `pnpm build` succeeds
- [ ] Verified in the browser at 384×639 (or the affected viewport)
- [ ] Browser console free of errors and warnings
- [ ] Primary user path exercised end-to-end
- [ ] Any temporary test seed values reverted (`git status` clean)

### Scope
- [ ] No unrelated refactoring
- [ ] No formatting-only churn in untouched files
- [ ] No business logic changed beyond the issue's scope

### Documentation
- [ ] `CHANGELOG.md` updated under `## Unreleased`
- [ ] `TASKS.md` item ticked
- [ ] Remediation log entry added (`PICO_P0_REMEDIATION.md` / `PICO_P1_REMEDIATION.md`)
- [ ] `PICO_PRODUCTION_AUDIT.md` status updated, original finding preserved
```

A green type-check is **not** verification of behavior. If the change is user-visible,
exercise it in the browser and say what you observed.

## Code style

- **TypeScript everywhere.** No `any` and no `@ts-ignore`. Build-time type checking is on
  (`ignoreBuildErrors` was deliberately removed); do not re-add it to get a build through.
- **Keep `StoreValue` honest.** Anything on the context value must be declared in the type.
  Internal helpers stay internal — narrow the value, don't widen the type. This was P1-5.
- **Derive, don't store.** Counters that can be computed from `inventoryItems` or
  `achievements` must be `useMemo` values, never independent state. Storing them is what
  caused P0-5 and P2-10.
- **Validate next to the state you're guarding.** Economy and money rules belong in
  `lib/store.tsx` beside the ledger, not only in the component. The canonical shape is
  validate → await → re-validate → commit, reading live state through refs rather than
  caller-supplied arguments. Components may pre-validate for UX, but must never be the only
  enforcement.
- **Throw typed errors.** Follow `WithdrawError` / `WithdrawErrorCode` for new failure
  paths so the UI can map a reason to copy.
- **Reuse existing patterns before adding one.** `ActionButton` for async actions, `Modal`
  and `Sheet` for layered UI, the achievement queue for sequenced overlays, the
  `EmptyRewards`/`EmptyTransactions`/`EmptyInventory` family for empty states.
- **Shared formulas stay shared.** Reward previews must call `questKeyReward`,
  `questCoinReward` and `questMoneyReward` rather than inlining the arithmetic — the
  helpers exist so preview and grant cannot disagree.
- **Styling:** Tailwind utilities with the project's design tokens. No hardcoded
  `bg-white` / `bg-black`; no `tailwind.config.js` (Tailwind v4 is configured in
  `app/globals.css`). Preserve existing spacing and class ordering in files you touch.
- **Accessibility is not optional for new UI:** label icon-only controls, keep tap targets
  at 44×44px, make interactive elements focusable, and add `aria-busy` to async buttons.
- **Never toast success for a no-op.** If a setting does nothing, don't claim it worked
  (P1-6).
- **Do not flip `REWARDED_VIDEO_ENABLED`** without an ad provider, a real player and a
  server-verified completion callback. The flag is the only thing preventing the P0-2
  advertising-fraud path.
- **Revert test seeds.** Temporarily editing a seed value (e.g. `balance`) to reproduce a
  bug is fine; leaving it in is not. Confirm with `git status --porcelain` before opening
  the PR.

## Documentation update requirements

**Every future bug fix must also update all four of these.** A fix without its
documentation trail is incomplete, and PRs will be sent back for it.

| Document | Required update |
|---|---|
| [`CHANGELOG.md`](./CHANGELOG.md) | Add a bullet under `## Unreleased` in the right subsection (`Fixed`, `Changed`, `Added`, `Removed`). Keep a Changelog format. |
| [`TASKS.md`](./TASKS.md) | Tick the item; update the counts in the header line. |
| Remediation log | Append an entry to [`PICO_P0_REMEDIATION.md`](./PICO_P0_REMEDIATION.md) or [`PICO_P1_REMEDIATION.md`](./PICO_P1_REMEDIATION.md), in issue-number order, using the standard sections: **Issue · Status · Root cause · Solution · Verification · Files changed · Notes.** Create the corresponding log if the issue belongs to a band that has none yet (P2/P3 have no log). |
| [`PICO_PRODUCTION_AUDIT.md`](./PICO_PRODUCTION_AUDIT.md) | Add or update the inline **Status** line on the finding, and update the status summary table at the top. |

Rules for documentation edits:

- **Preserve history.** Never delete or rewrite an audit finding. Add a `Status` line above
  it and leave the original text intact for historical reference.
- **Never renumber issues.** `P1-2` means the same thing forever, including after it is
  fixed.
- **Do not invent features.** Documentation describes the repository as it is. Anything
  planned but unbuilt belongs in `ROADMAP.md` or the "Planned backend" section of
  `ARCHITECTURE.md`, explicitly marked as not implemented.
- **Record what you deliberately did not change**, and why. The existing remediation
  entries all do this, and it is the fastest way for a reviewer to confirm scope.
- **Update only the sections your change affects.** Do not rewrite whole documents.
- If a change alters architecture or behavior, update
  [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`README.md`](./README.md) too.
- If you notice documentation contradicting the code, record it in the audit's
  [drift appendix](./PICO_PRODUCTION_AUDIT.md#appendix--documentation-drift-and-stale-findings)
  rather than silently fixing the prose.

## Local commands

```bash
pnpm install
pnpm dev                    # http://localhost:3000
pnpm build                  # type-checked production build
pnpm start
pnpm exec tsc --noEmit      # type-check only
```

`pnpm lint` is currently **broken** — the script calls ESLint, which is not installed. Use
`tsc --noEmit` until that is fixed (tracked under Tooling in [`TASKS.md`](./TASKS.md)).
There is no test suite yet, so browser verification is the only behavioral check available.
