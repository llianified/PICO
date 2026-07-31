'use client'

import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'loading' | 'success' | 'error'

/** Themed on/off switch used across settings. */
export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'border-foreground bg-foreground' : 'border-border bg-surface',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={cn(
          'inline-block h-4 w-4 rounded-full',
          checked ? 'ml-auto mr-1 bg-background' : 'ml-1 bg-muted-foreground',
        )}
      />
    </button>
  )
}

const variantClasses: Record<'primary' | 'destructive', string> = {
  primary:
    'rounded-lg bg-primary px-5 py-3.5 text-[15px] font-medium text-primary-foreground',
  destructive:
    'rounded-lg border border-destructive/60 bg-surface px-5 py-3.5 text-[15px] font-medium text-destructive',
}

export function ActionButton({
  children,
  onAction,
  onClick,
  variant,
  className,
  disabled,
  loadingText,
  successText = 'Done',
  errorText = 'Try again',
  resetDelay = 1400,
  icon,
  type = 'button',
}: {
  children: React.ReactNode
  onAction?: () => void | Promise<unknown>
  /** Alias for onAction; runs through the same loading/success/error lifecycle. */
  onClick?: () => void | Promise<unknown>
  variant?: 'primary' | 'destructive'
  className?: string
  disabled?: boolean
  loadingText?: string
  successText?: string
  errorText?: string
  resetDelay?: number
  icon?: React.ReactNode
  type?: 'button' | 'submit'
}) {
  const [status, setStatus] = useState<Status>('idle')
  const busy = status === 'loading'
  const handler = onAction ?? onClick

  const run = useCallback(async () => {
    if (busy || disabled) return
    try {
      setStatus('loading')
      await handler?.()
      setStatus('success')
      setTimeout(() => setStatus('idle'), resetDelay)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), resetDelay)
    }
  }, [busy, disabled, handler, resetDelay])

  return (
    <button
      type={type}
      onClick={type === 'submit' ? undefined : run}
      disabled={disabled || busy}
      aria-busy={busy}
      className={cn(
        'group relative inline-flex items-center justify-center gap-1.5 overflow-hidden transition-all duration-150 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50',
        variant && variantClasses[variant],
        status === 'error' && 'ring-2 ring-destructive/50',
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={status}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16 }}
          className="inline-flex items-center gap-1.5"
        >
          {status === 'loading' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {loadingText ?? 'Please wait'}
            </>
          )}
          {status === 'success' && (
            <>
              <Check className="h-4 w-4" />
              {successText}
            </>
          )}
          {status === 'error' && (
            <>
              <X className="h-4 w-4" />
              {errorText}
            </>
          )}
          {status === 'idle' && (
            <>
              {children}
              {icon}
            </>
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
