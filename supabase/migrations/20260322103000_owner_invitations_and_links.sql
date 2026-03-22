create extension if not exists pgcrypto;

create table if not exists public.owner_invitations (
  id uuid primary key default gen_random_uuid(),
  concierge_profile_id uuid not null references public.profiles(id) on delete cascade,
  housing_id bigint null references public.housing(id) on delete set null,
  quote_id uuid null references public.quotes(id) on delete set null,
  mission_id uuid null references public.missions(id) on delete set null,
  invited_email text not null,
  invited_email_normalized text not null,
  invited_owner_name text null,
  personal_note text null,
  status text not null default 'sent',
  token_hash text not null,
  sent_at timestamptz null,
  viewed_at timestamptz null,
  accepted_at timestamptz null,
  expires_at timestamptz not null,
  relaunch_count integer not null default 0,
  relanced_at timestamptz null,
  cancelled_at timestamptz null,
  claimed_owner_profile_id uuid null references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists owner_invitations_concierge_idx
  on public.owner_invitations (concierge_profile_id, created_at desc);

create index if not exists owner_invitations_housing_idx
  on public.owner_invitations (housing_id, created_at desc);

create index if not exists owner_invitations_email_idx
  on public.owner_invitations (invited_email_normalized);

create unique index if not exists owner_invitations_token_hash_idx
  on public.owner_invitations (token_hash);

create table if not exists public.owner_concierge_links (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  concierge_profile_id uuid not null references public.profiles(id) on delete cascade,
  invitation_id uuid null references public.owner_invitations(id) on delete set null,
  housing_id bigint null references public.housing(id) on delete set null,
  quote_id uuid null references public.quotes(id) on delete set null,
  source text not null default 'invitation',
  status text not null default 'active',
  linked_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_profile_id, concierge_profile_id, housing_id)
);

create index if not exists owner_concierge_links_owner_idx
  on public.owner_concierge_links (owner_profile_id, created_at desc);

create index if not exists owner_concierge_links_concierge_idx
  on public.owner_concierge_links (concierge_profile_id, created_at desc);

create table if not exists public.owner_invitation_events (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.owner_invitations(id) on delete cascade,
  event_type text not null,
  actor_profile_id uuid null references public.profiles(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists owner_invitation_events_invitation_idx
  on public.owner_invitation_events (invitation_id, created_at desc);
