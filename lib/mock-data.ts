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
}

export type Avatar = {
  id: string
  name: string
  sprite: SpriteName
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
  { id: 'first', title: 'First Steps', subtitle: 'Complete your first quest', current: 1, total: 1, unlocked: true },
  { id: 'dedicated', title: 'Dedicated', subtitle: 'Complete 10 daily quests', current: 10, total: 10, unlocked: true },
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
