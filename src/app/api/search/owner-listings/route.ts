import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";

interface DbErrorLike {
  code?: string;
  message?: string;
}

interface ActiveService {
  id: string;
  label: string;
}

interface OwnerListingResult {
  id: string;
  source: "property" | "housing";
  title: string;
  city: string;
  postal_code: string | null;
  property_type: string | null;
  surface_m2: number | null;
  owner_profile_id: string | null;
  owner_name: string;
  status: string | null;
  services_wanted: string[];
  services_wanted_ids: number[];
  matched_services: string[];
  compatibility_ratio: string;
  compatibility_score: number;
  distance_km: number | null;
  budget_note: string | null;
}

interface OwnerProfileLead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  city: string | null;
  postal_code: string | null;
  location: string | null;
  option: string | null;
  additional_info: string | null;
  role: string | null;
  category: string | null;
  search_target: string | null;
}

const SERVICE_KEYS = new Set([
  "service",
  "services",
  "serviceswanted",
  "services_wanted",
  "desired_services",
  "wanted_services",
  "requested_services",
  "mission_types",
  "missiontypes",
  "besoins_services",
  "besoinsservices",
]);

const splitServices = (value: string): string[] =>
  value
    .split(/[;,|]/g)
    .map((item) => item.trim())
    .filter(Boolean);

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const ALLOWED_SEARCH_ROLES = new Set([
  "admin",
  "super_admin",
  "concierge",
  "concierge_pro",
]);

const getDbErrorMessage = (error: DbErrorLike | null, fallback: string): string => {
  const code = error?.code ?? "";

  if (code === "42P01" || code === "PGRST205" || code === "PGRST204") {
    return "Tables de recherche introuvables. Verifiez les migrations de la base.";
  }

  return error?.message ?? fallback;
};

const parsePostalCode = (value?: string | null): string | null => {
  if (!value) return null;
  const match = value.match(/\b\d{5}\b/);
  return match ? match[0] : null;
};

const parseNumberFromUnknown = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").match(/\d+(\.\d+)?/);
    if (!normalized) return null;
    const parsed = Number(normalized[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const collectStringsDeep = (value: unknown, output: Set<string>) => {
  if (value === null || value === undefined) return;
  if (typeof value === "string") {
    splitServices(value).forEach((entry) => output.add(entry));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStringsDeep(item, output));
    return;
  }
  const obj = getRecord(value);
  if (!obj) return;
  Object.values(obj).forEach((child) => collectStringsDeep(child, output));
};

const parseServicesFromProfileFields = (
  optionValue: string | null,
  additionalInfoValue: string | null,
): string[] => {
  const collected = new Set<string>();
  const parseCandidate = (raw: string | null) => {
    if (!raw) return;
    const trimmed = raw.trim();
    if (!trimmed) return;

    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        collectStringsDeep(parsed, collected);
        return;
      } catch {
        // fallback to plain split
      }
    }

    splitServices(trimmed).forEach((entry) => collected.add(entry));
  };

  parseCandidate(optionValue);
  parseCandidate(additionalInfoValue);

  return Array.from(collected).filter(Boolean);
};

const toRad = (value: number): number => (value * Math.PI) / 180;

const haversineKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

type Coordinates = { lat: number; lon: number };

const geocodeLocation = async (
  query: string,
  cache: Map<string, Coordinates | null>,
): Promise<Coordinates | null> => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return null;
  if (cache.has(normalizedQuery)) return cache.get(normalizedQuery) ?? null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(normalizedQuery)}`,
      {
        headers: {
          "User-Agent": "planetls-beta-search/1.0",
          Accept: "application/json",
        },
      },
    );
    if (!response.ok) {
      cache.set(normalizedQuery, null);
      return null;
    }

    const data = (await response.json()) as Array<{ lat?: string; lon?: string }>;
    if (!Array.isArray(data) || data.length === 0) {
      cache.set(normalizedQuery, null);
      return null;
    }

    const lat = Number(data[0].lat ?? "");
    const lon = Number(data[0].lon ?? "");
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      cache.set(normalizedQuery, null);
      return null;
    }

    const coords = { lat, lon };
    cache.set(normalizedQuery, coords);
    return coords;
  } catch {
    cache.set(normalizedQuery, null);
    return null;
  }
};

const getRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const extractOwnerId = (proprietaire: unknown): string | null => {
  const ownerObj = getRecord(proprietaire);
  if (!ownerObj) return null;

  const ownerId =
    typeof ownerObj.id === "string"
      ? ownerObj.id
      : typeof ownerObj.userId === "string"
        ? ownerObj.userId
        : typeof ownerObj.profile_id === "string"
          ? ownerObj.profile_id
          : typeof ownerObj.owner_id === "string"
            ? ownerObj.owner_id
            : null;

  return ownerId && isUuidLike(ownerId) ? ownerId : null;
};

const extractOwnerName = (proprietaire: unknown): string => {
  const ownerObj = getRecord(proprietaire);
  if (!ownerObj) return "Proprietaire";

  const firstName =
    typeof ownerObj.prenom === "string"
      ? ownerObj.prenom
      : typeof ownerObj.first_name === "string"
        ? ownerObj.first_name
        : "";
  const lastName =
    typeof ownerObj.nom === "string"
      ? ownerObj.nom
      : typeof ownerObj.last_name === "string"
        ? ownerObj.last_name
        : "";

  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) return fullName;
  if (typeof ownerObj.name === "string" && ownerObj.name.trim()) return ownerObj.name.trim();
  if (typeof ownerObj.username === "string" && ownerObj.username.trim()) {
    return ownerObj.username.trim();
  }
  return "Proprietaire";
};

const formatOwnerProfileName = (owner: OwnerProfileLead): string => {
  const fullName = `${owner.first_name ?? ""} ${owner.last_name ?? ""}`.trim();
  if (fullName) return fullName;
  if (owner.username && owner.username.trim()) return owner.username.trim();
  return "Proprietaire";
};

const collectServicesFromJson = (value: unknown): string[] => {
  const collected = new Set<string>();

  const walk = (node: unknown, parentKey = "", depth = 0) => {
    if (depth > 5 || node === null || node === undefined) return;

    if (Array.isArray(node)) {
      if (SERVICE_KEYS.has(parentKey)) {
        node.forEach((item) => {
          if (typeof item === "string") {
            splitServices(item).forEach((service) => collected.add(service));
          }
        });
      }
      node.forEach((item) => walk(item, parentKey, depth + 1));
      return;
    }

    if (typeof node === "string") {
      if (SERVICE_KEYS.has(parentKey)) {
        splitServices(node).forEach((service) => collected.add(service));
      }
      return;
    }

    const obj = getRecord(node);
    if (!obj) return;

    Object.entries(obj).forEach(([rawKey, child]) => {
      const key = rawKey.toLowerCase().replace(/\s+/g, "");
      walk(child, key, depth + 1);
    });
  };

  walk(value);
  return Array.from(collected);
};

const parseActiveServices = (
  availabilityHours: string | null,
  serviceLabelById: Map<number, string>,
): ActiveService[] => {
  if (!availabilityHours) return [];

  try {
    const parsed = JSON.parse(availabilityHours) as unknown;
    const payload = getRecord(parsed);
    if (!payload) return [];

    const activeMap = new Map<string, string>();

    const missionProfile = getRecord(payload.missionProfile);
    const missionProfileMissions = Array.isArray(missionProfile?.missions)
      ? missionProfile?.missions
      : [];

    missionProfileMissions.forEach((mission) => {
      const missionObj = getRecord(mission);
      if (!missionObj) return;
      if (missionObj.isActive !== true) return;

      const id = typeof missionObj.id === "string" ? missionObj.id : "";
      const label = typeof missionObj.label === "string" ? missionObj.label : id;
      if (!id && !label) return;
      const key = id || normalize(label);
      activeMap.set(key, label || id);
    });

    const missionCatalog = Array.isArray(payload.missionCatalog) ? payload.missionCatalog : [];
    const catalogById = new Map<string, string>();
    missionCatalog.forEach((item) => {
      const obj = getRecord(item);
      if (!obj) return;
      const id = typeof obj.id === "string" ? obj.id : "";
      const label = typeof obj.label === "string" ? obj.label : "";
      if (id && label) catalogById.set(id, label);
    });

    const preferences = getRecord(payload.preferences);
    const acceptedIds = Array.isArray(preferences?.acceptedMissionTypeIds)
      ? preferences?.acceptedMissionTypeIds
      : [];
    acceptedIds.forEach((idValue) => {
      if (typeof idValue !== "string" || !idValue.trim()) return;
      const id = idValue.trim();
      const maybeNumeric = Number(id);
      const label =
        catalogById.get(id) ??
        (Number.isFinite(maybeNumeric) ? serviceLabelById.get(maybeNumeric) : undefined) ??
        id;
      activeMap.set(id, label);
    });

    return Array.from(activeMap.entries()).map(([id, label]) => ({ id, label }));
  } catch {
    return [];
  }
};

const computeCompatibility = (
  wantedLabels: string[],
  wantedIds: number[],
  activeLabelsNormalized: Set<string>,
  activeIdsNormalized: Set<string>,
) => {
  const matched = new Set<string>();

  wantedLabels.forEach((service) => {
    if (activeLabelsNormalized.has(normalize(service))) {
      matched.add(service);
    }
  });

  wantedIds.forEach((serviceId) => {
    if (activeIdsNormalized.has(String(serviceId))) {
      matched.add(String(serviceId));
    }
  });

  const requested = Math.max(wantedLabels.length, wantedIds.length);
  const matchedCount = matched.size;
  const score = requested > 0 ? Math.round((matchedCount / requested) * 100) : 0;

  return {
    matchedServices: Array.from(matched),
    matchedCount,
    requested,
    score,
    ratio: requested > 0 ? `${matchedCount}/${requested}` : "0/0",
  };
};

export async function GET(req: NextRequest) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_SEARCH_ROLES.has(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const url = new URL(req.url);
    const cityFilterRaw = (url.searchParams.get("city") ?? "").trim();
    const postalCodeFilterRaw = (url.searchParams.get("postalCode") ?? "").trim();
    const countryWideRaw = (url.searchParams.get("countryWide") ?? "").trim().toLowerCase();
    const countryWide = countryWideRaw === "1" || countryWideRaw === "true";
    const radiusKmRaw = Number(url.searchParams.get("radiusKm") ?? "0");
    const limitRaw = Number(url.searchParams.get("limit") ?? "60");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 60;
    const requestedServicesRaw = (url.searchParams.get("services") ?? "").trim();
    const requestedServices = requestedServicesRaw
      ? splitServices(requestedServicesRaw)
      : [];
    const requestedServicesNormalized = new Set(requestedServices.map((service) => normalize(service)));

    const [{ data: conciergeProfile, error: profileError }, { data: servicesCatalog, error: catalogError }] =
      await Promise.all([
        db
          .from("profiles")
          .select(
            "id, city, location, option, postal_code, country, service_area, service_radius_km, availability_hours",
          )
          .eq("id", userId)
          .maybeSingle(),
        db.from("services_catalog").select("id, service, category"),
      ]);

    if (profileError) {
      console.error("[GET /api/search/owner-listings] profile error:", profileError);
      return NextResponse.json(
        { error: getDbErrorMessage(profileError, "Erreur lecture profil concierge") },
        { status: 500 },
      );
    }

    if (!conciergeProfile) {
      return NextResponse.json({ error: "Profil concierge introuvable" }, { status: 404 });
    }

    if (catalogError) {
      console.error("[GET /api/search/owner-listings] catalog error:", catalogError);
      return NextResponse.json(
        { error: getDbErrorMessage(catalogError, "Erreur lecture catalogue services") },
        { status: 500 },
      );
    }

    const serviceLabelById = new Map<number, string>();
    (servicesCatalog ?? []).forEach((service) => {
      serviceLabelById.set(service.id, service.service);
    });

    const missionServices = parseActiveServices(
      conciergeProfile.availability_hours,
      serviceLabelById,
    );
    const signupOptionServices = parseServicesFromProfileFields(
      conciergeProfile.option ?? null,
      null,
    ).map((label) => ({
      id: normalize(label).replace(/\s+/g, "-"),
      label,
    }));
    const activeServices = missionServices.length > 0 ? missionServices : signupOptionServices;
    const activeLabelsNormalized = new Set(activeServices.map((service) => normalize(service.label)));
    const activeIdsNormalized = new Set(activeServices.map((service) => service.id));

    const effectiveCityFilter = countryWide
      ? ""
      : cityFilterRaw ||
        conciergeProfile.location ||
        conciergeProfile.city ||
        conciergeProfile.service_area ||
        "";
    const effectivePostalCodeFilter = countryWide ? "" : postalCodeFilterRaw;
    const effectiveRadiusKm = countryWide
      ? 0
      : Number.isFinite(radiusKmRaw) && radiusKmRaw > 0
        ? radiusKmRaw
        : Number(conciergeProfile.service_radius_km ?? 30);

    let propertiesQuery = db
      .from("properties")
      .select("id, name, city, owner_id, status")
      .limit(400);
    if (effectiveCityFilter) {
      propertiesQuery = propertiesQuery.ilike("city", `%${effectiveCityFilter}%`);
    }

    let housingQuery = db
      .from("housing")
      .select("id, nom_logement, ville, adresse, statut, infos, proprietaire, location, menage, notes")
      .neq("statut", "deleted")
      .limit(400);
    if (effectiveCityFilter) {
      housingQuery = housingQuery.ilike("ville", `%${effectiveCityFilter}%`);
    }

    const ownerProfilesQuery = db
      .from("profiles")
      .select(
        "id, first_name, last_name, username, city, postal_code, location, option, additional_info, role, category, search_target",
      )
      .or("role.eq.owner,role.eq.owner_pro,category.ilike.proprietaire%,search_target.ilike.concierge%")
      .limit(600);

    const [
      { data: propertiesRows, error: propertiesError },
      { data: housingRows, error: housingError },
      { data: ownerProfilesRowsRaw, error: ownerProfilesError },
    ] = await Promise.all([propertiesQuery, housingQuery, ownerProfilesQuery]);

    if (propertiesError) {
      console.error("[GET /api/search/owner-listings] properties error:", propertiesError);
      return NextResponse.json(
        { error: getDbErrorMessage(propertiesError, "Erreur lecture proprietes") },
        { status: 500 },
      );
    }
    if (housingError) {
      console.error("[GET /api/search/owner-listings] housing error:", housingError);
      return NextResponse.json(
        { error: getDbErrorMessage(housingError, "Erreur lecture logements") },
        { status: 500 },
      );
    }
    if (ownerProfilesError) {
      console.error("[GET /api/search/owner-listings] owner profiles error:", ownerProfilesError);
      return NextResponse.json(
        { error: getDbErrorMessage(ownerProfilesError, "Erreur lecture profils proprietaires") },
        { status: 500 },
      );
    }

    const ownerProfilesRows = (ownerProfilesRowsRaw ?? []) as OwnerProfileLead[];

    const ownerIds = new Set<string>();
    (propertiesRows ?? []).forEach((property) => {
      if (property.owner_id) ownerIds.add(property.owner_id);
    });
    (housingRows ?? []).forEach((housing) => {
      const ownerId = extractOwnerId(housing.proprietaire);
      if (ownerId) ownerIds.add(ownerId);
    });

    const ownerIdList = Array.from(ownerIds);
    const ownersById = new Map<
      string,
      { first_name: string | null; last_name: string | null; username: string | null }
    >();
    const ownerServiceIdsByOwnerId = new Map<string, Set<number>>();
    const ownerServiceIdsByPropertyId = new Map<string, Set<number>>();
    const ownerBudgetByOwnerId = new Map<string, { avg: number; currency: string }>();

    if (ownerIdList.length > 0) {
      const [{ data: ownersRows, error: ownersError }, { data: missionRows, error: missionError }] =
        await Promise.all([
          db
            .from("profiles")
            .select("id, first_name, last_name, username")
            .in("id", ownerIdList),
          db
            .from("missions")
            .select("owner_profile_id, property_id, service_id, amount, currency")
            .in("owner_profile_id", ownerIdList)
            .limit(1200),
        ]);

      if (ownersError) {
        console.error("[GET /api/search/owner-listings] owners error:", ownersError);
        return NextResponse.json(
          { error: getDbErrorMessage(ownersError, "Erreur lecture proprietaires") },
          { status: 500 },
        );
      }
      if (missionError) {
        console.error("[GET /api/search/owner-listings] mission error:", missionError);
        return NextResponse.json(
          { error: getDbErrorMessage(missionError, "Erreur lecture missions proprietaires") },
          { status: 500 },
        );
      }

      (ownersRows ?? []).forEach((owner) => {
        ownersById.set(owner.id, {
          first_name: owner.first_name,
          last_name: owner.last_name,
          username: owner.username,
        });
      });

      const budgetAccumulator = new Map<string, { sum: number; count: number; currency: string }>();

      (missionRows ?? []).forEach((mission) => {
        const ownerId = mission.owner_profile_id;
        if (!ownerId) return;

        if (typeof mission.service_id === "number") {
          if (!ownerServiceIdsByOwnerId.has(ownerId)) {
            ownerServiceIdsByOwnerId.set(ownerId, new Set<number>());
          }
          ownerServiceIdsByOwnerId.get(ownerId)?.add(mission.service_id);

          if (mission.property_id) {
            if (!ownerServiceIdsByPropertyId.has(mission.property_id)) {
              ownerServiceIdsByPropertyId.set(mission.property_id, new Set<number>());
            }
            ownerServiceIdsByPropertyId.get(mission.property_id)?.add(mission.service_id);
          }
        }

        if (typeof mission.amount === "number" && mission.amount > 0) {
          const existing = budgetAccumulator.get(ownerId) ?? {
            sum: 0,
            count: 0,
            currency: mission.currency || "EUR",
          };
          existing.sum += mission.amount;
          existing.count += 1;
          if (mission.currency) existing.currency = mission.currency;
          budgetAccumulator.set(ownerId, existing);
        }
      });

      budgetAccumulator.forEach((value, ownerId) => {
        if (value.count <= 0) return;
        ownerBudgetByOwnerId.set(ownerId, {
          avg: Math.round((value.sum / value.count) * 100) / 100,
          currency: value.currency,
        });
      });
    }

    const buildOwnerNameFromProfile = (ownerId: string | null): string => {
      if (!ownerId) return "Proprietaire";
      const owner = ownersById.get(ownerId);
      if (!owner) return "Proprietaire";

      const fullName = `${owner.first_name ?? ""} ${owner.last_name ?? ""}`.trim();
      if (fullName) return fullName;
      return owner.username ?? "Proprietaire";
    };

    const buildBudgetNote = (ownerId: string | null): string | null => {
      if (!ownerId) return null;
      const budget = ownerBudgetByOwnerId.get(ownerId);
      if (!budget) return null;

      return `Budget moyen mission: ${budget.avg.toFixed(2)} ${budget.currency}`;
    };

    const listings: OwnerListingResult[] = [];

    (propertiesRows ?? []).forEach((property) => {
      const ownerId = property.owner_id ?? null;
      const ownerServiceIds = new Set<number>();

      ownerServiceIdsByPropertyId.get(property.id)?.forEach((serviceId) => ownerServiceIds.add(serviceId));
      if (ownerId) {
        ownerServiceIdsByOwnerId.get(ownerId)?.forEach((serviceId) => ownerServiceIds.add(serviceId));
      }

      const servicesWantedIds = Array.from(ownerServiceIds);
      const servicesWanted = servicesWantedIds
        .map((serviceId) => serviceLabelById.get(serviceId))
        .filter((label): label is string => Boolean(label));

      const compatibility = computeCompatibility(
        servicesWanted,
        servicesWantedIds,
        activeLabelsNormalized,
        activeIdsNormalized,
      );

      listings.push({
        id: `property-${property.id}`,
        source: "property",
        title: property.name,
        city: property.city ?? "Ville non renseignee",
        postal_code: null,
        property_type: null,
        surface_m2: null,
        owner_profile_id: ownerId,
        owner_name: buildOwnerNameFromProfile(ownerId),
        status: property.status ?? null,
        services_wanted: servicesWanted,
        services_wanted_ids: servicesWantedIds,
        matched_services: compatibility.matchedServices,
        compatibility_ratio: compatibility.ratio,
        compatibility_score: compatibility.score,
        distance_km: null,
        budget_note: buildBudgetNote(ownerId),
      });
    });

    const representedOwnerIds = new Set<string>(
      listings
        .map((listing) => listing.owner_profile_id)
        .filter((ownerId): ownerId is string => typeof ownerId === "string" && ownerId.length > 0),
    );

    ownerProfilesRows.forEach((owner) => {
      const ownerId = owner.id;
      if (!ownerId || representedOwnerIds.has(ownerId)) return;

      const roleNormalized = normalize(owner.role ?? "");
      const categoryNormalized = normalize(owner.category ?? "");
      const searchTargetNormalized = normalize(owner.search_target ?? "");
      const isOwnerProfile =
        roleNormalized === "owner" ||
        roleNormalized === "owner_pro" ||
        categoryNormalized.startsWith("proprietaire") ||
        searchTargetNormalized.includes("concierge");
      if (!isOwnerProfile) return;

      const servicesWanted = parseServicesFromProfileFields(
        owner.option,
        owner.additional_info,
      );

      const compatibility = computeCompatibility(
        servicesWanted,
        [],
        activeLabelsNormalized,
        activeIdsNormalized,
      );

      const ownerName = formatOwnerProfileName(owner);
      const city = owner.city ?? owner.location ?? "Ville non renseignee";
      const postalCode = owner.postal_code ?? parsePostalCode(owner.location);

      listings.push({
        id: `owner-profile-${ownerId}`,
        source: "property",
        title: `Proprietaire: ${ownerName}`,
        city,
        postal_code: postalCode,
        property_type: "Profil proprietaire",
        surface_m2: null,
        owner_profile_id: ownerId,
        owner_name: ownerName,
        status: null,
        services_wanted: servicesWanted,
        services_wanted_ids: [],
        matched_services: compatibility.matchedServices,
        compatibility_ratio: compatibility.ratio,
        compatibility_score: compatibility.score,
        distance_km: null,
        budget_note: null,
      });
    });

    (housingRows ?? []).forEach((housing) => {
      const ownerId = extractOwnerId(housing.proprietaire);
      const ownerNameFromHousing = extractOwnerName(housing.proprietaire);
      const infosObj = getRecord(housing.infos);
      const locationObj = getRecord(housing.location);
      const menageObj = getRecord(housing.menage);

      const inferredServices = [
        ...collectServicesFromJson(infosObj),
        ...collectServicesFromJson(locationObj),
        ...collectServicesFromJson(menageObj),
        ...collectServicesFromJson(housing.notes),
      ];
      const serviceSet = new Set<string>(inferredServices);
      const ownerServiceIds = ownerId ? ownerServiceIdsByOwnerId.get(ownerId) : undefined;
      ownerServiceIds?.forEach((serviceId) => {
        const label = serviceLabelById.get(serviceId);
        if (label) serviceSet.add(label);
      });

      const servicesWanted = Array.from(serviceSet).filter(Boolean);
      const servicesWantedIds = ownerServiceIds ? Array.from(ownerServiceIds) : [];

      const compatibility = computeCompatibility(
        servicesWanted,
        servicesWantedIds,
        activeLabelsNormalized,
        activeIdsNormalized,
      );

      const surface =
        parseNumberFromUnknown(infosObj?.superficie) ??
        parseNumberFromUnknown(locationObj?.surface_m2) ??
        parseNumberFromUnknown(locationObj?.surfaceM2);

      const propertyType =
        (typeof infosObj?.categorie === "string" && infosObj.categorie) ||
        (typeof locationObj?.property_type === "string" && locationObj.property_type) ||
        (typeof locationObj?.type_bien === "string" && locationObj.type_bien) ||
        null;

      const postalCode =
        parsePostalCode(housing.adresse) ||
        parsePostalCode(typeof locationObj?.adresse === "string" ? locationObj.adresse : null);

      const nightlyPrice =
        parseNumberFromUnknown(locationObj?.prix_nuit) ??
        parseNumberFromUnknown(locationObj?.price_per_night);

      const nightlyBudgetNote =
        typeof nightlyPrice === "number" ? `Prix nuit estime: ${nightlyPrice.toFixed(2)} EUR` : null;

      listings.push({
        id: `housing-${housing.id}`,
        source: "housing",
        title: housing.nom_logement ?? `Logement #${housing.id}`,
        city: housing.ville ?? "Ville non renseignee",
        postal_code: postalCode,
        property_type: propertyType,
        surface_m2: surface,
        owner_profile_id: ownerId,
        owner_name: ownerId ? buildOwnerNameFromProfile(ownerId) : ownerNameFromHousing,
        status: housing.statut ?? null,
        services_wanted: servicesWanted,
        services_wanted_ids: servicesWantedIds,
        matched_services: compatibility.matchedServices,
        compatibility_ratio: compatibility.ratio,
        compatibility_score: compatibility.score,
        distance_km: null,
        budget_note: nightlyBudgetNote ?? buildBudgetNote(ownerId),
      });
    });

    const effectiveServiceFilter = new Set<string>();
    if (requestedServicesNormalized.size > 0) {
      requestedServicesNormalized.forEach((value) => effectiveServiceFilter.add(value));
    }

    const prefilteredListings = listings
      .filter((listing) => {
        if (effectiveCityFilter) {
          const cityNormalized = normalize(listing.city);
          if (!cityNormalized.includes(normalize(effectiveCityFilter))) {
            return false;
          }
        }

        if (effectivePostalCodeFilter) {
          if (!listing.postal_code || !listing.postal_code.startsWith(effectivePostalCodeFilter)) {
            return false;
          }
        }

        if (effectiveServiceFilter.size > 0) {
          const listingServices = new Set(
            listing.services_wanted.map((service) => normalize(service)),
          );
          const hasIntersection = Array.from(effectiveServiceFilter).some((service) =>
            listingServices.has(service),
          );
          if (!hasIntersection) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (b.compatibility_score !== a.compatibility_score) {
          return b.compatibility_score - a.compatibility_score;
        }
        return a.city.localeCompare(b.city);
      });

    const geocodeCache = new Map<string, Coordinates | null>();
    let distanceMode = countryWide ? "country_wide" : "city_only";
    let filteredListings = prefilteredListings;

    if (!countryWide && Number.isFinite(effectiveRadiusKm) && effectiveRadiusKm > 0) {
      const anchorCity =
        cityFilterRaw ||
        conciergeProfile.location ||
        conciergeProfile.city ||
        effectiveCityFilter;
      const anchorPostalCode =
        postalCodeFilterRaw || conciergeProfile.postal_code || effectivePostalCodeFilter;
      const conciergeLocationQuery = [
        anchorCity,
        anchorPostalCode,
        conciergeProfile.country || "France",
      ]
        .filter(Boolean)
        .join(" ");

      const conciergeCoords = await geocodeLocation(conciergeLocationQuery, geocodeCache);
      if (conciergeCoords) {
        distanceMode = "geo_km";
        const geocodedListings = [];
        const geocodeBudget = Math.max(limit * 3, 120);
        const candidates = prefilteredListings.slice(0, geocodeBudget);

        for (const listing of candidates) {
          const listingLocationQuery = [listing.city, listing.postal_code || "", "France"]
            .filter(Boolean)
            .join(" ");
          const listingCoords = await geocodeLocation(listingLocationQuery, geocodeCache);
          const distanceKm = listingCoords
            ? Math.round(
                haversineKm(
                  conciergeCoords.lat,
                  conciergeCoords.lon,
                  listingCoords.lat,
                  listingCoords.lon,
                ) * 10,
              ) / 10
            : null;

          geocodedListings.push({
            ...listing,
            distance_km: distanceKm,
          });
        }

        const notGeocodedTail = prefilteredListings.slice(candidates.length);
        const merged = [...geocodedListings, ...notGeocodedTail];

        filteredListings = merged.filter((listing) => {
          if (listing.distance_km === null) return true;
          return listing.distance_km <= effectiveRadiusKm;
        });
      }
    }

    filteredListings = filteredListings
      .sort((a, b) => {
        const aDistance = a.distance_km ?? Number.POSITIVE_INFINITY;
        const bDistance = b.distance_km ?? Number.POSITIVE_INFINITY;
        if (aDistance !== bDistance) return aDistance - bDistance;

        if (b.compatibility_score !== a.compatibility_score) {
          return b.compatibility_score - a.compatibility_score;
        }
        return a.city.localeCompare(b.city);
      })
      .slice(0, limit);

    return NextResponse.json({
      profile: {
        location: conciergeProfile.location,
        city: conciergeProfile.city,
        postal_code: conciergeProfile.postal_code,
        country: conciergeProfile.country,
        service_area: conciergeProfile.service_area,
        service_radius_km: conciergeProfile.service_radius_km,
      },
      active_services: activeServices,
      applied_filters: {
        city: effectiveCityFilter || null,
        postal_code: effectivePostalCodeFilter || null,
        radius_km: Number.isFinite(effectiveRadiusKm) ? effectiveRadiusKm : null,
        services: requestedServices,
        country_wide: countryWide,
      },
      meta: {
        total_found: filteredListings.length,
        distance_mode: distanceMode,
        note:
          distanceMode === "country_wide"
            ? "Mode France entiere active: aucun filtre de zone applique."
            : distanceMode === "geo_km"
            ? "Distance geographique calculee via geocodage des localisations."
            : "Geocodage indisponible: fallback ville/code postal.",
      },
      listings: filteredListings,
    });
  } catch (err) {
    console.error("[GET /api/search/owner-listings] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
