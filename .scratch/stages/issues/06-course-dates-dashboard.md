# 06: Course dates, next Full test and the new Dashboard

**What to build:** The course gets a start and end date: 2026-10-19 to 2027-04-19 at first. The teacher moves the end date to the exam date once it's booked. The Stages page and the Dashboard show the weeks left. For Listening and Reading from Focus on, the app shows "Next Full test due {date}", which is 56 days after that skill's latest Full test, so nobody has to remember it. The Dashboard is rebuilt around the stage model. At the top is today's Habits checklist. Below it is one card per started track, showing the current Stage, the next Goal not yet done (with its due date), the Gate status and the next Full test. Tracks that haven't started show a single muted line. The weeks left shows in the header.

**Blocked by:** 03

**Status:** resolved

- [ ] Only the teacher can edit the course end date, and it must be after the start date.
- [ ] Weeks left is the remaining days divided by 7, rounded up, and never below 0 once the end date has passed. On 2026-10-21 with the starting dates it shows 26.
- [ ] The next Full test date is the latest Full test of that skill + 56 days (e.g. 2026-11-20 gives 2027-01-15). It doesn't show for Writing, for tracks before Focus, or when no Full test exists yet.
- [ ] The Dashboard Habits checklist contains every Habit of every started track's current Stage, with this week's count and, for daily Habits, the streak. The student ticks here and the teacher sees it read-only.
- [ ] The Dashboard no longer reads the old calendar (no today's tasks, no homework list, no week number).

## Comments

### Resolved (2026-10-21)

Committed on `stages-plan`. `weeksLeft` and `nextFullTestDue` in `src/lib/stats.ts` built test-first. `009_course.sql` adds the one-row `course` table (teacher-only update, end after start). The Stages page shows weeks left, a teacher "Course end date" button and "Next Full test due …". The Dashboard is rebuilt: today's Habits (shared `HabitRow`), one `TrackCard` per started track, a muted line per track not started, weeks left in the header. `AppShell` still waits for the old study weeks; that goes in 07.

**Still open (user action):** apply `009_course.sql` after 006–008, then check the Dashboard shows "26 weeks left" on 2026-10-21 and the student can tick a Habit there.
