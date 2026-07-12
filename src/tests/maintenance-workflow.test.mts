import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMaintenanceWorkflow,
  buildMaintenanceWorkflowDashboard,
  type MaintenanceIncidentInput,
} from "../app/lib/maintenanceWorkflow.ts";

test("buildMaintenanceWorkflow tracks the full maintenance incident chain", () => {
  const incident: MaintenanceIncidentInput = {
    id: "incident-001",
    missionId: "mission-001",
    title: "Fuite sous evier",
    priority: "urgent",
    missionStatus: "scheduled",
    propertyLabel: "Appartement Victor Hugo",
    createdAt: "2026-07-12T08:00:00.000Z",
    photos: [{ id: "photo-1", url: "https://example.test/fuite.jpg" }],
    artisan: { id: "provider-1", name: "Plomberie Martin", status: "pending" },
    quote: { id: "quote-1", number: "DEV-001", status: "accepted", amount: 240 },
    validation: { status: "validated", validatedAt: "2026-07-12T09:00:00.000Z" },
    invoice: { id: "invoice-1", number: "FAC-001", status: "sent", amount: 240 },
    history: [{ id: "event-1", label: "Signalement proprietaire", at: "2026-07-12T08:02:00.000Z" }],
  };

  const workflow = buildMaintenanceWorkflow(incident);

  assert.equal(workflow.missionId, "mission-001");
  assert.equal(workflow.traceabilityId, "MT-INCIDENT");
  assert.equal(workflow.completionPct, 100);
  assert.equal(workflow.currentStepId, "history");
  assert.deepEqual(workflow.missing, []);
  assert.equal(workflow.steps.every((step) => step.done), true);
  assert.equal(workflow.history.length >= 5, true);
});

test("buildMaintenanceWorkflowDashboard exposes operational maintenance counters", () => {
  const dashboard = buildMaintenanceWorkflowDashboard({
    incidents: [
      {
        id: "incident-a",
        title: "Panne ballon eau chaude",
        priority: "high",
        missionId: "mission-a",
        missionStatus: "accepted",
        photos: [{ id: "photo-a" }],
      },
      {
        id: "incident-b",
        title: "Serrure bloquee",
        priority: "normal",
        missionId: "mission-b",
        missionStatus: "scheduled",
        photos: [{ id: "photo-b" }],
        artisan: { name: "Serrurerie Centre" },
        quote: { id: "quote-b", status: "sent" },
      },
    ],
  });

  assert.equal(dashboard.total, 2);
  assert.equal(dashboard.urgent, 1);
  assert.equal(dashboard.waitingArtisan, 1);
  assert.equal(dashboard.waitingValidation, 1);
  assert.equal(dashboard.completed, 0);
  assert.equal(dashboard.averageCompletionPct > 0, true);
});
