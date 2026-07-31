'use client'

import { useState } from 'react'
import { Bell, ChevronRight, Flame, Zap } from 'lucide-react'
import { SegmentedProgress } from '@/components/primitives'
import { PixelSprite } from '@/components/pixel-sprite'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { EmptyState } from '@/components/ui/empty-state'
import { NotificationsSheet } from '@/components/sheets/settings-sheets'
import { useNavigate } from '@/components/app-shell'
import { useGame, AVATARS, formatXp } from '@/lib/store'

export function HomeScreen() {
  const {
    name,
    level,
    totalXp,
    levelXp,
    levelTarget,
    streak,
    energy,
    energyMax,
    avatarId,
    rewards,
    unreadCount,
  } = useGame()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)

  const avatar = AVATARS.find((a) => a.id === avatarId) ?? AVATARS[0]

  return (
    <div className="flex flex-col gap-8 px-6 pb-6 pt-2">
      {/* Greeting */}
      <header className="flex items-start justify-between">
        <div>
          <p className="text-[13px] text-muted-foreground">Good Evening,</p>
          <h1 className="mt-0.5 text-3xl font-medium tracking-tight text-balance">{name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotifications(true)}
            className="relative flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors duration-150 hover:border-ring hover:text-foreground active:scale-95"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
            )}
          </button>
          <button
            onClick={() => navigate('profile')}
            className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-border bg-card text-foreground transition-colors duration-150 hover:border-ring active:scale-95"
            aria-label="Open profile"
          >
            <PixelSprite name={avatar.sprite} size={26} />
          </button>
        </div>
      </header>

      {/* Level / XP */}
      <section className="flex flex-col gap-3">
        <span className="pixel-label text-[10px] text-muted-foreground">Level {level}</span>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-4xl font-medium tracking-tight tnum">
            <AnimatedNumber value={totalXp} />
          </span>
          <span className="pixel-label text-[10px] text-muted-foreground">XP</span>
        </div>
        <SegmentedProgress value={Math.round((levelXp / levelTarget) * 100)} segments={24} />
        <div className="flex justify-between font-mono text-xs text-muted-foreground tnum">
          <span>{formatXp(levelXp)}</span>
          <span>{formatXp(levelTarget)}</span>
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
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors duration-150 hover:border-ring">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span className="text-xs">Energy</span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-3xl font-medium tnum">
                <AnimatedNumber value={energy} duration={400} />
              </span>
              <span className="font-mono text-sm text-muted-foreground">/ {energyMax}</span>
            </div>
            <p className="pixel-label mt-2 text-[9px] text-muted-foreground">+1 in 05:30</p>
          </div>
        </div>
      </section>

      {/* Recent Rewards */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Recent Rewards</h2>
          <button
            onClick={() => navigate('inventory')}
            className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground active:scale-95"
          >
            View all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {rewards.length === 0 ? (
          <EmptyState
            sprite="trophy"
            title="No rewards yet"
            description="Complete a quest to start earning XP and rewards."
          />
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {rewards.slice(0, 5).map((r) => (
              <button
                key={r.id}
                onClick={() => navigate('inventory')}
                className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 text-left transition-colors duration-150 hover:bg-surface active:scale-[0.99]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
                  <PixelSprite name={r.sprite} size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{r.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs font-medium tnum">{r.xp}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{r.time}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <NotificationsSheet open={showNotifications} onClose={() => setShowNotifications(false)} />
    </div>
  )
}
