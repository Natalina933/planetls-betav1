-- À exécuter dans la base synthétique seulement. Aucun PASS avant exécution.
SELECT harness.assert_true(current_setting('server_version_num')::int BETWEEN 170000 AND 179999,'PostgreSQL 17');
SELECT harness.assert_true(NOT rolsuper AND NOT rolbypassrls,'client cannot bypass RLS')
FROM pg_roles WHERE rolname IN ('authenticated','anon','harness_client');
SELECT harness.assert_true(NOT pg_has_role('harness_client','service_role','MEMBER'),'client cannot assume service');
SELECT harness.assert_true(relrowsecurity AND relowner=(SELECT oid FROM pg_roles WHERE rolname='postgres'),'assignment RLS and owner')
FROM pg_class WHERE oid='public.mission_provider_assignments'::regclass;
SELECT harness.assert_true(count(*)=6 AND bool_and(coalesce(prosecdef AND proowner=(SELECT oid FROM pg_roles WHERE rolname='postgres')
  AND proconfig @> ARRAY['search_path=pg_catalog'],false)),'six restricted definer functions') FROM pg_proc
WHERE oid IN ('public.lock_mission_assignment_scope(uuid)'::regprocedure,
 'public.guard_mission_provider_assignment()'::regprocedure,'public.guard_assigned_resource_identity()'::regprocedure,
 'public.assert_mission_assignment_actor(uuid,uuid,uuid)'::regprocedure,
 'public.create_mission_provider_assignment(uuid,uuid,uuid,uuid,uuid,jsonb)'::regprocedure,
 'public.revoke_mission_provider_assignment(uuid,uuid,uuid,text)'::regprocedure);
SELECT harness.assert_true(NOT has_table_privilege(r,'public.mission_provider_assignments','SELECT')
 AND NOT has_table_privilege(r,'public.mission_provider_assignments','INSERT')
 AND NOT has_table_privilege(r,'public.mission_provider_assignments','UPDATE')
 AND NOT has_table_privilege(r,'public.mission_provider_assignments','DELETE')
 AND NOT has_table_privilege(r,'public.mission_provider_assignments','TRUNCATE'),'client assignment ACL')
FROM unnest(ARRAY['anon','authenticated']) r;
SELECT harness.assert_true(has_table_privilege('service_role','public.mission_provider_assignments','SELECT')
 AND NOT has_table_privilege('service_role','public.mission_provider_assignments','INSERT')
 AND NOT has_table_privilege('service_role','public.mission_provider_assignments','UPDATE')
 AND NOT has_table_privilege('service_role','public.mission_provider_assignments','DELETE')
 AND NOT has_table_privilege('service_role','public.mission_provider_assignments','TRUNCATE'),'server no direct DML');
SELECT harness.assert_true(NOT has_function_privilege(r,p.oid,'EXECUTE'),'client function ACL')
FROM unnest(ARRAY['anon','authenticated']) r CROSS JOIN pg_proc p WHERE p.pronamespace='public'::regnamespace
AND p.proname IN ('lock_mission_assignment_scope','guard_mission_provider_assignment','guard_assigned_resource_identity',
 'assert_mission_assignment_actor','create_mission_provider_assignment','revoke_mission_provider_assignment');
SELECT harness.assert_true(has_function_privilege('service_role','public.create_mission_provider_assignment(uuid,uuid,uuid,uuid,uuid,jsonb)','EXECUTE')
 AND has_function_privilege('service_role','public.revoke_mission_provider_assignment(uuid,uuid,uuid,text)','EXECUTE')
 AND NOT has_function_privilege('service_role','public.lock_mission_assignment_scope(uuid)','EXECUTE')
 AND NOT has_function_privilege('service_role','public.assert_mission_assignment_actor(uuid,uuid,uuid)','EXECUTE'),'RPC/helper split');
SELECT harness.assert_true(NOT has_function_privilege('service_role',p.oid,'EXECUTE'),'trigger functions remain private')
FROM pg_proc p WHERE p.oid IN ('public.guard_mission_provider_assignment()'::regprocedure,
 'public.guard_assigned_resource_identity()'::regprocedure);
SELECT harness.assert_true(EXISTS(SELECT 1 FROM pg_constraint c WHERE c.conrelid='public.mission_provider_assignments'::regclass
 AND c.contype='u' AND c.conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid=c.conrelid AND attname=column_name)]::smallint[]),
 'unique canonical key: '||column_name) FROM unnest(ARRAY['operation_id','provider_intervention_id']) column_name;
SELECT harness.assert_true(count(*)=3,'three composite scope FK constraints') FROM pg_constraint
WHERE conrelid='public.mission_provider_assignments'::regclass AND contype='f' AND cardinality(conkey)=2
 AND ((confrelid='public.provider_interventions'::regclass AND conname='mission_provider_assignments_intervention_identity_fkey')
 OR (confrelid='public.reservations'::regclass AND conname IN
 ('mission_provider_assignments_reservation_owner_fkey','mission_provider_assignments_reservation_property_fkey')));
