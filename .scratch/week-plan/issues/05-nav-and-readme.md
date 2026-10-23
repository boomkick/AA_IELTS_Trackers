# 05: Navigation and README

**What to build:** The navigation becomes This week (`/`), Course plan (`/plan`), Stages, Vocabulary and Progress, on both the desktop sidebar and the mobile bottom bar (5 items). The sidebar date range comes from the Course instead of the hard-coded "19 Oct – 13 Dec 2026". The README describes Weeks and Missions next to Stages, explains the migration 010 change and the new `stage_entries` migration, and points to ADR 0002. The completion notes on ticket 07 of `.scratch/stages` get a pointer to ADR 0002.

**Blocked by:** 03, 04

**Status:** resolved

- [ ] Every nav item works on desktop and mobile, and no link goes to a removed page.
- [ ] The sidebar shows the Course dates from the database.
- [ ] Lint, build and tests are clean.

## Comments

### Resolved (2026-10-23)

Committed on `stages-plan`. Lint, build and tests clean. Not yet checked in a browser against the real database.
