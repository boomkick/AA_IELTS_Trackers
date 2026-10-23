-- Remove the dated 8-week calendar (ADR 0001, the contract step). Stages, Goals and
-- Habits replace it. No student had used the app, so there is no data to keep.
-- Run after 009.

begin;

-- Vocabulary no longer belongs to a week.
alter table public.vocabulary drop column week_number;

drop table public.task_completions;
drop table public.study_tasks;
drop table public.study_weeks;

commit;
