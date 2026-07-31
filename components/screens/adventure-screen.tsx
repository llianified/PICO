'use client'

import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, HelpCircle, Loader2, Play } from 'lucide-react'
import { Progress, SegmentedProgress, Tag } from '@/components/primitives'
import { PixelSprite } from '@/components/pixel-sprite'
import { ActionButton } from '@/components/ui/action-button'
import { RewardOverlay } from '@/components/overlays/celebrations'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { useGame, type Quest, type QuestCategory } from '@/lib/store'
import type { SpriteName } from '@/components/pixel-sprite'

const tabs: QuestCategory[] = ['Story', 'Daily', 'Weekly', 'Event', 'Side']

function QuestRow({ quest, onOpen }: { quest: Quest; onOpen: () => void }) {
  const done = quest.state === 'done'
  return (
    <button
      onClick={onOpen}
      className={`flex w-full items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-all duration-100 hover:border-ring active:scale-[0.99] ${
        done ? 'opacity-60' : ''
      }`}
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border border-border">
        {quest.state === 'done' && <Check className="h-3.5 w-3.5" />}
        {quest.state === 'active' && <Loader2 className="h-3 w-3 animate-spin" />}
        {quest.state === 'video' && <Play className="h-3 w-3 fill-current" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[15px] font-medium">{quest.title}</p>
          {quest.progress ? (
            <span className="font-mono text-xs text-muted-foreground tnum">
              {quest.progress.current}/{quest.progress.total}
            </span>
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {quest.state === 'active' ? 'In progress\u2026' : quest.subtitle}
        </p>
        {quest.progress && (
          <Progress
            value={(quest.progress.current / quest.progress.total) * 100}
            className="mt-3"
          />
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-xs font-medium tnum">{quest.xp}</span>
          <Tag>{quest.tag}</Tag>
        </div>
      </div>
    </button>
  )
}

function QuestDetail({ questId, onBack }: { questId: string; onBack: () => void }) {
  const { quests, startQuest, completeQuest } = useGame()
  const { toast } = useToast()
  const quest = quests.find((q) => q.id === questId)!

  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [reward, setReward] = useState<{ sprite: SpriteName; label: string }[] | null>(null)

  const isDone = quest.state === 'done'
  const isActive = quest.state === 'active'

  async function handleStart() {
    setStatus('loading')
    try {
      await startQuest(quest.id)
      setStatus('idle')
      toast({ title: 'Quest started', description: quest.title, variant: 'success' })
    } catch {
      setStatus('idle')
      toast({ title: 'Could not start quest', variant: 'error' })
    }
  }

  async function handleComplete() {
    setStatus('loading')
    try {
      const res = await completeQuest(quest.id)
      setStatus('success')
      setReward(res.items)
    } catch {
      setStatus('idle')
      toast({ title: 'Quest unavailable', description: 'Try again shortly.', variant: 'error' })
    }
  }

  return (
    <div className="flex min-h-full flex-col px-6 pb-6 pt-2">
      <header className="mb-6 flex items-center">
        <button
          onClick={onBack}
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground active:scale-90"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-medium">Quest Details</h1>
      </header>

      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-border bg-card">
          <PixelSprite name="chest" size={44} />
        </div>
        <h2 className="text-2xl font-medium tracking-tight text-balance">{quest.title}</h2>
        <Tag>{quest.tag} QUEST</Tag>
        <p className="max-w-[17rem] text-sm leading-7 text-muted-foreground text-pretty">
          {quest.detail}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">Reward</span>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface">
              <PixelSprite name="star" size={18} />
            </div>
            <span className="font-mono text-sm font-medium tnum">{quest.xp}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="font-mono text-xs text-muted-foreground tnum">
              {quest.progress
                ? `${quest.progress.current} / ${quest.progress.total}`
                : isDone
                  ? '1 / 1'
                  : '0 / 1'}
            </span>
          </div>
          <SegmentedProgress
            value={
              quest.progress
                ? (quest.progress.current / quest.progress.total) * 100
                : isDone
                  ? 100
                  : 0
            }
            segments={16}
          />
        </div>
      </div>

      {isDone ? (
        <div className="mt-auto flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-4 text-[15px] font-medium text-muted-foreground">
          <Check className="h-5 w-5" />
          Completed
        </div>
      ) : isActive ? (
        <ActionButton
          status={status}
          loadingLabel="Completing"
          successLabel="Completed"
          onClick={handleComplete}
          className="group mt-auto flex items-center justify-center gap-1 rounded-lg bg-primary px-5 py-4 text-[15px] font-medium text-primary-foreground"
        >
          Complete Quest
          <Check className="h-5 w-5" />
        </ActionButton>
      ) : (
        <ActionButton
          status={status}
          loadingLabel="Starting"
          onClick={handleStart}
          className="group mt-auto flex items-center justify-center gap-1 rounded-lg bg-primary px-5 py-4 text-[15px] font-medium text-primary-foreground"
        >
          Start Quest
          <ChevronRight className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5" />
        </ActionButton>
      )}

      <RewardOverlay
        open={reward !== null}
        onClose={() => {
          setReward(null)
          onBack()
        }}
        title="Quest Complete"
        items={reward ?? []}
      />
    </div>
  )
}

export function AdventureScreen() {
  const { quests } = useGame()
  const { toast } = useToast()
  const [active, setActive] = useState<QuestCategory>('Daily')
  const [openQuestId, setOpenQuestId] = useState<string | null>(null)

  if (openQuestId) {
    return <QuestDetail questId={openQuestId} onBack={() => setOpenQuestId(null)} />
  }

  const filtered = quests.filter((q) => q.category === active)

  return (
    <div className="flex flex-col gap-8 px-6 pb-6 pt-2">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-medium tracking-tight">Adventure</h1>
        <button
          onClick={() =>
            toast({
              title: 'How quests work',
              description: 'Start a quest, complete the objective, then claim your XP reward.',
            })
          }
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground active:scale-90"
          aria-label="Help"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      </header>

      {/* Tabs */}
      <div className="no-scrollbar -mx-6 flex gap-6 overflow-x-auto border-b border-border px-6">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`relative shrink-0 pb-3 text-sm transition-colors ${
              active === t ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground/70'
            }`}
          >
            {t}
            {active === t && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground" />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <EmptyState
            sprite="flag"
            title={`No ${active.toLowerCase()} quests`}
            description="Check back soon — new quests appear here regularly."
          />
        ) : (
          filtered.map((q) => (
            <QuestRow key={q.id} quest={q} onOpen={() => setOpenQuestId(q.id)} />
          ))
        )}
      </div>
    </div>
  )
}
