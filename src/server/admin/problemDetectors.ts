import { evaluateMissionHealth } from "../../app/api/admin/control-tower/missionHealth.ts";
import type { AdminProblemDetection } from "./problems";

type MissionProblemInput = {
  id: string;
  status: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  completedAt: string | null;
  hasRequest: boolean;
  quoteCount: number;
  invoices: Array<{ status?: string | null; total_amount?: number | null; paid_amount?: number | null; balance_amount?: number | null; due_date?: string | null; paid_at?: string | null }>;
  assignmentCount: number;
  openMaintenanceCount: number;
};

export function detectMissionProblems(mission: MissionProblemInput): AdminProblemDetection[] {
  const health = evaluateMissionHealth({
    status: mission.status,
    scheduled_start: mission.scheduledStart,
    scheduled_end: mission.scheduledEnd,
    completed_at: mission.completedAt,
    hasRequest: mission.hasRequest,
    quoteCount: mission.quoteCount,
    invoices: mission.invoices,
    assignmentCount: mission.assignmentCount,
    openMaintenanceCount: mission.openMaintenanceCount,
  });
  const failed = new Set(health.steps.filter((step) => !step.ok).map((step) => step.id));
  const base = { type: "operation" as const, source: "control-tower-mission-health", entityType: "mission", entityId: mission.id, functionalOwner: "operations" as const };
  const problems: AdminProblemDetection[] = [];

  if (failed.has("assignment")) {
    problems.push({ ...base, severity: "prioritaire", title: "Mission non affectée", summary: "Une mission active ne possède aucune affectation opérationnelle.", fingerprintContext: { rule: "mission_assignment_missing", version: 1 } });
  }
  if (failed.has("planning")) {
    problems.push({ ...base, severity: "prioritaire", title: "Planning de mission incohérent", summary: "Une mission active présente un planning absent ou incohérent.", fingerprintContext: { rule: "mission_planning_incoherent", version: 1 } });
  }
  if (failed.has("maintenance")) {
    problems.push({ ...base, severity: "prioritaire", title: "Incident de maintenance ouvert", summary: "Une mission terminée conserve au moins un incident de maintenance ouvert.", fingerprintContext: { rule: "mission_completed_with_open_maintenance", version: 1 } });
  }
  return problems;
}
