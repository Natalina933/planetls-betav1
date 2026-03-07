const normalizeWhitespace = (value: string): string =>
  value.replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ").trim();

const toTitleCaseToken = (value: string): string =>
  value
    .toLocaleLowerCase("fr-FR")
    .replace(/(^|[\s'/-])(\p{L})/gu, (match, prefix: string, char: string) => {
      return `${prefix}${char.toLocaleUpperCase("fr-FR")}`;
    });

export const normalizeAreaLabel = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") return null;

  const normalized = normalizeWhitespace(value);
  if (!normalized) return null;

  return normalized
    .split(",")
    .map((segment) => normalizeWhitespace(segment))
    .filter(Boolean)
    .map(toTitleCaseToken)
    .join(", ");
};

export const deriveNormalizedCity = (
  location: string | null | undefined,
  serviceArea: string | null | undefined,
  city: string | null | undefined,
): string | null => {
  const normalizedCity = normalizeAreaLabel(city);
  if (normalizedCity) return normalizedCity;

  const fromLocation = normalizeAreaLabel(location);
  if (fromLocation && !fromLocation.includes(",")) return fromLocation;

  const fromServiceArea = normalizeAreaLabel(serviceArea);
  if (fromServiceArea) {
    return fromServiceArea.split(",")[0]?.trim() || null;
  }

  return null;
};

export const normalizeProfileLocationFields = <
  T extends {
    location?: string | null;
    service_area?: string | null;
    city?: string | null;
  },
>(
  input: T,
): T => {
  const location = normalizeAreaLabel(input.location);
  const service_area = normalizeAreaLabel(input.service_area);
  const city = deriveNormalizedCity(location, service_area, input.city);

  return {
    ...input,
    location,
    service_area,
    city,
  };
};
