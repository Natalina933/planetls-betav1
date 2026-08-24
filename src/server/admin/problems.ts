import { createHash } from "node:crypto";

export const ADMIN_PROBLEM_TYPES = ["onboarding", "operation", "finance", "support", "technical", "security", "content", "strategy"] as const;
export const ADMIN_PROBLEM_SEVERITIES = ["information", "vigilance", "prioritaire", "critique"] as const;
export const ADMIN_PROBLEM_STATUSES = ["new", "acknowledged", "in_progress", "escalated", "resolved", "closed", "reopened"] as const;
export const ADMIN_PROBLEM_OWNERS = ["operations", "support", "finance", "tech", "direction"] as const;

export type AdminProblemType = (typeof ADMIN_PROBLEM_TYPES)[number];
export type AdminProblemSeverity = (typeof ADMIN_PROBLEM_SEVERITIES)[number];
export type AdminProblemStatus = (typeof ADMIN_PROBLEM_STATUSES)[number];
export type AdminProblemOwner = (typeof ADMIN_PROBLEM_OWNERS)[number];

type FingerprintContext = Readonly<Record<string, string | number | boolean | null>>;

export type AdminProblemDetection = {
  type: AdminProblemType;
  severity: AdminProblemSeverity;
  title: string;
  summary: string;
  source: string;
  entityType: string;
  entityId: string;
  functionalOwner: AdminProblemOwner;
  fingerprintContext: FingerprintContext;
  detectedAt?: string;
};

type ProblemRpcClient = {
  rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

const MAX_TITLE_LENGTH = 160;
const MAX_SUMMARY_LENGTH = 500;

function requiredText(value: string, field: string, maxLength: number) {
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) throw new Error(`${field} invalide.`);
  return normalized;
}

function stableContext(context: FingerprintContext) {
  return Object.fromEntries(Object.entries(context).sort(([left], [right]) => left.localeCompare(right)));
}

export function createAdminProblemFingerprint({ type, entityType, entityId, fingerprintContext }: Pick<AdminProblemDetection, "type" | "entityType" | "entityId" | "fingerprintContext">) {
  const canonical = JSON.stringify({ type, entityType: entityType.trim(), entityId: entityId.trim(), context: stableContext(fingerprintContext) });
  return createHash("sha256").update(canonical).digest("hex");
}

export function validateAdminProblemDetection(input: AdminProblemDetection) {
  if (!ADMIN_PROBLEM_TYPES.includes(input.type)) throw new Error("Type de problème invalide.");
  if (!ADMIN_PROBLEM_SEVERITIES.includes(input.severity)) throw new Error("Sévérité invalide.");
  if (!ADMIN_PROBLEM_OWNERS.includes(input.functionalOwner)) throw new Error("Responsabilité fonctionnelle invalide.");
  return {
    ...input,
    title: requiredText(input.title, "Titre", MAX_TITLE_LENGTH),
    summary: requiredText(input.summary, "Résumé", MAX_SUMMARY_LENGTH),
    source: requiredText(input.source, "Source", 80),
    entityType: requiredText(input.entityType, "Type d'entité", 80),
    entityId: requiredText(input.entityId, "Identifiant d'entité", 160),
  };
}

export async function createOrRedetectAdminProblem(client: ProblemRpcClient, input: AdminProblemDetection) {
  const problem = validateAdminProblemDetection(input);
  const fingerprint = createAdminProblemFingerprint(problem);
  const { data, error } = await client.rpc("create_or_redetect_admin_problem", {
    p_type: problem.type,
    p_severity: problem.severity,
    p_fingerprint: fingerprint,
    p_title: problem.title,
    p_summary: problem.summary,
    p_source: problem.source,
    p_entity_type: problem.entityType,
    p_entity_id: problem.entityId,
    p_functional_owner: problem.functionalOwner,
    p_detected_at: problem.detectedAt ?? new Date().toISOString(),
  });
  if (error) throw new Error(`Impossible d'enregistrer le problème Admin : ${error.message}`);
  return { problem: data, fingerprint };
}

const ALLOWED_STATUS_TRANSITIONS: Record<AdminProblemStatus, readonly AdminProblemStatus[]> = {
  new: ["acknowledged", "in_progress", "escalated"],
  acknowledged: ["in_progress", "escalated", "resolved"],
  in_progress: ["escalated", "resolved"],
  escalated: ["in_progress", "resolved"],
  resolved: ["closed", "in_progress"],
  closed: ["reopened"],
  reopened: ["acknowledged", "in_progress", "escalated"],
};

export function canChangeAdminProblemStatus(current: AdminProblemStatus, next: AdminProblemStatus) {
  return current === next || ALLOWED_STATUS_TRANSITIONS[current].includes(next);
}

export async function changeAdminProblemStatus(
  client: ProblemRpcClient,
  input: { problemId: string; currentStatus: AdminProblemStatus; nextStatus: AdminProblemStatus; actorProfileId?: string | null; note?: string | null },
) {
  if (!canChangeAdminProblemStatus(input.currentStatus, input.nextStatus)) throw new Error("Transition de statut invalide.");
  const note = input.note?.trim() || null;
  if (input.nextStatus === "closed" && (!note || note.length < 3)) throw new Error("Un compte rendu est requis pour clôturer le problème.");
  const { data, error } = await client.rpc("change_admin_problem_status", {
    p_problem_id: input.problemId,
    p_next_status: input.nextStatus,
    p_actor_profile_id: input.actorProfileId ?? null,
    p_note: note,
  });
  if (error) throw new Error(`Impossible de modifier le problème Admin : ${error.message}`);
  return data;
}
