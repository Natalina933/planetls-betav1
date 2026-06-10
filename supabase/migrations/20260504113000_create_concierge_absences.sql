create table if not exists public.concierge_absences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text not null default 'other',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint concierge_absences_date_order check (end_date >= start_date)
);

create index if not exists idx_concierge_absences_profile_dates
  on public.concierge_absences(profile_id, start_date, end_date);

alter table public.concierge_absences enable row level security;

drop policy if exists concierge_absences_owner_select on public.concierge_absences;
create policy concierge_absences_owner_select
  on public.concierge_absences
  for select
  using (auth.uid() = profile_id);

drop policy if exists concierge_absences_owner_insert on public.concierge_absences;
create policy concierge_absences_owner_insert
  on public.concierge_absences
  for insert
  with check (auth.uid() = profile_id);

drop policy if exists concierge_absences_owner_update on public.concierge_absences;
create policy concierge_absences_owner_update
  on public.concierge_absences
  for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

drop policy if exists concierge_absences_owner_delete on public.concierge_absences;
create policy concierge_absences_owner_delete
  on public.concierge_absences
  for delete
  using (auth.uid() = profile_id);

drop policy if exists concierge_absences_service_role_all on public.concierge_absences;
create policy concierge_absences_service_role_all
  on public.concierge_absences
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
