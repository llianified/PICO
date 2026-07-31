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
        'pixel-label inline-flex items-center rounded-[4px] border border-border px-2 py-1 text-[9px] text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}
