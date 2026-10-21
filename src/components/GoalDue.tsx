import { goalOverdue } from '@/lib/stages'
import { cn, fmtDate } from '@/lib/utils'
import type { Goal } from '@/types'

/** "Due {date}", red with "· overdue" once an open Goal's due date has passed. Nothing without a due date. */
export function GoalDue({ goal, done, today }: { goal: Goal; done: boolean; today: string }) {
  if (!goal.dueDate) return null
  const overdue = goalOverdue(goal, done, today)
  return (
    <p className={cn('mt-0.5 text-xs font-medium', overdue ? 'text-red-600' : 'text-slate-500')}>
      Due {fmtDate(goal.dueDate)}{overdue && ' · overdue'}
    </p>
  )
}
