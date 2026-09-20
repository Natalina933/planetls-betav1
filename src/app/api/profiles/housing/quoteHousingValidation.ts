import type { LooseSupabaseClient } from "../../_shared/untypedSupabase.ts";

type Row = Record<string, unknown>;
const record = (value: unknown): Row =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
const identifier = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" && typeof value !== "number") {
    throw new QuoteHousingValidationError("Référence de rattachement invalide.");
  }
  return String(value).trim() || null;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const HOUSING_OWNER_KEYS = ["owner_profile_id", "owner_id", "proprietaire_id", "id", "userId", "profile_id"] as const;
export const HOUSING_MANAGER_KEYS = ["manager_profile_id", "concierge_profile_id", "managed_by"] as const;

export class QuoteHousingValidationError extends Error {
  readonly status = 409;
  constructor(message: string) {
    super(message);
    this.name = "QuoteHousingValidationError";
  }
}

function agree(values: unknown[], label: string) {
  const ids = [...new Set(values.map(identifier).filter((id): id is string => id !== null))];
  if (ids.length > 1) throw new QuoteHousingValidationError(`${label} : références contradictoires.`);
  return ids[0] ?? null;
}

async function load(db: LooseSupabaseClient, table: string, id: string | number) {
  const { data, error } = await db.from(table).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Impossible de vérifier le rattachement (${table}).`);
  if (!data) throw new QuoteHousingValidationError(`Référence introuvable (${table}).`);
  return data as Row;
}

/** Read-only preflight, also called defensively by the housing writer. */
export async function validateQuoteHousingAttachment(db: LooseSupabaseClient, input: {
  quoteId: string;
  expectedOwnerProfileId?: string | null;
  expectedConciergeProfileId: string;
  expectedRequestId?: string | null;
  expectedRecipientId?: string | null;
  existingHousingId?: string | number | null;
}) {
  const quote = await load(db, "quotes", input.quoteId);
  const ownerId = identifier(quote.owner_profile_id);
  const conciergeId = identifier(quote.concierge_profile_id);
  if (!ownerId || (input.expectedOwnerProfileId && ownerId !== input.expectedOwnerProfileId)) {
    throw new QuoteHousingValidationError("Le propriétaire du devis ne correspond pas au parcours.");
  }
  if (!conciergeId || conciergeId !== input.expectedConciergeProfileId) {
    throw new QuoteHousingValidationError("La concierge du devis ne correspond pas à la concierge attendue.");
  }
  const metadata = record(quote.metadata);
  const requestId = agree([quote.service_request_id, metadata.service_request_id], "Demande du devis");
  if (input.expectedRequestId && requestId !== input.expectedRequestId) {
    throw new QuoteHousingValidationError("Le devis ne correspond pas à la demande concernée.");
  }
  const recipientId = agree([quote.service_request_recipient_id, metadata.service_request_recipient_id], "Destinataire du devis");
  if (input.expectedRecipientId && recipientId !== input.expectedRecipientId) {
    throw new QuoteHousingValidationError("Le devis ne correspond pas au destinataire sélectionné.");
  }
  const request = requestId ? await load(db, "service_requests", requestId) : null;
  if (request && request.owner_profile_id !== ownerId) {
    throw new QuoteHousingValidationError("Le propriétaire de la demande ne correspond pas au devis.");
  }
  if (recipientId) {
    const recipient = await load(db, "service_request_recipients", recipientId);
    if (!requestId || recipient.service_request_id !== requestId || recipient.concierge_profile_id !== conciergeId) {
      throw new QuoteHousingValidationError("Le destinataire, la demande et la concierge du devis ne correspondent pas.");
    }
  }

  const housingIds = new Set<string>();
  const propertyIds = new Set<string>();
  const collect = (value: unknown) => {
    const id = identifier(value);
    if (!id) return;
    if (/^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0) {
      housingIds.add(String(Number(id)));
    } else if (uuid.test(id)) {
      // Legacy UI sometimes stores a properties UUID under metadata.housing_id.
      propertyIds.add(id.toLowerCase());
    } else {
      throw new QuoteHousingValidationError("Référence logement invalide.");
    }
  };
  collect(input.existingHousingId);
  for (const source of [quote, metadata, request ?? {}, record(request?.metadata)]) {
    for (const key of ["property_id", "housing_id", "property_housing_id", "service_property_id"]) collect(source[key]);
  }
  if (housingIds.size > 1 || propertyIds.size > 1) {
    throw new QuoteHousingValidationError("Références logement contradictoires.");
  }
  for (const propertyId of propertyIds) {
    const property = await load(db, "properties", propertyId);
    if (property.owner_id !== ownerId) throw new QuoteHousingValidationError("La propriété référencée appartient à un autre propriétaire.");
  }

  const housingId = housingIds.size ? Number([...housingIds][0]) : null;
  let housing = housingId !== null ? await load(db, "housing", housingId) : null;
  // A retry without an explicit housing reference must not create a second home.
  const { data: previous, error } = await db.from("housing").select("id, proprietaire, contrat, infos")
    .eq("contrat->>quote_id", input.quoteId);
  if (error) throw new Error("Impossible de vérifier le logement déjà rattaché au devis.");
  const previousRows = (previous ?? []) as Row[];
  const referencedHousing = housing;
  if (previousRows.length > 1 || (referencedHousing && previousRows.some((row) => row.id !== referencedHousing.id))) {
    throw new QuoteHousingValidationError("Plusieurs logements sont associés au même devis.");
  }
  if (!housing && previousRows.length) housing = previousRows[0];
  const propertyId = [...propertyIds][0] ?? null;
  if (housing && propertyId && record(housing.infos).quote_source_property_id !== propertyId) {
    throw new QuoteHousingValidationError("Correspondance entre housing et properties non vérifiable : rattachement refusé.");
  }
  if (housing) assertHousingParticipants(housing, ownerId, conciergeId);
  return { quote, request, housing, housingId: housing ? Number(housing.id) : null, propertyId, ownerId, conciergeId };
}

export function assertHousingParticipants(housing: Row, ownerId: string, conciergeId: string) {
  const ownership = record(housing.proprietaire);
  const actualOwner = agree(HOUSING_OWNER_KEYS.map((key) => ownership[key]), "Propriétaire du logement");
  if (actualOwner !== ownerId) {
    throw new QuoteHousingValidationError("Le logement n'appartient pas au propriétaire attendu.");
  }
  const manager = agree(HOUSING_MANAGER_KEYS.map((key) => ownership[key]), "Gestionnaire du logement");
  if (manager && manager !== conciergeId) {
    throw new QuoteHousingValidationError("Le logement possède déjà un autre gestionnaire. Son remplacement doit être explicite.");
  }
}
