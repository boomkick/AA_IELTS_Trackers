import { describe, expect, test } from 'vitest'
import { rhythmLabel, streak, weekCount } from '@/lib/habits'

describe('rhythmLabel', () => {
  test('7 times a week reads as daily, fewer as so many times a week', () => {
    expect(rhythmLabel(7)).toBe('daily')
    expect(rhythmLabel(2)).toBe('2× a week')
    expect(rhythmLabel(1)).toBe('1× a week')
  })
})

// 2026-10-19 is a Monday, 2026-10-25 the Sunday after it.
describe('weekCount', () => {
  const ticks = ['2026-10-18', '2026-10-19', '2026-10-22', '2026-10-25']

  test('counts ticks from Monday up to today, not last week', () => {
    expect(weekCount(ticks, '2026-10-22')).toBe(2)
  })

  test('a Sunday tick counts in the week that began the Monday before', () => {
    expect(weekCount(ticks, '2026-10-25')).toBe(3)
  })

  test('the count resets on Monday', () => {
    expect(weekCount(ticks, '2026-10-26')).toBe(0)
  })
})

describe('streak', () => {
  test('counts consecutive days ending today', () => {
    expect(streak(['2026-10-20', '2026-10-21', '2026-10-22'], '2026-10-22')).toBe(3)
  })

  test('ends yesterday when today is not ticked yet', () => {
    expect(streak(['2026-10-20', '2026-10-21'], '2026-10-22')).toBe(2)
  })

  test('a missed day breaks the streak', () => {
    expect(streak(['2026-10-18', '2026-10-20', '2026-10-21', '2026-10-22'], '2026-10-22')).toBe(3)
    expect(streak(['2026-10-19', '2026-10-20'], '2026-10-22')).toBe(0)
  })

  test('runs across a month end and ignores tick order', () => {
    expect(streak(['2026-11-01', '2026-10-30', '2026-10-31'], '2026-11-01')).toBe(3)
  })

  test('no ticks means no streak', () => {
    expect(streak([], '2026-10-22')).toBe(0)
  })
})
