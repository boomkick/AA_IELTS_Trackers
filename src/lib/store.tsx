// App data layer: Supabase Auth session + TanStack Query caches for each table.
// Pages read plain objects from useStore(); writes go to Supabase and refresh the cache.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase, usernameToEmail } from '@/lib/supabase'
import { toISO } from '@/lib/utils'
import type { Completion, Role, Skill, StudyTask, StudyWeek, TaskType, TestResult, User, VocabItem } from '@/types'

// ---------------------------------------------------------------------------
// Row shapes (snake_case, as stored) and mappers to the app's camelCase types
// ---------------------------------------------------------------------------
interface ProfileRow { id: string; username: string; display_name: string; role: Role }
interface WeekRow { week_number: number; start_date: string; end_date: string; skill_focus: Skill; focus: string }
interface TaskRow {
  id: string; week_number: number; task_date: string; start_time: string | null; end_time: string | null
  duration_min: number; task_type: TaskType; skill: Skill; title: string; description: string; due_date: string | null
}
interface CompletionRow { task_id: string; completed_on: string; score: string | null; note: string | null }
interface VocabRow {
  id: string; word: string; ipa: string; definition_en: string; meaning_vi: string; example: string
  collocations: string[]; week_number: number | null
}
interface ResultRow { id: string; test_date: string; skill: Skill; band: number | string; correct: number; total_questions: number; notes: string | null }

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : undefined)

const toWeek = (r: WeekRow): StudyWeek => ({ number: r.week_number, startDate: r.start_date, endDate: r.end_date, skill: r.skill_focus, focus: r.focus })
const toTask = (r: TaskRow): StudyTask => ({
  id: r.id, weekNumber: r.week_number, date: r.task_date, startTime: hhmm(r.start_time), endTime: hhmm(r.end_time),
  durationMin: r.duration_min, type: r.task_type, skill: r.skill, title: r.title, description: r.description, dueDate: r.due_date ?? undefined,
})
const toVocab = (r: VocabRow): VocabItem => ({
  id: r.id, word: r.word, ipa: r.ipa, definitionEn: r.definition_en, meaningVi: r.meaning_vi, example: r.example,
  collocations: r.collocations, weekNumber: r.week_number ?? undefined,
})
const toResult = (r: ResultRow): TestResult => ({
  id: r.id, date: r.test_date, skill: r.skill, band: Number(r.band), correct: r.correct, total: r.total_questions, notes: r.notes ?? undefined,
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
  const weeksQ = useQuery({ queryKey: ['weeks'], enabled, queryFn: async () => (await rows<WeekRow>(supabase.from('study_weeks').select('*').order('week_number'))).map(toWeek) })
  const tasksQ = useQuery({ queryKey: ['tasks'], enabled, queryFn: async () => (await rows<TaskRow>(supabase.from('study_tasks').select('*').order('task_date'))).map(toTask) })
  const completionsQ = useQuery({
    queryKey: ['completions'],
    enabled,
    queryFn: async () => {
      const list = await rows<CompletionRow>(supabase.from('task_completions').select('task_id, completed_on, score, note'))
      return Object.fromEntries(
        list.map((c) => [c.task_id, { taskId: c.task_id, completedAt: c.completed_on, score: c.score ?? undefined, note: c.note ?? undefined } satisfies Completion]),
      ) as Record<string, Completion>
    },
  })
  const vocabQ = useQuery({ queryKey: ['vocab'], enabled, queryFn: async () => (await rows<VocabRow>(supabase.from('vocabulary').select('*').order('created_at', { ascending: false }))).map(toVocab) })
  const reviewsQ = useQuery({ queryKey: ['reviews'], enabled, queryFn: async () => (await rows<{ vocab_id: string }>(supabase.from('vocab_reviews').select('vocab_id'))).map((r) => r.vocab_id) })
  const resultsQ = useQuery({ queryKey: ['results'], enabled, queryFn: async () => (await rows<ResultRow>(supabase.from('test_results').select('*').order('test_date'))).map(toResult) })

  const profile = profileQ.data
  const user: User | null = profile ? { id: profile.id, username: profile.username, displayName: profile.display_name, role: profile.role } : null
  const core = [weeksQ, tasksQ, completionsQ, vocabQ, reviewsQ, resultsQ]

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

  return {
    user,
    /** Waiting for the stored session / profile to load. */
    authLoading: !authReady || (enabled && profileQ.isPending),
    /** Signed in but the account has no profile row (setup step missed). */
    missingProfile: enabled && profileQ.isSuccess && !profile,
    dataLoading: core.some((q) => q.isPending),
    dataError: core.find((q) => q.error)?.error?.message,
    today: toISO(new Date()),
    weeks: weeksQ.data ?? [],
    tasks: tasksQ.data ?? [],
    completions: completionsQ.data ?? {},
    vocab: vocabQ.data ?? [],
    reviewed: reviewsQ.data ?? [],
    results: resultsQ.data ?? [],

    async login(username: string, pin: string): Promise<string | null> {
      const { error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password: pin })
      return error ? 'Wrong username or PIN.' : null
    },
    async logout() {
      await supabase.auth.signOut()
      qc.clear()
    },

    setCompletion(taskId: string, data: Omit<Completion, 'taskId' | 'completedAt'> | null) {
      // optimistic: tick/untick instantly, then sync
      qc.setQueryData<Record<string, Completion>>(['completions'], (old = {}) => {
        const next = { ...old }
        if (data === null) delete next[taskId]
        else next[taskId] = { taskId, completedAt: toISO(new Date()), ...data }
        return next
      })
      return write(['completions'], () =>
        data === null
          ? check(supabase.from('task_completions').delete().eq('task_id', taskId).eq('student_id', uid!))
          : check(
              supabase
                .from('task_completions')
                .upsert({ task_id: taskId, student_id: uid, score: data.score ?? null, note: data.note ?? null }, { onConflict: 'task_id,student_id' }),
            ),
      )
    },
    upsertTask(task: StudyTask) {
      const row = {
        week_number: task.weekNumber, task_date: task.date, start_time: task.startTime ?? null, end_time: task.endTime ?? null,
        duration_min: task.durationMin, task_type: task.type, skill: task.skill, title: task.title.trim(), description: task.description,
        due_date: task.type === 'homework' ? (task.dueDate ?? task.date) : null,
      }
      return write(['tasks'], () =>
        task.id ? check(supabase.from('study_tasks').update(row).eq('id', task.id)) : check(supabase.from('study_tasks').insert(row)),
      )
    },
    deleteTask: (id: string) => write(['tasks', 'completions'], () => check(supabase.from('study_tasks').delete().eq('id', id))),
    addVocab: (v: Omit<VocabItem, 'id'>) =>
      write(['vocab'], () =>
        check(
          supabase.from('vocabulary').insert({
            word: v.word, ipa: v.ipa, definition_en: v.definitionEn, meaning_vi: v.meaningVi, example: v.example,
            collocations: v.collocations, week_number: v.weekNumber ?? null,
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
    addResult: (r: Omit<TestResult, 'id'>) =>
      write(['results'], () =>
        check(supabase.from('test_results').insert({ test_date: r.date, skill: r.skill, band: r.band, correct: r.correct, total_questions: r.total, notes: r.notes ?? null })),
      ),
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

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
