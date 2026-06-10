import type { ConciergeHousing, HousingOwnerInfo, QuotePreview } from "../../../../../types/housing.ts";
import {
  buildHousingMutationPayload,
  normalizeOwnerFromProfile,
  validateHousingDraft,
} from "../../../../../types/housing.ts";
import { EMPTY_HOUSING_STOCK_MANAGEMENT } from "../../../../lib/housingStock.ts";

export interface ManualCreateFormState {
  housingName: string;
  propertyType: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  accessCode: string;
  floor: string;
  entryInstructions: string;
  surfaceSqm: string;
  roomCount: string;
  bedroomCount: string;
  bathroomCount: string;
  bedCount: string;
  guestCapacity: string;
  amenities: string;
  description: string;
  platform: string;
  status: string;
  photo: string;
  owner: HousingOwnerInfo;
  services: Array<{
    id: string;
    label: string;
    category: string;
    frequency: string;
    unitPrice: string;
    totalPrice: string;
    notes: string;
  }>;
  internalNotes: string;
}

export interface FormState {
  name: string;
  propertyType: string;
  description: string;
  surface: string;
  capacity: string;
  bedrooms: string;
  equipments: string;
  address: string;
  city: string;
  platform: string;
  photo?: string;
  status: string;
}

export function createEmptyOwner(managerProfileId?: string | null): HousingOwnerInfo {
  return {
    profileId: null,
    managerProfileId: managerProfileId ?? null,
    fullName: "",
    email: "",
    phone: "",
    secondaryPhone: "",
    address: "",
    primaryContactName: "",
    primaryContactEmail: "",
    primaryContactPhone: "",
    companyName: "",
    city: "",
    notes: "",
    source: "manual",
  };
}

export function createInitialManualForm(managerProfileId?: string | null): ManualCreateFormState {
  return {
    housingName: "",
    propertyType: "Appartement",
    addressLine1: "",
    addressLine2: "",
    postalCode: "",
    city: "",
    country: "France",
    accessCode: "",
    floor: "",
    entryInstructions: "",
    surfaceSqm: "",
    roomCount: "",
    bedroomCount: "",
    bathroomCount: "",
    bedCount: "",
    guestCapacity: "",
    amenities: "",
    description: "",
    platform: "Airbnb",
    status: "Brouillon",
    photo: "",
    owner: createEmptyOwner(managerProfileId),
    services: [
      {
        id: "manual-service-1",
        label: "Menage hebdomadaire",
        category: "Menage",
        frequency: "Hebdomadaire",
        unitPrice: "",
        totalPrice: "",
        notes: "",
      },
    ],
    internalNotes: "",
  };
}

function isLegacyFormState(form: ManualCreateFormState | FormState): form is FormState {
  return "name" in form;
}

function toManualFormState(
  form: ManualCreateFormState | FormState,
  managerProfileId?: string | null,
): ManualCreateFormState {
  if (!isLegacyFormState(form)) return form;

  return {
    ...createInitialManualForm(managerProfileId),
    housingName: form.name,
    propertyType: form.propertyType,
    addressLine1: form.address,
    city: form.city,
    surfaceSqm: form.surface,
    bedroomCount: form.bedrooms,
    guestCapacity: form.capacity,
    amenities: form.equipments,
    description: form.description,
    platform: form.platform,
    status: form.status,
    photo: form.photo ?? "",
    owner: {
      ...createEmptyOwner(managerProfileId),
      profileId: managerProfileId ?? null,
      fullName: "Proprietaire a confirmer",
      email: managerProfileId ? `${managerProfileId}@pending.local` : "",
      source: "manual",
    },
    services: [
      {
        id: "legacy-service-1",
        label: "Service de base",
        category: "Operations",
        frequency: "A definir",
        unitPrice: "",
        totalPrice: "",
        notes: "",
      },
    ],
  };
}

function toOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function splitAmenities(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitPlatforms(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildManualHousingDraft(form: ManualCreateFormState): ConciergeHousing {
  return {
    id: 0,
    external_id: null,
    nom_logement: form.housingName.trim(),
    ville: form.city.trim(),
    adresse: form.addressLine1.trim(),
    plateforme: splitPlatforms(form.platform)[0] ?? form.platform.trim() ?? null,
    statut: form.status.trim() || "Brouillon",
    photo_principale: form.photo.trim() || null,
    created_at: null,
    updated_at: null,
    creationMode: "manual",
    owner: {
      ...form.owner,
      fullName: form.owner.fullName.trim(),
      email: form.owner.email.trim(),
      phone: form.owner.phone.trim(),
      companyName: form.owner.companyName.trim(),
      city: form.owner.city.trim(),
      notes: form.owner.notes.trim(),
      source: form.owner.profileId ? "directory" : "manual",
    },
    locationInfo: {
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim(),
      postalCode: form.postalCode.trim(),
      city: form.city.trim(),
      country: form.country.trim() || "France",
      accessCode: form.accessCode.trim(),
      floor: form.floor.trim(),
      entryInstructions: form.entryInstructions.trim(),
    },
    characteristics: {
      propertyType: form.propertyType.trim(),
      platforms: splitPlatforms(form.platform),
      photos: form.photo.trim() ? [form.photo.trim()] : [],
      surfaceSqm: toOptionalNumber(form.surfaceSqm),
      roomCount: toOptionalNumber(form.roomCount),
      bedroomCount: toOptionalNumber(form.bedroomCount),
      bathroomCount: toOptionalNumber(form.bathroomCount),
      bathrooms: [],
      bedCount: toOptionalNumber(form.bedCount),
      guestCapacity: toOptionalNumber(form.guestCapacity),
      wifiInfo: "",
      keyCount: null,
      terrace: false,
      stairs: false,
      pool: false,
      petsAllowed: false,
      nonSmoking: false,
      barbecue: false,
      chequeRequired: false,
      amenities: splitAmenities(form.amenities),
      description: form.description.trim(),
    },
    stockManagement: EMPTY_HOUSING_STOCK_MANAGEMENT,
    services: {
      items: form.services
        .map((service) => ({
          id: service.id,
          label: service.label.trim(),
          category: service.category.trim(),
          frequency: service.frequency.trim(),
          unitPrice: toOptionalNumber(service.unitPrice),
          totalPrice: toOptionalNumber(service.totalPrice),
          included: true,
          status: "included" as const,
          sourceQuoteItemId: null,
          notes: service.notes.trim(),
        }))
        .filter((service) => service.label.length > 0),
      housekeepingNotes: form.entryInstructions.trim(),
      internalNotes: form.internalNotes.trim(),
    },
    timeline: [],
    documentsList: [],
    pricing: {
      currency: "EUR",
      baseRate: null,
      nightlyRate: null,
      cleaningFee: null,
      securityDeposit: null,
      commissionRate: null,
      totalContractValue: null,
    },
    contractInfo: {
      contractUrl: "",
      signedAt: "",
      autoRenew: false,
      quoteId: null,
      quoteNumber: "",
    },
    completion: { completed: 0, total: 0, ratio: 0 },
  };
}

export function validateCreateLogementForm(
  form: ManualCreateFormState | FormState,
  managerProfileId?: string,
) {
  return validateHousingDraft(buildManualHousingDraft(toManualFormState(form, managerProfileId)));
}

export function buildCreateLogementPayload(
  form: ManualCreateFormState | FormState,
  managerProfileId?: string,
) {
  return buildHousingMutationPayload(buildManualHousingDraft(toManualFormState(form, managerProfileId)));
}

export function buildCreateLogementSummary(form: ManualCreateFormState | FormState) {
  const manualForm = toManualFormState(form);
  return [
    { label: "Logement", value: manualForm.housingName.trim() || "A renseigner" },
    { label: "Proprietaire", value: manualForm.owner.fullName.trim() || "A renseigner" },
    { label: "Adresse", value: manualForm.addressLine1.trim() || "A renseigner" },
    { label: "Ville", value: manualForm.city.trim() || "A renseigner" },
    { label: "Type", value: manualForm.propertyType.trim() || "A renseigner" },
    { label: "Surface", value: manualForm.surfaceSqm.trim() ? `${manualForm.surfaceSqm.trim()} m2` : "A renseigner" },
    { label: "Services", value: String(manualForm.services.filter((item) => item.label.trim()).length) },
    { label: "Flux", value: "Manuel" },
  ];
}

export function buildHousingDraftFromQuote(preview: QuotePreview): ConciergeHousing {
  return {
    id: 0,
    external_id: null,
    nom_logement: preview.housingName,
    ville: preview.locationInfo.city,
    adresse: preview.locationInfo.addressLine1,
    plateforme: "Quote",
    statut: "Actif - suivi en cours",
    photo_principale: null,
    created_at: null,
    updated_at: null,
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
      description: `Creation automatique depuis devis ${preview.quoteNumber}`,
    },
    stockManagement: EMPTY_HOUSING_STOCK_MANAGEMENT,
    services: preview.services,
    timeline: [
      {
        id: `quote-accepted-${preview.quoteId}`,
        title: `Devis ${preview.quoteNumber} accepte`,
        description: "Le logement a ete initialise automatiquement a partir du devis accepte.",
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
      signedAt: preview.acceptedAt,
      autoRenew: false,
      quoteId: preview.quoteId,
      quoteNumber: preview.quoteNumber,
    },
    completion: { completed: 0, total: 0, ratio: 0 },
  };
}

export function buildOwnerFromDirectoryProfile(profile: {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | undefined;
  phone?: string | null;
  city?: string | null;
  company_name?: string | null;
  username?: string | undefined;
}, managerProfileId?: string | null) {
  return normalizeOwnerFromProfile(profile, managerProfileId);
}
