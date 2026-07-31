'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronRight, Plus } from 'lucide-react'
import { BottomSheet } from '@/components/ui/overlay'
import { ActionButton } from '@/components/ui/action-button'
import { PixelSprite } from '@/components/pixel-sprite'
import { formatRp, useGame } from '@/lib/store'
import { useToast } from '@/components/ui/toast'

const MIN_WITHDRAW = 10000
const PRESETS = [20000, 50000, 84500]

type Step = 'amount' | 'method' | 'confirm' | 'loading' | 'success'

const stepFade = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
}

export function WithdrawSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { balance, methods, withdraw, connectMethod } = useGame()
  const { toast } = useToast()

  const [step, setStep] = useState<Step>('amount')
  const [raw, setRaw] = useState('')
  const [touched, setTouched] = useState(false)
  const [methodId, setMethodId] = useState(methods.find((m) => m.connected)?.id ?? '')
  const [connectingId, setConnectingId] = useState<string | null>(null)

  const amount = Number(raw.replace(/\D/g, '')) || 0

  const error =
    amount === 0
      ? touched
        ? 'Enter an amount to withdraw.'
        : ''
      : amount < MIN_WITHDRAW
        ? `Minimum withdrawal is ${formatRp(MIN_WITHDRAW)}.`
        : amount > balance
          ? 'Insufficient balance for this amount.'
          : ''

  const amountValid = amount >= MIN_WITHDRAW && amount <= balance
  const selectedMethod = methods.find((m) => m.id === methodId)

  function reset() {
    setStep('amount')
    setRaw('')
    setTouched(false)
    setConnectingId(null)
  }

  function close() {
    onClose()
    // let the exit animation finish before resetting internal state
    setTimeout(reset, 300)
  }

  async function handleConnect(id: string) {
    setConnectingId(id)
    try {
      await connectMethod(id)
      setMethodId(id)
      toast({ title: 'Payment method connected', variant: 'success' })
    } finally {
      setConnectingId(null)
    }
  }

  async function handleConfirm() {
    setStep('loading')
    try {
      await withdraw(amount, methodId)
      setStep('success')
    } catch {
      setStep('confirm')
      toast({ title: 'Withdrawal failed', description: 'Please try again.', variant: 'error' })
    }
  }

  const title =
    step === 'success'
      ? undefined
      : step === 'method'
        ? 'Select Payment Method'
        : step === 'confirm'
          ? 'Confirm Withdrawal'
          : 'Withdraw'

  const description =
    step === 'amount'
      ? `Available balance ${formatRp(balance)}`
      : step === 'method'
        ? 'Choose where to send your funds.'
        : undefined

  return (
    <BottomSheet open={open} onClose={close} title={title} description={description}>
      <div className="pb-2">
        <AnimatePresence mode="wait">
          {/* STEP: amount */}
          {step === 'amount' && (
            <motion.div key="amount" {...stepFade} className="flex flex-col gap-5 pt-1">
              <div className="flex flex-col gap-2">
                <label htmlFor="wd-amount" className="text-xs text-muted-foreground">
                  Amount
                </label>
                <div
                  className={`flex items-center gap-2 border bg-card px-4 py-3.5 transition-colors ${
                    error ? 'border-red-500/60' : 'border-border focus-within:border-ring'
                  }`}
                >
                  <span className="font-mono text-lg text-muted-foreground">Rp</span>
                  <input
                    id="wd-amount"
                    inputMode="numeric"
                    autoFocus
                    value={amount ? amount.toLocaleString('id-ID') : ''}
                    onChange={(e) => setRaw(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="0"
                    aria-invalid={!!error}
                    className="w-full bg-transparent font-mono text-lg tabular-nums outline-none placeholder:text-muted-foreground/60"
                  />
                </div>
                {error ? (
                  <p className="text-xs text-red-400">{error}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Minimum {formatRp(MIN_WITHDRAW)}. Funds arrive instantly.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setRaw(String(p))
                      setTouched(true)
                    }}
                    disabled={p > balance}
                    className="border border-border bg-card px-2 py-2.5 font-mono text-xs tabular-nums transition-colors hover:border-ring disabled:opacity-40 active:scale-[0.98]"
                  >
                    {p === balance ? 'Max' : formatRp(p)}
                  </button>
                ))}
              </div>

              <ActionButton
                onClick={() => {
                  setTouched(true)
                  if (amountValid) setStep('method')
                }}
                disabled={!amountValid}
                className="mt-1 flex w-full items-center justify-center gap-1 bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </ActionButton>
            </motion.div>
          )}

          {/* STEP: method */}
          {step === 'method' && (
            <motion.div key="method" {...stepFade} className="flex flex-col gap-2 pt-1">
              {methods.map((m) => {
                const selected = m.id === methodId
                return (
                  <div
                    key={m.id}
                    className={`flex items-center gap-3 border bg-card p-3.5 transition-colors ${
                      selected ? 'border-ring' : 'border-border'
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center border border-border bg-surface text-muted-foreground">
                      <PixelSprite name="coin" size={16} />
                    </div>
                    <span className="flex-1 text-sm">{m.name}</span>
                    {m.connected ? (
                      <button
                        onClick={() => setMethodId(m.id)}
                        aria-label={`Select ${m.name}`}
                        className={`flex h-6 w-6 items-center justify-center border transition-colors ${
                          selected ? 'border-foreground bg-foreground text-primary-foreground' : 'border-border'
                        }`}
                      >
                        {selected && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ) : (
                      <ActionButton
                        status={connectingId === m.id ? 'loading' : 'idle'}
                        onClick={() => handleConnect(m.id)}
                        className="flex items-center gap-1 border border-border px-2.5 py-1.5 text-xs text-foreground hover:border-ring"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Connect
                      </ActionButton>
                    )}
                  </div>
                )
              })}

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setStep('amount')}
                  className="flex-1 border border-border bg-card px-5 py-3.5 text-sm font-medium transition-colors hover:border-ring active:scale-[0.99]"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!selectedMethod?.connected}
                  className="flex flex-[1.4] items-center justify-center gap-1 bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground transition-transform disabled:opacity-50 active:scale-[0.99]"
                >
                  Review
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP: confirm */}
          {step === 'confirm' && (
            <motion.div key="confirm" {...stepFade} className="flex flex-col gap-4 pt-1">
              <div className="flex flex-col divide-y divide-border border border-border bg-card px-4">
                <Row label="Amount" value={formatRp(amount)} />
                <Row label="Method" value={selectedMethod?.name ?? '\u2014'} />
                <Row label="Fee" value="Rp0" />
                <Row label="You receive" value={formatRp(amount)} strong />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                By confirming, {formatRp(amount)} will be sent to your {selectedMethod?.name}{' '}
                account. This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('method')}
                  className="flex-1 border border-border bg-card px-5 py-3.5 text-sm font-medium transition-colors hover:border-ring active:scale-[0.99]"
                >
                  Back
                </button>
                <ActionButton
                  onClick={handleConfirm}
                  className="flex flex-[1.4] items-center justify-center gap-1 bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground"
                >
                  Confirm
                </ActionButton>
              </div>
            </motion.div>
          )}

          {/* STEP: loading */}
          {step === 'loading' && (
            <motion.div
              key="loading"
              {...stepFade}
              className="flex flex-col items-center gap-4 py-14 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="h-10 w-10 rounded-full border-2 border-border border-t-foreground"
              />
              <div>
                <p className="text-sm font-medium">Processing withdrawal</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sending {formatRp(amount)} to {selectedMethod?.name}
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP: success */}
          {step === 'success' && (
            <motion.div
              key="success"
              {...stepFade}
              className="flex flex-col items-center gap-4 py-10 text-center"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex h-16 w-16 items-center justify-center border border-border bg-surface"
              >
                <Check className="h-8 w-8" />
              </motion.div>
              <div>
                <p className="text-lg font-medium tracking-tight">Withdrawal Sent</p>
                <p className="mt-1 text-sm text-muted-foreground text-pretty">
                  {formatRp(amount)} is on its way to {selectedMethod?.name}.
                </p>
              </div>
              <div className="flex w-full flex-col divide-y divide-border border border-border bg-card px-4">
                <Row label="Amount" value={formatRp(amount)} />
                <Row label="Status" value="Completed" />
              </div>
              <button
                onClick={close}
                className="mt-1 w-full bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.99]"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BottomSheet>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`font-mono text-sm tabular-nums ${strong ? 'font-medium' : ''}`}>
        {value}
      </span>
    </div>
  )
}
