import { describe, expect, test } from 'vitest'
import { courseWeeks, currentWeek, stageInWeek, weekOf } from '@/lib/weeks'
import type { Skill, StageEntry } from '@/types'

const course = { startDate: '2026-10-19', endDate: '2027-04-19' }

describe('courseWeeks', () => {
  test('the Course 19 Oct 2026 to 19 Apr 2027 has 27 Weeks, Week 1 is 19–25 Oct', () => {
    const weeks = courseWeeks(course)
    expect(weeks).toHaveLength(27)
    expect(weeks[0]).toEqual({ number: 1, startDate: '2026-10-19', endDate: '2026-10-25' })
    expect(weeks[1]).toEqual({ number: 2, startDate: '2026-10-26', endDate: '2026-11-01' })
  })

  test('moving the end date changes the number of Weeks, and the last Week stops at the end date', () => {
    expect(courseWeeks({ ...course, endDate: '2027-04-18' })).toHaveLength(26)
    const weeks = courseWeeks({ ...course, endDate: '2027-05-05' })
    expect(weeks).toHaveLength(29)
    expect(weeks[28]).toEqual({ number: 29, startDate: '2027-05-03', endDate: '2027-05-05' })
  })
})

describe('weekOf', () => {
  const weeks = courseWeeks(course)

  test('a date falls in the Week that holds it', () => {
    expect(weekOf(weeks, '2026-10-23')?.number).toBe(1)
    expect(weekOf(weeks, '2026-10-26')?.number).toBe(2)
    expect(weekOf(weeks, '2027-04-19')?.number).toBe(27)
  })

  test('a date outside the Course dates belongs to no Week', () => {
    expect(weekOf(weeks, '2026-10-18')).toBeUndefined()
    expect(weekOf(weeks, '2027-04-20')).toBeUndefined()
  })
})

describe('currentWeek', () => {
  const weeks = courseWeeks(course)

  test('the Week holding today, clamped to the first or last Week', () => {
    expect(currentWeek(weeks, '2026-11-20')?.number).toBe(5)
    expect(currentWeek(weeks, '2026-10-01')?.number).toBe(1)
    expect(currentWeek(weeks, '2027-06-01')?.number).toBe(27)
  })
})

describe('stageInWeek', () => {
  const weeks = courseWeeks(course)
  const entries: StageEntry[] = [
    { skill: 'Listening', stage: 'foundation', enteredOn: '2026-10-19' },
    { skill: 'Listening', stage: 'diagnosis', enteredOn: '2026-11-20' },
    { skill: 'Reading', stage: 'foundation', enteredOn: '2026-11-25' },
  ]
  const stageIn = (skill: Skill, n: number, today = '2026-12-01') => stageInWeek(entries, skill, weeks[n - 1], today)

  test('Foundation for Weeks 1–4, Diagnosis from the Week holding the advance', () => {
    expect([1, 2, 3, 4].map((n) => stageIn('Listening', n))).toEqual(['foundation', 'foundation', 'foundation', 'foundation'])
    expect(stageIn('Listening', 5)).toBe('diagnosis')
    expect(stageIn('Listening', 6)).toBe('diagnosis')
  })

  test('nothing for Weeks before the track started, or for a track never started', () => {
    expect(stageIn('Reading', 5)).toBeNull()
    expect(stageIn('Reading', 6)).toBe('foundation')
    expect(stageIn('Writing', 6)).toBeNull()
  })

  test('nothing for a Week after today, even with the track started', () => {
    expect(stageIn('Listening', 8, '2026-12-06')).toBeNull()
    expect(stageIn('Listening', 8, '2026-12-07')).toBe('diagnosis')
  })
})
