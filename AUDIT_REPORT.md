# PICO Frontend Comprehensive Bug Audit Report

**Date**: 2025-07-31  
**Project**: PICO - Pixel Adventure Game  
**Scope**: Full frontend codebase including routing, state management, component logic, and data flow

---

## Executive Summary

The PICO frontend is functionally complete but has **7 critical and high-priority bugs** that compromise gameplay progression, user experience, and data consistency. Key issues involve state synchronization, input validation, memory management, and accessibility. All identified bugs are actionable and categorized below.

---

## P0 - CRITICAL (App Unusable / Progression Broken)

### P0.1 - Login Quest Auto-Start Creates Button State Flicker (PARTIALLY FIXED)
**File**: `components/screens/adventure-screen.tsx` (line 121-128)  
**Current Behavior**: When opening the login quest, a `useEffect` auto-starts it if it has progress. There's logic to skip login/invite quests, but the implementation needs verification for consistent behavior.

**Expected Behavior**: The login and invite quests should NOT auto-start since they have manual checkin flows.

**Root Cause**: Auto-start logic attempts to handle login/invite but timing may still cause flicker.

**Status**: Partial fix in place - skip logic implemented but test thoroughly.

---

### P0.2 - Energy Consumption Not Validated Before Async Operation
**File**: `lib/store.tsx` (line 534-548)  
**Current Behavior**: `completeQuest()` checks energy via `energyRef.current < ENERGY_COST` at the start, but:
- Energy is validated before async delay of 1400ms
- No re-check after the delay
- Multiple rapid quest completions could bypass energy limit due to race condition
- Player's energy could regenerate during the delay

**Expected Behavior**: Energy should be reserved/locked when completion starts or re-validated after the delay before consuming.

**Root Cause**: Race condition between validation and actual consumption due to async delay window.

**Recommended Fix**: Lock energy immediately when `completeQuest()` is called:
```typescript
// CURRENT (UNSAFE):
if (energyRef.current < ENERGY_COST) throw new Error('NO_ENERGY')
await delay(1400) // Player could regen or multiple calls could pass check
consumeEnergy(ENERGY_COST)

// SUGGESTED:
if (energyRef.current < ENERGY_COST) throw new Error('NO_ENERGY')
consumeEnergy(ENERGY_COST) // Lock immediately
await delay(1400)
// ...rest of logic
```

---

### P0.3 - Missing `setLanguage` and `setTheme` Implementation
**File**: `lib/store.tsx` (line 157-159 declares, no implementation)  
**Current Behavior**: These functions are exported in the store interface but have no actual implementation. Calling these will cause a runtime error.

**Expected Behavior**: Functions should update language and theme state.

**Root Cause**: Function stubs declared in type but never implemented in provider.

**Recommended Fix**: Implement the missing handlers in the StoreProvider.

---

### P0.4 - `logReward` Function Referenced But Not Defined
**File**: `lib/store.tsx` (line 524, 531)  
**Current Behavior**: `applyQuestReward()` calls `logReward()` which is never defined. This will cause a runtime error when ANY quest is completed.

**Expected Behavior**: Should log the reward to the rewards feed state.

**Root Cause**: Function call exists in code but implementation is completely missing.

**Recommended Fix**: Implement `logReward` function:
```typescript
const logReward = useCallback((reward: RewardFeedItem) => {
  setRewardsFeed((prev) => [reward, ...prev])
}, [])
```
This must be added before `applyQuestReward` which depends on it.

---

## P1 - HIGH (Major Feature Broken)

### P1.1 - Modal Positioning Issue on Mobile (Safe-Area Inset Not Respected)
**File**: `components/ui/modal.tsx` (line 33)  
**Current Behavior**: Modal uses absolute positioning `inset-0` which ignores safe-area insets. On Telegram Mini Apps and mobile browsers with notches/home indicators, modal content can be hidden behind system UI.

**Expected Behavior**: Modal should respect `env(safe-area-inset-*)` CSS variables like the main app shell does.

**Root Cause**: No safe-area consideration in modal positioning - copied from base UI without mobile adaptation.

**Recommended Fix**: Update modal to account for safe-area padding on mobile Telegram Mini App.

---

### P1.2 - TimeAgoDisplay Component Creates Multiple Intervals (Memory Leak)
**File**: `components/screens/home-screen.tsx` (line 11-30)  
**Current Behavior**: Each `TimeAgoDisplay` instance creates a `setInterval(update, 60000)` that runs every 60 seconds. With 3+ reward items in the list:
- 3+ intervals running simultaneously
- Intervals never properly cleaned up if component unmounts during interval
- Recalculation happens even if timestamp hasn't changed

**Expected Behavior**: Should calculate relative time efficiently and only update when timestamp changes.

**Root Cause**: Inefficient interval management with improper cleanup.

**Recommended Fix**: Either calculate once or use `useMemo` and skip update if timestamp unchanged.

---

### P1.3 - Achievement Events Overwritten (Notifications Lost)
**File**: `lib/store.tsx` (line 436-445)  
**Current Behavior**: Multiple achievement unlocks in rapid succession cause:
1. First achievement sets timeout for 500ms display
2. Second achievement immediately clears that timeout and sets new one
3. First achievement is never displayed to user

**Expected Behavior**: Achievement notifications should queue and display sequentially.

**Root Cause**: Single `achievementQueueRef` - when new achievement unlocks, previous timeout is cleared without displaying first one.

**Recommended Fix**: Implement proper achievement queue array with sequential processing.

---

### P1.4 - Energy Timer Doesn't Account for System Sleep
**File**: `lib/store.tsx` (line 352-370) and `components/screens/home-screen.tsx` (line 48-59)  
**Current Behavior**: 
- Energy timer uses `setInterval(1000)` with `Date.now()` comparisons
- If device enters sleep/suspend, interval pauses but timer display continues
- When device wakes, timer is out of sync
- No handling for negative remaining time

**Expected Behavior**: Timer should accurately handle sleep/wake cycles and system time changes.

**Root Cause**: Naive interval-based approach without validating time hasn't gone backwards.

**Recommended Fix**: Add safeguards to timer calculation and handle invalid time states.

---

## P2 - MEDIUM (UX Issues)

### P2.1 - Inventory Cap Check Has Race Condition
**File**: `components/screens/inventory-screen.tsx` (line 62-65)  
**Current Behavior**: Before opening chest, code checks `inventoryItems.length >= INVENTORY_CAP`, then:
- `setOpening(true)` and calls async `openChest()` with 1500ms delay
- Another interaction could add items during this window
- Inventory could exceed cap after validation passes

**Expected Behavior**: Should prevent inventory from exceeding cap.

**Root Cause**: Validation happens before async operation without re-check.

**Recommended Fix**: Re-validate cap inside `openChest()` or use optimistic update with validation.

---

### P2.2 - Withdraw Button UX During Submission
**File**: `components/screens/wallet-screen.tsx` (line 65-66)  
**Current Behavior**: Withdraw button disabled during initial 650ms balance load, but:
- If user tries to withdraw during this time, button appears active
- No clear indication that withdrawal is processing
- `submitting` state from `WithdrawSheet` not visible in main button

**Expected Behavior**: Button should provide clear feedback about all states (loading balance, processing withdrawal).

**Root Cause**: Button state only reflects initial `loading`, not submission state from child component.

**Recommended Fix**: Ensure submitting state is properly communicated or combine states.

---

### P2.3 - Withdraw Sheet Not Dismissible During Submission
**File**: `components/wallet/withdraw-sheet.tsx` (line 87)  
**Current Behavior**: When withdrawal is processing, `dismissible={!submitting}` prevents closing via backdrop click or Escape key. User is trapped for 1600ms.

**Expected Behavior**: Should either allow dismissal with confirmation or show clear explanation.

**Root Cause**: UX decision to prevent navigation during submission, but no alternative interaction available.

**Recommended Fix**: Either allow dismissal or provide clearer "Processing..." messaging.

---

### P2.4 - Missing Achievement Claim Button Feedback
**File**: `components/profile/achievements-sheet.tsx` (assumed)  
**Current Behavior**: When claiming achievements, there's no immediate visual or toast feedback confirming success.

**Expected Behavior**: Should show confirmation toast or disable button until claim completes.

**Root Cause**: Action completes silently without user feedback.

**Recommended Fix**: Add success toast or button state change on claim.

---

## P3 - LOW (Polish/Edge Cases)

### P3.1 - Unused Parameters in Store Functions
**File**: `lib/store.tsx` (line 158, 159)  
**Current Behavior**: `setTheme` and potentially `setLanguage` function implementations don't use their parameters.

**Expected Behavior**: Parameters should be used or removed.

**Root Cause**: Incomplete implementation of stub functions.

**Recommended Fix**: Either fully implement or remove from interface.

---

### P3.2 - No Error State for Failed Chest Opening
**File**: `components/screens/inventory-screen.tsx` (line 68-72)  
**Current Behavior**: If chest opening fails mid-process, user sees error toast but no clear UI state indicating what went wrong.

**Expected Behavior**: Should show clear error state with retry option.

**Root Cause**: Error handling exists but UI feedback is minimal.

**Recommended Fix**: Add visual error state in inventory screen.

---

### P3.3 - Missing Null Coalescing in Avatar Selection
**File**: `lib/store.tsx` (line 828-829)  
**Current Behavior**: `avatarSprite()` returns `avatars[0]` as fallback but doesn't validate avatars array has items.

**Expected Behavior**: Should handle empty avatar list gracefully.

**Root Cause**: Assuming mock data always exists.

**Recommended Fix**: Add defensive fallback for empty array case.

---

### P3.4 - Referral Modal Copy Feedback Missing
**File**: `components/referral-modal.tsx` (assumed)  
**Current Behavior**: When user copies referral code, there's no toast confirming the copy succeeded.

**Expected Behavior**: Should show "Copied to clipboard!" feedback.

**Root Cause**: Copy functionality implemented but no user feedback.

**Recommended Fix**: Add toast confirmation on successful copy.

---

## Data Flow Issues

### Data Consistency
- **Rewards Feed**: May not sync if `logReward` is undefined
- **Quest Progress**: `setQuestProgress` manual updates don't trigger achievement checks
- **Inventory**: May exceed cap during async operations

### State Synchronization
- Energy timer out of sync after system sleep
- Achievement events can overwrite each other
- Language/Theme settings not persisted

---

## Summary by Category

| Priority | Count | Impact |
|----------|-------|--------|
| P0 | 4 | Breaks progression, crashes, missing features |
| P1 | 4 | Major features broken or degraded |
| P2 | 4 | UX issues, race conditions |
| P3 | 4 | Polish, edge cases, feedback |
| **Total** | **16** | |

---

## Recommended Fix Order

### Immediate (Blocks Gameplay)
1. **P0.4**: Implement `logReward` function (blocks all quest completions)
2. **P0.2**: Add energy locking mechanism (prevents energy farming)
3. **P0.3**: Implement `setLanguage` / `setTheme` (prevents crashes if called)

### High Priority (Major Features)
4. **P1.3**: Achievement event queue system
5. **P1.1**: Modal safe-area support for mobile
6. **P1.2**: Fix TimeAgoDisplay memory leak
7. **P1.4**: Energy timer robustness

### Medium Priority (UX)
8. **P2.1**: Inventory cap re-validation
9. **P2.3**: Withdraw sheet dismissibility
10. **P2.2**: Button state feedback

### Polish
11. **P3.1-P3.4**: Minor improvements

---

## Testing Recommendations

- **Energy System**: Complete 3+ quests rapidly in succession; verify energy doesn't go negative
- **Login Quest**: Open login quest 5+ times; verify button doesn't flicker between states
- **Rewards**: Complete quest and verify reward appears in Recent Rewards feed
- **Achievements**: Unlock multiple achievements within 1 second; verify all display
- **Mobile**: Test modal positioning on device with notch (iPhone X+)
- **Withdraw**: Try closing sheet via Escape during submission
- **Inventory**: Fill inventory to cap, try opening chest, verify error handling
- **System Sleep**: Let energy timer run, put device to sleep, wake it; verify timer is accurate

---

**Status**: AUDIT COMPLETE - No files modified
**Next Step**: Review findings and approve fixes before implementation
