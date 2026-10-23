import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { MISSION_TYPE_LABEL } from '@/lib/weeks'
import { cn, fmtDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge, SkillBadge } from '@/components/ui/badge'
import type { Mission, MissionType } from '@/types'

const typeTone: Record<MissionType, 'navy' | 'slate' | 'amber'> = { teacher_session: 'navy', self_study: 'slate', homework: 'amber' }

/** One Mission: the student's tick, its type, time, skill and due date; the teacher's edit and delete.
 *  `compact` fits a narrow day column. Click the title to show the instructions. */
export function MissionItem({ mission, onEdit, showDate, compact }: { mission: Mission; onEdit: () => void; showDate?: boolean; compact?: boolean }) {
  const { user, missionsDone, setMissionDone, deleteMission } = useStore()
  const [open, setOpen] = useState(false)
  const done = !!missionsDone[mission.id]
  const isTeacher = user?.role === 'teacher'

  function remove() {
    if (confirm(`Delete "${mission.title}"? The student's tick on it is removed too.`)) deleteMission(mission.id)
  }

  return (
    <div className={cn('flex gap-2 rounded-lg border bg-white', compact ? 'p-2' : 'gap-3 p-3', done ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200')}>
      <div className="pt-0.5">
        <Checkbox checked={done} disabled={isTeacher} onChange={(d) => setMissionDone(mission.id, d)} label={`Mark "${mission.title}" as done`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn('flex flex-wrap items-center gap-x-1.5 gap-y-1', compact ? 'text-[10px] font-semibold uppercase text-slate-400' : 'text-xs text-slate-500')}>
          {compact ? <span>{MISSION_TYPE_LABEL[mission.type]}</span> : <Badge tone={typeTone[mission.type]}>{MISSION_TYPE_LABEL[mission.type]}</Badge>}
          {showDate && <span>{fmtDate(mission.date)}</span>}
          <span>{mission.startTime ? `${mission.startTime}–${mission.endTime}` : `${mission.durationMin} min`}</span>
          {!compact && <SkillBadge skill={mission.skill} />}
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn('mt-1 block text-left font-medium', compact ? 'text-xs' : 'text-sm', done ? 'text-slate-500 line-through' : 'text-slate-900')}
        >
          {mission.title}
        </button>
        {mission.dueDate && <p className="mt-0.5 text-xs font-medium text-amber-700">Due {fmtDate(mission.dueDate)}</p>}
        {open && mission.description && <p className="mt-1 text-xs text-slate-600">{mission.description}</p>}
        {isTeacher && (
          <div className="mt-1 flex gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} aria-label={`Edit "${mission.title}"`}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={remove} aria-label={`Delete "${mission.title}"`}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
          </div>
        )}
      </div>
    </div>
  )
}
