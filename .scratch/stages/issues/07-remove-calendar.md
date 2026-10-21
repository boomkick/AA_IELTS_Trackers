# 07: Remove the calendar

**What to build:** The contract step of ADR 0001. Once every page runs on Stages, the dated 8-week calendar goes away completely: its tables, the Study Plan, Homework and Error Log pages, the task components, the old seed scripts, and the week field on Vocabulary. Afterwards the navigation is Dashboard, Stages, Vocabulary and Progress, and the README describes Stages, Goals and Habits instead of the 8-week plan.

**Blocked by:** 02, 03, 04, 05, 06

**Status:** ready-for-agent

- [ ] The old calendar tables are dropped (the agreement is in ADR 0001: no student data existed). The Vocabulary week column is dropped along with them.
- [ ] The Vocabulary page has no week filter or week field, and adding a word still works.
- [ ] Nothing in the app code refers to study weeks, study tasks, task completions or task types any more.
- [ ] Lint, build and tests are all clean.
- [ ] The README covers the new tables and migrations, and no longer mentions the 8-week plan or the seed generator.
