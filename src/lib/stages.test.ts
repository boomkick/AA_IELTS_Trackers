import { describe, expect, test } from 'vitest'
import { canStart, gateStatus, goalOverdue, nextStage, stagePosition, startsAfterLabel } from '@/lib/stages'
import type { Goal, Skill, StageKey, TestResult, Track } from '@/types'

const track = (skill: Skill, stage: StageKey | null, enteredOn: string | null = stage && '2026-11-01'): Track => ({ skill, stage, enteredOn })

describe('nextStage', () => {
  test('walks each track in order and ends with null', () => {
    expect(nextStage('Listening', 'foundation')).toBe('diagnosis')
    expect(nextStage('Listening', 'diagnosis')).toBe('focus')
    expect(nextStage('Listening', 'focus')).toBe('exam_ready')
    expect(nextStage('Listening', 'exam_ready')).toBeNull()
    expect(nextStage('Reading', 'focus')).toBe('passage3')
    expect(nextStage('Reading', 'passage3')).toBeNull()
    expect(nextStage('Writing', 'templates')).toBe('practice')
    expect(nextStage('Writing', 'practice')).toBeNull()
  })
})

describe('canStart', () => {
  test('Listening is the first track and needs nothing before it', () => {
    expect(canStart('Listening', [track('Listening', null)])).toBe(true)
  })

  test('Reading waits for Listening to leave Foundation', () => {
    expect(canStart('Reading', [track('Listening', 'foundation'), track('Reading', null)])).toBe(false)
    expect(canStart('Reading', [track('Listening', 'diagnosis'), track('Reading', null)])).toBe(true)
  })

  test('Writing waits for Reading to leave Foundation', () => {
    expect(canStart('Writing', [track('Listening', 'focus'), track('Reading', 'foundation'), track('Writing', null)])).toBe(false)
    expect(canStart('Writing', [track('Listening', 'focus'), track('Reading', 'diagnosis'), track('Writing', null)])).toBe(true)
  })

  test('a track cannot start before its prerequisite track has started', () => {
    expect(canStart('Writing', [track('Listening', 'focus'), track('Reading', null), track('Writing', null)])).toBe(false)
  })

  test('a track that has already started cannot start again', () => {
    expect(canStart('Reading', [track('Listening', 'focus'), track('Reading', 'foundation')])).toBe(false)
  })
})

const goal = (id: string, stage: StageKey, skill: Skill = 'Listening'): Goal => ({ id, skill, stage, title: id, description: '', sortOrder: 0 })
const fullTest = (date: string, band: number, skill: Skill = 'Listening'): TestResult => ({ id: `${skill}-${date}`, date, skill, band, correct: 30, total: 40 })

describe('gateStatus', () => {
  test('Foundation Gate counts only the Goals of this Stage on this skill', () => {
    const goals = [goal('a', 'foundation'), goal('b', 'foundation'), goal('c', 'diagnosis'), goal('d', 'foundation', 'Reading')]
    const listening = track('Listening', 'foundation')
    expect(gateStatus(listening, goals, new Set(['a', 'd']), [])).toEqual({ met: false, label: '1 of 2 Goals done' })
    expect(gateStatus(listening, goals, new Set(['a', 'b']), [])).toEqual({ met: true, label: '2 of 2 Goals done' })
  })

  test('Diagnosis Gate needs every Goal done and a Full test since the Stage began', () => {
    const goals = [goal('lilie', 'diagnosis')]
    const diagnosis = track('Listening', 'diagnosis', '2026-11-16')
    expect(gateStatus(diagnosis, goals, new Set(), [fullTest('2026-11-16', 5.5)])).toEqual({ met: false, label: '0 of 1 Goals done' })
    expect(gateStatus(diagnosis, goals, new Set(['lilie']), [])).toEqual({ met: false, label: 'Full test needed' })
    expect(gateStatus(diagnosis, goals, new Set(['lilie']), [fullTest('2026-11-16', 5.5)])).toEqual({ met: true, label: 'Full test recorded' })
  })

  test('Focus Gate is met by one Full test of 7.0 or above', () => {
    const focus = track('Listening', 'focus', '2026-12-01')
    expect(gateStatus(focus, [], new Set(), [])).toEqual({ met: false, label: 'No Full test yet' })
    expect(gateStatus(focus, [], new Set(), [fullTest('2026-12-10', 6), fullTest('2027-01-20', 6.5)])).toEqual({ met: false, label: 'Best Full test 6.5 of 7.0 needed' })
    expect(gateStatus(focus, [], new Set(), [fullTest('2026-12-10', 6), fullTest('2027-01-20', 7)])).toEqual({ met: true, label: 'Best Full test 7.0' })
  })

  test('Focus Gate ignores Full tests from before the Stage began and from other skills', () => {
    const focus = track('Listening', 'focus', '2026-12-01')
    const results = [fullTest('2026-11-30', 8), fullTest('2026-12-05', 8, 'Reading'), fullTest('2026-12-06', 6)]
    expect(gateStatus(focus, [], new Set(), results)).toEqual({ met: false, label: 'Best Full test 6.0 of 7.0 needed' })
  })

  test('a last Stage has no Gate, even with every Goal done and a high score', () => {
    const results = [fullTest('2027-03-01', 8)]
    expect(gateStatus(track('Listening', 'exam_ready'), [], new Set(), results)).toEqual({ met: false, label: 'Last Stage' })
    expect(gateStatus(track('Reading', 'passage3'), [], new Set(), results)).toEqual({ met: false, label: 'Last Stage' })
    expect(gateStatus(track('Writing', 'practice'), [goal('pie', 'practice', 'Writing')], new Set(['pie']), [])).toEqual({ met: false, label: 'Last Stage' })
  })

  test('a track that has not started has no Gate', () => {
    expect(gateStatus(track('Writing', null), [], new Set(), [])).toEqual({ met: false, label: 'Not started' })
  })
})

describe('stagePosition', () => {
  test('Stages before the current one are past, after it future', () => {
    const t = track('Listening', 'focus')
    expect(stagePosition(t, 'foundation')).toBe('past')
    expect(stagePosition(t, 'diagnosis')).toBe('past')
    expect(stagePosition(t, 'focus')).toBe('current')
    expect(stagePosition(t, 'exam_ready')).toBe('future')
  })
  test('every Stage of a track not started is future', () => {
    expect(stagePosition(track('Reading', null), 'foundation')).toBe('future')
  })
})

describe('goalOverdue', () => {
  const g = (dueDate?: string): Goal => ({ id: 'g', skill: 'Listening', stage: 'foundation', title: 'g', description: '', dueDate, sortOrder: 0 })
  test('an open Goal is overdue only after its due date', () => {
    expect(goalOverdue(g('2026-10-20'), false, '2026-10-21')).toBe(true)
    expect(goalOverdue(g('2026-10-21'), false, '2026-10-21')).toBe(false)
  })
  test('a done Goal or one without a due date is never overdue', () => {
    expect(goalOverdue(g('2026-10-20'), true, '2026-10-21')).toBe(false)
    expect(goalOverdue(g(), false, '2026-10-21')).toBe(false)
  })
})

describe('startsAfterLabel', () => {
  test('names the track and Stage a skill waits for', () => {
    expect(startsAfterLabel('Reading')).toBe('Starts after Listening Foundation')
    expect(startsAfterLabel('Writing')).toBe('Starts after Reading Foundation')
    expect(startsAfterLabel('Listening')).toBeNull()
  })
})
