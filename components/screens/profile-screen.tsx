'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronRight, Pencil, Settings } from 'lucide-react'
import { SegmentedProgress } from '@/components/primitives'
import { PixelSprite } from '@/components/pixel-sprite'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { BottomSheet, Modal } from '@/components/ui/overlay'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import {
  SettingsSheet,
  AvatarSheet,
} from '@/components/sheets/settings-sheets'
import { useGame, AVATARS, formatXp } from '@/lib/store'

export function ProfileScreen() {
  const {
    name,
    level,
    levelXp,
    levelTarget,
    avatarId,
    questsCompleted,
    daysActive,
    achievements,
    inventory,
    setName,
  } = useGame()
  const { toast } = useToast()

  const [showSettings, setShowSettings] = useState(false)
  const [showAvatar, setShowAvatar] = useState(false)
  const [showAllAchievements, setShowAllAchievements] = useState(false)
  const [editName, setEditName] = useState(false)
  const [draftName, setDraftName] = useState(name)

  const avatar = AVATARS.find((a) => a.id === avatarId) ?? AVATARS[0]
  const badges = inventory.find((i) => i.key === 'shield')?.count ?? 0
  const pct = Math.round((levelXp / levelTarget) * 100)

  const stats = [
    { label: 'Quests Completed', value: questsCompleted },
    { label: 'Days Active', value: daysActive },
    { label: 'Badges', value: badges },
  ]

  const preview = achievements.slice(0, 3)

  const saveName = () => {
    const trimmed = draftName.trim()
    if (!trimmed) {
      toast({ title: 'Name required', description: 'Enter a display name.', variant: 'error' })
      return
    }
    setName(trimmed)
    setEditName(false)
    toast({ title: 'Profile updated', description: `You are now ${trimmed}.`, variant: 'success' })
  }

  return (
    <div className="flex flex-col gap-8 px-6 pb-6 pt-2">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-medium tracking-tight">Profile</h1>
        <button
          onClick={() => setShowSettings(true)}
          aria-label="Open settings"
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground active:scale-90"
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>

      {/* Identity */}
      <section className="flex items-center gap-4">
        <button
          onClick={() => setShowAvatar(true)}
          aria-label="Change avatar"
          className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-card text-foreground transition-colors hover:border-ring active:scale-95"
        >
          <PixelSprite name={avatar.sprite} size={36} />
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-primary/90 py-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <Pencil className="h-2.5 w-2.5 text-primary-foreground" />
          </span>
        </button>
        <div className="flex-1">
          <span className="pixel-label text-[10px] text-muted-foreground">Level {level}</span>
          <button
            onClick={() => {
              setDraftName(name)
              setEditName(true)
            }}
            className="mt-1.5 flex items-center gap-1.5 text-xl font-medium tracking-tight transition-colors hover:text-muted-foreground"
          >
            {name}
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <div className="mt-3">
            <SegmentedProgress value={pct} segments={20} />
            <p className="pixel-label mt-2.5 text-[9px] text-muted-foreground tnum">
              {formatXp(levelXp)} / {formatXp(levelTarget)} XP
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
              <AnimatedNumber value={s.value} />
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
            onClick={() => setShowAllAchievements(true)}
            className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground active:scale-95"
          >
            View all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {preview.map((a) => {
            const complete = a.current >= a.total
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface ${
                    complete ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <PixelSprite name={a.sprite} size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.subtitle}</p>
                </div>
                {complete ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </span>
                ) : (
                  <span className="pixel-label text-[9px] text-muted-foreground tnum">
                    {a.current} / {a.total}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Sheets & modals */}
      <SettingsSheet open={showSettings} onClose={() => setShowSettings(false)} />
      <AvatarSheet open={showAvatar} onClose={() => setShowAvatar(false)} />

      <BottomSheet
        open={showAllAchievements}
        onClose={() => setShowAllAchievements(false)}
        title="Achievements"
        description={`${achievements.filter((a) => a.current >= a.total).length} of ${achievements.length} unlocked`}
      >
        <div className="flex flex-col gap-3 pb-2">
          {achievements.length === 0 ? (
            <EmptyState
              sprite="trophy"
              title="No achievements yet"
              description="Complete quests and open chests to unlock achievements."
            />
          ) : (
            achievements.map((a) => {
              const complete = a.current >= a.total
              const pctA = Math.min(100, Math.round((a.current / a.total) * 100))
              return (
                <motion.div
                  key={a.id}
                  layout
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface ${
                      complete ? 'text-foreground' : 'text-muted-foreground opacity-60'
                    }`}
                  >
                    <PixelSprite name={a.sprite} size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.subtitle}</p>
                    {!complete && (
                      <div className="mt-2">
                        <SegmentedProgress value={pctA} segments={16} />
                      </div>
                    )}
                  </div>
                  {complete ? (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </span>
                  ) : (
                    <span className="pixel-label shrink-0 text-[9px] text-muted-foreground tnum">
                      {a.current} / {a.total}
                    </span>
                  )}
                </motion.div>
              )
            })
          )}
        </div>
      </BottomSheet>

      {/* Edit name modal */}
      <Modal open={editName} onClose={() => setEditName(false)}>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-base font-medium">Edit display name</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              This is how you appear across PICO.
            </p>
          </div>
          <div>
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) saveName()
              }}
              maxLength={20}
              placeholder="Your name"
              className="w-full rounded-md border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-ring"
            />
            <p className="mt-1.5 text-[10px] text-muted-foreground tnum">{draftName.length}/20</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditName(false)}
              className="flex-1 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-surface active:scale-[0.99]"
            >
              Cancel
            </button>
            <button
              onClick={saveName}
              className="flex-1 bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.99]"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
