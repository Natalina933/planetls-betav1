import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canChangeAdminProblemStatus,
  changeAdminProblemStatus,
  createAdminProblemFingerprint,
  createOrRedetectAdminProblem,
} from "../server/admin/problems.ts";
import { detectMissionProblems } from "../server/admin/problemDetectors.ts";

const detection = {
  type: "operation" as const,
  severity: "prioritaire" as const,
  title: "Mission non affectee",
  summary: "Une mission active ne possede aucune affectation operationnelle.",
  source: "control-tower-mission-health",
  entityType: "mission",
  entityId: "123e4567-e89b-42d3-a456-426614174000",
  functionalOwner: "operations" as const,
  fingerprintContext: { rule: "mission_assignment_missing", version: 1 },
  detectedAt: "2026-08-24T10:00:00.000Z",
};

test("the same logical context produces a stable fingerprint", () => {
  const first = createAdminProblemFingerprint(detection);
  const reordered = createAdminProblemFingerprint({ ...detection, fingerprintContext: { version: 1, rule: "mission_assignment_missing" } });
  const distinct = createAdminProblemFingerprint({ ...detection, fingerprintContext: { rule: "mission_planning_incoherent", version: 1 } });

  assert.equal(first, reordered);
  assert.notEqual(first, distinct);
  assert.match(first, /^[0-9a-f]{64}$/);
});

test("recording sends only structured minimal fields to the registry function", async () => {
  let call: { name: string; args: Record<string, unknown> } | null = null;
  const client = {
    rpc: async (name: string, args: Record<string, unknown>) => {
      call = { name, args };
      return { data: { id: "problem-id" }, error: null };
    },
  };

  const result = await createOrRedetectAdminProblem(client, detection);
  assert.equal(result.problem && (result.problem as { id: string }).id, "problem-id");
  assert.equal(call?.name, "create_or_redetect_admin_problem");
  assert.equal(call?.args.p_fingerprint, result.fingerprint);
  assert.equal("fingerprintContext" in (call?.args ?? {}), false);
  assert.equal("metadata" in (call?.args ?? {}), false);
  assert.equal("payload" in (call?.args ?? {}), false);
});

test("status transitions are minimal, explicit and closing requires a report", async () => {
  assert.equal(canChangeAdminProblemStatus("new", "acknowledged"), true);
  assert.equal(canChangeAdminProblemStatus("closed", "in_progress"), false);
  assert.equal(canChangeAdminProblemStatus("closed", "reopened"), true);

  await assert.rejects(
    () => changeAdminProblemStatus({ rpc: async () => ({ data: null, error: null }) }, { problemId: "problem-id", currentStatus: "resolved", nextStatus: "closed", note: "" }),
    /compte rendu/,
  );
});

test("mission detectors reuse only reliable Control Tower health signals", () => {
  const problems = detectMissionProblems({
    id: "123e4567-e89b-42d3-a456-426614174000",
    status: "completed",
    scheduledStart: "2026-08-24T10:00:00Z",
    scheduledEnd: "2026-08-24T09:00:00Z",
    completedAt: "2026-08-24T10:00:00Z",
    hasRequest: true,
    quoteCount: 1,
    invoices: [],
    assignmentCount: 0,
    openMaintenanceCount: 1,
  });

  assert.deepEqual(problems.map((problem) => problem.fingerprintContext.rule), [
    "mission_assignment_missing",
    "mission_planning_incoherent",
    "mission_completed_with_open_maintenance",
  ]);
  assert.ok(problems.every((problem) => problem.functionalOwner === "operations" && problem.severity === "prioritaire"));
});

test("registry migration enforces atomic deduplication and append-only history", () => {
  const migration = readFileSync(new URL("../../supabase/migrations/20260824110000_admin_problems_lot1.sql", import.meta.url), "utf8");
  assert.match(migration, /fingerprint CHAR\(64\) NOT NULL UNIQUE/);
  assert.match(migration, /pg_advisory_xact_lock\(hashtextextended\(p_fingerprint, 0\)\)/);
  assert.match(migration, /occurrence_count = occurrence_count \+ 1/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.admin_problem_events/);
  assert.match(migration, /INSERT INTO public\.admin_problem_events/);
  assert.doesNotMatch(migration, /payload JSONB|metadata JSONB/);
});
