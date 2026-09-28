type NominatimItem = {
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
  address?: Record<string, string | undefined>;
};

export type GeocodedLocation = {
  latitude: number;
  longitude: number;
  city: string;
  displayName: string;
};

export async function geocodeLocation(
  location: string,
): Promise<GeocodedLocation | null> {
  const query = location.trim();

  if (!query) {
    return null;
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");

  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", query);

  const response = await fetch(url.toString(), {
    headers: {
      "Accept-Language": "fr",
      "User-Agent": "planetls-geocode",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Geocoding request failed with status ${response.status}`,
    );
  }

  const data = (await response.json()) as NominatimItem[];

  const first = data[0];

  if (!first) {
    return null;
  }

  const latitude = Number(first.lat);
  const longitude = Number(first.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const address = first.address ?? {};

  const city =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    first.name ??
    query;

  return {
    latitude,
    longitude,
    city,
    displayName: first.display_name ?? city,
  };
}