-- MANUAL ROLLBACK ONLY. Never part of the forward migration chain.
-- 1. Stop draft writes and save a pg_dump backup of the affected database.
-- 2. Export linked services_contracts and services_contract_versions with their IDs.
-- 3. If drafts exist, prefer rolling back the application while KEEPING the additive
--    schema/data. Destructive removal requires separately approved export/deletion.
-- 4. This script deliberately refuses nonempty contractual data. It preserves all
--    historical services_contracts and their original policies.
-- 5. Restore the prior application API filters only after this rollback succeeds.
begin;
do $$ begin
  if exists(select 1 from public.services_contract_versions)
    or exists(select 1 from public.services_contracts where collaboration_id is not null) then
    raise exception 'Rollback refused: export and preserve contractual drafts first';
  end if;
end $$;
drop function public.save_collaboration_contract_draft(uuid, uuid, integer, jsonb);
drop table public.services_contract_versions;
drop policy services_contracts_collaboration_read_gate on public.services_contracts;
drop policy services_contracts_collaboration_participants_read on public.services_contracts;
drop policy services_contracts_legacy_insert_gate on public.services_contracts;
drop policy services_contracts_legacy_update_gate on public.services_contracts;
drop policy services_contracts_legacy_delete_gate on public.services_contracts;
drop index public.services_contracts_collaboration_unique;
alter table public.services_contracts drop column collaboration_id;
drop function public.valid_collaboration_draft_conditions(jsonb);
commit;
