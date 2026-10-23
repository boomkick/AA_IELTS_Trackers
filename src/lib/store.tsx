// App data layer: Supabase Auth session + TanStack Query caches for each table.
// Pages read plain objects from useStore(); writes go to Supabase and refresh the cache.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase, usernameToEmail } from '@/lib/supabase'
import type {
  Course, Goal, GoalDraft, Habit, HabitDraft, Mission, MissionDraft, MissionType, Role, SectionScores, Skill, StageEntry, StageKey, TestResult, Track, User,
  VocabItem, WritingTask,
} from '@/types'
import { SKILLS } from '@/lib/stages'

// ---------------------------------------------------------------------------
// Row shapes (snake_case, as stored) and mappers to the app's camelCase types
// ---------------------------------------------------------------------------
interface ProfileRow { id: string; username: string; display_name: string; role: Role }
interface VocabRow {
  id: string; word: string; ipa: string; definition_en: string; meaning_vi: string; example: string
  collocations: string[]
}
interface MissionRow {
  id: string; task_date: string; start_time: string | null; end_time: string | null; duration_min: number; task_type: MissionType; skill: Skill
  title: string; description: string; due_date: string | null
}
interface StageEntryRow { skill: Skill; stage: StageKey; entered_on: string }
interface TrackRow { skill: Skill; stage: StageKey | null; entered_on: string | null }
interface GoalRow { id: string; skill: Skill; stage: StageKey; title: string; description: string; due_date: string | null; sort_order: number }
interface HabitRow { id: string; skill: Skill; stage: StageKey; title: string; description: string; times_per_week: number; sort_order: number }
interface ResultRow {
  id: string; test_date: string; skill: Skill; band: number | string; correct: number | null; total_questions: number | null; notes: string | null
  section_correct: SectionScores | null; wrong_by_type: TestResult['wrongByType'] | null; writing_task: WritingTask | null
}

const toVocab = (r: VocabRow): VocabItem => ({
  id: r.id, word: r.word, ipa: r.ipa, definitionEn: r.definition_en, meaningVi: r.meaning_vi, example: r.example,
  collocations: r.collocations,
})
const toResult = (r: ResultRow): TestResult => ({
  id: r.id, date: r.test_date, skill: r.skill, band: Number(r.band), correct: r.correct ?? undefined, total: r.total_questions ?? undefined,
  notes: r.notes ?? undefined, sectionCorrect: r.section_correct ?? undefined, wrongByType: r.wrong_by_type ?? undefined,
  writingTask: r.writing_task ?? undefined,
})

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : undefined)
const toMission = (r: MissionRow): Mission => ({
  id: r.id, date: r.task_date, startTime: hhmm(r.start_time), endTime: hhmm(r.end_time), durationMin: r.duration_min, type: r.task_type, skill: r.skill,
  title: r.title, description: r.description, dueDate: r.due_date ?? undefined,
})

const toTrack = (r: TrackRow): Track => ({ skill: r.skill, stage: r.stage, enteredOn: r.entered_on })
const toGoal = (r: GoalRow): Goal => ({
  id: r.id, skill: r.skill, stage: r.stage, title: r.title, description: r.description, dueDate: r.due_date ?? undefined, sortOrder: r.sort_order,
})

const toHabit = (r: HabitRow): Habit => ({
  id: r.id, skill: r.skill, stage: r.stage, title: r.title, description: r.description, timesPerWeek: r.times_per_week, sortOrder: r.sort_order,
})

async function rows<T>(query: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T[]> {
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as T[]
}

async function check(query: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await query
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
function useStoreValue() {
  const qc = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const uid = session?.user.id
  const enabled = !!uid

  const profileQ = useQuery({
    queryKey: ['profile', uid],
    enabled,
    queryFn: async () => (await rows<ProfileRow>(supabase.from('profiles').select('id, username, display_name, role').eq('id', uid!)))[0] ?? null,
  })
  const vocabQ = useQuery({ queryKey: ['vocab'], enabled, queryFn: async () => (await rows<VocabRow>(supabase.from('vocabulary').select('*').order('created_at', { ascending: false }))).map(toVocab) })
  const reviewsQ = useQuery({ queryKey: ['reviews'], enabled, queryFn: async () => (await rows<{ vocab_id: string }>(supabase.from('vocab_reviews').select('vocab_id'))).map((r) => r.vocab_id) })
  const tracksQ = useQuery({
    queryKey: ['tracks'],
    enabled,
    queryFn: async () => {
      const list = (await rows<TrackRow>(supabase.from('tracks').select('skill, stage, entered_on'))).map(toTrack)
      // always all three skills in course order, even if a row is missing
      return SKILLS.map((skill): Track => list.find((t) => t.skill === skill) ?? { skill, stage: null, enteredOn: null })
    },
  })
  const stageEntriesQ = useQuery({
    queryKey: ['stageEntries'],
    enabled,
    queryFn: async () =>
      (await rows<StageEntryRow>(supabase.from('stage_entries').select('skill, stage, entered_on').order('entered_on').order('created_at'))).map(
        (r): StageEntry => ({ skill: r.skill, stage: r.stage, enteredOn: r.entered_on }),
      ),
  })
  const missionsQ = useQuery({
    queryKey: ['missions'],
    enabled,
    queryFn: async () => (await rows<MissionRow>(supabase.from('study_tasks').select('*').order('task_date').order('start_time'))).map(toMission),
  })
  const missionsDoneQ = useQuery({
    queryKey: ['missionsDone'],
    enabled,
    queryFn: async () => {
      const list = await rows<{ task_id: string; completed_on: string }>(supabase.from('task_completions').select('task_id, completed_on'))
      return Object.fromEntries(list.map((c) => [c.task_id, c.completed_on])) as Record<string, string>
    },
  })
  const goalsQ = useQuery({
    queryKey: ['goals'],
    enabled,
    queryFn: async () => (await rows<GoalRow>(supabase.from('goals').select('*').order('sort_order').order('created_at'))).map(toGoal),
  })
  const goalsDoneQ = useQuery({
    queryKey: ['goalsDone'],
    enabled,
    queryFn: async () => {
      const list = await rows<{ goal_id: string; completed_on: string }>(supabase.from('goal_completions').select('goal_id, completed_on'))
      return Object.fromEntries(list.map((c) => [c.goal_id, c.completed_on])) as Record<string, string>
    },
  })
  const habitsQ = useQuery({
    queryKey: ['habits'],
    enabled,
    queryFn: async () => (await rows<HabitRow>(supabase.from('habits').select('*').order('sort_order').order('created_at'))).map(toHabit),
  })
  const habitTicksQ = useQuery({
    queryKey: ['habitTicks'],
    enabled,
    queryFn: async () => {
      const list = await rows<{ habit_id: string; ticked_on: string }>(supabase.from('habit_ticks').select('habit_id, ticked_on'))
      const byHabit: Record<string, string[]> = {}
      for (const t of list) (byHabit[t.habit_id] ??= []).push(t.ticked_on)
      return byHabit
    },
  })
  const resultsQ = useQuery({ queryKey: ['results'], enabled, queryFn: async () => (await rows<ResultRow>(supabase.from('test_results').select('*').order('test_date'))).map(toResult) })

  const profile = profileQ.data
  const user: User | null = profile ? { id: profile.id, username: profile.username, displayName: profile.display_name, role: profile.role } : null
  const courseQ = useQuery({
    queryKey: ['course'],
    enabled,
    queryFn: async () => {
      const [row] = await rows<{ start_date: string; end_date: string }>(supabase.from('course').select('start_date, end_date'))
      return row ? ({ startDate: row.start_date, endDate: row.end_date } satisfies Course) : null
    },
  })
  const core = [vocabQ, reviewsQ, resultsQ, tracksQ, goalsQ, goalsDoneQ, habitsQ, habitTicksQ, missionsQ, missionsDoneQ]

  /** Run a write; show the error and refresh the affected caches either way. */
  async function write(keys: string[], fn: () => Promise<void>) {
    try {
      await fn()
    } catch (e) {
      alert(`Could not save: ${(e as Error).message}`)
    } finally {
      await Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: [k] })))
    }
  }

  // the course runs on Vietnam time, matching the database's default tick dates
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())

  return {
    user,
    /** Waiting for the stored session / profile to load. */
    authLoading: !authReady || (enabled && profileQ.isPending),
    /** Signed in but the account has no profile row (setup step missed). */
    missingProfile: enabled && profileQ.isSuccess && !profile,
    dataLoading: core.some((q) => q.isPending),
    dataError: core.find((q) => q.error)?.error?.message,
    today,
    vocab: vocabQ.data ?? [],
    reviewed: reviewsQ.data ?? [],
    results: resultsQ.data ?? [],
    tracks: tracksQ.data ?? [],
    /** Stage history, oldest first. Empty until migration 011 has run; not in `core`, like `course`. */
    stageEntries: stageEntriesQ.data ?? [],
    missions: missionsQ.data ?? [],
    /** missionId -> day the student ticked it */
    missionsDone: missionsDoneQ.data ?? {},
    goals: goalsQ.data ?? [],
    /** goalId -> day the student ticked it */
    goalsDone: goalsDoneQ.data ?? {},
    /** the same ticks as a set, for Gate checks */
    doneGoalIds: new Set(Object.keys(goalsDoneQ.data ?? {})),
    habits: habitsQ.data ?? [],
    /** habitId -> days the student ticked it */
    habitTicks: habitTicksQ.data ?? {},
    /** null until migration 009 has run; not in `core`, so the app still loads without it */
    course: courseQ.data ?? null,

    async login(username: string, pin: string): Promise<string | null> {
      const { error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password: pin })
      return error ? 'Wrong username or PIN.' : null
    },
    async logout() {
      await supabase.auth.signOut()
      qc.clear()
    },

    /** Move the Course end date, e.g. to the exam date once it's booked. */
    setCourseEnd: (endDate: string) => write(['course'], () => check(supabase.from('course').update({ end_date: endDate }).eq('id', 1))),
    /** Start or advance a track: it enters `stage` today, which is when its Gate starts counting results. Also recorded in the Stage history. */
    setTrackStage: (skill: Skill, stage: StageKey) =>
      write(['tracks', 'stageEntries'], async () => {
        await check(supabase.from('tracks').upsert({ skill, stage, entered_on: today }, { onConflict: 'skill' }))
        await check(supabase.from('stage_entries').insert({ skill, stage, entered_on: today }))
      }),
    setMissionDone(missionId: string, done: boolean) {
      // optimistic, like setGoalDone
      qc.setQueryData<Record<string, string>>(['missionsDone'], (old = {}) => {
        const next = { ...old }
        if (done) next[missionId] = today
        else delete next[missionId]
        return next
      })
      return write(['missionsDone'], () =>
        done
          ? check(supabase.from('task_completions').insert({ task_id: missionId }))
          : check(supabase.from('task_completions').delete().eq('task_id', missionId).eq('student_id', uid!)),
      )
    },
    upsertMission(m: MissionDraft) {
      const isClass = m.type === 'teacher_session'
      const row = {
        task_date: m.date, start_time: isClass ? (m.startTime ?? null) : null, end_time: isClass ? (m.endTime ?? null) : null, duration_min: m.durationMin,
        task_type: m.type, skill: m.skill, title: m.title.trim(), description: m.description, due_date: m.type === 'homework' ? (m.dueDate ?? m.date) : null,
      }
      return write(['missions'], () => (m.id ? check(supabase.from('study_tasks').update(row).eq('id', m.id)) : check(supabase.from('study_tasks').insert(row))))
    },
    deleteMission: (id: string) => write(['missions', 'missionsDone'], () => check(supabase.from('study_tasks').delete().eq('id', id))),
    setGoalDone(goalId: string, done: boolean) {
      // optimistic: tick/untick instantly, then sync
      qc.setQueryData<Record<string, string>>(['goalsDone'], (old = {}) => {
        const next = { ...old }
        if (done) next[goalId] = today
        else delete next[goalId]
        return next
      })
      return write(['goalsDone'], () =>
        done
          ? check(supabase.from('goal_completions').insert({ goal_id: goalId }))
          : check(supabase.from('goal_completions').delete().eq('goal_id', goalId).eq('student_id', uid!)),
      )
    },
    upsertGoal(g: GoalDraft) {
      const row = {
        skill: g.skill, stage: g.stage, title: g.title.trim(), description: g.description, due_date: g.dueDate ?? null, sort_order: g.sortOrder,
      }
      return write(['goals'], () => (g.id ? check(supabase.from('goals').update(row).eq('id', g.id)) : check(supabase.from('goals').insert(row))))
    },
    deleteGoal: (id: string) => write(['goals', 'goalsDone'], () => check(supabase.from('goals').delete().eq('id', id))),
    setHabitTicked(habitId: string, ticked: boolean) {
      // optimistic; only today's tick can be added or removed (enforced by RLS)
      qc.setQueryData<Record<string, string[]>>(['habitTicks'], (old = {}) => {
        const days = (old[habitId] ?? []).filter((d) => d !== today)
        return { ...old, [habitId]: ticked ? [...days, today] : days }
      })
      return write(['habitTicks'], () =>
        ticked
          ? check(supabase.from('habit_ticks').insert({ habit_id: habitId }))
          : check(supabase.from('habit_ticks').delete().eq('habit_id', habitId).eq('student_id', uid!).eq('ticked_on', today)),
      )
    },
    upsertHabit(h: HabitDraft) {
      const row = {
        skill: h.skill, stage: h.stage, title: h.title.trim(), description: h.description, times_per_week: h.timesPerWeek, sort_order: h.sortOrder,
      }
      return write(['habits'], () => (h.id ? check(supabase.from('habits').update(row).eq('id', h.id)) : check(supabase.from('habits').insert(row))))
    },
    deleteHabit: (id: string) => write(['habits', 'habitTicks'], () => check(supabase.from('habits').delete().eq('id', id))),
    addVocab: (v: Omit<VocabItem, 'id'>) =>
      write(['vocab'], () =>
        check(
          supabase.from('vocabulary').insert({
            word: v.word, ipa: v.ipa, definition_en: v.definitionEn, meaning_vi: v.meaningVi, example: v.example,
            collocations: v.collocations,
          }),
        ),
      ),
    deleteVocab: (id: string) => write(['vocab', 'reviews'], () => check(supabase.from('vocabulary').delete().eq('id', id))),
    toggleReviewed(id: string) {
      const isReviewed = (reviewsQ.data ?? []).includes(id)
      qc.setQueryData<string[]>(['reviews'], (old = []) => (isReviewed ? old.filter((r) => r !== id) : [...old, id]))
      return write(['reviews'], () =>
        isReviewed
          ? check(supabase.from('vocab_reviews').delete().eq('vocab_id', id).eq('student_id', uid!))
          : check(supabase.from('vocab_reviews').insert({ vocab_id: id })),
      )
    },
    /** Record a result. One the teacher adds belongs to the student. */
    addResult: (r: Omit<TestResult, 'id'>) =>
      write(['results'], async () => {
        let studentId = uid!
        if (profile?.role === 'teacher') {
          const [student] = await rows<{ id: string }>(supabase.from('profiles').select('id').eq('role', 'student').limit(1))
          if (!student) throw new Error('No student account found.')
          studentId = student.id
        }
        await check(
          supabase.from('test_results').insert({
            student_id: studentId, test_date: r.date, skill: r.skill, band: r.band, correct: r.correct ?? null, total_questions: r.total ?? null,
            notes: r.notes ?? null, section_correct: r.sectionCorrect ?? null, wrong_by_type: r.wrongByType ?? null, writing_task: r.writingTask ?? null,
          }),
        )
      }),
  }
}

type Store = ReturnType<typeof useStoreValue>
const StoreContext = createContext<Store | null>(null)
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } })

function StoreInner({ children }: { children: ReactNode }) {
  const value = useStoreValue()
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function StoreProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreInner>{children}</StoreInner>
    </QueryClientProvider>
  )
}

// the hook lives beside its provider on purpose; fast refresh just reloads this file in full
// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
