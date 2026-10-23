import { Check } from 'lucide-react'
import { useStore } from '@/lib/store'
import { gateStatus, itemsOfStage, notStartedLabel, stageDef } from '@/lib/stages'
import { nextFullTestDue } from '@/lib/stats'
import { cn, fmtDate } from '@/lib/utils'
import { GoalDue } from '@/components/GoalDue'
import { HabitItem } from '@/components/HabitItem'
import { Card } from '@/components/ui/card'
import { Badge, SkillBadge } from '@/components/ui/badge'
import type { Track } from '@/types'

/** A started track: its current Stage and Gate status, the Stage's Goals (the next open one marked),
 *  today's Habits (the student ticks them here) and the next Full test. */
export function TrackCard({ track }: { track: Track }) {
  const { goals, doneGoalIds, habits, results, today } = useStore()
  if (track.stage === null) return null

  const stageGoals = itemsOfStage(goals, track.skill, track.stage)
  const nextGoal = stageGoals.find((g) => !doneGoalIds.has(g.id))
  const stageHabits = itemsOfStage(habits, track.skill, track.stage)
  const gate = gateStatus(track, goals, doneGoalIds, results)
  const nextTest = nextFullTestDue(track, results)

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <SkillBadge skill={track.skill} />
        <Badge tone={gate.met ? 'green' : 'slate'}>{gate.label}</Badge>
      </div>
      <p className="mt-3 font-semibold text-slate-900">{stageDef(track.skill, track.stage).name}</p>

      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">Goals</p>
      {stageGoals.length === 0 && <p className="text-sm text-slate-500">No Goals in this Stage.</p>}
      <ul className="mt-1 space-y-1">
        {stageGoals.map((g) => {
          const done = doneGoalIds.has(g.id)
          return (
            <li key={g.id} className="flex gap-1.5 text-sm">
              <Check className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', done ? 'text-emerald-600' : 'text-slate-200')} />
              <div className="min-w-0">
                <p className={cn(done ? 'text-slate-400 line-through' : 'text-slate-800', g === nextGoal && 'font-medium')}>
                  {g.title}{g === nextGoal && <span className="ml-1.5 text-xs font-normal text-navy-600">next</span>}
                </p>
                <GoalDue goal={g} done={done} today={today} />
              </div>
            </li>
          )
        })}
      </ul>

      {stageHabits.length > 0 && (
        <>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">Today’s Habits</p>
          <ul className="divide-y divide-slate-100">
            {stageHabits.map((h) => <HabitItem key={h.id} habit={h} />)}
          </ul>
        </>
      )}

      {nextTest && <p className="mt-3 text-xs text-slate-500">Next Full test due {fmtDate(nextTest)}</p>}
    </Card>
  )
}

/** A track that hasn't started: one muted line. */
export function NotStartedLine({ track }: { track: Track }) {
  const { tracks } = useStore()
  return (
    <p className="flex items-center gap-2 text-sm text-slate-400">
      <SkillBadge skill={track.skill} /> {notStartedLabel(track.skill, tracks)}
    </p>
  )
}
