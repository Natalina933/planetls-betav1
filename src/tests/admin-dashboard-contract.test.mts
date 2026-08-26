import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const adminPage = readFileSync(new URL("../app/dashboard/admin/page.tsx", import.meta.url), "utf8");

test("admin dashboard documents KPI provenance and technical verification states", () => {
  assert.match(adminPage, /Cadre de lecture des KPI/);
  assert.match(adminPage, /Sante technique/);
  assert.match(adminPage, /adminControl\?\.health\?\.status === "unverifiable"/);
  assert.match(adminPage, /problemRegistry/);
  assert.match(adminPage, /checkedSourceCount/);
});
