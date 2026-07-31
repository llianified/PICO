import { ChevronRight, CreditCard } from 'lucide-react'
import { PixelSprite } from '@/components/pixel-sprite'

const methods = [
  { name: 'DANA', status: 'Connected', connected: true },
  { name: 'GoPay', status: 'Connect', connected: false },
  { name: 'OVO', status: 'Connect', connected: false },
  { name: 'Bank Transfer', status: 'Connect', connected: false },
]

const transactions = [
  { title: 'Daily Quest', amount: '+ Rp2.000', time: '10m ago' },
  { title: 'Survey Reward', amount: '+ Rp5.000', time: '1h ago' },
  { title: 'Withdrawal', amount: '- Rp50.000', time: 'Yesterday' },
]

export function WalletScreen() {
  return (
    <div className="flex flex-col gap-6 px-6 pb-6 pt-2">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Wallet</h1>
        <CreditCard className="h-5 w-5 text-muted-foreground" />
      </header>

      {/* Balance */}
      <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-4 py-8 text-center">
        <span className="text-xs text-muted-foreground">Withdrawable Balance</span>
        <span className="font-mono text-4xl font-semibold tracking-tight tnum">Rp84.500</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          Total Earned: Rp1.245.000
        </span>
      </div>

      {/* Withdraw */}
      <button className="group flex items-center justify-between rounded-lg bg-primary px-5 py-4 text-primary-foreground transition-transform duration-100 active:scale-[0.99]">
        <span className="text-[15px] font-medium">Withdraw</span>
        <ChevronRight className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5" />
      </button>

      {/* Payment methods */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Payment Methods</h2>
          <button className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            Manage <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card px-4">
          {methods.map((m) => (
            <div key={m.name} className="flex items-center gap-3 py-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
                <PixelSprite name="coin" size={16} />
              </div>
              <span className="flex-1 text-sm">{m.name}</span>
              <span
                className={`text-xs ${m.connected ? 'text-muted-foreground' : 'text-foreground'}`}
              >
                {m.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Transactions */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Recent Transactions</h2>
          <button className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {transactions.map((t) => (
            <div key={t.title} className="flex items-center gap-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
                <PixelSprite name="coin" size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm">{t.title}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{t.time}</p>
              </div>
              <span className="font-mono text-xs font-medium tnum">{t.amount}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
