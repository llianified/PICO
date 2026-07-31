'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { SegmentedProgress } from '@/components/primitives'
import { PixelSprite } from '@/components/pixel-sprite'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { InventoryItemSheet } from '@/components/sheets/inventory-item-sheet'
import { useGame, type InventoryItem } from '@/lib/store'

function displayValue(item: InventoryItem, owned: number, total: number) {
  if (item.key === 'book') return `${owned} / ${total}`
  if (item.key === 'coin') {
    return item.count >= 1000 ? `${(item.count / 1000).toFixed(1)}K` : String(item.count)
  }
  return String(item.count)
}

export function InventoryScreen() {
  const { inventory, unlocks, collectionOwned, collectionTotal } = useGame()
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<InventoryItem | null>(null)
  const [showAllUnlocks, setShowAllUnlocks] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650)
    return () => clearTimeout(t)
  }, [])

  const pct = Math.round((collectionOwned / collectionTotal) * 100)
  const visibleUnlocks = showAllUnlocks ? unlocks : unlocks.slice(0, 3)

  return (
    <div className="flex flex-col gap-8 px-6 pb-6 pt-2">
      <header>
        <h1 className="text-3xl font-medium tracking-tight">Inventory</h1>
      </header>

      {/* Collection progress */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PixelSprite name="star" size={16} />
            <span className="text-sm">Collection Progress</span>
          </div>
          <motion.span
            key={pct}
            initial={{ scale: 1.2, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="font-mono text-sm font-medium tnum"
          >
            {pct}%
          </motion.span>
        </div>
        <SegmentedProgress value={pct} segments={20} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : inventory.map((item) => (
              <button
                key={item.key}
                onClick={() => setSelected(item)}
                className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 text-left transition-all duration-100 hover:border-ring active:scale-[0.98]"
              >
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <div className="flex items-end justify-between gap-2">
                  <PixelSprite name={item.sprite} size={28} className="shrink-0" />
                  <motion.span
                    key={item.count}
                    initial={{ y: -4, opacity: 0.5 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="font-pixel whitespace-nowrap text-base tnum"
                  >
                    {displayValue(item, collectionOwned, collectionTotal)}
                  </motion.span>
                </div>
              </button>
            ))}
      </div>

      {/* Recent unlocks */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Recent Unlocks</h2>
          {unlocks.length > 3 && (
            <button
              onClick={() => setShowAllUnlocks((v) => !v)}
              className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {showAllUnlocks ? 'Show less' : 'View all'} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {unlocks.length === 0 ? (
          <EmptyState
            sprite="gem"
            title="No unlocks yet"
            description="Open chests and complete quests to unlock new items and badges."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {visibleUnlocks.map((u) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface">
                  <PixelSprite name={u.sprite} size={22} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{u.title}</p>
                  <p className="pixel-label mt-1.5 text-[9px] text-muted-foreground">{u.meta}</p>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">{u.time}</span>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <InventoryItemSheet item={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
