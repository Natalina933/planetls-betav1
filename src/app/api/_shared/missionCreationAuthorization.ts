import { getHousingReferenceId } from "../../lib/listingReferences.ts";

import type { LooseSupabaseClient } from "./untypedSupabase";

type MissionCreationActorRole = "owner" | "concierge";

type MissionCreationAuthorizationInput = {
  db: LooseSupabaseClient;
  actorProfileId: string;
  actorRole: MissionCreationActorRole;
  conciergeProfileId: string;
  ownerProfileId: string | null;
  propertyId: string | null;
  reservationId: string | null;
  metadata?: Record<string, unknown> | null;
};

type AuthorizationResult =
  | {
      ok: true;
      ownerProfileId: string | null;
      propertyId: string | null;
      housingId: string | null;
      reservationId: string | null;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

type CollaborationRow = {
  id: string;
  housing_id: number;
  owner_profile_id: string;
  concierge_profile_id: string;
  status: string;
};

type PropertyRow = {
  id: string;
  owner_id: string | null;
};

type ReservationRow = {
  id: string;
  owner_profile_id: string;
  concierge_profile_id: string;
  property_id: string | null;
  metadata?: Record<string, unknown> | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanId(value: string | null | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function deny(status: number, error: string): AuthorizationResult {
  return { ok: false, status, error };
}

function conflict(error = "RÃ©fÃ©rences de mission incohÃ©rentes."): AuthorizationResult {
  return deny(409, error);
}

function forbidden(): AuthorizationResult {
  return deny(403, "Mission non autorisÃ©e pour ce logement.");
}

function metadataRecord(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

async function loadActiveHousingCollaboration(input: {
  db: LooseSupabaseClient;
  housingId: string;
  conciergeProfileId: string;
  ownerProfileId?: string | null;
}) {
  let query = input.db
    .from("housing_collaborations")
    .select("id,housing_id,owner_profile_id,concierge_profile_id,status")
    .eq("housing_id", Number(input.housingId))
    .eq("concierge_profile_id", input.conciergeProfileId)
    .eq("status", "active");

  if (input.ownerProfileId) {
    query = query.eq("owner_profile_id", input.ownerProfileId);
  }

  const { data, error } = await query.maybeSingle<CollaborationRow>();
  return { collaboration: data, error };
}

async function hasOwnerConciergeRelation(input: {
  db: LooseSupabaseClient;
  ownerProfileId: string;
  conciergeProfileId: string;
}) {
  const { data, error } = await input.db
    .from("concierge_owner_matches")
    .select("id")
    .eq("owner_profile_id", input.ownerProfileId)
    .eq("concierge_profile_id", input.conciergeProfileId)
    .in("match_status", ["new", "contacted"])
    .limit(1)
    .maybeSingle<{ id: string }>();

  return { allowed: Boolean(data), error };
}

async function resolvePropertyAuthorization(input: {
  db: LooseSupabaseClient;
  actorRole: MissionCreationActorRole;
  actorProfileId: string;
  conciergeProfileId: string;
  ownerProfileId: string | null;
  propertyId: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<AuthorizationResult> {
  const propertyId = cleanId(input.propertyId);
  const metadataHousingId = getHousingReferenceId({ propertyId: null, metadata: input.metadata });
  if (!propertyId && !metadataHousingId) {
    if (input.actorRole === "owner") {
      return { ok: true, ownerProfileId: input.actorProfileId, propertyId: null, housingId: null, reservationId: null };
    }

    if (!input.ownerProfileId) {
      return { ok: true, ownerProfileId: null, propertyId: null, housingId: null, reservationId: null };
    }

    const relation = await hasOwnerConciergeRelation({
      db: input.db,
      ownerProfileId: input.ownerProfileId,
      conciergeProfileId: input.conciergeProfileId,
    });
    if (relation.error) return deny(500, "Impossible de vÃ©rifier la relation propriÃ©taire.");
    return relation.allowed
      ? { ok: true, ownerProfileId: input.ownerProfileId, propertyId: null, housingId: null, reservationId: null }
      : forbidden();
  }

  const housingId = getHousingReferenceId({ propertyId, metadata: input.metadata });
  if (housingId) {
    const { collaboration, error } = await loadActiveHousingCollaboration({
      db: input.db,
      housingId,
      conciergeProfileId: input.conciergeProfileId,
      ownerProfileId: input.ownerProfileId,
    });
    if (error) return deny(500, "Impossible de vÃ©rifier l'autorisation logement.");
    if (!collaboration) return forbidden();
    if (input.actorRole === "owner" && collaboration.owner_profile_id !== input.actorProfileId) return forbidden();

    return {
      ok: true,
      ownerProfileId: collaboration.owner_profile_id,
      propertyId: propertyId && UUID_RE.test(propertyId) ? propertyId : null,
      housingId,
      reservationId: null,
    };
  }

  if (!propertyId || !UUID_RE.test(propertyId)) return deny(400, "RÃ©fÃ©rence logement invalide.");

  const { data: property, error } = await input.db
    .from("properties")
    .select("id,owner_id")
    .eq("id", propertyId)
    .maybeSingle<PropertyRow>();
  if (error) return deny(500, "Impossible de vÃ©rifier le logement.");
  if (!property?.owner_id) return forbidden();
  if (input.ownerProfileId && input.ownerProfileId !== property.owner_id) return conflict();
  if (input.actorRole === "owner" && property.owner_id !== input.actorProfileId) return forbidden();

  if (input.actorRole === "concierge") {
    const relation = await hasOwnerConciergeRelation({
      db: input.db,
      ownerProfileId: property.owner_id,
      conciergeProfileId: input.conciergeProfileId,
    });
    if (relation.error) return deny(500, "Impossible de vÃ©rifier la relation propriÃ©taire.");
    if (!relation.allowed) return forbidden();
  }

  return {
    ok: true,
    ownerProfileId: property.owner_id,
    propertyId,
    housingId: null,
    reservationId: null,
  };
}

export async function authorizeMissionCreation(input: MissionCreationAuthorizationInput): Promise<AuthorizationResult> {
  const ownerProfileId = cleanId(input.ownerProfileId);
  const propertyId = cleanId(input.propertyId);
  const reservationId = cleanId(input.reservationId);
  const metadata = input.metadata ?? null;

  const propertyAuthorization = await resolvePropertyAuthorization({
    db: input.db,
    actorRole: input.actorRole,
    actorProfileId: input.actorProfileId,
    conciergeProfileId: input.conciergeProfileId,
    ownerProfileId,
    propertyId,
    metadata,
  });
  if (!propertyAuthorization.ok) return propertyAuthorization;

  if (!reservationId) {
    return propertyAuthorization;
  }

  const { data: reservation, error } = await input.db
    .from("reservations")
    .select("id,owner_profile_id,concierge_profile_id,property_id,metadata")
    .eq("id", reservationId)
    .maybeSingle<ReservationRow>();
  if (error) return deny(500, "Impossible de vÃ©rifier la rÃ©servation.");
  if (!reservation) return forbidden();
  if (reservation.concierge_profile_id !== input.conciergeProfileId) return forbidden();
  if (input.actorRole === "owner" && reservation.owner_profile_id !== input.actorProfileId) return forbidden();

  const canonicalOwnerId = propertyAuthorization.ownerProfileId ?? ownerProfileId;
  if (canonicalOwnerId && reservation.owner_profile_id !== canonicalOwnerId) return conflict();

  const reservationHousingId = getHousingReferenceId({
    propertyId: reservation.property_id,
    metadata: metadataRecord(reservation.metadata),
  });
  const requestedHousingId = getHousingReferenceId({ propertyId, metadata });

  if (propertyId && reservation.property_id && propertyId !== reservation.property_id) {
    const sameHousing = requestedHousingId && reservationHousingId && requestedHousingId === reservationHousingId;
    if (!sameHousing) return conflict();
  }

  if (requestedHousingId && reservationHousingId && requestedHousingId !== reservationHousingId) {
    return conflict();
  }

  const canonicalReservationPropertyId =
    reservation.property_id && UUID_RE.test(reservation.property_id) ? reservation.property_id : null;

  return {
    ok: true,
    ownerProfileId: reservation.owner_profile_id,
    propertyId: propertyAuthorization.propertyId ?? canonicalReservationPropertyId,
    housingId: propertyAuthorization.housingId ?? reservationHousingId ?? null,
    reservationId: reservation.id,
  };
}
