import { parseISO, subDays } from 'date-fns'
import { toISO } from '@/lib/utils'
import { QUESTION_TYPES, type QuestionType } from '@/lib/stages'
import type { Completion, StudyTask, StudyWeek, TestResult } from '@/types'

/** Questions in a Full test, and in each of the four Listening Sections. */
export const FULL_TEST_QUESTIONS = 40
export const SECTION_QUESTIONS = 10

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

/** The weakest part of a Full test: the Listening Section with the fewest correct (ties go to the lower Section),
 *  or the Reading Question type with the most wrong answers. Null when nothing was wrong or there is no detail. */
export function weakestArea(result: TestResult): string | null {
  if (result.sectionCorrect) {
    const scores = result.sectionCorrect
    const lowest = Math.min(...scores)
    return lowest < SECTION_QUESTIONS ? `Section ${scores.indexOf(lowest) + 1}` : null
  }
  // walk the Question types in their fixed order so ties don't depend on how the row was stored
  const wrong = result.wrongByType ?? {}
  let worst: QuestionType | null = null
  for (const q of QUESTION_TYPES) if ((wrong[q] ?? 0) > (worst ? wrong[worst]! : 0)) worst = q
  return worst
}
