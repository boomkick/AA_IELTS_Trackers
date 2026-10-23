-- Remove the stored 8-week calendar frame. Weeks are now computed from the Course dates
-- (ADR 0002, src/lib/weeks.ts), so study_weeks and every week_number column go. The
-- Missions in study_tasks and the student's ticks in task_completions are kept: Weeks 1–8
-- keep the Missions seeded by 003/005, and a Mission's Week comes from its date.
-- Run after 009.

begin;

-- Vocabulary no longer belongs to a week.
alter table public.vocabulary drop column week_number;

-- A Mission's Week is computed from task_date (drops its index and foreign key too).
alter table public.study_tasks drop column week_number;

drop table public.study_weeks;

-- Missions may now be for Writing as well.
alter table public.study_tasks drop constraint study_tasks_skill_check;
alter table public.study_tasks add constraint study_tasks_skill_check
  check (skill in ('Listening', 'Reading', 'Writing'));

commit;

-- Check: the seeded Missions and their ticks are still there.
select (select count(*) from public.study_tasks) as missions, (select count(*) from public.task_completions) as ticks;
