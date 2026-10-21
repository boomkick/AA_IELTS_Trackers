-- Per-skill Full test results: Listening Section scores, Reading wrong answers per
-- Question type, and Writing bands for one Task. The teacher can record results too
-- (mainly Writing marks); they belong to the student. Run after 007.

begin;

-- ---------------------------------------------------------------------------
-- test_results: Writing joins Listening and Reading, with per-skill detail.
-- ---------------------------------------------------------------------------
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

-- (The inline checks above are auto-named test_results_<column>_check, and 001 already
-- has test_results_correct_check, so these rules get their own names.)
alter table public.test_results add constraint test_results_writing_shape
  check (
    case when skill = 'Writing'
      then writing_task is not null and correct is null and total_questions is null
      else writing_task is null and correct is not null and total_questions is not null
    end
  );
alter table public.test_results add constraint test_results_detail_skill
  check ((section_correct is null or skill = 'Listening') and (wrong_by_type is null or skill = 'Reading'));
-- Older Listening results have no Section scores; only new and edited rows need them.
alter table public.test_results add constraint test_results_sections_required
  check (skill <> 'Listening' or section_correct is not null) not valid;

-- ---------------------------------------------------------------------------
-- RLS: the teacher records results for the student.
-- ---------------------------------------------------------------------------
create policy "results: teacher insert" on public.test_results
  for insert to authenticated with check (
    public.is_teacher()
    and student_id in (select id from public.profiles where role = 'student')
  );

commit;
