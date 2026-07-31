'use client'

import { useState } from 'react'
import {
  Bell,
  ChevronRight,
  Globe,
  Info,
  Palette,
  Trash2,
  Volume2,
} from 'lucide-react'
import { BottomSheet } from '@/components/ui/sheet'
import { Modal } from '@/components/ui/modal'
import { ActionButton } from '@/components/ui/action-button'
import { Toggle } from '@/components/ui/action-button'
import { useStore } from '@/lib/store'
import { languages, themes } from '@/lib/mock-data'

type SubView = 'notifications' | 'language' | 'theme' | 'about' | null

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    language,
    theme,
    notificationsEnabled,
    soundEnabled,
    setLanguage,
    setTheme,
    toggleNotifications,
    toggleSound,
    toast,
  } = useStore()

  const [sub, setSub] = useState<SubView>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const rows = [
    {
      icon: Bell,
      label: 'Notifications',
      value: notificationsEnabled ? 'On' : 'Off',
      onClick: () => setSub('notifications'),
    },
    { icon: Globe, label: 'Language', value: language, onClick: () => setSub('language') },
    { icon: Palette, label: 'Theme', value: theme, onClick: () => setSub('theme') },
    { icon: Info, label: 'About', value: '', onClick: () => setSub('about') },
  ]

  async function handleDelete() {
    await new Promise((r) => setTimeout(r, 1400))
    setConfirmDelete(false)
    onClose()
    toast({ title: 'Account scheduled for deletion', variant: 'error' })
  }

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title="Settings">
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <button
              key={r.label}
              onClick={r.onClick}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-muted-foreground/40 active:scale-[0.99]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface">
                <r.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="flex-1 text-left text-sm font-medium">{r.label}</span>
              {r.value && <span className="text-xs text-muted-foreground">{r.value}</span>}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}

          <button
            onClick={() => setConfirmDelete(true)}
            className="mt-2 flex items-center gap-3 rounded-lg border border-destructive/40 bg-card p-4 transition-colors hover:border-destructive active:scale-[0.99]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-destructive/40 bg-surface">
              <Trash2 className="h-4 w-4 text-destructive" />
            </div>
            <span className="flex-1 text-left text-sm font-medium text-destructive">
              Delete Account
            </span>
          </button>
        </div>
      </BottomSheet>

      {/* Notifications sub-sheet */}
      <BottomSheet
        open={sub === 'notifications'}
        onClose={() => setSub(null)}
        title="Notifications"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Push Notifications</p>
              <p className="text-xs text-muted-foreground">Quest reminders and rewards</p>
            </div>
            <Toggle checked={notificationsEnabled} onChange={toggleNotifications} />
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Sound Effects</p>
              <p className="text-xs text-muted-foreground">Play sounds on actions</p>
            </div>
            <Toggle checked={soundEnabled} onChange={toggleSound} />
          </div>
        </div>
      </BottomSheet>

      {/* Language sub-sheet */}
      <BottomSheet open={sub === 'language'} onClose={() => setSub(null)} title="Language">
        <div className="flex flex-col gap-2">
          {languages.map((l) => (
            <button
              key={l}
              onClick={() => {
                setLanguage(l)
                toast({ title: `Language set to ${l}`, variant: 'success' })
                setSub(null)
              }}
              className={`flex items-center justify-between rounded-lg border p-4 text-left text-sm transition-colors active:scale-[0.99] ${
                language === l
                  ? 'border-foreground bg-card'
                  : 'border-border bg-card hover:border-muted-foreground/40'
              }`}
            >
              {l}
              {language === l && (
                <span className="h-2 w-2 rounded-full bg-foreground" aria-hidden />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Theme sub-sheet */}
      <BottomSheet open={sub === 'theme'} onClose={() => setSub(null)} title="Theme">
        <div className="flex flex-col gap-2">
          {themes.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTheme(t)
                toast({ title: `Theme set to ${t}`, variant: 'success' })
                setSub(null)
              }}
              className={`flex items-center justify-between rounded-lg border p-4 text-left text-sm transition-colors active:scale-[0.99] ${
                theme === t
                  ? 'border-foreground bg-card'
                  : 'border-border bg-card hover:border-muted-foreground/40'
              }`}
            >
              {t}
              {theme === t && <span className="h-2 w-2 rounded-full bg-foreground" aria-hidden />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* About sub-sheet */}
      <BottomSheet open={sub === 'about'} onClose={() => setSub(null)} title="About">
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-card">
            <span className="pixel-label text-lg">P</span>
          </div>
          <div>
            <p className="text-lg font-medium tracking-tight">PICO</p>
            <p className="text-xs text-muted-foreground">Pixel Adventure · v1.0.0</p>
          </div>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground text-pretty">
            Complete quests, earn XP, and claim real rewards on your pixel adventure. Made with care
            for explorers everywhere.
          </p>
        </div>
      </BottomSheet>

      {/* Delete confirmation */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-destructive/40 bg-surface">
            <Trash2 className="h-7 w-7 text-destructive" />
          </div>
          <div>
            <p className="text-lg font-medium tracking-tight">Delete Account?</p>
            <p className="mt-2 text-sm text-muted-foreground text-pretty">
              This will permanently remove your progress, XP, and rewards. This cannot be undone.
            </p>
          </div>
          <div className="flex w-full gap-3">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 rounded-lg border border-border bg-surface py-3 text-sm font-medium transition-colors hover:border-muted-foreground/60 active:scale-[0.99]"
            >
              Cancel
            </button>
            <ActionButton onClick={handleDelete} variant="destructive" className="flex-1">
              Delete
            </ActionButton>
          </div>
        </div>
      </Modal>
    </>
  )
}
