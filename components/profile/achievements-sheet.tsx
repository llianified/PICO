'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Check, Trophy } from 'lucide-react'
import { BottomSheet } from '@/components/ui/sheet'
import { ActionButton } from '@/components/ui/action-button'
import { SegmentedProgress } from '@/components/primitives'
import { PixelSprite } from '@/components/pixel-sprite'
import { useStore } from '@/lib/store'
import { formatCompact, type Achievement } from '@/lib/mock-data'

export function AchievementsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { achievements } = useStore()
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Achievements"
      description={`${unlockedCount} of ${achievements.length} unlocked`}
    >
      {achievements.length === 0 ? (
        <EmptyAchievements />
      ) : (
        <div className="flex flex-col gap-3 pb-2">
          <AnimatePresence initial={false}>
            {achievements.map((a) => (
              <AchievementRow key={a.id} achievement={a} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </BottomSheet>
  )
}

function AchievementRow({ achievement: a }: { achievement: Achievement }) {
  const { claimAchievement, toast } = useStore()
  const pct = Math.min(100, Math.round((a.current / a.total) * 100))
  const canClaim = a.unlocked && !a.claimed

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface transition-opacity ${
            a.unlocked ? 'opacity-100' : 'opacity-40'
          }`}
        >
          <PixelSprite name="trophy" size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{a.title}</p>
          <p className="truncate text-xs text-muted-foreground">{a.subtitle}</p>
        </div>
        {a.claimed ? (
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
            <Check className="h-3.5 w-3.5" />
            Claimed
          </span>
        ) : canClaim ? (
          <ActionButton
            onAction={async () => {
              await claimAchievement(a.id)
              toast({ title: `${a.title} claimed`, variant: 'success' })
            }}
            variant="primary"
            loadingText="Claiming"
            successText="Claimed"
            className="h-8 shrink-0 px-3 py-0 text-xs"
          >
            Claim
          </ActionButton>
        ) : (
          <span className="pixel-label shrink-0 text-[9px] text-muted-foreground tnum">
            {formatCompact(a.current)} / {formatCompact(a.total)}
          </span>
        )}
      </div>
      {!a.unlocked && <SegmentedProgress value={pct} segments={16} />}
    </motion.div>
  )
}

function EmptyAchievements() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-4 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
        <Trophy className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium">No achievements yet</p>
        <p className="mt-1 text-xs text-muted-foreground text-pretty">
          Complete quests to start unlocking achievements.
        </p>
      </div>
    </div>
  )
}
