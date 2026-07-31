# PICO — P2 Remediation Log

Companion to [`PICO_PRODUCTION_AUDIT.md`](./PICO_PRODUCTION_AUDIT.md). The P0 pass is
logged in [`PICO_P0_REMEDIATION.md`](./PICO_P0_REMEDIATION.md) and the P1 pass in
[`PICO_P1_REMEDIATION.md`](./PICO_P1_REMEDIATION.md).

P2 issues are remediated **one at a time**, not as a batch. Each entry records the root
cause, exactly what changed, how it was verified, and what was deliberately left alone.
Issues absent from this log have not been addressed.

Every entry uses the same sections: **Issue · Status · Root cause · Solution ·
Verification · Files changed · Notes.** When adding an entry, append it in issue-number
order and follow that template — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Status

| Issue | Title | Status | Date |
|---|---|---|---|
| [P2-1](./PICO_PRODUCTION_AUDIT.md#p2-1--quest-reward-preview-omits-coins-that-are-actually-granted) | Reward preview omits coins that are granted | ⬜ Open | — |
| [P2-2](#p2-2--key-reward-formula-duplicated-inline-instead-of-using-the-shared-helper) | Key reward formula duplicated inline | ✅ Fixed | 2026-08-01 |
| [P2-3](./PICO_PRODUCTION_AUDIT.md#p2-3--progress-bar-shows-50-while-the-label-reads-0--1) | Progress bar shows 50% while label reads "0 / 1" | ⬜ Open | — |
| [P2-4](./PICO_PRODUCTION_AUDIT.md#p2-4--chest-opening-bypasses-the-affordability-check-it-appears-to-enforce) | Chest opening bypasses its affordability check | ⬜ Open | — |
| [P2-5](./PICO_PRODUCTION_AUDIT.md#p2--medium) | Energy consumed on uncompletable quests | ⬜ Open | — |
| [P2-6](./PICO_PRODUCTION_AUDIT.md#p2--medium) | Energy economy allows only 5 quests | ⬜ Open | — |
| [P2-7](./PICO_PRODUCTION_AUDIT.md#p2--medium) | Modals lack focus trapping and restoration | ⬜ Open | — |
| [P2-8](./PICO_PRODUCTION_AUDIT.md#p2--medium) | `ReferralModal` is not a modal | ⬜ Open | — |
| [P2-9](./PICO_PRODUCTION_AUDIT.md#p2--medium) | `navigator.clipboard` used without a fallback | ⬜ Open | — |
| [P2-10](./PICO_PRODUCTION_AUDIT.md#p2--medium) | Achievement counters can overrun the total | ✅ Fixed | 2026-07-31 |
| [P2-11](./PICO_PRODUCTION_AUDIT.md#p2--medium) | Two parallel "time ago" implementations | ✅ Fixed | 2026-07-31 |
| [P2-12](./PICO_PRODUCTION_AUDIT.md#p2--medium) | Per-item interval timers in the rewards feed | ⬜ Open | — |

P2-10 and P2-11 were closed incidentally during the P0 pass and are recorded in the
audit's
[drift appendix](./PICO_PRODUCTION_AUDIT.md#appendix--documentation-drift-and-stale-findings)
rather than as entries here.

---

## P2-2 · Key reward formula duplicated inline instead of using the shared helper

### Issue

Audit [P2-2](./PICO_PRODUCTION_AUDIT.md#p2-2--key-reward-formula-duplicated-inline-instead-of-using-the-shared-helper).
The quest detail screen's reward preview computed the key payout itself instead of calling
the shared helper that the store uses when granting it.

### Status

✅ **Fixed** — 2026-08-01

### Root cause

`lib/mock-data.ts` defines `questKeyReward(xp)` under a comment stating the reward formulas
are "shared by the store (when granting) and the quest detail screen (when previewing) so
the numbers always agree." The store honoured that: `rollQuestReward` calls
`questKeyReward(xpValue)`. The Adventure screen did not — its JSX inlined
`quest.xpValue >= 500 ? 2 : 1` for the count and a second copy of the same comparison,
`quest.xpValue >= 500 ? 's' : ''`, for the plural suffix. The values agreed only by
coincidence, and the first tuning of the formula would have silently desynchronised the
preview from the grant.

### Solution

`components/screens/adventure-screen.tsx`

- Imported `questKeyReward` from `@/lib/mock-data` alongside the already-imported
  `questMoneyReward`.
- Added `const keyReward = questKeyReward(quest.xpValue)` in `QuestDetail`, with a comment
  recording why the preview must not hold its own copy of the formula.
- The key row now renders `+{keyReward} Key{keyReward > 1 ? 's' : ''}`, so both the number
  and the pluralisation derive from the single shared source.

Pluralising from `keyReward` rather than re-testing `quest.xpValue` matters: had the suffix
kept its own XP comparison, the second copy of the formula would have survived the fix and
could still disagree with the number beside it.

### Verification

- `pnpm exec tsc --noEmit` — passes clean.
- Live browser walkthrough at 384×639, dark mode.
  - **500 XP quest** ("Complete Daily Survey", the `>= 500` branch): reward preview reads
    `+2 Keys` — identical to the previous output.
  - **100 XP quest** ("Login to PICO", the below-500 branch): reward preview reads
    `+1 Key` — identical to the previous output, singular suffix intact.
  - Browser console free of errors and warnings.

Both branches of the formula were exercised deliberately, because a refactor of a
conditional is only verified once each side of the condition has been observed.

### Files changed

- `components/screens/adventure-screen.tsx` — import, derived `keyReward`, key reward row.
- `CHANGELOG.md`, `TASKS.md`, `PICO_PRODUCTION_AUDIT.md`, `ARCHITECTURE.md` and this log —
  documentation.

### Notes

**Deliberately not changed:**

- **`questKeyReward` itself.** The formula is untouched, so gameplay balance is identical:
  quests worth 500 XP or more still pay 2 keys, everything else 1.
- **P2-1 (reward preview omits coins).** The same reward list is missing a coins row, and
  the same file is involved, but it is a separate finding with its own behavioural change
  and remains open.
- **The completion toast** in `handleComplete`, which already pluralises from the granted
  `keys` value returned by `completeQuest` and so was never a duplicate of the formula.
- **`lib/store.tsx`.** It was already calling the shared helper correctly.
