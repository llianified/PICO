'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronLeft, ChevronRight, HelpCircle, Loader2, Play, Compass } from 'lucide-react'
import { Progress, SegmentedProgress, Tag } from '@/components/primitives'
import { PixelSprite } from '@/components/pixel-sprite'
import { BottomSheet } from '@/components/ui/sheet'
import { useStore } from '@/lib/store'
import { DEFAULT_SURVEY, type Quest } from '@/lib/mock-data'

const tabs = ['Story', 'Daily', 'Weekly', 'Event', 'Side'] as const

function QuestRow({ quest, onOpen }: { quest: Quest; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors duration-100 hover:border-ring"
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border border-border">
        {quest.state === 'done' && <Check className="h-3.5 w-3.5" />}
        {quest.state === 'video' && <Play className="h-3 w-3 fill-current" />}
        {quest.state === 'active' && (
          <motion.span
            className="h-2 w-2 rounded-full bg-foreground"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[15px] font-medium">{quest.title}</p>
          {quest.progress ? (
            <span className="shrink-0 font-mono text-xs text-muted-foreground tnum">
              {quest.progress.current}/{quest.progress.total}
            </span>
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{quest.subtitle}</p>
        {quest.progress && (
          <Progress value={(quest.progress.current / quest.progress.total) * 100} className="mt-3" />
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-xs font-medium tnum">+{quest.xpValue} XP</span>
          <Tag>{quest.tag}</Tag>
        </div>
      </div>
    </button>
  )
}

function QuestSurvey({
  survey,
  answers,
  onAnswer,
}: {
  survey: NonNullable<Quest['survey']>
  answers: Record<string, string>
  onAnswer: (questionId: string, option: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">Survey</span>
      <div className="flex flex-col gap-4">
        {survey.map((q, i) => (
          <div key={q.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium text-pretty">
              <span className="text-muted-foreground">{i + 1}. </span>
              {q.prompt}
            </p>
            <div className="flex flex-col gap-2">
              {q.options.map((opt) => {
                const selected = answers[q.id] === opt
                return (
                  <button
                    key={opt}
                    onClick={() => onAnswer(q.id, opt)}
                    className={`flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-left text-sm transition-colors duration-100 ${
                      selected
                        ? 'border-foreground bg-surface text-foreground'
                        : 'border-border text-muted-foreground hover:border-ring'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        selected ? 'border-foreground' : 'border-border'
                      }`}
                    >
                      {selected && <span className="h-2 w-2 rounded-full bg-foreground" />}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuestDetail({ quest, onBack }: { quest: Quest; onBack: () => void }) {
  const { startQuest, completeQuest, toast } = useStore()
  const [busy, setBusy] = useState(false)
  const [xpBurst, setXpBurst] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const surveyQuestions = quest.survey?.length ? quest.survey : DEFAULT_SURVEY
  const hasSurvey = quest.state === 'active'
  const surveyComplete = surveyQuestions.every((q) => answers[q.id])

  const progressPct = quest.progress
    ? (quest.progress.current / quest.progress.total) * 100
    : quest.state === 'done'
      ? 100
      : quest.state === 'active'
        ? 50
        : 0

  async function handleStart() {
    if (!quest.available) {
      toast({ title: 'Quest unavailable', description: 'Level up to unlock this quest.', variant: 'error' })
      return
    }
    setBusy(true)
    try {
      await startQuest(quest.id)
      toast({ title: 'Quest started', description: quest.title, variant: 'info' })
    } finally {
      setBusy(false)
    }
  }

  async function handleComplete() {
    setBusy(true)
    try {
      const { xp, keys, chests } = await completeQuest(quest.id)
      setXpBurst(true)
      setTimeout(() => setXpBurst(false), 1200)
      const loot = [`+${xp} XP`, `+${keys} Key${keys > 1 ? 's' : ''}`]
      if (chests > 0) loot.push(`+${chests} Chest`)
      toast({ title: 'Quest completed', description: loot.join(' · '), variant: 'success' })
    } catch (err) {
      if (err instanceof Error && err.message === 'NO_ENERGY') {
        toast({
          title: 'Not enough energy',
          description: 'Recharge your energy before completing this quest.',
          variant: 'error',
        })
      } else {
        toast({
          title: 'Could not complete quest',
          description: 'Something went wrong. Please try again.',
          variant: 'error',
        })
      }
    } finally {
      setBusy(false)
    }
  }

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
        <div className="relative flex h-20 w-20 items-center justify-center rounded-xl border border-border bg-card">
          <PixelSprite name="chest" size={44} />
          <AnimatePresence>
            {xpBurst && (
              <motion.span
                initial={{ opacity: 0, y: 0, scale: 0.8 }}
                animate={{ opacity: 1, y: -34, scale: 1 }}
                exit={{ opacity: 0, y: -52 }}
                transition={{ duration: 1 }}
                className="absolute -top-2 font-mono text-sm font-medium text-foreground tnum"
              >
                +{quest.xpValue} XP
              </motion.span>
            )}
          </AnimatePresence>
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
          <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface">
                <PixelSprite name="star" size={18} />
              </div>
              <span className="font-mono text-sm font-medium tnum">+{quest.xpValue} XP</span>
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface">
                <PixelSprite name="key" size={18} />
              </div>
              <span className="font-mono text-sm font-medium tnum">
                +{quest.xpValue >= 500 ? 2 : 1} Key{quest.xpValue >= 500 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface">
                <PixelSprite name="chest" size={18} />
              </div>
              <span className="font-mono text-sm font-medium tnum text-muted-foreground">
                Chance of a Chest
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="font-mono text-xs text-muted-foreground tnum">
              {quest.progress ? `${quest.progress.current} / ${quest.progress.total}` : quest.state === 'done' ? '1 / 1' : '0 / 1'}
            </span>
          </div>
          <SegmentedProgress value={progressPct} segments={16} />
        </div>

        {hasSurvey && (
          <QuestSurvey
            survey={surveyQuestions}
            answers={answers}
            onAnswer={(qid, opt) => setAnswers((prev) => ({ ...prev, [qid]: opt }))}
          />
        )}
      </div>

      <div aria-hidden className="mt-auto min-h-8" />

      {quest.state === 'done' ? (
        <div className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-5 py-4 text-[15px] font-medium text-muted-foreground">
          <Check className="h-5 w-5" />
          Quest Completed
        </div>
      ) : quest.state === 'active' ? (
        <button
          onClick={handleComplete}
          disabled={busy || !surveyComplete}
          aria-busy={busy}
          className="group flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-4 text-[15px] font-medium text-primary-foreground transition-all duration-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Completing…
            </>
          ) : !surveyComplete ? (
            'Answer all questions'
          ) : (
            <>
              Complete Quest
              <ChevronRight className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      ) : (
        <button
          onClick={handleStart}
          disabled={busy || !quest.available}
          aria-busy={busy}
          className="group flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-4 text-[15px] font-medium text-primary-foreground transition-all duration-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Starting…
            </>
          ) : !quest.available ? (
            'Quest Locked'
          ) : (
            <>
              {quest.state === 'video' ? 'Watch Video' : 'Start Quest'}
              <ChevronRight className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      )}
    </div>
  )
}

export function AdventureScreen() {
  const { quests } = useStore()
  const [active, setActive] = useState<(typeof tabs)[number]>('Daily')
  const [openId, setOpenId] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)

  const openQuest = quests.find((q) => q.id === openId) ?? null
  const filtered = useMemo(() => quests.filter((q) => q.category === active), [quests, active])

  if (openQuest) {
    return <QuestDetail quest={openQuest} onBack={() => setOpenId(null)} />
  }

  return (
    <div className="flex flex-col gap-8 px-6 pb-6 pt-2">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-medium tracking-tight">Adventure</h1>
        <button
          onClick={() => setHelpOpen(true)}
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
              <motion.span
                layoutId="quest-tab"
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground"
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <EmptyQuests key="empty" />
          ) : (
            filtered.map((q) => (
              <motion.div
                key={q.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <QuestRow quest={q} onOpen={() => setOpenId(q.id)} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <BottomSheet
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="How quests work"
        description="Earn XP and coins by completing quests."
      >
        <ul className="flex flex-col gap-4 pb-2 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-foreground">1</span>
            <p>Pick a quest and tap <span className="text-foreground">Start Quest</span> to begin.</p>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-foreground">2</span>
            <p>Finish the objective, then tap <span className="text-foreground">Complete</span> to claim your reward.</p>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-foreground">3</span>
            <p>XP builds your level. Coins land in your wallet, ready to withdraw.</p>
          </li>
        </ul>
      </BottomSheet>
    </div>
  )
}

function EmptyQuests() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-4 py-12 text-center"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
        <Compass className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium">No quests here yet</p>
        <p className="mt-1 text-xs text-muted-foreground text-pretty">
          Check back soon or explore another category.
        </p>
      </div>
    </motion.div>
  )
}
