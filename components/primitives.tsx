import { Signal, Wifi, BatteryFull } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Segmented progress bar — small blocks that fill left-to-right.
 * Matches the design system's "pixel" progress aesthetic.
 */
export function SegmentedProgress({
  value,
  segments = 20,
  className,
}: {
  value: number // 0 - 100
  segments?: number
  className?: string
}) {
  const filled = Math.round((value / 100) * segments)
  return (
    <div className={cn('flex items-center gap-[3px]', className)}>
      {Array.from({ length: segments }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-2 flex-1 rounded-[1px]',
            i < filled ? 'bg-foreground' : 'bg-border',
          )}
        />
      ))}
    </div>
  )
}

/** Thin solid progress bar. */
export function Progress({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-border', className)}>
      <div
        className="h-full rounded-full bg-foreground transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

/** iOS-style status bar. */
export function StatusBar() {
  return (
    <div className="flex h-11 items-center justify-between px-6 text-foreground">
      <span className="font-mono text-sm font-medium tracking-tight tnum">9:41</span>
      <div className="flex items-center gap-1.5">
        <Signal className="h-4 w-4" />
        <Wifi className="h-4 w-4" />
        <BatteryFull className="h-5 w-5" />
      </div>
    </div>
  )
}

/** A monospaced "tag" chip used for LEVEL / badge type labels. */
export function Tag({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[4px] border border-border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}
