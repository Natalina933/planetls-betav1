import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { VALID_MISSION_STATUSES } from "../app/lib/missionStatus.ts";

// Source checks only: these do not parse/execute PostgreSQL or prove RLS/locks.
const read = (file: string) => readFileSync(path.resolve(file), "utf8");
const migrationFile = "supabase/migrations/20261026120000_concierge_static_compatibility.sql";
const migration = read(migrationFile);
const proposal = (name: string) => read(`docs/sql-proposals/${name}.sql`);
const strings = (text: string) => [...text.matchAll(/'([^']+)'/g)].map((match) => match[1]);
const checkValues = (sql: string) => {
  const body = sql.match(/CHECK\s*\(event_type IN\s*\(([\s\S]*?)\)\)/i)?.[1];
  assert.ok(body, "event CHECK must be explicitly inventoried");
  return strings(body);
};
const allowed = new Set(checkValues(migration));
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : file.endsWith(".ts") ? [file] : [];
  });
}
function visit(node: ts.Node, callback: (node: ts.Node) => void) {
  callback(node);
  node.forEachChild((child) => visit(child, callback));
}
function branchValues(expression: ts.Expression): string[] {
  if (ts.isStringLiteral(expression)) return [expression.text];
  if (ts.isConditionalExpression(expression)) {
    return [...branchValues(expression.whenTrue), ...branchValues(expression.whenFalse)];
  }
  assert.fail(`Uninventoried event expression: ${expression.getText()}`);
}
function emittedEvents(): Set<string> {
  const emitted = new Set<string>();
  let writes = 0;
  for (const file of files("src/app/api")) {
    const source = read(file);
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    visit(ast, (node) => {
      if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)
        || !["insert", "upsert"].includes(node.expression.name.text)) return;
      const from = node.expression.expression;
      if (!ts.isCallExpression(from) || !ts.isPropertyAccessExpression(from.expression)
        || from.expression.name.text !== "from"
        || from.arguments[0]?.getText(ast) !== '"mission_events"') return;
      writes++;
      const payload = node.arguments[0];
      assert.ok(payload && ts.isObjectLiteralExpression(payload), `Inventory new writer: ${file}`);
      const field = payload.properties.find((item) => ts.isPropertyAssignment(item)
        && item.name.getText(ast) === "event_type");
      assert.ok(field && ts.isPropertyAssignment(field), file);
      const value = field.initializer;
      const add = (values: string[]) => values.forEach((event) => emitted.add(event));
      if (ts.isStringLiteral(value) || ts.isConditionalExpression(value)) add(branchValues(value));
      else if (value.getText(ast) === "eventType" && file.replaceAll("\\", "/").endsWith("missions/[id]/route.ts")) {
        assert.match(source, /eventType = requestedStatus === "accepted" \? "accepted" : requestedStatus === "in_progress" \? "started" : requestedStatus/);
        add(VALID_MISSION_STATUSES.map((status) => status === "in_progress" ? "started" : status));
        visit(ast, (candidate) => {
          if (ts.isBinaryExpression(candidate) && candidate.left.getText(ast) === "eventType"
            && ts.isStringLiteral(candidate.right)) add([candidate.right.text]);
        });
      } else if (value.getText(ast) === "missionEventType") {
        let found = false;
        visit(ast, (candidate) => {
          if (ts.isVariableDeclaration(candidate) && candidate.name.getText(ast) === "missionEventType" && candidate.initializer) {
            add(branchValues(candidate.initializer)); found = true;
          }
        });
        assert.ok(found, file);
      } else if (value.getText(ast) === "input.eventType" || ts.isTemplateExpression(value)) {
        const isStay = value.getText(ast) === '`traveler_stay_${actionPatch.action}`';
        assert.ok(isStay || (value.getText(ast) === "input.eventType"
          && file.replaceAll("\\", "/").endsWith("concierge/reservations/[id]/route.ts")), file);
        const actions: string[] = [];
        visit(ast, (candidate) => {
          if (ts.isBinaryExpression(candidate) && candidate.left.getText(ast) === "action"
            && candidate.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken
            && ts.isStringLiteral(candidate.right)) actions.push(candidate.right.text);
        });
        assert.ok(actions.length > 0);
        add(actions.map((action) => `${isStay ? "traveler_stay" : "reservation"}_${action}`));
      } else assert.fail(`Inventory new dynamic writer: ${file}: ${value.getText(ast)}`);
    });
  }
  assert.ok(writes >= 12, "Mission event writer discovery must not silently disappear");
  return emitted;
}

test("event CHECK preserves history and covers exactly historical/current emissions", () => {
  const historical = checkValues(read("supabase/migrations/20260222120000_missions_core.sql"));
  const expected = new Set([...historical, ...emittedEvents()]);
  assert.deepEqual([...allowed].sort(), [...expected].sort());
  assert.ok(allowed.has("quote_accepted"));
  assert.ok([...allowed].every((event) => event.length <= 40));
});

test("migration chain has no overlooked later event CHECK definition", () => {
  const definitions = readdirSync("supabase/migrations").sort().filter((file) => {
    const sql = read(`supabase/migrations/${file}`);
    return /(?:CREATE TABLE IF NOT EXISTS|ALTER TABLE) public\.mission_events\b/i.test(sql)
      && /CHECK\s*\(event_type IN/i.test(sql);
  });
  assert.deepEqual(definitions, ["20260222120000_missions_core.sql", path.basename(migrationFile)]);
});

test("status widening targets exactly demonstrated columns without resetting data/default/nullability", () => {
  assert.equal("information_requested".length, 21);
  assert.equal("awaiting_owner_validation".length, 25);
  assert.deepEqual([...migration.matchAll(/\('(service_requests|service_request_recipients|missions)', (\d+)\)/g)]
    .map((match) => [match[1], Number(match[2])]),
  [["service_requests", 21], ["service_request_recipients", 21], ["missions", 25]]);
  assert.match(migration, /actual_typmod - 4 < target.required_length/);
  assert.match(migration, /typtype = 'e'/);
  const executable = migration.replace(/--[^\n]*/g, "");
  assert.doesNotMatch(executable, /DROP DEFAULT|SET DEFAULT|DROP NOT NULL|SET NOT NULL|\bUPDATE\b|\bDELETE\b|\bTRUNCATE\b/i);
});

test("RLS proposal removes direct request-to-recipient policy edge with a bounded helper", () => {
  const sql = proposal("concierge-04a-request-rls");
  const policy = sql.slice(sql.indexOf("CREATE POLICY"), sql.indexOf("COMMIT;"));
  assert.doesNotMatch(policy, /FROM public.service_request_recipients/);
  assert.match(policy, /auth.uid\(\) = owner_profile_id/);
  assert.match(policy, /auth.uid\(\) = selected_concierge_profile_id/);
  assert.match(policy, /concierge_has_request_invitation\(id\)/);
  assert.match(sql, /recipient.concierge_profile_id = auth.uid\(\)/);
  assert.match(sql, /GRANT SELECT \(service_request_id, concierge_profile_id\)/);
  assert.match(sql, /OWNER TO concierge_request_rls_reader/);
  assert.match(sql, /REVOKE ALL ON FUNCTION[^;]+FROM PUBLIC, anon/);
  assert.match(sql, /SET search_path = pg_catalog SET row_security = off/);
  assert.doesNotMatch(sql, /GRANT\s+(?:UPDATE|INSERT|DELETE|ALL)\b/i);
});

test("03C uses executor identity and rejects conflicting collaboration sources before locking", () => {
  const sql = proposal("concierge-03c-termination-integrity");
  assert.doesNotMatch(sql, /current_setting\(/);
  assert.match(sql, /current_user NOT IN \('service_role', 'postgres', 'supabase_admin'\)/);
  assert.ok(sql.indexOf("Conflicting mission and stay collaborations") < sql.indexOf("FOR NO KEY UPDATE"));
  assert.ok(sql.indexOf("FOR NO KEY UPDATE") < sql.indexOf("effective_at <= clock_timestamp()"));
});

test("03B/03C keep invoker rights, locking and deduplication without broadening RLS", () => {
  const b = proposal("concierge-03b-operational-integrity");
  const c = proposal("concierge-03c-termination-integrity");
  assert.equal((b.match(/CREATE UNIQUE INDEX/g) ?? []).length, 4);
  for (const sql of [b, c]) {
    assert.match(sql, /SECURITY INVOKER SET search_path = pg_catalog, public/);
    assert.match(sql, /FOR NO KEY UPDATE/);
    assert.match(sql, /REVOKE ALL ON FUNCTION/);
    assert.doesNotMatch(sql.replace(/--[^\n]*/g, ""), /SECURITY DEFINER|CREATE POLICY|GRANT UPDATE/);
  }
});
