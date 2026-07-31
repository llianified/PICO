'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  ChevronRight,
  Globe,
  Info,
  Moon,
  Palette,
  Volume2,
  Check,
  Trash2,
} from 'lucide-react'
import { BottomSheet, Modal } from '@/components/ui/overlay'
import { PixelSprite } from '@/components/pixel-sprite'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { useGame, AVATARS, type Avatar } from '@/lib/store'

const EASE = [0.22, 1, 0.36, 1] as const
const LANGUAGES = ['English', 'Bahasa Indonesia', 'Español', 'Français', '日本語', '한국어']

/* A row toggle switch. */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200 ${
        on ? 'border-primary bg-primary' : 'border-border bg-surface'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full ${
          on ? 'right-1 bg-primary-foreground' : 'left-1 bg-muted-foreground'
        }`}
      />
    </button>
  )
}

function Row({
  icon,
  label,
  value,
  onClick,
  trailing,
}: {
  icon: React.ReactNode
  label: string
  value?: string
  onClick?: () => void
  trailing?: React.ReactNode
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors ${
        onClick ? 'hover:bg-surface active:scale-[0.99]' : ''
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {value && <span className="text-xs text-muted-foreground">{value}</span>}
      {trailing ?? (onClick && <ChevronRight className="h-4 w-4 text-muted-foreground" />)}
    </Comp>
  )
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { soundOn, setSoundOn, notificationsOn, setNotificationsOn } = useGame()
  const [sub, setSub] = useState<null | 'language' | 'theme' | 'about'>(null)

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title="Settings" description="Manage your preferences.">
        <div className="flex flex-col gap-3 pb-2">
          <Row
            icon={<Volume2 className="h-4 w-4" />}
            label="Sound Effects"
            trailing={<Toggle on={soundOn} onChange={setSoundOn} />}
          />
          <Row
            icon={<Bell className="h-4 w-4" />}
            label="Push Notifications"
            trailing={<Toggle on={notificationsOn} onChange={setNotificationsOn} />}
          />
          <Row
            icon={<Globe className="h-4 w-4" />}
            label="Language"
            onClick={() => setSub('language')}
          />
          <Row
            icon={<Palette className="h-4 w-4" />}
            label="Theme"
            onClick={() => setSub('theme')}
          />
          <Row icon={<Info className="h-4 w-4" />} label="About PICO" onClick={() => setSub('about')} />
        </div>
      </BottomSheet>

      <LanguageSheet open={sub === 'language'} onClose={() => setSub(null)} />
      <ThemeSheet open={sub === 'theme'} onClose={() => setSub(null)} />
      <AboutSheet open={sub === 'about'} onClose={() => setSub(null)} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Language                                                            */
/* ------------------------------------------------------------------ */

export function LanguageSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { language, setLanguage } = useGame()
  const { toast } = useToast()
  return (
    <BottomSheet open={open} onClose={onClose} title="Language" description="Choose your preferred language.">
      <div className="flex flex-col gap-2 pb-2">
        {LANGUAGES.map((l) => {
          const active = l === language
          return (
            <button
              key={l}
              onClick={() => {
                setLanguage(l)
                toast({ title: 'Language updated', description: l, variant: 'success' })
                onClose()
              }}
              className={`flex items-center justify-between rounded-lg border p-4 text-left text-sm transition-colors active:scale-[0.99] ${
                active ? 'border-primary bg-surface' : 'border-border bg-card hover:bg-surface'
              }`}
            >
              <span className="font-medium">{l}</span>
              {active && <Check className="h-4 w-4 text-primary" />}
            </button>
          )
        })}
      </div>
    </BottomSheet>
  )
}

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */

export function ThemeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setTheme } = useGame()
  const { toast } = useToast()
  const options: { id: 'dark' | 'light'; label: string; icon: React.ReactNode }[] = [
    { id: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
    { id: 'light', label: 'Light', icon: <Palette className="h-4 w-4" /> },
  ]
  return (
    <BottomSheet open={open} onClose={onClose} title="Theme" description="Personalize your interface.">
      <div className="flex flex-col gap-2 pb-2">
        {options.map((o) => {
          const active = o.id === theme
          return (
            <button
              key={o.id}
              onClick={() => {
                setTheme(o.id)
                toast({
                  title: 'Theme updated',
                  description:
                    o.id === 'light' ? 'Light theme is a preview in this build.' : 'Dark theme applied.',
                  variant: 'success',
                })
                onClose()
              }}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left text-sm transition-colors active:scale-[0.99] ${
                active ? 'border-primary bg-surface' : 'border-border bg-card hover:bg-surface'
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
                {o.icon}
              </span>
              <span className="flex-1 font-medium">{o.label}</span>
              {active && <Check className="h-4 w-4 text-primary" />}
            </button>
          )
        })}
      </div>
    </BottomSheet>
  )
}

/* ------------------------------------------------------------------ */
/* About                                                               */
/* ------------------------------------------------------------------ */

export function AboutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="About PICO" description="Pixel Adventure">
      <div className="flex flex-col items-center gap-4 pb-4 pt-2 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-surface">
          <PixelSprite name="star" size={32} />
        </div>
        <div>
          <p className="text-lg font-medium tracking-tight">PICO</p>
          <p className="pixel-label mt-1 text-[9px] text-muted-foreground">Version 1.0.0</p>
        </div>
        <p className="max-w-[16rem] text-xs leading-relaxed text-muted-foreground text-pretty">
          Complete quests, earn XP, and unlock rewards on your pixel adventure. Built as an
          interactive frontend demo.
        </p>
        <div className="flex w-full flex-col gap-2 pt-2">
          {['Terms of Service', 'Privacy Policy', 'Help & Support'].map((t) => (
            <div
              key={t}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3.5 text-sm"
            >
              <span>{t}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </BottomSheet>
  )
}

/* ------------------------------------------------------------------ */
/* Avatar selection                                                    */
/* ------------------------------------------------------------------ */

export function AvatarSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { avatarId, selectAvatar } = useGame()
  const { toast } = useToast()
  const [pending, setPending] = useState(avatarId)

  const save = () => {
    selectAvatar(pending)
    const a = AVATARS.find((x) => x.id === pending)
    toast({ title: 'Avatar updated', description: a?.label, variant: 'success' })
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Choose Avatar"
      description="Pick a look for your explorer."
      footer={
        <button
          onClick={save}
          className="w-full bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.99]"
        >
          Save Avatar
        </button>
      }
    >
      <div className="grid grid-cols-3 gap-3 pb-2">
        {AVATARS.map((a: Avatar) => {
          const active = a.id === pending
          return (
            <button
              key={a.id}
              onClick={() => setPending(a.id)}
              className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors active:scale-[0.98] ${
                active ? 'border-primary bg-surface' : 'border-border bg-card hover:bg-surface'
              }`}
            >
              <span className="relative flex h-12 w-12 items-center justify-center text-foreground">
                <PixelSprite name={a.sprite} size={30} />
                {active && (
                  <motion.span
                    layoutId="avatar-check"
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary"
                  >
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </motion.span>
                )}
              </span>
              <span className="text-[11px] font-medium">{a.label}</span>
            </button>
          )
        })}
      </div>
    </BottomSheet>
  )
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notifications, markAllRead, clearNotifications, unreadCount } = useGame()
  const { toast } = useToast()
  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up.'}
        footer={
          notifications.length > 0 ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  markAllRead()
                  toast({ title: 'All marked as read', variant: 'success' })
                }}
                disabled={unreadCount === 0}
                className="flex-1 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-surface active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40"
              >
                Mark all read
              </button>
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:scale-[0.99]"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            </div>
          ) : null
        }
      >
        <div className="flex flex-col gap-2 pb-2">
          <AnimatePresence initial={false}>
            {notifications.length === 0 ? (
              <EmptyState
                sprite="flag"
                title="No notifications"
                description="New quests, rewards, and milestones will show up here."
              />
            ) : (
              notifications.map((n) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.24, ease: EASE }}
                  className={`flex items-start gap-3 rounded-lg border p-4 ${
                    n.read ? 'border-border bg-card' : 'border-primary/40 bg-surface'
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
                    <PixelSprite name={n.sprite} size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground text-pretty">
                      {n.body}
                    </p>
                    <p className="pixel-label mt-1.5 text-[9px] text-muted-foreground">{n.time}</p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </BottomSheet>

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)}>
        <div className="flex flex-col gap-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-medium">Clear all notifications?</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground text-pretty">
              This removes every notification. You can&apos;t undo this action.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmClear(false)}
              className="flex-1 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-surface active:scale-[0.99]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                clearNotifications()
                setConfirmClear(false)
                toast({ title: 'Notifications cleared', variant: 'success' })
              }}
              className="flex-1 rounded-md bg-destructive px-4 py-3 text-sm font-medium text-destructive-foreground transition-transform active:scale-[0.99]"
            >
              Clear all
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
