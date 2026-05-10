export type MissionPartnerLike = {
  selected_concierge_profile_id?: string | null;
  status?: string | null;
  workflow_status?: string | null;
  mission_id?: string | null;
  recipients?: Array<{ status?: string | null }> | null;
};

const ACCEPTED_PARTNER_STATUSES = new Set([
  "accepted",
  "archived",
  "mission_created",
  "selected",
]);

export function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function normalizeMissionPartnerStatus(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isAcceptedMissionPartner(request: MissionPartnerLike) {
  const conciergeId = request.selected_concierge_profile_id ?? "";
  if (!isUuidLike(conciergeId)) return false;

  const status = normalizeMissionPartnerStatus(request.workflow_status ?? request.status);
  if (ACCEPTED_PARTNER_STATUSES.has(status)) return true;
  if (typeof request.mission_id === "string" && request.mission_id.trim()) return true;

  return Boolean(
    request.recipients?.some(
      (recipient) => normalizeMissionPartnerStatus(recipient.status) === "selected",
    ),
  );
}
