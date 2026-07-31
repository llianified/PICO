import { ChevronRight } from 'lucide-react'
import { SegmentedProgress } from '@/components/primitives'
import { PixelSprite, type SpriteName } from '@/components/pixel-sprite'

const items: { label: string; value: string; sprite: SpriteName }[] = [
  { label: 'Treasure Chest', value: '3', sprite: 'chest' },
  { label: 'Keys', value: '7', sprite: 'key' },
  { label: 'Coins', value: '12.4K', sprite: 'coin' },
  { label: 'Artifacts', value: '11', sprite: 'gem' },
  { label: 'Badges', value: '24', sprite: 'shield' },
  { label: 'Collections', value: '15 / 48', sprite: 'book' },
]

export function InventoryScreen() {
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
          <span className="font-mono text-sm font-medium tnum">45%</span>
        </div>
        <SegmentedProgress value={45} segments={20} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4"
          >
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <div className="flex items-end justify-between gap-2">
              <PixelSprite name={item.sprite} size={28} className="shrink-0" />
              <span className="font-pixel whitespace-nowrap text-base tnum">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent unlocks */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Recent Unlocks</h2>
          <button className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface">
            <PixelSprite name="shield" size={22} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Explorer&apos;s Hat</p>
            <p className="pixel-label mt-1 text-[8px] text-muted-foreground">Common · Head</p>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">2h ago</span>
        </div>
      </section>
    </div>
  )
}
