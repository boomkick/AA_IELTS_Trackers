# 03: This-week board replaces the Dashboard

**What to build:** Prototype variant C, built properly at `/`. Header: "Week N of M", the date range, weeks left, ‹ › arrows and one dot per Week (green when all its Missions are done). It opens on the current Week. Seven day columns show the Week's Missions, with today highlighted. The student ticks them, the teacher sees them read-only, and the teacher has add, edit and delete (the add form defaults to the shown Week's Monday). The side panel has one card per started track: current Stage, its Goals with done state, today's Habits (tickable by the student, as on the old Dashboard) and the next Full test. A muted line shows for each track not started. The Dashboard page and its route are removed.

**Blocked by:** 01

**Status:** resolved

- [ ] After login, teacher and student land on the This-week board for the Week containing today.
- [ ] A Week with no Missions shows an empty state ("No Missions yet", plus an Add button for the teacher).
- [ ] On mobile the day columns stack, and the side panel comes after them.
- [ ] Nothing from the old Dashboard is lost: weeks left, today's Habits with counts and streaks, the per-track Stage, the next Goal and the next Full test.
- [ ] Lint, build and tests are clean.

## Comments

### Resolved (2026-10-23)

Committed on `stages-plan`. Lint, build and tests clean. Not yet checked in a browser against the real database.
