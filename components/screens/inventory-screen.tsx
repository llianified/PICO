'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronRight, Loader2, Package } from 'lucide-react'
import { SegmentedProgress } from '@/components/primitives'
import { PixelSprite, type SpriteName } from '@/components/pixel-sprite'
import { CountUp } from '@/components/ui/count-up'
import { ActionButton } from '@/components/ui/action-button'
import { BottomSheet } from '@/components/ui/sheet'
import { formatCompact, type InventoryItem } from '@/lib/mock-data'
import { useStore, KEY_COST, CHEST_COST, INVENTORY_CAP } from '@/lib/store'

export function InventoryScreen() {
  const {
    chests,
    keys,
    coins,
    artifacts,
    badges,
    collectionOwned,
    collectionTotal,
    inventoryItems,
    equipped,
    openChest,
    equipItem,
    buyKey,
    buyChest,
    toast,
  } = useStore()

  const [opening, setOpening] = useState(false)
  const [buyingKey, setBuyingKey] = useState(false)
  const [buyingChest, setBuyingChest] = useState(false)
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null)
  const [allOpen, setAllOpen] = useState(false)

  const isEquipped = (item: InventoryItem | null) =>
    !!item && equipped[item.slot] === item.id

  const collectionPct = Math.round((collectionOwned / collectionTotal) * 100)

  const grid: { label: string; value: string; sprite: SpriteName }[] = [
    { label: 'Treasure Chest', value: String(chests), sprite: 'chest' },
    { label: 'Keys', value: String(keys), sprite: 'key' },
    { label: 'Coins', value: formatCompact(coins), sprite: 'coin' },
    { label: 'Artifacts', value: String(artifacts), sprite: 'gem' },
    { label: 'Badges', value: String(badges), sprite: 'shield' },
    { label: 'Collections', value: `${collectionOwned} / ${collectionTotal}`, sprite: 'book' },
  ]

  async function handleOpenChest() {
    if (opening) return
    if (chests <= 0) {
      toast({ title: 'No chests', description: 'Complete quests to earn chests.', variant: 'error' })
      return
    }
    if (keys <= 0) {
      toast({ title: 'No keys', description: 'You need a key to open a chest.', variant: 'error' })
      return
    }
    if (inventoryItems.length >= INVENTORY_CAP) {
      toast({ title: 'Inventory full', description: 'Make room before opening more.', variant: 'error' })
      return
    }
    setOpening(true)
    try {
      await openChest()
    } catch (err) {
      const error = err as Error
      if (error.message === 'INVENTORY_FULL') {
        toast({ title: 'Inventory full', description: 'Make room before opening more chests.', variant: 'error' })
      } else {
        toast({ title: 'Failed to open chest', description: 'Please try again.', variant: 'error' })
      }
    } finally {
      setOpening(false)
    }
  }

  async function handleBuyKey() {
    if (buyingKey) return // Prevent double-click
    if (coins < KEY_COST) {
      toast({ title: 'Not enough coins', description: `You need ${formatCompact(KEY_COST)} coins.`, variant: 'error' })
      return
    }
    setBuyingKey(true)
    try {
      await buyKey()
      toast({ title: 'Key purchased', description: `-${formatCompact(KEY_COST)} coins · +1 Key`, variant: 'success' })
    } catch (err) {
      toast({ title: 'Purchase failed', description: 'Please try again.', variant: 'error' })
    } finally {
      setBuyingKey(false)
    }
  }

  async function handleBuyChest() {
    if (buyingChest) return // Prevent double-click
    if (coins < CHEST_COST) {
      toast({ title: 'Not enough coins', description: `You need ${formatCompact(CHEST_COST)} coins.`, variant: 'error' })
      return
    }
    setBuyingChest(true)
    try {
      await buyChest()
      toast({ title: 'Chest purchased', description: `-${formatCompact(CHEST_COST)} coins · +1 Chest`, variant: 'success' })
    } catch (err) {
      toast({ title: 'Purchase failed', description: 'Please try again.', variant: 'error' })
    } finally {
      setBuyingChest(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 px-6 pb-6 pt-2">
      <header>
        <h1 className="text-3xl font-medium tracking-tight">Inventory</h1>
      </header>

      {/* Collection progress */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PixelSprite name="star" size={16} />
            <span className="text-sm">Collection Progress</span>
          </div>
          <span className="font-mono text-sm font-medium tnum">
            <CountUp value={collectionPct} format={(n) => `${Math.round(n)}%`} />
          </span>
        </div>
        <SegmentedProgress value={collectionPct} segments={20} />
      </div>

      {/* Open chest */}
      <button
        onClick={handleOpenChest}
        disabled={opening}
        aria-busy={opening}
        className="group flex items-center justify-between rounded-lg bg-primary px-5 py-4 text-primary-foreground transition-all duration-100 active:scale-[0.99] disabled:opacity-60"
      >
        <span className="flex items-center gap-2 text-[15px] font-medium">
          {opening ? <Loader2 className="h-4 w-4 animate-spin" /> : <PixelSprite name="chest" size={18} />}
          {opening ? 'Opening chest…' : 'Open Treasure Chest'}
        </span>
        {!opening && <ChevronRight className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5" />}
      </button>

      {/* Coin shop — gives coins a purpose */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Coin Shop</h2>
          <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground tnum">
            <PixelSprite name="coin" size={14} />
            {formatCompact(coins)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ShopCard
            sprite="key"
            label="Buy Key"
            cost={KEY_COST}
            affordable={coins >= KEY_COST && !buyingKey}
            loading={buyingKey}
            onBuy={handleBuyKey}
          />
          <ShopCard
            sprite="chest"
            label="Buy Chest"
            cost={CHEST_COST}
            affordable={coins >= CHEST_COST && !buyingChest}
            loading={buyingChest}
            onBuy={handleBuyChest}
          />
        </div>
      </section>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {grid.map((item) => (
          <motion.button
            key={item.label}
            layout
            onClick={() =>
              toast({ title: item.label, description: `You own ${item.value}.`, variant: 'info' })
            }
            className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-ring"
          >
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <div className="flex items-end justify-between gap-2">
              <PixelSprite name={item.sprite} size={28} className="shrink-0" />
              <span className="font-pixel whitespace-nowrap text-base tnum">{item.value}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Recent unlocks */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Recent Unlocks</h2>
          <button
            onClick={() => setAllOpen(true)}
            className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            View all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {inventoryItems.length === 0 ? (
          <EmptyInventory />
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {inventoryItems.slice(0, 1).map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  equipped={isEquipped(item)}
                  onClick={() => setActiveItem(item)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Item detail */}
      <BottomSheet
        open={!!activeItem}
        onClose={() => setActiveItem(null)}
        title={activeItem?.name}
        description={activeItem ? `${activeItem.rarity} · ${activeItem.slot}` : undefined}
      >
        {activeItem && (
          <div className="flex flex-col items-center gap-5 pb-2 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-border bg-surface">
              <PixelSprite name={activeItem.sprite} size={52} />
            </div>
            <p className="max-w-[18rem] text-sm leading-7 text-muted-foreground text-pretty">
              {activeItem.description}
            </p>
            <div className="flex w-full flex-col divide-y divide-border rounded-lg border border-border bg-card px-4">
              <div className="flex items-center justify-between py-3 text-sm">
                <span className="text-muted-foreground">Rarity</span>
                <span>{activeItem.rarity}</span>
              </div>
              <div className="flex items-center justify-between py-3 text-sm">
                <span className="text-muted-foreground">Slot</span>
                <span>{activeItem.slot}</span>
              </div>
              <div className="flex items-center justify-between py-3 text-sm">
                <span className="text-muted-foreground">Unlocked</span>
                <span className="font-mono text-xs tnum">{activeItem.unlockedAt}</span>
              </div>
            </div>
            <button
              onClick={() => {
                const wasEquipped = isEquipped(activeItem)
                equipItem(activeItem.id)
                toast({
                  title: wasEquipped ? 'Unequipped' : 'Equipped',
                  description: wasEquipped
                    ? `${activeItem.name} removed from your ${activeItem.slot} slot.`
                    : `${activeItem.name} is now in your ${activeItem.slot} slot.`,
                  variant: wasEquipped ? 'info' : 'success',
                })
              }}
              className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-5 py-4 text-[15px] font-medium transition-transform duration-100 active:scale-[0.99] ${
                isEquipped(activeItem)
                  ? 'border border-border bg-card text-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {isEquipped(activeItem) ? (
                <>
                  <Check className="h-4 w-4" /> Equipped · Tap to Unequip
                </>
              ) : (
                'Equip'
              )}
            </button>
          </div>
        )}
      </BottomSheet>

      {/* All unlocks */}
      <BottomSheet
        open={allOpen}
        onClose={() => setAllOpen(false)}
        title="Unlocked Items"
        description={`${inventoryItems.length} collected`}
      >
        {inventoryItems.length === 0 ? (
          <EmptyInventory />
        ) : (
          <div className="flex flex-col gap-3 pb-2">
            {inventoryItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                equipped={isEquipped(item)}
                onClick={() => {
                  setAllOpen(false)
                  setTimeout(() => setActiveItem(item), 250)
                }}
              />
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

function ItemRow({
  item,
  onClick,
  equipped = false,
}: {
  item: InventoryItem
  onClick: () => void
  equipped?: boolean
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.96, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-ring"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-surface">
        <PixelSprite name={item.sprite} size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{item.name}</p>
          {equipped && (
            <span className="pixel-label shrink-0 rounded-full border border-border bg-surface px-1.5 py-0.5 text-[8px] text-foreground">
              Equipped
            </span>
          )}
        </div>
        <p className="pixel-label mt-1.5 truncate text-[9px] text-muted-foreground">
          {item.rarity} · {item.slot}
        </p>
      </div>
      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{item.unlockedAt}</span>
    </motion.button>
  )
}

function ShopCard({
  sprite,
  label,
  cost,
  affordable,
  loading,
  onBuy,
}: {
  sprite: SpriteName
  label: string
  cost: number
  affordable: boolean
  loading?: boolean
  onBuy: () => Promise<void>
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <PixelSprite name={sprite} size={28} />
        <span className="flex items-center gap-1 font-mono text-xs font-medium tnum">
          <PixelSprite name="coin" size={12} />
          {formatCompact(cost)}
        </span>
      </div>
      <ActionButton
        onAction={onBuy}
        disabled={!affordable || loading}
        loadingText="Buying"
        successText="Bought"
        className="h-9 w-full rounded-md bg-primary text-xs font-medium text-primary-foreground disabled:opacity-50"
      >
        {label}
      </ActionButton>
    </div>
  )
}

function EmptyInventory() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-4 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
        <Package className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium">Nothing unlocked yet</p>
        <p className="mt-1 text-xs text-muted-foreground text-pretty">
          Open a chest to discover your first item.
        </p>
      </div>
    </div>
  )
}
