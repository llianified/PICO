'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, Check, ChevronRight, Loader2, Plus } from 'lucide-react'
import { BottomSheet } from '@/components/ui/sheet'
import { PixelSprite } from '@/components/pixel-sprite'
import { formatRp } from '@/lib/mock-data'
import { useStore } from '@/lib/store'

const MIN_WITHDRAW = 10000
const QUICK = [10000, 25000, 50000]

type Step = 'form' | 'confirm' | 'success'

export function WithdrawSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { balance, paymentMethods, withdraw, toast } = useStore()
  const connected = paymentMethods.filter((m) => m.connected)

  const [step, setStep] = useState<Step>('form')
  const [amount, setAmount] = useState('')
  const [methodId, setMethodId] = useState(connected[0]?.id ?? '')
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const numeric = Number(amount.replace(/\D/g, ''))
  const method = paymentMethods.find((m) => m.id === methodId)

  const error = useMemo(() => {
    if (!amount) return 'Enter an amount to withdraw.'
    if (Number.isNaN(numeric) || numeric <= 0) return 'Please enter a valid amount.'
    if (numeric < MIN_WITHDRAW) return `Minimum withdrawal is ${formatRp(MIN_WITHDRAW)}.`
    if (numeric > balance) return 'Insufficient balance for this amount.'
    if (!methodId) return 'Select a payment method.'
    return null
  }, [amount, numeric, balance, methodId])

  function reset() {
    setStep('form')
    setAmount('')
    setTouched(false)
    setSubmitting(false)
    setServerError(null)
    setMethodId(connected[0]?.id ?? '')
  }

  function handleClose() {
    onClose()
    // let the sheet animate out before resetting
    setTimeout(reset, 250)
  }

  async function confirmWithdraw() {
    setSubmitting(true)
    setServerError(null)
    try {
      await withdraw(numeric, methodId)
      setStep('success')
      toast({
        title: 'Withdrawal successful',
        description: `${formatRp(numeric)} sent to ${method?.name}.`,
        variant: 'success',
      })
    } catch {
      setServerError('Network error. Please try again.')
      toast({ title: 'Withdrawal failed', description: 'Please try again.', variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const title = step === 'success' ? undefined : step === 'confirm' ? 'Confirm Withdrawal' : 'Withdraw'

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title={title}
      description={step === 'form' ? `Available balance ${formatRp(balance)}` : undefined}
      dismissible={!submitting}
    >
      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-6 pb-2"
          >
            {/* Amount */}
            <div className="flex flex-col gap-2">
              <label htmlFor="wd-amount" className="text-xs text-muted-foreground">
                Amount
              </label>
              <div
                className={`flex items-center gap-2 rounded-lg border bg-card px-4 py-3.5 transition-colors ${
                  touched && error && (error.includes('amount') || error.includes('balance') || error.includes('Minimum'))
                    ? 'border-destructive'
                    : 'border-border focus-within:border-ring'
                }`}
              >
                <span className="font-mono text-lg text-muted-foreground">Rp</span>
                <input
                  id="wd-amount"
                  inputMode="numeric"
                  autoFocus
                  value={amount ? Number(amount.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
                  onChange={(e) => {
                    setAmount(e.target.value.replace(/\D/g, ''))
                    setTouched(true)
                  }}
                  placeholder="0"
                  className="w-full bg-transparent font-mono text-lg tracking-tight outline-none tnum placeholder:text-muted-foreground/50"
                  aria-invalid={touched && !!error}
                />
              </div>
              <div className="flex gap-2">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setAmount(String(q))
                      setTouched(true)
                    }}
                    disabled={q > balance}
                    className="flex-1 rounded-md border border-border bg-card py-2 font-mono text-xs transition-colors hover:border-ring disabled:opacity-40 tnum"
                  >
                    {formatRp(q)}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setAmount(String(balance))
                    setTouched(true)
                  }}
                  className="flex-1 rounded-md border border-border bg-card py-2 font-mono text-xs transition-colors hover:border-ring tnum"
                >
                  Max
                </button>
              </div>
              <AnimatePresence>
                {touched && error ? (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-1.5 text-xs text-destructive"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    {error}
                  </motion.p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Minimum {formatRp(MIN_WITHDRAW)}. No fees on withdrawals.
                  </p>
                )}
              </AnimatePresence>
            </div>

            {/* Payment method */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">Payment method</span>
              {connected.length === 0 ? (
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
                  <Plus className="h-4 w-4" />
                  Connect a payment method first.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {connected.map((m) => {
                    const selected = m.id === methodId
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMethodId(m.id)}
                        className={`flex items-center gap-3 rounded-lg border bg-card p-3.5 text-left transition-colors ${
                          selected ? 'border-foreground' : 'border-border hover:border-ring'
                        }`}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
                          <PixelSprite name="coin" size={16} />
                        </div>
                        <span className="min-w-0 flex-1 truncate text-sm">{m.name}</span>
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selected ? 'border-foreground bg-foreground text-background' : 'border-border'
                          }`}
                        >
                          {selected && <Check className="h-3 w-3" />}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setTouched(true)
                if (!error) setStep('confirm')
              }}
              disabled={!!error}
              className="group mt-2 flex items-center justify-center gap-1 rounded-lg bg-primary px-5 py-4 text-[15px] font-medium text-primary-foreground transition-all duration-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
              <ChevronRight className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </button>
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-6 pb-2"
          >
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <span className="overline text-[10px] text-muted-foreground">You will withdraw</span>
              <span className="font-mono text-4xl font-medium tracking-tight tnum">{formatRp(numeric)}</span>
            </div>

            <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card px-4">
              <div className="flex items-center justify-between py-3.5 text-sm">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium">{method?.name}</span>
              </div>
              <div className="flex items-center justify-between py-3.5 text-sm">
                <span className="text-muted-foreground">Fee</span>
                <span className="font-mono tnum">{formatRp(0)}</span>
              </div>
              <div className="flex items-center justify-between py-3.5 text-sm">
                <span className="text-muted-foreground">Remaining balance</span>
                <span className="font-mono tnum">{formatRp(balance - numeric)}</span>
              </div>
            </div>

            {serverError && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                {serverError}
              </p>
            )}

            <div className="mt-2 flex flex-col gap-2">
              <button
                onClick={confirmWithdraw}
                disabled={submitting}
                aria-busy={submitting}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-4 text-[15px] font-medium text-primary-foreground transition-all duration-100 active:scale-[0.99] disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>Confirm Withdrawal</>
                )}
              </button>
              <button
                onClick={() => setStep('form')}
                disabled={submitting}
                className="rounded-lg px-5 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                Back to edit
              </button>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-5 py-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 360, damping: 18 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-background"
            >
              <Check className="h-8 w-8" strokeWidth={2.5} />
            </motion.div>
            <div>
              <h3 className="text-xl font-medium tracking-tight">Withdrawal Sent</h3>
              <p className="mt-2 text-sm text-muted-foreground text-pretty">
                {formatRp(numeric)} is on its way to {method?.name}. It usually arrives within minutes.
              </p>
            </div>
            <div className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
              <span className="text-sm text-muted-foreground">New balance</span>
              <span className="font-mono text-sm font-medium tnum">{formatRp(balance)}</span>
            </div>
            <button
              onClick={handleClose}
              className="flex w-full items-center justify-center rounded-lg bg-primary px-5 py-4 text-[15px] font-medium text-primary-foreground transition-transform duration-100 active:scale-[0.99]"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </BottomSheet>
  )
}
