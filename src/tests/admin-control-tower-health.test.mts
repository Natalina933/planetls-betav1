import test from "node:test";
import assert from "node:assert/strict";
import { buildControlTowerHealth } from "../app/api/admin/control-tower/health.ts";

const sources = [
  { key: "missions", label: "Missions", available: true, reason: null },
  { key: "invoices", label: "Factures", available: true, reason: null },
];

test("control tower is healthy only when every source is available and no issue exists", () => {
  const result = buildControlTowerHealth({ sources, dangerCount: 0, warningCount: 0, checkedAt: "2026-07-19T12:00:00.000Z" });
  assert.equal(result.status, "healthy");
  assert.equal(result.fullyVerifiable, true);
  assert.equal(result.checkedSourceCount, 2);
});

test("control tower reports known operational problems", () => {
  assert.equal(buildControlTowerHealth({ sources, dangerCount: 1, warningCount: 2 }).status, "danger");
  assert.equal(buildControlTowerHealth({ sources, dangerCount: 0, warningCount: 2 }).status, "warning");
});

test("an unavailable source prevents a false healthy status", () => {
  const result = buildControlTowerHealth({
    sources: [...sources, { key: "maintenance", label: "Maintenance", available: false, reason: "Schéma absent" }],
    dangerCount: 0,
    warningCount: 0,
  });
  assert.equal(result.status, "unverifiable");
  assert.equal(result.fullyVerifiable, false);
  assert.deepEqual(result.unavailableSources.map((source) => source.key), ["maintenance"]);
});
