-- Contractual conditions live ONLY in services_contract_versions.conditions.
-- No signature or activation is implemented. Legacy contracts remain unchanged.
begin;

alter table public.services_contracts
  add column collaboration_id uuid null references public.housing_collaborations(id) on delete restrict;
create unique index services_contracts_collaboration_unique
  on public.services_contracts(collaboration_id) where collaboration_id is not null;

create function public.valid_collaboration_draft_conditions(doc jsonb)
returns boolean language plpgsql immutable set search_path = pg_catalog, public as $$
declare
  duration jsonb; service jsonb; pricing jsonb; code text; codes text[] := '{}';
  start_day date; end_day date; price_type text; price_amount numeric;
begin
  if doc is null or jsonb_typeof(doc) <> 'object'
    or not (doc ?& array['mode','duration','services'])
    or doc - array['mode','duration','services'] <> '{}'::jsonb
    or doc->>'mode' not in ('A_LA_CARTE','FULL_MANAGEMENT') then return false; end if;
  duration := doc->'duration';
  if jsonb_typeof(duration) <> 'object'
    or not (duration ?& array['kind','startsOn','endsOn','noticeDays'])
    or duration - array['kind','startsOn','endsOn','noticeDays'] <> '{}'::jsonb
    or duration->>'kind' not in ('DETERMINEE','INDETERMINEE')
    or jsonb_typeof(duration->'startsOn') <> 'string'
    or (duration->>'startsOn') !~ '^\d{4}-\d{2}-\d{2}$'
    or jsonb_typeof(duration->'noticeDays') <> 'number'
    or (duration->>'noticeDays')::numeric not between 0 and 3650
    or trunc((duration->>'noticeDays')::numeric) <> (duration->>'noticeDays')::numeric
    then return false; end if;
  start_day := (duration->>'startsOn')::date;
  if duration->>'kind' = 'DETERMINEE' then
    if jsonb_typeof(duration->'endsOn') <> 'string'
      or (duration->>'endsOn') !~ '^\d{4}-\d{2}-\d{2}$' then return false; end if;
    end_day := (duration->>'endsOn')::date;
    if end_day < start_day then return false; end if;
  elsif duration->'endsOn' <> 'null'::jsonb then return false; end if;
  if jsonb_typeof(doc->'services') <> 'array'
    or jsonb_array_length(doc->'services') not between 1 and 100 then return false; end if;
  for service in select value from jsonb_array_elements(doc->'services') loop
    if jsonb_typeof(service) <> 'object'
      or not (service ?& array['code','state','pricing'])
      or service - array['code','state','pricing'] <> '{}'::jsonb
      or jsonb_typeof(service->'code') <> 'string'
      or service->>'code' !~ '^[A-Z][A-Z0-9_]{1,63}$'
      or service->>'state' not in ('AUTOMATIQUE','SUR_DEMANDE','NON_INCLUSE') then return false; end if;
    code := service->>'code';
    if code = any(codes) then return false; end if;
    codes := array_append(codes, code);
    pricing := service->'pricing';
    if service->>'state' = 'NON_INCLUSE' then
      if pricing <> 'null'::jsonb then return false; end if;
      continue;
    end if;
    if jsonb_typeof(pricing) <> 'object' or not (pricing ? 'type') then return false; end if;
    price_type := pricing->>'type';
    if price_type in ('FORFAIT_MISSION','HORAIRE') then
      if not (pricing ?& array['type','amount','currency'])
        or pricing - array['type','amount','currency'] <> '{}'::jsonb
        or jsonb_typeof(pricing->'amount') <> 'number'
        or jsonb_typeof(pricing->'currency') <> 'string'
        or pricing->>'currency' !~ '^[A-Z]{3}$' then return false; end if;
      price_amount := (pricing->>'amount')::numeric;
      if price_amount < 0 or price_amount > 999999999.99 or price_amount <> round(price_amount, 2) then return false; end if;
    elsif price_type = 'POURCENTAGE' then
      if not (pricing ?& array['type','rate','basis'])
        or pricing - array['type','rate','basis'] <> '{}'::jsonb
        or jsonb_typeof(pricing->'rate') <> 'number'
        or (pricing->>'rate')::numeric <= 0 or (pricing->>'rate')::numeric > 100
        or jsonb_typeof(pricing->'basis') <> 'string'
        or length(btrim(pricing->>'basis')) not between 1 and 500 then return false; end if;
    elsif price_type in ('INCLUS','SUR_DEVIS') then
      if pricing - 'type' <> '{}'::jsonb then return false; end if;
    else return false; end if;
  end loop;
  -- JSON null must never pass SQL's three-valued comparisons.
  if jsonb_typeof(doc->'mode') <> 'string' or jsonb_typeof(duration->'kind') <> 'string'
    or exists(select 1 from jsonb_array_elements(doc->'services') s where jsonb_typeof(s->'state') <> 'string')
    then return false; end if;
  return true;
exception when others then return false;
end;
$$;

create table public.services_contract_versions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.services_contracts(id) on delete restrict,
  version_number integer not null default 1 check (version_number > 0),
  status text not null default 'draft' check (status = 'draft'),
  revision integer not null default 1 check (revision > 0),
  conditions jsonb not null check (public.valid_collaboration_draft_conditions(conditions)),
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(contract_id, version_number)
);
create unique index services_contract_versions_one_draft
  on public.services_contract_versions(contract_id) where status = 'draft';
alter table public.services_contract_versions enable row level security;

-- Restrictive policies also protect against any historical permissive policies.
create policy services_contracts_collaboration_read_gate on public.services_contracts
  as restrictive for select to authenticated using (collaboration_id is null or exists (
    select 1 from public.housing_collaborations c where c.id = collaboration_id
      and auth.uid() in (c.owner_profile_id, c.concierge_profile_id)));
create policy services_contracts_collaboration_participants_read on public.services_contracts
  for select to authenticated using (exists (
    select 1 from public.housing_collaborations c where c.id = collaboration_id
      and auth.uid() in (c.owner_profile_id, c.concierge_profile_id)));
create policy services_contracts_legacy_insert_gate on public.services_contracts
  as restrictive for insert to authenticated with check (collaboration_id is null);
create policy services_contracts_legacy_update_gate on public.services_contracts
  as restrictive for update to authenticated using (collaboration_id is null) with check (collaboration_id is null);
create policy services_contracts_legacy_delete_gate on public.services_contracts
  as restrictive for delete to authenticated using (collaboration_id is null);
create policy services_contract_versions_participants_read on public.services_contract_versions
  for select to authenticated using (exists (
    select 1 from public.services_contracts sc join public.housing_collaborations c on c.id = sc.collaboration_id
    where sc.id = contract_id and auth.uid() in (c.owner_profile_id, c.concierge_profile_id)));
revoke all on public.services_contract_versions from anon, authenticated;
grant select on public.services_contract_versions to authenticated;
grant all on public.services_contract_versions to service_role;

-- Only the authenticated application server may supply p_actor_id. Both participants
-- may edit; direct browser RPC calls cannot impersonate a participant.
create function public.save_collaboration_contract_draft(
  p_collaboration_id uuid, p_actor_id uuid, p_expected_revision integer, p_conditions jsonb
) returns public.services_contract_versions
language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  collaboration public.housing_collaborations;
  envelope_id uuid;
  draft public.services_contract_versions;
begin
  if p_actor_id is null then raise exception 'Participant required' using errcode = '42501'; end if;
  select * into collaboration from public.housing_collaborations where id = p_collaboration_id for update;
  if not found or p_actor_id not in (collaboration.owner_profile_id, collaboration.concierge_profile_id) then
    raise exception 'Collaboration unavailable' using errcode = '42501';
  end if;
  if collaboration.status <> 'pending_handover' then raise exception 'Collaboration is not pending' using errcode = '40001'; end if;
  if not exists (select 1 from public.quotes q where q.id = collaboration.quote_id and q.status = 'accepted'
    and q.owner_profile_id = collaboration.owner_profile_id and q.concierge_profile_id = collaboration.concierge_profile_id) then
    raise exception 'Accepted quote mismatch' using errcode = '23514';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 or not public.valid_collaboration_draft_conditions(p_conditions) then
    raise exception 'Invalid conditions or revision' using errcode = '23514';
  end if;
  select id into envelope_id from public.services_contracts where collaboration_id = p_collaboration_id;
  if envelope_id is not null then
    select * into draft from public.services_contract_versions where contract_id = envelope_id and status = 'draft' for update;
    if found then
      -- Identical request retries are idempotent, including after a lost response.
      if draft.conditions = p_conditions then return draft; end if;
      if draft.revision <> p_expected_revision then raise exception 'Draft changed; reload' using errcode = '40001'; end if;
      update public.services_contract_versions set conditions = p_conditions, revision = revision + 1,
        updated_by = p_actor_id, updated_at = clock_timestamp() where id = draft.id returning * into draft;
      return draft;
    end if;
  end if;
  if p_expected_revision <> 0 then raise exception 'Draft changed; reload' using errcode = '40001'; end if;
  if envelope_id is null then
    -- start_date is required by the legacy envelope; this is its creation date,
    -- never the contractual effective date (which lives in conditions.duration).
    insert into public.services_contracts(collaboration_id, profile_id, title, start_date, status)
      values(p_collaboration_id, null, 'Brouillon de conditions contractuelles', current_date, 'draft') returning id into envelope_id;
  end if;
  insert into public.services_contract_versions(contract_id, conditions, created_by, updated_by)
    values(envelope_id, p_conditions, p_actor_id, p_actor_id) returning * into draft;
  return draft;
end;
$$;
revoke all on function public.save_collaboration_contract_draft(uuid, uuid, integer, jsonb) from public, anon, authenticated;
grant execute on function public.save_collaboration_contract_draft(uuid, uuid, integer, jsonb) to service_role;
comment on table public.services_contract_versions is 'Editable contractual draft; no signatures or activation. Writes through server-only RPC with revision control.';
commit;
