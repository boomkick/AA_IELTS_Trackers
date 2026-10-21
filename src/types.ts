export type Role = 'teacher' | 'student'
export type Skill = 'Listening' | 'Reading' | 'Writing'
export type StageKey = 'foundation' | 'diagnosis' | 'focus' | 'exam_ready' | 'passage3' | 'templates' | 'practice'
export type TaskType = 'teacher_session' | 'self_study' | 'homework'

export interface User {
  id: string
  username: string
  displayName: string
  role: Role
}

export interface StudyWeek {
  number: number
  startDate: string
  endDate: string
  skill: Skill
  focus: string
}

export interface StudyTask {
  id: string
  weekNumber: number
  date: string
  startTime?: string
  endTime?: string
  durationMin: number
  type: TaskType
  skill: Skill
  title: string
  description: string
  dueDate?: string
}

export interface Completion {
  taskId: string
  completedAt: string
  score?: string
  note?: string
}

export interface VocabItem {
  id: string
  word: string
  ipa: string
  definitionEn: string
  meaningVi: string
  example: string
  collocations: string[]
  weekNumber?: number
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

export interface TestResult {
  id: string
  date: string
  skill: Skill
  band: number
  correct: number
  total: number
  notes?: string
}
