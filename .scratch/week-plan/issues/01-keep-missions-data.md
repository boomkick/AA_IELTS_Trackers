# 01: Keep Missions in the database and the store

**What to build:** Migration 010 has not been applied, so the Mission tables (`study_tasks`, `task_completions`) still hold the seeded Weeks 1–8. Change 010 so it keeps them: it still drops `vocabulary.week_number`. It drops the `study_weeks` table and the `study_tasks.week_number` column, because a Mission's Week now comes from its date. It also allows `Writing` in `study_tasks.skill`. Add a pure `courseWeeks(course)` and `weekOf(weeks, date)` (test-first) that turn the Course dates into numbered Monday–Sunday Weeks. The store loads Missions and completions again and offers add, edit and delete Mission (teacher) and tick Mission (student). The old `TaskForm` comes back as the Mission form, with Writing as a skill option and no week field.

**Blocked by:** none

**Status:** resolved

- [ ] With the Course 2026-10-19 to 2027-04-19, `courseWeeks` gives 27 Weeks, Week 1 is 19–25 Oct, and 2026-10-23 falls in Week 1.
- [ ] Moving the Course end date changes the number of Weeks without touching any Mission.
- [ ] The seeded Missions of Weeks 1–8 survive the migration with their completions.
- [ ] Only the teacher can add, edit or delete a Mission, and only the student can tick one (RLS unchanged from 001/002).
- [ ] Lint, build and tests are clean.

## Comments

### Resolved (2026-10-23)

Committed on `stages-plan`. Migration 010 now drops only `vocabulary.week_number`, `study_tasks.week_number` and `study_weeks`, keeps `study_tasks` and `task_completions`, and allows Writing. `src/lib/weeks.ts` has `courseWeeks`, `weekOf`, `currentWeek` and `weekDays`, test-first. The last Week's `endDate` stops at the Course end, so a Mission after it has no Week, but `weekDays` still gives seven columns. The store loads Missions and ticks and has `upsertMission`, `deleteMission` and `setMissionDone`. The Mission form is `MissionForm`.

**Still open (user action):** apply 010 and 011 in Supabase, then check that the Missions of Weeks 1–8 and their ticks are still there.
