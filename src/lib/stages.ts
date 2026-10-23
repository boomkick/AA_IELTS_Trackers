// The fixed shape of the course: each skill's Stages in order, each Stage's Gate, and when a
// track may start. Goals and Habits are teacher-editable data; this file is not.
import type { Goal, Skill, StageKey, TestResult, Track } from '@/types'

/** What must be true to leave a Stage. Met Gates only suggest advancing; the teacher confirms. */
export type Gate = { kind: 'goals' } | { kind: 'goals_and_test' } | { kind: 'band'; min: number } | { kind: 'none' }

export interface StageDef {
  key: StageKey
  name: string
  gate: Gate
}

interface TrackDef {
  stages: StageDef[]
  /** The track may start once `skill` has moved past `stage`. */
  startsAfter?: { skill: Skill; stage: StageKey }
  /** From this Stage on, a Full test is due every two months. Writing has none. */
  fullTestsFrom?: StageKey
}

export const TRACKS: Record<Skill, TrackDef> = {
  Listening: {
    stages: [
      { key: 'foundation', name: 'Foundation', gate: { kind: 'goals' } },
      { key: 'diagnosis', name: 'Diagnosis', gate: { kind: 'goals_and_test' } },
      { key: 'focus', name: 'Focus', gate: { kind: 'band', min: 7 } },
      { key: 'exam_ready', name: 'Exam-ready', gate: { kind: 'none' } },
    ],
    fullTestsFrom: 'focus',
  },
  Reading: {
    stages: [
      { key: 'foundation', name: 'Foundation', gate: { kind: 'goals' } },
      { key: 'diagnosis', name: 'Diagnosis', gate: { kind: 'goals_and_test' } },
      { key: 'focus', name: 'Focus', gate: { kind: 'band', min: 7 } },
      { key: 'passage3', name: 'Passage 3', gate: { kind: 'none' } },
    ],
    startsAfter: { skill: 'Listening', stage: 'foundation' },
    fullTestsFrom: 'focus',
  },
  Writing: {
    stages: [
      { key: 'templates', name: 'Templates', gate: { kind: 'goals' } },
      { key: 'practice', name: 'Practice', gate: { kind: 'none' } },
    ],
    startsAfter: { skill: 'Reading', stage: 'foundation' },
  },
}

/** Reading Question types, used to record where Full test answers went wrong. */
/** The skills in course order (Listening, Reading, Writing). */
export const SKILLS = Object.keys(TRACKS) as Skill[]

export const QUESTION_TYPES = [
  'Matching headings',
  'Matching information',
  'Matching features',
  'Matching sentence endings',
  'True / False / Not Given',
  'Yes / No / Not Given',
  'Multiple choice',
  'Sentence completion',
  'Summary, note, table or flow-chart completion',
  'Diagram label completion',
  'Short-answer questions',
] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

const indexOf = (skill: Skill, key: StageKey) => TRACKS[skill].stages.findIndex((s) => s.key === key)

export function stageDef(skill: Skill, key: StageKey): StageDef {
  return TRACKS[skill].stages[indexOf(skill, key)]
}

/** The Goals or Habits of one skill's Stage. */
export function itemsOfStage<T extends { skill: Skill; stage: StageKey }>(items: T[], skill: Skill, stage: StageKey): T[] {
  return items.filter((i) => i.skill === skill && i.stage === stage)
}

/** Sort order for a new Goal or Habit: one after the highest in its Stage. */
export function nextSortOrder(items: { sortOrder: number }[]): number {
  return Math.max(0, ...items.map((i) => i.sortOrder)) + 1
}

/** The Stage a track enters when it starts. */
export function firstStage(skill: Skill): StageDef {
  return TRACKS[skill].stages[0]
}

/** The Stage after `key` on this skill's track, or null at the last Stage. */
export function nextStage(skill: Skill, key: StageKey): StageKey | null {
  return TRACKS[skill].stages[indexOf(skill, key) + 1]?.key ?? null
}

/** Where Stage `key` sits relative to the track's current Stage. A track not started has only future Stages. */
export function stagePosition(track: Track, key: StageKey): 'past' | 'current' | 'future' {
  if (track.stage === null) return 'future'
  const diff = indexOf(track.skill, key) - indexOf(track.skill, track.stage)
  return diff < 0 ? 'past' : diff === 0 ? 'current' : 'future'
}

/** An open Goal whose due date has passed. Due today is not overdue yet. */
export function goalOverdue(goal: Goal, done: boolean, today: string): boolean {
  return !done && goal.dueDate !== undefined && goal.dueDate < today
}

/** e.g. "Starts after Listening Foundation"; null for a track that waits for nothing. */
export function startsAfterLabel(skill: Skill): string | null {
  const after = TRACKS[skill].startsAfter
  return after ? `Starts after ${after.skill} ${stageDef(after.skill, after.stage).name}` : null
}

/** True when `skill`'s track has not started yet and the track it waits for has moved past its Stage. */
export function canStart(skill: Skill, tracks: Track[]): boolean {
  const stageOf = (s: Skill) => tracks.find((t) => t.skill === s)?.stage ?? null
  if (stageOf(skill) !== null) return false
  const after = TRACKS[skill].startsAfter
  if (!after) return true
  const current = stageOf(after.skill)
  return current !== null && indexOf(after.skill, current) > indexOf(after.skill, after.stage)
}

/** The one status line for a track that hasn't started. */
export function notStartedLabel(skill: Skill, tracks: Track[]): string {
  return canStart(skill, tracks) ? 'Ready to start' : (startsAfterLabel(skill) ?? 'Not started')
}

/** Whether the track's current Stage Gate is met, with a short status line for the UI. */
export function gateStatus(track: Track, goals: Goal[], doneGoalIds: Set<string>, results: TestResult[]): { met: boolean; label: string } {
  if (track.stage === null || track.enteredOn === null) return { met: false, label: 'Not started' }
  const { enteredOn } = track
  const gate = stageDef(track.skill, track.stage).gate
  if (gate.kind === 'none') return { met: false, label: 'Last Stage' }

  const stageGoals = itemsOfStage(goals, track.skill, track.stage)
  const done = stageGoals.filter((g) => doneGoalIds.has(g.id)).length
  const goalsStatus = { met: done === stageGoals.length, label: `${done} of ${stageGoals.length} Goals done` }
  const fullTests = results.filter((r) => r.skill === track.skill && r.date >= enteredOn)

  switch (gate.kind) {
    case 'goals':
      return goalsStatus
    case 'goals_and_test':
      if (!goalsStatus.met) return goalsStatus
      return fullTests.length > 0 ? { met: true, label: 'Full test recorded' } : { met: false, label: 'Full test needed' }
    case 'band': {
      if (fullTests.length === 0) return { met: false, label: 'No Full test yet' }
      const best = Math.max(...fullTests.map((r) => r.band))
      return best >= gate.min
        ? { met: true, label: `Best Full test ${best.toFixed(1)}` }
        : { met: false, label: `Best Full test ${best.toFixed(1)} of ${gate.min.toFixed(1)} needed` }
    }
  }
}
