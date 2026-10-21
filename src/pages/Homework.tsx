import { useState } from 'react'
import { CheckCircle2, Plus, RotateCcw } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn, fmtDate } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { TaskForm } from '@/components/TaskForm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Badge, SkillBadge } from '@/components/ui/badge'
import type { StudyTask } from '@/types'

type Tab = 'todo' | 'done' | 'all'

export function Homework() {
  const { user, tasks, completions, today, setCompletion, upsertTask } = useStore()
  const isStudent = user?.role === 'student'
  const [tab, setTab] = useState<Tab>('todo')
  const [formOpen, setFormOpen] = useState(false)

  const assigned = tasks.filter((t) => t.type === 'homework' && t.date <= today)
  const todo = assigned.filter((t) => !completions[t.id]).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
  const done = assigned.filter((t) => completions[t.id]).sort((a, b) => b.dueDate!.localeCompare(a.dueDate!))
  const list = tab === 'todo' ? todo : tab === 'done' ? done : [...todo, ...done]

  const tabs: { value: Tab; label: string; count: number }[] = [
    { value: 'todo', label: 'To do', count: todo.length },
    { value: 'done', label: 'Completed', count: done.length },
    { value: 'all', label: 'All', count: assigned.length },
  ]

  return (
    <>
      <PageHeader
        title="Homework"
        subtitle={`${todo.length} pending · ${todo.filter((t) => t.dueDate! < today).length} overdue`}
        actions={!isStudent && <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Assign homework</Button>}
      />

      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn('rounded-md px-3 py-1.5 text-sm font-medium', tab === t.value ? 'bg-navy-700 text-white' : 'text-slate-600 hover:bg-slate-50')}
          >
            {t.label} <span className="ml-1 opacity-70">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {list.map((t) => (
          <HomeworkCard key={t.id} task={t} today={today} isStudent={isStudent} completion={completions[t.id]} onSave={(data) => setCompletion(t.id, data)} />
        ))}
        {list.length === 0 && <p className="text-sm text-slate-500">Nothing here.</p>}
      </div>

      <TaskForm open={formOpen} onClose={() => setFormOpen(false)} onSave={upsertTask} defaults={{ type: 'homework', date: today, dueDate: today, durationMin: 45 }} />
    </>
  )
}

interface HomeworkCardProps {
  task: StudyTask
  today: string
  isStudent: boolean
  completion?: { completedAt: string; score?: string; note?: string }
  onSave: (data: { score?: string; note?: string } | null) => void
}

function HomeworkCard({ task, today, isStudent, completion, onSave }: HomeworkCardProps) {
  const [submitting, setSubmitting] = useState(false)
  const [score, setScore] = useState('')
  const [note, setNote] = useState('')
  const due = task.dueDate!
  const overdue = !completion && due < today

  return (
    <Card className={cn('p-4', completion && 'border-emerald-200', overdue && 'border-red-200')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{task.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <SkillBadge skill={task.skill} />
            <span>Assigned {fmtDate(task.date, 'd MMM')}</span>
          </div>
        </div>
        {completion ? (
          <Badge tone="green">Done</Badge>
        ) : overdue ? (
          <Badge tone="red">Overdue · {fmtDate(due, 'd MMM')}</Badge>
        ) : (
          <Badge tone={due === today ? 'amber' : 'slate'}>{due === today ? 'Due today' : `Due ${fmtDate(due, 'd MMM')}`}</Badge>
        )}
      </div>
      <p className="mt-3 text-sm text-slate-600">{task.description}</p>

      {completion && (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-lg bg-emerald-50 p-3 text-sm">
          <div className="space-y-0.5">
            <p className="flex items-center gap-1.5 font-medium text-emerald-800"><CheckCircle2 className="h-4 w-4" /> Completed {fmtDate(completion.completedAt, 'd MMM')}</p>
            {completion.score && <p className="text-slate-700">Score: <b>{completion.score}</b></p>}
            {completion.note && <p className="text-slate-600">“{completion.note}”</p>}
          </div>
          {isStudent && (
            <Button variant="ghost" size="sm" onClick={() => onSave(null)}><RotateCcw className="h-3.5 w-3.5" /> Undo</Button>
          )}
        </div>
      )}

      {!completion && isStudent && !submitting && (
        <Button variant="success" size="sm" className="mt-3" onClick={() => setSubmitting(true)}>Mark as done</Button>
      )}
      {!completion && !isStudent && <p className="mt-3 text-xs text-slate-400">Waiting for student</p>}

      {submitting && !completion && (
        <div className="mt-3 space-y-2 rounded-lg border border-slate-200 p-3">
          <Input placeholder="Score (e.g. 8/10)" value={score} onChange={(e) => setScore(e.target.value)} />
          <Textarea placeholder="Notes or difficulties (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-16" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setSubmitting(false)}>Cancel</Button>
            <Button variant="success" size="sm" onClick={() => onSave({ score: score || undefined, note: note || undefined })}>Save</Button>
          </div>
        </div>
      )}
    </Card>
  )
}
