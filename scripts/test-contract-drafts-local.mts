/** Isolated PostgreSQL integration checks. Never reads .env or contacts remote Supabase.
 * Run: node --experimental-strip-types scripts/test-contract-drafts-local.mts
 * Requires the dedicated --network none planetls-contract-draft-test container.
 * Prerequisite schema is reconstructed from checked-in types and the actual RLS /
 * housing_collaborations migration: this is NOT a full-project migration reset.
 */
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { conditions, invalidConditions } from "../src/tests/fixtures/contractDraftCases.mts";

const container = "planetls-contract-draft-test";
function docker(args: string[], input?: string) {
  const result = spawnSync("docker", args, { input, encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error(`${args.slice(0, 3).join(" ")}: ${result.stderr || result.error || result.stdout}`);
  return result.stdout;
}
if (docker(["inspect", "--format", "{{.HostConfig.NetworkMode}}", container]).trim() !== "none") {
  throw new Error("Refusing database writes: test container must have network disabled");
}
const sql = (database: string, input: string) => docker(["exec", "-i", container, "psql", "-X", "-q", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", database], input);
function concurrentSql(database: string, input: string): Promise<{ status: number | null; error: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", ["exec", "-i", container, "psql", "-X", "-q", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", database], { windowsHide: true });
    let error = "";
    child.stderr.setEncoding("utf8").on("data", chunk => { error += chunk; });
    child.stdout.resume();
    child.on("error", reject);
    child.on("close", status => resolve({ status, error }));
    child.stdin.end(input);
  });
}
const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/20260920120000_collaboration_contract_drafts.sql");
const collaborationMigration = read("supabase/migrations/20260621000100_housing_collaborations.sql");
const legacyRlsSource = read("supabase/migrations/20260404123000_resolve_remaining_security_advisors.sql");
const legacyRls = legacyRlsSource.slice(legacyRlsSource.indexOf("ALTER TABLE IF EXISTS public.services_contracts"), legacyRlsSource.indexOf("-- Internal rate limiting table"));
const owner = "11111111-1111-4111-8111-111111111111";
const concierge = "22222222-2222-4222-8222-222222222222";
const third = "33333333-3333-4333-8333-333333333333";
const collab = "44444444-4444-4444-8444-444444444444";
const quote = "55555555-5555-4555-8555-555555555555";
const literal = (value: unknown) => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
const call = (actor: string, revision: number, doc: unknown) => `select public.save_collaboration_contract_draft('${collab}', '${actor}', ${revision}, ${literal(doc)})`;
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
const baseline = `
create schema auth;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
grant usage on schema auth, public to authenticated, service_role;
create table public.profiles(id uuid primary key);
create table public.housing(id bigint primary key, proprietaire jsonb);
create table public.service_requests(id uuid primary key);
create table public.quotes(id uuid primary key, owner_profile_id uuid, concierge_profile_id uuid, status text);
create table public.missions(id uuid primary key);
create table public.services_contracts(id uuid primary key default gen_random_uuid(), profile_id uuid references profiles(id),
  title text not null, start_date date not null, end_date date, status text, notes text, created_at timestamptz default now());
${legacyRls}
${collaborationMigration}
grant all on all tables in schema public to authenticated, service_role;
insert into profiles values ('${owner}'), ('${concierge}'), ('${third}');
insert into housing values (42, '{"owner_profile_id":"${owner}"}');
insert into quotes values ('${quote}', '${owner}', '${concierge}', 'accepted');
insert into housing_collaborations(id,housing_id,owner_profile_id,concierge_profile_id,quote_id,status)
 values('${collab}',42,'${owner}','${concierge}','${quote}','pending_handover');
`;

for (const suffix of ["fresh", "existing"]) {
  const database = `planetls_contract_draft_${suffix}`;
  sql("postgres", `drop database if exists ${database}; create database ${database};`);
  sql(database, baseline + (suffix === "existing" ? `
    insert into services_contracts(profile_id,title,start_date,status,notes)
    values('${owner}','Historique','2025-01-01','actif','À préserver');
  ` : ""));
  sql(database, migration);
  const validFixed = { ...conditions, mode: "FULL_MANAGEMENT", duration: { ...conditions.duration, kind: "DETERMINEE", endsOn: "2026-12-31" } };
  const changed = { ...conditions, duration: { ...conditions.duration, noticeDays: 45 } };
  const invalidChecks = invalidConditions().map(([label, doc]) => `select pg_temp.assert_true(not public.valid_collaboration_draft_conditions(${literal(doc)}), '${label}');`).join("\n");
  sql(database, helpers + `
    ${invalidChecks}
    select pg_temp.assert_true(public.valid_collaboration_draft_conditions(${literal(validFixed)}), 'fixed duration');
    set role service_role;
    ${call(owner, 0, conditions)};
    ${call(owner, 0, conditions)};
    reset role;
    select pg_temp.assert_true((select count(*) = 1 from services_contract_versions), 'one draft on retry');
    select pg_temp.assert_true((select count(*) = 1 from services_contracts where collaboration_id is not null), 'one envelope');
    select pg_temp.assert_true((select revision = 1 and status = 'draft' from services_contract_versions), 'initial revision');
    ${expectError(call(third, 1, changed), "42501")}
    ${expectError(call(owner, 0, changed), "40001")}
    ${expectError(call(owner, 1, { ...conditions, mode: "BAD" }), "23514")}
    ${call(concierge, 1, changed)};
    ${call(concierge, 1, changed)};
    ${expectError(call(owner, 1, conditions), "40001")}
    select pg_temp.assert_true((select revision = 2 and updated_by = '${concierge}' from services_contract_versions), 'concierge update');
    select pg_temp.assert_true((select status = 'pending_handover' from housing_collaborations), 'no activation');
    select pg_temp.assert_true((select count(*) = 0 from missions), 'no mission');
    set role authenticated;
    set request.jwt.claim.sub = '${owner}';
    select pg_temp.assert_true((select count(*) = 1 from services_contract_versions), 'owner reads');
    select pg_temp.assert_true((select count(*) = 1 from services_contracts where collaboration_id is not null), 'owner envelope');
    ${expectError(call(owner, 2, conditions), "42501")}
    ${expectError("update services_contract_versions set revision = 99", "42501")}
    with changed as (update services_contracts set status='actif' where collaboration_id is not null returning id)
      select pg_temp.assert_true((select count(*) = 0 from changed), 'legacy update denied');
    with removed as (delete from services_contracts where collaboration_id is not null returning id)
      select pg_temp.assert_true((select count(*) = 0 from removed), 'legacy delete denied');
    ${expectError(`insert into services_contracts(collaboration_id,profile_id,title,start_date) values('${collab}','${owner}','Bypass',current_date)`, "42501")}
    set request.jwt.claim.sub = '${concierge}';
    select pg_temp.assert_true((select count(*) = 1 from services_contract_versions), 'concierge reads');
    set request.jwt.claim.sub = '${third}';
    select pg_temp.assert_true((select count(*) = 0 from services_contract_versions), 'third reads nothing');
    select pg_temp.assert_true((select count(*) = 0 from services_contracts where collaboration_id is not null), 'third envelope denied');
    reset role;
    update housing_collaborations set status='paused' where id='${collab}';
    ${expectError(call(owner, 2, conditions), "40001")}
    update housing_collaborations set status='pending_handover' where id='${collab}';
    select pg_temp.assert_true((select count(*) = ${suffix === "existing" ? 1 : 0} from services_contracts where collaboration_id is null), 'legacy count');
    ${suffix === "existing" ? `
      select pg_temp.assert_true((select notes = 'À préserver' and status = 'actif' from services_contracts where collaboration_id is null), 'legacy data preserved');
      set role authenticated;
      set request.jwt.claim.sub = '${owner}';
      update services_contracts set notes='Historique modifiable' where collaboration_id is null;
      select pg_temp.assert_true((select notes = 'Historique modifiable' from services_contracts where collaboration_id is null), 'legacy still writable');
      reset role;
    ` : ""}
  `);
  console.log(`${suffix}: migration, ${invalidConditions().length} invalid cases, creation/read/edit/retry/conflict/RLS/legacy/no activation PASS`);
  const concurrent = await Promise.all([60, 90].map(noticeDays => concurrentSql(database,
    `set role service_role; ${call(owner, 2, { ...conditions, duration: { ...conditions.duration, noticeDays } })};`)));
  if (concurrent.filter(result => result.status === 0).length !== 1
    || !concurrent.some(result => result.error.includes("Draft changed; reload"))) {
    throw new Error(`Concurrent edits did not produce one success and one conflict: ${JSON.stringify(concurrent)}`);
  }
  sql(database, helpers + "select pg_temp.assert_true((select revision = 3 from services_contract_versions), 'one concurrent edit committed');");
  console.log(`${suffix}: concurrent transactions (one success, one conflict) PASS`);
  const rollback = read("supabase/rollbacks/20260920120000_collaboration_contract_drafts.sql");
  let refused = false;
  try { sql(database, rollback); } catch (error) {
    if (String(error).includes("Rollback refused")) refused = true; else throw error;
  }
  if (!refused) throw new Error("Rollback must refuse nonempty drafts");
  // Fixture data only, in the named isolated database. Production drafts are never removed.
  sql(database, "delete from services_contract_versions; delete from services_contracts where collaboration_id is not null;");
  sql(database, rollback);
  sql(database, helpers + `select pg_temp.assert_true((select count(*) = ${suffix === "existing" ? 1 : 0} from services_contracts), 'rollback preserves legacy');`);
  console.log(`${suffix}: guarded rollback + legacy preservation PASS`);
}
