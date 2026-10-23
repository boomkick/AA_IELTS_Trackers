# 01: Keep Missions in the database and the store

**What to build:** Migration 010 has not been applied, so the Mission tables (`study_tasks`, `task_completions`) still hold the seeded Weeks 1–8. Change 010 so it keeps them: it still drops `vocabulary.week_number`. It drops the `study_weeks` table and the `study_tasks.week_number` column, because a Mission's Week now comes from its date. It also allows `Writing` in `study_tasks.skill`. Add a pure `courseWeeks(course)` and `weekOf(weeks, date)` (test-first) that turn the Course dates into numbered Monday–Sunday Weeks. The store loads Missions and completions again and offers add, edit and delete Mission (teacher) and tick Mission (student). The old `TaskForm` comes back as the Mission form, with Writing as a skill option and no week field.

**Blocked by:** none

**Status:** ready-for-agent

- [ ] With the Course 2026-10-19 to 2027-04-19, `courseWeeks` gives 27 Weeks, Week 1 is 19–25 Oct, and 2026-10-23 falls in Week 1.
- [ ] Moving the Course end date changes the number of Weeks without touching any Mission.
- [ ] The seeded Missions of Weeks 1–8 survive the migration with their completions.
- [ ] Only the teacher can add, edit or delete a Mission, and only the student can tick one (RLS unchanged from 001/002).
- [ ] Lint, build and tests are clean.
