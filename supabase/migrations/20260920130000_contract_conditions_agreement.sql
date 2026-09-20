-- Proposal and explicit agreement are NOT signatures. Collaboration stays pending.
begin;
alter table public.services_contract_versions
  drop constraint services_contract_versions_status_check,
  add constraint services_contract_versions_status_check check (status in ('draft','proposed','ready_to_sign','superseded')),
  add column proposed_by uuid references public.profiles(id) on delete restrict,
  add column proposed_at timestamptz,
  add column proposed_owner_id uuid references public.profiles(id) on delete restrict,
  add column proposed_concierge_id uuid references public.profiles(id) on delete restrict,
  add column owner_accepted_by uuid references public.profiles(id) on delete restrict,
  add column owner_accepted_at timestamptz,
  add column concierge_accepted_by uuid references public.profiles(id) on delete restrict,
  add column concierge_accepted_at timestamptz,
  add column change_requested_by uuid references public.profiles(id) on delete restrict,
  add column change_requested_at timestamptz,
  add column change_request_reason text,
  add column previous_version_id uuid unique references public.services_contract_versions(id) on delete restrict;
create unique index services_contract_versions_one_current
  on public.services_contract_versions(contract_id) where status <> 'superseded';
alter table public.services_contract_versions add constraint services_contract_versions_agreement_shape check (
  (status = 'draft' and proposed_by is null and proposed_at is null and proposed_owner_id is null and proposed_concierge_id is null
    and owner_accepted_by is null and owner_accepted_at is null and concierge_accepted_by is null and concierge_accepted_at is null
    and change_requested_by is null and change_requested_at is null and change_request_reason is null)
  or (status <> 'draft' and proposed_by is not null and proposed_at is not null
    and proposed_owner_id is not null and proposed_concierge_id is not null and proposed_owner_id <> proposed_concierge_id
    and proposed_by in (proposed_owner_id, proposed_concierge_id)
    and ((owner_accepted_by is null and owner_accepted_at is null) or (owner_accepted_by is not null and owner_accepted_by = proposed_owner_id and owner_accepted_at is not null))
    and ((concierge_accepted_by is null and concierge_accepted_at is null) or (concierge_accepted_by is not null and concierge_accepted_by = proposed_concierge_id and concierge_accepted_at is not null))
    and (status <> 'ready_to_sign' or (owner_accepted_at is not null and concierge_accepted_at is not null))
    and (status <> 'proposed' or owner_accepted_at is null or concierge_accepted_at is null)
    and ((status = 'superseded' and change_requested_by is not null and change_requested_by in (proposed_owner_id, proposed_concierge_id)
      and change_requested_by <> proposed_by and change_requested_at is not null and change_request_reason is not null and length(btrim(change_request_reason)) between 1 and 2000)
      or (status <> 'superseded' and change_requested_by is null and change_requested_at is null and change_request_reason is null)))
);

-- Database guard protects frozen content even from old service-role write paths.
create function public.guard_contract_version_freeze() returns trigger
language plpgsql set search_path = pg_catalog, public as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then raise exception 'Frozen version cannot be deleted' using errcode = '42501'; end if;
    return old;
  end if;
  if new.id <> old.id or new.contract_id <> old.contract_id or new.version_number <> old.version_number
    or new.created_by <> old.created_by or new.created_at <> old.created_at
    or new.previous_version_id is distinct from old.previous_version_id then
    raise exception 'Version identity is immutable' using errcode = '42501';
  end if;
  if old.status <> 'draft' then
    if (to_jsonb(new) - array['status','owner_accepted_by','owner_accepted_at','concierge_accepted_by','concierge_accepted_at','change_requested_by','change_requested_at','change_request_reason'])
      is distinct from (to_jsonb(old) - array['status','owner_accepted_by','owner_accepted_at','concierge_accepted_by','concierge_accepted_at','change_requested_by','change_requested_at','change_request_reason']) then
      raise exception 'Frozen version content is immutable' using errcode = '42501';
    end if;
    if old.status <> 'proposed' or new.status not in ('proposed','ready_to_sign','superseded') then
      raise exception 'Invalid frozen transition' using errcode = '42501';
    end if;
    if (old.owner_accepted_at is not null and (new.owner_accepted_at is distinct from old.owner_accepted_at or new.owner_accepted_by is distinct from old.owner_accepted_by))
      or (old.concierge_accepted_at is not null and (new.concierge_accepted_at is distinct from old.concierge_accepted_at or new.concierge_accepted_by is distinct from old.concierge_accepted_by)) then
      raise exception 'Agreement cannot be overwritten' using errcode = '42501';
    end if;
  elsif new.status <> 'draft' then
    if new.status <> 'proposed' or new.conditions is distinct from old.conditions or new.revision <> old.revision
      or new.updated_at <> old.updated_at or new.updated_by <> old.updated_by then
      raise exception 'Propose the exact saved revision' using errcode = '40001';
    end if;
    if new.owner_accepted_at is not null or new.concierge_accepted_at is not null then
      raise exception 'Proposing does not mean accepting' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger services_contract_versions_freeze before update or delete on public.services_contract_versions
  for each row execute function public.guard_contract_version_freeze();

-- Explicit version identity prevents an old editor from modifying a newer draft.
create function public.save_collaboration_contract_draft(
  p_collaboration_id uuid, p_actor_id uuid, p_expected_revision integer, p_conditions jsonb, p_version_id uuid
) returns public.services_contract_versions
language plpgsql security definer set search_path = pg_catalog, public as $$
declare c public.housing_collaborations; envelope_id uuid; v public.services_contract_versions;
begin
  select * into c from public.housing_collaborations where id = p_collaboration_id for update;
  if not found or p_actor_id is null or p_actor_id not in (c.owner_profile_id,c.concierge_profile_id) then
    raise exception 'Collaboration unavailable' using errcode = '42501'; end if;
  if c.status <> 'pending_handover' then raise exception 'Collaboration is not pending' using errcode = '40001'; end if;
  if not exists(select 1 from public.quotes q where q.id = c.quote_id and q.status = 'accepted'
    and q.owner_profile_id = c.owner_profile_id and q.concierge_profile_id = c.concierge_profile_id) then
    raise exception 'Accepted quote mismatch' using errcode = '23514'; end if;
  if p_expected_revision is null or p_expected_revision < 0 or not public.valid_collaboration_draft_conditions(p_conditions) then
    raise exception 'Invalid conditions or revision' using errcode = '23514'; end if;
  select id into envelope_id from public.services_contracts where collaboration_id = c.id;
  if envelope_id is not null then
    select * into v from public.services_contract_versions where contract_id = envelope_id order by version_number desc limit 1 for update;
    if found then
      if v.status <> 'draft' or (p_version_id is distinct from v.id and not (p_version_id is null and v.version_number = 1 and v.revision = 1 and p_expected_revision = 0 and v.conditions = p_conditions)) then
        raise exception 'Version changed; reload' using errcode = '40001'; end if;
      if v.conditions = p_conditions then return v; end if;
      if v.revision <> p_expected_revision then raise exception 'Draft changed; reload' using errcode = '40001'; end if;
      update public.services_contract_versions set conditions = p_conditions, revision = revision + 1,
        updated_by = p_actor_id, updated_at = clock_timestamp() where id = v.id returning * into v;
      return v;
    end if;
  end if;
  if p_version_id is not null or p_expected_revision <> 0 then raise exception 'Version changed; reload' using errcode = '40001'; end if;
  if envelope_id is null then
    insert into public.services_contracts(collaboration_id,profile_id,title,start_date,status)
      values(c.id,null,'Brouillon de conditions contractuelles',current_date,'draft') returning id into envelope_id;
  end if;
  insert into public.services_contract_versions(contract_id,conditions,created_by,updated_by)
    values(envelope_id,p_conditions,p_actor_id,p_actor_id) returning * into v;
  return v;
end $$;
revoke all on function public.save_collaboration_contract_draft(uuid,uuid,integer,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.save_collaboration_contract_draft(uuid,uuid,integer,jsonb,uuid) to service_role;

-- Old callers are compatible only until the first proposal. They cannot select
-- or create a replacement draft implicitly after negotiation has started.
create or replace function public.save_collaboration_contract_draft(
  p_collaboration_id uuid, p_actor_id uuid, p_expected_revision integer, p_conditions jsonb
) returns public.services_contract_versions
language plpgsql security definer set search_path = pg_catalog, public as $$
declare v public.services_contract_versions;
begin
  perform 1 from public.housing_collaborations where id = p_collaboration_id for update;
  select cv.* into v from public.services_contract_versions cv join public.services_contracts sc on sc.id = cv.contract_id
    where sc.collaboration_id = p_collaboration_id order by cv.version_number desc limit 1;
  if found and (v.version_number <> 1 or v.status <> 'draft') then raise exception 'Version identity required; reload' using errcode = '40001'; end if;
  return public.save_collaboration_contract_draft(p_collaboration_id,p_actor_id,p_expected_revision,p_conditions,v.id);
end $$;

create function public.transition_collaboration_contract_version(
  p_collaboration_id uuid, p_actor_id uuid, p_version_id uuid, p_expected_revision integer,
  p_action text, p_reason text default null
) returns public.services_contract_versions
language plpgsql security definer set search_path = pg_catalog, public as $$
declare c public.housing_collaborations; v public.services_contract_versions; child public.services_contract_versions;
begin
  select * into c from public.housing_collaborations where id = p_collaboration_id for update;
  if not found or p_actor_id is null or p_actor_id not in (c.owner_profile_id,c.concierge_profile_id) then
    raise exception 'Collaboration unavailable' using errcode = '42501'; end if;
  if c.status <> 'pending_handover' then raise exception 'Collaboration is not pending' using errcode = '40001'; end if;
  select cv.* into v from public.services_contract_versions cv join public.services_contracts sc on sc.id = cv.contract_id
    where cv.id = p_version_id and sc.collaboration_id = c.id for update of cv;
  if not found or p_expected_revision is null or v.revision <> p_expected_revision then
    raise exception 'Version or revision changed; reload' using errcode = '40001'; end if;
  if p_action is null or p_action not in ('propose','accept','request_changes') then raise exception 'Invalid action' using errcode = '23514'; end if;
  if v.status <> 'draft' and (v.proposed_owner_id <> c.owner_profile_id or v.proposed_concierge_id <> c.concierge_profile_id) then
    raise exception 'Participants changed' using errcode = '40001'; end if;
  if p_action = 'propose' then
    if v.status in ('proposed','ready_to_sign') and v.proposed_by = p_actor_id then return v; end if;
    if v.status <> 'draft' then raise exception 'Version is not a draft' using errcode = '40001'; end if;
    if c.owner_profile_id = c.concierge_profile_id then raise exception 'Distinct parties required' using errcode = '23514'; end if;
    update public.services_contract_versions set status='proposed', proposed_by=p_actor_id, proposed_at=clock_timestamp(),
      proposed_owner_id=c.owner_profile_id, proposed_concierge_id=c.concierge_profile_id where id=v.id returning * into v;
  elsif p_action = 'accept' then
    if v.status not in ('proposed','ready_to_sign') then raise exception 'Version is not proposed' using errcode = '40001'; end if;
    if (p_actor_id = v.proposed_owner_id and v.owner_accepted_at is not null)
      or (p_actor_id = v.proposed_concierge_id and v.concierge_accepted_at is not null) then return v; end if;
    update public.services_contract_versions set
      owner_accepted_by = case when p_actor_id = proposed_owner_id then p_actor_id else owner_accepted_by end,
      owner_accepted_at = case when p_actor_id = proposed_owner_id then clock_timestamp() else owner_accepted_at end,
      concierge_accepted_by = case when p_actor_id = proposed_concierge_id then p_actor_id else concierge_accepted_by end,
      concierge_accepted_at = case when p_actor_id = proposed_concierge_id then clock_timestamp() else concierge_accepted_at end,
      status = case when (owner_accepted_at is not null or p_actor_id = proposed_owner_id)
        and (concierge_accepted_at is not null or p_actor_id = proposed_concierge_id) then 'ready_to_sign' else 'proposed' end
      where id=v.id returning * into v;
  else
    if p_actor_id = v.proposed_by then raise exception 'Only the other participant can request changes' using errcode = '42501'; end if;
    if p_reason is null or length(btrim(p_reason)) not between 1 and 2000 then raise exception 'Reason required' using errcode = '23514'; end if;
    if v.status = 'superseded' and v.change_requested_by = p_actor_id and v.change_request_reason = btrim(p_reason) then
      select * into child from public.services_contract_versions where previous_version_id = v.id;
      return child;
    end if;
    if v.status <> 'proposed' then raise exception 'Version is not proposed' using errcode = '40001'; end if;
    update public.services_contract_versions set status='superseded', change_requested_by=p_actor_id,
      change_requested_at=clock_timestamp(), change_request_reason=btrim(p_reason) where id=v.id;
    insert into public.services_contract_versions(contract_id,version_number,conditions,created_by,updated_by,previous_version_id)
      values(v.contract_id,v.version_number+1,v.conditions,p_actor_id,p_actor_id,v.id) returning * into v;
  end if;
  return v;
end $$;
revoke all on function public.transition_collaboration_contract_version(uuid,uuid,uuid,integer,text,text) from public,anon,authenticated;
grant execute on function public.transition_collaboration_contract_version(uuid,uuid,uuid,integer,text,text) to service_role;
comment on column public.services_contract_versions.owner_accepted_at is 'Explicit agreement on frozen conditions; NOT an electronic signature.';
comment on column public.services_contract_versions.concierge_accepted_at is 'Explicit agreement on frozen conditions; NOT an electronic signature.';
commit;
