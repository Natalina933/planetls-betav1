import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { validateQuoteHousingAttachment, QuoteHousingValidationError, HOUSING_OWNER_KEYS, HOUSING_MANAGER_KEYS } from "./quoteHousingValidation";
import { db } from "@/app/lib/dbServer";
import {
  buildHousingMutationPayload,
  buildQuotePreviewFromData,
  type ProfileRow,
  type QuotePreview,
} from "@/types/housing";

export { QuoteHousingValidationError } from "./quoteHousingValidation";
export const validateHousingFromQuote = (input: Parameters<typeof validateQuoteHousingAttachment>[1]) =>
  validateQuoteHousingAttachment(asLooseSupabaseClient(db), input);

const quoteSelect = `
  id,
  quote_number,
  owner_profile_id,
  concierge_profile_id,
  status,
  currency,
  subtotal,
  total_amount,
  accepted_at,
  metadata,
  quote_items(
    id,
    label,
    description,
    quantity,
    unit_price,
    line_total,
    metadata
  )
`;

export async function loadQuotePreview(quoteId: string, managerProfileId: string): Promise<QuotePreview> {
  const { data: quote, error } = await db
    .from("quotes")
    .select(quoteSelect)
    .eq("id", quoteId)
    .eq("concierge_profile_id", managerProfileId)
    .maybeSingle();

  if (error) {
    throw new Error("Impossible de charger le devis source.");
  }
  if (!quote) {
    throw new Error("Devis introuvable.");
  }

  const ownerProfileId = typeof quote.owner_profile_id === "string" ? quote.owner_profile_id : null;
  let ownerProfile: Partial<ProfileRow> | null = null;

  if (ownerProfileId) {
    const { data: owner } = await db
      .from("profiles")
      .select(
        "id, first_name, last_name, username, email, phone, city, country, street_address, postal_code, company_name",
      )
      .eq("id", ownerProfileId)
      .maybeSingle();
    ownerProfile = owner ?? null;
  }

  return buildQuotePreviewFromData({
    quote: quote as unknown as Record<string, unknown>,
    items: Array.isArray(quote.quote_items)
      ? quote.quote_items.map((item) => item as unknown as Record<string, unknown>)
      : [],
    ownerProfile,
    managerProfileId,
  });
}

export async function createHousingFromQuote(
  quoteId: string,
  managerProfileId: string,
  existingHousingId?: string | number | null,
) {
  const validation = await validateHousingFromQuote({
    quoteId, expectedConciergeProfileId: managerProfileId, existingHousingId,
  });
  const preview = await loadQuotePreview(quoteId, managerProfileId);
  if (preview.owner.profileId !== validation.ownerId) {
    throw new QuoteHousingValidationError("Le propriétaire du devis a changé pendant le rattachement.");
  }
  const linkedHousing = validation.housing;
  if (linkedHousing) {
    const currentOwner = linkedHousing.proprietaire as Record<string, unknown>;
    const currentContract = linkedHousing.contrat && typeof linkedHousing.contrat === "object" && !Array.isArray(linkedHousing.contrat)
      ? linkedHousing.contrat as Record<string, unknown> : {};
    if (currentContract.quote_id === quoteId) {
      return { housingId: Number(linkedHousing.id), created: false, linkedExisting: true };
    }
    // Compare the ownership snapshot as well: never overwrite a concurrent reassignment.
    let update = asLooseSupabaseClient(db)
      .from("housing")
      .update({
        proprietaire: {
          ...currentOwner,
          owner_profile_id: validation.ownerId,
          manager_profile_id: currentOwner.manager_profile_id ?? currentOwner.concierge_profile_id ?? currentOwner.managed_by ?? managerProfileId,
          source: "quote",
        },
        contrat: { ...currentContract, quote_id: quoteId, quote_number: preview.quoteNumber, signed_at: preview.acceptedAt || new Date().toISOString() },
      })
      .eq("id", linkedHousing.id);
    for (const key of [...HOUSING_OWNER_KEYS, ...HOUSING_MANAGER_KEYS]) {
      const value = currentOwner[key];
      update = value === null || value === undefined
        ? update.is(`proprietaire->>${key}`, null)
        : update.eq(`proprietaire->>${key}`, String(value));
    }
    const { data: updated, error: linkError } = await update.select("id").maybeSingle();
    if (linkError) throw new Error("Impossible de rattacher la conciergerie au logement existant.");
    if (!updated) throw new QuoteHousingValidationError("Le logement a changé pendant le rattachement. Rechargez puis réessayez.");
    return { housingId: Number(linkedHousing.id), created: false, linkedExisting: true };
  }

  const payload = buildHousingMutationPayload({
    id: 0,
    external_id: null,
    nom_logement: preview.housingName,
    plateforme: "Quote",
    statut: "Actif - suivi en cours",
    photo_principale: null,
    creationMode: "quote",
    owner: preview.owner,
    locationInfo: preview.locationInfo,
    characteristics: {
      propertyType: "Logement saisonnier",
      photos: [],
      surfaceSqm: null,
      roomCount: null,
      bedroomCount: null,
      bathroomCount: null,
      bathrooms: [],
      bedCount: null,
      guestCapacity: null,
      wifiInfo: "",
      keyCount: null,
      terrace: false,
      stairs: false,
      pool: false,
      petsAllowed: false,
      nonSmoking: false,
      barbecue: false,
      chequeRequired: false,
      amenities: [],
      description: `Initialise depuis le devis ${preview.quoteNumber}`,
    },
    services: preview.services,
    timeline: [
      {
        id: `quote-${quoteId}`,
        title: `Devis ${preview.quoteNumber} accepte`,
        description: "Creation automatique du logement apres acceptation du devis.",
        date: preview.acceptedAt || new Date().toISOString(),
        type: "quote",
        status: "done",
        actor: preview.owner.fullName || "Proprietaire",
        source: "quote",
      },
    ],
    documentsList: [],
    pricing: preview.pricing,
    contractInfo: {
      contractUrl: "",
      signedAt: preview.acceptedAt || "",
      autoRenew: false,
      quoteId,
      quoteNumber: preview.quoteNumber,
    },
  });

  // Preserve the verified UUID origin for retries without inventing a name-based mapping.
  if (validation.propertyId) {
    payload.infos = { ...(payload.infos as Record<string, unknown>), quote_source_property_id: validation.propertyId };
  }

  const { data: createdHousing, error: createError } = await db
    .from("housing")
    .insert(payload)
    .select("id")
    .single();

  if (createError || !createdHousing) {
    throw new Error("Impossible de creer le logement depuis le devis.");
  }

  await db
    .from("quotes")
    .update({
      metadata: {
        ...(validation.quote.metadata && typeof validation.quote.metadata === "object" ? validation.quote.metadata : {}),
        quote_id: quoteId,
        housing_id: createdHousing.id,
        auto_housing_created_at: new Date().toISOString(),
      },
    })
    .eq("id", quoteId);

  return { housingId: createdHousing.id, created: true, linkedExisting: false };
}
