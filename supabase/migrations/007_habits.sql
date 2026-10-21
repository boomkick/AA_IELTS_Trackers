-- Habits: recurring practice in a Stage, on a rhythm of 1–7 times a week (7 = daily).
-- See GLOSSARY.md. Run after 006.

begin;

-- ---------------------------------------------------------------------------
-- habits: owned by the teacher, like Goals.
-- ---------------------------------------------------------------------------
create table public.habits (
  id             uuid primary key default gen_random_uuid(),
  skill          text not null,
  stage          text not null,
  title          text not null check (length(title) between 1 and 200),
  description    text not null default '',
  times_per_week integer not null check (times_per_week between 1 and 7),
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (public.is_stage_of(skill, stage))
);

create index habits_stage_idx on public.habits (skill, stage, sort_order);

create trigger habits_updated_at before update on public.habits
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- habit_ticks: the student doing a Habit on a day. At most one tick a day.
-- Deleting a Habit removes its ticks.
-- ---------------------------------------------------------------------------
create table public.habit_ticks (
  habit_id   uuid not null references public.habits (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  ticked_on  date not null default (now() at time zone 'Asia/Ho_Chi_Minh')::date,
  primary key (habit_id, student_id, ticked_on)
);

create index habit_ticks_student_idx on public.habit_ticks (student_id, ticked_on);

-- ---------------------------------------------------------------------------
-- RLS: the teacher edits Habits; the student ticks and unticks them, today only.
-- ---------------------------------------------------------------------------
alter table public.habits      enable row level security;
alter table public.habit_ticks enable row level security;

create policy "habits: read" on public.habits
  for select to authenticated using (true);
create policy "habits: teacher insert" on public.habits
  for insert to authenticated with check (public.is_teacher());
create policy "habits: teacher update" on public.habits
  for update to authenticated using (public.is_teacher()) with check (public.is_teacher());
create policy "habits: teacher delete" on public.habits
  for delete to authenticated using (public.is_teacher());

create policy "habit ticks: read own or teacher" on public.habit_ticks
  for select to authenticated using (student_id = auth.uid() or public.is_teacher());
create policy "habit ticks: student insert today" on public.habit_ticks
  for insert to authenticated with check (
    student_id = auth.uid() and not public.is_teacher()
    and ticked_on = (now() at time zone 'Asia/Ho_Chi_Minh')::date
  );
create policy "habit ticks: student delete today" on public.habit_ticks
  for delete to authenticated using (
    student_id = auth.uid() and ticked_on = (now() at time zone 'Asia/Ho_Chi_Minh')::date
  );

revoke all on public.habits, public.habit_ticks from anon;

-- ---------------------------------------------------------------------------
-- Seed: the starting Habits of the course plan.
-- ---------------------------------------------------------------------------
insert into public.habits (skill, stage, sort_order, times_per_week, title, description) values
  ('Listening', 'foundation', 1, 7, 'BBC Learning English', ''),
  ('Listening', 'foundation', 2, 2, 'Dictation in class', ''),

  ('Listening', 'diagnosis', 1, 7, 'BBC Learning English', ''),

  ('Listening', 'focus', 1, 7, 'BBC Learning English', ''),
  ('Listening', 'focus', 2, 3, 'YouTube listening', 'Recommended channels, e.g. The Ramsey Show'),

  ('Listening', 'exam_ready', 1, 7, 'BBC Learning English', ''),
  ('Listening', 'exam_ready', 2, 3, 'YouTube listening', 'Recommended channels, e.g. The Ramsey Show'),

  ('Reading', 'passage3', 1, 2, 'Passage 3 practice', ''),

  ('Writing', 'practice', 1, 1, 'Task 1 report (bar or line chart)', ''),
  ('Writing', 'practice', 2, 1, 'Task 2 essay', 'Takes about twice as long as the Task 1 report');

commit;

-- Check: Listening foundation 2, diagnosis 1, focus 2, exam_ready 2; Reading passage3 1; Writing practice 2.
select skill, stage, count(*) from public.habits group by 1, 2 order by 1, 2;
