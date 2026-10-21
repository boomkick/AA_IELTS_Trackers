# 04: Start and advance tracks

**What to build:** The teacher moves the course forward from the Stages page. A track that hasn't started gets a "Start {skill}" button once its start rule allows it. A started track gets an "Advance to {next Stage}" button. When the Gate is met, the button is highlighted as a suggestion. The teacher can still advance at any time, because the teacher has the final say. Both actions ask for confirmation and record the day the new Stage began, which is when Gate checks start counting results.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Reading shows "Start Reading" only after Listening has left Foundation. Writing shows "Start Writing" only after Reading has left Foundation. Before that, the existing "Starts after …" line shows.
- [ ] The Advance button uses the primary style when the Gate is met and the outline style when it isn't. It works either way, after a confirmation.
- [ ] Advancing sets the new Stage and today's date as its start. The previous Stage then shows as done, and the next Stage's Goals become the current ones.
- [ ] The last Stage of a track has no Advance button.
- [ ] Only the teacher sees these buttons, and the database refuses track changes from the student.
