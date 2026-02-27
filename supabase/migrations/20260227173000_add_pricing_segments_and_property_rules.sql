-- V1 pricing intelligence: segments proprietaires + regles complexite bien

create table if not exists public.pricing_segments (
  id uuid primary key default gen_random_uuid(),
  concierge_profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  commission_delta_pct numeric(5,2) not null default 0,
  setup_fee_delta_pct numeric(5,2) not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pricing_segments_profile_idx
  on public.pricing_segments(concierge_profile_id);

create table if not exists public.pricing_property_rules (
  id uuid primary key default gen_random_uuid(),
  concierge_profile_id uuid not null references public.profiles(id) on delete cascade,
  service_id bigint null references public.services_catalog(id) on delete set null,
  property_type text null,
  min_surface_m2 integer null,
  max_surface_m2 integer null,
  delta_pct numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pricing_property_rules_profile_idx
  on public.pricing_property_rules(concierge_profile_id);

alter table public.pricing_segments enable row level security;
alter table public.pricing_property_rules enable row level security;

drop policy if exists pricing_segments_select_own on public.pricing_segments;
create policy pricing_segments_select_own
  on public.pricing_segments
  for select
  using (concierge_profile_id = auth.uid());

drop policy if exists pricing_segments_insert_own on public.pricing_segments;
create policy pricing_segments_insert_own
  on public.pricing_segments
  for insert
  with check (concierge_profile_id = auth.uid());

drop policy if exists pricing_segments_update_own on public.pricing_segments;
create policy pricing_segments_update_own
  on public.pricing_segments
  for update
  using (concierge_profile_id = auth.uid())
  with check (concierge_profile_id = auth.uid());

drop policy if exists pricing_segments_delete_own on public.pricing_segments;
create policy pricing_segments_delete_own
  on public.pricing_segments
  for delete
  using (concierge_profile_id = auth.uid());

drop policy if exists pricing_property_rules_select_own on public.pricing_property_rules;
create policy pricing_property_rules_select_own
  on public.pricing_property_rules
  for select
  using (concierge_profile_id = auth.uid());

drop policy if exists pricing_property_rules_insert_own on public.pricing_property_rules;
create policy pricing_property_rules_insert_own
  on public.pricing_property_rules
  for insert
  with check (concierge_profile_id = auth.uid());

drop policy if exists pricing_property_rules_update_own on public.pricing_property_rules;
create policy pricing_property_rules_update_own
  on public.pricing_property_rules
  for update
  using (concierge_profile_id = auth.uid())
  with check (concierge_profile_id = auth.uid());

drop policy if exists pricing_property_rules_delete_own on public.pricing_property_rules;
create policy pricing_property_rules_delete_own
  on public.pricing_property_rules
  for delete
  using (concierge_profile_id = auth.uid());
