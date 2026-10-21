# 01: Stage rules

**What to build:** The fixed rules of the course as tested logic, with no UI yet. Each Skill track (Listening, Reading, Writing) has its ordered Stages, each Stage has its Gate, and a track has a rule for when it can start. This is a prefactor: every later ticket reads these rules instead of re-deriving them. Also sets up the project's first unit-test runner.

Background: `GLOSSARY.md`, `docs/adr/0001-stages-replace-dated-weekly-plan.md`, design detail in `docs/plans/2026-10-21-stages.md` (Task 1).

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] A test command runs the unit tests and is part of the normal workflow.
- [ ] Skill now includes Writing alongside Listening and Reading. Existing pages still build, and Writing gets its own badge colour.
- [ ] Stage order: Listening Foundation → Diagnosis → Focus → Exam-ready; Reading Foundation → Diagnosis → Focus → Passage 3; Writing Templates → Practice.
- [ ] Reading can start only once Listening has left Foundation. Writing can start only once Reading has left Foundation. A track that has already started can't be started again.
- [ ] Foundation and Templates Gates are met when every Goal of that Stage is done. The status reads like "3 of 8 Goals done".
- [ ] The Diagnosis Gate needs every Goal done **and** a Full test of that skill recorded on or after the day the track entered Diagnosis ("Full test needed" otherwise).
- [ ] The Focus Gate is met by one Full test of 7.0 or above recorded on or after the day the track entered Focus. The status reads like "Best Full test 6.5 of 7.0 needed", or "No Full test yet".
- [ ] Results from before the Stage started, and results for other skills, never count towards a Gate.
- [ ] Last Stages report "Final Stage", and a track that hasn't started reports "Not started". Neither is ever met.
- [ ] The fixed list of Reading Question types is defined here: Matching headings, Matching information, Matching features, Matching sentence endings, True / False / Not Given, Yes / No / Not Given, Multiple choice, Sentence completion, Summary, note, table or flow-chart completion, Diagram label completion, Short-answer questions.
