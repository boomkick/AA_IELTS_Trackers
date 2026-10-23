# IELTS Study Tracker

A small web app for one teacher and one student to run a roughly six-month IELTS
Course. Each skill (Listening, Reading, Writing) moves through its own Skill track
of Stages. Each Stage has a few Goals to finish and a small list of Habits to keep,
and a Gate (Goals done, or a Full test band) that suggests when to advance. The
teacher confirms each move. Alongside the Stages, the Course is split into Weeks
(Monday to Sunday, from the Course start date to its end date), and each Week holds
dated Missions: Classes, Self-study and Homework. Stages decide what the student is
working on and when to move on; Weeks and Missions decide what happens on which day.
See `GLOSSARY.md` for the terms, `docs/adr/0001-stages-replace-dated-weekly-plan.md`
for the Stages and `docs/adr/0002-weeks-and-missions-alongside-stages.md` for why
Weeks came back.

- **Frontend:** React + TypeScript + Vite, Tailwind CSS, TanStack Query, Recharts
- **Backend:** Supabase (Postgres + Auth + Row Level Security). No custom server.
- **Hosting:** Vercel Hobby (free) + Supabase free tier

## Pages

- **This week** (landing page): "Week N of M", the weeks left, and the shown Week's
  Missions in seven day columns. The student ticks Missions; the teacher adds, edits
  and deletes them. Beside them, one card per started track: current Stage, Gate
  status, its Goals, today's Habits (the student ticks them here) and the next Full test.
- **Course plan:** every Week of the Course against the Stage each skill was really in
  that Week (from the Stage history), each Week's completion bar, and the picked
  Week's Missions grouped as Class, Homework and Self-study.
- **Stages:** the three tracks side by side. The student ticks Goals and Habits; the
  teacher edits them, starts and advances tracks, and moves the Course end date.
- **Vocabulary:** the word list; the student marks words reviewed.
- **Progress:** Full test results per skill, the band chart and the weakest area.

## How it works

```
Teacher browser ─┐
                 ├─ supabase-js (public anon key) ─> Supabase Auth + Postgres (RLS)
Student browser ─┘
```

- **Login** is username + PIN. The username is mapped to a synthetic email
  (`teacher` → `teacher@ielts.local`) and the PIN is the Supabase Auth password,
  so it is stored as a bcrypt hash, never in plain text. Sign-ups are disabled;
  only the two accounts you create exist.
- **Permissions** are enforced in the database by RLS (`supabase/migrations/002_rls.sql`),
  not just hidden in the UI:

  | Data | Teacher | Student |
  |---|---|---|
  | Course dates, tracks, Stage history, Goals, Habits, Missions, vocabulary | create / edit / delete (Course: end date only) | read |
  | Goal, Habit and Mission ticks | read | own rows only (Habit ticks: today only) |
  | Vocabulary "reviewed" marks | read | own rows only |
  | Test results | read; add for the student (Writing marks) | own rows only |
  | Profiles / roles | read | read (nobody can change roles via the API) |

- Anonymous requests get no data at all.

## Database

| Table | Purpose |
|---|---|
| `profiles` | One row per user: username, display name, role. Created by a trigger when you add an auth user. |
| `vocabulary` | Word, IPA, English definition, Vietnamese meaning, example, collocations. |
| `vocab_reviews` | Words the student has marked as reviewed. |
| `test_results` | Full test results: band (0–9, steps of 0.5); Listening Section scores, Reading correct and wrong answers per Question type, or the Writing Task. |
| `course` | One row: the Course start and end date. The teacher moves the end date to the exam date. |
| `tracks` | Each skill's current Stage and the day it entered it (null until started). |
| `stage_entries` | Stage history: every start or advance of a track, with the Stage and the day. Added by a trigger on `tracks`. |
| `study_tasks` | Missions: date, type (Class with start and end time, Self-study, Homework with a due date), skill, title, instructions. A Mission's Week comes from its date. |
| `task_completions` | Student ticks a Mission. Deleted with the Mission. |
| `goals` | The Goals of each Stage, with an optional due date. Edited by the teacher. |
| `goal_completions` | Student ticks a Goal. Deleted with the Goal. |
| `habits` | The Habits of each Stage, each 1–7 times a week (7 = daily). Edited by the teacher. |
| `habit_ticks` | Student ticks a Habit, at most once a day. Deleted with the Habit. |

SQL files in `supabase/migrations/`, run in this order (a fresh setup skips 005).
001–005 are the original schema; 003 and 005 also seeded the old 8-week calendar.
010 dropped that calendar (ADR 0001), and 011 brings the Missions back (ADR 0002)
without a week column: Weeks are not stored but computed from the Course dates
(`src/lib/weeks.ts`). 011 re-seeds the Missions of Weeks 1–8 (19 Oct – 13 Dec 2026).

1. `001_schema.sql` – profiles, vocabulary, test results and the old calendar tables
2. `002_rls.sql` – Row Level Security policies
3. `003_seed.sql` – starter vocabulary (and the old calendar). Fresh databases only.
4. `004_set_teacher.sql` – gives the teacher account its role (run after creating users)
5. `005_replace_plan.sql` – only for databases seeded before it; skip it on a fresh setup
6. `006_tracks_goals.sql` – Skill tracks, Stage Goals and Goal ticks, with the starting Goals
7. `007_habits.sql` – Stage Habits and Habit ticks, with the starting Habits
8. `008_result_details.sql` – Writing results, Listening Section scores, Reading wrong answers per Question type; the teacher can add results
9. `009_course.sql` – Course start and end date (2026-10-19 to 2027-04-19 at first)
10. `010_remove_calendar.sql` – drops the old calendar tables and the vocabulary week column
11. `011_missions.sql` – Missions and Mission ticks again, with no week column and Writing allowed; re-seeds Weeks 1–8
12. `012_stage_entries.sql` – the Stage history and the trigger on `tracks` that adds to it, filled once from the current tracks

## Setup

### 1. Create the Supabase project

1. Sign up at <https://supabase.com> and create a new project (free plan).
   Pick a region close to you (e.g. Singapore).
2. Open **SQL Editor → New query**, paste the contents of
   `supabase/migrations/001_schema.sql`, click **Run**. Repeat for `002_rls.sql`,
   then `003_seed.sql`. The rest run after the users exist (step 3).

### 2. Lock down authentication

1. **Authentication → Sign In / Providers → Email**: keep Email enabled.
2. Turn **off** "Allow new users to sign up".
3. (Optional) Under **Authentication → Rate Limits**, keep sign-in limits low
   to slow down PIN guessing.

### 3. Create the two users

1. **Authentication → Users → Add user → Create new user**
   - Email: `teacher@ielts.local`, Password: the teacher's PIN (6–8 digits),
     tick **Auto Confirm User**.
2. Repeat for `student@ielts.local` with the student's PIN.
3. In the SQL Editor run `supabase/migrations/004_set_teacher.sql`.
   The final `select` should show `teacher | teacher` and `student | student`.
4. Run `006_tracks_goals.sql` to `012_stage_entries.sql` in order (skip `005`).
   The `select` at the end of 006 and 007 lists the starting Goals and Habits per Stage.

To change a PIN later: **Authentication → Users → … → Change password**
(or reset it there).

### 4. Run locally

```bash
cp .env.example .env.local     # then fill in the two values
npm install
npm run dev                    # http://localhost:5173
npm test                       # unit tests (Vitest); run before every commit
```

Get the values from **Project Settings → API Keys**: the Project URL and the
`anon` / publishable key. **Never** use the `service_role` / secret key in this app.

### 5. Deploy to Vercel

1. Push this folder to a GitHub repository (private is fine).
2. On <https://vercel.com> → **Add New → Project** → import the repository.
   Vercel detects Vite (build `npm run build`, output `dist`).
3. Under **Environment Variables** add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (same values as `.env.local`).
4. **Deploy.** Every push to `main` redeploys. `vercel.json` makes page refreshes
   on routes like `/stages` work.

## Changing the course

Stage names, their order and their Gates are fixed in `src/lib/stages.ts` (ADR 0001).
Everything else is edited in the app with the teacher account: Goals and Habits on
the Stages page, starting and advancing tracks, the Course end date, and the Missions
of each Week on the This week or Course plan page. Moving the end date changes the
number of Weeks; later Weeks start empty until the teacher fills them.

## Free-tier notes

- A free Supabase project **pauses after 7 days without activity**. Daily use keeps it
  awake; if it pauses, resume it from the Supabase dashboard (data is kept).
- Two users and a few hundred rows are far below every free-tier limit.
