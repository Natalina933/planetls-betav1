-- Assert actual role attributes and ownership, never trust role-like GUC values.
SELECT harness.assert_true(NOT rolsuper AND NOT rolbypassrls,'authenticated must not bypass RLS') FROM pg_roles WHERE rolname='authenticated';
SELECT harness.assert_true(NOT rolsuper AND NOT rolbypassrls,'client must not bypass RLS') FROM pg_roles WHERE rolname='harness_client';
SELECT harness.assert_true(NOT pg_has_role('harness_client','service_role','MEMBER'),'client cannot SET ROLE service_role');
SELECT harness.assert_true(rolbypassrls AND NOT rolsuper,'separate service role') FROM pg_roles WHERE rolname='service_role';
SELECT harness.assert_true(NOT EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tableowner IN ('authenticated','harness_client')),'RLS actor owns no application table');
SELECT harness.assert_true(NOT has_function_privilege('authenticated','public.award_service_request_quote(uuid,uuid)','EXECUTE'),'award RPC server only');
SELECT harness.assert_true(has_function_privilege('service_role','public.award_service_request_quote(uuid,uuid)','EXECUTE'),'server can award');
SELECT harness.assert_true(NOT has_function_privilege('anon','public.concierge_has_request_invitation(uuid)','EXECUTE'),'anonymous helper denied');
SELECT harness.assert_true(NOT has_table_privilege('authenticated','public.profiles','DELETE'),'profile DELETE remains revoked');
SELECT harness.assert_true(count(*)=3,'participant tables RLS enabled') FROM pg_class WHERE oid IN ('public.service_requests'::regclass,'public.service_request_recipients'::regclass,'public.quotes'::regclass) AND relrowsecurity;
-- Canonical fresh/representative fixture chain: preserve NOT NULL and defaults.
SELECT harness.assert_true(count(*)=3,'status widths, defaults and nullability preserved')
FROM (VALUES ('service_requests',21,'sent'),('service_request_recipients',21,'sent'),('missions',25,'draft')) target(name,width,initial)
JOIN pg_attribute a ON a.attrelid=format('public.%I',target.name)::regclass AND a.attname='status'
JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
WHERE a.atttypid='varchar'::regtype AND a.atttypmod=target.width+4 AND a.attnotnull
  AND position(quote_literal(target.initial) IN pg_get_expr(d.adbin,d.adrelid))>0;
BEGIN;
INSERT INTO public.mission_events(mission_id,event_type)
VALUES('70000000-0000-4000-8000-000000000001','quote_accepted');
ROLLBACK;
