'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ChevronRight, CreditCard, Receipt } from 'lucide-react'
import { PixelSprite } from '@/components/pixel-sprite'
import { CountUp } from '@/components/ui/count-up'
import { ActionButton } from '@/components/ui/action-button'
import { BottomSheet } from '@/components/ui/sheet'
import { SkeletonRow } from '@/components/ui/skeleton'
import { WithdrawSheet } from '@/components/wallet/withdraw-sheet'
import { formatRp, type PaymentMethod, type Transaction } from '@/lib/mock-data'
import { useStore } from '@/lib/store'

export function WalletScreen() {
  const {
    balance,
    totalEarned,
    transactions,
    paymentMethods,
    connectPaymentMethod,
    toast,
  } = useStore()

  const [loading, setLoading] = useState(true)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [activeMethod, setActiveMethod] = useState<PaymentMethod | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650)
    return () => clearTimeout(t)
  }, [])

  const recent = transactions.slice(0, 3)

  return (
    <div className="flex flex-col gap-8 px-6 pb-6 pt-2">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-medium tracking-tight">Wallet</h1>
        <CreditCard className="h-5 w-5 text-muted-foreground" />
      </header>

      {/* Balance */}
      <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-4 py-8 text-center">
        <span className="overline text-[10px] text-muted-foreground">Withdrawable Balance</span>
        {loading ? (
          <div className="h-10 w-40 animate-pulse rounded-md bg-muted" />
        ) : (
          <CountUp
            value={balance}
            format={formatRp}
            className="font-mono text-4xl font-medium tracking-tight tnum"
          />
        )}
        <span className="font-mono text-[11px] text-muted-foreground">
          Total Earned: {formatRp(totalEarned)}
        </span>
      </div>

      {/* Withdraw */}
      <button
        onClick={() => setWithdrawOpen(true)}
        disabled={loading}
        className="group flex items-center justify-between rounded-lg bg-primary px-5 py-4 text-primary-foreground transition-all duration-100 active:scale-[0.99] disabled:opacity-50"
      >
        <span className="text-[15px] font-medium">Withdraw</span>
        <ChevronRight className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5" />
      </button>

      {/* Payment methods */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Payment Methods</h2>
          <button
            onClick={() => setManageOpen(true)}
            className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Manage <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card px-4">
          {paymentMethods.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMethod(m)}
              className="-mx-4 flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface"
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
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            View all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {loading ? (
          <div className="flex flex-col divide-y divide-border">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : recent.length === 0 ? (
          <EmptyTransactions />
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {recent.map((t) => (
              <TransactionRow key={t.id} tx={t} />
            ))}
          </div>
        )}
      </section>

      {/* Withdraw flow */}
      <WithdrawSheet open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />

      {/* Manage payment methods */}
      <BottomSheet
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        title="Payment Methods"
        description="Connect the accounts you want to withdraw to."
      >
        <div className="flex flex-col gap-2 pb-2">
          {paymentMethods.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3.5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
                <PixelSprite name="coin" size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  {m.connected ? 'Ready for withdrawals' : 'Not connected'}
                </p>
              </div>
              {m.connected ? (
                <span className="text-xs text-muted-foreground">Connected</span>
              ) : (
                <ActionButton
                  onAction={async () => {
                    await connectPaymentMethod(m.id)
                    toast({ title: `${m.name} connected`, variant: 'success' })
                  }}
                  loadingText="Connecting"
                  successText="Connected"
                  className="h-8 rounded-md border border-border bg-card px-3 text-xs text-foreground hover:border-ring"
                >
                  Connect
                </ActionButton>
              )}
            </div>
          ))}
        </div>
      </BottomSheet>

      {/* Payment method detail */}
      <BottomSheet
        open={!!activeMethod}
        onClose={() => setActiveMethod(null)}
        title={activeMethod?.name}
        description={activeMethod?.connected ? 'This account is ready for withdrawals.' : 'Connect this account to withdraw.'}
      >
        {activeMethod && (
          <div className="flex flex-col gap-5 pb-2">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
                <PixelSprite name="coin" size={22} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{activeMethod.name}</p>
                <p className="text-xs text-muted-foreground">
                  {activeMethod.connected ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            {activeMethod.connected ? (
              <p className="text-xs text-muted-foreground">
                Withdrawals to {activeMethod.name} usually arrive within minutes.
              </p>
            ) : (
              <ActionButton
                onAction={async () => {
                  await connectPaymentMethod(activeMethod.id)
                  toast({ title: `${activeMethod.name} connected`, variant: 'success' })
                  setActiveMethod(null)
                }}
                loadingText="Connecting"
                successText="Connected"
                className="rounded-lg bg-primary px-5 py-4 text-[15px] font-medium text-primary-foreground"
              >
                Connect {activeMethod.name}
              </ActionButton>
            )}
          </div>
        )}
      </BottomSheet>

      {/* Full history */}
      <BottomSheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Transactions"
        description={`${transactions.length} total`}
      >
        {transactions.length === 0 ? (
          <EmptyTransactions />
        ) : (
          <div className="flex flex-col divide-y divide-border pb-2">
            {transactions.map((t) => (
              <TransactionRow key={t.id} tx={t} />
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const sign = tx.type === 'earn' ? '+' : '-'
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 py-3"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
        <PixelSprite name="coin" size={16} />
      </div>
      <div className="flex-1">
        <p className="text-sm">{tx.title}</p>
        <p className="font-mono text-[10px] text-muted-foreground">{tx.time}</p>
      </div>
      <span className="font-mono text-xs font-medium tnum">
        {sign} {formatRp(tx.amount)}
      </span>
    </motion.div>
  )
}

function EmptyTransactions() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-4 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
        <Receipt className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium">No transactions yet</p>
        <p className="mt-1 text-xs text-muted-foreground text-pretty">
          Complete quests or withdraw to see activity here.
        </p>
      </div>
    </div>
  )
}
