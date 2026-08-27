import { NextRequest, NextResponse } from "next/server";
import {
  OWNER_RESERVATION_ROLES,
  cleanString,
  isRecord,
  profileDisplayName,
  reservationToTravelerStay,
  type ProfileMini,
  type PropertyMini,
  type ReservationRow,
} from "@/app/api/_shared/reservations";
import { recordWorkflowEvent } from "@/app/api/_shared/workflowEvents";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { collectHousingReferenceIds, getListingLabel } from "@/app/lib/listingReferences";
import { requireApiRole } from "@/server/auth/roleGuards";

const dbAny = asLooseSupabaseClient(db);

function toIsoString(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toPositiveInteger(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= 0) return parsed;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const guard = await requireApiRole(req, OWNER_RESERVATION_ROLES);
    if (!guard.ok) return guard.response;

    const { userId, role } = guard.auth;
    const url = new URL(req.url);
    const status = cleanString(url.searchParams.get("status"));
    const conciergeProfileId = cleanString(url.searchParams.get("concierge_profile_id"));

    let query = dbAny
      .from("reservations")
      .select("*")
      .order("check_in_at", { ascending: false })
      .limit(160);

    if (role !== "admin" && role !== "super_admin") {
      query = query.eq("owner_profile_id", userId);
    }

    if (status) query = query.eq("status", status);
    if (conciergeProfileId) query = query.eq("concierge_profile_id", conciergeProfileId);

    const { data, error } = await query;
    if (error) {
      console.error("[GET /api/owner/reservations] DB error:", error);
      return NextResponse.json({ error: "Erreur chargement reservations" }, { status: 500 });
    }

    const reservations = (data ?? []) as ReservationRow[];
    const profileIds = Array.from(new Set(reservations.flatMap((item) => [item.owner_profile_id, item.concierge_profile_id]).filter(Boolean)));
    const propertyIds = Array.from(new Set(reservations.map((item) => item.property_id).filter(Boolean)));
    const housingIds = collectHousingReferenceIds(
      reservations.map((reservation) => ({ propertyId: reservation.property_id ?? null, metadata: reservation.metadata ?? null })),
    );

    const numericHousingIds = housingIds.filter((id) => /^\d+$/.test(id)).map((id) => Number(id));

    const [{ data: profiles }, { data: properties }, { data: housings }] = await Promise.all([
      profileIds.length
        ? dbAny.from("profiles").select("id,first_name,last_name,company_name,username,email").in("id", profileIds)
        : Promise.resolve({ data: [] }),
      propertyIds.length
        ? dbAny.from("properties").select("id,name,city").in("id", propertyIds)
        : Promise.resolve({ data: [] }),
      numericHousingIds.length
        ? dbAny.from("housing").select("id,nom_logement,ville").in("id", numericHousingIds)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map<string, ProfileMini>(((profiles ?? []) as ProfileMini[]).map((item) => [item.id, item]));
    const propertyMap = new Map<string, PropertyMini>(((properties ?? []) as PropertyMini[]).map((item) => [item.id, item]));
    const propertyNameById = new Map(
      Array.from(propertyMap.entries()).map(([id, item]) => [id, cleanString(item.name) ?? (item.city ? `Logement à ${item.city}` : "Logement")]),
    );
    const housingNameById = new Map(
      (((housings ?? []) as Array<{ id: number; nom_logement?: string | null; ville?: string | null }>)).map((item) => [
        String(item.id),
        cleanString(item.nom_logement) ?? (item.ville ? `Logement à ${item.ville}` : "Logement"),
      ]),
    );

    return NextResponse.json({
      reservations: reservations.map((reservation) => {
        const ownerName = profileDisplayName(profileMap.get(reservation.owner_profile_id), "Propriétaire");
        const conciergeName = profileDisplayName(profileMap.get(reservation.concierge_profile_id), "Conciergerie");
        const propertyLabel =
          getListingLabel(
            {
              propertyId: reservation.property_id ?? null,
              metadata: reservation.metadata ?? null,
            },
            { propertyNameById, housingNameById },
          ) ?? "Logement à renseigner";

        return {
          ...reservation,
          owner_name: ownerName,
          concierge_name: conciergeName,
          property_label: propertyLabel,
          stay: reservationToTravelerStay({
            reservation,
            ownerName,
            propertyLabel,
            missions: [],
          }),
        };
      }),
    });
  } catch (error) {
    console.error("[GET /api/owner/reservations] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireApiRole(req, OWNER_RESERVATION_ROLES);
    if (!guard.ok) return guard.response;

    const { userId } = guard.auth;
    const body = (await req.json()) as Record<string, unknown>;
    const payload = isRecord(body.reservation) ? body.reservation : body;

    const conciergeProfileId = cleanString(payload.concierge_profile_id);
    const propertyId = cleanString(payload.property_id);
    const contractId = cleanString(payload.contract_id);
    const checkInAt = toIsoString(payload.check_in_at ?? payload.check_in ?? payload.arrival_date);
    const checkOutAt = toIsoString(payload.check_out_at ?? payload.check_out ?? payload.departure_date);

    if (!conciergeProfileId || !checkInAt || !checkOutAt) {
      return NextResponse.json(
        { error: "concierge_profile_id, check_in_at et check_out_at sont requis." },
        { status: 400 },
      );
    }

    if (new Date(checkOutAt).getTime() <= new Date(checkInAt).getTime()) {
      return NextResponse.json({ error: "La date de départ doit être postérieure à la date d'arrivée." }, { status: 400 });
    }

    const { data: collaboration, error: collaborationError } = await dbAny
      .from("concierge_owner_matches")
      .select("id")
      .eq("owner_profile_id", userId)
      .eq("concierge_profile_id", conciergeProfileId)
      .in("match_status", ["new", "contacted"])
      .limit(1)
      .maybeSingle();

    if (collaborationError) {
      console.error("[POST /api/owner/reservations] collaboration error:", collaborationError);
      return NextResponse.json({ error: "Impossible de vérifier la collaboration active." }, { status: 500 });
    }

    if (!collaboration) {
      return NextResponse.json(
        { error: "Aucune collaboration active entre ce propriétaire et cette conciergerie." },
        { status: 400 },
      );
    }

    const metadata = isRecord(payload.metadata) ? payload.metadata : {};
    const insertPayload = {
      contract_id: contractId,
      owner_profile_id: userId,
      concierge_profile_id: conciergeProfileId,
      property_id: propertyId,
      source: cleanString(payload.source) ?? "manual_owner",
      external_reference: cleanString(payload.external_reference),
      channel: cleanString(payload.channel),
      traveler_first_name: cleanString(payload.traveler_first_name ?? payload.first_name),
      traveler_last_name: cleanString(payload.traveler_last_name ?? payload.last_name),
      traveler_phone: cleanString(payload.traveler_phone ?? payload.phone),
      traveler_email: cleanString(payload.traveler_email ?? payload.email),
      guest_count: toPositiveInteger(payload.guest_count),
      adults_count: toPositiveInteger(payload.adults_count ?? payload.adults),
      children_count: toPositiveInteger(payload.children_count ?? payload.children),
      infants_count: toPositiveInteger(payload.infants_count ?? payload.infants),
      pets_count: toPositiveInteger(payload.pets_count ?? payload.pets),
      check_in_at: checkInAt,
      check_out_at: checkOutAt,
      arrival_time_window: cleanString(payload.arrival_time_window),
      departure_time_window: cleanString(payload.departure_time_window),
      access_instructions: cleanString(payload.access_instructions),
      owner_notes: cleanString(payload.owner_notes ?? payload.notes),
      concierge_notes: null,
      status: cleanString(payload.status) ?? "shared",
      created_by_profile_id: userId,
      metadata: {
        ...metadata,
        special_requests: Array.isArray(payload.special_requests) ? payload.special_requests : metadata.special_requests,
        property_label: cleanString(payload.property_label) ?? cleanString(metadata.property_label),
      },
    };

    const { data, error } = await dbAny
      .from("reservations")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error || !data) {
      console.error("[POST /api/owner/reservations] insert error:", error);
      return NextResponse.json({ error: "Création de réservation impossible." }, { status: 500 });
    }

    await recordWorkflowEvent(dbAny, {
      actorProfileId: userId,
      ownerProfileId: userId,
      conciergeProfileId,
      reservationId: (data as ReservationRow).id,
      eventType: "reservation_created",
      title: "Reservation creee par le proprietaire",
      body: "Le proprietaire a partage un nouveau sejour avec sa conciergerie.",
      metadata: {
        source: cleanString(payload.source) ?? "manual_owner",
        channel: cleanString(payload.channel),
      },
    });

    return NextResponse.json({ reservation: data }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/owner/reservations] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
