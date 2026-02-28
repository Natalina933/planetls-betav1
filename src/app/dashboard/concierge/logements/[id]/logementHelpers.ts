import type { Database } from "../../../../../types/supabase.ts";

export interface InfosJSON {
  digicode?: string;
  categorie?: string;
  superficie?: string;
  nb_chambres?: number;
  description?: string;
  capacite?: number;
  equipements?: string[];
}

export interface ProprietaireJSON {
  nom?: string;
  telephone?: string;
  email?: string;
}

export interface LocationJSON {
  prix_nuit?: number;
  caution?: number;
  frais_menage?: number;
}

export interface MenageJSON {
  temps?: string;
  checklist?: string;
  instructions?: string;
}

export interface PlanningEvent {
  date: string;
  type: string;
  guest?: string;
  agent?: string;
  status?: string;
}

export interface DocumentItem {
  name: string;
  file?: string;
  url?: string;
}

export interface TarifsJSON {
  prix_base?: number;
  prix_par_nuit?: number;
  caution?: number;
  frais_menage?: number;
}

export interface ContratJSON {
  date_signature?: string;
  renouvellement_auto?: boolean;
  fichier_pdf?: string;
}

export type HousingRow = Database["public"]["Tables"]["housing"]["Row"];

export interface LogementTyped
  extends Omit<
    HousingRow,
    | "infos"
    | "proprietaire"
    | "location"
    | "menage"
    | "planning"
    | "documents"
    | "notes"
    | "tarifs"
    | "contrat"
  > {
  infos?: InfosJSON;
  proprietaire?: ProprietaireJSON;
  location?: LocationJSON;
  menage?: MenageJSON;
  planning?: PlanningEvent[];
  documents?: DocumentItem[];
  notes?: string[];
  tarifs?: TarifsJSON;
  contrat?: ContratJSON;
}

export type ActiveTab = "infos" | "menage" | "planning" | "docs" | "notes" | "tarifs";

export function parseHousingRow(data: HousingRow): LogementTyped {
  return {
    ...data,
    infos: data.infos as InfosJSON,
    proprietaire: data.proprietaire as ProprietaireJSON,
    location: data.location as LocationJSON,
    menage: data.menage as MenageJSON,
    planning: data.planning as unknown as PlanningEvent[],
    documents: data.documents as unknown as DocumentItem[],
    notes: data.notes as string[],
    tarifs: data.tarifs as TarifsJSON,
    contrat: data.contrat as ContratJSON,
  };
}

export function buildEditableLogement(
  logement: LogementTyped | null,
  editedData: Partial<LogementTyped>,
) {
  if (!logement) return null;

  return {
    ...logement,
    ...editedData,
    infos: {
      ...logement.infos,
      ...editedData.infos,
    },
    menage: {
      ...logement.menage,
      ...editedData.menage,
    },
    tarifs: {
      ...logement.tarifs,
      ...editedData.tarifs,
    },
    contrat: {
      ...logement.contrat,
      ...editedData.contrat,
    },
  } as LogementTyped;
}

export function formatMoney(value?: number | null) {
  return typeof value === "number" ? `${value} EUR` : "-";
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

function cleanString(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : value;
}

function isAssetUrlLike(value: string) {
  return value.startsWith("/") || /^https?:\/\//i.test(value);
}

function isInvalidMoneyValue(value: number | null | undefined) {
  return value !== null && value !== undefined && (!Number.isFinite(value) || value < 0);
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

  if (!logement.nom_logement?.trim()) {
    return { isValid: false, message: "Le nom du logement est obligatoire." };
  }

  if (!logement.adresse?.trim()) {
    return { isValid: false, message: "L'adresse du logement est obligatoire." };
  }

  if (!logement.ville?.trim()) {
    return { isValid: false, message: "La ville du logement est obligatoire." };
  }

  if (
    logement.infos?.capacite !== undefined &&
    logement.infos.capacite !== null &&
    (!Number.isFinite(logement.infos.capacite) || logement.infos.capacite <= 0)
  ) {
    return {
      isValid: false,
      message: "La capacite du logement doit etre un nombre positif.",
    };
  }

  if (
    logement.infos?.nb_chambres !== undefined &&
    logement.infos.nb_chambres !== null &&
    (!Number.isFinite(logement.infos.nb_chambres) || logement.infos.nb_chambres < 0)
  ) {
    return {
      isValid: false,
      message: "Le nombre de chambres doit etre un nombre valide.",
    };
  }

  if (logement.photo_principale?.trim() && !isAssetUrlLike(logement.photo_principale.trim())) {
    return {
      isValid: false,
      message: "La photo principale doit etre une URL valide ou un chemin local commencant par '/'.",
    };
  }

  if (logement.contrat?.fichier_pdf?.trim() && !isAssetUrlLike(logement.contrat.fichier_pdf.trim())) {
    return {
      isValid: false,
      message: "Le contrat PDF doit etre une URL valide ou un chemin local commencant par '/'.",
    };
  }

  if (
    isInvalidMoneyValue(logement.tarifs?.prix_base) ||
    isInvalidMoneyValue(logement.tarifs?.prix_par_nuit) ||
    isInvalidMoneyValue(logement.tarifs?.caution) ||
    isInvalidMoneyValue(logement.tarifs?.frais_menage)
  ) {
    return {
      isValid: false,
      message: "Les montants du logement doivent etre des nombres positifs ou vides.",
    };
  }

  return { isValid: true, message: null };
}

export function buildLogementPatchPayload(editedData: Partial<LogementTyped>) {
  const payload: Partial<LogementTyped> = {};

  if (editedData.nom_logement !== undefined) payload.nom_logement = cleanString(editedData.nom_logement);
  if (editedData.ville !== undefined) payload.ville = cleanString(editedData.ville);
  if (editedData.adresse !== undefined) payload.adresse = cleanString(editedData.adresse);
  if (editedData.plateforme !== undefined) payload.plateforme = cleanString(editedData.plateforme);
  if (editedData.statut !== undefined) payload.statut = editedData.statut;
  if (editedData.photo_principale !== undefined) {
    payload.photo_principale = cleanString(editedData.photo_principale);
  }
  if (editedData.external_id !== undefined) payload.external_id = editedData.external_id;
  if (editedData.infos !== undefined) payload.infos = editedData.infos;
  if (editedData.proprietaire !== undefined) payload.proprietaire = editedData.proprietaire;
  if (editedData.location !== undefined) payload.location = editedData.location;
  if (editedData.menage !== undefined) payload.menage = editedData.menage;
  if (editedData.planning !== undefined) payload.planning = editedData.planning;
  if (editedData.documents !== undefined) payload.documents = editedData.documents;
  if (editedData.notes !== undefined) payload.notes = editedData.notes;
  if (editedData.tarifs !== undefined) payload.tarifs = editedData.tarifs;
  if (editedData.contrat !== undefined) payload.contrat = editedData.contrat;

  return payload;
}
