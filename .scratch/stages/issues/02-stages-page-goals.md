# 02: Stages page with Goals

**What to build:** A new Stages page where both users see the three Skill tracks side by side. Each track shows every Stage: past ones collapsed with a tick, the current one open, future ones greyed out. The current Stage lists its Goals and its Gate status. The student ticks Goals done. The teacher adds, edits and deletes Goals in the current Stage, each with an optional due date that shows red when overdue. The database gains tracks, Goals and Goal ticks, filled with the course plan. The old calendar tables are left alone (they're removed in 07).

**Blocked by:** 01

**Status:** ready-for-agent

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
