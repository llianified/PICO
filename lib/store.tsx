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
export type QuestReward = { xp: number; keys: number; chests: number }

/** Coins can be spent in the inventory shop to restock keys and chests. */
export const KEY_COST = 800
export const CHEST_COST = 2000

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
  /** maps an equipment slot (e.g. "Head") to the equipped item id */
  equipped: Record<string, string>

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
  achievementEvent: AchievementEvent

  // actions
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
  clearLevelUp: () => void
  clearReward: () => void
  clearAchievement: () => void
  claimAchievement: (id: string) => Promise<void>

  addXp: (amount: number) => void
  withdraw: (amount: number, methodId: string) => Promise<void>
  connectPaymentMethod: (id: string) => Promise<void>
  startQuest: (id: string) => Promise<void>
  completeQuest: (id: string) => Promise<QuestReward>
  openChest: () => Promise<RewardEvent>
  equipItem: (id: string) => void
  buyKey: () => Promise<void>
  buyChest: () => Promise<void>
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
  // Always-fresh snapshot so completeQuest can compute rewards without
  // running side effects inside a state updater (safe under StrictMode).
  const questsRef = useRef(quests)
  questsRef.current = quests

  const [chests, setChests] = useState(3)
  const [keys, setKeys] = useState(7)
  const [coins, setCoins] = useState(12400)
  const [artifacts, setArtifacts] = useState(11)
  const [badges, setBadges] = useState(24)
  const [collectionOwned, setCollectionOwned] = useState(15)
  const collectionTotal = 48
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(initialInventoryItems)
  // Start with the default hat equipped so the equipped state is visible right away.
  const [equipped, setEquipped] = useState<Record<string, string>>({ Head: 'hat' })

  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements)

  const [language, setLanguage] = useState('English')
  const [theme, setTheme] = useState('Dark')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const [toasts, setToasts] = useState<Toast[]>([])
  const [levelUp, setLevelUp] = useState<LevelUpEvent>(null)
  const [rewardEvent, setRewardEvent] = useState<RewardEvent>(null)
  const [achievementEvent, setAchievementEvent] = useState<AchievementEvent>(null)

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
  const clearAchievement = useCallback(() => setAchievementEvent(null), [])

  const claimAchievement = useCallback(async (id: string) => {
    await delay(900)
    let claimedTitle = ''
    setAchievements((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        claimedTitle = a.title
        return { ...a, claimed: true }
      }),
    )
    setBadges((b) => b + 1)
    if (claimedTitle) {
      setAchievementEvent({
        title: claimedTitle,
        subtitle: 'Achievement reward claimed',
      })
    }
  }, [])

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
          setTimeout(() => {
            setBadges((b) => b + 1)
            setAchievementEvent({ title: a.title, subtitle: 'Achievement unlocked' })
          }, 500)
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

  const grantMoney = useCallback((reward: number, title: string) => {
    if (!reward) return
    setBalance((prev) => prev + reward)
    setTotalEarned((prev) => prev + reward)
    const tx: Transaction = {
      id: 'tx' + Date.now() + Math.random().toString(36).slice(2, 6),
      title,
      amount: reward,
      type: 'earn',
      time: 'Just now',
      status: 'completed',
    }
    setTransactions((prev) => [tx, ...prev])
  }, [])

  // Rewards scale with a quest's XP value: bigger quests hand out more keys,
  // and every quest has a chance to drop a treasure chest.
  const rollQuestReward = (xpValue: number): QuestReward => ({
    xp: xpValue,
    keys: xpValue >= 500 ? 2 : 1,
    chests: Math.random() < (xpValue >= 300 ? 0.5 : 0.25) ? 1 : 0,
  })

  const applyQuestReward = useCallback(
    (r: QuestReward, moneyLabel: string) => {
      if (r.xp) addXp(r.xp)
      if (r.keys) setKeys((k) => k + r.keys)
      if (r.chests) setChests((c) => c + r.chests)
      grantMoney(Math.round(r.xp * 4), moneyLabel)
      unlockAchievementProgress('adventurer', 1)
    },
    [addXp, grantMoney, unlockAchievementProgress],
  )

  const completeQuest = useCallback(
    async (id: string): Promise<QuestReward> => {
      await delay(1400)
      const snapshot = questsRef.current
      const target = snapshot.find((q) => q.id === id)
      if (!target || target.state === 'done') {
        return { xp: 0, keys: 0, chests: 0 }
      }

      const primary = rollQuestReward(target.xpValue)

      // Advance the aggregate "Complete 3 Quests" tracker whenever any other
      // quest is finished. When it fills up, it auto-completes and pays out.
      const aggregate = snapshot.find((q) => q.id === 'three')
      let aggregateCurrent: number | null = null
      let aggregateCompleted = false
      if (id !== 'three' && aggregate?.progress && aggregate.state !== 'done') {
        aggregateCurrent = Math.min(aggregate.progress.total, aggregate.progress.current + 1)
        aggregateCompleted = aggregateCurrent >= aggregate.progress.total
      }

      setQuests((prev) =>
        prev.map((q) => {
          if (q.id === id) {
            return {
              ...q,
              state: 'done',
              progress: q.progress ? { ...q.progress, current: q.progress.total } : undefined,
            }
          }
          if (q.id === 'three' && aggregateCurrent !== null && q.progress) {
            return {
              ...q,
              state: aggregateCompleted ? 'done' : q.state,
              progress: { ...q.progress, current: aggregateCurrent },
            }
          }
          return q
        }),
      )

      applyQuestReward(primary, 'Quest Reward')

      if (aggregateCompleted && aggregate) {
        const bonus = rollQuestReward(aggregate.xpValue)
        applyQuestReward(bonus, 'Bonus · Complete 3 Quests')
        setTimeout(() => {
          toast({
            title: 'Bonus reward!',
            description: `Complete 3 Quests · +${bonus.xp} XP`,
            variant: 'success',
          })
        }, 700)
      }

      return primary
    },
    [applyQuestReward, toast],
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

  const equipItem = useCallback(
    (id: string) => {
      const item = inventoryItems.find((i) => i.id === id)
      if (!item) return
      setEquipped((prev) => {
        // toggle: tapping the equipped item again unequips it
        if (prev[item.slot] === id) {
          const next = { ...prev }
          delete next[item.slot]
          return next
        }
        return { ...prev, [item.slot]: id }
      })
    },
    [inventoryItems],
  )

  const buyKey = useCallback(async () => {
    await delay(700)
    setCoins((c) => c - KEY_COST)
    setKeys((k) => k + 1)
  }, [])

  const buyChest = useCallback(async () => {
    await delay(700)
    setCoins((c) => c - CHEST_COST)
    setChests((c) => c + 1)
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
      equipped,
      achievements,
      language,
      theme,
      notificationsEnabled,
      soundEnabled,
      toasts,
      levelUp,
      rewardEvent,
      achievementEvent,
      toast,
      dismissToast,
      clearLevelUp,
      clearReward,
      clearAchievement,
      claimAchievement,
      addXp,
      withdraw,
      connectPaymentMethod,
      startQuest,
      completeQuest,
      openChest,
      equipItem,
      buyKey,
      buyChest,
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
      equipped,
      achievements,
      language,
      theme,
      notificationsEnabled,
      soundEnabled,
      toasts,
      levelUp,
      rewardEvent,
      achievementEvent,
      toast,
      dismissToast,
      clearLevelUp,
      clearReward,
      clearAchievement,
      claimAchievement,
      addXp,
      withdraw,
      connectPaymentMethod,
      startQuest,
      completeQuest,
      openChest,
      equipItem,
      buyKey,
      buyChest,
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
