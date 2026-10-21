import { describe, expect, test } from 'vitest'
import { weakestArea } from '@/lib/stats'
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
