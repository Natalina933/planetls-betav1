import { db } from "@/app/lib/dbServer";
import {
  buildHousingMutationPayload,
  buildQuotePreviewFromData,
  type ProfileRow,
  type QuotePreview,
} from "@/types/housing";

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

export async function createHousingFromQuote(quoteId: string, managerProfileId: string) {
  const preview = await loadQuotePreview(quoteId, managerProfileId);

  const { data: existing } = await db
    .from("housing")
    .select("id, contrat")
    .eq("proprietaire->>manager_profile_id", managerProfileId)
    .eq("contrat->>quote_id", quoteId)
    .maybeSingle();

  if (existing?.id) {
    return { housingId: existing.id, created: false };
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
        quote_id: quoteId,
        housing_id: createdHousing.id,
        auto_housing_created_at: new Date().toISOString(),
      },
    })
    .eq("id", quoteId);

  return { housingId: createdHousing.id, created: true };
}
