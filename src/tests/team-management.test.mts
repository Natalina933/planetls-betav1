import assert from "node:assert/strict";
import test from "node:test";

import { buildTeamManagementDashboard } from "../app/lib/teamManagement.ts";

test("buildTeamManagementDashboard computes roles, availability, performance and assignments", () => {
  const dashboard = buildTeamManagementDashboard({
    members: [
      { id: "manager-1", name: "Manager", role: "manager" },
      { id: "employee-1", name: "Employe", role: "employee" },
      { id: "provider-1", name: "Prestataire", role: "provider", availability: "offline" },
    ],
    missions: [
      {
        id: "mission-1",
        title: "Menage",
        status: "completed",
        priority: "normal",
        metadata: { assigned_team_member_id: "employee-1" },
      },
      {
        id: "mission-2",
        title: "Check-in urgent",
        status: "in_progress",
        priority: "urgent",
        metadata: { assigned_team_member_id: "employee-1" },
      },
      {
        id: "mission-3",
        title: "Maintenance",
        status: "scheduled",
        priority: "high",
        metadata: { assigned_team_member_id: "provider-1" },
      },
    ],
  });

  const employee = dashboard.members.find((member) => member.id === "employee-1");
  const provider = dashboard.members.find((member) => member.id === "provider-1");

  assert.equal(dashboard.metrics.employees, 2);
  assert.equal(dashboard.metrics.collaborators, 1);
  assert.equal(dashboard.metrics.assignedMissions, 3);
  assert.equal(dashboard.metrics.notifications, 2);
  assert.equal(employee?.assignedMissionCount, 1);
  assert.equal(employee?.completedMissionCount, 1);
  assert.equal(employee?.notificationCount, 1);
  assert.equal(provider?.availability, "offline");
  assert.ok(employee?.permissions.includes("missions.execute"));
  assert.equal(dashboard.planning.length, 3);
});
