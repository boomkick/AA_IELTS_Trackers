import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '@/lib/store'
import { SKILLS, stageDef } from '@/lib/stages'
import { courseWeeks, currentWeek, doneRate, MISSION_TYPE_LABEL, missionsOfWeek, stageInWeek } from '@/lib/weeks'
import { cn, fmtDate } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { MissionForm } from '@/components/MissionForm'
import { MissionItem } from '@/components/MissionItem'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SkillBadge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { Course, Mission, MissionType, StageKey } from '@/types'

const STAGE_COLOR: Record<StageKey, string> = {
  foundation: 'bg-sky-200',
  diagnosis: 'bg-violet-200',
  focus: 'bg-amber-200',
  exam_ready: 'bg-emerald-200',
  passage3: 'bg-rose-200',
  templates: 'bg-teal-200',
  practice: 'bg-lime-200',
}

// the order the picked Week's Missions are grouped in
const TYPE_ORDER: MissionType[] = ['teacher_session', 'homework', 'self_study']

/** Every Week of the Course against the Stage each Skill track was really in, and the picked Week's Missions by type. */
export function CoursePlan() {
  const { course } = useStore()
  if (!course) return <Card className="px-6 py-12 text-center text-sm text-slate-500">No Course dates yet. Run supabase/migrations/009_course.sql (see README).</Card>
  return <Plan course={course} />
}

function Plan({ course }: { course: Course }) {
  const { user, missions, missionsDone, stageEntries, today } = useStore()
  const weeks = courseWeeks(course)
  const current = currentWeek(weeks, today)
  const [weekNo, setWeekNo] = useState(current?.number ?? 1)
  const [editing, setEditing] = useState<{ initial: Mission | null } | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const currentHead = useRef<HTMLButtonElement>(null)

  // on narrow screens, start scrolled so the current Week is in view
  useEffect(() => {
    const box = scroller.current
    const head = currentHead.current
    if (box && head) box.scrollLeft = head.offsetLeft - box.clientWidth / 2 + head.offsetWidth / 2
  }, [])

  const week = weeks[Math.min(weekNo, weeks.length) - 1]
  if (!week) return null
  const weekMissions = missionsOfWeek(missions, week)
  const isCurrent = (n: number) => n === current?.number

  return (
    <>
      <PageHeader title="Course plan" subtitle="The Stage each Skill track was in, Week by Week. Pick a Week to see its Missions." />

      <Card className="mb-6 p-4">
        <div ref={scroller} className="relative overflow-x-auto pb-1">
          <div className="grid w-max gap-1 text-xs" style={{ gridTemplateColumns: `88px repeat(${weeks.length}, 64px)` }}>
            <div />
            {weeks.map((w) => (
              <button
                key={w.number}
                ref={isCurrent(w.number) ? currentHead : undefined}
                onClick={() => setWeekNo(w.number)}
                className={cn(
                  'rounded px-1 py-1 text-center font-medium',
                  w.number === week.number ? 'bg-navy-700 text-white' : 'text-slate-600 hover:bg-slate-100',
                  isCurrent(w.number) && 'ring-2 ring-navy-400',
                )}
              >
                W{w.number}
                <span className="block font-normal opacity-70">{fmtDate(w.startDate, 'd MMM')}</span>
              </button>
            ))}

            {SKILLS.map((skill) => (
              <div key={skill} className="contents">
                <div className="flex items-center"><SkillBadge skill={skill} /></div>
                {weeks.map((w) => {
                  const stage = stageInWeek(stageEntries, skill, w, today)
                  return (
                    <button
                      key={w.number}
                      onClick={() => setWeekNo(w.number)}
                      title={stage ? `${skill} · ${stageDef(skill, stage).name}` : undefined}
                      className={cn(
                        'h-9 truncate rounded px-1 text-[11px] text-slate-800',
                        stage ? STAGE_COLOR[stage] : 'bg-slate-50',
                        isCurrent(w.number) && 'ring-2 ring-navy-400',
                        w.number === week.number && 'outline-2 outline-offset-1 outline-navy-700',
                      )}
                    >
                      {stage && stageDef(skill, stage).name}
                    </button>
                  )
                })}
              </div>
            ))}

            <div className="flex items-center text-slate-500">Done</div>
            {weeks.map((w) => {
              const list = missionsOfWeek(missions, w)
              const rate = doneRate(list, missionsDone)
              return (
                <div key={w.number} className="px-1 pt-1" title={`${rate}% of ${list.length} Missions`}>
                  <Progress value={rate} />
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-900">
          Week {week.number} Missions{' '}
          <span className="font-normal text-slate-500">· {fmtDate(week.startDate, 'd MMM')} – {fmtDate(week.endDate, 'd MMM')}</span>
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{weekMissions.filter((m) => missionsDone[m.id]).length}/{weekMissions.length} done</span>
          {user?.role === 'teacher' && (
            <Button size="sm" onClick={() => setEditing({ initial: null })}><Plus className="h-4 w-4" /> Add Mission</Button>
          )}
        </div>
      </div>
      {weekMissions.length === 0 && <p className="text-sm text-slate-500">No Missions yet.</p>}
      {weekMissions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {TYPE_ORDER.map((type) => {
            const list = weekMissions.filter((m) => m.type === type)
            return (
              <section key={type}>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">
                  {MISSION_TYPE_LABEL[type]} <span className="font-normal text-slate-400">({list.length})</span>
                </h3>
                <div className="space-y-2">
                  {list.map((m) => <MissionItem key={m.id} mission={m} showDate onEdit={() => setEditing({ initial: m })} />)}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <MissionForm open={editing !== null} onClose={() => setEditing(null)} initial={editing?.initial ?? null} defaultDate={week.startDate} />
    </>
  )
}
