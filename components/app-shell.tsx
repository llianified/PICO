'use client'

import { Home, Compass, Package, Wallet, User } from 'lucide-react'
import { HomeScreen } from '@/components/screens/home-screen'
import { AdventureScreen } from '@/components/screens/adventure-screen'
import { InventoryScreen } from '@/components/screens/inventory-screen'
import { WalletScreen } from '@/components/screens/wallet-screen'
import { ProfileScreen } from '@/components/screens/profile-screen'
import { Toaster } from '@/components/ui/toaster'
import { GlobalOverlays } from '@/components/overlays'
import { StoreProvider, useStore, type TabId } from '@/lib/store'

const nav = [
  { id: 'home', label: 'Home', icon: Home, Screen: HomeScreen },
  { id: 'adventure', label: 'Adventure', icon: Compass, Screen: AdventureScreen },
  { id: 'inventory', label: 'Inventory', icon: Package, Screen: InventoryScreen },
  { id: 'wallet', label: 'Wallet', icon: Wallet, Screen: WalletScreen },
  { id: 'profile', label: 'Profile', icon: User, Screen: ProfileScreen },
] as const

function Shell() {
  const { tab, navigate } = useStore()
  const ActiveScreen = nav.find((n) => n.id === tab)!.Screen

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-[420px] flex-col overflow-hidden bg-background md:my-6 md:h-[860px] md:rounded-3xl md:border md:border-border md:shadow-2xl">
      <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-[env(safe-area-inset-top)]">
        <ActiveScreen />
      </main>

      {/* Bottom navigation */}
      <nav className="flex shrink-0 items-center justify-around border-t border-border bg-background/90 px-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
        {nav.map((item) => {
          const Icon = item.icon
          const isActive = item.id === tab
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id as TabId)}
              className={`group relative flex flex-1 flex-col items-center gap-1 py-1 transition-colors duration-150 ${
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className="h-5 w-5 transition-transform duration-150 group-active:scale-90"
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
              <span
                className={`absolute -top-2 h-1 w-1 rounded-full bg-foreground transition-opacity duration-150 ${
                  isActive ? 'opacity-100' : 'opacity-0'
                }`}
                aria-hidden="true"
              />
            </button>
          )
        })}
      </nav>

      <Toaster />
      <GlobalOverlays />
    </div>
  )
}

export function AppShell() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
