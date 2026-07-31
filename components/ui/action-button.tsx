'use client'

import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function ActionButton({
  children,
  onAction,
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
  const mounted = useRef(true)

  const run = useCallback(async () => {
    if (busy || disabled) return
    try {
      setStatus('loading')
      await onAction?.()
      setStatus('success')
      setTimeout(() => setStatus('idle'), resetDelay)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), resetDelay)
    }
  }, [busy, disabled, onAction, resetDelay])

  return (
    <button
      type={type}
      onClick={type === 'submit' ? undefined : run}
      disabled={disabled || busy}
      aria-busy={busy}
      className={cn(
        'group relative inline-flex items-center justify-center gap-1.5 overflow-hidden transition-all duration-150 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50',
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
