# 03: Habits

**What to build:** Each Stage can carry a short list of Habits with a rhythm, either daily or N times a week. On the Stages page, the current Stage lists its Habits. The student ticks a Habit for today and sees how many times it's done this week. Daily Habits show a streak. The teacher adds, edits and deletes Habits. The database gains Habits and Habit ticks, filled with the course plan.

**Blocked by:** 02

**Status:** resolved

- [ ] The rhythm is 1–7 times a week, and 7 shows as "daily".
- [ ] Starting Habits:
  - Listening Foundation: BBC Learning English (daily), Dictation in class (2× a week).
  - Listening Diagnosis: BBC Learning English (daily).
  - Listening Focus and Exam-ready: BBC Learning English (daily), YouTube listening (recommended channels, e.g. The Ramsey Show) (3× a week).
  - Reading Passage 3: Passage 3 practice (2× a week).
  - Writing Practice: Task 1 report (bar or line chart) (1× a week), Task 2 essay (1× a week). The essay takes about twice as long, which gives the agreed 1/3 Task 1, 2/3 Task 2 split of Writing time.
- [ ] Weeks run Monday to Sunday. A Sunday tick counts in the week that began the Monday before, and the count resets on Monday.
- [ ] Each Habit can be ticked at most once a day. Unticking today removes it.
- [ ] The streak counts consecutive days ending today, or ending yesterday if today isn't ticked yet. It shows only for daily Habits.
- [ ] Only the teacher can change Habits, and only the student can tick them. Both rules are enforced by the database.

## Comments

### Resolved (2026-10-21)

Committed on `stages-plan`. Pure helpers in `src/lib/habits.ts` (`rhythmLabel`, `weekCount`, `streak`) built test-first. `007_habits.sql` adds `habits` and `habit_ticks` with RLS (teacher edits Habits; student ticks and unticks today only) and the starting Habits. The Stages page lists the current Stage's Habits with this week's count and, for daily Habits, a streak. The app's `today` is now the Vietnam date, so it matches the database's tick dates.

**Still open (user action):** apply `006_tracks_goals.sql` then `007_habits.sql` in Supabase and run the manual checks (tick survives reload, Sunday/Monday week boundary, teacher can't tick, student can't edit Habits).
