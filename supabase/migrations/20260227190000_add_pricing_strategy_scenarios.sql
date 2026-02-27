create table if not exists public.pricing_strategy_scenarios (
  id uuid primary key default gen_random_uuid(),
  concierge_profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  simulation jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pricing_strategy_scenarios_concierge_idx
  on public.pricing_strategy_scenarios (concierge_profile_id, created_at desc);

alter table public.pricing_strategy_scenarios enable row level security;

drop policy if exists pricing_strategy_scenarios_select_own on public.pricing_strategy_scenarios;
create policy pricing_strategy_scenarios_select_own
  on public.pricing_strategy_scenarios
  for select
  using (auth.uid() = concierge_profile_id);

drop policy if exists pricing_strategy_scenarios_insert_own on public.pricing_strategy_scenarios;
create policy pricing_strategy_scenarios_insert_own
  on public.pricing_strategy_scenarios
  for insert
  with check (auth.uid() = concierge_profile_id);

drop policy if exists pricing_strategy_scenarios_update_own on public.pricing_strategy_scenarios;
create policy pricing_strategy_scenarios_update_own
  on public.pricing_strategy_scenarios
  for update
  using (auth.uid() = concierge_profile_id)
  with check (auth.uid() = concierge_profile_id);

drop policy if exists pricing_strategy_scenarios_delete_own on public.pricing_strategy_scenarios;
create policy pricing_strategy_scenarios_delete_own
  on public.pricing_strategy_scenarios
  for delete
  using (auth.uid() = concierge_profile_id);
