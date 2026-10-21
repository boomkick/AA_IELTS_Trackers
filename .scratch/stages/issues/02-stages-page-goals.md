# 02: Stages page with Goals

**What to build:** A new Stages page where both users see the three Skill tracks side by side. Each track shows every Stage: past ones collapsed with a tick, the current one open, future ones greyed out. The current Stage lists its Goals and its Gate status. The student ticks Goals done. The teacher adds, edits and deletes Goals in the current Stage, each with an optional due date that shows red when overdue. The database gains tracks, Goals and Goal ticks, filled with the course plan. The old calendar tables are left alone (they're removed in 07).

**Blocked by:** 01

**Status:** resolved

- [ ] A Stages entry in the navigation opens the page. The old Study Plan, Homework and Error Log pages still work.
- [ ] Starting data: Listening is in Foundation from 2026-10-19. Reading and Writing haven't started and show "Starts after Listening Foundation" and "Starts after Reading Foundation".
- [ ] Starting Goals:
  - Listening Foundation: 8 (Guide Listening Ch 1–8, using the existing chapter titles).
  - Listening Diagnosis: 2 (Full Listening test (diagnostic); Learn the Lilie technique).
  - Listening Focus: 4 (Section 1 focus to Section 4 focus).
  - Reading Foundation: 7 (Guide Reading Ch 1–7).
  - Reading Diagnosis: 5 (Full Reading test (diagnostic); Learn the Lilie technique; Fast reading: main subject and main verb; Fast reading: what to skip; Fast reading: the main point of a paragraph).
  - Writing Templates: 3 (Task 1 template: bar and line charts; Task 2 template: opinion essay; Task 2 template: discuss both views).
  - Writing Practice: 5 (Task 1 once: pie chart / table / process diagram / map / mixed charts).
  - Reading Focus, Reading Passage 3 and Listening Exam-ready start with none.
- [ ] The student ticks and unticks a Goal, and the tick survives a reload. The teacher sees ticks but can't tick.
- [ ] The teacher adds, edits and deletes Goals. The student has no edit controls, and the database refuses student edits, not just the UI.
- [ ] Deleting a Goal also removes its ticks.
- [ ] The current Stage shows the Gate status from ticket 01, e.g. "0 of 8 Goals done".

## Comments

### Handoff (2026-10-21, paused mid-implementation, nothing committed)

Branch `stages-plan`. All work below is uncommitted in the working tree.

**Done**
- Test seams agreed with the user: pure helpers only (store, page and RLS get build + manual checks). Added to `src/lib/stages.ts` with tests in `src/lib/stages.test.ts`, red then green: `stagePosition(track, key)` (past/current/future), `goalOverdue(goal, done, today)` (due today is not overdue; done or no due date never overdue), `startsAfterLabel(skill)`. 17 tests pass.
- `supabase/migrations/006_tracks_goals.sql`: `is_stage_of(skill, stage)` check function, tables `tracks`, `goals`, `goal_completions` (cascade on Goal delete), RLS (teacher edits tracks/Goals; student inserts/deletes own ticks, teacher reads), seed (Listening Foundation from 2026-10-19, Reading/Writing null, all starting Goals from this ticket with chapter focus as description). Old calendar tables untouched. **Not yet applied to Supabase.**
- `src/lib/store.tsx`: `tracks` (always three skills, course order), `goals`, `goalsDone` (goalId -> completed_on), `setGoalDone` (optimistic), `upsertGoal`, `deleteGoal`. New queries added to `core`.
- `src/components/GoalForm.tsx` (title, optional due date, details; mounted fresh per edit) and `src/pages/Stages.tsx` (three track cards; current Stage open with Goals, Gate badge from `gateStatus`, teacher Add/Edit/Delete; past Stages collapsed `<details>` with a tick; future ones collapsed and greyed; not-started tracks show `startsAfterLabel`).
- Route `/stages` in `src/App.tsx`; nav item before Vocabulary in `AppShell.tsx` (mobile bottom nav now `grid-cols-7`).
- README: permissions table, database table and migration list updated.
- `npm run build` passes; lint clean except the pre-existing `react-refresh` warning in `store.tsx`.

**Next steps**
1. Re-read `src/pages/Stages.tsx` (a sed turned the inner `GoalRow`/`GoalList` components into `goalRow`/`goalList` render helpers; the harness flagged the file as changed on disk, so confirm it reads right).
2. Apply `006_tracks_goals.sql` in the Supabase SQL Editor (user action) and check the goal counts from the final `select`.
3. Manual check with `npm run dev`: teacher sees Listening Foundation with 8 Goals and "0 of 8 Goals done", Reading "Starts after Listening Foundation", Writing "Starts after Reading Foundation"; teacher adds/edits/deletes a Goal; student ticks a Goal and it survives reload, has no edit controls; student insert/update on `goals` via API is refused by RLS; deleting a ticked Goal removes its tick; overdue due date shows red.
4. Run `npm test` (full suite), then the `code-review` skill.
5. Set `Status:` of ticket 01 (already committed in 7a9a070) and this ticket, then commit with a `feat:` message referencing this ticket.

### Resolved (2026-10-21)

Committed on `stages-plan`. Code review fixes applied: shared `GoalDraft` type, `stageDef` lookup, skill order from `TRACKS`, index on `goal_completions.student_id`. Typecheck, lint and tests (17) pass.

**Still open (user action):** `006_tracks_goals.sql` has not been applied to Supabase, and the manual checks in step 3 above have not been run. The acceptance boxes stay unticked until they are.
