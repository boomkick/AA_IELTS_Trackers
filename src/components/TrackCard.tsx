import { useStore } from '@/lib/store'
import { gateStatus, itemsOfStage, notStartedLabel, stageDef } from '@/lib/stages'
import { nextFullTestDue } from '@/lib/stats'
import { fmtDate } from '@/lib/utils'
import { GoalDue } from '@/components/GoalDue'
import { Card } from '@/components/ui/card'
import { Badge, SkillBadge } from '@/components/ui/badge'
import type { Track } from '@/types'

/** A started track: its current Stage, the next Goal not yet done, the Gate status and the next Full test. */
export function TrackCard({ track }: { track: Track }) {
  const { goals, doneGoalIds, results, today } = useStore()
  if (track.stage === null) return null

  const nextGoal = itemsOfStage(goals, track.skill, track.stage).find((g) => !doneGoalIds.has(g.id))
  const gate = gateStatus(track, goals, doneGoalIds, results)
  const nextTest = nextFullTestDue(track, results)

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
          <GoalDue goal={nextGoal} done={false} today={today} />
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
  return (
    <p className="flex items-center gap-2 text-sm text-slate-400">
      <SkillBadge skill={track.skill} /> {notStartedLabel(track.skill, tracks)}
    </p>
  )
}
