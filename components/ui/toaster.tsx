'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Check, Info, X } from 'lucide-react'
import { useStore } from '@/lib/store'

export function Toaster() {
  const { toasts, dismissToast } = useStore()
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="pointer-events-auto flex w-full max-w-[22rem] items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-2xl"
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                t.variant === 'success'
                  ? 'bg-foreground text-background'
                  : t.variant === 'error'
                    ? 'bg-destructive/20 text-destructive'
                    : 'border border-border text-muted-foreground'
              }`}
            >
              {t.variant === 'success' && <Check className="h-3 w-3" />}
              {t.variant === 'error' && <X className="h-3 w-3" />}
              {t.variant === 'info' && <Info className="h-3 w-3" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs text-muted-foreground text-pretty">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss"
              className="-mr-1 -mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
