-- Course: the coaching programme's start and end date (one row). The teacher moves the
-- end date to the exam date once it's booked. Run after 008.

begin;

-- ---------------------------------------------------------------------------
-- course: exactly one row (id = 1).
-- ---------------------------------------------------------------------------
create table public.course (
  id         smallint primary key default 1 check (id = 1),
  start_date date not null,
  end_date   date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date > start_date)
);

create trigger course_updated_at before update on public.course
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: everyone signed in reads it; only the teacher changes it.
-- ---------------------------------------------------------------------------
alter table public.course enable row level security;

create policy "course: read" on public.course
  for select to authenticated using (true);
create policy "course: teacher update" on public.course
  for update to authenticated using (public.is_teacher()) with check (public.is_teacher());

revoke all on public.course from anon;

-- ---------------------------------------------------------------------------
-- Seed: about six months from the first class.
-- ---------------------------------------------------------------------------
insert into public.course (start_date, end_date) values ('2026-10-19', '2027-04-19');

commit;
