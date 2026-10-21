import { Link } from 'react-router-dom'
import { CalendarCheck, CheckCircle2, Flame, Target } from 'lucide-react'
import { useStore } from '@/lib/store'
import { completionRate, currentStreak, weekOf } from '@/lib/stats'
import { cn, fmtDate } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { TaskItem } from '@/components/TaskItem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { SkillBadge } from '@/components/ui/badge'

export function Dashboard() {
  const { user, weeks, tasks, completions, today, setCompletion } = useStore()
  const isStudent = user?.role === 'student'

  const todayTasks = tasks.filter((t) => t.date === today && t.type !== 'homework').sort((a, b) => (a.startTime ?? '99').localeCompare(b.startTime ?? '99'))
  const todayDone = todayTasks.filter((t) => completions[t.id]).length

  const homework = tasks.filter((t) => t.type === 'homework' && !completions[t.id] && t.date <= today).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
  const overdue = homework.filter((t) => t.dueDate! < today)

  const week = weekOf(weeks, today)! // AppShell only renders pages once weeks are loaded
  const beforePlan = today < weeks[0].startDate
  const afterPlan = today > weeks[weeks.length - 1].endDate
  const weekTasks = tasks.filter((t) => t.weekNumber === week.number)
  const dueSoFar = tasks.filter((t) => (t.dueDate ?? t.date) < today)
  const doneTotal = tasks.filter((t) => completions[t.id]).length

  const nextSession = tasks
    .filter((t) => t.type === 'teacher_session' && t.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  return (
    <>
      <PageHeader
        title={`Hello, ${user?.displayName}`}
        subtitle={
          beforePlan
            ? `${fmtDate(today, 'EEEE, d MMMM')} · The plan starts on ${fmtDate(weeks[0].startDate, 'EEEE d MMMM')}`
            : afterPlan
              ? `${fmtDate(today, 'EEEE, d MMMM')} · The plan has finished`
              : `${fmtDate(today, 'EEEE, d MMMM')} · Week ${week.number} of ${weeks.length} · ${week.focus}`
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Today" value={`${todayDone}/${todayTasks.length}`} hint="tasks completed" icon={CalendarCheck} />
        <StatCard label="Overall" value={`${completionRate(tasks, completions)}%`} hint={`${doneTotal} of ${tasks.length} tasks`} icon={Target}>
          <Progress value={completionRate(tasks, completions)} className="mt-2" />
        </StatCard>
        <StatCard label="Streak" value={`${currentStreak(completions, today)} days`} hint="in a row" icon={Flame} />
        <StatCard label="On track" value={`${completionRate(dueSoFar, completions)}%`} hint="of tasks due so far" icon={CheckCircle2} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today’s tasks</CardTitle>
            <span className="text-sm text-slate-500">{todayDone} done · {todayTasks.length - todayDone} remaining</span>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayTasks.length === 0 && <p className="text-sm text-slate-500">No tasks scheduled today.</p>}
            {todayTasks.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                completion={completions[t.id]}
                canToggle={isStudent}
                onToggle={(done) => setCompletion(t.id, done ? {} : null)}
              />
            ))}
            {!isStudent && <p className="pt-1 text-xs text-slate-400">Only the student can tick tasks. You see their status here.</p>}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>This week</CardTitle>
              <SkillBadge skill={week.skill} />
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-slate-800">{week.focus}</p>
              <p className="mt-0.5 text-xs text-slate-500">{fmtDate(week.startDate, 'd MMM')} – {fmtDate(week.endDate, 'd MMM')}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{weekTasks.filter((t) => completions[t.id]).length} of {weekTasks.length} tasks</span>
                <span>{completionRate(weekTasks, completions)}%</span>
              </div>
              <Progress value={completionRate(weekTasks, completions)} className="mt-1" />
              {nextSession && (
                <div className="mt-4 rounded-lg bg-navy-50 p-3">
                  <p className="text-xs font-medium text-navy-700">Next class</p>
                  <p className="text-sm font-medium text-slate-900">{nextSession.title}</p>
                  <p className="text-xs text-slate-500">{fmtDate(nextSession.date)} · {nextSession.startTime}–{nextSession.endTime}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Homework</CardTitle>
              <Link to="/homework" className="text-sm font-medium text-navy-600 hover:underline">View all</Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {homework.length === 0 && <p className="text-sm text-slate-500">All caught up.</p>}
              {homework.slice(0, 4).map((t) => (
                <div key={t.id} className="flex items-start justify-between gap-3">
                  <p className="text-sm text-slate-800">{t.title}</p>
                  <span className={cn('shrink-0 text-xs font-medium', t.dueDate! < today ? 'text-red-600' : t.dueDate === today ? 'text-amber-700' : 'text-slate-500')}>
                    {t.dueDate! < today ? 'Overdue' : t.dueDate === today ? 'Due today' : fmtDate(t.dueDate!, 'd MMM')}
                  </span>
                </div>
              ))}
              {overdue.length > 0 && <p className="text-xs text-red-600">{overdue.length} overdue</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
