-- Sequential database assertions; execution only after explicit E2B authorization.
-- Foundation supplies harness.assert_true and harness.expect_error.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT harness.expect_error('SELECT * FROM public.provider_solicitations','42501');
SELECT harness.expect_error('SELECT * FROM public.provider_solicitation_operations','42501');
SELECT harness.expect_error('SELECT * FROM public.provider_solicitation_events','42501');
SELECT harness.expect_error('SELECT public.read_provider_solicitations(''10000000-0000-4000-8000-000000000001'',''10000000-0000-4000-8000-000000000001'')','42501');
ROLLBACK;

-- The transaction is intentionally rolled back after all sequential assertions.
-- Commands run as service_role; the helper only builds synthetic arguments.
BEGIN;
CREATE TEMP TABLE e2a_results (name text PRIMARY KEY, result jsonb);
GRANT ALL ON e2a_results TO service_role;
SET LOCAL ROLE service_role;
INSERT INTO e2a_results
SELECT 'create', public.create_provider_solicitation(
  '10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000001',
  jsonb_build_object('provider_profile_id','30000000-0000-4000-8000-000000000001',
    'service_slug','cleaning_standard','service_label_snapshot','Ménage du logement','description','Test synthétique',
    'location',jsonb_build_object('kind','address','address','1 rue Test','city','Testville','postal_code','00000','country_code','FR'),
    'location_declaration',jsonb_build_object('city','Testville','address','1 rue Test'),
    'reservation_id',NULL,'desired_at',NULL,'location_label','1 rue Test','city','Testville','postal_code','00000','country_code','FR',
    'latitude',0,'longitude',0,'geocoded_at','2026-01-01T00:00:00Z','geocoding_source','synthetic',
    'provider_declaration', (SELECT jsonb_build_object('option',option,'availability_hours',availability_hours,'service_radius_km',service_radius_km,'latitude',latitude,'longitude',longitude) FROM public.profiles WHERE id='30000000-0000-4000-8000-000000000001')));
SELECT harness.assert_true((SELECT result->'result'->>'status'='sent' AND (result->>'replayed')::boolean=false FROM e2a_results WHERE name='create'),'creation sent');
INSERT INTO e2a_results SELECT 'read-owner',public.read_provider_solicitations('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',(SELECT (result->'result'->>'solicitation_id')::uuid FROM e2a_results WHERE name='create'));
INSERT INTO e2a_results SELECT 'read-provider',public.read_provider_solicitations('30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',(SELECT (result->'result'->>'solicitation_id')::uuid FROM e2a_results WHERE name='create'));
SELECT harness.assert_true((SELECT NOT ((result->'solicitation') ?| ARRAY['property_id','housing_id','reservation_id']) FROM e2a_results WHERE name='read-provider'),'provider projection');
SELECT harness.expect_error(format('SELECT public.read_provider_solicitations(%L,%L,%L)', '10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002',(SELECT result->'result'->>'solicitation_id' FROM e2a_results WHERE name='create')),'P0002');
-- Neither the owner nor another provider can respond in place of the recipient.
SELECT harness.expect_error(format('SELECT public.respond_provider_solicitation(%L,%L,%L,%L,%L,NULL,1)', '10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000004',(SELECT result->'result'->>'solicitation_id' FROM e2a_results WHERE name='create'),'interested'),'42501');
SELECT harness.expect_error(format('SELECT public.respond_provider_solicitation(%L,%L,%L,%L,%L,NULL,1)', '30000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000004',(SELECT result->'result'->>'solicitation_id' FROM e2a_results WHERE name='create'),'interested'),'P0002');
SELECT harness.expect_error(format('SELECT public.respond_provider_solicitation(%L,%L,%L,%L,%L,NULL,2)', '30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002',(SELECT result->'result'->>'solicitation_id' FROM e2a_results WHERE name='create'),'interested'),'40001');
INSERT INTO e2a_results SELECT 'response',public.respond_provider_solicitation('30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002',(SELECT (result->'result'->>'solicitation_id')::uuid FROM e2a_results WHERE name='create'),'interested','Test',1);
INSERT INTO e2a_results SELECT 'replay',public.respond_provider_solicitation('30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002',(SELECT (result->'result'->>'solicitation_id')::uuid FROM e2a_results WHERE name='create'),'interested','Test',1);
SELECT harness.assert_true((SELECT (result->>'replayed')::boolean FROM e2a_results WHERE name='replay') AND (SELECT result->'result' FROM e2a_results WHERE name='replay')=(SELECT result->'result' FROM e2a_results WHERE name='response'),'same key replay');
SELECT harness.assert_true((
  SELECT initial.result->>'operation_id' IS NOT NULL
    AND initial.result->>'operation_id' = replay.result->>'operation_id'
  FROM e2a_results initial CROSS JOIN e2a_results replay
  WHERE initial.name='response' AND replay.name='replay'
),'same operation receipt on replay');
SELECT harness.expect_error(format('SELECT public.respond_provider_solicitation(%L,%L,%L,%L,%L,NULL,1)', '30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002',(SELECT result->'result'->>'solicitation_id' FROM e2a_results WHERE name='create'),'declined'),'23505');
SELECT harness.expect_error(format('SELECT public.respond_provider_solicitation(%L,%L,%L,%L,%L,NULL,1)', '30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000003',(SELECT result->'result'->>'solicitation_id' FROM e2a_results WHERE name='create'),'declined'),'55000');
RESET ROLE;
UPDATE public.profiles SET status='suspended' WHERE id='10000000-0000-4000-8000-000000000001';
SET LOCAL ROLE service_role;
SELECT harness.expect_error('SELECT public.read_provider_solicitations(''10000000-0000-4000-8000-000000000001'',''10000000-0000-4000-8000-000000000001'')','42501');
SELECT harness.expect_error(format('SELECT public.respond_provider_solicitation(%L,%L,%L,%L,%L,%L,1)', '30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002',(SELECT result->'result'->>'solicitation_id' FROM e2a_results WHERE name='create'),'interested','Test'),'42501');
RESET ROLE;
UPDATE public.profiles SET status='active' WHERE id='10000000-0000-4000-8000-000000000001';
UPDATE public.profiles SET status='suspended' WHERE id='30000000-0000-4000-8000-000000000001';
SET LOCAL ROLE service_role;
SELECT harness.expect_error(format('SELECT public.respond_provider_solicitation(%L,%L,%L,%L,%L,%L,1)', '30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002',(SELECT result->'result'->>'solicitation_id' FROM e2a_results WHERE name='create'),'interested','Test'),'42501');
RESET ROLE;
SELECT harness.assert_true((SELECT count(*)=1 FROM public.provider_solicitations) AND (SELECT count(*)=2 FROM public.provider_solicitation_operations) AND (SELECT count(*)=2 FROM public.provider_solicitation_events),'one transition and no duplicate operations');
SET CONSTRAINTS ALL IMMEDIATE;
ROLLBACK;
SELECT harness.assert_true((SELECT count(*)=0 FROM public.provider_solicitations) AND (SELECT count(*)=0 FROM public.provider_solicitation_operations) AND (SELECT count(*)=0 FROM public.provider_solicitation_events),'rollback leaves no rows');

-- A server role can call the RPC, but actor and participant checks remain mandatory.
BEGIN;
SET LOCAL ROLE service_role;
SELECT harness.assert_true(jsonb_array_length(public.read_provider_solicitations('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001')->'items')=0,'owner empty list');
SELECT harness.assert_true(jsonb_array_length(public.read_provider_solicitations('30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001')->'items')=0,'provider empty list');
SELECT harness.expect_error('SELECT public.read_provider_solicitations(''10000000-0000-4000-8000-000000000001'',''10000000-0000-4000-8000-000000000002'')','42501');
ROLLBACK;
