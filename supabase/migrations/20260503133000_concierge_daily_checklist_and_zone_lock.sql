alter table public.profiles
  add column if not exists intervention_zone_locked boolean not null default false;

create table if not exists public.concierge_daily_checklist (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  task_date date not null,
  task_key text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (profile_id, task_date, task_key)
);

create index if not exists idx_concierge_daily_checklist_profile_date
  on public.concierge_daily_checklist(profile_id, task_date);

alter table public.concierge_daily_checklist enable row level security;

drop policy if exists concierge_daily_checklist_owner_select on public.concierge_daily_checklist;
create policy concierge_daily_checklist_owner_select
  on public.concierge_daily_checklist
  for select
  using (auth.uid() = profile_id);

drop policy if exists concierge_daily_checklist_owner_insert on public.concierge_daily_checklist;
create policy concierge_daily_checklist_owner_insert
  on public.concierge_daily_checklist
  for insert
  with check (auth.uid() = profile_id);

drop policy if exists concierge_daily_checklist_owner_update on public.concierge_daily_checklist;
create policy concierge_daily_checklist_owner_update
  on public.concierge_daily_checklist
  for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

drop policy if exists concierge_daily_checklist_service_role_all on public.concierge_daily_checklist;
create policy concierge_daily_checklist_service_role_all
  on public.concierge_daily_checklist
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
