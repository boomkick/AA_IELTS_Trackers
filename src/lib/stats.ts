import { parseISO, subDays } from 'date-fns'
import { toISO } from '@/lib/utils'
import type { Completion, StudyTask, StudyWeek } from '@/types'

export function completionRate(tasks: StudyTask[], completions: Record<string, Completion>) {
  if (tasks.length === 0) return 0
  return Math.round((tasks.filter((t) => completions[t.id]).length / tasks.length) * 100)
}

/** Consecutive days (ending today, or yesterday if nothing done yet today) with at least one completion. */
export function currentStreak(completions: Record<string, Completion>, today: string) {
  const days = new Set(Object.values(completions).map((c) => c.completedAt))
  let cursor = parseISO(today)
  if (!days.has(today)) cursor = subDays(cursor, 1)
  let streak = 0
  while (days.has(toISO(cursor))) {
    streak++
    cursor = subDays(cursor, 1)
  }
  return streak
}

/** Week containing `date`; clamps to the first/last week outside the plan. */
export function weekOf(weeks: StudyWeek[], date: string): StudyWeek | undefined {
  if (weeks.length === 0) return undefined
  return weeks.find((w) => date >= w.startDate && date <= w.endDate) ?? (date < weeks[0].startDate ? weeks[0] : weeks[weeks.length - 1])
}
