import type { SpriteName } from '@/components/pixel-sprite'

export type QuestTag = 'SIDE' | 'DAILY' | 'WEEKLY' | 'EVENT' | 'STORY'
export type QuestState = 'todo' | 'active' | 'done' | 'video'

/** A single multiple-choice question shown once a survey/task quest is started. */
export type SurveyQuestion = {
  id: string
  prompt: string
  options: string[]
}

/** Fallback task shown for any started quest that doesn't define its own survey. */
export const DEFAULT_SURVEY: SurveyQuestion[] = [
  {
    id: 'q1',
    prompt: 'How are you feeling about this quest?',
    options: ['Excited', 'Curious', 'Neutral', 'Not sure yet'],
  },
  {
    id: 'q2',
    prompt: 'How much time can you spend on it today?',
    options: ['A few minutes', 'Around 30 minutes', 'An hour or more', 'As long as it takes'],
  },
]

export type Quest = {
  id: string
  title: string
  subtitle: string
  xpValue: number
  tag: QuestTag
  category: 'Story' | 'Daily' | 'Weekly' | 'Event' | 'Side'
  state: QuestState
  progress?: { current: number; total: number }
  detail: string
  /** when false, opening/starting the quest surfaces an "unavailable" error */
  available?: boolean
  /** minimum player level required before this quest auto-unlocks (Story quests) */
  levelRequired?: number
  /** the task shown after starting the quest — answer all to complete it */
  survey?: SurveyQuestion[]
}

export type TransactionType = 'earn' | 'withdraw'

export type Transaction = {
  id: string
  title: string
  amount: number // positive number in Rupiah
  type: TransactionType
  time: string
  status: 'completed' | 'pending'
}

export type PaymentMethod = {
  id: string
  name: string
  connected: boolean
}

export type InventoryItem = {
  id: string
  name: string
  sprite: SpriteName
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  slot: string
  description: string
  unlockedAt: string
}

export type Achievement = {
  id: string
  title: string
  subtitle: string
  current: number
  total: number
  unlocked: boolean
  claimed?: boolean
}

export type Avatar = {
  id: string
  name: string
  sprite: SpriteName
}

/**
 * A single entry in the "Recent Rewards" activity feed. Every gameplay event
 * that grants something (quest, chest, withdrawal, achievement) appends one of
 * these so the feed is always generated from real state, newest first.
 */
export type RewardFeedItem = {
  id: string
  sprite: SpriteName
  title: string
  subtitle: string
  value: string
  createdAt: number
}

export const initialQuests: Quest[] = [
  {
    id: 'survey',
    title: 'Complete Daily Survey',
    subtitle: 'Help the villagers',
    xpValue: 500,
    tag: 'SIDE',
    category: 'Daily',
    state: 'todo',
    detail: 'Help the villagers by sharing your opinion.',
    available: true,
    survey: [
      {
        id: 'q1',
        prompt: 'How often do you play PICO?',
        options: ['Every day', 'A few times a week', 'Once a week', 'Rarely'],
      },
      {
        id: 'q2',
        prompt: 'Which reward excites you the most?',
        options: ['XP & levels', 'Coins to withdraw', 'Chests & artifacts', 'Streak bonuses'],
      },
      {
        id: 'q3',
        prompt: 'How would you rate your adventure so far?',
        options: ['Loving it', 'Pretty good', 'It is okay', 'Could be better'],
      },
    ],
  },
  {
    id: 'login',
    title: 'Login to PICO',
    subtitle: 'Maintain your journey',
    xpValue: 100,
    tag: 'DAILY',
    category: 'Daily',
    state: 'todo',
    detail: 'Return each day to keep your streak alive.',
    available: true,
  },
  {
    id: 'sponsor',
    title: 'Watch Sponsor Video',
    subtitle: 'Support the kingdom',
    xpValue: 50,
    tag: 'SIDE',
    category: 'Daily',
    state: 'video',
    detail: 'Watch a short message from a partner to earn XP.',
    available: true,
  },
  {
    id: 'three',
    title: 'Complete 3 Quests',
    subtitle: 'Prove your dedication',
    xpValue: 300,
    tag: 'DAILY',
    category: 'Daily',
    state: 'todo',
    progress: { current: 0, total: 3 },
    detail: 'Finish three quests today to earn a bonus reward.',
    available: true,
  },
  {
    id: 'invite',
    title: 'Invite a Friend',
    subtitle: 'Bring new explorer',
    xpValue: 50,
    tag: 'SIDE',
    category: 'Side',
    state: 'todo',
    progress: { current: 0, total: 1 },
    detail: 'Invite a friend to join PICO and both of you earn XP.',
    available: true,
  },
  {
    id: 'awaken',
    title: 'Awaken Your Powers',
    subtitle: 'Begin your legend',
    xpValue: 400,
    tag: 'STORY',
    category: 'Story',
    state: 'todo',
    detail: 'Your journey begins here. Complete this to prove your worth.',
    available: true,
    levelRequired: 1,
  },
  {
    id: 'trials',
    title: 'Trials of the Ancients',
    subtitle: 'A test of skill',
    xpValue: 900,
    tag: 'STORY',
    category: 'Story',
    state: 'todo',
    detail: 'Face the trials left behind by the ancients. Unlocks at level 3.',
    available: false,
    levelRequired: 3,
  },
  {
    id: 'boss',
    title: 'Defeat the Shadow Boss',
    subtitle: 'A legendary battle',
    xpValue: 2000,
    tag: 'STORY',
    category: 'Story',
    state: 'todo',
    detail: 'The final confrontation. Reach level 5 to challenge the Shadow Boss.',
    available: false,
    levelRequired: 5,
  },
]

export const initialTransactions: Transaction[] = []

export const initialPaymentMethods: PaymentMethod[] = [
  { id: 'dana', name: 'DANA', connected: false },
  { id: 'gopay', name: 'GoPay', connected: false },
  { id: 'ovo', name: 'OVO', connected: false },
  { id: 'bank', name: 'Bank Transfer', connected: false },
]

export const initialInventoryItems: InventoryItem[] = []

export const initialAchievements: Achievement[] = [
  { id: 'first', title: 'First Steps', subtitle: 'Complete your first quest', current: 0, total: 1, unlocked: false, claimed: false },
  { id: 'dedicated', title: 'Dedicated', subtitle: 'Complete 10 daily quests', current: 0, total: 10, unlocked: false, claimed: false },
  { id: 'adventurer', title: 'Adventurer', subtitle: 'Complete 50 quests', current: 0, total: 50, unlocked: false },
  { id: 'rich', title: 'Treasure Hunter', subtitle: 'Withdraw your first reward', current: 0, total: 1, unlocked: false },
]

export const avatars: Avatar[] = [
  { id: 'explorer', name: 'Explorer', sprite: 'flag' },
  { id: 'knight', name: 'Knight', sprite: 'shield' },
  { id: 'mage', name: 'Mage', sprite: 'star' },
  { id: 'hunter', name: 'Hunter', sprite: 'sword' },
  { id: 'ranger', name: 'Ranger', sprite: 'heart' },
  { id: 'alchemist', name: 'Alchemist', sprite: 'potion' },
]

export const languages = ['English', 'Bahasa Indonesia', 'Español', '日本語'] as const
export const themes = ['Dark', 'Light', 'System'] as const

export function formatRp(amount: number): string {
  return 'Rp' + Math.round(amount).toLocaleString('id-ID')
}

export function formatCompact(n: number): string {
  if (n >= 1000) {
    const v = n / 1000
    return (Number.isInteger(v) ? v.toString() : v.toFixed(1)) + 'K'
  }
  return n.toString()
}

/** Relative "time ago" label for reward-feed timestamps. */
export function formatRelativeTime(ts: number): string {
  const diff = Math.max(0, Date.now() - ts)
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'Just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? 'Yesterday' : `${d}d ago`
}

// ---------------------------------------------------------------------------
// Reward formulas — shared by the store (when granting) and the quest detail
// screen (when previewing) so the numbers always agree.
// ---------------------------------------------------------------------------
export function questKeyReward(xp: number): number {
  return xp >= 500 ? 2 : 1
}

export function questCoinReward(xp: number): number {
  return Math.max(50, Math.round(xp * 0.6))
}

/**
 * Rupiah paid into the wallet for completing a quest. Shared by the store (when
 * granting) and the quest UI (when previewing) so the previewed reward always
 * matches what actually lands in the wallet.
 */
export function questMoneyReward(xp: number): number {
  return Math.round(xp * 4)
}

// ---------------------------------------------------------------------------
// Leveling curve — quadratic growth. The first level-up (1 → 2) costs the base
// 50 XP, and each subsequent level scales with level², so higher levels get
// meaningfully harder instead of leveling up every few quests.
//   Lvl 1→2: 50   Lvl 2→3: 200   Lvl 3→4: 450   Lvl 4→5: 800   Lvl 5→6: 1250
// ---------------------------------------------------------------------------
export const LEVEL_XP_BASE = 50

/** XP required to advance FROM the given level to the next one. */
export function xpNeededForLevel(level: number): number {
  return LEVEL_XP_BASE * level * level
}

/**
 * Reconciles Story quest availability against the player's level. A Story quest
 * unlocks automatically once the player reaches its `levelRequired`. Already
 * completed quests are never re-locked. Returns the same array reference when
 * nothing changed so callers can skip needless re-renders.
 */
export function reconcileQuestAvailability(quests: Quest[], level: number): Quest[] {
  let changed = false
  const next = quests.map((q) => {
    if (q.levelRequired === undefined) return q
    const shouldBeAvailable = level >= q.levelRequired
    if (shouldBeAvailable && !q.available) {
      changed = true
      return { ...q, available: true }
    }
    return q
  })
  return changed ? next : quests
}

/**
 * Resets the Daily quest set at the start of a new day: daily quests return to
 * their initial (fresh) definitions while every other category — including
 * completed Story quests — is preserved exactly as-is.
 */
export function resetDailyQuests(quests: Quest[]): Quest[] {
  return quests.map((q) => {
    if (q.category !== 'Daily') return q
    const fresh = initialQuests.find((iq) => iq.id === q.id)
    return fresh ? { ...fresh } : q
  })
}

// ---------------------------------------------------------------------------
// Daily login / streak — the streak is derived from a mocked login history
// rather than a hardcoded number.
// ---------------------------------------------------------------------------
export function toDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Builds `count` consecutive day keys ending today (most recent first). */
export function makeConsecutiveDays(count: number): string[] {
  const days: string[] = []
  const base = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    days.push(toDayKey(d))
  }
  return days
}

/**
 * Derives the current streak from a set of login days. The streak is only
 * "active" if the player logged in today or yesterday; a missed day breaks the
 * run and resets the count.
 */
export function computeStreak(loginDates: string[]): number {
  if (loginDates.length === 0) return 0
  const set = new Set(loginDates)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  let cursor: Date
  if (set.has(toDayKey(today))) cursor = today
  else if (set.has(toDayKey(yesterday))) cursor = yesterday
  else return 0

  let streak = 0
  while (set.has(toDayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** No prior login history → streak starts at 0 (today's login is recorded on mount). */
export const initialLoginDates = makeConsecutiveDays(0)

/**
 * Seed activity feed. These mirror the initial state (login quest done, First
 * Steps badge claimed, survey reward matching the first transactions) so the
 * feed is internally consistent from the very first render.
 */
export const initialRewardsFeed: RewardFeedItem[] = []
