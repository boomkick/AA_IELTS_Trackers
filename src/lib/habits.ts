// Habit rhythms, weekly counts and streaks. Dates are ISO yyyy-MM-dd strings.
import { parseISO, startOfWeek, subDays } from 'date-fns'
import { toISO } from '@/lib/utils'

/** A rhythm of 7 times a week is a daily Habit. */
export const DAILY = 7

/** The rhythms a Habit can have, daily first. */
export const RHYTHMS = [7, 6, 5, 4, 3, 2, 1]

export const isDaily = (timesPerWeek: number) => timesPerWeek === DAILY

export function rhythmLabel(timesPerWeek: number): string {
  return isDaily(timesPerWeek) ? 'daily' : `${timesPerWeek}× a week`
}

/** Ticks in the Monday-to-Sunday week holding `today`, up to and including today. */
export function weekCount(tickDates: string[], today: string): number {
  const monday = toISO(startOfWeek(parseISO(today), { weekStartsOn: 1 }))
  return tickDates.filter((d) => d >= monday && d <= today).length
}

/** Consecutive ticked days ending today, or ending yesterday if today is not ticked yet. */
export function streak(tickDates: string[], today: string): number {
  const ticked = new Set(tickDates)
  let day = parseISO(today)
  if (!ticked.has(today)) day = subDays(day, 1)
  let count = 0
  while (ticked.has(toISO(day))) {
    count++
    day = subDays(day, 1)
  }
  return count
}
