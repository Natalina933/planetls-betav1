import type {
  ConciergeHousing,
  HousingDocument,
  HousingRow as BaseHousingRow,
  HousingTimelineItem,
} from "../../../../../types/housing.ts";
import {
  buildHousingMutationPayload,
  normalizeHousingRow,
  validateHousingDraft,
} from "../../../../../types/housing.ts";

export type InfosJSON = ConciergeHousing["characteristics"];
export type ProprietaireJSON = ConciergeHousing["owner"];
export type LocationJSON = ConciergeHousing["locationInfo"];
export type MenageJSON = ConciergeHousing["services"];
export type PlanningEvent = HousingTimelineItem;
export type DocumentItem = HousingDocument;
export type TarifsJSON = ConciergeHousing["pricing"];
export type ContratJSON = ConciergeHousing["contractInfo"];
export type HousingRow = BaseHousingRow;
export type LogementTyped = ConciergeHousing & {
  infos: InfosJSON;
  proprietaire: ProprietaireJSON;
  location: LocationJSON;
  menage: MenageJSON;
  planning: PlanningEvent[];
  documents: DocumentItem[];
  notes: string[];
  tarifs: TarifsJSON;
  contrat: ContratJSON;
};

export type ActiveTab = "overview" | "infos" | "services" | "timeline" | "docs";

function withLegacyAliases(logement: ConciergeHousing): LogementTyped {
  return {
    ...logement,
    infos: logement.characteristics,
    proprietaire: logement.owner,
    location: logement.locationInfo,
    menage: logement.services,
    planning: logement.timeline,
    documents: logement.documentsList,
    notes: logement.services.internalNotes
      .split("\n")
      .map((note) => note.trim())
      .filter(Boolean),
    tarifs: logement.pricing,
    contrat: logement.contractInfo,
  };
}

export function parseHousingRow(data: HousingRow): LogementTyped {
  return withLegacyAliases(normalizeHousingRow(data));
}

export function buildEditableLogement(
  logement: LogementTyped | null,
  editedData: Partial<LogementTyped>,
) {
  if (!logement) return null;

  const mergedBase = {
    ...logement,
    ...editedData,
    owner: {
      ...logement.owner,
      ...(editedData.owner ?? {}),
    },
    locationInfo: {
      ...logement.locationInfo,
      ...(editedData.locationInfo ?? {}),
    },
    characteristics: {
      ...logement.characteristics,
      ...(editedData.characteristics ?? {}),
    },
    services: {
      ...logement.services,
      ...(editedData.services ?? {}),
      items: editedData.services?.items ?? logement.services.items,
    },
    pricing: {
      ...logement.pricing,
      ...(editedData.pricing ?? {}),
    },
    contractInfo: {
      ...logement.contractInfo,
      ...(editedData.contractInfo ?? {}),
    },
    timeline: editedData.timeline ?? logement.timeline,
    documentsList: editedData.documentsList ?? logement.documentsList,
  } satisfies ConciergeHousing;

  return withLegacyAliases(mergedBase);
}

export function formatMoney(value?: number | null, currency = "EUR") {
  return typeof value === "number" ? `${value} ${currency}` : "-";
}

export function hasPendingLogementChanges(editedData: Partial<LogementTyped>) {
  const values = Object.values(editedData);

  return values.some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object") return Object.keys(value).length > 0;
    return value !== undefined;
  });
}

export interface LogementValidationResult {
  isValid: boolean;
  message: string | null;
}

export function toOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function validateLogementChanges(logement: LogementTyped | null): LogementValidationResult {
  if (!logement) {
    return { isValid: false, message: "Logement introuvable." };
  }

  const error = validateHousingDraft(logement);
  return {
    isValid: !error,
    message: error,
  };
}

export function buildLogementPatchPayload(editedData: Partial<LogementTyped>) {
  const payload: Record<string, unknown> = {};

  if (editedData.nom_logement !== undefined) payload.nom_logement = editedData.nom_logement?.trim();
  if (editedData.ville !== undefined) payload.ville = editedData.ville?.trim();
  if (editedData.adresse !== undefined) payload.adresse = editedData.adresse?.trim();
  if (editedData.plateforme !== undefined) payload.plateforme = editedData.plateforme?.trim();
  if (editedData.statut !== undefined) payload.statut = editedData.statut;
  if (editedData.photo_principale !== undefined) payload.photo_principale = editedData.photo_principale?.trim();

  if (editedData.owner || editedData.locationInfo || editedData.characteristics || editedData.services || editedData.timeline || editedData.documentsList || editedData.pricing || editedData.contractInfo) {
    const normalized = buildHousingMutationPayload({
      id: editedData.id ?? 0,
      external_id: editedData.external_id ?? null,
      nom_logement: editedData.nom_logement ?? "",
      plateforme: editedData.plateforme ?? "",
      statut: editedData.statut ?? "",
      photo_principale: editedData.photo_principale ?? null,
      creationMode: editedData.creationMode ?? "manual",
      owner: editedData.owner ?? {
        profileId: null,
        managerProfileId: null,
        fullName: "",
        email: "",
        phone: "",
        companyName: "",
        city: "",
        notes: "",
        source: "manual",
      },
      locationInfo: editedData.locationInfo ?? {
        addressLine1: "",
        addressLine2: "",
        postalCode: "",
        city: "",
        country: "France",
        accessCode: "",
        floor: "",
        entryInstructions: "",
      },
      characteristics: editedData.characteristics ?? {
        propertyType: "",
        surfaceSqm: null,
        roomCount: null,
        bedroomCount: null,
        bathroomCount: null,
        bedCount: null,
        guestCapacity: null,
        amenities: [],
        description: "",
      },
      services: editedData.services ?? { items: [], housekeepingNotes: "", internalNotes: "" },
      timeline: editedData.timeline ?? [],
      documentsList: editedData.documentsList ?? [],
      pricing: editedData.pricing ?? {
        currency: "EUR",
        baseRate: null,
        nightlyRate: null,
        cleaningFee: null,
        securityDeposit: null,
        commissionRate: null,
        totalContractValue: null,
      },
      contractInfo: editedData.contractInfo ?? {
        contractUrl: "",
        signedAt: "",
        autoRenew: false,
        quoteId: null,
        quoteNumber: "",
      },
    });

    if (editedData.owner !== undefined) payload.proprietaire = normalized.proprietaire;
    if (editedData.locationInfo !== undefined) payload.location = normalized.location;
    if (editedData.characteristics !== undefined || editedData.creationMode !== undefined) payload.infos = normalized.infos;
    if (editedData.services !== undefined) {
      payload.menage = normalized.menage;
      payload.notes = normalized.notes;
    }
    if (editedData.timeline !== undefined) payload.planning = normalized.planning;
    if (editedData.documentsList !== undefined) payload.documents = normalized.documents;
    if (editedData.pricing !== undefined) payload.tarifs = normalized.tarifs;
    if (editedData.contractInfo !== undefined) payload.contrat = normalized.contrat;
  }

  return payload;
}
