type ListingReferenceInput = {
  propertyId?: string | number | null;
  propertyHousingId?: string | number | null;
  metadata?: Record<string, unknown> | null;
};

type ListingLabelMaps = {
  propertyNameById?: Map<string, string>;
  housingNameById?: Map<string, string>;
};

function normalizeIdentifier(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function readMetadataIdentifier(metadata: Record<string, unknown> | null | undefined, key: string) {
  return normalizeIdentifier(metadata?.[key]);
}

function isNumericIdentifier(value: string | null) {
  return value !== null && /^\d+$/.test(value);
}

export function getHousingReferenceId(input: ListingReferenceInput) {
  const directHousingId = normalizeIdentifier(input.propertyHousingId);
  if (directHousingId) return directHousingId;

  const metadataHousingId =
    readMetadataIdentifier(input.metadata, "property_housing_id") ??
    readMetadataIdentifier(input.metadata, "housing_id");
  if (metadataHousingId) return metadataHousingId;

  const propertyId = normalizeIdentifier(input.propertyId);
  return isNumericIdentifier(propertyId) ? propertyId : null;
}

export function getCanonicalListingId(input: ListingReferenceInput) {
  return getHousingReferenceId(input) ?? normalizeIdentifier(input.propertyId);
}

export function matchesHousingReference(input: ListingReferenceInput, housingId: string | number | null | undefined) {
  const expectedHousingId = normalizeIdentifier(housingId);
  return Boolean(expectedHousingId) && getHousingReferenceId(input) === expectedHousingId;
}

export function getListingLabel(input: ListingReferenceInput, maps: ListingLabelMaps) {
  const housingId = getHousingReferenceId(input);
  if (housingId) {
    const housingLabel = maps.housingNameById?.get(housingId);
    if (housingLabel) return housingLabel;
  }

  const propertyId = normalizeIdentifier(input.propertyId);
  if (propertyId) {
    const propertyLabel = maps.propertyNameById?.get(propertyId);
    if (propertyLabel) return propertyLabel;
  }

  const metadataPropertyLabel = readMetadataIdentifier(input.metadata, "property_label");
  if (metadataPropertyLabel) return metadataPropertyLabel;

  return readMetadataIdentifier(input.metadata, "housing_label");
}

export function collectHousingReferenceIds(inputs: ListingReferenceInput[]) {
  return Array.from(
    new Set(inputs.map((input) => getHousingReferenceId(input)).filter((id): id is string => Boolean(id))),
  );
}
