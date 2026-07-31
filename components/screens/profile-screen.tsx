import Image from 'next/image'
import { ChevronRight, Settings } from 'lucide-react'
import { SegmentedProgress } from '@/components/primitives'
import { PixelSprite } from '@/components/pixel-sprite'

const stats = [
  { label: 'Quests Completed', value: '128' },
  { label: 'Days Active', value: '18' },
  { label: 'Badges', value: '24' },
]

const achievements = [
  { title: 'First Steps', subtitle: 'Complete your first quest', progress: '1 / 1' },
  { title: 'Dedicated', subtitle: 'Complete 10 daily quests', progress: '10 / 10' },
  { title: 'Adventurer', subtitle: 'Complete 50 quests', progress: '28 / 50' },
]

export function ProfileScreen() {
  return (
    <div className="flex flex-col gap-8 px-6 pb-6 pt-2">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-medium tracking-tight">Profile</h1>
        <Settings className="h-5 w-5 text-muted-foreground" />
      </header>

      {/* Identity */}
      <section className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
          <Image
            src="/pixel/avatar.png"
            alt="Your avatar"
            width={52}
            height={52}
            className="pixelated h-12 w-12 object-contain"
          />
        </div>
        <div className="flex-1">
          <span className="pixel-label text-[9px] text-muted-foreground">Level 12</span>
          <p className="mt-1 text-xl font-medium tracking-tight">Explorer</p>
          <div className="mt-2.5">
            <SegmentedProgress value={35} segments={20} />
            <p className="pixel-label mt-2 text-[8px] text-muted-foreground tnum">
              70,000 / 200,000 XP
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
            <span className="font-mono text-2xl font-medium tnum">{s.value}</span>
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
          <button className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {achievements.map((a) => (
            <div
              key={a.title}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface">
                <PixelSprite name="trophy" size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.subtitle}</p>
              </div>
              <span className="pixel-label text-[8px] text-muted-foreground tnum">{a.progress}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
