// Generates the plan SQL from plan-template.ts:
//   supabase/migrations/003_seed.sql          – fresh database: weeks, tasks, starter vocabulary
//   supabase/migrations/005_replace_plan.sql  – database already seeded: swaps weeks + tasks only
// Usage: npm run gen:seed   (Node 22.6+ runs this TypeScript file directly)
import { writeFileSync } from 'node:fs'
import { addDays, format } from 'date-fns'
import {
  FINAL_LISTENING_TEST, FINAL_READING_TEST, LISTENING, LISTENING_PRACTICE, READING, READING_PRACTICE, vocabulary,
  type Chapter, type Skill,
} from './plan-template.ts'

const PLAN_START = new Date(2026, 9, 19) // Mon 19 Oct 2026
const WEEKS = 8
const BOOK = 'The Official Cambridge Guide to IELTS'

const iso = (d: Date) => format(d, 'yyyy-MM-dd')
const q = (s: string) => `'${s.replace(/'/g, "''")}'`
const qn = (s: string | undefined) => (s === undefined ? 'null' : q(s))

// 16 classes (Mon & Fri): 8 Listening chapters, 7 Reading chapters, then a final review.
type Class = Chapter | 'final-review'
const classes: Class[] = [...LISTENING, ...READING, 'final-review']
if (classes.length !== WEEKS * 2) throw new Error(`Expected ${WEEKS * 2} classes, got ${classes.length}`)

const chapterName = (c: Chapter) => `${c.skill} Ch ${c.number}: ${c.title}`
const anki = '15 min Anki: review old vocabulary.'

const weekRows: string[] = []
const taskRows: string[] = []
const practice: Record<Skill, string[]> = { Listening: [...LISTENING_PRACTICE], Reading: [...READING_PRACTICE] }

for (let w = 0; w < WEEKS; w++) {
  const wk = w + 1
  const base = addDays(PLAN_START, w * 7)
  const skill: Skill = wk <= 4 ? 'Listening' : 'Reading'
  const mon = classes[w * 2] as Chapter
  const fri = classes[w * 2 + 1]
  const isLastWeek = wk === WEEKS

  const focus = fri === 'final-review'
    ? `${skill} Ch ${mon.number}: ${mon.title} · Final review`
    : `${skill} Ch ${mon.number}–${fri.number}: ${mon.title} · ${fri.title}`
  weekRows.push(`(${wk}, ${q(iso(base))}, ${q(iso(addDays(base, 6)))}, ${q(skill)}, ${q(focus)})`)

  const task = (day: number, type: string, minutes: number, title: string, desc: string, extra: { start?: string; end?: string; due?: string; skill?: Skill } = {}) =>
    taskRows.push(
      `(${wk}, ${q(iso(addDays(base, day)))}, ${qn(extra.start)}, ${qn(extra.end)}, ${minutes}, ${q(type)}, ${q(extra.skill ?? skill)}, ${q(title)}, ${q(desc)}, ${qn(extra.due)})`,
    )
  const session = (day: number, title: string, desc: string) => task(day, 'teacher_session', 90, title, desc, { start: '20:00', end: '21:30' })
  const homework = (day: number, dueDay: number, c: Chapter) =>
    task(day, 'homework', 45, `Homework: ${c.skill} Ch ${c.number} exercises`,
      `Finish the exercises in ${c.skill} chapter ${c.number} (${c.title}) that we did not complete in class. Check with the answer key and, when you mark it done, write your score (e.g. 12/15) and anything that was difficult.`,
      { due: iso(addDays(base, dueDay)) })
  const homeworkDay = (day: number, c: Chapter) =>
    task(day, 'self_study', 60, `Anki + Ch ${c.number} homework`, `${anki} 45 min: work on the ${c.skill} chapter ${c.number} homework exercises.`)
  const practiceDay = (day: number, c: Chapter) => {
    const item = practice[skill].shift()
    if (!item) throw new Error(`Ran out of ${skill} practice items in week ${wk}`)
    task(day, 'self_study', 60, `Anki + ${item}`,
      `${anki} 45 min: do ${item} (${BOOK}) under exam timing, then check with the answer key. Look closely at the ${c.focus} questions you got wrong.`)
  }

  // Monday class + homework due Friday
  session(0, `Guide ${chapterName(mon)}`, `Class: ${BOOK}, ${skill} chapter ${mon.number} – ${mon.focus}.`)
  homework(0, 4, mon)
  homeworkDay(1, mon) // Tue
  practiceDay(2, mon) // Wed

  // Thursday: weekly review, or the final Listening test in the last week
  if (isLastWeek) {
    task(3, 'self_study', 60, `Anki + ${FINAL_LISTENING_TEST}`,
      `${anki} Then ${FINAL_LISTENING_TEST} under exam conditions (about 40 min including transfer time). Check answers and record the score in Progress.`, { skill: 'Listening' })
  } else {
    task(3, 'self_study', 60, 'Anki + weekly review',
      `${anki} 45 min: redo the questions you got wrong this week. Read the ${skill === 'Listening' ? 'audio transcript' : 'passage'} again and find where each missed answer is.`)
  }

  // Friday class (+ homework due next Monday), Saturday, Sunday
  if (fri === 'final-review') {
    session(4, 'Final review', 'Go through the mistakes from the final Listening test and the Reading practice so far, revise the weakest question types, and plan the next steps after the course.')
    task(5, 'self_study', 60, 'Anki + review before the final Reading test',
      `${anki} 45 min: re-read your notes from Reading chapters 1–7 and the mistakes you logged. No new practice today.`)
    task(6, 'self_study', 60, FINAL_READING_TEST,
      `${FINAL_READING_TEST}: 60 minutes, exam conditions. Check answers and record the band score in Progress. (No Anki today.)`)
  } else {
    session(4, `Guide ${chapterName(fri)}`, `Class: ${BOOK}, ${skill} chapter ${fri.number} – ${fri.focus}.`)
    homework(4, 7, fri)
    homeworkDay(5, fri) // Sat
    practiceDay(6, fri) // Sun
  }
}

const vocabRows = vocabulary.map(
  (v) =>
    `(${q(v.word)}, ${q(v.ipa)}, ${q(v.definitionEn)}, ${q(v.meaningVi)}, ${q(v.example)}, array[${v.collocations.map(q).join(', ')}]::text[], ${v.weekNumber ?? 'null'})`,
)

const header = '-- GENERATED by scripts/gen-seed.ts – edit plan-template.ts and run `npm run gen:seed`.'
const insertWeeks = `insert into public.study_weeks (week_number, start_date, end_date, skill_focus, focus) values\n${weekRows.join(',\n')}`
const insertTasks = `insert into public.study_tasks (week_number, task_date, start_time, end_time, duration_min, task_type, skill, title, description, due_date) values\n${taskRows.join(',\n')};`

const seed = `${header}
-- Seeds the 8-week plan (19 Oct – 13 Dec 2026) and starter vocabulary on a FRESH database.
-- Run once, after 002_rls.sql. If you already ran an older seed, use 005_replace_plan.sql instead.

do $$
begin
  if exists (select 1 from public.study_tasks) then
    raise exception 'Seed already applied: study_tasks is not empty. Use 005_replace_plan.sql to switch plans.';
  end if;
end $$;

${insertWeeks};

${insertTasks}

insert into public.vocabulary (word, ipa, definition_en, meaning_vi, example, collocations, week_number) values
${vocabRows.join(',\n')};
`

const replace = `${header}
-- Replaces the study plan (weeks + tasks) on a database that was already seeded.
-- Vocabulary, test results and users are kept. Refuses to run once the student has
-- completed any task, so no progress is ever deleted.

begin;

do $$
begin
  if exists (select 1 from public.task_completions) then
    raise exception 'The student has already completed tasks. Replacing the plan would delete that progress; edit tasks in the app instead.';
  end if;
end $$;

delete from public.study_tasks;

${insertWeeks}
on conflict (week_number) do update set
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  skill_focus = excluded.skill_focus,
  focus = excluded.focus;

${insertTasks}

commit;

-- Check: 8 weeks, ${taskRows.length} tasks.
select (select count(*) from public.study_weeks) as weeks, (select count(*) from public.study_tasks) as tasks;
`

writeFileSync(new URL('../supabase/migrations/003_seed.sql', import.meta.url), seed)
writeFileSync(new URL('../supabase/migrations/005_replace_plan.sql', import.meta.url), replace)
console.log(`Wrote ${weekRows.length} weeks, ${taskRows.length} tasks, ${vocabRows.length} words (003_seed.sql, 005_replace_plan.sql)`)
