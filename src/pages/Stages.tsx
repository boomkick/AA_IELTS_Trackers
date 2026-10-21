import { useState } from 'react'
import { Check, Pencil, Plus, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { TRACKS, gateStatus, stageDef, goalOverdue, stagePosition, startsAfterLabel, type StageDef } from '@/lib/stages'
import { cn, fmtDate } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { GoalForm } from '@/components/GoalForm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge, SkillBadge } from '@/components/ui/badge'
import type { Goal, GoalDraft, Track } from '@/types'


export function Stages() {
  const { user, tracks, goals, goalsDone, results, today, setGoalDone, upsertGoal, deleteGoal } = useStore()
  const isTeacher = user?.role === 'teacher'
  const [editing, setEditing] = useState<GoalDraft | null>(null)

  const doneIds = new Set(Object.keys(goalsDone))
  const goalsOf = (t: Track, s: StageDef) => goals.filter((g) => g.skill === t.skill && g.stage === s.key)

  const addGoal = (t: Track, s: StageDef) => {
    const existing = goalsOf(t, s)
    setEditing({ skill: t.skill, stage: s.key, title: '', description: '', sortOrder: Math.max(0, ...existing.map((g) => g.sortOrder)) + 1 })
  }
  const remove = (g: Goal) => {
    if (confirm(`Delete "${g.title}"? The student's tick on it is removed too.`)) deleteGoal(g.id)
  }

  function goalRow(goal: Goal, editable: boolean) {
    const done = doneIds.has(goal.id)
    const overdue = goalOverdue(goal, done, today)
    return (
      <li key={goal.id} className="flex gap-2.5 py-2">
        <div className="pt-0.5">
          <Checkbox checked={done} disabled={isTeacher || !editable} onChange={(d) => setGoalDone(goal.id, d)} label={`Mark "${goal.title}" as done`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-medium', done ? 'text-slate-500 line-through' : 'text-slate-900')}>{goal.title}</p>
          {goal.description && <p className="mt-0.5 text-xs text-slate-500">{goal.description}</p>}
          {goal.dueDate && (
            <p className={cn('mt-0.5 text-xs font-medium', overdue ? 'text-red-600' : 'text-slate-500')}>
              Due {fmtDate(goal.dueDate)}{overdue && ' · overdue'}
            </p>
          )}
        </div>
        {isTeacher && editable && (
          <div className="flex shrink-0 gap-0.5">
            <Button variant="ghost" size="icon" onClick={() => setEditing(goal)} aria-label={`Edit "${goal.title}"`}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => remove(goal)} aria-label={`Delete "${goal.title}"`}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
          </div>
        )}
      </li>
    )
  }

  function goalList(list: Goal[], editable: boolean) {
    if (list.length === 0) return <p className="py-2 text-sm text-slate-500">No Goals yet.</p>
    return (
      <ul className="divide-y divide-slate-100">
        {list.map((g) => goalRow(g, editable))}
      </ul>
    )
  }

  return (
    <>
      <PageHeader title="Stages" subtitle="Each skill moves through its Stages. Finish the Goals of the current Stage to meet its Gate." />

      <div className="grid gap-4 md:grid-cols-3">
        {tracks.map((t) => {
          const current = t.stage && stageDef(t.skill, t.stage)
          return (
            <Card key={t.skill} className="p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <SkillBadge skill={t.skill} />
                {current
                  ? <span className="text-xs text-slate-500">{current.name} since {fmtDate(t.enteredOn!)}</span>
                  : <span className="text-xs text-slate-500">{startsAfterLabel(t.skill) ?? 'Not started'}</span>}
              </div>

              <ol className="space-y-2">
                {TRACKS[t.skill].stages.map((s) => {
                  const position = stagePosition(t, s.key)
                  const list = goalsOf(t, s)
                  if (position === 'current') {
                    const gate = gateStatus(t, goals, doneIds, results)
                    return (
                      <li key={s.key} className="rounded-lg border border-navy-200 bg-navy-50/40 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="font-semibold text-slate-900">{s.name}</h2>
                          <Badge tone={gate.met ? 'green' : 'slate'}>{gate.label}</Badge>
                        </div>
                        {goalList(list, true)}
                        {isTeacher && (
                          <Button variant="outline" size="sm" className="mt-2" onClick={() => addGoal(t, s)}>
                            <Plus className="h-4 w-4" /> Add Goal
                          </Button>
                        )}
                      </li>
                    )
                  }
                  return (
                    <li key={s.key}>
                      <details className={cn('group rounded-lg border border-slate-200 px-3 py-2', position === 'future' && 'opacity-50')}>
                        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-slate-700">
                          {position === 'past' ? <Check className="h-4 w-4 text-emerald-600" /> : <span className="h-4 w-4" />}
                          {s.name}
                          <span className="ml-auto text-xs font-normal text-slate-400">{list.length} Goals</span>
                        </summary>
                        {goalList(list, false)}
                      </details>
                    </li>
                  )
                })}
              </ol>
            </Card>
          )
        })}
      </div>

      {editing && <GoalForm open onClose={() => setEditing(null)} onSave={upsertGoal} initial={editing} />}
    </>
  )
}
