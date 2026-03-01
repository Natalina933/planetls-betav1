-- Provider workspace core: clients, interventions, alerts
-- Date: 2026-03-01

create extension if not exists pgcrypto;

create table if not exists public.provider_clients (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references public.profiles(id) on delete cascade,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  client_name text not null,
  company_name text,
  email text,
  phone text,
  city text,
  client_type varchar(20) not null default 'manual'
    check (client_type in ('manual', 'owner', 'business')),
  status varchar(20) not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_interventions (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.provider_clients(id) on delete set null,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  service_label text,
  status varchar(20) not null default 'pending'
    check (status in ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  priority varchar(20) not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  budget_amount numeric(12,2),
  currency varchar(8) not null default 'EUR',
  location_label text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_alerts (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references public.profiles(id) on delete cascade,
  intervention_id uuid references public.provider_interventions(id) on delete cascade,
  alert_type varchar(30) not null default 'general'
    check (alert_type in ('general', 'deadline', 'client', 'payment', 'quality')),
  severity varchar(20) not null default 'normal'
    check (severity in ('low', 'normal', 'high', 'urgent')),
  title text not null,
  body text,
  status varchar(20) not null default 'open'
    check (status in ('open', 'read', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_conversations (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.provider_clients(id) on delete set null,
  subject text,
  status varchar(20) not null default 'open'
    check (status in ('open', 'archived', 'closed')),
  last_message_preview text,
  last_message_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.provider_conversations(id) on delete cascade,
  sender_profile_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
