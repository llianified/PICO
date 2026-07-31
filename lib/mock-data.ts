import type { SpriteName } from '@/components/pixel-sprite'

export type QuestTag = 'SIDE' | 'DAILY' | 'WEEKLY' | 'EVENT' | 'STORY'
export type QuestState = 'todo' | 'active' | 'done' | 'video'

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
  },
  {
    id: 'login',
    title: 'Login to PICO',
    subtitle: 'Maintain your journey',
    xpValue: 100,
    tag: 'DAILY',
    category: 'Daily',
    state: 'done',
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
    progress: { current: 2, total: 3 },
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
    id: 'boss',
    title: 'Defeat the Shadow Boss',
    subtitle: 'A legendary battle',
    xpValue: 2000,
    tag: 'STORY',
    category: 'Story',
    state: 'todo',
    detail: 'This story quest is still locked. Level up to unlock it.',
    available: false,
  },
]

export const initialTransactions: Transaction[] = [
  { id: 't1', title: 'Daily Quest', amount: 2000, type: 'earn', time: '10m ago', status: 'completed' },
  { id: 't2', title: 'Survey Reward', amount: 5000, type: 'earn', time: '1h ago', status: 'completed' },
  { id: 't3', title: 'Withdrawal', amount: 50000, type: 'withdraw', time: 'Yesterday', status: 'completed' },
]

export const initialPaymentMethods: PaymentMethod[] = [
  { id: 'dana', name: 'DANA', connected: true },
  { id: 'gopay', name: 'GoPay', connected: false },
  { id: 'ovo', name: 'OVO', connected: false },
  { id: 'bank', name: 'Bank Transfer', connected: false },
]

export const initialInventoryItems: InventoryItem[] = [
  {
    id: 'hat',
    name: "Explorer's Hat",
    sprite: 'shield',
    rarity: 'Common',
    slot: 'Head',
    description: 'A trusty hat worn by every explorer on their first journey.',
    unlockedAt: '2h ago',
  },
]

export const initialAchievements: Achievement[] = [
  { id: 'first', title: 'First Steps', subtitle: 'Complete your first quest', current: 1, total: 1, unlocked: true, claimed: true },
  { id: 'dedicated', title: 'Dedicated', subtitle: 'Complete 10 daily quests', current: 10, total: 10, unlocked: true, claimed: false },
  { id: 'adventurer', title: 'Adventurer', subtitle: 'Complete 50 quests', current: 28, total: 50, unlocked: false },
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

/** 12 consecutive login days ending today → an initial streak of 12. */
export const initialLoginDates = makeConsecutiveDays(12)

/**
 * Seed activity feed. These mirror the initial state (login quest done, First
 * Steps badge claimed, survey reward matching the first transactions) so the
 * feed is internally consistent from the very first render.
 */
export const initialRewardsFeed: RewardFeedItem[] = [
  {
    id: 'rw-seed-1',
    sprite: 'trophy',
    title: 'Quest Completed',
    subtitle: 'Login to PICO',
    value: '+100 XP',
    createdAt: Date.now() - 2 * 60 * 1000,
  },
  {
    id: 'rw-seed-2',
    sprite: 'shield',
    title: 'Badge Claimed',
    subtitle: 'First Steps',
    value: '+1 Badge',
    createdAt: Date.now() - 60 * 60 * 1000,
  },
  {
    id: 'rw-seed-3',
    sprite: 'coin',
    title: 'Survey Reward',
    subtitle: 'Daily Survey',
    value: '+Rp5.000',
    createdAt: Date.now() - 3 * 60 * 60 * 1000,
  },
]
