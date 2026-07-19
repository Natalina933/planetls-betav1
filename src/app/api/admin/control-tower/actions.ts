export const ADMIN_CONTROL_TARGETS = ["onboarding", "mission", "message"] as const;
export const ADMIN_CONTROL_ACTIONS = ["acknowledged", "escalated", "closed"] as const;

export type AdminControlTarget = (typeof ADMIN_CONTROL_TARGETS)[number];
export type AdminControlActionStatus = (typeof ADMIN_CONTROL_ACTIONS)[number];

export type AdminControlActionInput = {
  targetType: AdminControlTarget;
  targetId: string;
  status: AdminControlActionStatus;
  note: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseAdminControlAction(value: unknown):
  | { ok: true; data: AdminControlActionInput }
  | { ok: false; error: string } {
  if (!value || typeof value !== "object") return { ok: false, error: "Action invalide." };
  const body = value as Record<string, unknown>;
  if (!ADMIN_CONTROL_TARGETS.includes(body.targetType as AdminControlTarget)) {
    return { ok: false, error: "Type de cible invalide." };
  }
  if (typeof body.targetId !== "string" || !UUID_PATTERN.test(body.targetId)) {
    return { ok: false, error: "Identifiant de cible invalide." };
  }
  if (!ADMIN_CONTROL_ACTIONS.includes(body.status as AdminControlActionStatus)) {
    return { ok: false, error: "Statut d'action invalide." };
  }
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (note.length > 500) return { ok: false, error: "Le motif est limité à 500 caractères." };
  if ((body.status === "escalated" || body.status === "closed") && note.length < 3) {
    return {
      ok: false,
      error: body.status === "closed"
        ? "Un compte rendu est requis pour clôturer le suivi."
        : "Un motif est requis pour transmettre au responsable.",
    };
  }
  return {
    ok: true,
    data: {
      targetType: body.targetType as AdminControlTarget,
      targetId: body.targetId,
      status: body.status as AdminControlActionStatus,
      note: note || null,
    },
  };
}

export function controlActionKey(targetType: AdminControlTarget, targetId: string) {
  return targetType + ":" + targetId;
}
