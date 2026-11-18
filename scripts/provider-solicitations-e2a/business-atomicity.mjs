// Only for a newly created disposable harness database. No application RPC is modified.
export async function runBusinessAtomicity(sql, id) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) throw Error('Invalid solicitation ID');
  const snapshot = `SELECT jsonb_build_object('row',(SELECT to_jsonb(s) FROM public.provider_solicitations s WHERE id='${id}'),
 'operations',(SELECT coalesce(jsonb_agg(to_jsonb(o) ORDER BY o.id),'[]'::jsonb) FROM public.provider_solicitation_operations o WHERE solicitation_id='${id}'),
 'events',(SELECT coalesce(jsonb_agg(to_jsonb(e) ORDER BY e.id),'[]'::jsonb) FROM public.provider_solicitation_events e WHERE solicitation_id='${id}'));`;
  const before = (await sql(snapshot)).trim();
  const parsed = JSON.parse(before);
  if (parsed.row?.status !== 'sent' || parsed.row?.version !== 1 || parsed.row?.response_message !== null || parsed.operations?.length !== 1 || parsed.events?.length !== 1) throw Error('Unexpected initial business state');
  let fault = false;
  try {
    await sql(`BEGIN;
DO $$ BEGIN IF current_database() <> 'planetls_sec_auth_c1' OR to_regnamespace('harness') IS NULL THEN RAISE EXCEPTION 'isolated harness required'; END IF; END $$;
CREATE FUNCTION harness.e2f_business_fault() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$ BEGIN RAISE EXCEPTION 'E2F_AFTER_UPDATE' USING ERRCODE='P0E01'; END $$;
CREATE TRIGGER e2f_business_fault AFTER UPDATE ON public.provider_solicitations FOR EACH ROW WHEN (NEW.id = '${id}'::uuid) EXECUTE FUNCTION harness.e2f_business_fault();
SET LOCAL ROLE service_role;
SELECT public.respond_provider_solicitation('30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000012','${id}','interested','test',1);
COMMIT;`);
  } catch (error) {
    const details = String(error?.diagnostic?.stderr ?? error?.message);
    if (!details.includes('P0E01') || !details.includes('E2F_AFTER_UPDATE')) throw error;
    fault = true;
  }
  if (!fault) throw Error('Business fault was not triggered');
  const after = (await sql(snapshot)).trim();
  if (before !== after) throw Error('Business state changed after failed RPC');
  await sql("SELECT harness.assert_true(NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='e2f_business_fault' AND NOT tgisinternal) AND to_regprocedure('harness.e2f_business_fault()') IS NULL,'transactional instrumentation removed');");
}
