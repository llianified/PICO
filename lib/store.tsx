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
import {
  avatars,
  initialAchievements,
  initialInventoryItems,
  initialPaymentMethods,
  initialQuests,
  initialTransactions,
  type Achievement,
  type Avatar,
  type InventoryItem,
  type PaymentMethod,
  type Quest,
  type Transaction,
} from '@/lib/mock-data'

/** Simulated network latency for a "production" feel. */
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

export type Toast = {
  id: number
  title: string
  description?: string
  variant: 'success' | 'error' | 'info'
}

export type LevelUpEvent = { level: number } | null
export type RewardEvent = {
  title: string
  items: { label: string; sprite: string }[]
} | null
export type AchievementEvent = { title: string; subtitle: string } | null

export type TabId = 'home' | 'adventure' | 'inventory' | 'wallet' | 'profile'

type StoreValue = {
  // navigation
  tab: TabId
  navigate: (tab: TabId) => void

  // profile / progression
  name: string
  avatarId: string
  level: number
  totalXp: number
  levelXp: number
  levelXpNeeded: number
  streak: number
  energy: number
  energyMax: number

  // wallet
  balance: number
  totalEarned: number
  transactions: Transaction[]
  paymentMethods: PaymentMethod[]

  // quests
  quests: Quest[]

  // inventory
  chests: number
  keys: number
  coins: number
  artifacts: number
  badges: number
  collectionOwned: number
  collectionTotal: number
  inventoryItems: InventoryItem[]

  // achievements
  achievements: Achievement[]

  // settings
  language: string
  theme: string
  notificationsEnabled: boolean
  soundEnabled: boolean

  // transient UI events
  toasts: Toast[]
  levelUp: LevelUpEvent
  rewardEvent: RewardEvent

  // actions
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
  clearLevelUp: () => void
  clearReward: () => void

  addXp: (amount: number) => void
  withdraw: (amount: number, methodId: string) => Promise<void>
  connectPaymentMethod: (id: string) => Promise<void>
  startQuest: (id: string) => Promise<void>
  completeQuest: (id: string) => Promise<number>
  openChest: () => Promise<RewardEvent>
  updateProfile: (data: { name?: string; avatarId?: string }) => void
  setLanguage: (l: string) => void
  setTheme: (t: string) => void
  toggleNotifications: () => void
  toggleSound: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<TabId>('home')
  const navigate = useCallback((t: TabId) => setTab(t), [])

  const [name, setName] = useState('Explorer')
  const [avatarId, setAvatarId] = useState<string>('explorer')
  const [level, setLevel] = useState(12)
  const [totalXp, setTotalXp] = useState(142550)
  const [levelXp, setLevelXp] = useState(70000)
  const [levelXpNeeded, setLevelXpNeeded] = useState(200000)
  const [streak] = useState(12)
  const [energy] = useState(24)
  const energyMax = 30

  const [balance, setBalance] = useState(84500)
  const [totalEarned, setTotalEarned] = useState(1245000)
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods)

  const [quests, setQuests] = useState<Quest[]>(initialQuests)

  const [chests, setChests] = useState(3)
  const [keys, setKeys] = useState(7)
  const [coins, setCoins] = useState(12400)
  const [artifacts, setArtifacts] = useState(11)
  const [badges, setBadges] = useState(24)
  const [collectionOwned, setCollectionOwned] = useState(15)
  const collectionTotal = 48
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(initialInventoryItems)

  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements)

  const [language, setLanguage] = useState('English')
  const [theme, setTheme] = useState('Dark')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const [toasts, setToasts] = useState<Toast[]>([])
  const [levelUp, setLevelUp] = useState<LevelUpEvent>(null)
  const [rewardEvent, setRewardEvent] = useState<RewardEvent>(null)

  const toastId = useRef(0)

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, 3200)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const clearLevelUp = useCallback(() => setLevelUp(null), [])
  const clearReward = useCallback(() => setRewardEvent(null), [])

  const addXp = useCallback((amount: number) => {
    setTotalXp((prev) => prev + amount)
    setLevelXp((prevXp) => {
      let xp = prevXp + amount
      let leveledUp = false
      let newLevel = 0
      setLevelXpNeeded((prevNeeded) => {
        let needed = prevNeeded
        setLevel((prevLevel) => {
          let lvl = prevLevel
          while (xp >= needed) {
            xp -= needed
            lvl += 1
            needed = Math.round(needed * 1.15)
            leveledUp = true
            newLevel = lvl
          }
          if (leveledUp) {
            setTimeout(() => setLevelUp({ level: newLevel }), 400)
          }
          return lvl
        })
        return needed
      })
      return xp
    })
  }, [])

  const unlockAchievementProgress = useCallback((id: string, amount = 1) => {
    setAchievements((prev) =>
      prev.map((a) => {
        if (a.id !== id || a.unlocked) return a
        const current = Math.min(a.total, a.current + amount)
        const unlocked = current >= a.total
        if (unlocked) {
          setTimeout(() => setBadges((b) => b + 1), 0)
        }
        return { ...a, current, unlocked }
      }),
    )
  }, [])

  const withdraw = useCallback(
    async (amount: number, methodId: string) => {
      await delay(1600)
      const method = initialPaymentMethods.find((m) => m.id === methodId)
      setBalance((prev) => prev - amount)
      const tx: Transaction = {
        id: 'tx' + Date.now(),
        title: `Withdrawal · ${method?.name ?? 'Wallet'}`,
        amount,
        type: 'withdraw',
        time: 'Just now',
        status: 'completed',
      }
      setTransactions((prev) => [tx, ...prev])
      unlockAchievementProgress('rich', 1)
    },
    [unlockAchievementProgress],
  )

  const connectPaymentMethod = useCallback(async (id: string) => {
    await delay(1200)
    setPaymentMethods((prev) => prev.map((m) => (m.id === id ? { ...m, connected: true } : m)))
  }, [])

  const startQuest = useCallback(async (id: string) => {
    await delay(1200)
    setQuests((prev) => prev.map((q) => (q.id === id ? { ...q, state: 'active' } : q)))
  }, [])

  const completeQuest = useCallback(
    async (id: string): Promise<number> => {
      await delay(1400)
      let earnedXp = 0
      let reward = 0
      setQuests((prev) =>
        prev.map((q) => {
          if (q.id !== id) return q
          earnedXp = q.xpValue
          reward = Math.round(q.xpValue * 4)
          return {
            ...q,
            state: 'done',
            progress: q.progress ? { ...q.progress, current: q.progress.total } : undefined,
          }
        }),
      )
      if (earnedXp) addXp(earnedXp)
      if (reward) {
        setBalance((prev) => prev + reward)
        setTotalEarned((prev) => prev + reward)
        const tx: Transaction = {
          id: 'tx' + Date.now(),
          title: 'Quest Reward',
          amount: reward,
          type: 'earn',
          time: 'Just now',
          status: 'completed',
        }
        setTransactions((prev) => [tx, ...prev])
      }
      unlockAchievementProgress('adventurer', 1)
      return earnedXp
    },
    [addXp, unlockAchievementProgress],
  )

  const openChest = useCallback(async (): Promise<RewardEvent> => {
    await delay(1500)
    const coinReward = 500
    setChests((c) => Math.max(0, c - 1))
    setKeys((k) => Math.max(0, k - 1))
    setCoins((c) => c + coinReward)
    setArtifacts((a) => a + 1)
    setCollectionOwned((o) => Math.min(collectionTotal, o + 1))

    const newItem: InventoryItem = {
      id: 'item' + Date.now(),
      name: 'Ancient Relic',
      sprite: 'gem',
      rarity: 'Rare',
      slot: 'Artifact',
      description: 'A shimmering relic pulled from the depths of the chest.',
      unlockedAt: 'Just now',
    }
    setInventoryItems((prev) => [newItem, ...prev])

    const event: RewardEvent = {
      title: 'Chest Opened!',
      items: [
        { label: `+${coinReward} Coins`, sprite: 'coin' },
        { label: '+1 Artifact', sprite: 'gem' },
      ],
    }
    setRewardEvent(event)
    return event
  }, [])

  const updateProfile = useCallback((data: { name?: string; avatarId?: string }) => {
    if (data.name !== undefined) setName(data.name)
    if (data.avatarId !== undefined) setAvatarId(data.avatarId)
  }, [])

  const toggleNotifications = useCallback(() => setNotificationsEnabled((v) => !v), [])
  const toggleSound = useCallback(() => setSoundEnabled((v) => !v), [])

  const value = useMemo<StoreValue>(
    () => ({
      tab,
      navigate,
      name,
      avatarId,
      level,
      totalXp,
      levelXp,
      levelXpNeeded,
      streak,
      energy,
      energyMax,
      balance,
      totalEarned,
      transactions,
      paymentMethods,
      quests,
      chests,
      keys,
      coins,
      artifacts,
      badges,
      collectionOwned,
      collectionTotal,
      inventoryItems,
      achievements,
      language,
      theme,
      notificationsEnabled,
      soundEnabled,
      toasts,
      levelUp,
      rewardEvent,
      toast,
      dismissToast,
      clearLevelUp,
      clearReward,
      addXp,
      withdraw,
      connectPaymentMethod,
      startQuest,
      completeQuest,
      openChest,
      updateProfile,
      setLanguage,
      setTheme,
      toggleNotifications,
      toggleSound,
    }),
    [
      tab,
      navigate,
      name,
      avatarId,
      level,
      totalXp,
      levelXp,
      levelXpNeeded,
      streak,
      energy,
      balance,
      totalEarned,
      transactions,
      paymentMethods,
      quests,
      chests,
      keys,
      coins,
      artifacts,
      badges,
      collectionOwned,
      inventoryItems,
      achievements,
      language,
      theme,
      notificationsEnabled,
      soundEnabled,
      toasts,
      levelUp,
      rewardEvent,
      toast,
      dismissToast,
      clearLevelUp,
      clearReward,
      addXp,
      withdraw,
      connectPaymentMethod,
      startQuest,
      completeQuest,
      openChest,
      updateProfile,
      toggleNotifications,
      toggleSound,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function avatarSprite(avatarId: string): Avatar {
  return avatars.find((a) => a.id === avatarId) ?? avatars[0]
}
