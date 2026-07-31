'use client'

import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type ActionStatus = 'idle' | 'loading' | 'success' | 'error'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin', className)} aria-hidden="true" />
}

/**
 * A button that visually reflects async lifecycle states while preserving the
 * exact className / layout it is given for the idle state.
 */
export function ActionButton({
  status = 'idle',
  loadingLabel,
  successLabel,
  errorLabel,
  children,
  className,
  disabled,
  ...props
}: {
  status?: ActionStatus
  loadingLabel?: string
  successLabel?: string
  errorLabel?: string
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  const busy = status === 'loading'
  return (
    <button
      data-status={status}
      disabled={disabled || busy}
      aria-busy={busy}
      className={cn(
        'transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]',
        className,
      )}
      {...props}
    >
      {status === 'idle' ? (
        children
      ) : (
        <span className="flex w-full items-center justify-center gap-2">
          <AnimatePresence mode="wait" initial={false}>
            {status === 'loading' && (
              <motion.span
                key="loading"
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Spinner />
                {loadingLabel}
              </motion.span>
            )}
            {status === 'success' && (
              <motion.span
                key="success"
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <Check className="h-5 w-5" />
                {successLabel}
              </motion.span>
            )}
            {status === 'error' && (
              <motion.span
                key="error"
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, x: [0, -4, 4, -2, 2, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AlertCircle className="h-5 w-5" />
                {errorLabel}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      )}
    </button>
  )
}
