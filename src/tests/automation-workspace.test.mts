import assert from "node:assert/strict";
import test from "node:test";

import { AUTOMATION_PROCESSES, AUTOMATION_RECORDS } from "../app/dashboard/admin/(product-tech)/developpement/automationWorkspace.ts";

test("le processus de demandes inclut les scénarios de qualification et de relance contrôlée", () => {
  const process = AUTOMATION_PROCESSES.find((item) => item.id === "PROC-001");

  assert.deepEqual(process?.automationIds, ["AUT-020", "AUT-021", "AUT-022", "AUT-023", "AUT-024"]);
  assert.match(process?.toBe ?? "", /archivage traçable/);
  assert.equal(process?.humanTasks.some((task) => task.includes("urgence")), true);
});

test("les automatisations de demandes préparatoires restent cartographiées et inactives", () => {
  const qualification = AUTOMATION_RECORDS.find((item) => item.id === "AUT-020");
  const followUp = AUTOMATION_RECORDS.find((item) => item.id === "AUT-024");

  for (const automation of [qualification, followUp]) {
    assert.equal(automation?.processId, "PROC-001");
    assert.equal(automation?.status, "Cartographiée");
    assert.equal(automation?.activation, "NON");
    assert.equal(automation?.executions7d, 0);
    assert.equal(automation?.successCount7d, 0);
  }

  assert.deepEqual(qualification?.childIds, ["AUT-024"]);
  assert.equal(followUp?.parentId, "AUT-020");
  assert.equal(followUp?.dependencies.includes("PLS-SEC-004"), true);
});
