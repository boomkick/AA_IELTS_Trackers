-- Per-skill Full test results: Listening Section scores, Reading wrong answers per
-- Question type, and Writing bands for one Task. The teacher can record results too
-- (mainly Writing marks); they belong to the student. Run after 007.

begin;

-- Writing joins Listening and Reading.
alter table public.test_results drop constraint test_results_skill_check;
alter table public.test_results add constraint test_results_skill_check
  check (skill in ('Listening', 'Reading', 'Writing'));

-- Writing has no correct / total.
alter table public.test_results alter column correct drop not null;
alter table public.test_results alter column total_questions drop not null;
alter table public.test_results alter column total_questions drop default;

alter table public.test_results
  add column section_correct smallint[] check (
    section_correct is null
    or (array_length(section_correct, 1) = 4 and 0 <= all (section_correct) and 10 >= all (section_correct))
  ),
  add column wrong_by_type jsonb check (wrong_by_type is null or jsonb_typeof(wrong_by_type) = 'object'),
  add column writing_task smallint check (writing_task in (1, 2));

alter table public.test_results add constraint test_results_writing_task_check
  check ((skill = 'Writing') = (writing_task is not null));
alter table public.test_results add constraint test_results_correct_check
  check ((skill = 'Writing') = (correct is null));
-- Older Listening results have no Section scores; only new and edited rows need them.
alter table public.test_results add constraint test_results_sections_check
  check (skill <> 'Listening' or section_correct is not null) not valid;

-- The teacher records results for the student.
create policy "results: teacher insert" on public.test_results
  for insert to authenticated with check (
    public.is_teacher()
    and student_id in (select id from public.profiles where role = 'student')
  );

commit;
