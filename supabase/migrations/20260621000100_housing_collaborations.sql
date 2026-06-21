-- A single source of truth for the concierge assigned to a property.
create table if not exists public.housing_collaborations (
  id uuid primary key default gen_random_uuid(),
  housing_id bigint not null references public.housing(id) on delete cascade,
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  concierge_profile_id uuid not null references public.profiles(id) on delete restrict,
  service_request_id uuid null references public.service_requests(id) on delete set null,
  quote_id uuid null references public.quotes(id) on delete set null,
  mission_id uuid null references public.missions(id) on delete set null,
  status text not null default 'active' check (status in ('pending_handover', 'active', 'paused', 'ended', 'cancelled')),
  collaboration_type text not null default 'one_off' check (collaboration_type in ('one_off', 'regular', 'full_management', 'partial_management', 'temporary_replacement', 'trial', 'onboarding')),
  frequency text null check (frequency in ('once', 'weekly', 'monthly', 'seasonal', 'year_round', 'unknown')),
  responsibility_level text null check (responsibility_level in ('low', 'shared', 'full', 'unknown')),
  starts_on date null,
  ends_on date null,
  handover_status text not null default 'pending' check (handover_status in ('pending', 'in_progress', 'ready')),
  scope jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quote_id)
);

create unique index if not exists housing_collaborations_one_active_per_housing
  on public.housing_collaborations (housing_id)
  where status in ('pending_handover', 'active', 'paused');

create index if not exists housing_collaborations_owner_idx on public.housing_collaborations (owner_profile_id, status);
create index if not exists housing_collaborations_concierge_idx on public.housing_collaborations (concierge_profile_id, status);

alter table public.housing_collaborations enable row level security;

create policy "housing collaborations owner or concierge read"
  on public.housing_collaborations for select
  using (auth.uid() = owner_profile_id or auth.uid() = concierge_profile_id);

create policy "housing collaborations owner creates"
  on public.housing_collaborations for insert
  with check (auth.uid() = owner_profile_id);

create policy "housing collaborations owner updates"
  on public.housing_collaborations for update
  using (auth.uid() = owner_profile_id)
  with check (auth.uid() = owner_profile_id);
