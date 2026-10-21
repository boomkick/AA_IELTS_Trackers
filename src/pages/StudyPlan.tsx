import { useEffect, useRef, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { completionRate, weekOf } from '@/lib/stats'
import { cn, fmtDate } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { TaskItem } from '@/components/TaskItem'
import { TaskForm } from '@/components/TaskForm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { SkillBadge, TaskTypeBadge } from '@/components/ui/badge'
import type { StudyTask, TaskType } from '@/types'

const FILTERS: { value: TaskType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'teacher_session', label: 'Teacher-led' },
  { value: 'self_study', label: 'Self-study' },
  { value: 'homework', label: 'Homework' },
]

export function StudyPlan() {
  const { user, weeks, tasks, completions, today, setCompletion, upsertTask, deleteTask } = useStore()
  const isTeacher = user?.role === 'teacher'
  const [weekNo, setWeekNo] = useState(weekOf(weeks, today)?.number ?? 1)
  const [filter, setFilter] = useState<TaskType | 'all'>('all')
  const [editing, setEditing] = useState<StudyTask | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const weekBar = useRef<HTMLDivElement>(null)

  // On mobile the week selector scrolls horizontally: bring the current week into view once.
  useEffect(() => {
    const bar = weekBar.current
    const el = bar?.querySelector<HTMLElement>('[data-active="true"]')
    if (bar && el) bar.scrollLeft = el.offsetLeft - bar.clientWidth / 2 + el.clientWidth / 2
  }, [])

  const week = weeks.find((w) => w.number === weekNo) ?? weeks[0]
  const weekTasks = tasks
    .filter((t) => t.weekNumber === weekNo)
    .sort((a, b) => a.date.localeCompare(b.date) || typeOrder(a.type) - typeOrder(b.type))
  const visible = weekTasks.filter((t) => filter === 'all' || t.type === filter)
  const byDate = groupBy(visible, (t) => t.date)

  const toggle = (t: StudyTask, done: boolean) => setCompletion(t.id, done ? {} : null)
  const openEdit = (t: StudyTask | null) => {
    setEditing(t)
    setFormOpen(true)
  }
  const remove = (t: StudyTask) => {
    if (confirm(`Delete "${t.title}"?`)) deleteTask(t.id)
  }

  const rowActions = (t: StudyTask) =>
    isTeacher && (
      <div className="flex shrink-0 gap-0.5">
        <Button variant="ghost" size="icon" onClick={() => openEdit(t)} aria-label="Edit task"><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" onClick={() => remove(t)} aria-label="Delete task"><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
      </div>
    )

  return (
    <>
      <PageHeader
        title="Study Plan"
        subtitle="8 weeks · Official Cambridge Guide to IELTS · Listening (weeks 1–4) · Reading (weeks 5–8) · Classes Mon & Fri 20:00–21:30"
        actions={isTeacher && <Button onClick={() => openEdit(null)}><Plus className="h-4 w-4" /> Add task</Button>}
      />

      {/* Week selector */}
      <div ref={weekBar} className="relative -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-8 md:px-0">
        {weeks.map((w) => {
          const rate = completionRate(tasks.filter((t) => t.weekNumber === w.number), completions)
          const active = w.number === weekNo
          return (
            <button
              key={w.number}
              data-active={active}
              onClick={() => setWeekNo(w.number)}
              className={cn(
                'min-w-24 shrink-0 rounded-lg border px-3 py-2 text-left transition-colors',
                active ? 'border-navy-700 bg-navy-700 text-white' : 'border-slate-200 bg-white hover:border-navy-300',
              )}
            >
              <p className="text-sm font-semibold">Week {w.number}</p>
              <p className={cn('text-xs', active ? 'text-navy-100' : 'text-slate-500')}>{fmtDate(w.startDate, 'd MMM')}</p>
              <div className={cn('mt-1.5 h-1 rounded-full', active ? 'bg-navy-500' : 'bg-slate-100')}>
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${rate}%` }} />
              </div>
            </button>
          )
        })}
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-900">Week {week.number}: {week.focus}</h2>
              <SkillBadge skill={week.skill} />
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{fmtDate(week.startDate, 'EEE d MMM')} – {fmtDate(week.endDate, 'EEE d MMM yyyy')}</p>
          </div>
          <div className="w-full sm:w-48">
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>{weekTasks.filter((t) => completions[t.id]).length}/{weekTasks.length} done</span>
              <span>{completionRate(weekTasks, completions)}%</span>
            </div>
            <Progress value={completionRate(weekTasks, completions)} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn('rounded-full px-3 py-1 text-xs font-medium', filter === f.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Desktop table */}
      <Card className="hidden overflow-hidden md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-12 px-4 py-3">Done</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Time</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Activity</th>
              <th className="px-3 py-3 text-right">Duration</th>
              {isTeacher && <th className="w-20 px-3 py-3" />}
            </tr>
          </thead>
          <tbody>
            {Object.entries(byDate).map(([date, items]) =>
              items.map((t, i) => {
                const done = !!completions[t.id]
                return (
                  <tr key={t.id} className={cn('border-b border-slate-100 align-top last:border-0', date === today && 'bg-navy-50/50', done && 'bg-emerald-50/40')}>
                    <td className="px-4 py-3">
                      <Checkbox checked={done} disabled={isTeacher} onChange={(d) => toggle(t, d)} label={`Mark "${t.title}" as done`} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {i === 0 && (
                        <span className={cn('font-medium', date === today ? 'text-navy-700' : 'text-slate-700')}>
                          {fmtDate(date)}
                          {date === today && <span className="ml-1.5 rounded bg-navy-700 px-1.5 py-0.5 text-[10px] text-white">TODAY</span>}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">{t.startTime ? `${t.startTime}–${t.endTime}` : '—'}</td>
                    <td className="px-3 py-3"><TaskTypeBadge type={t.type} /></td>
                    <td className="px-3 py-3">
                      <p className={cn('font-medium', done ? 'text-slate-500 line-through' : 'text-slate-900')}>{t.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{t.description}</p>
                      {t.dueDate && <p className="mt-1 text-xs font-medium text-amber-700">Due {fmtDate(t.dueDate)}</p>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-slate-600">{t.durationMin} min</td>
                    {isTeacher && <td className="px-3 py-2">{rowActions(t)}</td>}
                  </tr>
                )
              }),
            )}
          </tbody>
        </table>
        {visible.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No tasks for this filter.</p>}
      </Card>

      {/* Mobile list grouped by day */}
      <div className="space-y-5 md:hidden">
        {Object.entries(byDate).map(([date, items]) => (
          <section key={date}>
            <h3 className={cn('mb-2 text-sm font-semibold', date === today ? 'text-navy-700' : 'text-slate-700')}>
              {fmtDate(date, 'EEEE d MMM')} {date === today && <span className="ml-1 rounded bg-navy-700 px-1.5 py-0.5 text-[10px] text-white">TODAY</span>}
            </h3>
            <div className="space-y-2">
              {items.map((t) => (
                <TaskItem key={t.id} task={t} completion={completions[t.id]} canToggle={!isTeacher} onToggle={(d) => toggle(t, d)} actions={rowActions(t)} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <TaskForm open={formOpen} onClose={() => setFormOpen(false)} onSave={upsertTask} initial={editing} defaults={{ date: week.startDate }} />
    </>
  )
}

function typeOrder(t: TaskType) {
  return { teacher_session: 0, self_study: 1, homework: 2 }[t]
}

function groupBy<T>(items: T[], key: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    ;(acc[key(item)] ??= []).push(item)
    return acc
  }, {})
}
