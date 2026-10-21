-- IELTS Study Tracker: Row Level Security.
-- Every table has RLS on. Anonymous (not logged in) requests get nothing.
--   teacher: manages the plan, tasks and vocabulary; reads all student data.
--   student: reads the plan; writes only their own completions, reviews and scores.

-- True when the current user is the teacher. SECURITY DEFINER so policies on
-- profiles don't recurse; search_path pinned for safety.
create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'teacher'
  );
$$;

revoke execute on function public.is_teacher() from public, anon;
grant execute on function public.is_teacher() to authenticated;

alter table public.profiles         enable row level security;
alter table public.study_weeks      enable row level security;
alter table public.study_tasks      enable row level security;
alter table public.task_completions enable row level security;
alter table public.vocabulary       enable row level security;
alter table public.vocab_reviews    enable row level security;
alter table public.test_results     enable row level security;

-- profiles: both users can see each other's name/role. No one can change a role
-- through the API (no insert/update/delete policies); profiles are created by trigger.
create policy "profiles: read" on public.profiles
  for select to authenticated using (true);

-- study_weeks
create policy "weeks: read" on public.study_weeks
  for select to authenticated using (true);
create policy "weeks: teacher insert" on public.study_weeks
  for insert to authenticated with check (public.is_teacher());
create policy "weeks: teacher update" on public.study_weeks
  for update to authenticated using (public.is_teacher()) with check (public.is_teacher());
create policy "weeks: teacher delete" on public.study_weeks
  for delete to authenticated using (public.is_teacher());

-- study_tasks
create policy "tasks: read" on public.study_tasks
  for select to authenticated using (true);
create policy "tasks: teacher insert" on public.study_tasks
  for insert to authenticated with check (public.is_teacher());
create policy "tasks: teacher update" on public.study_tasks
  for update to authenticated using (public.is_teacher()) with check (public.is_teacher());
create policy "tasks: teacher delete" on public.study_tasks
  for delete to authenticated using (public.is_teacher());

-- task_completions: student owns their rows; teacher can only read.
create policy "completions: read own or teacher" on public.task_completions
  for select to authenticated using (student_id = auth.uid() or public.is_teacher());
create policy "completions: student insert" on public.task_completions
  for insert to authenticated with check (student_id = auth.uid() and not public.is_teacher());
create policy "completions: student update" on public.task_completions
  for update to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid() and not public.is_teacher());
create policy "completions: student delete" on public.task_completions
  for delete to authenticated using (student_id = auth.uid());

-- vocabulary
create policy "vocab: read" on public.vocabulary
  for select to authenticated using (true);
create policy "vocab: teacher insert" on public.vocabulary
  for insert to authenticated with check (public.is_teacher());
create policy "vocab: teacher update" on public.vocabulary
  for update to authenticated using (public.is_teacher()) with check (public.is_teacher());
create policy "vocab: teacher delete" on public.vocabulary
  for delete to authenticated using (public.is_teacher());

-- vocab_reviews
create policy "reviews: read own or teacher" on public.vocab_reviews
  for select to authenticated using (student_id = auth.uid() or public.is_teacher());
create policy "reviews: student insert" on public.vocab_reviews
  for insert to authenticated with check (student_id = auth.uid() and not public.is_teacher());
create policy "reviews: student delete" on public.vocab_reviews
  for delete to authenticated using (student_id = auth.uid());

-- test_results
create policy "results: read own or teacher" on public.test_results
  for select to authenticated using (student_id = auth.uid() or public.is_teacher());
create policy "results: student insert" on public.test_results
  for insert to authenticated with check (student_id = auth.uid() and not public.is_teacher());
create policy "results: student update" on public.test_results
  for update to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "results: student delete" on public.test_results
  for delete to authenticated using (student_id = auth.uid());

-- Belt and braces: the anon role gets no table privileges at all.
revoke all on all tables in schema public from anon;
