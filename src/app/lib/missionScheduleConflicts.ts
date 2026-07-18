export type MissionScheduleCandidate = {
  id: string;
  propertyId?: string | null;
  assignedTeamMemberId?: string | null;
  scheduledStart: string;
  scheduledEnd: string;
};

export type MissionScheduleRow = {
  id: string;
  property_id?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  metadata?: unknown;
};

function teamMemberId(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>).assigned_team_member_id;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function validateMissionScheduleRange(start: string, end: string) {
  const startTime = Date.parse(start);
  const endTime = Date.parse(end);
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return { valid: false, error: "Créneau de mission invalide." } as const;
  }
  if (endTime <= startTime) {
    return { valid: false, error: "La fin de mission doit être après le début." } as const;
  }
  return { valid: true, startTime, endTime } as const;
}

export function findMissionScheduleConflicts(
  candidate: MissionScheduleCandidate,
  rows: MissionScheduleRow[],
) {
  const range = validateMissionScheduleRange(candidate.scheduledStart, candidate.scheduledEnd);
  if (!range.valid) return [];

  return rows.filter((row) => {
    if (row.id === candidate.id || !row.scheduled_start || !row.scheduled_end) return false;
    const existingStart = Date.parse(row.scheduled_start);
    const existingEnd = Date.parse(row.scheduled_end);
    if (!Number.isFinite(existingStart) || !Number.isFinite(existingEnd)) return false;
    if (!(existingStart < range.endTime && existingEnd > range.startTime)) return false;

    const sameProperty = Boolean(candidate.propertyId && row.property_id === candidate.propertyId);
    const existingMemberId = teamMemberId(row.metadata);
    const sameMember = Boolean(
      candidate.assignedTeamMemberId && existingMemberId === candidate.assignedTeamMemberId,
    );
    return sameProperty || sameMember;
  });
}