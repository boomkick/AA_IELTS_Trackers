import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useStore } from '@/lib/store'
import { weeksLeftLabel } from '@/lib/stats'
import { courseWeeks, currentWeek, doneRate, missionsOfWeek, weekDays } from '@/lib/weeks'
import { cn, fmtDate } from '@/lib/utils'
import { MissionForm } from '@/components/MissionForm'
import { MissionItem } from '@/components/MissionItem'
import { NotStartedLine, TrackCard } from '@/components/TrackCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Course, Mission } from '@/types'

/** The landing page: the shown Week's Missions by day, beside each started track's Stage, Goals, today's Habits and next Full test. */
export function ThisWeek() {
  const { course } = useStore()
  if (!course) return <Card className="px-6 py-12 text-center text-sm text-slate-500">No Course dates yet. Run supabase/migrations/009_course.sql (see README).</Card>
  return <Board course={course} />
}

function Board({ course }: { course: Course }) {
  const { user, tracks, missions, missionsDone, today } = useStore()
  const isTeacher = user?.role === 'teacher'
  const weeks = courseWeeks(course)
  const [weekNo, setWeekNo] = useState(() => currentWeek(weeks, today)?.number ?? 1)
  // null: form closed; { initial: null }: adding
  const [editing, setEditing] = useState<{ initial: Mission | null } | null>(null)

  const week = weeks[Math.min(weekNo, weeks.length) - 1]
  if (!week) return null
  const weekMissions = missionsOfWeek(missions, week)
  const started = tracks.filter((t) => t.stage !== null)
  const notStarted = tracks.filter((t) => t.stage === null)
  const addButton = isTeacher && (
    <Button size="sm" onClick={() => setEditing({ initial: null })}><Plus className="h-4 w-4" /> Add Mission</Button>
  )

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekNo(week.number - 1)} disabled={week.number === 1} aria-label="Previous Week">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">Week {week.number} of {weeks.length}</h1>
            <p className="text-sm text-slate-500">
              {fmtDate(week.startDate, 'd MMM')} – {fmtDate(week.endDate, 'd MMM yyyy')} · {weeksLeftLabel(course, today)}
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => setWeekNo(week.number + 1)} disabled={week.number === weeks.length} aria-label="Next Week">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {addButton}
      </div>

      <div className="mb-5 flex flex-wrap gap-1">
        {weeks.map((w) => {
          const list = missionsOfWeek(missions, w)
          const allDone = list.length > 0 && doneRate(list, missionsDone) === 100
          return (
            <button
              key={w.number}
              onClick={() => setWeekNo(w.number)}
              title={`Week ${w.number}${allDone ? ' · all done' : ''}`}
              aria-label={`Show Week ${w.number}`}
              className={cn(
                'h-2.5 w-5 rounded-full',
                w.number === week.number ? 'bg-navy-700' : allDone ? 'bg-emerald-400' : 'bg-slate-200',
                w.startDate <= today && today <= w.endDate && 'ring-2 ring-navy-300 ring-offset-1',
              )}
            />
          )
        })}
      </div>

      {/* day columns get the full width; the track cards follow in a row so neither is squeezed on a laptop screen */}
      <div className="space-y-4">
        {weekMissions.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <p className="font-medium text-slate-900">No Missions yet</p>
            {addButton}
          </Card>
        ) : (
          <div className="grid content-start gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {weekDays(week).map((date) => (
              <div
                key={date}
                className={cn(
                  'rounded-xl border p-2',
                  date === today ? 'border-navy-400 bg-navy-50/60' : 'border-slate-200 bg-slate-50',
                  date > week.endDate && 'opacity-50',
                )}
              >
                <p className={cn('mb-2 text-xs font-semibold uppercase', date === today ? 'text-navy-700' : 'text-slate-500')}>
                  {fmtDate(date, 'EEE d')}{date === today && ' · today'}{date > week.endDate && ' · after the Course'}
                </p>
                <div className="space-y-1.5">
                  {weekMissions.filter((m) => m.date === date).map((m) => (
                    <MissionItem key={m.id} mission={m} compact onEdit={() => setEditing({ initial: m })} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <aside className="space-y-3">
          <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
            {started.map((t) => <TrackCard key={t.skill} track={t} />)}
          </div>
          {notStarted.map((t) => <NotStartedLine key={t.skill} track={t} />)}
          {isTeacher && <p className="text-xs text-slate-400">Only the student can tick Missions and Habits. You see their status here.</p>}
        </aside>
      </div>

      <MissionForm open={editing !== null} onClose={() => setEditing(null)} initial={editing?.initial ?? null} defaultDate={week.startDate} />
    </>
  )
}
