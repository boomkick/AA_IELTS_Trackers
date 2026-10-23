import type { QuestionType } from '@/lib/stages'

export type Role = 'teacher' | 'student'
export type Skill = 'Listening' | 'Reading' | 'Writing'
export type StageKey = 'foundation' | 'diagnosis' | 'focus' | 'exam_ready' | 'passage3' | 'templates' | 'practice'

export interface User {
  id: string
  username: string
  displayName: string
  role: Role
}

export interface VocabItem {
  id: string
  word: string
  ipa: string
  definitionEn: string
  meaningVi: string
  example: string
  collocations: string[]
}

/** A skill's position in the course. `stage` and `enteredOn` are null until the track is started. */
export interface Track {
  skill: Skill
  stage: StageKey | null
  enteredOn: string | null
}

export interface Goal {
  id: string
  skill: Skill
  stage: StageKey
  title: string
  description: string
  dueDate?: string
  sortOrder: number
}

/** A Goal being added (no id yet) or edited. */
export type GoalDraft = Omit<Goal, 'id'> & { id?: string }

export interface Habit {
  id: string
  skill: Skill
  stage: StageKey
  title: string
  description: string
  /** 1–7; 7 means daily */
  timesPerWeek: number
  sortOrder: number
}

/** A Habit being added (no id yet) or edited. */
export type HabitDraft = Omit<Habit, 'id'> & { id?: string }

export interface TestResult {
  id: string
  date: string
  skill: Skill
  band: number
  /** Listening and Reading only */
  correct?: number
  total?: number
  notes?: string
  /** Listening: correct answers in Sections 1–4, each 0–10 */
  sectionCorrect?: SectionScores
  /** Reading: wrong answers per Question type; types with none are left out */
  wrongByType?: Partial<Record<QuestionType, number>>
  /** Writing: which Task the band is for */
  writingTask?: WritingTask
}

/** Correct answers in Listening Sections 1–4 */
export type SectionScores = [number, number, number, number]
export type WritingTask = 1 | 2

/** Class (`teacher_session`), Self-study or Homework. */
export type MissionType = 'teacher_session' | 'self_study' | 'homework'

/** A dated piece of work in a Week. Its Week comes from its date. */
export interface Mission {
  id: string
  date: string
  /** Class only, HH:mm */
  startTime?: string
  endTime?: string
  durationMin: number
  type: MissionType
  skill: Skill
  title: string
  description: string
  /** Homework only */
  dueDate?: string
}

/** A Mission being added (no id yet) or edited. */
export type MissionDraft = Omit<Mission, 'id'> & { id?: string }

/** Stage history: a track entered `stage` on `enteredOn` (started or advanced). */
export interface StageEntry {
  skill: Skill
  stage: StageKey
  enteredOn: string
}

/** A Monday-to-Sunday block of the Course, numbered from 1 (see src/lib/weeks.ts). */
export interface Week {
  number: number
  startDate: string
  endDate: string
}

/** The coaching programme's dates. The end date moves to the exam date once it's booked. */
export interface Course {
  startDate: string
  endDate: string
}
