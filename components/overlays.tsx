'use client'

import { motion } from 'motion/react'
import { ChevronRight, Sparkles } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { PixelSprite, type SpriteName } from '@/components/pixel-sprite'
import { useStore } from '@/lib/store'

export function GlobalOverlays() {
  const { levelUp, clearLevelUp, rewardEvent, clearReward, level } = useStore()

  return (
    <>
      {/* Level Up */}
      <Modal open={!!levelUp} onClose={clearLevelUp}>
        <div className="flex flex-col items-center gap-5 text-center">
          <motion.div
            initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 340, damping: 16, delay: 0.05 }}
            className="relative flex h-20 w-20 items-center justify-center rounded-xl border border-border bg-surface"
          >
            <PixelSprite name="star" size={40} />
            <motion.span
              className="absolute -right-2 -top-2 text-foreground"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.35, type: 'spring', stiffness: 400, damping: 14 }}
            >
              <Sparkles className="h-5 w-5" />
            </motion.span>
          </motion.div>
          <div>
            <p className="pixel-label text-[10px] text-muted-foreground">Level Up</p>
            <p className="mt-2 font-mono text-4xl font-medium tnum">{levelUp?.level ?? level}</p>
            <p className="mt-2 text-sm text-muted-foreground text-pretty">
              You reached a new level. New quests await.
            </p>
          </div>
          <button
            onClick={clearLevelUp}
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-5 py-3.5 text-[15px] font-medium text-primary-foreground transition-transform duration-100 active:scale-[0.99]"
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </Modal>

      {/* Reward claimed */}
      <Modal open={!!rewardEvent} onClose={clearReward}>
        <div className="flex flex-col items-center gap-5 text-center">
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 340, damping: 16 }}
            className="flex h-20 w-20 items-center justify-center rounded-xl border border-border bg-surface"
          >
            <PixelSprite name="chest" size={40} />
          </motion.div>
          <div>
            <p className="pixel-label text-[10px] text-muted-foreground">Reward</p>
            <p className="mt-2 text-xl font-medium tracking-tight">{rewardEvent?.title}</p>
          </div>
          <div className="flex w-full flex-col gap-2">
            {rewardEvent?.items.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1 }}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
              >
                <PixelSprite name={item.sprite as SpriteName} size={20} />
                <span className="font-mono text-sm font-medium tnum">{item.label}</span>
              </motion.div>
            ))}
          </div>
          <button
            onClick={clearReward}
            className="flex w-full items-center justify-center rounded-lg bg-primary px-5 py-3.5 text-[15px] font-medium text-primary-foreground transition-transform duration-100 active:scale-[0.99]"
          >
            Collect
          </button>
        </div>
      </Modal>
    </>
  )
}
