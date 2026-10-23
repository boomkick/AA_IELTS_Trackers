// Weeks of the Course and the Missions in them. A Week is a seven-day block from the Course start date (a Monday);
// Weeks are computed from the Course dates, never stored. Dates are ISO yyyy-MM-dd strings.
import { addDays, differenceInCalendarDays, parseISO } from 'date-fns'
import { toISO } from '@/lib/utils'
import type { Course, Mission, MissionType, Skill, StageEntry, StageKey, Week } from '@/types'

/** Week 1 starts on the Course start date; there are ceil((end − start + 1) / 7) Weeks. The last one stops at the end date. */
export function courseWeeks(course: Course): Week[] {
  const start = parseISO(course.startDate)
  const count = Math.ceil((differenceInCalendarDays(parseISO(course.endDate), start) + 1) / 7)
  return Array.from({ length: Math.max(0, count) }, (_, i) => {
    const end = toISO(addDays(start, i * 7 + 6))
    return { number: i + 1, startDate: toISO(addDays(start, i * 7)), endDate: end < course.endDate ? end : course.endDate }
  })
}

/** The Week holding `date`; undefined outside the Course dates. */
export function weekOf(weeks: Week[], date: string): Week | undefined {
  return weeks.find((w) => date >= w.startDate && date <= w.endDate)
}

/** The Week holding today, clamped to the first or last Week. Undefined only when there are no Weeks. */
export function currentWeek(weeks: Week[], today: string): Week | undefined {
  if (weeks.length === 0) return undefined
  return weekOf(weeks, today) ?? (today < weeks[0].startDate ? weeks[0] : weeks[weeks.length - 1])
}

/** The Stage `skill` was in during `week`: its latest Stage history entry on or before the Week's last day.
 *  Null for Weeks before the track started and for Weeks after today. */
export function stageInWeek(entries: StageEntry[], skill: Skill, week: Week, today: string): StageKey | null {
  if (week.startDate > today) return null
  let latest: StageEntry | null = null
  for (const e of entries)
    if (e.skill === skill && e.enteredOn <= week.endDate && (!latest || e.enteredOn >= latest.enteredOn)) latest = e
  return latest?.stage ?? null
}

export const MISSION_TYPE_LABEL: Record<MissionType, string> = { teacher_session: 'Class', self_study: 'Self-study', homework: 'Homework' }

/** The Missions dated inside `week`, in date order as given. */
export function missionsOfWeek(missions: Mission[], week: Week): Mission[] {
  return missions.filter((m) => m.date >= week.startDate && m.date <= week.endDate)
}

/** Share of `missions` ticked done, 0–100. 0 for none. */
export function doneRate(missions: Mission[], done: Record<string, string>): number {
  return missions.length === 0 ? 0 : Math.round((missions.filter((m) => done[m.id]).length / missions.length) * 100)
}
