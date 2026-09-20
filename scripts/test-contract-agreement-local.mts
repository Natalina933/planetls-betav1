/** Runs only against a named, network-isolated disposable PostgreSQL container.
 * Reuses the previous lot's scoped prerequisite fixtures, not a full project reset.
 * node --experimental-strip-types scripts/test-contract-agreement-local.mts
 */
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { conditions } from "../src/tests/fixtures/contractDraftCases.mts";

const container = "planetls-contract-draft-test";
const inspected = spawnSync("docker", ["inspect", "--format", "{{.HostConfig.NetworkMode}}", container], { encoding: "utf8", windowsHide: true });
if (inspected.status !== 0 || inspected.stdout.trim() !== "none") throw new Error("Refusing writes outside isolated local container");
const previous = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/test-contract-drafts-local.mts"], { encoding: "utf8", windowsHide: true });
if (previous.status !== 0) throw new Error(previous.stderr + previous.stdout);
console.log(previous.stdout.trim());
function sql(database: string, input: string) {
  const result = spawnSync("docker", ["exec", "-i", container, "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", database], { input, encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || result.stdout);
  return result.stdout.trim();
}
function concurrent(database: string, statements: string): Promise<{ status: number | null; error: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", ["exec", "-i", container, "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", database], { windowsHide: true });
    let error = "";
    child.stdout.resume(); child.stderr.setEncoding("utf8").on("data", value => { error += value; });
    child.on("error", reject); child.on("close", status => resolve({ status, error })); child.stdin.end(statements);
  });
}
const read = (name: string) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
const initialMigration = read("supabase/migrations/20260920120000_collaboration_contract_drafts.sql");
const migration = read("supabase/migrations/20260920130000_contract_conditions_agreement.sql");
const rollback = read("supabase/rollbacks/20260920130000_contract_conditions_agreement.sql");
const owner = "11111111-1111-4111-8111-111111111111";
const concierge = "22222222-2222-4222-8222-222222222222";
const third = "33333333-3333-4333-8333-333333333333";
const collab = "44444444-4444-4444-8444-444444444444";
const otherCollab = "77777777-7777-4777-8777-777777777777";
const otherQuote = "88888888-8888-4888-8888-888888888888";
const json = (value: unknown) => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;
const version = (n: number, collaboration = collab) => `(select cv.id from services_contract_versions cv join services_contracts sc on sc.id=cv.contract_id where sc.collaboration_id='${collaboration}' and cv.version_number=${n})`;
const save = (actor: string, revision: number, doc: unknown, n: number | null) => `select public.save_collaboration_contract_draft('${collab}','${actor}',${revision},${json(doc)},${n === null ? "null" : version(n)})`;
const act = (actor: string, n: number, revision: number, action: string, reason: string | null = null) =>
  `select public.transition_collaboration_contract_version('${collab}','${actor}',${version(n)},${revision},'${action}',${reason === null ? "null" : literal(reason)})`;
const expectError = (command: string, state: string) => `select pg_temp.expect_error($command$${command}$command$, '${state}');`;
const helpers = `
create function pg_temp.assert_true(ok boolean, message text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'ASSERT: %', message; end if; end $$;
create function pg_temp.expect_error(command text, expected text) returns void language plpgsql as $$
begin
  begin execute command; exception when others then
    if sqlstate = expected then return; end if;
    raise exception 'Expected %, got %: %', expected, sqlstate, sqlerrm;
  end;
  raise exception 'Expected SQLSTATE %, command succeeded', expected;
end $$;
`;
const assertVersion = (n: number, predicate: string, label: string) => `select pg_temp.assert_true((select ${predicate} from services_contract_versions where id=${version(n)}), '${label}');`;

for (const suffix of ["fresh", "existing"]) {
  const database = `planetls_contract_draft_${suffix}`;
  sql(database, initialMigration);
  let savedBefore: string | null = null;
  if (suffix === "existing") {
    sql(database, `select public.save_collaboration_contract_draft('${collab}','${owner}',0,${json(conditions)});`);
    savedBefore = sql(database, "select to_jsonb(v)::text from services_contract_versions v;");
  }
  const legacyBefore = sql(database, "select coalesce(jsonb_agg(to_jsonb(sc)), '[]'::jsonb) from services_contracts sc where collaboration_id is null;");
  sql(database, migration);
  if (savedBefore) {
    const before = JSON.parse(savedBefore) as Record<string, unknown>;
    const after = JSON.parse(sql(database, "select to_jsonb(v)::text from services_contract_versions v;")) as Record<string, unknown>;
    for (const key of Object.keys(before)) if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) throw new Error(`Existing draft changed: ${key}`);
  } else sql(database, `${save(owner, 0, conditions, null)};`);
  // Empty negotiation history: rollback is safe and preserves the editable draft.
  sql(database, rollback);
  if (sql(database, "select count(*) from services_contract_versions;") !== "1") throw new Error("Rollback lost existing draft");
  sql(database, migration);
  const proposer = suffix === "fresh" ? owner : concierge;
  const other = proposer === owner ? concierge : owner;
  const changed = { ...conditions, duration: { ...conditions.duration, noticeDays: 31 } };
  sql(database, helpers + `
    ${save(owner, 1, changed, 1)};
    ${assertVersion(1, "revision = 2 and status='draft'", "draft remains editable")}
    ${expectError(act(proposer, 1, 1, "propose"), "40001")}
    ${expectError(act(third, 1, 2, "propose"), "42501")}
    ${act(proposer, 1, 2, "propose")};
    create temp table frozen as select * from services_contract_versions where id=${version(1)};
    ${act(proposer, 1, 2, "propose")};
    ${assertVersion(1, `status='proposed' and proposed_by='${proposer}' and proposed_at is not null and revision=2 and owner_accepted_at is null and concierge_accepted_at is null`, "proposal is not acceptance")}
    select pg_temp.assert_true((select to_jsonb(v)=to_jsonb(f) from services_contract_versions v join frozen f using(id)), 'double propose idempotent');
    set role service_role;
    ${expectError(`update services_contract_versions set conditions=${json(conditions)} where id=${version(1)}`, "42501")}
    ${expectError(`update services_contract_versions set revision=99 where id=${version(1)}`, "42501")}
    ${expectError(`delete from services_contract_versions where id=${version(1)}`, "42501")}
    ${expectError(save(owner, 2, conditions, 1), "40001")}
    ${expectError(`select public.save_collaboration_contract_draft('${collab}','${owner}',0,${json(conditions)})`, "40001")}
    reset role;
    insert into housing values (43, '{"owner_profile_id":"${owner}"}');
    insert into quotes values('${otherQuote}','${owner}','${concierge}','accepted');
    insert into housing_collaborations(id,housing_id,owner_profile_id,concierge_profile_id,quote_id,status)
      values('${otherCollab}',43,'${owner}','${concierge}','${otherQuote}','pending_handover');
    select public.save_collaboration_contract_draft('${otherCollab}','${owner}',0,${json(conditions)},null);
    ${expectError(`select public.transition_collaboration_contract_version('${collab}','${owner}',${version(1, otherCollab)},1,'accept',null)`, "40001")}
    ${expectError(act(owner, 1, 1, "accept"), "40001")}
    ${act(owner, 1, 2, "accept")};
    ${assertVersion(1, `status='proposed' and owner_accepted_by='${owner}' and owner_accepted_at is not null and concierge_accepted_at is null`, "owner accepts only for self")}
    create temp table owner_agreement as select owner_accepted_at from services_contract_versions where id=${version(1)};
    ${act(owner, 1, 2, "accept")};
    select pg_temp.assert_true((select v.owner_accepted_at = a.owner_accepted_at from services_contract_versions v cross join owner_agreement a where v.id=${version(1)}), 'double accept idempotent');
    ${expectError(act(proposer, 1, 2, "request_changes", "Change"), "42501")}
    ${act(other, 1, 2, "request_changes", "Revoir le préavis")};
    ${act(other, 1, 2, "request_changes", "Revoir le préavis")};
    ${assertVersion(1, `status='superseded' and change_requested_by='${other}' and change_requested_at is not null and change_request_reason='Revoir le préavis'`, "request traced")}
    select pg_temp.assert_true((select v.conditions=f.conditions and v.revision=f.revision and v.proposed_at=f.proposed_at from services_contract_versions v join frozen f using(id)), 'old proposal preserved');
    ${assertVersion(2, `status='draft' and revision=1 and previous_version_id=${version(1)} and owner_accepted_at is null and concierge_accepted_at is null`, "new draft without inherited agreements")}
    select pg_temp.assert_true((select count(*)=2 from services_contract_versions where contract_id=(select contract_id from services_contract_versions where id=${version(1)})), 'one replacement on retry');
    ${expectError(act(owner, 1, 2, "accept"), "40001")}
    ${expectError(save(owner, 2, conditions, 1), "40001")}
    ${expectError(`select public.save_collaboration_contract_draft('${collab}','${owner}',1,${json(conditions)})`, "40001")}
    ${save(concierge, 1, conditions, 2)};
    ${assertVersion(2, "revision=2 and status='draft'", "replacement editable")}
    ${act(other, 2, 2, "propose")};
    set role authenticated;
    set request.jwt.claim.sub='${owner}';
    select pg_temp.assert_true((select count(*)=3 from services_contract_versions), 'owner reads proposal history');
    ${expectError(act(owner, 2, 2, "accept"), "42501")}
    ${expectError("update services_contract_versions set status='ready_to_sign'", "42501")}
    set request.jwt.claim.sub='${concierge}';
    select pg_temp.assert_true((select count(*)=3 from services_contract_versions), 'concierge reads history');
    set request.jwt.claim.sub='${third}';
    select pg_temp.assert_true((select count(*)=0 from services_contract_versions), 'third reads nothing');
    reset role;
  `);
  // Real concurrent acceptances, serialized by the collaboration row lock.
  const accepted = await Promise.all([owner, concierge].map(actor => concurrent(database, `set role service_role; ${act(actor, 2, 2, "accept")};`)));
  if (accepted.some(result => result.status !== 0)) throw new Error(JSON.stringify(accepted));
  sql(database, helpers + `
    ${assertVersion(2, `status='ready_to_sign' and owner_accepted_by='${owner}' and concierge_accepted_by='${concierge}'`, "both explicit agreements required")}
    ${act(owner, 2, 2, "accept")}; ${act(concierge, 2, 2, "accept")};
    ${expectError(act(proposer, 2, 2, "request_changes", "Too late"), "40001")}
    select pg_temp.assert_true((select bool_and(status='pending_handover') from housing_collaborations), 'no activation');
    select pg_temp.assert_true((select count(*)=0 from missions), 'no missions');
  `);
  // One winner when proposing races against editing the exact same revision.
  const otherId = version(1, otherCollab);
  const race = await Promise.all([
    concurrent(database, `select public.transition_collaboration_contract_version('${otherCollab}','${owner}',${otherId},1,'propose',null);`),
    concurrent(database, `select public.save_collaboration_contract_draft('${otherCollab}','${concierge}',1,${json(changed)},${otherId});`),
  ]);
  if (race.filter(result => result.status === 0).length !== 1 || !race.some(result => /changed|not a draft/.test(result.error))) throw new Error(`edit/propose race: ${JSON.stringify(race)}`);
  sql(database, `select public.transition_collaboration_contract_version('${otherCollab}','${owner}',${otherId},(select revision from services_contract_versions where id=${otherId}),'propose',null);`);
  const otherRevision = Number(sql(database, `select revision from services_contract_versions where id=${otherId};`));
  sql(database, `select public.transition_collaboration_contract_version('${otherCollab}','${owner}',${otherId},${otherRevision},'accept',null);`);
  // Other participant's acceptance versus request: exactly one transition wins.
  const responseRace = await Promise.all(["accept", "request_changes"].map(action => concurrent(database,
    `select public.transition_collaboration_contract_version('${otherCollab}','${concierge}',${otherId},${otherRevision},'${action}',${action === "request_changes" ? "'Revoir le tarif'" : "null"});`)));
  if (responseRace.filter(result => result.status === 0).length !== 1) throw new Error(`accept/change race: ${JSON.stringify(responseRace)}`);
  if (sql(database, "select coalesce(jsonb_agg(to_jsonb(sc)), '[]'::jsonb) from services_contracts sc where collaboration_id is null;") !== legacyBefore) throw new Error("Legacy contracts changed");
  let refused = false;
  try { sql(database, rollback); } catch (error) { if (String(error).includes("Rollback refused")) refused = true; else throw error; }
  if (!refused) throw new Error("Rollback must preserve negotiation history");
  console.log(`${suffix}: preserved drafts/legacy, propose/edit/explicit agreements/history/RLS, all 3 concurrent races, guarded rollback PASS`);
}
