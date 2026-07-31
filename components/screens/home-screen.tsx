'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronRight, Flame, Zap } from 'lucide-react'
import { SegmentedProgress } from '@/components/primitives'
import { PixelSprite } from '@/components/pixel-sprite'
import { CountUp } from '@/components/ui/count-up'
import { useStore, avatarSprite, ENERGY_MAX } from '@/lib/store'

/** Compact "time ago" label for the Recent Rewards feed. */
function TimeAgoDisplay({ ts }: { ts: number }) {
  const [display, setDisplay] = useState('just now')
  
  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Date.now() - ts)
      const mins = Math.floor(diff / 60000)
      if (mins < 1) setDisplay('just now')
      else if (mins < 60) setDisplay(`${mins}m ago`)
      else {
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) setDisplay(`${hrs}h ago`)
        else setDisplay(`${Math.floor(hrs / 24)}d ago`)
      }
    }
    
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [ts])
  
  return <span>{display}</span>
}

/** Energy card with live countdown timer */
function EnergyCard({ energy, energyMax, nextEnergyAt }: { energy: number; energyMax: number; nextEnergyAt: number | null }) {
  const [timeRemaining, setTimeRemaining] = useState<string>('--:--')

  useEffect(() => {
    if (energy >= energyMax || nextEnergyAt === null) {
      setTimeRemaining('--:--')
      return
    }

    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, nextEnergyAt - now)
      const mins = Math.floor(remaining / 60000)
      const secs = Math.floor((remaining % 60000) / 1000)
      setTimeRemaining(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [energy, energyMax, nextEnergyAt])

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors duration-150 hover:border-ring">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Zap className="h-4 w-4" />
        <span className="text-xs">Energy</span>
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-3xl font-medium tnum">{energy}</span>
          <span className="font-mono text-sm text-muted-foreground">/ {energyMax}</span>
        </div>
        {energy < energyMax && nextEnergyAt !== null ? (
          <p className="pixel-label mt-2 text-[9px] text-muted-foreground">+1 in {timeRemaining}</p>
        ) : (
          <p className="pixel-label mt-2 text-[9px] text-muted-foreground">Full</p>
        )}
      </div>
    </div>
  )
}

export function HomeScreen() {
  const {
    name,
    avatarId,
    level,
    totalXp,
    levelXp,
    levelXpNeeded,
    streak,
    energy,
    energyMax,
    nextEnergyAt,
    equippedItems,
    rewardsFeed,
    navigate,
  } = useStore()

  const avatar = avatarSprite(avatarId)
  const isDefaultAvatar = avatarId === 'explorer'
  const equippedGear = equippedItems[0]
  const xpPercent = Math.min(100, (levelXp / levelXpNeeded) * 100)

  return (
    <div className="flex flex-col gap-8 px-6 pb-6 pt-2">
      {/* Greeting */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-muted-foreground">Good Evening,</p>
          <h1 className="mt-0.5 break-words text-3xl font-medium tracking-tight text-balance">{name}</h1>
        </div>
        <button
          onClick={() => navigate('profile')}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-card transition-colors duration-150 hover:border-ring active:scale-95"
          aria-label="Open profile"
        >
          {isDefaultAvatar ? (
            <Image
              src="/pixel/avatar.png"
              alt="Your avatar"
              width={40}
              height={40}
              className="pixelated h-9 w-9 object-contain"
            />
          ) : (
            <PixelSprite name={avatar.sprite} size={34} />
          )}
          {equippedGear && (
            <span
              className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-md border border-border bg-surface"
              title={`Equipped: ${equippedGear.name}`}
            >
              <PixelSprite name={equippedGear.sprite} size={12} />
              <span className="sr-only">Equipped {equippedGear.name}</span>
            </span>
          )}
        </button>
      </header>

      {/* Level / XP */}
      <section className="flex flex-col gap-3">
        <span className="pixel-label text-[10px] text-muted-foreground">Level {level}</span>
        <div className="flex items-baseline gap-2">
          <CountUp
            value={totalXp}
            format={(n) => Math.round(n).toLocaleString('en-US')}
            className="font-mono text-4xl font-medium tracking-tight tnum"
          />
          <span className="pixel-label text-[10px] text-muted-foreground">XP</span>
        </div>
        <SegmentedProgress value={xpPercent} segments={24} />
        <div className="flex justify-between font-mono text-xs text-muted-foreground tnum">
          <span>{levelXp.toLocaleString('en-US')}</span>
          <span>{levelXpNeeded.toLocaleString('en-US')}</span>
        </div>
      </section>

      {/* Continue */}
      <button
        onClick={() => navigate('adventure')}
        className="group flex items-center justify-between rounded-lg bg-primary px-5 py-4 text-primary-foreground transition-transform duration-100 active:scale-[0.99]"
      >
        <span className="text-[15px] font-medium">Continue Adventure</span>
        <ChevronRight className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5" />
      </button>

      {/* Streak + Energy */}
      <section className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors duration-150 hover:border-ring">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flame className="h-4 w-4" />
            <span className="text-xs">Daily Streak</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-medium tnum">{streak}</span>
            <span className="text-xs text-muted-foreground">days</span>
          </div>
        </div>
        <EnergyCard energy={energy} energyMax={energyMax} nextEnergyAt={nextEnergyAt} />
      </section>

      {/* Recent Rewards */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Recent Rewards</h2>
          <button
            onClick={() => navigate('wallet')}
            className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            View all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {rewardsFeed.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate('wallet')}
              className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 text-left transition-colors duration-150 hover:bg-surface active:scale-[0.99]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
                <PixelSprite name={r.sprite} size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{r.title}</p>
                <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-xs font-medium tnum">{r.value}</p>
                <p className="font-mono text-[10px] text-muted-foreground"><TimeAgoDisplay ts={r.createdAt} /></p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
