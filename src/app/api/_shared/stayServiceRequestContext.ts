// Explicit stay context carried by a one-off stay service request.
// Activation of the stay-only acceptance path is NEVER inferred from
// request_type: it requires an explicit reservation_id on the request.
import type { LooseSupabaseClient } from "./untypedSupabase.ts";
import { normalizeStayNeed, type NeedKey } from "./stayNeeds.ts";

export type StayServiceRequestContext = {
  reservationId: string;
  stayNeed: NeedKey | null;
};

type StayContextRow = {
  id?: unknown;
  reservation_id?: unknown;
  stay_need?: unknown;
  owner_profile_id?: unknown;
  property_id?: unknown;
};

export function readStayContext(request: StayContextRow | null | undefined): StayServiceRequestContext | null {
  const reservationId =
    typeof request?.reservation_id === "string" && request.reservation_id.trim()
      ? request.reservation_id.trim()
      : null;
  if (!reservationId) return null;
  return { reservationId, stayNeed: normalizeStayNeed(request?.stay_need) };
}

export async function loadStayServiceRequestContext(
  db: LooseSupabaseClient,
  serviceRequestId: string | null | undefined,
): Promise<StayServiceRequestContext | null> {
  if (!serviceRequestId) return null;
  const { data, error } = await db
    .from("service_requests")
    .select("id, reservation_id, stay_need")
    .eq("id", serviceRequestId)
    .maybeSingle();
  if (error || !data) return null;
  return readStayContext(data as StayContextRow);
}

export type StayServiceRequestValidation =
  | { ok: true; context: { reservationId: string; stayNeed: NeedKey; propertyId: string | null } }
  | { ok: false; status: number; error: string };

// Server-side validation for POST /api/service-requests stay context:
// reservation exists, belongs to the authenticated owner, property matches
// and stay_need uses the canonical stay vocabulary.
export async function validateStayServiceRequestContext(
  db: LooseSupabaseClient,
  input: {
    userId: string;
    reservationId: string;
    stayNeed: unknown;
    propertyId?: string | null;
  },
): Promise<StayServiceRequestValidation> {
  const stayNeed = normalizeStayNeed(input.stayNeed);
  if (!stayNeed) {
    return {
      ok: false,
      status: 400,
      error: "Le besoin de séjour est requis : checkin, checkout, cleaning, linen ou courses.",
    };
  }

  const { data, error } = await db
    .from("reservations")
    .select("id, owner_profile_id, property_id")
    .eq("id", input.reservationId)
    .maybeSingle();

  if (error) {
    console.error("[stayServiceRequestContext] reservation lookup error:", error);
    return { ok: false, status: 500, error: "Impossible de vérifier le séjour." };
  }
  if (!data) {
    return { ok: false, status: 404, error: "Séjour introuvable." };
  }

  const reservation = data as { id?: unknown; owner_profile_id?: unknown; property_id?: unknown };
  if (reservation.owner_profile_id !== input.userId) {
    return { ok: false, status: 403, error: "Ce séjour n'appartient pas à votre compte." };
  }

  const requestedPropertyId = typeof input.propertyId === "string" && input.propertyId.trim() ? input.propertyId.trim() : null;
  const reservationPropertyId =
    typeof reservation.property_id === "string" && reservation.property_id.trim() ? reservation.property_id.trim() : null;
  if (requestedPropertyId && reservationPropertyId && requestedPropertyId !== reservationPropertyId) {
    return { ok: false, status: 400, error: "Le logement de la demande ne correspond pas à celui du séjour." };
  }

  return {
    ok: true,
    context: {
      reservationId: typeof reservation.id === "string" ? reservation.id : input.reservationId,
      stayNeed,
      propertyId: requestedPropertyId ?? reservationPropertyId,
    },
  };
}
