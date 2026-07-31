'use client'

import { motion } from 'framer-motion'
import { Modal } from '@/components/ui/overlay'
import { PixelSprite, type SpriteName } from '@/components/pixel-sprite'
import { Tag } from '@/components/primitives'
import { useGame } from '@/lib/store'

const EASE = [0.22, 1, 0.36, 1] as const

/* Subtle pixel particle burst — small squares fanning outward. */
function PixelBurst() {
  const pieces = Array.from({ length: 12 })
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {pieces.map((_, i) => {
        const angle = (i / pieces.length) * Math.PI * 2
        const dist = 70 + (i % 3) * 22
        return (
          <motion.span
            key={i}
            className="absolute h-1.5 w-1.5 bg-foreground"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              opacity: 0,
              scale: 0.4,
            }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.05 }}
          />
        )
      })}
    </div>
  )
}

function IconBadge({ sprite, size = 40 }: { sprite: SpriteName; size?: number }) {
  return (
    <motion.div
      initial={{ scale: 0.4, rotate: -8, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE, delay: 0.08 }}
      className="relative flex h-20 w-20 items-center justify-center border border-border bg-surface"
    >
      <PixelSprite name={sprite} size={size} />
    </motion.div>
  )
}

/* ---- Level up (driven by store) ---- */
export function LevelUpOverlay() {
  const { levelUpTo, clearLevelUp } = useGame()
  return (
    <Modal open={levelUpTo !== null} onClose={clearLevelUp} className="text-center">
      <div className="relative flex flex-col items-center gap-4">
        <PixelBurst />
        <IconBadge sprite="star" />
        <span className="pixel-label text-[10px] text-muted-foreground">Level Up</span>
        <p className="font-mono text-4xl font-medium tnum">{levelUpTo}</p>
        <p className="text-sm text-muted-foreground text-pretty">
          You reached a new level. New quests await, Explorer.
        </p>
        <button
          onClick={clearLevelUp}
          className="mt-2 w-full bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.99]"
        >
          Continue
        </button>
      </div>
    </Modal>
  )
}

/* ---- Achievement unlocked (driven by store) ---- */
export function AchievementOverlay() {
  const { achievementUnlocked, clearAchievement } = useGame()
  return (
    <Modal
      open={achievementUnlocked !== null}
      onClose={clearAchievement}
      className="text-center"
    >
      <div className="relative flex flex-col items-center gap-4">
        <PixelBurst />
        <IconBadge sprite={achievementUnlocked?.sprite ?? 'shield'} />
        <span className="pixel-label text-[10px] text-muted-foreground">
          Achievement Unlocked
        </span>
        <p className="text-2xl font-medium tracking-tight text-balance">
          {achievementUnlocked?.title}
        </p>
        <p className="text-sm text-muted-foreground text-pretty">
          {achievementUnlocked?.subtitle}
        </p>
        <button
          onClick={clearAchievement}
          className="mt-2 w-full bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.99]"
        >
          Claim
        </button>
      </div>
    </Modal>
  )
}

/* ---- Reusable reward modal (controlled) ---- */
export function RewardOverlay({
  open,
  onClose,
  title = 'Reward Claimed',
  items,
}: {
  open: boolean
  onClose: () => void
  title?: string
  items: { sprite: SpriteName; label: string }[]
}) {
  return (
    <Modal open={open} onClose={onClose} className="text-center">
      <div className="relative flex flex-col items-center gap-4">
        <PixelBurst />
        <IconBadge sprite={items[0]?.sprite ?? 'chest'} size={44} />
        <span className="pixel-label text-[10px] text-muted-foreground">{title}</span>
        <div className="mt-1 flex w-full flex-col gap-2">
          {items.map((it, i) => (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.3, ease: EASE }}
              className="flex items-center gap-3 border border-border bg-surface p-3"
            >
              <PixelSprite name={it.sprite} size={18} />
              <span className="font-mono text-sm font-medium tnum">{it.label}</span>
              <Tag className="ml-auto">NEW</Tag>
            </motion.div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-2 w-full bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.99]"
        >
          Collect
        </button>
      </div>
    </Modal>
  )
}
