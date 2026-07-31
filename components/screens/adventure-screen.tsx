'use client'

import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, HelpCircle, Play } from 'lucide-react'
import { Progress, SegmentedProgress, Tag } from '@/components/primitives'
import { PixelSprite } from '@/components/pixel-sprite'

const tabs = ['Story', 'Daily', 'Weekly', 'Event', 'Side'] as const

type Quest = {
  id: string
  title: string
  subtitle: string
  xp: string
  xpValue: number
  tag: 'SIDE' | 'DAILY' | 'WEEKLY' | 'EVENT' | 'STORY'
  state: 'done' | 'todo' | 'video'
  progress?: { current: number; total: number }
  detail: string
}

const quests: Quest[] = [
  {
    id: 'survey',
    title: 'Complete Daily Survey',
    subtitle: 'Help the villagers',
    xp: '+500 XP',
    xpValue: 500,
    tag: 'SIDE',
    state: 'todo',
    detail: 'Help the villagers by sharing your opinion.',
  },
  {
    id: 'login',
    title: 'Login to PICO',
    subtitle: 'Maintain your journey',
    xp: '+100 XP',
    xpValue: 100,
    tag: 'DAILY',
    state: 'done',
    detail: 'Return each day to keep your streak alive.',
  },
  {
    id: 'sponsor',
    title: 'Watch Sponsor Video',
    subtitle: 'Support the kingdom',
    xp: '+50 XP',
    xpValue: 50,
    tag: 'SIDE',
    state: 'video',
    detail: 'Watch a short message from a partner to earn XP.',
  },
  {
    id: 'three',
    title: 'Complete 3 Quests',
    subtitle: 'Prove your dedication',
    xp: '+300 XP',
    xpValue: 300,
    tag: 'DAILY',
    state: 'todo',
    progress: { current: 2, total: 3 },
    detail: 'Finish three quests today to earn a bonus reward.',
  },
  {
    id: 'invite',
    title: 'Invite a Friend',
    subtitle: 'Bring new explorer',
    xp: '+50 XP',
    xpValue: 50,
    tag: 'SIDE',
    state: 'todo',
    progress: { current: 0, total: 1 },
    detail: 'Invite a friend to join PICO and both of you earn XP.',
  },
]

function QuestRow({ quest, onOpen }: { quest: Quest; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors duration-100 hover:border-ring"
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border border-border">
        {quest.state === 'done' && <Check className="h-3.5 w-3.5" />}
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
        <p className="mt-0.5 text-xs text-muted-foreground">{quest.subtitle}</p>
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

function QuestDetail({ quest, onBack }: { quest: Quest; onBack: () => void }) {
  return (
    <div className="flex min-h-full flex-col px-6 pb-6 pt-2">
      <header className="mb-6 flex items-center">
        <button
          onClick={onBack}
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
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
              {quest.progress ? `${quest.progress.current} / ${quest.progress.total}` : '0 / 1'}
            </span>
          </div>
          <SegmentedProgress
            value={
              quest.progress ? (quest.progress.current / quest.progress.total) * 100 : 0
            }
            segments={16}
          />
        </div>
      </div>

      <button className="group mt-auto flex items-center justify-center gap-1 rounded-lg bg-primary px-5 py-4 text-[15px] font-medium text-primary-foreground transition-transform duration-100 active:scale-[0.99]">
        Start Quest
        <ChevronRight className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5" />
      </button>
    </div>
  )
}

export function AdventureScreen() {
  const [active, setActive] = useState<(typeof tabs)[number]>('Daily')
  const [openQuest, setOpenQuest] = useState<Quest | null>(null)

  if (openQuest) {
    return <QuestDetail quest={openQuest} onBack={() => setOpenQuest(null)} />
  }

  return (
    <div className="flex flex-col gap-8 px-6 pb-6 pt-2">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-medium tracking-tight">Adventure</h1>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
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
              active === t ? 'font-medium text-foreground' : 'text-muted-foreground'
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
        {quests.map((q) => (
          <QuestRow key={q.id} quest={q} onOpen={() => setOpenQuest(q)} />
        ))}
      </div>
    </div>
  )
}
