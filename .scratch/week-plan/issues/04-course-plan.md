# 04: Course plan page

**What to build:** Prototype variant B, built properly at `/plan`. A grid with one row per Skill track and one column per Week of the Course. On narrow screens it scrolls sideways and starts scrolled to the current Week. Each cell shows `stageInWeek` with a colour per Stage, and is blank when there is no Stage. A completion bar sits under each Week. Clicking a Week shows its Missions in three groups (Class, Homework, Self-study), with the student's tick and the teacher's edit and delete.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [ ] All Weeks of the Course appear (27 with the starting dates), and the current Week is outlined.
- [ ] Past Weeks show the real Stage from history, and future Weeks are blank.
- [ ] Ticking a Mission here also shows it ticked on the This-week board.
- [ ] Lint, build and tests are clean.
