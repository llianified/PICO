'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BottomSheet } from '@/components/ui/overlay'
import { ActionButton } from '@/components/ui/action-button'
import { RewardOverlay } from '@/components/overlays/celebrations'
import { PixelSprite, type SpriteName } from '@/components/pixel-sprite'
import { Tag } from '@/components/primitives'
import { useGame, type InventoryItem } from '@/lib/store'
import { useToast } from '@/components/ui/toast'

const DESCRIPTIONS: Record<string, string> = {
  chest: 'A sealed treasure chest. Use a key to open it and reveal the rewards inside.',
  key: 'Unlocks treasure chests. Earn more by completing daily quests.',
  coin: 'The currency of the kingdom. Spend it on upgrades and cosmetics.',
  gem: 'Rare artifacts collected from your adventures.',
  shield: 'Badges you have earned for your achievements.',
  book: 'Your collection progress across all discoverable items.',
}

function formatCount(item: InventoryItem) {
  if (item.key === 'coin') {
    return item.count >= 1000 ? `${(item.count / 1000).toFixed(1)}K` : String(item.count)
  }
  return String(item.count)
}

export function InventoryItemSheet({
  item,
  onClose,
}: {
  item: InventoryItem | null
  onClose: () => void
}) {
  const { inventory, openChest, collectionOwned, collectionTotal } = useGame()
  const { toast } = useToast()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [reward, setReward] = useState<{ sprite: SpriteName; label: string }[] | null>(null)

  // read the live item so counts stay in sync while the sheet is open
  const live = item ? inventory.find((i) => i.key === item.key) ?? item : null
  const chestCount = inventory.find((i) => i.key === 'chest')?.count ?? 0
  const keyCount = inventory.find((i) => i.key === 'key')?.count ?? 0

  async function handleOpenChest() {
    if (chestCount <= 0) {
      toast({ title: 'No chests left', description: 'Complete quests to earn more.', variant: 'error' })
      return
    }
    if (keyCount <= 0) {
      toast({ title: 'No keys', description: 'You need a key to open a chest.', variant: 'error' })
      return
    }
    if (collectionOwned >= collectionTotal) {
      toast({ title: 'Inventory full', description: 'Your collection is complete!', variant: 'error' })
      return
    }
    setStatus('loading')
    try {
      const res = await openChest()
      setStatus('success')
      setReward(res.items)
      setTimeout(() => setStatus('idle'), 400)
    } catch {
      setStatus('error')
      toast({ title: 'Could not open chest', variant: 'error' })
      setTimeout(() => setStatus('idle'), 1200)
    }
  }

  return (
    <>
      <BottomSheet open={item !== null} onClose={onClose} title={live?.label}>
        {live && (
          <div className="flex flex-col gap-5 pb-2">
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex h-20 w-20 items-center justify-center border border-border bg-surface"
              >
                <PixelSprite name={live.sprite} size={44} />
              </motion.div>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-lg tnum">{formatCount(live)}</span>
                <Tag>{live.key === 'book' ? `OF ${collectionTotal}` : 'OWNED'}</Tag>
              </div>
              <p className="max-w-[16rem] text-sm leading-relaxed text-muted-foreground text-pretty">
                {DESCRIPTIONS[live.key]}
              </p>
            </div>

            {live.key === 'chest' ? (
              <ActionButton
                status={status}
                loadingLabel="Opening"
                successLabel="Opened"
                errorLabel="Failed"
                onClick={handleOpenChest}
                disabled={chestCount <= 0}
                className="flex w-full items-center justify-center gap-2 bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground"
              >
                Open Chest
              </ActionButton>
            ) : live.key === 'key' ? (
              <p className="text-center text-xs text-muted-foreground">
                Head to the chest to use your keys.
              </p>
            ) : (
              <button
                onClick={onClose}
                className="w-full border border-border bg-card px-5 py-3.5 text-sm font-medium transition-colors hover:border-ring active:scale-[0.99]"
              >
                Close
              </button>
            )}
          </div>
        )}
      </BottomSheet>

      <RewardOverlay
        open={reward !== null}
        onClose={() => setReward(null)}
        title="Chest Opened"
        items={reward ?? []}
      />
    </>
  )
}
