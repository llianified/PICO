import type { ReactNode } from 'react'
import { PixelSprite, type SpriteName } from '@/components/pixel-sprite'

export function EmptyState({
  sprite = 'flag',
  title,
  description,
  action,
}: {
  sprite?: SpriteName
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 border border-dashed border-border bg-card/40 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
        <PixelSprite name={sprite} size={22} />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mx-auto mt-1 max-w-[15rem] text-xs leading-relaxed text-muted-foreground text-pretty">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}
