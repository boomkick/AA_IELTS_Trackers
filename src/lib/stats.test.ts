import { describe, expect, test } from 'vitest'
import { nextFullTestDue, weakestArea, weeksLeft, weeksLeftLabel } from '@/lib/stats'
import type { SectionScores, TestResult } from '@/types'

describe('weakestArea', () => {
  const listening = (sectionCorrect: SectionScores): TestResult => ({ id: 'x', date: '2026-11-20', skill: 'Listening', band: 6, sectionCorrect })
  const reading = (wrongByType: TestResult['wrongByType']): TestResult => ({ id: 'x', date: '2026-11-20', skill: 'Reading', band: 6, wrongByType })

  test('Listening: the Section with the fewest correct', () => {
    expect(weakestArea(listening([9, 6, 7, 5]))).toBe('Section 4')
  })

  test('Listening: ties go to the lower Section number', () => {
    expect(weakestArea(listening([9, 5, 5, 8]))).toBe('Section 2')
  })

  test('Reading: the Question type with the most wrong answers', () => {
    expect(weakestArea(reading({ 'Yes / No / Not Given': 2, 'Matching headings': 4 }))).toBe('Matching headings')
  })

  test('nothing wrong, no detail recorded, or a Writing result: no weakest area', () => {
    expect(weakestArea(reading({}))).toBeNull()
    expect(weakestArea({ id: 'x', date: '2026-11-20', skill: 'Reading', band: 6, correct: 30, total: 40 })).toBeNull()
    expect(weakestArea({ id: 'x', date: '2026-11-20', skill: 'Listening', band: 6, correct: 30, total: 40 })).toBeNull()
    expect(weakestArea({ id: 'x', date: '2026-11-20', skill: 'Writing', band: 5.5, writingTask: 2 })).toBeNull()
  })
})

describe('weakestArea edge cases', () => {
  test('a Listening result with every Section full has no weakest area', () => {
    expect(weakestArea({ id: 'x', date: '2026-11-20', skill: 'Listening', band: 9, sectionCorrect: [10, 10, 10, 10] })).toBeNull()
  })

  test('Reading ties go to the Question type listed first, whatever order they were saved in', () => {
    const wrongByType = { 'Short-answer questions': 3, 'Matching headings': 3 }
    expect(weakestArea({ id: 'x', date: '2026-11-20', skill: 'Reading', band: 6, wrongByType })).toBe('Matching headings')
  })
})

describe('weeksLeft', () => {
  const course = { startDate: '2026-10-19', endDate: '2027-04-19' }

  test('remaining days divided by 7, rounded up', () => {
    expect(weeksLeft(course, '2026-10-21')).toBe(26)
    expect(weeksLeft(course, '2027-04-12')).toBe(1)
    expect(weeksLeft(course, '2027-04-11')).toBe(2)
  })

  test('never below 0 once the end date has passed', () => {
    expect(weeksLeft(course, '2027-04-19')).toBe(0)
    expect(weeksLeft(course, '2027-06-01')).toBe(0)
  })
})

describe('nextFullTestDue', () => {
  const results: TestResult[] = [
    { id: '1', date: '2026-10-30', skill: 'Listening', band: 5 },
    { id: '2', date: '2026-11-20', skill: 'Listening', band: 5.5 },
    { id: '3', date: '2026-12-01', skill: 'Reading', band: 6 },
  ]

  test("56 days after the skill's latest Full test, from Focus on", () => {
    expect(nextFullTestDue({ skill: 'Listening', stage: 'focus', enteredOn: '2026-11-25' }, results)).toBe('2027-01-15')
    expect(nextFullTestDue({ skill: 'Listening', stage: 'exam_ready', enteredOn: '2027-01-10' }, results)).toBe('2027-01-15')
    expect(nextFullTestDue({ skill: 'Reading', stage: 'passage3', enteredOn: '2027-01-10' }, results)).toBe('2027-01-26')
  })

  test('not shown before Focus, for a track not started, for Writing, or with no Full test yet', () => {
    expect(nextFullTestDue({ skill: 'Listening', stage: 'diagnosis', enteredOn: '2026-11-10' }, results)).toBeNull()
    expect(nextFullTestDue({ skill: 'Reading', stage: null, enteredOn: null }, results)).toBeNull()
    expect(nextFullTestDue({ skill: 'Writing', stage: 'practice', enteredOn: '2026-12-01' }, [{ id: 'w', date: '2026-12-05', skill: 'Writing', band: 6, writingTask: 2 }])).toBeNull()
    expect(nextFullTestDue({ skill: 'Reading', stage: 'focus', enteredOn: '2026-12-02' }, [])).toBeNull()
  })
})

describe('weeksLeftLabel', () => {
  const course = { startDate: '2026-10-19', endDate: '2027-04-19' }

  test('says "week" for one and "weeks" otherwise', () => {
    expect(weeksLeftLabel(course, '2026-10-21')).toBe('26 weeks left')
    expect(weeksLeftLabel(course, '2027-04-12')).toBe('1 week left')
    expect(weeksLeftLabel(course, '2027-05-01')).toBe('0 weeks left')
  })
})
