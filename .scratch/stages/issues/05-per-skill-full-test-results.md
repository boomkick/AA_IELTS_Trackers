# 05: Per-skill Full test results

**What to build:** Results capture what's needed to find weak spots. A Listening Full test records correct answers for each Section. A Reading Full test records wrong answers per Question type. Writing results can be recorded too, as a band for one Task 1 or Task 2 piece. The teacher can record results, mainly to mark Writing. The Progress page shows a Writing band line and a "Weakest area" from the latest Full tests. With this, the Focus Gate (≥ 7.0) can actually be met.

**Blocked by:** 01

**Status:** resolved

- [ ] Listening form: four Section scores, 0–10 each. The total correct (of 40) is their sum and isn't asked separately.
- [ ] Reading form: correct (of 40), plus a wrong-answer count for each Question type. Blanks and zeros aren't saved.
- [ ] Writing form: Task 1 or Task 2, and a band. There's no correct/total, and the score table shows "—" there, never "undefined".
- [ ] Every form has a date, a band (0–9 in steps of 0.5) and notes.
- [ ] Both the teacher and the student can add results. A result the teacher adds belongs to the student.
- [ ] The weakest area for Listening is the Section with the fewest correct, and ties go to the lower Section number. For Reading it's the Question type with the most wrong answers. If nothing was wrong, it shows "—".
- [ ] The band chart has a Writing line. The weekly task completion chart is removed.
- [ ] Existing Listening and Reading results still display.

## Comments

### Resolved (2026-10-21)

Committed on `stages-plan`. `weakestArea(result)` in `src/lib/stats.ts` built test-first. `008_result_details.sql` allows Writing results, makes correct/total optional for Writing, adds `section_correct`, `wrong_by_type` and `writing_task` with checks (the Listening Sections check is `not valid` so older rows stay), and a teacher insert policy limited to the student's rows. The Progress page form changes fields by skill; the table shows "—" for Writing; the chart has a Writing line; the weekly completion chart is gone.

**Still open (user action):** apply `008_result_details.sql` after 006/007, then add a Listening result (Sections 9/6/7/5, band 6.0: table shows 27/40, Weakest area "L: Section 4") and, as the teacher, a Writing Task 2 result (band 5.5: Correct shows "—", a Writing point appears on the chart).
