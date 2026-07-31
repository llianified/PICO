'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, CreditCard } from 'lucide-react'
import { PixelSprite } from '@/components/pixel-sprite'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { SkeletonList } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { WithdrawSheet } from '@/components/sheets/withdraw-sheet'
import { PaymentMethodSheet } from '@/components/sheets/payment-method-sheet'
import { formatRp, useGame } from '@/lib/store'
import { useToast } from '@/components/ui/toast'

export function WalletScreen() {
  const { balance, totalEarned, methods, transactions } = useGame()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [methodsOpen, setMethodsOpen] = useState(false)
  const [showAllTx, setShowAllTx] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650)
    return () => clearTimeout(t)
  }, [])

  const visibleTx = showAllTx ? transactions : transactions.slice(0, 3)

  return (
    <div className="flex flex-col gap-8 px-6 pb-6 pt-2">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-medium tracking-tight">Wallet</h1>
        <CreditCard className="h-5 w-5 text-muted-foreground" />
      </header>

      {/* Balance */}
      <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-4 py-8 text-center">
        <span className="overline text-[10px] text-muted-foreground">Withdrawable Balance</span>
        <span className="font-mono text-4xl font-medium tracking-tight tnum">
          Rp<AnimatedNumber value={balance} format={(n) => Math.round(n).toLocaleString('id-ID')} />
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          Total Earned: {formatRp(totalEarned)}
        </span>
      </div>

      {/* Withdraw */}
      <button
        onClick={() => {
          if (balance <= 0) {
            toast({
              title: 'Nothing to withdraw',
              description: 'Complete quests to earn rewards first.',
              variant: 'error',
            })
            return
          }
          setWithdrawOpen(true)
        }}
        className="group flex items-center justify-between rounded-lg bg-primary px-5 py-4 text-primary-foreground transition-transform duration-100 hover:opacity-95 active:scale-[0.99]"
      >
        <span className="text-[15px] font-medium">Withdraw</span>
        <ChevronRight className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5" />
      </button>

      {/* Payment methods */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Payment Methods</h2>
          <button
            onClick={() => setMethodsOpen(true)}
            className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Manage <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card px-4">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethodsOpen(true)}
              className="flex items-center gap-3 py-3.5 text-left transition-colors hover:opacity-80"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
                <PixelSprite name="coin" size={16} />
              </div>
              <span className="flex-1 text-sm">{m.name}</span>
              <span
                className={`text-xs ${m.connected ? 'text-muted-foreground' : 'text-foreground'}`}
              >
                {m.connected ? 'Connected' : 'Connect'}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Transactions */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Recent Transactions</h2>
          {transactions.length > 3 && (
            <button
              onClick={() => setShowAllTx((v) => !v)}
              className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {showAllTx ? 'Show less' : 'View all'} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {loading ? (
          <SkeletonList rows={3} />
        ) : transactions.length === 0 ? (
          <EmptyState
            sprite="coin"
            title="No transactions yet"
            description="Your earnings and withdrawals will appear here once you start playing."
          />
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {visibleTx.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
                  <PixelSprite name={t.sprite} size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm">{t.title}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{t.time}</p>
                </div>
                <span
                  className={`font-mono text-xs font-medium tnum ${
                    t.amount < 0 ? 'text-muted-foreground' : ''
                  }`}
                >
                  {t.amount < 0 ? '- ' : '+ '}
                  {formatRp(Math.abs(t.amount)).replace('Rp', 'Rp')}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <WithdrawSheet open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
      <PaymentMethodSheet open={methodsOpen} onClose={() => setMethodsOpen(false)} />
    </div>
  )
}
