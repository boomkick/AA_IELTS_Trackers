# Spec: Weeks and Missions alongside Stages

Decision record: `docs/adr/0002-weeks-and-missions-alongside-stages.md`. Prototype: branch `prototype/week-plan`, commit `578ca0b`, file `src/pages/prototype/WeekPlanPrototype.tsx` (variants B and C chosen).

## Problem

The Stages work (ADR 0001) removed the dated 8-week calendar. The student and teacher still want to see Week 1, 2, 3… and what to do on each day of that Week. They want this next to the Stages, not instead of them.

## Outcome

- **This-week board** at `/`, the first page after login for teacher and student (prototype variant C). Header: "Week N of M", the date range, ‹ › arrows and one dot per Week of the Course. Body: seven day columns with that Week's Missions. The student ticks Missions done; the teacher sees the ticks read-only and can add, edit and delete Missions. Side panel: for every started track, its current Stage with the Goals and today's Habits (Habits can be ticked as on the old Dashboard), plus the next Full test. Weeks left shows in the header. The Dashboard page is removed.
- **Course plan** page at `/plan` (prototype variant B). A grid with Listening, Reading and Writing as rows and every Week of the Course as columns. Each cell shows the Stage that skill was in during that Week, taken from real Stage history. Future Weeks are blank, and the current Week is outlined. Below the grid, each Week's completion bar. Clicking a Week shows its Missions grouped as Class, Homework and Self-study.
- Navigation: This week, Course plan, Stages, Vocabulary, Progress.

## Rules

- Weeks run Monday to Sunday. Week 1 starts on the Course start date (2026-10-19). There are `ceil((end − start + 1) / 7)` Weeks, recomputed when the teacher moves the Course end date. The current Week is the one containing today, clamped to the first or last Week.
- A Mission's Week is computed from its date. A Mission outside the Course dates belongs to no Week and is not shown.
- Weeks 1–8 keep the Missions already in `study_tasks`. Later Weeks start empty until the teacher fills them.
- Mission types: Class (`teacher_session`, with start and end time), Self-study, Homework (with a due date). Skill: Listening, Reading or Writing.
- Stage history: every start or advance of a track records `(skill, stage, entered_on)`. A skill's Stage in a Week is the latest entry dated on or before that Week's Sunday. Weeks before the track started show nothing. Weeks after today show nothing.

## Out of scope

- Planning future Stages per Week.
- Copying a Week's Missions forward. (A possible follow-up, since the teacher will fill 18+ Weeks by hand.)
- Vocabulary per Week. The week column stays dropped.
