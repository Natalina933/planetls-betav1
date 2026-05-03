create table if not exists public.onboarding_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  step_index integer not null check (step_index >= 1),
  category text,
  persona_hint text,
  path text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists onboarding_events_event_name_idx
  on public.onboarding_events (event_name, occurred_at desc);

create index if not exists onboarding_events_category_idx
  on public.onboarding_events (category, occurred_at desc);

create index if not exists onboarding_events_persona_hint_idx
  on public.onboarding_events (persona_hint, occurred_at desc);

alter table public.onboarding_events enable row level security;

drop policy if exists onboarding_events_service_role_all on public.onboarding_events;
create policy onboarding_events_service_role_all
  on public.onboarding_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
