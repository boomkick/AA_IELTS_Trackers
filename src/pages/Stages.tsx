import { useState } from 'react'
import { ArrowRight, CalendarDays, Check, Pencil, Plus, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { TRACKS, canStart, firstStage, gateStatus, nextStage, stageDef, goalOverdue, stagePosition, startsAfterLabel, type StageDef } from '@/lib/stages'
import { cn, fmtDate } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { GoalForm } from '@/components/GoalForm'
import { HabitForm } from '@/components/HabitForm'
import { DAILY } from '@/lib/habits'
import { nextFullTestDue, weeksLeftLabel } from '@/lib/stats'
import { HabitItem } from '@/components/HabitItem'
import { CourseEndForm } from '@/components/CourseEndForm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge, SkillBadge } from '@/components/ui/badge'
import type { Goal, GoalDraft, Habit, HabitDraft, Skill, Track } from '@/types'

export function Stages() {
  const {
    user, course, tracks, goals, goalsDone, habits, results, today,
    setCourseEnd, setTrackStage, setGoalDone, upsertGoal, deleteGoal, upsertHabit, deleteHabit,
  } = useStore()
  const isTeacher = user?.role === 'teacher'
  const [editingGoal, setEditingGoal] = useState<GoalDraft | null>(null)
  const [editingHabit, setEditingHabit] = useState<HabitDraft | null>(null)
  const [editingEnd, setEditingEnd] = useState(false)

  const doneIds = new Set(Object.keys(goalsDone))
  const goalsOf = (t: Track, s: StageDef) => goals.filter((g) => g.skill === t.skill && g.stage === s.key)
  const habitsOf = (t: Track, s: StageDef) => habits.filter((h) => h.skill === t.skill && h.stage === s.key)

  const addHabit = (t: Track, s: StageDef) => {
    const existing = habitsOf(t, s)
    setEditingHabit({ skill: t.skill, stage: s.key, title: '', description: '', timesPerWeek: DAILY, sortOrder: Math.max(0, ...existing.map((h) => h.sortOrder)) + 1 })
  }
  const start = (skill: Skill) => {
    const first = firstStage(skill)
    if (confirm(`Start ${skill}? It enters ${first.name} today.`)) setTrackStage(skill, first.key)
  }
  const advance = (skill: Skill, next: StageDef) => {
    if (confirm(`Advance ${skill} to ${next.name}? The new Stage starts today, and its Gate counts results from today.`)) setTrackStage(skill, next.key)
  }
  const removeHabit = (h: Habit) => {
    if (confirm(`Delete "${h.title}"? The student's ticks on it are removed too.`)) deleteHabit(h.id)
  }

  const addGoal = (t: Track, s: StageDef) => {
    const existing = goalsOf(t, s)
    setEditingGoal({ skill: t.skill, stage: s.key, title: '', description: '', sortOrder: Math.max(0, ...existing.map((g) => g.sortOrder)) + 1 })
  }
  const removeGoal = (g: Goal) => {
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
            <Button variant="ghost" size="icon" onClick={() => setEditingGoal(goal)} aria-label={`Edit "${goal.title}"`}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => removeGoal(goal)} aria-label={`Delete "${goal.title}"`}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
          </div>
        )}
      </li>
    )
  }

  function habitRow(habit: Habit) {
    const actions = isTeacher && (
      <>
        <Button variant="ghost" size="icon" onClick={() => setEditingHabit(habit)} aria-label={`Edit "${habit.title}"`}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" onClick={() => removeHabit(habit)} aria-label={`Delete "${habit.title}"`}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
      </>
    )
    return <HabitItem key={habit.id} habit={habit} actions={actions} />
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
      <PageHeader
        title="Stages"
        subtitle={
          course
            ? `${weeksLeftLabel(course, today)} · Course ends ${fmtDate(course.endDate, 'd MMM yyyy')}`
            : 'Each skill moves through its Stages. Finish the Goals of the current Stage to meet its Gate.'
        }
        actions={isTeacher && course && (
          <Button variant="outline" onClick={() => setEditingEnd(true)}><CalendarDays className="h-4 w-4" /> Course end date</Button>
        )}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {tracks.map((t) => {
          const current = t.stage && stageDef(t.skill, t.stage)
          const startable = canStart(t.skill, tracks)
          return (
            <Card key={t.skill} className="p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <SkillBadge skill={t.skill} />
                {current
                  ? <span className="text-xs text-slate-500">{current.name} since {fmtDate(t.enteredOn!)}</span>
                  : <span className="text-xs text-slate-500">{startable ? 'Not started' : (startsAfterLabel(t.skill) ?? 'Not started')}</span>}
              </div>

              {isTeacher && startable && (
                <Button className="mb-3 w-full" onClick={() => start(t.skill)}>
                  Start {t.skill} <ArrowRight className="h-4 w-4" />
                </Button>
              )}

              <ol className="space-y-2">
                {TRACKS[t.skill].stages.map((s) => {
                  const position = stagePosition(t, s.key)
                  const list = goalsOf(t, s)
                  if (position === 'current') {
                    const gate = gateStatus(t, goals, doneIds, results)
                    const stageHabits = habitsOf(t, s)
                    const nextKey = nextStage(t.skill, s.key)
                    const next = nextKey && stageDef(t.skill, nextKey)
                    const nextTest = nextFullTestDue(t, results)
                    return (
                      <li key={s.key} className="rounded-lg border border-navy-200 bg-navy-50/40 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="font-semibold text-slate-900">{s.name}</h2>
                          <Badge tone={gate.met ? 'green' : 'slate'}>{gate.label}</Badge>
                        </div>
                        {nextTest && <p className="mt-1 text-xs text-slate-500">Next Full test due {fmtDate(nextTest)}</p>}
                        {goalList(list, true)}
                        {isTeacher && (
                          <Button variant="outline" size="sm" className="mt-2" onClick={() => addGoal(t, s)}>
                            <Plus className="h-4 w-4" /> Add Goal
                          </Button>
                        )}

                        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Habits</h3>
                        {stageHabits.length === 0
                          ? <p className="py-2 text-sm text-slate-500">No Habits yet.</p>
                          : <ul className="divide-y divide-slate-100">{stageHabits.map(habitRow)}</ul>}
                        {isTeacher && (
                          <Button variant="outline" size="sm" className="mt-2" onClick={() => addHabit(t, s)}>
                            <Plus className="h-4 w-4" /> Add Habit
                          </Button>
                        )}

                        {isTeacher && next && (
                          <Button variant={gate.met ? 'primary' : 'outline'} className="mt-4 w-full" onClick={() => advance(t.skill, next)}>
                            Advance to {next.name} <ArrowRight className="h-4 w-4" />
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

      {editingGoal && <GoalForm open onClose={() => setEditingGoal(null)} onSave={upsertGoal} initial={editingGoal} />}
      {editingHabit && <HabitForm open onClose={() => setEditingHabit(null)} onSave={upsertHabit} initial={editingHabit} />}
      {editingEnd && course && <CourseEndForm course={course} onClose={() => setEditingEnd(false)} onSave={setCourseEnd} />}
    </>
  )
}
