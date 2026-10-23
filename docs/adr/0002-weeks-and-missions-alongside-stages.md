# Weeks and Missions return alongside Stages

ADR 0001 retired the dated calendar for Stages. Once the Stages work was built, the student and teacher still wanted a dated, week-by-week view: what to do on which day of which Week. We keep both. Stages still decide *what the student is working on and when to move on*. Weeks and Missions decide *what happens on which day*. This partly supersedes ADR 0001: its "keep the calendar and add Stages on top" option was rejected there, but the clutter it feared came from daily missions being the *only* plan, not from them existing.

The landing page after login is now the This-week board. It shows the current Week's Missions by day, beside the current Stages' Goals, today's Habits, the weeks left and the next Full test. A Course plan page shows every Week of the Course against each Skill track's Stage. The Dashboard page is removed and its content is merged into the This-week board. The choice was made from a UI prototype on branch `prototype/week-plan` (variants B and C chosen, A not chosen).

## Considered Options

- **Restore the old Study Plan page unchanged (prototype variant A)**: not chosen. It shows Weeks without any link to Stages.
- **A Stage planned per Week by the teacher**: rejected. A plan like that drifts from when Gates are really passed. The Course plan grid reads real Stage history instead.

## Consequences

- Weeks cover the whole Course (Monday-to-Sunday blocks from the Course start date to its end date), not a fixed 8. They are computed from the Course dates, not stored.
- The first 8 Weeks get back the Missions that migrations 003/005 had seeded. The teacher adds Missions for later Weeks in the app.
- Migration 010 had already dropped `study_tasks` and `task_completions`, so migration 011 re-creates them without a week column and re-seeds the Missions of Weeks 1–8. Ticks made before 010 are lost (no student had used the app). A Mission's Week is computed from its date. `study_tasks` may now hold Writing Missions.
- Every time a track starts or advances, the new Stage and its date are recorded in a Stage history. Past Weeks in the Course plan show the Stage each skill was really in.
- A Goal is still a one-off item without a fixed day inside a Stage. A Mission is a dated item inside a Week. Homework stays a Mission type, so "Homework is a Goal with a due date" from ADR 0001 no longer holds.
