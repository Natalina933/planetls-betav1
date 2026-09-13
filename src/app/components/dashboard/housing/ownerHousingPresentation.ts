import { getHousingReferenceId } from "../../../lib/listingReferences.ts";

export type HousingStay = {
  property_id?: string | number | null;
  metadata?: Record<string, unknown> | null;
  check_in_at?: string | null;
  check_out_at?: string | null;
  status?: string | null;
  canceled_at?: string | null;
};

export function getUpcomingHousingStays(rows: HousingStay[], now: number) {
  const stays = new Map<string, HousingStay>();
  for (const row of rows) {
    if (row.canceled_at || ["cancelled", "canceled", "completed", "draft"].includes(row.status ?? "")) continue;
    const start = Date.parse(row.check_in_at ?? "");
    const end = Date.parse(row.check_out_at ?? "");
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < now || end <= start) continue;
    const id = getHousingReferenceId({ propertyId: row.property_id, metadata: row.metadata });
    if (!id) continue;
    const previous = stays.get(id);
    if (!previous || start < Date.parse(previous.check_in_at ?? "")) stays.set(id, row);
  }
  return stays;
}
