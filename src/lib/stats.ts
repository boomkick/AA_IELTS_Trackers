import { addDays, differenceInCalendarDays, parseISO } from 'date-fns'
import { toISO } from '@/lib/utils'
import { QUESTION_TYPES, stagePosition, type QuestionType } from '@/lib/stages'
import type { Course, TestResult, Track } from '@/types'

/** Questions in a Full test, and in each of the four Listening Sections. */
export const FULL_TEST_QUESTIONS = 40
export const SECTION_QUESTIONS = 10

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

/** Whole weeks until the Course ends: remaining days / 7, rounded up, never below 0. */
export function weeksLeft(course: Course, today: string): number {
  return Math.max(0, Math.ceil(differenceInCalendarDays(parseISO(course.endDate), parseISO(today)) / 7))
}

/** e.g. "26 weeks left", "1 week left". */
export function weeksLeftLabel(course: Course, today: string): string {
  const n = weeksLeft(course, today)
  return `${n} ${n === 1 ? 'week' : 'weeks'} left`
}

/** Days between Full tests once a skill reaches Focus. */
const FULL_TEST_EVERY_DAYS = 56

/** Listening and Reading from Focus on: the skill's latest Full test + 56 days. Null otherwise, or with no Full test yet. */
export function nextFullTestDue(track: Track, results: TestResult[]): string | null {
  if (track.skill === 'Writing' || stagePosition(track, 'focus') === 'future') return null
  const latest = results.filter((r) => r.skill === track.skill).reduce<string | null>((max, r) => (max && max > r.date ? max : r.date), null)
  return latest ? toISO(addDays(parseISO(latest), FULL_TEST_EVERY_DAYS)) : null
}
