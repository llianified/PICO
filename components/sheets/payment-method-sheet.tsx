'use client'

import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { BottomSheet } from '@/components/ui/overlay'
import { ActionButton } from '@/components/ui/action-button'
import { PixelSprite } from '@/components/pixel-sprite'
import { useGame } from '@/lib/store'
import { useToast } from '@/components/ui/toast'

export function PaymentMethodSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { methods, connectMethod } = useGame()
  const { toast } = useToast()
  const [connectingId, setConnectingId] = useState<string | null>(null)

  async function handleConnect(id: string, name: string) {
    setConnectingId(id)
    try {
      await connectMethod(id)
      toast({ title: `${name} connected`, variant: 'success' })
    } finally {
      setConnectingId(null)
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Payment Methods"
      description="Connect accounts to withdraw your rewards."
    >
      <div className="flex flex-col gap-2 pb-2">
        {methods.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 border border-border bg-card p-3.5"
          >
            <div className="flex h-8 w-8 items-center justify-center border border-border bg-surface text-muted-foreground">
              <PixelSprite name="coin" size={16} />
            </div>
            <span className="flex-1 text-sm">{m.name}</span>
            {m.connected ? (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5" />
                Connected
              </span>
            ) : (
              <ActionButton
                status={connectingId === m.id ? 'loading' : 'idle'}
                onClick={() => handleConnect(m.id, m.name)}
                className="flex items-center gap-1 border border-border px-2.5 py-1.5 text-xs text-foreground hover:border-ring"
              >
                <Plus className="h-3.5 w-3.5" />
                Connect
              </ActionButton>
            )}
          </div>
        ))}
      </div>
    </BottomSheet>
  )
}
