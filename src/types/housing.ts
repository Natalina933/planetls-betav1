import type { Database, Json } from "./supabase.ts";
import {
  EMPTY_HOUSING_STOCK_MANAGEMENT,
  normalizeHousingStockManagement,
  type HousingStockManagement,
} from "../app/lib/housingStock.ts";

export type HousingRow = Database["public"]["Tables"]["housing"]["Row"];
export type HousingInsert = Database["public"]["Tables"]["housing"]["Insert"];
export type HousingUpdate = Database["public"]["Tables"]["housing"]["Update"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type HousingCreationMode = "manual" | "quote";
export type HousingAccessRole = "owner" | "concierge" | "admin" | "unknown";
export type HousingServiceStatus = "included" | "pending" | "active" | "paused";
export type HousingTimelineType = "quote" | "activation" | "service" | "note" | "document";
export type HousingTimelineStatus = "done" | "in_progress" | "planned";
export type HousingDocumentType = "contract" | "guide" | "invoice" | "insurance" | "other";

export const HOUSING_PROPERTY_TYPE_OPTIONS = [
  "Appartement",
  "Maison",
  "Villa",
  "Studio",
  "Loft",
  "Résidence secondaire",
  "Chalet",
] as const;

export const HOUSING_STATUS_OPTIONS = [
  "Brouillon",
  "En attente de validation du devis",
  "Prêt à exploiter",
  "Actif - suivi en cours",
  "Check-in imminent",
  "Check-out imminent",
  "Ménage planifié",
  "Maintenance en cours",
  "Suspendu temporairement",
  "Archive",
] as const;

export const HOUSING_PLATFORM_OPTIONS = [
  "Airbnb",
  "Booking",
  "Abritel",
  "Direct",
  "Expedia",
  "Tripadvisor",
] as const;

export const HOUSING_STATUS_EXPLANATIONS: Record<string, string> = {
  Brouillon: "Le logement est en préparation. La fiche peut encore être complétée avant activation.",
  "En attente de validation du devis":
    "Le logement est identifié mais reste conditionné à l'acceptation du devis par le propriétaire.",
  "Prêt à exploiter": "Le bien est configuré et peut être ouvert à la commercialisation ou au suivi opérationnel.",
  "Actif - suivi en cours": "Le logement est pris en charge par la conciergerie avec un suivi régulier des opérations.",
  "Check-in imminent": "Une arrivée approche. Les actions d'accueil et de préparation doivent être priorisées.",
  "Check-out imminent": "Un départ approche. Le ménage, l'inspection et la remise en état doivent être anticipés.",
  "Ménage planifié": "Une intervention de ménage est programmée. Le logement reste dans le circuit mais sous contrainte opérationnelle.",
  "Maintenance en cours": "Une anomalie ou intervention technique bloque partiellement ou totalement l'exploitation.",
  "Suspendu temporairement": "Le logement est momentanément retiré du suivi actif, sans archivage définitif.",
  Archive: "Le logement est conservé pour historique mais n'est plus exploité ni piloté au quotidien.",
};

export interface HousingOwnerInfo {
  profileId: string | null;
  managerProfileId: string | null;
  fullName: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  address: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  companyName: string;
  city: string;
  notes: string;
  invitationMessageTemplate?: string;
  source: "directory" | "manual" | "quote" | "legacy";
}

export interface HousingLocationInfo {
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  accessCode: string;
  floor: string;
  entryInstructions: string;
}

export interface HousingBathroomInfo {
  id: string;
  name: string;
  type: string;
  notes: string;
}

export interface HousingCharacteristics {
  propertyType: string;
  categorie?: string;
  platforms?: string[];
  photos: string[];
  surfaceSqm: number | null;
  superficie?: number | null;
  roomCount: number | null;
  bedroomCount: number | null;
  nb_chambres?: number | null;
  bathroomCount: number | null;
  bathrooms: HousingBathroomInfo[];
  bedCount: number | null;
  guestCapacity: number | null;
  capacite?: number | null;
  wifiInfo: string;
  keyCount: number | null;
  terrace: boolean;
  terraceSurfaceSqm?: number | null;
  terraceNotes?: string;
  stairs: boolean;
  stairsFloorCount?: number | null;
  stairsNotes?: string;
  pool: boolean;
  poolNotes?: string;
  petsAllowed: boolean;
  petsNotes?: string;
  nonSmoking: boolean;
  barbecue: boolean;
  barbecueType?: string;
  chequeRequired: boolean;
  chequeAmount?: number | null;
  bathroomType?: string;
  bathroomNotes?: string;
  amenities: string[];
  equipements?: string[];
  description: string;
}

export interface HousingServiceItem {
  id: string;
  label: string;
  category: string;
  frequency: string;
  unitPrice: number | null;
  totalPrice: number | null;
  included: boolean;
  status: HousingServiceStatus;
  sourceQuoteItemId: string | null;
  notes: string;
}

export interface HousingServices {
  items: HousingServiceItem[];
  housekeepingNotes: string;
  internalNotes: string;
  temps?: string;
  checklist?: string;
  instructions?: string;
}

export interface HousingTimelineItem {
  id: string;
  title: string;
  description: string;
  date: string;
  type: HousingTimelineType;
  status: HousingTimelineStatus;
  actor: string;
  source: string;
}

export interface HousingDocument {
  id: string;
  name: string;
  type: HousingDocumentType;
  url: string;
  uploadedAt: string;
  status: string;
}

export interface HousingPricing {
  currency: string;
  baseRate: number | null;
  prix_base?: number | null;
  nightlyRate: number | null;
  prix_par_nuit?: number | null;
  cleaningFee: number | null;
  frais_menage?: number | null;
  securityDeposit: number | null;
  caution?: number | null;
  commissionRate: number | null;
  totalContractValue: number | null;
}

export interface HousingContractInfo {
  contractUrl: string;
  fichier_pdf?: string;
  signedAt: string;
  autoRenew: boolean;
  renouvellement_auto?: boolean;
  quoteId: string | null;
  quoteNumber: string;
}

export interface HousingCompletion {
  completed: number;
  total: number;
  ratio: number;
}

export interface ConciergeHousing
  extends Omit<
    HousingRow,
    | "infos"
    | "proprietaire"
    | "location"
    | "menage"
    | "planning"
    | "documents"
    | "tarifs"
    | "contrat"
    | "notes"
  > {
  creationMode: HousingCreationMode;
  owner: HousingOwnerInfo;
  locationInfo: HousingLocationInfo;
  characteristics: HousingCharacteristics;
  stockManagement: HousingStockManagement;
  services: HousingServices;
  timeline: HousingTimelineItem[];
  documentsList: HousingDocument[];
  pricing: HousingPricing;
  contractInfo: HousingContractInfo;
  completion: HousingCompletion;
}

export interface QuotePreview {
  quoteId: string;
  quoteNumber: string;
  owner: HousingOwnerInfo;
  locationInfo: HousingLocationInfo;
  pricing: HousingPricing;
  services: HousingServices;
  acceptedAt: string;
  housingName: string;
}

const DEFAULT_CURRENCY = "EUR";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "oui", "yes"].includes(normalized)) return true;
    if (["false", "0", "non", "no"].includes(normalized)) return false;
  }
  if (typeof value === "number") return value === 1;
  return fallback;
}

function stringifyWifiInfo(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";

  const record = value as Record<string, unknown>;
  const name = cleanString(record.nom ?? record.name ?? record.ssid);
  const password = cleanString(record.mdp ?? record.password ?? record.code);
  return [name, password].filter(Boolean).join(" / ");
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(cleanString).filter(Boolean);
}

function ensureDate(value: unknown): string {
  const candidate = cleanString(value);
  return candidate || new Date().toISOString();
}

function buildName(firstName: unknown, lastName: unknown, fallback: unknown): string {
  const joined = [cleanString(firstName), cleanString(lastName)].filter(Boolean).join(" ").trim();
  return joined || cleanString(fallback);
}

function generateClientId(prefix: string, seed: unknown): string {
  const base = cleanString(seed).replace(/[^a-zA-Z0-9_-]/g, "");
  return `${prefix}-${base || Math.random().toString(36).slice(2, 10)}`;
}

function normalizeBathrooms(
  value: unknown,
  count: number | null,
  type: string,
  notes: string,
  seed: unknown,
): HousingBathroomInfo[] {
  if (Array.isArray(value)) {
    return value.map((item, index) => {
      const bathroom = asRecord(item);
      return {
        id: cleanString(bathroom.id) || generateClientId("bathroom", `${seed}-${index}`),
        name: cleanString(bathroom.name) || `Salle de bain ${index + 1}`,
        type: cleanString(bathroom.type) || "Douche",
        notes: cleanString(bathroom.notes),
      };
    });
  }

  const bathroomCount = count ?? 0;
  if (bathroomCount <= 0 && !type && !notes) return [];

  const total = Math.max(bathroomCount, 1);
  return Array.from({ length: total }, (_, index) => ({
    id: generateClientId("bathroom", `${seed}-legacy-${index}`),
    name: `Salle de bain ${index + 1}`,
    type: type || "Douche",
    notes: index === 0 ? notes : "",
  }));
}

export function extractHousingAccessProfileIds(proprietaire: unknown) {
  const owner = asRecord(proprietaire);
  const ids = new Set<string>();

  [
    owner.id,
    owner.userId,
    owner.profile_id,
    owner.owner_id,
    owner.owner_profile_id,
    owner.proprietaire_id,
    owner.manager_profile_id,
    owner.concierge_profile_id,
    owner.managed_by,
  ]
    .map(cleanString)
    .filter(Boolean)
    .forEach((id) => ids.add(id));

  return {
    all: ids,
    ownerId:
      cleanString(owner.owner_profile_id) ||
      cleanString(owner.owner_id) ||
      cleanString(owner.proprietaire_id) ||
      cleanString(owner.id) ||
      cleanString(owner.userId) ||
      cleanString(owner.profile_id) ||
      null,
    managerId:
      cleanString(owner.manager_profile_id) ||
      cleanString(owner.concierge_profile_id) ||
      cleanString(owner.managed_by) ||
      null,
  };
}

export function resolveHousingAccessRole(role: string): HousingAccessRole {
  if (role === "admin" || role === "super_admin") return "admin";
  if (role === "owner" || role === "owner_pro") return "owner";
  if (role === "concierge" || role === "concierge_pro") return "concierge";
  return "unknown";
}

export function canAccessHousing(
  proprietaire: unknown,
  userId: string | undefined,
  role: string,
  isAdmin = false,
) {
  if (!userId) return false;
  if (isAdmin) return true;

  const { ownerId, managerId, all } = extractHousingAccessProfileIds(proprietaire);
  const accessRole = resolveHousingAccessRole(role);

  if (accessRole === "concierge") {
    return managerId === userId || all.has(userId);
  }

  if (accessRole === "owner") {
    return ownerId === userId || all.has(userId);
  }

  return false;
}

export function buildHousingCompletion(housing: Omit<ConciergeHousing, "completion">): HousingCompletion {
  const checks = [
    cleanString(housing.nom_logement).length > 0,
    cleanString(housing.locationInfo.addressLine1).length > 0,
    cleanString(housing.locationInfo.city).length > 0,
    cleanString(housing.owner.fullName).length > 0,
    cleanString(housing.owner.email).length > 0,
    cleanString(housing.characteristics.propertyType).length > 0,
    (housing.characteristics.surfaceSqm ?? 0) > 0,
    housing.services.items.length > 0,
    housing.timeline.length > 0,
    housing.documentsList.length > 0 || cleanString(housing.contractInfo.contractUrl).length > 0,
  ];

  const completed = checks.filter(Boolean).length;
  const total = checks.length;
  return {
    completed,
    total,
    ratio: total === 0 ? 0 : completed / total,
  };
}

export function normalizeOwnerFromProfile(
  profile: Partial<ProfileRow> | null | undefined,
  managerProfileId?: string | null,
): HousingOwnerInfo {
  return {
    profileId: cleanString(profile?.id) || null,
    managerProfileId: cleanString(managerProfileId) || null,
    fullName:
      buildName(profile?.first_name, profile?.last_name, profile?.company_name) ||
      cleanString(profile?.username),
    email: cleanString(profile?.email),
    phone: cleanString(profile?.phone),
    secondaryPhone: "",
    address: cleanString(profile?.street_address),
    primaryContactName: "",
    primaryContactEmail: "",
    primaryContactPhone: "",
    companyName: cleanString(profile?.company_name),
    city: cleanString(profile?.city),
    notes: "",
    invitationMessageTemplate: "",
    source: "directory",
  };
}

export function normalizeHousingRow(row: HousingRow): ConciergeHousing {
  const infos = asRecord(row.infos);
  const proprietaire = asRecord(row.proprietaire);
  const location = asRecord(row.location);
  const menage = asRecord(row.menage);
  const tarifs = asRecord(row.tarifs);
  const contrat = asRecord(row.contrat);

  const servicesSource = Array.isArray(menage.services)
    ? menage.services
    : Array.isArray(infos.services)
    ? infos.services
    : [];
  const timelineSource = Array.isArray(row.planning) ? row.planning : [];
  const documentsSource = Array.isArray(row.documents) ? row.documents : [];

  const normalizedBase = {
    ...row,
    creationMode: cleanString(infos.creation_mode) === "quote" ? "quote" : "manual" as HousingCreationMode,
    owner: {
      profileId:
        cleanString(proprietaire.owner_profile_id) ||
        cleanString(proprietaire.id) ||
        cleanString(proprietaire.profile_id) ||
        null,
      managerProfileId:
        cleanString(proprietaire.manager_profile_id) ||
        cleanString(proprietaire.concierge_profile_id) ||
        cleanString(proprietaire.managed_by) ||
        null,
      fullName:
        cleanString(proprietaire.full_name) ||
        buildName(proprietaire.first_name, proprietaire.last_name, proprietaire.nom) ||
        cleanString(proprietaire.company_name),
      email: cleanString(proprietaire.email) || cleanString(proprietaire.email1),
      phone:
        cleanString(proprietaire.phone) ||
        cleanString(proprietaire.telephone) ||
        cleanString(proprietaire.tel1),
      secondaryPhone: cleanString(proprietaire.secondary_phone) || cleanString(proprietaire.tel2),
      address: cleanString(proprietaire.address) || cleanString(proprietaire.adresse),
      primaryContactName:
        cleanString(proprietaire.primary_contact_name) ||
        cleanString(proprietaire.contact_principal) ||
        cleanString(proprietaire.contactPrincipal),
      primaryContactEmail:
        cleanString(proprietaire.primary_contact_email) ||
        cleanString(proprietaire.mail_principal) ||
        cleanString(proprietaire.email_principal),
      primaryContactPhone:
        cleanString(proprietaire.primary_contact_phone) ||
        cleanString(proprietaire.tel_principal),
      companyName: cleanString(proprietaire.company_name),
      city: cleanString(proprietaire.city),
      notes: cleanString(proprietaire.notes),
      invitationMessageTemplate: cleanString(proprietaire.invitation_message_template),
      source:
        cleanString(proprietaire.source) === "quote"
          ? "quote"
          : cleanString(proprietaire.source) === "manual"
          ? "manual"
          : cleanString(proprietaire.source) === "directory"
          ? "directory"
          : "legacy",
    } as HousingOwnerInfo,
    locationInfo: {
      addressLine1: cleanString(location.address_line_1) || cleanString(row.adresse),
      addressLine2: cleanString(location.address_line_2),
      postalCode: cleanString(location.postal_code),
      city: cleanString(location.city) || cleanString(row.ville),
      country: cleanString(location.country) || "France",
      accessCode: cleanString(location.access_code) || cleanString(infos.digicode),
      floor: cleanString(location.floor),
      entryInstructions: cleanString(location.entry_instructions),
    } as HousingLocationInfo,
    characteristics: {
      propertyType: cleanString(infos.property_type) || cleanString(infos.categorie),
      categorie: cleanString(infos.property_type) || cleanString(infos.categorie),
      platforms: toStringArray(infos.platforms ?? [row.plateforme].filter(Boolean)),
      photos: toStringArray(infos.photos ?? [row.photo_principale].filter(Boolean)),
      surfaceSqm: toOptionalNumber(infos.surface_sqm ?? infos.superficie),
      superficie: toOptionalNumber(infos.surface_sqm ?? infos.superficie),
      roomCount: toOptionalNumber(infos.room_count),
      bedroomCount: toOptionalNumber(infos.bedroom_count ?? infos.nb_chambres),
      nb_chambres: toOptionalNumber(infos.bedroom_count ?? infos.nb_chambres),
      bathroomCount: toOptionalNumber(infos.bathroom_count),
      bathrooms: normalizeBathrooms(
        infos.bathrooms,
        toOptionalNumber(infos.bathroom_count),
        cleanString(infos.bathroom_type),
        cleanString(infos.bathroom_notes),
        row.id,
      ),
      bedCount: toOptionalNumber(infos.bed_count),
      guestCapacity: toOptionalNumber(infos.guest_capacity ?? infos.capacite ?? location.nbCouchages),
      capacite: toOptionalNumber(infos.guest_capacity ?? infos.capacite ?? location.nbCouchages),
      wifiInfo: cleanString(infos.wifi_info) || stringifyWifiInfo(infos.infosWifi ?? infos.infos_wifi),
      keyCount: toOptionalNumber(infos.key_count ?? infos.nb_cles ?? location.nbCles),
      terrace: toBoolean(infos.terrace ?? infos.terrasse ?? location.terrasse),
      terraceSurfaceSqm: toOptionalNumber(infos.terrace_surface_sqm),
      terraceNotes: cleanString(infos.terrace_notes),
      stairs: toBoolean(infos.stairs ?? infos.escaliers ?? location.escaliers),
      stairsFloorCount: toOptionalNumber(infos.stairs_floor_count),
      stairsNotes: cleanString(infos.stairs_notes),
      pool: toBoolean(infos.pool ?? infos.piscine ?? location.piscine),
      poolNotes: cleanString(infos.pool_notes),
      petsAllowed: toBoolean(infos.pets_allowed ?? infos.animaux_acceptes ?? location.animauxAcceptes),
      petsNotes: cleanString(infos.pets_notes),
      nonSmoking: toBoolean(
        infos.non_smoking ?? infos.non_fumeur,
        typeof location.fumeur === "boolean" ? !location.fumeur : false,
      ),
      barbecue: toBoolean(infos.barbecue ?? location.barbecue),
      barbecueType: cleanString(infos.barbecue_type),
      chequeRequired: toBoolean(
        infos.cheque_required ?? infos.cheque_a_demander ?? location.chequeDemande,
      ),
      chequeAmount: toOptionalNumber(infos.cheque_amount),
      bathroomType: cleanString(infos.bathroom_type),
      bathroomNotes: cleanString(infos.bathroom_notes),
      amenities: toStringArray(infos.amenities ?? infos.equipements),
      equipements: toStringArray(infos.amenities ?? infos.equipements),
      description: cleanString(infos.description),
    } as HousingCharacteristics,
    services: {
      items: servicesSource.map((service, index) => {
        const item = asRecord(service);
        return {
          id: cleanString(item.id) || generateClientId("service", `${row.id}-${index}`),
          label: cleanString(item.label) || cleanString(item.name),
          category: cleanString(item.category),
          frequency: cleanString(item.frequency),
          unitPrice: toOptionalNumber(item.unit_price ?? item.unitPrice),
          totalPrice: toOptionalNumber(item.total_price ?? item.totalPrice),
          included: item.included !== false,
          status: (cleanString(item.status) as HousingServiceStatus) || "included",
          sourceQuoteItemId: cleanString(item.source_quote_item_id) || null,
          notes: cleanString(item.notes),
        };
      }),
      housekeepingNotes: cleanString(menage.instructions),
      internalNotes: cleanString(menage.internal_notes) || cleanString(Array.isArray(row.notes) ? row.notes.join("\n") : ""),
      temps: cleanString(menage.temps),
      checklist: cleanString(menage.checklist),
      instructions: cleanString(menage.instructions),
    } as HousingServices,
    stockManagement: normalizeHousingStockManagement(infos.stock_management),
    timeline: timelineSource.map((entry, index) => {
      const item = asRecord(entry);
      return {
        id: cleanString(item.id) || generateClientId("timeline", `${row.id}-${index}`),
        title: cleanString(item.title) || cleanString(item.type) || "Intervention",
        description: cleanString(item.description),
        date: ensureDate(item.date ?? item.created_at),
        type: (cleanString(item.entry_type ?? item.type) as HousingTimelineType) || "service",
        status: (cleanString(item.status) as HousingTimelineStatus) || "planned",
        actor: cleanString(item.actor) || cleanString(item.agent) || cleanString(item.guest),
        source: cleanString(item.source) || "housing",
      };
    }),
    documentsList: documentsSource.map((document, index) => {
      const item = asRecord(document);
      return {
        id: cleanString(item.id) || generateClientId("doc", `${row.id}-${index}`),
        name: cleanString(item.name),
        type: (cleanString(item.type) as HousingDocumentType) || "other",
        url: cleanString(item.url) || cleanString(item.file),
        uploadedAt: ensureDate(item.uploaded_at ?? item.created_at),
        status: cleanString(item.status) || "available",
      };
    }),
    pricing: {
      currency: cleanString(tarifs.currency) || DEFAULT_CURRENCY,
      baseRate: toOptionalNumber(tarifs.base_rate ?? tarifs.prix_base),
      prix_base: toOptionalNumber(tarifs.base_rate ?? tarifs.prix_base),
      nightlyRate: toOptionalNumber(tarifs.nightly_rate ?? tarifs.prix_par_nuit ?? location.prix_nuit),
      prix_par_nuit: toOptionalNumber(tarifs.nightly_rate ?? tarifs.prix_par_nuit ?? location.prix_nuit),
      cleaningFee: toOptionalNumber(tarifs.cleaning_fee ?? tarifs.frais_menage ?? location.frais_menage),
      frais_menage: toOptionalNumber(tarifs.cleaning_fee ?? tarifs.frais_menage ?? location.frais_menage),
      securityDeposit: toOptionalNumber(tarifs.security_deposit ?? tarifs.caution ?? location.caution),
      caution: toOptionalNumber(tarifs.security_deposit ?? tarifs.caution ?? location.caution),
      commissionRate: toOptionalNumber(tarifs.commission_rate),
      totalContractValue: toOptionalNumber(tarifs.total_contract_value),
    } as HousingPricing,
    contractInfo: {
      contractUrl: cleanString(contrat.contract_url) || cleanString(contrat.fichier_pdf),
      fichier_pdf: cleanString(contrat.contract_url) || cleanString(contrat.fichier_pdf),
      signedAt: cleanString(contrat.signed_at) || cleanString(contrat.date_signature),
      autoRenew: Boolean(contrat.auto_renew ?? contrat.renouvellement_auto),
      renouvellement_auto: Boolean(contrat.auto_renew ?? contrat.renouvellement_auto),
      quoteId: cleanString(contrat.quote_id) || null,
      quoteNumber: cleanString(contrat.quote_number),
    } as HousingContractInfo,
  };

  return {
    ...normalizedBase,
    completion: buildHousingCompletion(normalizedBase),
  };
}

export function buildHousingMutationPayload(
  housing: Pick<
    ConciergeHousing,
    | "id"
    | "external_id"
    | "nom_logement"
    | "plateforme"
    | "statut"
    | "photo_principale"
    | "creationMode"
    | "owner"
    | "locationInfo"
    | "characteristics"
    | "services"
    | "timeline"
    | "documentsList"
    | "pricing"
    | "contractInfo"
  > & { stockManagement?: HousingStockManagement },
): HousingInsert {
  const stockManagement = housing.stockManagement ?? EMPTY_HOUSING_STOCK_MANAGEMENT;

  return {
    external_id: housing.external_id ?? null,
    nom_logement: cleanString(housing.nom_logement) || null,
    ville: cleanString(housing.locationInfo.city) || null,
    adresse: cleanString(housing.locationInfo.addressLine1) || null,
    plateforme: cleanString(housing.plateforme) || null,
    statut: cleanString(housing.statut) || null,
    photo_principale: cleanString(housing.photo_principale) || null,
    infos: ({
      creation_mode: housing.creationMode,
      property_type: cleanString(housing.characteristics.propertyType),
      photos: housing.characteristics.photos,
      surface_sqm: housing.characteristics.surfaceSqm,
      platforms: housing.characteristics.platforms ?? [],
      room_count: housing.characteristics.roomCount,
      bedroom_count: housing.characteristics.bedroomCount,
      bathroom_count: housing.characteristics.bathroomCount,
      bed_count: housing.characteristics.bedCount,
      guest_capacity: housing.characteristics.guestCapacity,
      wifi_info: cleanString(housing.characteristics.wifiInfo),
      key_count: housing.characteristics.keyCount,
      terrace: housing.characteristics.terrace,
      terrace_surface_sqm: housing.characteristics.terraceSurfaceSqm ?? null,
      terrace_notes: cleanString(housing.characteristics.terraceNotes),
      stairs: housing.characteristics.stairs,
      stairs_floor_count: housing.characteristics.stairsFloorCount ?? null,
      stairs_notes: cleanString(housing.characteristics.stairsNotes),
      pool: housing.characteristics.pool,
      pool_notes: cleanString(housing.characteristics.poolNotes),
      pets_allowed: housing.characteristics.petsAllowed,
      pets_notes: cleanString(housing.characteristics.petsNotes),
      non_smoking: housing.characteristics.nonSmoking,
      barbecue: housing.characteristics.barbecue,
      barbecue_type: cleanString(housing.characteristics.barbecueType),
      cheque_required: housing.characteristics.chequeRequired,
      cheque_amount: housing.characteristics.chequeAmount ?? null,
      bathrooms: housing.characteristics.bathrooms,
      bathroom_type: cleanString(housing.characteristics.bathroomType),
      bathroom_notes: cleanString(housing.characteristics.bathroomNotes),
      amenities: housing.characteristics.amenities,
      equipements: housing.characteristics.amenities,
      stock_management: stockManagement,
      description: cleanString(housing.characteristics.description),
    } as unknown) as Json,
    proprietaire: {
      id: housing.owner.profileId,
      owner_profile_id: housing.owner.profileId,
      manager_profile_id: housing.owner.managerProfileId,
      full_name: cleanString(housing.owner.fullName),
      email: cleanString(housing.owner.email),
      phone: cleanString(housing.owner.phone),
      secondary_phone: cleanString(housing.owner.secondaryPhone),
      address: cleanString(housing.owner.address),
      primary_contact_name: cleanString(housing.owner.primaryContactName),
      primary_contact_email: cleanString(housing.owner.primaryContactEmail),
      primary_contact_phone: cleanString(housing.owner.primaryContactPhone),
      company_name: cleanString(housing.owner.companyName),
      city: cleanString(housing.owner.city),
      notes: cleanString(housing.owner.notes),
      invitation_message_template: cleanString(housing.owner.invitationMessageTemplate),
      source: housing.owner.source,
    } as Json,
    location: {
      address_line_1: cleanString(housing.locationInfo.addressLine1),
      address_line_2: cleanString(housing.locationInfo.addressLine2),
      postal_code: cleanString(housing.locationInfo.postalCode),
      city: cleanString(housing.locationInfo.city),
      country: cleanString(housing.locationInfo.country),
      access_code: cleanString(housing.locationInfo.accessCode),
      floor: cleanString(housing.locationInfo.floor),
      entry_instructions: cleanString(housing.locationInfo.entryInstructions),
    } as Json,
    menage: {
      services: housing.services.items.map((item) => ({
        id: item.id,
        label: cleanString(item.label),
        category: cleanString(item.category),
        frequency: cleanString(item.frequency),
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        included: item.included,
        status: item.status,
        source_quote_item_id: item.sourceQuoteItemId,
        notes: cleanString(item.notes),
      })),
      instructions: cleanString(housing.services.housekeepingNotes),
      internal_notes: cleanString(housing.services.internalNotes),
    } as Json,
    planning: housing.timeline.map((item) => ({
      id: item.id,
      title: cleanString(item.title),
      description: cleanString(item.description),
      date: ensureDate(item.date),
      entry_type: item.type,
      status: item.status,
      actor: cleanString(item.actor),
      source: cleanString(item.source),
    })) as Json,
    documents: housing.documentsList.map((item) => ({
      id: item.id,
      name: cleanString(item.name),
      type: item.type,
      url: cleanString(item.url),
      uploaded_at: ensureDate(item.uploadedAt),
      status: cleanString(item.status),
    })) as Json,
    tarifs: {
      currency: cleanString(housing.pricing.currency) || DEFAULT_CURRENCY,
      base_rate: housing.pricing.baseRate,
      nightly_rate: housing.pricing.nightlyRate,
      cleaning_fee: housing.pricing.cleaningFee,
      security_deposit: housing.pricing.securityDeposit,
      commission_rate: housing.pricing.commissionRate,
      total_contract_value: housing.pricing.totalContractValue,
    } as Json,
    contrat: {
      contract_url: cleanString(housing.contractInfo.contractUrl),
      signed_at: cleanString(housing.contractInfo.signedAt),
      auto_renew: housing.contractInfo.autoRenew,
      quote_id: housing.contractInfo.quoteId,
      quote_number: cleanString(housing.contractInfo.quoteNumber),
    } as Json,
    notes: housing.services.internalNotes
      .split("\n")
      .map((note) => note.trim())
      .filter(Boolean) as Json,
  };
}

export function validateHousingDraft(housing: ConciergeHousing) {
  if (!cleanString(housing.nom_logement)) {
    return "Le nom du logement est obligatoire.";
  }
  if (!cleanString(housing.locationInfo.addressLine1)) {
    return "L'adresse complete du logement est obligatoire.";
  }
  if (!cleanString(housing.locationInfo.city)) {
    return "La ville du logement est obligatoire.";
  }
  if (!cleanString(housing.owner.fullName)) {
    return "Le proprietaire doit etre renseigne.";
  }
  if (!cleanString(housing.owner.email)) {
    return "L'email proprietaire est obligatoire pour le suivi.";
  }
  if (!cleanString(housing.characteristics.propertyType)) {
    return "Le type de logement est obligatoire.";
  }
  if ((housing.characteristics.surfaceSqm ?? 0) <= 0) {
    return "La surface doit etre superieure a 0.";
  }
  if ((housing.characteristics.bedroomCount ?? -1) < 0) {
    return "Le nombre de chambres est invalide.";
  }
  if (housing.creationMode === "manual" && housing.services.items.length === 0) {
    return "Ajoutez au moins un service associé pour finaliser la création manuelle.";
  }
  return null;
}

export function buildQuotePreviewFromData(input: {
  quote: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
  ownerProfile?: Partial<ProfileRow> | null;
  managerProfileId?: string | null;
}): QuotePreview {
  const metadata = asRecord(input.quote.metadata);
  const owner = input.ownerProfile
    ? normalizeOwnerFromProfile(input.ownerProfile, input.managerProfileId)
    : {
        profileId: cleanString(input.quote.owner_profile_id) || null,
        managerProfileId: cleanString(input.managerProfileId) || null,
        fullName: cleanString(metadata.owner_name) || "Proprietaire",
        email: cleanString(metadata.owner_email),
        phone: cleanString(metadata.owner_phone),
        secondaryPhone: "",
        address: "",
        primaryContactName: "",
        primaryContactEmail: "",
        primaryContactPhone: "",
        companyName: cleanString(metadata.owner_company),
        city: cleanString(metadata.city),
        notes: "",
        source: "quote" as const,
      };

  const services: HousingServices = {
    items: input.items.map((item, index) => ({
      id: generateClientId("quote-service", item.id ?? `${index}`),
      label: cleanString(item.label),
      category: cleanString(asRecord(item.metadata).category) || "service",
      frequency: cleanString(asRecord(item.metadata).frequency) || "Selon devis",
      unitPrice: toOptionalNumber(item.unit_price),
      totalPrice: toOptionalNumber(item.line_total),
      included: true,
      status: "active",
      sourceQuoteItemId: cleanString(item.id) || null,
      notes: cleanString(item.description),
    })),
    housekeepingNotes: cleanString(metadata.housekeeping_notes),
    internalNotes: cleanString(metadata.internal_notes),
  };

  return {
    quoteId: cleanString(input.quote.id),
    quoteNumber: cleanString(input.quote.quote_number),
    owner: {
      ...owner,
      source: "quote",
    },
    locationInfo: {
      addressLine1:
        cleanString(metadata.service_address) ||
        cleanString(metadata.property_address) ||
        cleanString(metadata.address_line_1) ||
        cleanString(input.ownerProfile?.street_address),
      addressLine2: cleanString(metadata.address_line_2),
      postalCode: cleanString(metadata.postal_code) || cleanString(input.ownerProfile?.postal_code),
      city: cleanString(metadata.city) || cleanString(input.ownerProfile?.city),
      country: cleanString(metadata.country) || cleanString(input.ownerProfile?.country) || "France",
      accessCode: cleanString(metadata.access_code),
      floor: cleanString(metadata.floor),
      entryInstructions: cleanString(metadata.entry_instructions),
    },
    pricing: {
      currency: cleanString(input.quote.currency) || DEFAULT_CURRENCY,
      baseRate: toOptionalNumber(input.quote.subtotal),
      nightlyRate: toOptionalNumber(metadata.nightly_rate),
      cleaningFee: toOptionalNumber(metadata.cleaning_fee),
      securityDeposit: toOptionalNumber(metadata.security_deposit),
      commissionRate: toOptionalNumber(metadata.commission_rate),
      totalContractValue: toOptionalNumber(input.quote.total_amount),
    },
    services,
    acceptedAt: cleanString(input.quote.accepted_at),
    housingName:
      cleanString(metadata.housing_name) ||
      cleanString(metadata.property_name) ||
      `Logement ${cleanString(input.quote.quote_number) || cleanString(input.quote.id)}`,
  };
}
