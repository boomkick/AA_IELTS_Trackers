import { useStore } from '@/lib/store'
import { itemsOfStage, stageDef } from '@/lib/stages'
import { weeksLeftLabel } from '@/lib/stats'
import { fmtDate } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { HabitItem } from '@/components/HabitItem'
import { NotStartedLine, TrackCard } from '@/components/TrackCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SkillBadge } from '@/components/ui/badge'

export function Dashboard() {
  const { user, course, tracks, habits, today } = useStore()
  const isStudent = user?.role === 'student'

  const started = tracks.filter((t) => t.stage !== null)
  const notStarted = tracks.filter((t) => t.stage === null)
  // every Habit of every started track's current Stage, grouped by track
  const habitGroups = started
    .map((t) => ({ track: t, habits: itemsOfStage(habits, t.skill, t.stage!) }))
    .filter((g) => g.habits.length > 0)

  return (
    <>
      <PageHeader
        title={`Hello, ${user?.displayName}`}
        subtitle={`${fmtDate(today, 'EEEE, d MMMM')}${course ? ` · ${weeksLeftLabel(course, today)}` : ''}`}
      />

      <Card>
        <CardHeader><CardTitle>Today’s Habits</CardTitle></CardHeader>
        <CardContent>
          {habitGroups.length === 0 && <p className="text-sm text-slate-500">No Habits in the current Stages.</p>}
          <div className="space-y-4">
            {habitGroups.map(({ track, habits: list }) => (
              <div key={track.skill}>
                <div className="flex items-center gap-2">
                  <SkillBadge skill={track.skill} />
                  <span className="text-xs text-slate-500">{stageDef(track.skill, track.stage!).name}</span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {list.map((h) => <HabitItem key={h.id} habit={h} />)}
                </ul>
              </div>
            ))}
          </div>
          {!isStudent && habitGroups.length > 0 && <p className="pt-2 text-xs text-slate-400">Only the student can tick Habits. You see their status here.</p>}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {started.map((t) => <TrackCard key={t.skill} track={t} />)}
      </div>
      {notStarted.length > 0 && (
        <div className="mt-3 space-y-1">
          {notStarted.map((t) => <NotStartedLine key={t.skill} track={t} />)}
        </div>
      )}
    </>
  )
}
