-- Core module: quotes + invoices
-- Safe to run in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- ============================================================================
-- Sequences for business numbers
-- ============================================================================
create sequence if not exists public.quote_number_seq start 1;
create sequence if not exists public.invoice_number_seq start 1;

-- ============================================================================
-- Quotes
-- ============================================================================
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text unique not null default (
    'DEV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.quote_number_seq')::text, 6, '0')
  ),
  concierge_profile_id uuid not null references public.profiles(id) on delete cascade,
  owner_profile_id uuid null references public.profiles(id) on delete set null,
  mission_id uuid null references public.missions(id) on delete set null,
  package_id uuid null references public.services_packages(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired', 'canceled')),
  currency text not null default 'EUR' check (char_length(currency) = 3),
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_rate numeric(6,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  valid_until date null,
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz null,
  accepted_at timestamptz null,
  rejected_at timestamptz null,
  canceled_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_quotes_concierge_profile_id on public.quotes(concierge_profile_id);
create index if not exists idx_quotes_owner_profile_id on public.quotes(owner_profile_id);
create index if not exists idx_quotes_mission_id on public.quotes(mission_id);
create index if not exists idx_quotes_status on public.quotes(status);
create index if not exists idx_quotes_created_at on public.quotes(created_at desc);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  service_id bigint null references public.services_catalog(id) on delete set null,
  pricing_id bigint null references public.services_pricing(id) on delete set null,
  label text not null,
  description text null,
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  line_total numeric(12,2) not null default 0 check (line_total >= 0),
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_quote_items_quote_id on public.quote_items(quote_id);
create index if not exists idx_quote_items_service_id on public.quote_items(service_id);
create index if not exists idx_quote_items_pricing_id on public.quote_items(pricing_id);

create table if not exists public.quote_events (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  actor_profile_id uuid null references public.profiles(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_quote_events_quote_id on public.quote_events(quote_id);

-- ============================================================================
-- Invoices
-- ============================================================================
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null default (
    'FAC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0')
  ),
  quote_id uuid null references public.quotes(id) on delete set null,
  concierge_profile_id uuid not null references public.profiles(id) on delete cascade,
  owner_profile_id uuid null references public.profiles(id) on delete set null,
  mission_id uuid null references public.missions(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'canceled')),
  issue_date date not null default current_date,
  due_date date null,
  currency text not null default 'EUR' check (char_length(currency) = 3),
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_rate numeric(6,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  balance_amount numeric(12,2) not null default 0,
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  issued_at timestamptz null,
  paid_at timestamptz null,
  canceled_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoices_concierge_profile_id on public.invoices(concierge_profile_id);
create index if not exists idx_invoices_owner_profile_id on public.invoices(owner_profile_id);
create index if not exists idx_invoices_quote_id on public.invoices(quote_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_created_at on public.invoices(created_at desc);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  service_id bigint null references public.services_catalog(id) on delete set null,
  pricing_id bigint null references public.services_pricing(id) on delete set null,
  label text not null,
  description text null,
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  line_total numeric(12,2) not null default 0 check (line_total >= 0),
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoice_items_invoice_id on public.invoice_items(invoice_id);
create index if not exists idx_invoice_items_service_id on public.invoice_items(service_id);
create index if not exists idx_invoice_items_pricing_id on public.invoice_items(pricing_id);

create table if not exists public.invoice_events (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  actor_profile_id uuid null references public.profiles(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_invoice_events_invoice_id on public.invoice_events(invoice_id);

-- ============================================================================
-- Totals sync
-- ============================================================================
create or replace function public.recompute_quote_totals(p_quote_id uuid)
returns void
language plpgsql
as $$
declare
  v_subtotal numeric(12,2);
  v_discount numeric(12,2);
  v_tax_rate numeric(6,2);
  v_tax_amount numeric(12,2);
  v_total numeric(12,2);
begin
  select coalesce(sum(line_total), 0)::numeric(12,2)
  into v_subtotal
  from public.quote_items
  where quote_id = p_quote_id;

  select discount_amount, tax_rate
  into v_discount, v_tax_rate
  from public.quotes
  where id = p_quote_id;

  v_discount := coalesce(v_discount, 0);
  v_tax_rate := coalesce(v_tax_rate, 0);
  v_tax_amount := round(greatest(v_subtotal - v_discount, 0) * (v_tax_rate / 100.0), 2);
  v_total := round(greatest(v_subtotal - v_discount, 0) + v_tax_amount, 2);

  update public.quotes
  set
    subtotal = v_subtotal,
    tax_amount = v_tax_amount,
    total_amount = v_total,
    updated_at = now()
  where id = p_quote_id;
end;
$$;

create or replace function public.trg_quote_items_recompute()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recompute_quote_totals(old.quote_id);
    return old;
  end if;

  perform public.recompute_quote_totals(new.quote_id);
  return new;
end;
$$;

drop trigger if exists trg_quote_items_recompute on public.quote_items;
create trigger trg_quote_items_recompute
after insert or update or delete on public.quote_items
for each row execute function public.trg_quote_items_recompute();

create or replace function public.recompute_invoice_totals(p_invoice_id uuid)
returns void
language plpgsql
as $$
declare
  v_subtotal numeric(12,2);
  v_discount numeric(12,2);
  v_tax_rate numeric(6,2);
  v_paid numeric(12,2);
  v_tax_amount numeric(12,2);
  v_total numeric(12,2);
  v_balance numeric(12,2);
begin
  select coalesce(sum(line_total), 0)::numeric(12,2)
  into v_subtotal
  from public.invoice_items
  where invoice_id = p_invoice_id;

  select discount_amount, tax_rate, paid_amount
  into v_discount, v_tax_rate, v_paid
  from public.invoices
  where id = p_invoice_id;

  v_discount := coalesce(v_discount, 0);
  v_tax_rate := coalesce(v_tax_rate, 0);
  v_paid := coalesce(v_paid, 0);
  v_tax_amount := round(greatest(v_subtotal - v_discount, 0) * (v_tax_rate / 100.0), 2);
  v_total := round(greatest(v_subtotal - v_discount, 0) + v_tax_amount, 2);
  v_balance := round(greatest(v_total - v_paid, 0), 2);

  update public.invoices
  set
    subtotal = v_subtotal,
    tax_amount = v_tax_amount,
    total_amount = v_total,
    balance_amount = v_balance,
    updated_at = now()
  where id = p_invoice_id;
end;
$$;

create or replace function public.trg_invoice_items_recompute()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recompute_invoice_totals(old.invoice_id);
    return old;
  end if;

  perform public.recompute_invoice_totals(new.invoice_id);
  return new;
end;
$$;

drop trigger if exists trg_invoice_items_recompute on public.invoice_items;
create trigger trg_invoice_items_recompute
after insert or update or delete on public.invoice_items
for each row execute function public.trg_invoice_items_recompute();

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.quote_events enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.invoice_events enable row level security;

drop policy if exists quotes_select_policy on public.quotes;
create policy quotes_select_policy
on public.quotes
for select
using (auth.uid() = concierge_profile_id or auth.uid() = owner_profile_id);

drop policy if exists quotes_insert_policy on public.quotes;
create policy quotes_insert_policy
on public.quotes
for insert
with check (auth.uid() = concierge_profile_id);

drop policy if exists quotes_update_policy on public.quotes;
create policy quotes_update_policy
on public.quotes
for update
using (auth.uid() = concierge_profile_id)
with check (auth.uid() = concierge_profile_id);

drop policy if exists quotes_delete_policy on public.quotes;
create policy quotes_delete_policy
on public.quotes
for delete
using (auth.uid() = concierge_profile_id);

drop policy if exists quote_items_select_policy on public.quote_items;
create policy quote_items_select_policy
on public.quote_items
for select
using (
  exists (
    select 1
    from public.quotes q
    where q.id = quote_items.quote_id
      and (auth.uid() = q.concierge_profile_id or auth.uid() = q.owner_profile_id)
  )
);

drop policy if exists quote_items_mutation_policy on public.quote_items;
create policy quote_items_mutation_policy
on public.quote_items
for all
using (
  exists (
    select 1
    from public.quotes q
    where q.id = quote_items.quote_id
      and auth.uid() = q.concierge_profile_id
  )
)
with check (
  exists (
    select 1
    from public.quotes q
    where q.id = quote_items.quote_id
      and auth.uid() = q.concierge_profile_id
  )
);

drop policy if exists quote_events_select_policy on public.quote_events;
create policy quote_events_select_policy
on public.quote_events
for select
using (
  exists (
    select 1
    from public.quotes q
    where q.id = quote_events.quote_id
      and (auth.uid() = q.concierge_profile_id or auth.uid() = q.owner_profile_id)
  )
);

drop policy if exists quote_events_insert_policy on public.quote_events;
create policy quote_events_insert_policy
on public.quote_events
for insert
with check (
  exists (
    select 1
    from public.quotes q
    where q.id = quote_events.quote_id
      and auth.uid() = q.concierge_profile_id
  )
);

drop policy if exists invoices_select_policy on public.invoices;
create policy invoices_select_policy
on public.invoices
for select
using (auth.uid() = concierge_profile_id or auth.uid() = owner_profile_id);

drop policy if exists invoices_insert_policy on public.invoices;
create policy invoices_insert_policy
on public.invoices
for insert
with check (auth.uid() = concierge_profile_id);

drop policy if exists invoices_update_policy on public.invoices;
create policy invoices_update_policy
on public.invoices
for update
using (auth.uid() = concierge_profile_id)
with check (auth.uid() = concierge_profile_id);

drop policy if exists invoices_delete_policy on public.invoices;
create policy invoices_delete_policy
on public.invoices
for delete
using (auth.uid() = concierge_profile_id);

drop policy if exists invoice_items_select_policy on public.invoice_items;
create policy invoice_items_select_policy
on public.invoice_items
for select
using (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_items.invoice_id
      and (auth.uid() = i.concierge_profile_id or auth.uid() = i.owner_profile_id)
  )
);

drop policy if exists invoice_items_mutation_policy on public.invoice_items;
create policy invoice_items_mutation_policy
on public.invoice_items
for all
using (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_items.invoice_id
      and auth.uid() = i.concierge_profile_id
  )
)
with check (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_items.invoice_id
      and auth.uid() = i.concierge_profile_id
  )
);

drop policy if exists invoice_events_select_policy on public.invoice_events;
create policy invoice_events_select_policy
on public.invoice_events
for select
using (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_events.invoice_id
      and (auth.uid() = i.concierge_profile_id or auth.uid() = i.owner_profile_id)
  )
);

drop policy if exists invoice_events_insert_policy on public.invoice_events;
create policy invoice_events_insert_policy
on public.invoice_events
for insert
with check (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_events.invoice_id
      and auth.uid() = i.concierge_profile_id
  )
);
