'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { SpriteName } from '@/components/pixel-sprite'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type QuestTag = 'SIDE' | 'DAILY' | 'WEEKLY' | 'EVENT' | 'STORY'
export type QuestState = 'todo' | 'active' | 'done' | 'video'
export type QuestCategory = 'Story' | 'Daily' | 'Weekly' | 'Event' | 'Side'

export type Quest = {
  id: string
  title: string
  subtitle: string
  xp: string
  xpValue: number
  tag: QuestTag
  category: QuestCategory
  state: QuestState
  progress?: { current: number; total: number }
  detail: string
}

export type Transaction = {
  id: string
  title: string
  amount: number // signed, in Rupiah
  time: string
  sprite: SpriteName
}

export type PaymentMethod = {
  id: string
  name: string
  connected: boolean
}

export type RewardActivity = {
  id: string
  sprite: SpriteName
  title: string
  subtitle: string
  xp: string
  time: string
}

export type InventoryKey =
  | 'chest'
  | 'key'
  | 'coin'
  | 'gem'
  | 'shield'
  | 'book'

export type InventoryItem = {
  key: InventoryKey
  label: string
  sprite: SpriteName
  count: number
}

export type Unlock = {
  id: string
  title: string
  meta: string
  sprite: SpriteName
  time: string
}

export type Achievement = {
  id: string
  title: string
  subtitle: string
  current: number
  total: number
  sprite: SpriteName
}

export type AppNotification = {
  id: string
  title: string
  body: string
  time: string
  read: boolean
  sprite: SpriteName
}

export type Avatar = { id: string; label: string; sprite: SpriteName }

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

export function formatXp(n: number) {
  return n.toLocaleString('en-US')
}

export function formatRp(n: number) {
  const sign = n < 0 ? '- ' : ''
  const abs = Math.abs(n)
  return `${sign}Rp${abs.toLocaleString('id-ID')}`
}

/* ------------------------------------------------------------------ */
/* Initial mock data                                                   */
/* ------------------------------------------------------------------ */

const initialQuests: Quest[] = [
  {
    id: 'survey',
    title: 'Complete Daily Survey',
    subtitle: 'Help the villagers',
    xp: '+500 XP',
    xpValue: 500,
    tag: 'SIDE',
    category: 'Side',
    state: 'todo',
    detail: 'Help the villagers by sharing your opinion.',
  },
  {
    id: 'login',
    title: 'Login to PICO',
    subtitle: 'Maintain your journey',
    xp: '+100 XP',
    xpValue: 100,
    tag: 'DAILY',
    category: 'Daily',
    state: 'done',
    detail: 'Return each day to keep your streak alive.',
  },
  {
    id: 'sponsor',
    title: 'Watch Sponsor Video',
    subtitle: 'Support the kingdom',
    xp: '+50 XP',
    xpValue: 50,
    tag: 'SIDE',
    category: 'Side',
    state: 'video',
    detail: 'Watch a short message from a partner to earn XP.',
  },
  {
    id: 'three',
    title: 'Complete 3 Quests',
    subtitle: 'Prove your dedication',
    xp: '+300 XP',
    xpValue: 300,
    tag: 'DAILY',
    category: 'Daily',
    state: 'todo',
    progress: { current: 2, total: 3 },
    detail: 'Finish three quests today to earn a bonus reward.',
  },
  {
    id: 'invite',
    title: 'Invite a Friend',
    subtitle: 'Bring new explorer',
    xp: '+50 XP',
    xpValue: 50,
    tag: 'SIDE',
    category: 'Side',
    state: 'todo',
    progress: { current: 0, total: 1 },
    detail: 'Invite a friend to join PICO and both of you earn XP.',
  },
  {
    id: 'story-1',
    title: 'The First Gate',
    subtitle: 'Begin the main story',
    xp: '+1,000 XP',
    xpValue: 1000,
    tag: 'STORY',
    category: 'Story',
    state: 'todo',
    detail: 'Step through the first gate and begin your legend.',
  },
  {
    id: 'weekly-boss',
    title: 'Defeat the Weekly Boss',
    subtitle: 'A worthy challenge',
    xp: '+2,000 XP',
    xpValue: 2000,
    tag: 'WEEKLY',
    category: 'Weekly',
    state: 'todo',
    progress: { current: 1, total: 5 },
    detail: 'Battle through five rounds to defeat this week\u2019s boss.',
  },
  {
    id: 'event-festival',
    title: 'Pixel Festival',
    subtitle: 'Limited time event',
    xp: '+750 XP',
    xpValue: 750,
    tag: 'EVENT',
    category: 'Event',
    state: 'todo',
    detail: 'Join the seasonal festival before it ends.',
  },
]

const initialTransactions: Transaction[] = [
  { id: 't1', title: 'Daily Quest', amount: 2000, time: '10m ago', sprite: 'coin' },
  { id: 't2', title: 'Survey Reward', amount: 5000, time: '1h ago', sprite: 'coin' },
  { id: 't3', title: 'Withdrawal', amount: -50000, time: 'Yesterday', sprite: 'coin' },
]

const initialMethods: PaymentMethod[] = [
  { id: 'dana', name: 'DANA', connected: true },
  { id: 'gopay', name: 'GoPay', connected: false },
  { id: 'ovo', name: 'OVO', connected: false },
  { id: 'bank', name: 'Bank Transfer', connected: false },
]

const initialRewards: RewardActivity[] = [
  { id: 'r1', sprite: 'trophy', title: 'Quest Completed', subtitle: 'Daily Check-in', xp: '+100 XP', time: '2m ago' },
  { id: 'r2', sprite: 'shield', title: 'New Badge', subtitle: 'First Steps', xp: '+100 XP', time: '2m ago' },
  { id: 'r3', sprite: 'star', title: 'XP Earned', subtitle: 'Daily Quest', xp: '+250 XP', time: '10m ago' },
]

const initialInventory: InventoryItem[] = [
  { key: 'chest', label: 'Treasure Chest', sprite: 'chest', count: 3 },
  { key: 'key', label: 'Keys', sprite: 'key', count: 7 },
  { key: 'coin', label: 'Coins', sprite: 'coin', count: 12400 },
  { key: 'gem', label: 'Artifacts', sprite: 'gem', count: 11 },
  { key: 'shield', label: 'Badges', sprite: 'shield', count: 24 },
  { key: 'book', label: 'Collections', sprite: 'book', count: 15 },
]

const initialUnlocks: Unlock[] = [
  { id: 'u1', title: "Explorer's Hat", meta: 'Common \u00b7 Head', sprite: 'shield', time: '2h ago' },
]

const initialAchievements: Achievement[] = [
  { id: 'a1', title: 'First Steps', subtitle: 'Complete your first quest', current: 1, total: 1, sprite: 'trophy' },
  { id: 'a2', title: 'Dedicated', subtitle: 'Complete 10 daily quests', current: 10, total: 10, sprite: 'trophy' },
  { id: 'a3', title: 'Adventurer', subtitle: 'Complete 50 quests', current: 28, total: 50, sprite: 'trophy' },
  { id: 'a4', title: 'Collector', subtitle: 'Unlock 20 badges', current: 24, total: 20, sprite: 'shield' },
]

const initialNotifications: AppNotification[] = [
  { id: 'n1', title: 'Daily reward ready', body: 'Your daily check-in bonus is waiting.', time: '5m ago', read: false, sprite: 'star' },
  { id: 'n2', title: 'Streak milestone', body: 'You reached a 12-day streak!', time: '1h ago', read: false, sprite: 'flag' as SpriteName },
  { id: 'n3', title: 'New event live', body: 'Pixel Festival has begun.', time: '3h ago', read: true, sprite: 'gem' },
]

export const AVATARS: Avatar[] = [
  { id: 'explorer', label: 'Explorer', sprite: 'star' },
  { id: 'knight', label: 'Knight', sprite: 'shield' },
  { id: 'mage', label: 'Mage', sprite: 'gem' },
  { id: 'hunter', label: 'Hunter', sprite: 'sword' },
  { id: 'healer', label: 'Healer', sprite: 'heart' },
  { id: 'sage', label: 'Sage', sprite: 'book' },
]

const COLLECTION_TOTAL = 48

/* ------------------------------------------------------------------ */
/* Store shape                                                         */
/* ------------------------------------------------------------------ */

type RewardPayload = { xp: number; items: { sprite: SpriteName; label: string }[] }

type Store = {
  // identity / progression
  name: string
  level: number
  totalXp: number
  levelXp: number
  levelTarget: number
  streak: number
  energy: number
  energyMax: number
  avatarId: string
  questsCompleted: number
  daysActive: number

  // collections
  quests: Quest[]
  transactions: Transaction[]
  methods: PaymentMethod[]
  rewards: RewardActivity[]
  inventory: InventoryItem[]
  unlocks: Unlock[]
  achievements: Achievement[]
  notifications: AppNotification[]

  // settings
  theme: 'dark' | 'light'
  language: string
  soundOn: boolean
  notificationsOn: boolean

  // derived
  balance: number
  totalEarned: number
  collectionTotal: number
  collectionOwned: number
  unreadCount: number

  // overlay signals (transient)
  levelUpTo: number | null
  clearLevelUp: () => void
  achievementUnlocked: Achievement | null
  clearAchievement: () => void

  // actions
  addXp: (amount: number) => void
  startQuest: (id: string) => Promise<void>
  completeQuest: (id: string) => Promise<RewardPayload>
  withdraw: (amount: number, methodId: string) => Promise<void>
  connectMethod: (id: string) => Promise<void>
  openChest: () => Promise<RewardPayload & { badgeUnlocked: Achievement | null }>
  selectAvatar: (id: string) => void
  setName: (name: string) => void
  markAllRead: () => void
  clearNotifications: () => void
  setTheme: (t: 'dark' | 'light') => void
  setLanguage: (l: string) => void
  setSoundOn: (v: boolean) => void
  setNotificationsOn: (v: boolean) => void
  resetTransactions: () => void
}

const StoreContext = createContext<Store | null>(null)

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

let idCounter = 1000
const nextId = () => `id-${++idCounter}`

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function GameProvider({ children }: { children: ReactNode }) {
  const [name, setNameState] = useState('Explorer')
  const [level, setLevel] = useState(12)
  const [totalXp, setTotalXp] = useState(142550)
  const [levelXp, setLevelXp] = useState(70000)
  const [levelTarget, setLevelTarget] = useState(200000)
  const [streak] = useState(12)
  const [energy, setEnergy] = useState(24)
  const energyMax = 30
  const [avatarId, setAvatarId] = useState('explorer')
  const [questsCompleted, setQuestsCompleted] = useState(128)
  const daysActive = 18

  const [quests, setQuests] = useState<Quest[]>(initialQuests)
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [methods, setMethods] = useState<PaymentMethod[]>(initialMethods)
  const [rewards, setRewards] = useState<RewardActivity[]>(initialRewards)
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory)
  const [unlocks, setUnlocks] = useState<Unlock[]>(initialUnlocks)
  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements)
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications)

  const [theme, setThemeState] = useState<'dark' | 'light'>('dark')
  const [language, setLanguageState] = useState('English')
  const [soundOn, setSoundOn] = useState(true)
  const [notificationsOn, setNotificationsOn] = useState(true)

  const [levelUpTo, setLevelUpTo] = useState<number | null>(null)
  const [achievementUnlocked, setAchievementUnlocked] = useState<Achievement | null>(null)

  const levelRef = useRef(level)
  levelRef.current = level

  const balance = 84500 + transactions
    .filter((t) => t.id.startsWith('id-'))
    .reduce((sum, t) => sum + t.amount, 0)
  const totalEarned = 1245000

  const collectionOwned =
    inventory.find((i) => i.key === 'book')?.count ?? 0
  const unreadCount = notifications.filter((n) => !n.read).length

  /* ---- XP + level handling ---- */
  const addXp = useCallback((amount: number) => {
    setTotalXp((t) => t + amount)
    setLevelXp((cur) => {
      let xp = cur + amount
      let target = levelTarget
      let lvl = levelRef.current
      let didLevel = false
      while (xp >= target) {
        xp -= target
        lvl += 1
        target = Math.round(target * 1.15)
        didLevel = true
      }
      if (didLevel) {
        setLevel(lvl)
        setLevelTarget(target)
        setLevelUpTo(lvl)
      }
      return xp
    })
  }, [levelTarget])

  const clearLevelUp = useCallback(() => setLevelUpTo(null), [])
  const clearAchievement = useCallback(() => setAchievementUnlocked(null), [])

  /* ---- Quests ---- */
  const startQuest = useCallback(async (id: string) => {
    await wait(900)
    setQuests((qs) =>
      qs.map((q) => (q.id === id ? { ...q, state: 'active' as QuestState } : q)),
    )
  }, [])

  const completeQuest = useCallback(async (id: string): Promise<RewardPayload> => {
    await wait(900)
    const quest = quests.find((q) => q.id === id)
    const xp = quest?.xpValue ?? 0
    setQuests((qs) =>
      qs.map((q) =>
        q.id === id
          ? {
              ...q,
              state: 'done' as QuestState,
              progress: q.progress ? { ...q.progress, current: q.progress.total } : undefined,
            }
          : q,
      ),
    )
    addXp(xp)
    setRewards((r) => [
      { id: nextId(), sprite: 'trophy', title: 'Quest Completed', subtitle: quest?.title ?? 'Quest', xp: `+${formatXp(xp)} XP`, time: 'now' },
      ...r,
    ])
    // bump adventurer achievement
    setAchievements((as) =>
      as.map((a) =>
        a.id === 'a3' && a.current < a.total
          ? { ...a, current: Math.min(a.total, a.current + 1) }
          : a,
      ),
    )
    setEnergy((e) => Math.max(0, e - 1))
    setQuestsCompleted((c) => c + 1)
    return { xp, items: [{ sprite: 'star', label: `${formatXp(xp)} XP` }] }
  }, [quests, addXp])

  /* ---- Wallet ---- */
  const withdraw = useCallback(async (amount: number, methodId: string) => {
    await wait(1600)
    const method = methods.find((m) => m.id === methodId)
    setTransactions((tx) => [
      { id: nextId(), title: `Withdrawal \u00b7 ${method?.name ?? ''}`, amount: -amount, time: 'now', sprite: 'coin' },
      ...tx,
    ])
  }, [methods])

  const connectMethod = useCallback(async (id: string) => {
    await wait(1200)
    setMethods((ms) => ms.map((m) => (m.id === id ? { ...m, connected: true } : m)))
  }, [])

  /* ---- Inventory ---- */
  const openChest = useCallback(async () => {
    await wait(1400)
    const chestCount = inventory.find((i) => i.key === 'chest')?.count ?? 0
    const keyCount = inventory.find((i) => i.key === 'key')?.count ?? 0
    const coinsReward = 500
    const gemReward = 1
    const xpReward = 250

    setInventory((inv) =>
      inv.map((i) => {
        if (i.key === 'chest') return { ...i, count: Math.max(0, i.count - 1) }
        if (i.key === 'key') return { ...i, count: Math.max(0, i.count - 1) }
        if (i.key === 'coin') return { ...i, count: i.count + coinsReward }
        if (i.key === 'gem') return { ...i, count: i.count + gemReward }
        if (i.key === 'book') return { ...i, count: Math.min(COLLECTION_TOTAL, i.count + 1) }
        return i
      }),
    )
    addXp(xpReward)

    const newUnlock: Unlock = {
      id: nextId(),
      title: 'Ancient Relic',
      meta: 'Rare \u00b7 Artifact',
      sprite: 'gem',
      time: 'now',
    }
    setUnlocks((u) => [newUnlock, ...u])

    // occasionally unlock a badge achievement
    let badgeUnlocked: Achievement | null = null
    if (chestCount % 2 === 1) {
      badgeUnlocked = {
        id: nextId(),
        title: 'Treasure Hunter',
        subtitle: 'Open a treasure chest',
        current: 1,
        total: 1,
        sprite: 'shield',
      }
      setAchievements((as) =>
        as.some((a) => a.title === 'Treasure Hunter') ? as : [...as, badgeUnlocked!],
      )
      setInventory((inv) =>
        inv.map((i) => (i.key === 'shield' ? { ...i, count: i.count + 1 } : i)),
      )
      setAchievementUnlocked(badgeUnlocked)
    }

    void keyCount
    return {
      xp: xpReward,
      items: [
        { sprite: 'coin' as SpriteName, label: `+${coinsReward} Coins` },
        { sprite: 'gem' as SpriteName, label: `+${gemReward} Artifact` },
        { sprite: 'star' as SpriteName, label: `+${xpReward} XP` },
      ],
      badgeUnlocked,
    }
  }, [inventory, addXp])

  /* ---- Profile / settings ---- */
  const selectAvatar = useCallback((id: string) => setAvatarId(id), [])
  const setName = useCallback((n: string) => setNameState(n), [])
  const markAllRead = useCallback(
    () => setNotifications((ns) => ns.map((n) => ({ ...n, read: true }))),
    [],
  )
  const clearNotifications = useCallback(() => setNotifications([]), [])
  const setTheme = useCallback((t: 'dark' | 'light') => setThemeState(t), [])
  const setLanguage = useCallback((l: string) => setLanguageState(l), [])
  const resetTransactions = useCallback(() => setTransactions([]), [])

  const value = useMemo<Store>(
    () => ({
      name,
      level,
      totalXp,
      levelXp,
      levelTarget,
      streak,
      energy,
      energyMax,
      avatarId,
      questsCompleted,
      daysActive,
      quests,
      transactions,
      methods,
      rewards,
      inventory,
      unlocks,
      achievements,
      notifications,
      theme,
      language,
      soundOn,
      notificationsOn,
      balance,
      totalEarned,
      collectionTotal: COLLECTION_TOTAL,
      collectionOwned,
      unreadCount,
      levelUpTo,
      clearLevelUp,
      achievementUnlocked,
      clearAchievement,
      addXp,
      startQuest,
      completeQuest,
      withdraw,
      connectMethod,
      openChest,
      selectAvatar,
      setName,
      markAllRead,
      clearNotifications,
      setTheme,
      setLanguage,
      setSoundOn,
      setNotificationsOn,
      resetTransactions,
    }),
    [
      name, level, totalXp, levelXp, levelTarget, streak, energy, avatarId,
      questsCompleted, daysActive,
      quests, transactions, methods, rewards, inventory, unlocks, achievements,
      notifications, theme, language, soundOn, notificationsOn, balance,
      collectionOwned, unreadCount, levelUpTo, achievementUnlocked,
      clearLevelUp, clearAchievement, addXp, startQuest, completeQuest,
      withdraw, connectMethod, openChest, selectAvatar, setName, markAllRead,
      clearNotifications, setTheme, setLanguage, resetTransactions,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useGame() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
