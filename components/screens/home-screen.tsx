import Image from 'next/image'
import { ChevronRight, Flame, Zap } from 'lucide-react'
import { SegmentedProgress } from '@/components/primitives'
import { PixelSprite, type SpriteName } from '@/components/pixel-sprite'

const rewards: {
  sprite: SpriteName
  title: string
  subtitle: string
  xp: string
  time: string
}[] = [
  { sprite: 'trophy', title: 'Quest Completed', subtitle: 'Daily Check-in', xp: '+100 XP', time: '2m ago' },
  { sprite: 'shield', title: 'New Badge', subtitle: 'First Steps', xp: '+100 XP', time: '2m ago' },
  { sprite: 'star', title: 'XP Earned', subtitle: 'Daily Quest', xp: '+250 XP', time: '10m ago' },
]

export function HomeScreen() {
  return (
    <div className="flex flex-col gap-8 px-6 pb-6 pt-2">
      {/* Greeting */}
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Good Evening,</p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Explorer</h1>
        </div>
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-border bg-card">
          <Image
            src="/pixel/avatar.png"
            alt="Your avatar"
            width={40}
            height={40}
            className="pixelated h-9 w-9 object-contain"
          />
        </div>
      </header>

      {/* Level / XP */}
      <section className="flex flex-col gap-3">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Level 12
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-4xl font-semibold tracking-tight tnum">142,550</span>
          <span className="font-mono text-sm text-muted-foreground">XP</span>
        </div>
        <SegmentedProgress value={35} segments={24} />
        <div className="flex justify-between font-mono text-xs text-muted-foreground tnum">
          <span>70,000</span>
          <span>200,000</span>
        </div>
      </section>

      {/* Continue */}
      <button className="group flex items-center justify-between rounded-lg bg-primary px-5 py-4 text-primary-foreground transition-transform duration-100 active:scale-[0.99]">
        <span className="text-[15px] font-medium">Continue Adventure</span>
        <ChevronRight className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5" />
      </button>

      {/* Streak + Energy */}
      <section className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flame className="h-4 w-4" />
            <span className="text-xs">Daily Streak</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-semibold tnum">12</span>
            <span className="text-xs text-muted-foreground">days</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span className="text-xs">Energy</span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-3xl font-semibold tnum">24</span>
              <span className="font-mono text-sm text-muted-foreground">/ 30</span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">+1 in 05:30</p>
          </div>
        </div>
      </section>

      {/* Recent Rewards */}
      <section className="flex flex-col gap-1">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium">Recent Rewards</h2>
          <button className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {rewards.map((r) => (
            <div key={r.title} className="flex items-center gap-3 py-3">
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
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
