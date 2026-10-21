import { useStore } from '@/lib/store'
import { canStart, gateStatus, goalOverdue, stageDef, startsAfterLabel } from '@/lib/stages'
import { nextFullTestDue } from '@/lib/stats'
import { cn, fmtDate } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge, SkillBadge } from '@/components/ui/badge'
import type { Track } from '@/types'

/** A started track: its current Stage, the next Goal not yet done, the Gate status and the next Full test. */
export function TrackCard({ track }: { track: Track }) {
  const { goals, goalsDone, results, today } = useStore()
  if (track.stage === null) return null

  const doneIds = new Set(Object.keys(goalsDone))
  const nextGoal = goals.find((g) => g.skill === track.skill && g.stage === track.stage && !doneIds.has(g.id))
  const gate = gateStatus(track, goals, doneIds, results)
  const nextTest = nextFullTestDue(track, results)
  const overdue = nextGoal ? goalOverdue(nextGoal, false, today) : false

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <SkillBadge skill={track.skill} />
        <Badge tone={gate.met ? 'green' : 'slate'}>{gate.label}</Badge>
      </div>
      <p className="mt-3 font-semibold text-slate-900">{stageDef(track.skill, track.stage).name}</p>
      {nextGoal ? (
        <div className="mt-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Next Goal</p>
          <p className="text-sm text-slate-800">{nextGoal.title}</p>
          {nextGoal.dueDate && (
            <p className={cn('text-xs font-medium', overdue ? 'text-red-600' : 'text-slate-500')}>
              Due {fmtDate(nextGoal.dueDate)}{overdue && ' · overdue'}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">No open Goals in this Stage.</p>
      )}
      {nextTest && <p className="mt-3 text-xs text-slate-500">Next Full test due {fmtDate(nextTest)}</p>}
    </Card>
  )
}

/** A track that hasn't started: one muted line. */
export function NotStartedLine({ track }: { track: Track }) {
  const { tracks } = useStore()
  const label = canStart(track.skill, tracks) ? 'Ready to start' : (startsAfterLabel(track.skill) ?? 'Not started')
  return (
    <p className="flex items-center gap-2 text-sm text-slate-400">
      <SkillBadge skill={track.skill} /> {label}
    </p>
  )
}
