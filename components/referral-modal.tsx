'use client'

import { useState } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useStore } from '@/lib/store'

interface ReferralModalProps {
  isOpen: boolean
  referralCode: string
  playerName: string
  onInviteSent: () => void
  onClose: () => void
}

export function ReferralModal({ isOpen, referralCode, playerName, onInviteSent, onClose }: ReferralModalProps) {
  const { toast } = useStore()
  const [copied, setCopied] = useState(false)

  const referralLink = `https://pico.game?ref=${referralCode}`

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast({ title: 'Copied to clipboard!', variant: 'success' })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInvite = () => {
    onInviteSent()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg"
      >
        <h2 className="mb-2 text-center text-xl font-bold">Invite a Friend</h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Share your referral code and both of you will earn XP rewards!
        </p>

        <div className="mb-6 space-y-4">
          {/* Referral Code Display */}
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Your Referral Code</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-lg font-bold">{referralCode}</code>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center rounded bg-primary p-2 text-primary-foreground transition-all active:scale-95"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Referral Link Display */}
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Share This Link</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 overflow-hidden text-ellipsis rounded bg-muted px-2 py-1 font-mono text-xs"
              />
              <button
                onClick={handleCopy}
                className="flex items-center justify-center rounded bg-primary p-2 text-primary-foreground transition-all active:scale-95"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border bg-card px-4 py-3 font-medium text-foreground transition-colors hover:bg-muted"
          >
            Close
          </button>
          <button
            onClick={handleInvite}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-all active:scale-95"
          >
            <Share2 className="h-4 w-4" />
            Invite Now
          </button>
        </div>
      </motion.div>
    </div>
  )
}
