-- Execute as the owner on a disposable database, AFTER both target migrations.
DO $$
DECLARE t text; f regprocedure;
BEGIN
  FOREACH t IN ARRAY ARRAY['provider_solicitations','provider_solicitation_operations','provider_solicitation_events'] LOOP
    PERFORM harness.assert_true((SELECT c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=t), 'RLS enabled: '||t);
    PERFORM harness.assert_true(NOT has_table_privilege('authenticated','public.'||t,'SELECT,INSERT,UPDATE,DELETE') AND NOT has_table_privilege('anon','public.'||t,'SELECT,INSERT,UPDATE,DELETE') AND NOT has_table_privilege('service_role','public.'||t,'SELECT,INSERT,UPDATE,DELETE'), 'direct ACL: '||t);
  END LOOP;
  FOREACH f IN ARRAY ARRAY['public.create_provider_solicitation(uuid,uuid,uuid,jsonb)'::regprocedure,'public.respond_provider_solicitation(uuid,uuid,uuid,uuid,text,text,integer)'::regprocedure,'public.read_provider_solicitations(uuid,uuid,uuid,text,integer,timestamptz,uuid)'::regprocedure,'public.lookup_provider_solicitation_creation(uuid,uuid,uuid,jsonb)'::regprocedure] LOOP
    PERFORM harness.assert_true(has_function_privilege('service_role',f,'EXECUTE') AND NOT has_function_privilege('authenticated',f,'EXECUTE') AND NOT has_function_privilege('anon',f,'EXECUTE'), 'RPC ACL: '||f::text);
    PERFORM harness.assert_true((SELECT prosecdef AND proconfig @> ARRAY['search_path=pg_catalog'] FROM pg_proc WHERE oid=f), 'definer and search_path: '||f::text);
  END LOOP;
  PERFORM harness.assert_true(EXISTS (SELECT 1 FROM pg_constraint WHERE conname='provider_solicitations_creation_operation_fk' AND condeferrable AND condeferred), 'deferred FK');
  PERFORM harness.assert_true(EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='provider_solicitations_open_business_key' AND indexdef LIKE '%WHERE%'), 'partial unique index');
  PERFORM harness.assert_true(EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='provider_solicitations_audit_complete' AND tgdeferrable AND tginitdeferred AND NOT tgisinternal), 'deferred audit');
END $$;
