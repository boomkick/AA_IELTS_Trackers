import { useState, type ReactNode } from 'react'
import { Clock } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { SkillBadge, TaskTypeBadge } from '@/components/ui/badge'
import { cn, fmtDate } from '@/lib/utils'
import type { Completion, StudyTask } from '@/types'

interface TaskItemProps {
  task: StudyTask
  completion?: Completion
  canToggle: boolean
  onToggle: (done: boolean) => void
  showDate?: boolean
  actions?: ReactNode
}

export function TaskItem({ task, completion, canToggle, onToggle, showDate, actions }: TaskItemProps) {
  const [open, setOpen] = useState(false)
  const done = !!completion

  return (
    <div className={cn('flex gap-3 rounded-lg border p-3', done ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-white')}>
      <div className="pt-0.5">
        <Checkbox checked={done} disabled={!canToggle} onChange={onToggle} label={`Mark "${task.title}" as done`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <button onClick={() => setOpen((o) => !o)} className={cn('text-left text-sm font-medium', done ? 'text-slate-500 line-through' : 'text-slate-900')}>
            {task.title}
          </button>
          {actions}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
          {showDate && <span>{fmtDate(task.date)}</span>}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {task.startTime ? `${task.startTime}–${task.endTime}` : `${task.durationMin} min`}
          </span>
          <TaskTypeBadge type={task.type} />
          <SkillBadge skill={task.skill} />
          {task.dueDate && <span>Due {fmtDate(task.dueDate)}</span>}
        </div>
        {open && <p className="mt-2 text-sm text-slate-600">{task.description}</p>}
      </div>
    </div>
  )
}
