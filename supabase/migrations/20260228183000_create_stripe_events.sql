create table if not exists public.stripe_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid null references public.profiles(id) on delete set null,
  stripe_object_id text not null,
  stripe_event_type text not null,
  source text not null default 'webhook',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_stripe_events_profile_id
  on public.stripe_events(profile_id);

create index if not exists idx_stripe_events_created_at
  on public.stripe_events(created_at desc);

create index if not exists idx_stripe_events_object_id
  on public.stripe_events(stripe_object_id);

alter table public.stripe_events enable row level security;

drop policy if exists stripe_events_select_policy on public.stripe_events;
create policy stripe_events_select_policy
on public.stripe_events
for select
using (auth.uid() = profile_id);

drop policy if exists stripe_events_insert_policy on public.stripe_events;
create policy stripe_events_insert_policy
on public.stripe_events
for insert
with check (auth.uid() = profile_id);
