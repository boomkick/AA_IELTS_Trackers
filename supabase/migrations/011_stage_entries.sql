-- Stage history (ADR 0002): every start or advance of a Skill track records the Stage it
-- entered and the day. The Course plan reads it to show which Stage each skill was in
-- during each Week. Run after 010.

begin;

-- ---------------------------------------------------------------------------
-- stage_entries: a trigger on public.tracks adds one row per start or advance, in the
-- same write. The teacher may correct or delete a row by hand.
-- ---------------------------------------------------------------------------
create table public.stage_entries (
  id         uuid primary key default gen_random_uuid(),
  skill      text not null,
  stage      text not null,
  entered_on date not null,
  created_at timestamptz not null default now(),
  check (public.is_stage_of(skill, stage))
);

create index stage_entries_skill_idx on public.stage_entries (skill, entered_on);

-- Runs as the caller, so the insert passes the teacher-only policy below just as the
-- tracks write did. Re-saving the same Stage on the same day records nothing.
create or replace function public.record_stage_entry()
returns trigger
language plpgsql
as $$
begin
  if new.stage is not null
     and (tg_op = 'INSERT' or new.stage is distinct from old.stage or new.entered_on is distinct from old.entered_on) then
    insert into public.stage_entries (skill, stage, entered_on) values (new.skill, new.stage, new.entered_on);
  end if;
  return new;
end;
$$;

create trigger tracks_record_stage_entry after insert or update on public.tracks
  for each row execute function public.record_stage_entry();

-- ---------------------------------------------------------------------------
-- RLS: everyone signed in reads it; only the teacher writes it.
-- ---------------------------------------------------------------------------
alter table public.stage_entries enable row level security;

create policy "stage entries: read" on public.stage_entries
  for select to authenticated using (true);
create policy "stage entries: teacher insert" on public.stage_entries
  for insert to authenticated with check (public.is_teacher());
create policy "stage entries: teacher update" on public.stage_entries
  for update to authenticated using (public.is_teacher()) with check (public.is_teacher());
create policy "stage entries: teacher delete" on public.stage_entries
  for delete to authenticated using (public.is_teacher());

revoke all on public.stage_entries from anon;

-- ---------------------------------------------------------------------------
-- Fill once from where the tracks are now.
-- ---------------------------------------------------------------------------
insert into public.stage_entries (skill, stage, entered_on)
select skill, stage, entered_on from public.tracks where stage is not null;

commit;

-- Check: one entry per started track.
select skill, stage, entered_on from public.stage_entries order by skill;
