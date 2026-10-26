// SQL recipes exercise constraints/RPC/RLS; they do NOT substitute for REST
// finalization, HTTP search, application pricing or notification delivery tests.
export const ids = {
  owner: '10000000-0000-4000-8000-000000000001', otherOwner: '10000000-0000-4000-8000-000000000002',
  concierge: '20000000-0000-4000-8000-000000000001', competitor: '20000000-0000-4000-8000-000000000002',
  outsider: '20000000-0000-4000-8000-000000000003',
  request: '30000000-0000-4000-8000-000000000001',
  continuous: '60000000-0000-4000-8000-000000000002',
};
export function session(role, actor, sql, commit = false) {
  if (!['authenticated','anon','service_role'].includes(role) || !/^[a-f0-9-]{36}$/.test(actor)) throw new Error('Invalid synthetic identity');
  return `BEGIN; SET LOCAL ROLE ${role};
SELECT set_config('request.jwt.claim.sub','${actor}',true);
SELECT set_config('request.jwt.claim.role','${role}',true);
SELECT harness.assert_true(current_user='${role}','actual SQL role');
${sql}
${commit ? 'COMMIT' : 'ROLLBACK'};`;
}
export const award = quote => `SELECT public.award_service_request_quote('50000000-0000-4000-8000-00000000000${quote}','${ids.owner}');`;
export const interventions = `
INSERT INTO public.missions(owner_profile_id,concierge_profile_id,title,service_id,status,metadata)
SELECT r.owner_profile_id,r.selected_concierge_profile_id,s.label,s.id,'to_schedule',
 jsonb_build_object('quote_operation_key','04b-award-'||s.slug,'operational_service_slug',s.slug,'fixture','04b')
FROM public.service_requests r CROSS JOIN (VALUES
 (94001,'Check-in','guest_checkin'),(94002,'Check-out','guest_checkout'),
 (2,'Ménage entre deux séjours','cleaning_turnover'),(9,'Changement de linge','linen_change')) s(id,label,slug)
WHERE r.id='${ids.request}' AND r.selected_concierge_profile_id IS NOT NULL
ON CONFLICT DO NOTHING;`;
const billing = `
INSERT INTO public.invoices(invoice_number,quote_id,owner_profile_id,concierge_profile_id,status,metadata)
SELECT 'DEMO-04B-AWARD',q.id,q.owner_profile_id,q.concierge_profile_id,'draft','{"source":"quote_acceptance","fixture":"04b"}'
FROM public.quotes q WHERE q.service_request_id='${ids.request}' AND q.status='accepted' ON CONFLICT DO NOTHING;
INSERT INTO public.invoice_items(invoice_id,service_id,label,quantity,unit_price,line_total,metadata)
SELECT i.id,item.service_id,item.label,item.quantity,item.unit_price,item.line_total,
 jsonb_build_object('source_quote_item_id',item.id)
FROM public.invoices i JOIN public.quote_items item ON item.quote_id=i.quote_id
WHERE i.invoice_number='DEMO-04B-AWARD' ON CONFLICT DO NOTHING;`;
export const termination = `
UPDATE public.housing_collaborations SET scope=scope || jsonb_build_object('termination_request',
 jsonb_build_object('schema_version',1,'state','notice','requested_by','${ids.otherOwner}',
 'requested_at',to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'notice_days',30,'notice_source','default','date_convention','UTC_calendar_date_plus_notice_days',
 'effective_at',to_char((date_trunc('day',clock_timestamp() AT TIME ZONE 'UTC') + interval '30 days'),'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'effective_date',((clock_timestamp() AT TIME ZONE 'UTC')::date+30)::text)),
 ends_on=(clock_timestamp() AT TIME ZONE 'UTC')::date+30
WHERE id='${ids.continuous}' AND scope->'termination_request' IS NULL;`;
const continuousInsert = key => `INSERT INTO public.missions(owner_profile_id,concierge_profile_id,title,status,metadata)
VALUES('${ids.otherOwner}','${ids.outsider}','Intervention continue démo','to_schedule',
jsonb_build_object('collaboration_id','${ids.continuous}','property_housing_id',94002,'quote_operation_key','${key}')) ON CONFLICT DO NOTHING;`;

export async function runScenarios({ sql, parallel, log, read }) {
  const client = (actor, text) => sql(session('authenticated', actor, text), 'harness_client');
  const server = text => sql(session('service_role', ids.owner, text, true), 'harness_server');
  log({ scenario: 'C', phase: 'RLS non-owner identities; never postgres for actor assertions' });
  client(ids.owner, `SELECT harness.assert_true((SELECT count(*)=1 FROM public.service_requests WHERE id='${ids.request}'),'owner sees request');`);
  client(ids.concierge, `SELECT harness.assert_true((SELECT count(*)=1 FROM public.service_requests WHERE id='${ids.request}'),'invited concierge sees request');`);
  client(ids.outsider, `SELECT harness.assert_true((SELECT count(*)=0 FROM public.service_requests WHERE id='${ids.request}'),'third concierge excluded');`);
  client(ids.otherOwner, `SELECT harness.assert_true((SELECT count(*)=0 FROM public.service_requests WHERE id='${ids.request}'),'other owner excluded');`);
  client(ids.competitor, `WITH changed AS (UPDATE public.quotes SET notes='forbidden' WHERE id='50000000-0000-4000-8000-000000000001' RETURNING id)
    SELECT harness.assert_true(count(*)=0,'competitor quote mutation denied') FROM changed;`);
  client(ids.owner, `SELECT harness.expect_error($q$${award(1)}$q$,'42501');`);
  client(ids.outsider, `SELECT harness.assert_true((SELECT count(*)=0 FROM public.invoices WHERE invoice_number='DEMO-04B-HISTORY'),'foreign invoice excluded');`);
  client(ids.owner, `SELECT harness.assert_true((SELECT count(*)=1 FROM public.invoices WHERE invoice_number='DEMO-04B-HISTORY'),'owner invoice visible');`);
  client(ids.concierge, `SELECT harness.expect_error($q$INSERT INTO public.missions(concierge_profile_id,title) VALUES('${ids.outsider}','forbidden')$q$,'42501');`);
  client(ids.otherOwner, `SELECT set_config('request.jwt.claim.role','service_role',true);
    SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
    SELECT harness.expect_error($q$UPDATE public.profiles SET role='admin' WHERE id='${ids.otherOwner}'$q$,'42501');
    SELECT harness.expect_error($q$UPDATE public.profiles SET status='suspended' WHERE id='${ids.otherOwner}'$q$,'42501');
    SELECT harness.expect_error($q$UPDATE public.housing_collaborations SET scope=scope||'{"termination_request":{"schema_version":1}}'::jsonb WHERE id='${ids.continuous}'$q$,'42501');`);
  sql(session('anon',ids.owner, `SELECT harness.assert_true((SELECT count(*)=0 FROM public.service_requests),'anonymous request access denied');
    SELECT harness.expect_error($q$SELECT public.concierge_has_request_invitation('${ids.request}')$q$,'42501');`), 'harness_client');
  sql('ALTER TABLE public.service_requests FORCE ROW LEVEL SECURITY; ALTER TABLE public.service_request_recipients FORCE ROW LEVEL SECURITY;');
  client(ids.concierge, `SELECT harness.assert_true(public.concierge_has_request_invitation('${ids.request}'),'own invitation helper');
    SELECT harness.assert_true((SELECT count(*)=1 FROM public.service_requests WHERE id='${ids.request}'),'forced RLS no recursive lookup');
    SELECT harness.assert_true((SELECT count(*)=1 FROM public.service_request_recipients),'only own recipient');`);
  server(`SELECT harness.assert_true((SELECT count(*)=2 FROM public.service_requests),'service role separate access');`);

  log({ scenario: 'D', phase: 'two independent psql processes per race; record backend PIDs; inspect overlap in 04B' });
  const race = async (name, first, second, expectedSuccesses = 2) => {
    const wrap = text => session('service_role',ids.owner, `SELECT pg_backend_pid(); SELECT pg_sleep(0.5); ${text}`,true);
    const results = await Promise.allSettled([parallel(wrap(first)),parallel(wrap(second))]);
    log({ scenario: 'D', race: name, results: results.map(result => result.status === 'fulfilled'
      ? { status: result.status, output: result.value } : { status: result.status, error: result.reason.message }) });
    if (results.filter(result => result.status === 'fulfilled').length !== expectedSuccesses) throw new Error(`Unexpected race result: ${name}`);
    for (const result of results) if (result.status === 'rejected' && !/40001/.test(result.reason.message)) throw result.reason;
  };
  await race('unique-award', award(1), award(2), 1);
  sql(`SELECT harness.assert_true((SELECT count(*)=1 FROM public.quotes WHERE service_request_id='${ids.request}' AND status='accepted'),'one quote winner');`);
  log({ scenario: 'A', phase: 'SQL operational recipe, not execution of acceptedQuoteWorkflow.ts' });
  await race('repeated-finalization-recipe',interventions,interventions);
  server(billing); server(billing);
  sql(`SELECT harness.assert_true((SELECT count(*)=4 FROM public.missions WHERE metadata->>'quote_operation_key' LIKE '04b-award-%'),'four distinct interventions');
    SELECT harness.assert_true((SELECT count(*)=4 FROM public.invoice_items i JOIN public.invoices inv ON inv.id=i.invoice_id WHERE inv.invoice_number='DEMO-04B-AWARD'),'four invoice lines on retry');`);
  server(`SELECT public.award_service_request_quote((SELECT id FROM public.quotes WHERE service_request_id='${ids.request}' AND status='accepted'),'${ids.owner}');`);
  server(`SELECT public.award_service_request_quote('50000000-0000-4000-8000-000000000003','${ids.otherOwner}');`);
  await race('continuous-intervention-key',continuousInsert('04b-continuous-race'),continuousInsert('04b-continuous-race'));
  await race('immutable-notice',termination,termination);
  server(continuousInsert('04b-during-notice'));
  sql(`SELECT harness.assert_true((SELECT scope->'termination_request'->>'notice_days'='30' FROM public.housing_collaborations WHERE id='${ids.continuous}'),'notice retained');
    SELECT harness.expect_error($q$UPDATE public.housing_collaborations SET ends_on=ends_on+1 WHERE id='${ids.continuous}'$q$,'23514');`);
  sql(read('scripts/concierge-04b/expired.sql'));

  log({ scenario: 'E', phase: 'controlled SQL failures, committed step then retry; not HTTP fault injection' });
  server(`SELECT harness.expect_error($q$${continuousInsert('04b-rollback-key')} SELECT 1/0;$q$,'22012');`);
  sql("SELECT harness.assert_true((SELECT count(*)=0 FROM public.missions WHERE metadata->>'quote_operation_key'='04b-rollback-key'),'failed subtransaction rolled back');");
  // Commit an operational step, interrupt before the next step, then replay both.
  server(continuousInsert('04b-partial-step'));
  server("SELECT harness.expect_error('SELECT 1/0','22012');");
  server(continuousInsert('04b-partial-step')); server(billing);
  sql("SELECT harness.assert_true((SELECT count(*)=1 FROM public.missions WHERE metadata->>'quote_operation_key'='04b-partial-step'),'committed step not duplicated on retry');");
  sql("SELECT harness.assert_true((SELECT count(*)=1 FROM public.invoices WHERE invoice_number='DEMO-04B-HISTORY'),'historical invoice retained');");
}
