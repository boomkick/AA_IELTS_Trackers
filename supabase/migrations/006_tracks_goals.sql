-- Stages: Skill tracks and their Goals (see GLOSSARY.md and docs/adr/0001).
-- Stage names, order and Gates live in src/lib/stages.ts; this file stores where each
-- track is, the teacher-editable Goals of each Stage, and the student's Goal ticks.
-- Run after 001–005. The old calendar tables are left alone here.

begin;

-- Valid (skill, stage) pairs, matching TRACKS in src/lib/stages.ts.
create or replace function public.is_stage_of(skill text, stage text)
returns boolean
language sql
immutable
as $$
  select (skill, stage) in (
    ('Listening', 'foundation'), ('Listening', 'diagnosis'), ('Listening', 'focus'), ('Listening', 'exam_ready'),
    ('Reading', 'foundation'), ('Reading', 'diagnosis'), ('Reading', 'focus'), ('Reading', 'passage3'),
    ('Writing', 'templates'), ('Writing', 'practice')
  );
$$;

-- ---------------------------------------------------------------------------
-- tracks: one row per skill. stage and entered_on are null until the track starts.
-- ---------------------------------------------------------------------------
create table public.tracks (
  skill      text primary key check (skill in ('Listening', 'Reading', 'Writing')),
  stage      text check (stage is null or public.is_stage_of(skill, stage)),
  entered_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((stage is null) = (entered_on is null))
);

create trigger tracks_updated_at before update on public.tracks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- goals: what the student should get done in a Stage. Owned by the teacher.
-- ---------------------------------------------------------------------------
create table public.goals (
  id          uuid primary key default gen_random_uuid(),
  skill       text not null,
  stage       text not null,
  title       text not null check (length(title) between 1 and 200),
  description text not null default '',
  due_date    date,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (public.is_stage_of(skill, stage))
);

create index goals_stage_idx on public.goals (skill, stage, sort_order);

create trigger goals_updated_at before update on public.goals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- goal_completions: the student ticking a Goal. Deleting a Goal removes its ticks.
-- ---------------------------------------------------------------------------
create table public.goal_completions (
  goal_id      uuid not null references public.goals (id) on delete cascade,
  student_id   uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  completed_on date not null default (now() at time zone 'Asia/Ho_Chi_Minh')::date,
  primary key (goal_id, student_id)
);

create index goal_completions_student_idx on public.goal_completions (student_id);

-- ---------------------------------------------------------------------------
-- RLS: the teacher edits tracks and Goals; the student only ticks Goals.
-- ---------------------------------------------------------------------------
alter table public.tracks           enable row level security;
alter table public.goals            enable row level security;
alter table public.goal_completions enable row level security;

create policy "tracks: read" on public.tracks
  for select to authenticated using (true);
create policy "tracks: teacher insert" on public.tracks
  for insert to authenticated with check (public.is_teacher());
create policy "tracks: teacher update" on public.tracks
  for update to authenticated using (public.is_teacher()) with check (public.is_teacher());
create policy "tracks: teacher delete" on public.tracks
  for delete to authenticated using (public.is_teacher());

create policy "goals: read" on public.goals
  for select to authenticated using (true);
create policy "goals: teacher insert" on public.goals
  for insert to authenticated with check (public.is_teacher());
create policy "goals: teacher update" on public.goals
  for update to authenticated using (public.is_teacher()) with check (public.is_teacher());
create policy "goals: teacher delete" on public.goals
  for delete to authenticated using (public.is_teacher());

create policy "goal ticks: read own or teacher" on public.goal_completions
  for select to authenticated using (student_id = auth.uid() or public.is_teacher());
create policy "goal ticks: student insert" on public.goal_completions
  for insert to authenticated with check (student_id = auth.uid() and not public.is_teacher());
create policy "goal ticks: student delete" on public.goal_completions
  for delete to authenticated using (student_id = auth.uid());

revoke all on public.tracks, public.goals, public.goal_completions from anon;

-- ---------------------------------------------------------------------------
-- Seed: Listening is in Foundation from the course start; Reading and Writing wait.
-- ---------------------------------------------------------------------------
insert into public.tracks (skill, stage, entered_on) values
  ('Listening', 'foundation', '2026-10-19'),
  ('Reading', null, null),
  ('Writing', null, null);

insert into public.goals (skill, stage, sort_order, title, description) values
  ('Listening', 'foundation', 1, 'Guide Listening Ch 1: Getting ready to listen', 'Test format, predicting answers before you listen'),
  ('Listening', 'foundation', 2, 'Guide Listening Ch 2: Following a conversation', 'Section 1 style conversations, form and note completion'),
  ('Listening', 'foundation', 3, 'Guide Listening Ch 3: Recognising paraphrase', 'Hearing the same idea in different words'),
  ('Listening', 'foundation', 4, 'Guide Listening Ch 4: Places and directions', 'Map and plan labelling'),
  ('Listening', 'foundation', 5, 'Guide Listening Ch 5: Listening for actions and processes', 'Flow-charts and process questions'),
  ('Listening', 'foundation', 6, 'Guide Listening Ch 6: Attitude and opinion', 'Speakers’ opinions, multiple choice and matching'),
  ('Listening', 'foundation', 7, 'Guide Listening Ch 7: Following a lecture or talk', 'Section 4 lectures, note completion'),
  ('Listening', 'foundation', 8, 'Guide Listening Ch 8: Contrasting ideas', 'Signposts and contrasting points'),

  ('Listening', 'diagnosis', 1, 'Full Listening test (diagnostic)', ''),
  ('Listening', 'diagnosis', 2, 'Learn the Lilie technique', ''),

  ('Listening', 'focus', 1, 'Section 1 focus', ''),
  ('Listening', 'focus', 2, 'Section 2 focus', ''),
  ('Listening', 'focus', 3, 'Section 3 focus', ''),
  ('Listening', 'focus', 4, 'Section 4 focus', ''),

  ('Reading', 'foundation', 1, 'Guide Reading Ch 1: Reading strategies', 'Skimming, scanning and time management'),
  ('Reading', 'foundation', 2, 'Guide Reading Ch 2: Descriptive passages', 'Following descriptions; completion tasks'),
  ('Reading', 'foundation', 3, 'Guide Reading Ch 3: Understanding the main ideas', 'Main ideas, matching headings'),
  ('Reading', 'foundation', 4, 'Guide Reading Ch 4: Locating and matching', 'Matching information and features'),
  ('Reading', 'foundation', 5, 'Guide Reading Ch 5: Discursive passages', 'Following an argument'),
  ('Reading', 'foundation', 6, 'Guide Reading Ch 6: Multiple-choice questions', 'Multiple-choice strategies'),
  ('Reading', 'foundation', 7, 'Guide Reading Ch 7: Opinions and attitudes', 'Writers’ views, Yes / No / Not Given'),

  ('Reading', 'diagnosis', 1, 'Full Reading test (diagnostic)', ''),
  ('Reading', 'diagnosis', 2, 'Learn the Lilie technique', ''),
  ('Reading', 'diagnosis', 3, 'Fast reading: main subject and main verb', ''),
  ('Reading', 'diagnosis', 4, 'Fast reading: what to skip', ''),
  ('Reading', 'diagnosis', 5, 'Fast reading: the main point of a paragraph', ''),

  ('Writing', 'templates', 1, 'Task 1 template: bar and line charts', ''),
  ('Writing', 'templates', 2, 'Task 2 template: opinion essay', ''),
  ('Writing', 'templates', 3, 'Task 2 template: discuss both views', ''),

  ('Writing', 'practice', 1, 'Task 1 once: pie chart', ''),
  ('Writing', 'practice', 2, 'Task 1 once: table', ''),
  ('Writing', 'practice', 3, 'Task 1 once: process diagram', ''),
  ('Writing', 'practice', 4, 'Task 1 once: map', ''),
  ('Writing', 'practice', 5, 'Task 1 once: mixed charts', '');

commit;

-- Check: Listening foundation 8, diagnosis 2, focus 4; Reading foundation 7, diagnosis 5;
-- Writing templates 3, practice 5.
select skill, stage, count(*) from public.goals group by 1, 2 order by 1, 2;
