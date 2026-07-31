'use client'

import { useState } from 'react'
import { Home, Compass, Package, Wallet, User } from 'lucide-react'
import { StatusBar } from '@/components/primitives'
import { HomeScreen } from '@/components/screens/home-screen'
import { AdventureScreen } from '@/components/screens/adventure-screen'
import { InventoryScreen } from '@/components/screens/inventory-screen'
import { WalletScreen } from '@/components/screens/wallet-screen'
import { ProfileScreen } from '@/components/screens/profile-screen'

const nav = [
  { id: 'home', label: 'Home', icon: Home, Screen: HomeScreen },
  { id: 'adventure', label: 'Adventure', icon: Compass, Screen: AdventureScreen },
  { id: 'inventory', label: 'Inventory', icon: Package, Screen: InventoryScreen },
  { id: 'wallet', label: 'Wallet', icon: Wallet, Screen: WalletScreen },
  { id: 'profile', label: 'Profile', icon: User, Screen: ProfileScreen },
] as const

export function AppShell() {
  const [active, setActive] = useState<(typeof nav)[number]['id']>('home')
  const ActiveScreen = nav.find((n) => n.id === active)!.Screen

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col bg-background md:my-6 md:min-h-0 md:h-[860px] md:rounded-3xl md:border md:border-border md:shadow-2xl md:overflow-hidden">
      <StatusBar />

      <main className="no-scrollbar flex-1 overflow-y-auto">
        <ActiveScreen />
      </main>

      {/* Bottom navigation */}
      <nav className="sticky bottom-0 flex items-center justify-around border-t border-border bg-background/95 px-2 pb-5 pt-2 backdrop-blur">
        {nav.map((item) => {
          const Icon = item.icon
          const isActive = item.id === active
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`flex flex-1 flex-col items-center gap-1 py-1 transition-colors duration-100 ${
                isActive ? 'text-foreground' : 'text-muted-foreground'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
