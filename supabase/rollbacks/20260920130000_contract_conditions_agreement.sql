-- Manual rollback only; never applied remotely by the local test harness.
-- Stop writes and back up services_contract_versions/services_contracts first.
-- If any proposal/agreement/history exists, KEEP the schema and roll the app
-- forward: this rollback refuses to erase negotiation evidence.
-- Only first-generation, never-proposed drafts can return to the previous schema.
begin;
lock table public.services_contract_versions in access exclusive mode;
do $$ begin
  if exists(select 1 from public.services_contract_versions where status <> 'draft'
    or version_number <> 1 or proposed_at is not null or previous_version_id is not null) then
    raise exception 'Rollback refused: preserve proposal/agreement history';
  end if;
end $$;
drop function public.transition_collaboration_contract_version(uuid,uuid,uuid,integer,text,text);
drop trigger services_contract_versions_freeze on public.services_contract_versions;
drop function public.guard_contract_version_freeze();
drop index public.services_contract_versions_one_current;
alter table public.services_contract_versions
  drop constraint services_contract_versions_agreement_shape,
  drop constraint services_contract_versions_status_check,
  add constraint services_contract_versions_status_check check (status = 'draft'),
  drop column proposed_by, drop column proposed_at,
  drop column proposed_owner_id, drop column proposed_concierge_id,
  drop column owner_accepted_by, drop column owner_accepted_at,
  drop column concierge_accepted_by, drop column concierge_accepted_at,
  drop column change_requested_by, drop column change_requested_at,
  drop column change_request_reason, drop column previous_version_id;
create or replace function public.save_collaboration_contract_draft(
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

drop function public.save_collaboration_contract_draft(uuid,uuid,integer,jsonb,uuid);
commit;
