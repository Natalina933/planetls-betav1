import { getCanonicalListingId } from "../../../../lib/listingReferences.ts";

export type PerformanceProperty = { id: number; nom_logement: string | null; ville: string | null; statut: string | null };
export type PerformanceReservation = {
  id: string;
  property_id?: string | null;
  status?: string | null;
  check_in_at?: string | null;
  check_out_at?: string | null;
  metadata?: Record<string, unknown> | null;
};

const DAY = 86_400_000;

// Nuits calendaires : le jour de départ n'est pas une nuit réservée.
function calendarDay(value: string | null | undefined) {
  if (!value) return NaN;
  const date = value.slice(0, 10);
  const timestamp = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === date ? timestamp : NaN;
}

export function performancePeriod(now: Date, year?: number) {
  if (year !== undefined) return { start: Date.UTC(year, 0, 1), end: Date.UTC(year + 1, 0, 1) };
  const start = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDay = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 7, 0)).getUTCDate();
  const end = Date.UTC(now.getFullYear(), now.getMonth() + 6, Math.min(now.getDate(), lastDay));
  return { start, end };
}

export function summarizeReservations(reservations: PerformanceReservation[], period: { start: number; end: number }) {
  const nightsByProperty = new Map<string, Set<number>>();
  const reservationIds = new Set<string>();
  let unmatchedReservations = 0;
  for (const reservation of reservations) {
    if (["canceled", "cancelled", "draft"].includes(reservation.status ?? "")) continue;
    const arrival = calendarDay(reservation.check_in_at);
    const departure = calendarDay(reservation.check_out_at);
    if (!Number.isFinite(arrival) || !Number.isFinite(departure) || departure <= arrival) continue;
    const start = Math.max(arrival, period.start);
    const end = Math.min(departure, period.end);
    if (start >= end || reservationIds.has(reservation.id)) continue;
    reservationIds.add(reservation.id);
    const propertyId = getCanonicalListingId({ propertyId: reservation.property_id, metadata: reservation.metadata });
    if (!propertyId) { unmatchedReservations++; continue; }
    const nights = nightsByProperty.get(propertyId) ?? new Set<number>();
    for (let day = start; day < end; day += DAY) nights.add(day);
    nightsByProperty.set(propertyId, nights);
  }
  return { count: reservationIds.size, nightsByProperty, unmatchedReservations };
}

export function propertyStatus(status: string | null) {
  if (status === "active" || status === "published") return "En ligne";
  if (status === "maintenance") return "Maintenance";
  if (status === "inactive" || status === "unpublished") return "Hors ligne";
  if (status === "deleted" || status === "archived") return "Archivé";
  if (status === "draft") return "Brouillon";
  return "À préciser";
}
