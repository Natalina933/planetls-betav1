// Synthetic harness-only objects, never installed by an application migration.
export async function runAtomicity(sql) {
  await sql(`CREATE TABLE harness.e2e_parent(id integer PRIMARY KEY);
CREATE TABLE harness.e2e_child(id integer PRIMARY KEY, parent_id integer REFERENCES harness.e2e_parent(id) DEFERRABLE INITIALLY DEFERRED);
CREATE TABLE harness.e2e_log(id integer PRIMARY KEY);
CREATE FUNCTION harness.e2e_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic fault' USING ERRCODE='P0001'; END $$;
CREATE TRIGGER e2e_fault AFTER INSERT ON harness.e2e_child FOR EACH ROW EXECUTE FUNCTION harness.e2e_fail();`);
  let injection = false;
  try { await sql('BEGIN; INSERT INTO harness.e2e_parent VALUES (1); INSERT INTO harness.e2e_child VALUES (1,1); COMMIT;'); }
  catch (error) { if (!/P0001/.test(String(error?.diagnostic?.stderr ?? error?.message))) throw error; injection = true; }
  if (!injection) throw Error('Injected fault did not fail');
  await sql("SELECT harness.assert_true((SELECT count(*)=0 FROM harness.e2e_parent) AND (SELECT count(*)=0 FROM harness.e2e_child) AND (SELECT count(*)=0 FROM harness.e2e_log),'injection rollback'); DROP TRIGGER e2e_fault ON harness.e2e_child;");
  let deferred = false;
  try { await sql('BEGIN; INSERT INTO harness.e2e_log VALUES (2); INSERT INTO harness.e2e_child VALUES (2,999); COMMIT;'); }
  catch (error) { if (!/23503/.test(String(error?.diagnostic?.stderr ?? error?.message))) throw error; deferred = true; }
  if (!deferred) throw Error('Deferred constraint did not fail at COMMIT');
  await sql("SELECT harness.assert_true((SELECT count(*)=0 FROM harness.e2e_parent) AND (SELECT count(*)=0 FROM harness.e2e_child) AND (SELECT count(*)=0 FROM harness.e2e_log),'deferred commit rollback');");
}
