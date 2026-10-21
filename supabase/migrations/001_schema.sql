-- IELTS Study Tracker: tables, constraints and triggers.
-- Run in the Supabase SQL Editor (or `supabase db push`). Run 002_rls.sql right after.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user. Role decides permissions (see 002_rls.sql).
-- PINs are never stored here: they are the Supabase Auth password (bcrypt-hashed).
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null unique check (username ~ '^[a-z0-9_]{3,32}$'),
  display_name text not null,
  role         text not null default 'student' check (role in ('teacher', 'student')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile automatically when a user is added in Authentication → Users.
-- Username = part of the email before "@" (teacher@ielts.local → teacher). Everyone
-- starts as a student; 004_set_teacher.sql promotes the teacher account.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  uname text := lower(split_part(new.email, '@', 1));
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, uname, initcap(uname));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- study_weeks: the 8-week frame of the course.
-- ---------------------------------------------------------------------------
create table public.study_weeks (
  week_number smallint primary key check (week_number between 1 and 52),
  start_date  date not null,
  end_date    date not null,
  skill_focus text not null check (skill_focus in ('Listening', 'Reading')),
  focus       text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (end_date >= start_date)
);

create trigger study_weeks_updated_at before update on public.study_weeks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- study_tasks: everything on the plan – teacher sessions, self-study and homework.
-- Owned by the teacher. Student progress lives in task_completions, never here.
-- ---------------------------------------------------------------------------
create table public.study_tasks (
  id           uuid primary key default gen_random_uuid(),
  week_number  smallint not null references public.study_weeks (week_number) on update cascade,
  task_date    date not null,
  start_time   time,
  end_time     time,
  duration_min integer not null check (duration_min between 5 and 600),
  task_type    text not null check (task_type in ('teacher_session', 'self_study', 'homework')),
  skill        text not null check (skill in ('Listening', 'Reading')),
  title        text not null check (length(title) between 1 and 200),
  description  text not null default '',
  due_date     date,
  created_by   uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (task_type <> 'homework' or due_date is not null),
  check (due_date is null or due_date >= task_date),
  check (end_time is null or start_time is null or end_time > start_time)
);

create index study_tasks_date_idx on public.study_tasks (task_date);
create index study_tasks_week_idx on public.study_tasks (week_number);

create trigger study_tasks_updated_at before update on public.study_tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- task_completions: the student ticking a task / submitting homework.
-- ---------------------------------------------------------------------------
create table public.task_completions (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references public.study_tasks (id) on delete cascade,
  student_id   uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  completed_at timestamptz not null default now(),
  -- local calendar day of completion, used for streaks
  completed_on date not null default (now() at time zone 'Asia/Ho_Chi_Minh')::date,
  score        text check (length(score) <= 50),
  note         text check (length(note) <= 2000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (task_id, student_id)
);

create index task_completions_student_idx on public.task_completions (student_id);

create trigger task_completions_updated_at before update on public.task_completions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- vocabulary (teacher-owned) + vocab_reviews (student marks a word as reviewed)
-- ---------------------------------------------------------------------------
create table public.vocabulary (
  id            uuid primary key default gen_random_uuid(),
  word          text not null check (length(word) between 1 and 100),
  ipa           text not null default '',
  definition_en text not null default '',
  meaning_vi    text not null default '',
  example       text not null default '',
  collocations  text[] not null default '{}',
  week_number   smallint references public.study_weeks (week_number) on update cascade on delete set null,
  created_by    uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger vocabulary_updated_at before update on public.vocabulary
  for each row execute function public.set_updated_at();

create table public.vocab_reviews (
  vocab_id    uuid not null references public.vocabulary (id) on delete cascade,
  student_id  uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  reviewed_at timestamptz not null default now(),
  primary key (vocab_id, student_id)
);

-- ---------------------------------------------------------------------------
-- test_results: mock/practice test scores recorded by the student.
-- ---------------------------------------------------------------------------
create table public.test_results (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  test_date       date not null,
  skill           text not null check (skill in ('Listening', 'Reading')),
  band            numeric(2, 1) not null check (band between 0 and 9 and band * 2 = floor(band * 2)),
  correct         smallint not null check (correct >= 0),
  total_questions smallint not null default 40 check (total_questions > 0),
  notes           text check (length(notes) <= 2000),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (correct <= total_questions)
);

create index test_results_student_idx on public.test_results (student_id, test_date);

create trigger test_results_updated_at before update on public.test_results
  for each row execute function public.set_updated_at();
