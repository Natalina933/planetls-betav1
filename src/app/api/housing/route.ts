import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import type { Json } from "@/types/supabase";
import type { ConciergeHousing, HousingInsert } from "@/types/housing";
import { buildHousingMutationPayload, canAccessHousing } from "@/types/housing";
import { EMPTY_HOUSING_STOCK_MANAGEMENT } from "@/app/lib/housingStock";

const DEFAULT_LOGEMENT_PHOTO = "/images/default-logement.png";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isNormalizedHousingPayload(value: unknown): value is Partial<ConciergeHousing> {
  return Boolean(value && typeof value === "object" && ("owner" in (value as Record<string, unknown>) || "locationInfo" in (value as Record<string, unknown>)));
}

function coerceLegacyPayload(body: Record<string, unknown>, userId: string): HousingInsert {
  const infos = (body.infos ?? {}) as Record<string, unknown>;
  const location = (body.location ?? {}) as Record<string, unknown>;
  const proprietaire = (body.proprietaire ?? {}) as Record<string, unknown>;

  return {
    external_id: typeof body.external_id === "number" ? body.external_id : null,
    nom_logement: cleanString(body.nom_logement) || cleanString(infos.nomLogement) || null,
    ville: cleanString(body.ville) || cleanString(location.city) || null,
    adresse: cleanString(body.adresse) || cleanString(infos.adresse) || null,
    plateforme: cleanString(body.plateforme) || cleanString(location.plateformePrincipale) || null,
    statut: cleanString(body.statut) || "draft",
    photo_principale:
      cleanString(body.photo_principale) ||
      (Array.isArray(infos.photos) ? cleanString(infos.photos[0]) : "") ||
      null,
    infos: (body.infos ?? null) as Json | null,
    proprietaire: {
      ...proprietaire,
      owner_profile_id:
        cleanString(proprietaire.owner_profile_id) ||
        cleanString(proprietaire.id) ||
        cleanString(proprietaire.profile_id) ||
        null,
      manager_profile_id:
        cleanString(proprietaire.manager_profile_id) ||
        cleanString(proprietaire.concierge_profile_id) ||
        userId,
    } as Json,
    location: (body.location ?? null) as Json | null,
    menage: (body.menage ?? null) as Json | null,
    planning: (body.planning ?? null) as Json | null,
    documents: (body.documents ?? null) as Json | null,
    notes: (body.notes ?? null) as Json | null,
    tarifs: (body.tarifs ?? null) as Json | null,
    contrat: (body.contrat ?? null) as Json | null,
  };
}

function coerceIncomingPayload(rawBody: unknown, userId: string): HousingInsert {
  if (!rawBody || typeof rawBody !== "object") {
    throw new Error("Payload invalide.");
  }

  if (isNormalizedHousingPayload(rawBody)) {
    const body = rawBody as Partial<ConciergeHousing>;
    return buildHousingMutationPayload({
      id: 0,
      external_id: body.external_id ?? null,
      nom_logement: body.nom_logement ?? "",
      plateforme: body.plateforme ?? "",
      statut: body.statut ?? "draft",
      photo_principale: body.photo_principale ?? null,
      creationMode: body.creationMode ?? "manual",
      owner: {
        profileId: body.owner?.profileId ?? null,
        managerProfileId: body.owner?.managerProfileId ?? userId,
        fullName: body.owner?.fullName ?? "",
        email: body.owner?.email ?? "",
        phone: body.owner?.phone ?? "",
        secondaryPhone: body.owner?.secondaryPhone ?? "",
        address: body.owner?.address ?? "",
        primaryContactName: body.owner?.primaryContactName ?? "",
        primaryContactEmail: body.owner?.primaryContactEmail ?? "",
        primaryContactPhone: body.owner?.primaryContactPhone ?? "",
        companyName: body.owner?.companyName ?? "",
        city: body.owner?.city ?? "",
        notes: body.owner?.notes ?? "",
        source: body.owner?.source ?? "manual",
      },
      locationInfo: {
        addressLine1: body.locationInfo?.addressLine1 ?? "",
        addressLine2: body.locationInfo?.addressLine2 ?? "",
        postalCode: body.locationInfo?.postalCode ?? "",
        city: body.locationInfo?.city ?? "",
        country: body.locationInfo?.country ?? "France",
        accessCode: body.locationInfo?.accessCode ?? "",
        floor: body.locationInfo?.floor ?? "",
        entryInstructions: body.locationInfo?.entryInstructions ?? "",
      },
      characteristics: {
        propertyType: body.characteristics?.propertyType ?? "",
        photos: body.characteristics?.photos ?? [],
        surfaceSqm: body.characteristics?.surfaceSqm ?? null,
        roomCount: body.characteristics?.roomCount ?? null,
        bedroomCount: body.characteristics?.bedroomCount ?? null,
        bathroomCount: body.characteristics?.bathroomCount ?? null,
        bathrooms: body.characteristics?.bathrooms ?? [],
        bedCount: body.characteristics?.bedCount ?? null,
        guestCapacity: body.characteristics?.guestCapacity ?? null,
        wifiInfo: body.characteristics?.wifiInfo ?? "",
        keyCount: body.characteristics?.keyCount ?? null,
        terrace: body.characteristics?.terrace ?? false,
        stairs: body.characteristics?.stairs ?? false,
        pool: body.characteristics?.pool ?? false,
        petsAllowed: body.characteristics?.petsAllowed ?? false,
        nonSmoking: body.characteristics?.nonSmoking ?? false,
        barbecue: body.characteristics?.barbecue ?? false,
        chequeRequired: body.characteristics?.chequeRequired ?? false,
        amenities: body.characteristics?.amenities ?? [],
        description: body.characteristics?.description ?? "",
      },
      stockManagement: body.stockManagement ?? EMPTY_HOUSING_STOCK_MANAGEMENT,
      services: body.services ?? { items: [], housekeepingNotes: "", internalNotes: "" },
      timeline: body.timeline ?? [],
      documentsList: body.documentsList ?? [],
      pricing: body.pricing ?? {
        currency: "EUR",
        baseRate: null,
        nightlyRate: null,
        cleaningFee: null,
        securityDeposit: null,
        commissionRate: null,
        totalContractValue: null,
      },
      contractInfo: body.contractInfo ?? {
        contractUrl: "",
        signedAt: "",
        autoRenew: false,
        quoteId: null,
        quoteNumber: "",
      },
    });
  }

  return coerceLegacyPayload(rawBody as Record<string, unknown>, userId);
}

export async function GET(req: NextRequest) {
  try {
    const { userId, role, isAdmin } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const url = new URL(req.url);
    const ville = (url.searchParams.get("ville") ?? "").trim();
    const platform = (url.searchParams.get("plateforme") ?? "").trim();

    let query = db.from("housing").select("*");
    if (ville) query = query.ilike("ville", `%${ville}%`);
    if (platform) query = query.eq("plateforme", platform);

    const { data, error } = await query.order("updated_at", { ascending: false }).order("id", { ascending: false });
    if (error) {
      console.error("[GET /api/housing] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    const rows = (data ?? []).filter((item) => canAccessHousing(item.proprietaire, userId, role, isAdmin));
    return NextResponse.json(
      rows.map((item) => ({
        ...item,
        photo_principale: cleanString(item.photo_principale) || DEFAULT_LOGEMENT_PHOTO,
      })),
    );
  } catch (err) {
    console.error("[GET /api/housing] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!["admin", "super_admin", "concierge", "concierge_pro"].includes(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const rawBody = await req.json();
    const payload = coerceIncomingPayload(rawBody, userId);

    if (!cleanString(payload.nom_logement)) {
      return NextResponse.json({ error: "Le nom du logement est obligatoire." }, { status: 400 });
    }

    const { data, error } = await db.from("housing").insert(payload).select().single();
    if (error) {
      console.error("[POST /api/housing] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/housing] ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
