import { NextResponse } from "next/server";

type NominatimItem = {
  place_id?: number;
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
  class?: string;
  type?: string;
  addresstype?: string;
  address?: Record<string, string | undefined>;
};

const ALLOWED_PLACE_TYPES = new Set([
  "postcode",
  "postal_code",
  "city",
  "town",
  "village",
  "municipality",
  "borough",
  "suburb",
  "city_district",
  "district",
  "quarter",
  "administrative",
]);

const LARGE_CITY_NAMES = new Set(["paris", "lyon", "marseille"]);
const PLACE_TYPE_PRIORITY: Record<string, number> = {
  city: 1,
  town: 2,
  municipality: 3,
  village: 4,
  borough: 5,
  city_district: 6,
  district: 7,
  suburb: 8,
  quarter: 9,
  administrative: 10,
};

const isLocalE2EMode =
  process.env.LOCAL_E2E_MODE === "true" && process.env.NODE_ENV !== "production";

function getLocalE2ESuggestion(location: string) {
  if (location.trim().toLowerCase() !== "paris") return null;

  return {
    placeId: "local-e2e:paris",
    label: "Paris",
    latitude: 48.8566,
    longitude: 2.3522,
    city: "Paris",
    district: null,
    postcode: "75000",
    country: "France",
    subtitle: "France",
    displayName: "Paris, France",
    placeType: "city",
  };
}

function normalizeLargeCityDistrict(city: string, district: string): string {
  const cityLabel = city.trim();
  const districtLabel = district.trim();
  const normalizedCity = cityLabel.toLowerCase();
  const normalizedDistrict = districtLabel.toLowerCase();

  if (!districtLabel || normalizedDistrict === normalizedCity) {
    return cityLabel;
  }

  const arrondissementMatch =
    normalizedDistrict.match(/\b(\d{1,2})(?:er|e)?\b/) ||
    normalizedDistrict.match(/(\d{1,2})(?:er|e)?\s*arrondissement/);

  if (
    arrondissementMatch &&
    LARGE_CITY_NAMES.has(normalizedCity)
  ) {
    const arrondissement = Number(arrondissementMatch[1]);
    if (Number.isFinite(arrondissement) && arrondissement > 0) {
      return `${cityLabel} ${arrondissement === 1 ? "1er" : `${arrondissement}e`}`;
    }
  }

  return `${cityLabel} ${districtLabel}`.trim();
}

function readPrimaryCity(address: Record<string, string | undefined>): string | null {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    null
  );
}

function readDistrict(address: Record<string, string | undefined>): string | null {
  return (
    address.borough ||
    address.city_district ||
    address.suburb ||
    address.district ||
    address.quarter ||
    null
  );
}

function readCountry(address: Record<string, string | undefined>): string | null {
  return address.country ?? null;
}

function readRegion(address: Record<string, string | undefined>): string | null {
  return address.state || address.region || address.county || null;
}

function readPostcode(address: Record<string, string | undefined>): string | null {
  return address.postcode?.trim() || null;
}

function buildKnownPlaceLabel(item: NominatimItem): string | null {
  const address = item.address ?? {};
  const city = readPrimaryCity(address);
  const district = readDistrict(address);
  const itemName = item.name?.trim() || null;

  if (city) {
    const normalizedCity = city.trim().toLowerCase();
    const normalizedDistrict = district?.trim().toLowerCase() ?? "";
    const normalizedItemName = itemName?.trim().toLowerCase() ?? "";
    const hasArrondissementSignal =
      /\b\d{1,2}(er|e)?\b/.test(normalizedDistrict) ||
      normalizedDistrict.includes("arrondissement") ||
      /\b\d{1,2}(er|e)?\b/.test(normalizedItemName) ||
      normalizedItemName.includes("arrondissement");

    if (district && LARGE_CITY_NAMES.has(normalizedCity) && hasArrondissementSignal) {
      return normalizeLargeCityDistrict(city, district);
    }

    if (itemName && LARGE_CITY_NAMES.has(normalizedCity) && hasArrondissementSignal) {
      return normalizeLargeCityDistrict(city, itemName);
    }

    return city.trim();
  }

  if (itemName) {
    return itemName;
  }

  if (item.display_name) {
    return item.display_name.split(",")[0]?.trim() ?? null;
  }

  return null;
}

function normalizeSuggestion(item: NominatimItem) {
  const lat = Number(item.lat);
  const lon = Number(item.lon);
  const address = item.address ?? {};
  const label = buildKnownPlaceLabel(item);
  const placeType = item.addresstype || item.type || "";
  const city = readPrimaryCity(address);
  const district = readDistrict(address);
  const region = readRegion(address);
  const country = readCountry(address);
  const postcode = readPostcode(address);

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !label) {
    return null;
  }

  if (!ALLOWED_PLACE_TYPES.has(placeType)) {
    return null;
  }

  const subtitleParts = [postcode, district, city, region, country]
    .map((part) => part?.trim() || null)
    .filter((part, index, array): part is string => Boolean(part) && array.indexOf(part) === index)
    .filter((part) => part.toLowerCase() !== label.toLowerCase());

  return {
    placeId: `nominatim:${String(item.place_id ?? label)}`,
    label,
    latitude: lat,
    longitude: lon,
    city,
    district,
    postcode,
    country,
    subtitle: subtitleParts.slice(0, 2).join(", ") || (country ?? label),
    displayName: item.display_name ?? label,
    placeType,
  };
}

function buildSuggestionKey(
  item: NonNullable<ReturnType<typeof normalizeSuggestion>>,
) {
  return [
    item.label.trim().toLowerCase(),
    (item.country ?? "").trim().toLowerCase(),
    (item.district ?? "").trim().toLowerCase(),
  ].join("|");
}

function rankSuggestion(
  item: NonNullable<ReturnType<typeof normalizeSuggestion>>,
  query: string,
) {
  const queryDigits = query.replace(/\D/g, "");
  const typeRank = PLACE_TYPE_PRIORITY[item.placeType] ?? 99;
  const countryRank = (item.country ?? "").toLowerCase().includes("france") ? 0 : 1;
  const districtRank = item.district ? 0 : 1;
  const postcode = (item.postcode ?? "").replace(/\D/g, "");
  const postcodeRank =
    queryDigits.length >= 4
      ? postcode === queryDigits
        ? 0
        : postcode.startsWith(queryDigits)
          ? 1
          : 2
      : 1;

  return postcodeRank * 1000 + countryRank * 100 + districtRank * 10 + typeRank;
}

function dedupeSuggestions(
  items: NonNullable<ReturnType<typeof normalizeSuggestion>>[],
  query: string,
) {
  const unique = new Map<string, NonNullable<ReturnType<typeof normalizeSuggestion>>>();

  for (const item of items) {
    const key = buildSuggestionKey(item);
    const existing = unique.get(key);

    if (!existing || rankSuggestion(item, query) < rankSuggestion(existing, query)) {
      unique.set(key, item);
    }
  }

  return Array.from(unique.values()).sort(
    (a, b) => rankSuggestion(a, query) - rankSuggestion(b, query),
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("q")?.trim();
  const mode = searchParams.get("mode")?.trim() ?? "single";
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 6), 1), 10);
  const queryDigits = location?.replace(/\D/g, "") ?? "";

  if (!location) {
    return NextResponse.json({ error: "Paramètre 'q' manquant" }, { status: 400 });
  }

  const localSuggestion = isLocalE2EMode ? getLocalE2ESuggestion(location) : null;
  if (localSuggestion) {
    if (mode === "suggest") return NextResponse.json({ suggestions: [localSuggestion] });
    return NextResponse.json(localSuggestion);
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("q", location);
    if (queryDigits.length >= 4) {
      url.searchParams.set("countrycodes", "fr");
    }

    const res = await fetch(url.toString(), {
      headers: {
        "Accept-Language": "fr",
        "User-Agent": "planetls-geocode",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Erreur de recherche de localisation" }, { status: 502 });
    }

    const data = (await res.json()) as NominatimItem[];
    const suggestions = Array.isArray(data)
      ? dedupeSuggestions(
          data
            .map(normalizeSuggestion)
            .filter((item): item is NonNullable<typeof item> => Boolean(item)),
          location,
        )
      : [];

    if (mode === "suggest") {
      return NextResponse.json({ suggestions });
    }

    const first = suggestions[0];
    if (!first) {
      return NextResponse.json({ error: "Localisation introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      latitude: first.latitude,
      longitude: first.longitude,
      label: first.label,
      placeId: first.placeId,
      city: first.city,
      postcode: first.postcode,
      district: first.district,
      displayName: first.displayName,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Erreur API /geocode:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.error("Erreur inconnue dans /geocode:", error);
    return NextResponse.json({ error: "Erreur serveur inconnue" }, { status: 500 });
  }
}
