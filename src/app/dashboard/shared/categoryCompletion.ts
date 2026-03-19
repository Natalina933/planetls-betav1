import {
  buildCompletionState,
  type CompletionState,
} from "@/components/dashboard/profile/completion";

export type GenericRecord = Record<string, unknown>;

function parseStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);
    }
  } catch {
    // Fallback to comma-separated values.
  }

  return trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAvailabilityPayload(value: unknown): GenericRecord {
  if (typeof value !== "string" || !value.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return { schedule: parsed };
    }

    return parsed && typeof parsed === "object" ? (parsed as GenericRecord) : {};
  } catch {
    return {};
  }
}

function getNestedRecord(value: unknown): GenericRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as GenericRecord)
    : null;
}

function getDocumentCount(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  const record = getNestedRecord(value);
  if (!record) return 0;

  const nestedItems = record.items;
  return Array.isArray(nestedItems) ? nestedItems.length : 0;
}

function getHousingPhotosCount(housing: GenericRecord): number {
  const infos = getNestedRecord(housing.infos);
  const photos = Array.isArray(infos?.photos) ? infos?.photos : [];
  const mainPhoto = typeof housing.photo_principale === "string" ? housing.photo_principale.trim() : "";
  return photos.length + (mainPhoto ? 1 : 0);
}

function getHousingEquipmentCount(housing: GenericRecord): number {
  const infos = getNestedRecord(housing.infos);
  const equipments = Array.isArray(infos?.equipements) ? infos?.equipements : [];
  return equipments.length;
}

function hasHousingCoreInfo(housing: GenericRecord): boolean {
  const infos = getNestedRecord(housing.infos);
  return Boolean(
    String(housing.nom_logement ?? "").trim() &&
      String(housing.ville ?? "").trim() &&
      String(infos?.categorie ?? "").trim() &&
      Number(infos?.capacite ?? 0) > 0,
  );
}

function getMissionSetup(profile: GenericRecord | null) {
  const availability = parseAvailabilityPayload(profile?.availability_hours);
  const missionProfile =
    availability.missionProfile && typeof availability.missionProfile === "object"
      ? (availability.missionProfile as GenericRecord)
      : null;
  const missionRows = Array.isArray(missionProfile?.missions)
    ? missionProfile?.missions
    : [];
  const activeMissionCount = missionRows.filter(
    (item) => item && typeof item === "object" && (item as GenericRecord).isActive === true,
  ).length;
  const fallbackServiceCount = parseStringList(profile?.option).length;
  const zones = Array.isArray(availability.zones) ? availability.zones : [];
  const schedule = Array.isArray(availability.schedule) ? availability.schedule : [];
  const openDaysCount = schedule.filter((day) => {
    if (!day || typeof day !== "object") return false;
    const ranges = (day as GenericRecord).ranges;
    return Array.isArray(ranges) && ranges.length > 0;
  }).length;
  const rangesCount = schedule.reduce((total, day) => {
    if (!day || typeof day !== "object") return total;
    const ranges = (day as GenericRecord).ranges;
    return total + (Array.isArray(ranges) ? ranges.length : 0);
  }, 0);

  return {
    activeServiceCount: Math.max(activeMissionCount, fallbackServiceCount),
    zoneCount: zones.length,
    hasFallbackZone: Boolean(
      String(profile?.service_area ?? profile?.city ?? profile?.location ?? "").trim(),
    ),
    openDaysCount,
    rangesCount,
  };
}

function isActiveStatus(value: unknown) {
  return value === "active" || value === "published";
}

function isOngoingMission(value: unknown) {
  return value === "assigned" || value === "accepted" || value === "in_progress";
}

function hasTrackedPaymentStatus(value: unknown) {
  return ["paid", "partial", "sent"].includes(String(value ?? ""));
}

export function buildConciergeProfileCompletion(profile: GenericRecord | null): CompletionState {
  return buildCompletionState([
    { label: "Prénom", complete: Boolean(String(profile?.first_name ?? "").trim()) },
    { label: "Nom", complete: Boolean(String(profile?.last_name ?? "").trim()) },
    { label: "Email", complete: Boolean(String(profile?.email ?? "").trim()) },
    { label: "Téléphone", complete: Boolean(String(profile?.phone ?? "").trim()) },
    { label: "Nom commercial", complete: Boolean(String(profile?.company_name ?? "").trim()) },
    { label: "SIREN", complete: Boolean(String(profile?.siren ?? "").trim()) },
    { label: "SIRET", complete: Boolean(String(profile?.siret ?? "").trim()) },
    { label: "Adresse", complete: Boolean(String(profile?.street_address ?? "").trim()) },
    { label: "Code postal", complete: Boolean(String(profile?.postal_code ?? "").trim()) },
    { label: "Ville", complete: Boolean(String(profile?.city ?? "").trim()) },
    {
      label: "Niveau d'expérience",
      complete: Boolean(String(profile?.experience_level ?? "").trim()),
    },
  ]);
}

export function buildConciergeMissionsCompletion(input: {
  profile: GenericRecord | null;
  requestCount: number;
  messageCount: number;
}): CompletionState {
  const missionSetup = getMissionSetup(input.profile);

  return buildCompletionState([
    {
      label: "Services actifs",
      complete: missionSetup.activeServiceCount > 0,
    },
    {
      label: "Zone d'intervention",
      complete: missionSetup.zoneCount > 0 || missionSetup.hasFallbackZone,
    },
    {
      label: "Disponibilités hebdomadaires",
      complete: missionSetup.openDaysCount > 0 && missionSetup.rangesCount > 0,
    },
    {
      label: "Demandes reçues",
      complete: input.requestCount > 0,
    },
    {
      label: "Messages propriétaires",
      complete: input.messageCount > 0,
    },
  ]);
}

export function buildConciergeHousingCompletion(housings: GenericRecord[]): CompletionState {
  return buildCompletionState([
    {
      label: "Premier logement créé",
      complete: housings.length > 0,
    },
    {
      label: "Logement actif",
      complete: housings.some((housing) => isActiveStatus(housing.statut)),
    },
    {
      label: "Informations clés renseignées",
      complete: housings.some((housing) => hasHousingCoreInfo(housing)),
    },
    {
      label: "Photos disponibles",
      complete: housings.some((housing) => getHousingPhotosCount(housing) > 0),
    },
    {
      label: "Documents associés",
      complete: housings.some((housing) => getDocumentCount(housing.documents) > 0),
    },
    {
      label: "Équipements renseignés",
      complete: housings.some((housing) => getHousingEquipmentCount(housing) > 0),
    },
  ]);
}

export function buildConciergeOwnersCompletion(conversations: GenericRecord[]): CompletionState {
  const activeConversations = conversations.filter((conversation) => conversation.status !== "closed");
  const recentConversations = activeConversations.filter((conversation) => {
    const rawDate = conversation.last_message_at;
    if (typeof rawDate !== "string") return false;
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return false;
    return Date.now() - date.getTime() <= 5 * 24 * 60 * 60 * 1000;
  });

  return buildCompletionState([
    {
      label: "Relation active",
      complete: activeConversations.length > 0,
    },
    {
      label: "Pipeline engagé",
      complete: recentConversations.length > 0,
    },
    {
      label: "Messages propriétaires",
      complete: conversations.length > 0,
    },
  ]);
}

export function buildConciergeFinancesCompletion(input: {
  billingEventsCount: number;
  pricingRowsCount: number;
  packagesCount: number;
}): CompletionState {
  return buildCompletionState([
    {
      label: "Devis & factures",
      complete: input.billingEventsCount > 0,
    },
    {
      label: "Tarifs configurés",
      complete: input.pricingRowsCount > 0,
    },
    {
      label: "Packs publiables",
      complete: input.packagesCount > 0,
    },
    {
      label: "Base commerciale active",
      complete: input.pricingRowsCount > 0 || input.packagesCount > 0,
    },
  ]);
}

export function buildOwnerHousingCompletion(housings: GenericRecord[]): CompletionState {
  return buildCompletionState([
    { label: "Premier logement créé", complete: housings.length > 0 },
    {
      label: "Logement actif",
      complete: housings.some((housing) => isActiveStatus(housing.statut)),
    },
    {
      label: "Informations clés renseignées",
      complete: housings.some((housing) => hasHousingCoreInfo(housing)),
    },
    {
      label: "Photos disponibles",
      complete: housings.some((housing) => getHousingPhotosCount(housing) > 0),
    },
    {
      label: "Documents associés",
      complete: housings.some((housing) => getDocumentCount(housing.documents) > 0),
    },
    {
      label: "Équipements renseignés",
      complete: housings.some((housing) => getHousingEquipmentCount(housing) > 0),
    },
  ]);
}

export function buildOwnerMissionsCompletion(input: {
  missions: GenericRecord[];
  conversations: GenericRecord[];
}): CompletionState {
  return buildCompletionState([
    { label: "Première mission", complete: input.missions.length > 0 },
    {
      label: "Mission en cours",
      complete: input.missions.some((mission) => isOngoingMission(mission.status)),
    },
    {
      label: "Messages mission",
      complete: input.conversations.length > 0,
    },
  ]);
}

export function buildOwnerConciergeCompletion(input: {
  requestsCount: number;
  conversations: GenericRecord[];
}): CompletionState {
  const activeConversations = input.conversations.filter(
    (conversation) => (conversation.unread_count as number | undefined ?? 0) > 0,
  );

  return buildCompletionState([
    { label: "Demande envoyée", complete: input.requestsCount > 0 },
    { label: "Contact concierge", complete: input.conversations.length > 0 },
    { label: "Suivi actif", complete: activeConversations.length > 0 },
  ]);
}

export function buildOwnerFinancesCompletion(input: {
  quotes: GenericRecord[];
  invoices: GenericRecord[];
}): CompletionState {
  return buildCompletionState([
    { label: "Devis", complete: input.quotes.length > 0 },
    {
      label: "Devis à suivre",
      complete: input.quotes.some((quote) => ["draft", "sent", "accepted"].includes(String(quote.status ?? ""))),
    },
    { label: "Factures", complete: input.invoices.length > 0 },
    {
      label: "Règlements suivis",
      complete: input.invoices.some((invoice) => hasTrackedPaymentStatus(invoice.status)),
    },
  ]);
}

export function buildProviderInterventionsCompletion(input: {
  interventions: GenericRecord[];
  alerts: GenericRecord[];
  conversations: GenericRecord[];
}): CompletionState {
  return buildCompletionState([
    { label: "Première intervention", complete: input.interventions.length > 0 },
    {
      label: "Planning actif",
      complete: input.interventions.some((item) => Boolean(item.scheduled_start)),
    },
    { label: "Alertes suivies", complete: input.alerts.length > 0 },
    { label: "Messages clients", complete: input.conversations.length > 0 },
  ]);
}

export function buildProviderClientsCompletion(input: {
  clients: GenericRecord[];
  conversations: GenericRecord[];
}): CompletionState {
  return buildCompletionState([
    { label: "Premier client", complete: input.clients.length > 0 },
    {
      label: "Client actif",
      complete: input.clients.some((client) => String(client.status ?? "") === "active"),
    },
    { label: "Conversations clients", complete: input.conversations.length > 0 },
  ]);
}

export function buildProviderFinancesCompletion(input: {
  interventions: GenericRecord[];
  clients: GenericRecord[];
}): CompletionState {
  return buildCompletionState([
    {
      label: "Client facturable",
      complete: input.clients.length > 0,
    },
    {
      label: "Budget renseigné",
      complete: input.interventions.some(
        (item) => typeof item.budget_amount === "number" && Number(item.budget_amount) > 0,
      ),
    },
    {
      label: "Intervention terminée",
      complete: input.interventions.some((item) => String(item.status ?? "") === "completed"),
    },
  ]);
}
