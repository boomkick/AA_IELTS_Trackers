# 02: Stage history

**What to build:** A new `stage_entries` table records `(skill, stage, entered_on)` every time a track starts or advances. It is filled once from the current `tracks` rows. The store's start/advance action writes an entry along with the track. A pure `stageInWeek(entries, skill, week, today)` (test-first) gives the Stage a skill was in during a Week: the latest entry on or before the Week's Sunday, or nothing for Weeks before the track started or after today.

**Blocked by:** none

**Status:** ready-for-agent

- [ ] Starting Listening on 2026-10-19 and advancing it to Diagnosis on 2026-11-20 gives Foundation for Weeks 1–4 and Diagnosis for Week 5. (The Week of 16–22 Nov ends after the advance, so it shows Diagnosis.)
- [ ] A Week after today shows nothing even if a track is started.
- [ ] Everyone signed in can read the entries. Only the teacher can write them.
- [ ] Lint, build and tests are clean.
