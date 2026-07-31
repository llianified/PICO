'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  avatars,
  computeStreak,
  formatCompact,
  formatRp,
  initialAchievements,
  initialInventoryItems,
  initialLoginDates,
  initialPaymentMethods,
  initialQuests,
  initialRewardsFeed,
  initialTransactions,
  LEVEL_XP_BASE,
  questCoinReward,
  questKeyReward,
  questMoneyReward,
  reconcileQuestAvailability,
  resetDailyQuests,
  toDayKey,
  xpNeededForLevel,
  type Achievement,
  type Avatar,
  type InventoryItem,
  type PaymentMethod,
  type Quest,
  type RewardFeedItem,
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
export type QuestReward = { xp: number; keys: number; chests: number; coins: number }

/** Coins can be spent in the inventory shop to restock keys and chests. */
export const KEY_COST = 800
export const CHEST_COST = 2000

/** Energy economy — completing a quest costs energy, which regenerates over time. */
export const ENERGY_MAX = 30
export const ENERGY_COST = 6
export const ENERGY_REGEN_MS = 90_000

/** How many items the inventory can hold. Collection progress is separate. */
export const INVENTORY_CAP = 12

export type TabId = 'home' | 'adventure' | 'inventory' | 'wallet' | 'profile'

type StoreValue = {
  // navigation
  tab: TabId
  navigate: (tab: TabId) => void

  // profile / progression
  name: string
  avatarId: string
  referralCode: string
  level: number
  totalXp: number
  levelXp: number
  levelXpNeeded: number
  streak: number
  energy: number
  energyMax: number
  energyCost: number
  /** timestamp (ms) when the next energy point regenerates, or null when full */
  nextEnergyAt: number | null
  questsCompletedTotal: number
  daysActive: number

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
  inventoryCount: number
  inventoryCap: number
  /** maps an equipment slot (e.g. "Head") to the equipped item id */
  equipped: Record<string, string>
  /** the resolved inventory items that are currently equipped on the avatar */
  equippedItems: InventoryItem[]

  // achievements
  achievements: Achievement[]

  // activity feed (Recent Rewards)
  rewardsFeed: RewardFeedItem[]

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
  setQuestProgress: (id: string, newProgress: number) => void
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
  const referralCode = useMemo(() => {
    // Generate a consistent referral code based on user name and avatar
    const seed = `${name}-${avatarId}-pico`
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return `PICO${Math.abs(hash).toString(36).toUpperCase().slice(0, 6)}`
  }, [name, avatarId])
  const [level, setLevel] = useState(1)
  const [totalXp, setTotalXp] = useState(0)
  const [levelXp, setLevelXp] = useState(0)
  const [levelXpNeeded, setLevelXpNeeded] = useState(LEVEL_XP_BASE)
  
  const levelRef = useRef(1)
  const levelXpRef = useRef(0)
  const levelXpNeededRef = useRef(LEVEL_XP_BASE)
  
  useEffect(() => {
    levelRef.current = level
    levelXpRef.current = levelXp
    levelXpNeededRef.current = levelXpNeeded
  }, [level, levelXp, levelXpNeeded])

  // Streak is derived from a mocked login history, never hardcoded.
  const [loginDates, setLoginDates] = useState<string[]>(initialLoginDates)
  const streak = useMemo(() => computeStreak(loginDates), [loginDates])

  // The day key the daily quests were last reset for. When the calendar day
  // rolls over, daily quests are restored to their fresh state.
  const [dailyResetDay, setDailyResetDay] = useState<string>(() => toDayKey(new Date()))
  const dailyResetDayRef = useRef(dailyResetDay)
  dailyResetDayRef.current = dailyResetDay

  // Lifetime stats that back the profile screen.
  const [questsCompletedTotal, setQuestsCompletedTotal] = useState(0)
  const [daysActive, setDaysActive] = useState(0)

  // Energy regenerates one point every ENERGY_REGEN_MS while below the cap.
  const energyMax = ENERGY_MAX
  const [energy, setEnergy] = useState(ENERGY_MAX)
  const [nextEnergyAt, setNextEnergyAt] = useState<number | null>(null)
  const energyRef = useRef(energy)
  energyRef.current = energy
  const nextEnergyAtRef = useRef(nextEnergyAt)
  nextEnergyAtRef.current = nextEnergyAt

  const [balance, setBalance] = useState(0)
  const [totalEarned, setTotalEarned] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods)

  const [quests, setQuests] = useState<Quest[]>(initialQuests)
  // Always-fresh snapshot so completeQuest can compute rewards without
  // running side effects inside a state updater (safe under StrictMode).
  const questsRef = useRef(quests)
  questsRef.current = quests

  const [chests, setChests] = useState(2)
  const [keys, setKeys] = useState(1)
  const [coins, setCoins] = useState(5000)
  const [artifacts, setArtifacts] = useState(1)
  const [badges, setBadges] = useState(1)
  const [collectionOwned, setCollectionOwned] = useState(12)
  const collectionTotal = 48
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(initialInventoryItems)
  // Nothing equipped on a fresh start — the player has no items yet.
  const [equipped, setEquipped] = useState<Record<string, string>>({})

  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements)

  const [rewardsFeed, setRewardsFeed] = useState<RewardFeedItem[]>(initialRewardsFeed)

  const [language, setLanguage] = useState('English')
  const [theme, setTheme] = useState('Dark')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const [toasts, setToasts] = useState<Toast[]>([])
  const [levelUp, setLevelUp] = useState<LevelUpEvent>(null)
  const [rewardEvent, setRewardEvent] = useState<RewardEvent>(null)
  const [achievementEvent, setAchievementEvent] = useState<AchievementEvent>(null)

  const toastId = useRef(0)
  const achievementQueueRef = useRef<NodeJS.Timeout | null>(null)

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

  // Append a gameplay event to the Recent Rewards feed (newest first).
  const logReward = useCallback((entry: Omit<RewardFeedItem, 'id' | 'createdAt'>) => {
    setRewardsFeed((prev) =>
      [
        {
          ...entry,
          id: 'rw' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          createdAt: Date.now(),
        },
        ...prev,
      ].slice(0, 40),
    )
  }, [])

  // Record today's login exactly once. Adding a new day grows "days active";
  // the streak recomputes automatically from the login history.
  useEffect(() => {
    const today = toDayKey(new Date())
    setLoginDates((prev) => {
      if (prev.includes(today)) return prev
      setDaysActive((d) => d + 1)
      return [today, ...prev]
    })
  }, []) // Empty dependency - runs only once on mount

  // Auto-unlock Story quests as the player levels up. Runs whenever the level
  // changes, flipping `available` on any Story quest whose level gate is met
  // (completed quests are never re-locked) and announcing the unlock.
  useEffect(() => {
    setQuests((prev) => {
      const next = reconcileQuestAvailability(prev, level)
      if (next === prev) return prev
      const newlyUnlocked = next.filter(
        (q, i) => q.available && !prev[i].available && q.category === 'Story',
      )
      for (const q of newlyUnlocked) {
        setTimeout(() => {
          toast({
            title: 'Story quest unlocked',
            description: q.title,
            variant: 'info',
          })
        }, 600)
      }
      return next
    })
  }, [level, toast])

  // Daily quest reset. Once per minute we check whether the calendar day has
  // rolled over; when it has, daily quests return to their fresh state while
  // completed Story quests (and all other categories) are preserved.
  useEffect(() => {
    const id = setInterval(() => {
      const today = toDayKey(new Date())
      if (today === dailyResetDayRef.current) return
      setDailyResetDay(today)
      setQuests((prev) => resetDailyQuests(prev))
      toast({
        title: 'Daily quests refreshed',
        description: 'A new day has begun — daily quests are back.',
        variant: 'info',
      })
    }, 60_000)
    return () => clearInterval(id)
  }, [toast])

  // Spend energy and (re)start the regen timer if we dropped below the cap.
  const consumeEnergy = useCallback((amount: number) => {
    setEnergy((prev) => {
      const next = Math.max(0, prev - amount)
      if (next < ENERGY_MAX && nextEnergyAtRef.current === null) {
        setNextEnergyAt(Date.now() + ENERGY_REGEN_MS)
      }
      return next
    })
  }, [])

  // Live energy regeneration. Only writes state when a point is actually gained
  // (or the timer needs normalizing), so it won't re-render the tree each tick.
  useEffect(() => {
    const id = setInterval(() => {
      const e = energyRef.current
      const at = nextEnergyAtRef.current
      if (e >= ENERGY_MAX) {
        if (at !== null) setNextEnergyAt(null)
        return
      }
      if (at === null) {
        setNextEnergyAt(Date.now() + ENERGY_REGEN_MS)
        return
      }
      if (Date.now() >= at) {
        const next = Math.min(ENERGY_MAX, e + 1)
        setEnergy(next)
        setNextEnergyAt(next >= ENERGY_MAX ? null : Date.now() + ENERGY_REGEN_MS)
      }
    }, 1000)
    return () => clearInterval(id)
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
    
    // Calculate all the leveling changes first, then apply them atomically
    setLevelXp((prevXp) => {
      let xp = prevXp + amount
      setLevel((prevLevel) => {
        let lvl = prevLevel
        let needed = xpNeededForLevel(lvl)
        let leveledUp = false
        let newLevel = 0

        // Calculate all level ups
        while (xp >= needed) {
          xp -= needed
          lvl += 1
          needed = xpNeededForLevel(lvl)
          leveledUp = true
          newLevel = lvl
        }

        // Update the XP needed for the final level AFTER we've calculated everything
        setLevelXpNeeded(needed)

        if (leveledUp) {
          setTimeout(() => setLevelUp({ level: newLevel }), 400)
        }

        return lvl
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
          // Clear any pending achievement notification and queue this one
          if (achievementQueueRef.current) clearTimeout(achievementQueueRef.current)
          achievementQueueRef.current = setTimeout(() => {
            setBadges((b) => b + 1)
            setAchievementEvent({ title: a.title, subtitle: 'Achievement unlocked' })
            // Clear after showing so next achievement can display
            setTimeout(() => {
              setAchievementEvent(null)
            }, 2500)
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

  const setQuestProgress = useCallback((id: string, newProgress: number) => {
    setQuests((prev) =>
      prev.map((q) =>
        q.id === id && q.progress
          ? { ...q, progress: { ...q.progress, current: Math.min(newProgress, q.progress.total) } }
          : q,
      ),
    )
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
  // coins, and every quest has a chance to drop a treasure chest.
  const rollQuestReward = (xpValue: number): QuestReward => ({
    xp: xpValue,
    keys: questKeyReward(xpValue),
    coins: questCoinReward(xpValue),
    chests: Math.random() < (xpValue >= 300 ? 0.5 : 0.25) ? 1 : 0,
  })

  const applyQuestReward = useCallback(
    (r: QuestReward, moneyLabel: string) => {
      if (r.xp) addXp(r.xp)
      if (r.keys) setKeys((k) => k + r.keys)
      if (r.coins) setCoins((c) => c + r.coins)
      if (r.chests) setChests((c) => c + r.chests)
      const money = questMoneyReward(r.xp)
      grantMoney(money, moneyLabel)
      unlockAchievementProgress('adventurer', 1)
      logReward({
        sprite: 'trophy',
        title: 'Quest Completed',
        subtitle: moneyLabel,
        value: `+${r.xp} XP`,
      })
    },
    [addXp, grantMoney, unlockAchievementProgress, logReward],
  )

  const completeQuest = useCallback(
    async (id: string): Promise<QuestReward> => {
      // Energy gates gameplay: block completion up front if the player is short.
      if (energyRef.current < ENERGY_COST) {
        throw new Error('NO_ENERGY')
      }
      await delay(1400)
      const snapshot = questsRef.current
      const target = snapshot.find((q) => q.id === id)
      if (!target || target.state === 'done') {
        return { xp: 0, keys: 0, chests: 0, coins: 0 }
      }

      // Spend energy for the completed objective.
      consumeEnergy(ENERGY_COST)
      setQuestsCompletedTotal((n) => n + 1)

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
    logReward({
      sprite: 'key',
      title: 'Key Purchased',
      subtitle: `Inventory Shop`,
      value: `-${formatCompact(KEY_COST)} coins`,
    })
  }, [logReward])

  const buyChest = useCallback(async () => {
    await delay(700)
    setCoins((c) => c - CHEST_COST)
    setChests((c) => c + 1)
    logReward({
      sprite: 'chest',
      title: 'Chest Purchased',
      subtitle: `Inventory Shop`,
      value: `-${formatCompact(CHEST_COST)} coins`,
    })
  }, [logReward])

  const updateProfile = useCallback((data: { name?: string; avatarId?: string }) => {
    if (data.name !== undefined) setName(data.name)
    if (data.avatarId !== undefined) setAvatarId(data.avatarId)
  }, [])

  const toggleNotifications = useCallback(() => setNotificationsEnabled((v) => !v), [])
  const toggleSound = useCallback(() => setSoundEnabled((v) => !v), [])

  // Resolve the equipped slot map into the actual inventory items so screens can
  // reflect equipped gear on the avatar.
  const equippedItems = useMemo<InventoryItem[]>(
    () =>
      Object.values(equipped)
        .map((id) => inventoryItems.find((i) => i.id === id))
        .filter((i): i is InventoryItem => Boolean(i)),
    [equipped, inventoryItems],
  )

  const value = useMemo<StoreValue>(
    () => ({
      tab,
      navigate,
      name,
      avatarId,
      referralCode,
      level,
      totalXp,
      levelXp,
      levelXpNeeded,
      streak,
      energy,
      energyMax,
      energyCost: ENERGY_COST,
      nextEnergyAt,
      questsCompletedTotal,
      daysActive,
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
      inventoryCount: inventoryItems.length,
      inventoryCap: INVENTORY_CAP,
      equipped,
      equippedItems,
      achievements,
      rewardsFeed,
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
      setQuestProgress,
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
      nextEnergyAt,
      questsCompletedTotal,
      daysActive,
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
      equippedItems,
      achievements,
      rewardsFeed,
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
      setQuestProgress,
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
