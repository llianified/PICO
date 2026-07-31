'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import { BottomSheet } from '@/components/ui/sheet'
import { ActionButton } from '@/components/ui/action-button'
import { PixelSprite } from '@/components/pixel-sprite'
import { useStore } from '@/lib/store'
import { avatars } from '@/lib/mock-data'

export function AvatarSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { name, avatarId, updateProfile, toast } = useStore()
  const [selected, setSelected] = useState(avatarId)
  const [draftName, setDraftName] = useState(name)
  const [error, setError] = useState<string | null>(null)

  // reset drafts each time the sheet opens
  useEffect(() => {
    if (open) {
      setSelected(avatarId)
      setDraftName(name)
      setError(null)
    }
  }, [open, avatarId, name])

  const trimmed = draftName.trim()
  const nameError =
    trimmed.length === 0
      ? 'Name cannot be empty'
      : trimmed.length > 16
        ? 'Max 16 characters'
        : null
  const dirty = selected !== avatarId || trimmed !== name
  const canSave = !nameError && dirty

  async function handleSave() {
    if (nameError) {
      setError(nameError)
      throw new Error(nameError)
    }
    await new Promise((r) => setTimeout(r, 900))
    updateProfile({ name: trimmed, avatarId: selected })
    toast({ title: 'Profile updated', variant: 'success' })
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Edit Profile">
      <div className="flex flex-col gap-6">
        {/* Name field */}
        <div className="flex flex-col gap-2">
          <label htmlFor="display-name" className="pixel-label text-[10px] text-muted-foreground">
            Display Name
          </label>
          <input
            id="display-name"
            value={draftName}
            onChange={(e) => {
              setDraftName(e.target.value)
              setError(null)
            }}
            maxLength={24}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-[15px] outline-none transition-colors focus:border-muted-foreground/60"
            placeholder="Enter your name"
          />
          <p
            className={`text-xs ${error || nameError ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {error ?? nameError ?? 'This is how other explorers see you.'}
          </p>
        </div>

        {/* Avatar grid */}
        <div className="flex flex-col gap-2">
          <span className="pixel-label text-[10px] text-muted-foreground">Choose Avatar</span>
          <div className="grid grid-cols-3 gap-3">
            {avatars.map((a) => {
              const active = selected === a.id
              return (
                <button
                  key={a.id}
                  onClick={() => setSelected(a.id)}
                  className={`relative flex flex-col items-center gap-2 rounded-lg border bg-card p-4 transition-all active:scale-95 ${
                    active ? 'border-foreground' : 'border-border hover:border-muted-foreground/40'
                  }`}
                >
                  <PixelSprite name={a.sprite} size={32} />
                  <span className="text-[10px] text-muted-foreground">{a.name}</span>
                  {active && (
                    <motion.span
                      layoutId="avatar-check"
                      className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background"
                    >
                      <Check className="h-2.5 w-2.5" />
                    </motion.span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <ActionButton onClick={handleSave} disabled={!canSave} className="w-full">
          Save Changes
        </ActionButton>
      </div>
    </BottomSheet>
  )
}
