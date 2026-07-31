import { cn } from '@/lib/utils'

/** Base shimmer block. Internal — compose one of the exported presets below. */
function Skeleton({ className }: { className?: string }) {
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
