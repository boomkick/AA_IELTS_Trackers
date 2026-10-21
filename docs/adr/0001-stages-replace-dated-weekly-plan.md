# Stages replace the dated weekly plan

The original app modelled the course as an 8-week calendar (`study_weeks`) with a dated `study_tasks` row for every class, self-study day and homework. That produced a long list of daily missions and could not express the real plan, which moves forward on score Gates ("reach 7.0, then Passage 3 only") and runs at a different pace per skill. We replaced it with per-skill Skill tracks made of fixed Stages, each holding a few Goals and a small Habit list; the calendar tables are retired and the Study Plan, Homework and Error Log pages are replaced by a Stages page.

## Considered Options

- **Keep the calendar and add Stages on top**: rejected, because two parallel plans would bring back the clutter the change is meant to remove.
- **One global Stage for the whole course**: rejected, because Listening, Reading and Writing reach their Gates at different times.

## Consequences

- Stage names, order and Gates are fixed in code. Only Goals and Habits are teacher-editable. Adding a new Stage needs a code change.
- Homework is no longer a separate concept. It is a Goal with an optional due date.
- `study_weeks`, `study_tasks` and `task_completions` are dropped outright: no student had used the app yet, so there was no data to keep.
