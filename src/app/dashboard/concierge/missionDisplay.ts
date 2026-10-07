import { getListingLabel, matchesHousingReference } from "../../lib/listingReferences.ts";
import { normalizeMissionStatus } from "../../lib/missionStatus.ts";

export type ConciergeMissionDisplayRow = {
  id: string;
  title: string | null;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  property_id?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ConciergeMissionView = "to_plan" | "today" | "late" | "done" | "all";

export function toMissionTimestamp(value: string | null | undefined) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export function isSameMissionLocalDay(left: number | Date, right: number | Date) {
  const leftDate = left instanceof Date ? left : new Date(left);
  const rightDate = right instanceof Date ? right : new Date(right);
  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  );
}

export function isClosedMissionStatus(status: string | null | undefined) {
  const normalized = normalizeMissionStatus(status);
  return normalized === "completed" || normalized === "canceled";
}

export function getConciergeMissionView(mission: ConciergeMissionDisplayRow, now: number): ConciergeMissionView {
  const status = normalizeMissionStatus(mission.status);
  const start = toMissionTimestamp(mission.scheduled_start);

  if (isClosedMissionStatus(status)) return "done";
  if (!start || status === "draft" || status === "assigned") return "to_plan";
  if (start < now && !isSameMissionLocalDay(start, now)) return "late";
  if (isSameMissionLocalDay(start, now)) return "today";
  return "all";
}

export function getConciergeMissionHousingLabel(
  mission: ConciergeMissionDisplayRow,
  housingNameById: Map<string, string>,
) {
  return getListingLabel(
    {
      propertyId: mission.property_id ?? null,
      metadata: mission.metadata ?? null,
    },
    { housingNameById },
  );
}

export function missionMatchesHousing(mission: ConciergeMissionDisplayRow, housingId: string | number | null | undefined) {
  return matchesHousingReference(
    {
      propertyId: mission.property_id ?? null,
      metadata: mission.metadata ?? null,
    },
    housingId,
  );
}
