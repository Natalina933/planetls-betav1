-- Target schema for "Grille tarifaire" (requested model)
-- Keeps the current app functional while preparing migration from:
--   services_catalog -> services
--   services_pricing -> concierge_service_prices

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.concierge_service_prices (
  id uuid primary key default gen_random_uuid(),
  concierge_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  price numeric not null check (price > 0),
  unit text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (concierge_id, service_id)
);

-- Optional trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
before update on public.services
for each row
execute function public.set_updated_at();

drop trigger if exists concierge_service_prices_set_updated_at on public.concierge_service_prices;
create trigger concierge_service_prices_set_updated_at
before update on public.concierge_service_prices
for each row
execute function public.set_updated_at();

alter table public.services enable row level security;
alter table public.concierge_service_prices enable row level security;

-- Read active services for all authenticated users
drop policy if exists "services readable by authenticated users" on public.services;
create policy "services readable by authenticated users"
on public.services
for select
to authenticated
using (is_active = true);

-- Admin full access on services
drop policy if exists "admin full access services" on public.services;
create policy "admin full access services"
on public.services
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Concierge: own pricing only
drop policy if exists "concierge can manage own prices" on public.concierge_service_prices;
create policy "concierge can manage own prices"
on public.concierge_service_prices
for all
to authenticated
using (auth.uid() = concierge_id)
with check (auth.uid() = concierge_id);

-- Admin full access on concierge prices
drop policy if exists "admin full access concierge prices" on public.concierge_service_prices;
create policy "admin full access concierge prices"
on public.concierge_service_prices
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

