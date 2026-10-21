# IELTS Study Tracker

A small web app for one teacher and one student to follow an 8-week IELTS plan
(19 Oct – 13 Dec 2026: Listening weeks 1–4, Reading weeks 5–8).

- **Frontend:** React + TypeScript + Vite, Tailwind CSS, TanStack Query, Recharts
- **Backend:** Supabase (Postgres + Auth + Row Level Security). No custom server.
- **Hosting:** Vercel Hobby (free) + Supabase free tier

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
  | Study weeks, tasks, homework, vocabulary | create / edit / delete | read |
  | Tracks, Goals and Habits | create / edit / delete | read |
  | Goal and Habit ticks | read | own rows only (Habit ticks: today only) |
  | Task completions, homework scores & notes | read | own rows only |
  | Vocabulary "reviewed" marks | read | own rows only |
  | Test results | read; add for the student (Writing marks) | own rows only |
  | Profiles / roles | read | read (nobody can change roles via the API) |

- Anonymous requests get no data at all.

## Database

| Table | Purpose |
|---|---|
| `profiles` | One row per user: username, display name, role. Created by a trigger when you add an auth user. |
| `study_weeks` | The 8 weeks: dates, skill focus, topic. |
| `study_tasks` | Teacher sessions (Mon/Wed/Fri 20:00–21:30), self-study and homework (with due date). |
| `task_completions` | Student ticks a task / submits homework (score, note). One per task. |
| `vocabulary` | Word, IPA, English definition, Vietnamese meaning, example, collocations. |
| `vocab_reviews` | Words the student has marked as reviewed. |
| `test_results` | Full test results: band (0–9, steps of 0.5); Listening Section scores, Reading correct and wrong answers per Question type, or the Writing Task. |
| `tracks` | Each skill's current Stage and the day it entered it (null until started). |
| `goals` | The Goals of each Stage, with an optional due date. Edited by the teacher. |
| `goal_completions` | Student ticks a Goal. Deleted with the Goal. |
| `habits` | The Habits of each Stage, each 1–7 times a week (7 = daily). Edited by the teacher. |
| `habit_ticks` | Student ticks a Habit, at most once a day. Deleted with the Habit. |

SQL files, run in order:

1. `001_schema.sql` – tables, constraints, triggers
2. `002_rls.sql` – Row Level Security policies
3. `003_seed.sql` – the 8-week plan (80 tasks) and starter vocabulary (generated, see below)
4. `004_set_teacher.sql` – gives the teacher account its role (run after creating users)
5. `005_replace_plan.sql` – replaces the plan on an already seeded database
6. `006_tracks_goals.sql` – Skill tracks, Stage Goals and Goal ticks, with the starting Goals
7. `007_habits.sql` – Stage Habits and Habit ticks, with the starting Habits
8. `008_result_details.sql` – Writing results, Listening Section scores, Reading wrong answers per Question type; the teacher can add results

## Setup

### 1. Create the Supabase project

1. Sign up at <https://supabase.com> and create a new project (free plan).
   Pick a region close to you (e.g. Singapore).
2. Open **SQL Editor → New query**, paste the contents of
   `supabase/migrations/001_schema.sql`, click **Run**. Repeat for `002_rls.sql`,
   then `003_seed.sql`.

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
   on routes like `/plan` work.

## Changing the default plan

The seed is generated from `scripts/plan-template.ts`. Edit it, then:

```bash
npm run gen:seed   # rewrites supabase/migrations/003_seed.sql
```

The seed refuses to run twice. Once the course has started, edit tasks in the app
(teacher account) instead.

## Free-tier notes

- A free Supabase project **pauses after 7 days without activity**. Daily use keeps it
  awake; if it pauses, resume it from the Supabase dashboard (data is kept).
- Two users and a few hundred rows are far below every free-tier limit.

## Not built yet

- Error Log page (shows "Under construction").
