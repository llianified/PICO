import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} aria-hidden="true" />
}

/** A skeleton row mirroring a list item (icon + two lines + trailing value). */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-2.5 w-1/4" />
      </div>
      <Skeleton className="h-3 w-12" />
    </div>
  )
}

/** A skeleton card mirroring the bordered card blocks. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-4 rounded-lg border border-border bg-card p-4', className)}>
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-7 w-2/3" />
    </div>
  )
}
