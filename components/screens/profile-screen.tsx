'use client'

import Image from 'next/image'
import { useState } from 'react'
import { motion } from 'motion/react'
import { ChevronRight, Pencil, Settings } from 'lucide-react'
import { SegmentedProgress } from '@/components/primitives'
import { PixelSprite } from '@/components/pixel-sprite'
import { CountUp } from '@/components/ui/count-up'
import { useStore, avatarSprite } from '@/lib/store'
import { SettingsSheet } from '@/components/profile/settings-sheet'
import { AvatarSheet } from '@/components/profile/avatar-sheet'
import { AchievementsSheet } from '@/components/profile/achievements-sheet'
import { formatCompact } from '@/lib/mock-data'

export function ProfileScreen() {
  const {
    name,
    avatarId,
    level,
    levelXp,
    levelXpNeeded,
    badges,
    achievements,
    quests,
  } = useStore()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [achievementsOpen, setAchievementsOpen] = useState(false)

  const questsCompleted = 128 + quests.filter((q) => q.state === 'done').length
  const avatar = avatarSprite(avatarId)
  const isDefaultAvatar = avatarId === 'explorer'
  const xpPercent = Math.round((levelXp / levelXpNeeded) * 100)

  const stats = [
    { label: 'Quests Completed', value: questsCompleted },
    { label: 'Days Active', value: 18 },
    { label: 'Badges', value: badges },
  ]

  const topAchievements = achievements.slice(0, 3)

  return (
    <div className="flex flex-col gap-8 px-6 pb-6 pt-2">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-medium tracking-tight">Profile</h1>
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Open settings"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground active:scale-95"
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>

      {/* Identity */}
      <section className="flex items-center gap-4">
        <button
          onClick={() => setAvatarOpen(true)}
          aria-label="Change avatar"
          className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-card transition-transform active:scale-95"
        >
          {isDefaultAvatar ? (
            <Image
              src="/pixel/avatar.png"
              alt="Your avatar"
              width={52}
              height={52}
              className="pixelated h-12 w-12 object-contain"
            />
          ) : (
            <PixelSprite name={avatar.sprite} size={44} />
          )}
          <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-tl-md border-l border-t border-border bg-surface text-muted-foreground">
            <Pencil className="h-2.5 w-2.5" />
          </span>
        </button>
        <div className="flex-1">
          <span className="pixel-label text-[10px] text-muted-foreground">Level {level}</span>
          <p className="mt-1.5 text-xl font-medium tracking-tight">{name}</p>
          <div className="mt-3">
            <SegmentedProgress value={xpPercent} segments={20} />
            <p className="pixel-label mt-2.5 text-[9px] text-muted-foreground tnum">
              {levelXp.toLocaleString()} / {levelXpNeeded.toLocaleString()} XP
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-4 text-center"
          >
            <span className="font-mono text-2xl font-medium tnum">
              <CountUp value={s.value} />
            </span>
            <span className="text-[10px] leading-tight text-muted-foreground text-pretty">
              {s.label}
            </span>
          </div>
        ))}
      </section>

      {/* Achievements */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Achievements</h2>
          <button
            onClick={() => setAchievementsOpen(true)}
            className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            View all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {topAchievements.map((a) => (
            <motion.div
              key={a.id}
              layout
              onClick={() => setAchievementsOpen(true)}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-muted-foreground/40"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface transition-opacity ${
                  a.unlocked ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <PixelSprite name="trophy" size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.subtitle}</p>
              </div>
              {a.unlocked && !a.claimed ? (
                <span className="pixel-label rounded-full bg-primary px-2 py-1 text-[8px] text-primary-foreground">
                  Claim
                </span>
              ) : (
                <span className="pixel-label text-[9px] text-muted-foreground tnum">
                  {formatCompact(a.current)} / {formatCompact(a.total)}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AvatarSheet open={avatarOpen} onClose={() => setAvatarOpen(false)} />
      <AchievementsSheet open={achievementsOpen} onClose={() => setAchievementsOpen(false)} />
    </div>
  )
}
