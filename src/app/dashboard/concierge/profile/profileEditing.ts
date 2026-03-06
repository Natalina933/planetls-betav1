import type { PricingFallbackInput } from "@/app/components/tariffs/pricingEngine";
import type { PricingV2Config, SeasonalPricingConfig } from "@/app/components/tariffs/types";

export type SectionEditSnapshots = Record<string, string>;
export type OpenSectionsState = Record<string, boolean>;

interface ProgressStepLike {
  done: boolean;
}

interface ReadyCheckLike {
  ready: boolean;
}

interface PricingServiceLike {
  id: number;
  category: string;
  service: string;
}

interface ServicePriceLike {
  service_id: number | null;
}

interface PricingSegmentLike {
  id: string;
  name: string;
  commission_delta_pct: number;
  setup_fee_delta_pct: number;
  is_default?: boolean | null;
}

interface PricingPropertyRuleLike {
  id?: string;
  service_id: number | null;
  property_type: string | null;
  min_surface_m2: number | null;
  max_surface_m2: number | null;
  delta_pct: number;
}

interface PricingSegmentDraftLike {
  name: string;
  commission_delta_pct: string;
  setup_fee_delta_pct: string;
}

interface PricingPropertyRuleDraftLike {
  service_id: string;
  property_type: string;
  min_surface_m2: string;
  max_surface_m2: string;
  delta_pct: string;
}

interface PricingModalStateLike {
  id?: string;
  serviceId: string;
  label: string;
  type: string;
  amount: string;
  unit: string;
}

interface CatalogServiceLabelLike {
  id: number;
  service: string;
}

interface ServicePriceRowLike {
  id: string;
  service_id: number | null;
}

interface ServicePriceModalRowLike {
  id: string;
  service_id: number | null;
  label: string | null;
  type: string | null;
  amount: number | null;
  unit: string | null;
}

interface MissionCatalogLike {
  id: string;
  label: string;
}

interface MissionProfileMissionLike {
  id: string;
  label: string;
  isActive: boolean;
  minNoticeHours: number;
  allowUrgent: boolean;
  urgentMultiplier: number;
}

interface MissionProfileLike {
  missions: MissionProfileMissionLike[];
}

interface LegacyMissionProfileInputLike {
  missions: MissionProfileMissionLike[];
  positioning?: "standard" | "urgent_24_7" | "premium";
}

interface MissionPayloadLike {
  missionProfile: MissionProfileLike;
  missionCatalog: MissionCatalogLike[];
  preferences: unknown;
}

interface ProfileWithAvailabilityLike {
  availability_hours?: string | null;
}

interface PricingCatalogRowLike<TService extends PricingServiceLike, TPrice> {
  service: TService;
  pricing: TPrice | null;
  isActiveMissionService: boolean;
}

interface ProfileIdentityLike {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  id?: string;
  onboarding_complete?: boolean;
  availability_hours?: string | null;
  hourly_rate?: number | null;
  travel_fee?: number | null;
}

export function createSectionSnapshot<T>(value: T | null): string | null {
  return value ? JSON.stringify(value) : null;
}

export function removeSectionSnapshot(
  snapshots: SectionEditSnapshots,
  sectionId: string | null,
): SectionEditSnapshots {
  if (!sectionId || !(sectionId in snapshots)) {
    return snapshots;
  }

  const next = { ...snapshots };
  delete next[sectionId];
  return next;
}

export function upsertSectionSnapshot<T>(
  snapshots: SectionEditSnapshots,
  sectionId: string,
  value: T | null,
): SectionEditSnapshots {
  const snapshot = createSectionSnapshot(value);
  if (snapshot == null) {
    return snapshots;
  }

  return {
    ...snapshots,
    [sectionId]: snapshot,
  };
}

export function hasSectionUnsavedChanges<T>(
  snapshots: SectionEditSnapshots,
  sectionId: string | null,
  currentValue: T | null,
): boolean {
  if (!sectionId || currentValue == null) {
    return false;
  }

  const snapshot = snapshots[sectionId];
  if (typeof snapshot !== "string") {
    return false;
  }

  return snapshot !== JSON.stringify(currentValue);
}

export function hasValidationErrors(errors: Record<string, string>): boolean {
  return Object.values(errors).some((error) => error !== "");
}

export function shouldCompleteMissionOnboarding(
  activeTab: string,
  progressSteps: Array<{ done: boolean }>,
  profile: ProfileIdentityLike | null,
): boolean {
  const onboardingReady =
    progressSteps.length > 0 && progressSteps.every((step) => step.done);

  return (
    activeTab === "missions" &&
    onboardingReady &&
    profile?.onboarding_complete !== true
  );
}

export function buildProfileSavePayload<T extends ProfileIdentityLike>(
  profile: T,
  avatarUrl: string | null,
  markOnboardingComplete: boolean,
): T & { avatar_url: string | null; onboarding_complete?: boolean } {
  return {
    ...profile,
    avatar_url: avatarUrl,
    ...(markOnboardingComplete ? { onboarding_complete: true } : {}),
  };
}

export function toggleOpenSection(
  openSections: OpenSectionsState,
  sectionId: string,
): OpenSectionsState {
  return {
    ...openSections,
    [sectionId]: !openSections[sectionId],
  };
}

export function ensureOpenSection(
  openSections: OpenSectionsState,
  sectionId: string,
): OpenSectionsState {
  return {
    ...openSections,
    [sectionId]: true,
  };
}

export function toggleCollapsedCategory(
  collapsedCategories: Record<string, boolean>,
  category: string,
): Record<string, boolean> {
  return {
    ...collapsedCategories,
    [category]: !collapsedCategories[category],
  };
}

export function scrollToPageSection(sectionId: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const target = document.getElementById(sectionId);
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function updateSocialFieldValue<
  T extends { website?: unknown; linkedin?: unknown; instagram?: unknown; facebook?: unknown },
>(
  profile: T | null,
  field: "website" | "linkedin" | "instagram" | "facebook",
  value: string,
): T | null {
  if (!profile) {
    return profile;
  }

  return {
    ...profile,
    [field]: value,
  };
}

export function updateProfileFieldValue<
  T extends ProfileIdentityLike,
>(
  profile: T | null,
  name: string,
  value: string,
  options: {
    parseSeasonalPricing: (value?: string | null) => SeasonalPricingConfig;
    parsePricingV2FromAvailabilityHours: (
      value: string | null | undefined,
      context: PricingFallbackInput,
    ) => PricingV2Config;
    syncSeasonalPricingFromPricingV2: (
      seasonal: SeasonalPricingConfig,
      pricingV2: PricingV2Config,
    ) => SeasonalPricingConfig;
    parseAvailabilityPayloadRaw: (value?: string | null) => Record<string, unknown>;
  },
): T | null {
  if (!profile) {
    return profile;
  }

  const isBaseTariffField = name === "hourly_rate" || name === "travel_fee";
  if (!isBaseTariffField) {
    return {
      ...profile,
      [name]: value,
    } as T;
  }

  const parsedValue =
    value.trim() === "" ? null : Number.isFinite(Number(value)) ? Number(value) : null;
  const fallbackSeasonal = options.parseSeasonalPricing(profile.availability_hours);
  const pricingV2Next = options.parsePricingV2FromAvailabilityHours(
    profile.availability_hours,
    {
      hourlyRate: profile.hourly_rate ?? 0,
      travelFee: profile.travel_fee ?? 0,
      seasonalPricing: fallbackSeasonal,
    },
  );

  if (name === "hourly_rate") {
    pricingV2Next.base.hourlyRate = Math.max(0, parsedValue ?? 0);
  } else {
    pricingV2Next.base.travelFee = Math.max(0, parsedValue ?? 0);
  }

  const syncedLegacy = options.syncSeasonalPricingFromPricingV2(
    fallbackSeasonal,
    pricingV2Next,
  );

  return {
    ...profile,
    [name]: parsedValue,
    availability_hours: JSON.stringify({
      ...options.parseAvailabilityPayloadRaw(profile.availability_hours),
      pricing: syncedLegacy,
      pricing_v2: pricingV2Next,
    }),
  } as T;
}

export function validateProfileField(name: string, value: string): string {
  if (!value) {
    return "";
  }

  if (name === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? "" : "Email invalide";
  }

  if (name === "phone") {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(value) ? "" : "Téléphone invalide";
  }

  if (name === "siret") {
    const siretRegex = /^[0-9]{14}$/;
    return siretRegex.test(value.replace(/\s/g, ""))
      ? ""
      : "SIRET invalide (14 chiffres)";
  }

  if (name === "siren") {
    const sirenRegex = /^[0-9]{9}$/;
    return sirenRegex.test(value.replace(/\s/g, ""))
      ? ""
      : "SIREN invalide (9 chiffres)";
  }

  if (name === "postal_code") {
    const postalRegex = /^[0-9]{5}$/;
    return postalRegex.test(value) ? "" : "Code postal invalide (5 chiffres)";
  }

  if (name === "website") {
    const urlRegex =
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    return urlRegex.test(value) ? "" : "URL invalide";
  }

  if (name === "iban") {
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
    return ibanRegex.test(value.replace(/\s/g, ""))
      ? ""
      : "IBAN invalide";
  }

  return "";
}

export function buildMissionProgressSteps(
  activeMissionServiceCount: number,
  missionZoneCount: number,
  missionOpenDaysCount: number,
  missionRangesCount: number,
  sectionIds: {
    SERVICES: string;
    ZONE_RULES: string;
    WEEKLY_AVAILABILITY: string;
  },
) {
  return [
    {
      key: "services",
      label: "Services proposes",
      hint: "Definissez les prestations que vous acceptez.",
      done: activeMissionServiceCount > 0,
      sectionId: sectionIds.SERVICES,
    },
    {
      key: "zone",
      label: "Zone d'intervention",
      hint: "Ajoutez des zones et un rayon de couverture.",
      done: missionZoneCount > 0,
      sectionId: sectionIds.ZONE_RULES,
    },
    {
      key: "availability",
      label: "Disponibilites hebdomadaires",
      hint: "Renseignez vos jours et plages horaires.",
      done: missionOpenDaysCount > 0 && missionRangesCount > 0,
      sectionId: sectionIds.WEEKLY_AVAILABILITY,
    },
  ];
}

export function buildTariffReadinessChecks(input: {
  activeMissionServiceCount: number;
  hourlyRate: number | null | undefined;
  location: string | null | undefined;
  serviceArea: string | null | undefined;
  missionRowsCount: number;
}) {
  return [
    {
      id: "services",
      label: "Services actifs",
      ready: input.activeMissionServiceCount > 0,
    },
    {
      id: "rate",
      label: "Tarif horaire defini",
      ready: Number(input.hourlyRate ?? 0) > 0,
    },
    {
      id: "zone",
      label: "Zone d'intervention",
      ready: Boolean((input.location ?? input.serviceArea ?? "").trim()),
    },
    {
      id: "missions",
      label: "Missions disponibles",
      ready: input.missionRowsCount > 0,
    },
  ];
}

export function countCompletedProgressSteps<T extends ProgressStepLike>(steps: T[]): number {
  return steps.filter((step) => step.done).length;
}

export function countReadyChecks<T extends ReadyCheckLike>(checks: T[]): number {
  return checks.filter((check) => check.ready).length;
}

export function computeProgressPercent(completedCount: number, totalCount: number): number {
  if (totalCount <= 0) {
    return 0;
  }

  return Math.round((completedCount / totalCount) * 100);
}

export function findPendingReadinessChecks<T extends { ready: boolean }>(checks: T[]): T[] {
  return checks.filter((check) => !check.ready);
}

export function buildServicePriceMap<TPrice extends ServicePriceLike>(rows: TPrice[]) {
  const byService = new Map<number, TPrice>();
  for (const row of rows) {
    if (typeof row.service_id !== "number") continue;
    if (!byService.has(row.service_id)) {
      byService.set(row.service_id, row);
    }
  }
  return byService;
}

export function buildPricingCatalogRows<
  TService extends PricingServiceLike,
  TPrice extends ServicePriceLike,
>(
  services: TService[],
  servicePriceByServiceId: Map<number, TPrice>,
  activeServiceCatalogIdSet: Set<number>,
): Array<PricingCatalogRowLike<TService, TPrice>> {
  const rows = services.map((service) => ({
    service,
    pricing: servicePriceByServiceId.get(service.id) ?? null,
    isActiveMissionService: activeServiceCatalogIdSet.has(service.id),
  }));

  rows.sort((a, b) => {
    if (a.isActiveMissionService !== b.isActiveMissionService) {
      return a.isActiveMissionService ? -1 : 1;
    }
    return a.service.service.localeCompare(b.service.service, "fr");
  });

  return rows;
}

export function filterPricingCatalogRows<
  TService extends PricingServiceLike,
  TPrice,
>(
  rows: Array<PricingCatalogRowLike<TService, TPrice>>,
  showAllPricingServices: boolean,
) {
  return showAllPricingServices
    ? rows
    : rows.filter((row) => row.isActiveMissionService);
}

export function sortPricingCatalogRows<
  TService extends PricingServiceLike,
  TPrice,
>(
  rows: Array<PricingCatalogRowLike<TService, TPrice>>,
  pricingSortMode: "category" | "alphabetical" | "service",
) {
  const nextRows = [...rows];
  if (pricingSortMode === "category") {
    nextRows.sort((a, b) => {
      const byCategory = a.service.category.localeCompare(b.service.category, "fr");
      if (byCategory !== 0) return byCategory;
      return a.service.service.localeCompare(b.service.service, "fr");
    });
    return nextRows;
  }

  nextRows.sort((a, b) => a.service.service.localeCompare(b.service.service, "fr"));
  return nextRows;
}

export function groupPricingCatalogRows<
  TService extends PricingServiceLike,
  TPrice,
>(
  rows: Array<PricingCatalogRowLike<TService, TPrice>>,
) {
  const map = new Map<string, Array<PricingCatalogRowLike<TService, TPrice>>>();
  for (const row of rows) {
    const key = row.service.category || "Autres";
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(row);
    } else {
      map.set(key, [row]);
    }
  }
  return Array.from(map.entries()).map(([category, groupedRows]) => ({
    category,
    rows: groupedRows,
  }));
}

export function countConfiguredPricingRows<
  TService extends PricingServiceLike,
  TPrice,
>(
  rows: Array<PricingCatalogRowLike<TService, TPrice>>,
) {
  return rows.filter((row) => Boolean(row.pricing)).length;
}

export function buildPricingSegmentPayload(
  draft: PricingSegmentDraftLike,
): {
  name: string;
  commission_delta_pct: number;
  setup_fee_delta_pct: number;
} {
  return {
    name: draft.name.trim(),
    commission_delta_pct: Number(draft.commission_delta_pct || 0),
    setup_fee_delta_pct: Number(draft.setup_fee_delta_pct || 0),
  };
}

export function buildPricingSegmentUpdatePayload<T extends PricingSegmentLike>(
  row: T,
): {
  name: string;
  commission_delta_pct: number;
  setup_fee_delta_pct: number;
  is_default: boolean;
} {
  return {
    name: row.name,
    commission_delta_pct: row.commission_delta_pct,
    setup_fee_delta_pct: row.setup_fee_delta_pct,
    is_default: Boolean(row.is_default),
  };
}

export function buildEmptyPricingSegmentDraft(): PricingSegmentDraftLike {
  return {
    name: "",
    commission_delta_pct: "0",
    setup_fee_delta_pct: "0",
  };
}

export function buildPricingPropertyRulePayload(
  draft: PricingPropertyRuleDraftLike,
): PricingPropertyRuleLike {
  return {
    service_id: draft.service_id ? Number(draft.service_id) : null,
    property_type: draft.property_type.trim() || null,
    min_surface_m2: draft.min_surface_m2 ? Number(draft.min_surface_m2) : null,
    max_surface_m2: draft.max_surface_m2 ? Number(draft.max_surface_m2) : null,
    delta_pct: Number(draft.delta_pct || 0),
  };
}

export function buildPricingPropertyRuleUpdatePayload<T extends PricingPropertyRuleLike>(
  row: T,
): PricingPropertyRuleLike {
  return {
    service_id: row.service_id,
    property_type: row.property_type,
    min_surface_m2: row.min_surface_m2,
    max_surface_m2: row.max_surface_m2,
    delta_pct: row.delta_pct,
  };
}

export function buildEmptyPricingPropertyRuleDraft(): PricingPropertyRuleDraftLike {
  return {
    service_id: "",
    property_type: "",
    min_surface_m2: "",
    max_surface_m2: "",
    delta_pct: "0",
  };
}

export function buildPricingScenarioPayload<TSimulation>(
  scenarioDraftName: string,
  simulation: TSimulation,
): { name: string; simulation: TSimulation } {
  return {
    name: scenarioDraftName.trim(),
    simulation,
  };
}

export function buildPricingScenarioLoadedMessage(name: string): string {
  return `Scénario chargé : ${name}.`;
}

export function buildPricingScenarioDefaultPayload(): { is_default: true } {
  return { is_default: true };
}

export async function fetchPricingCollection<T>(
  url: string,
  fallbackErrorMessage: string,
): Promise<T[]> {
  const response = await fetch(url, { cache: "no-store" });
  const data: T[] | { error?: string } = await response.json();

  if (!response.ok || !Array.isArray(data)) {
    throw new Error(
      !response.ok && data && typeof data === "object" && "error" in data
        ? String(data.error)
        : fallbackErrorMessage,
    );
  }

  return data;
}

export async function deletePricingResource(
  url: string,
  fallbackErrorMessage: string,
): Promise<void> {
  const response = await fetch(url, { method: "DELETE" });
  const data: { error?: string } = await response.json();

  if (!response.ok) {
    throw new Error(
      data && typeof data === "object" && "error" in data
        ? String(data.error)
        : fallbackErrorMessage,
    );
  }
}

export async function updatePricingResource<TPayload>(
  url: string,
  payload: TPayload,
  fallbackErrorMessage: string,
): Promise<void> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data: { error?: string } = await response.json();

  if (!response.ok) {
    throw new Error(
      data && typeof data === "object" && "error" in data
        ? String(data.error)
        : fallbackErrorMessage,
    );
  }
}

export async function savePricingResource<TPayload>(
  options: {
    endpoint: string;
    method: "POST" | "PATCH";
    payload: TPayload;
    fallbackErrorMessage: string;
  },
): Promise<void> {
  const response = await fetch(options.endpoint, {
    method: options.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options.payload),
  });
  const data: { error?: string } = await response.json();

  if (!response.ok) {
    throw new Error(
      data && typeof data === "object" && "error" in data
        ? String(data.error)
        : options.fallbackErrorMessage,
    );
  }
}

export function validatePricingModalState(
  pricingModalState: PricingModalStateLike,
): { serviceIdNumber: number | null; parsedAmount: number | null; error: string | null } {
  const serviceIdNumber = Number(pricingModalState.serviceId);
  if (!Number.isFinite(serviceIdNumber) || serviceIdNumber <= 0) {
    return { serviceIdNumber: null, parsedAmount: null, error: "Selectionnez un service." };
  }

  const parsedAmount = Number(pricingModalState.amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return {
      serviceIdNumber,
      parsedAmount: null,
      error: "Le tarif doit etre superieur a 0.",
    };
  }

  if (!pricingModalState.unit.trim()) {
    return {
      serviceIdNumber,
      parsedAmount,
      error: "L'unite est obligatoire.",
    };
  }

  return { serviceIdNumber, parsedAmount, error: null };
}

export function buildServicePricePayload(
  pricingModalState: PricingModalStateLike,
  serviceIdNumber: number,
  parsedAmount: number,
  catalogServices: CatalogServiceLabelLike[],
) {
  const serviceRef = catalogServices.find((item) => item.id === serviceIdNumber);

  return {
    service_id: serviceIdNumber,
    label: pricingModalState.label.trim() || serviceRef?.service || "Service",
    type: pricingModalState.type,
    amount: parsedAmount,
    unit: pricingModalState.unit,
  };
}

export function buildServicePriceRequest(
  pricingModalState: PricingModalStateLike,
  payload: {
    service_id: number;
    label: string;
    type: string;
    amount: number;
    unit: string;
  },
) {
  const isUpdate = Boolean(pricingModalState.id);

  return {
    isUpdate,
    endpoint: isUpdate
      ? `/api/pricing/${encodeURIComponent(pricingModalState.id ?? "")}`
      : "/api/pricing",
    method: isUpdate ? ("PATCH" as const) : ("POST" as const),
    payload,
  };
}

export function shouldDisableMissionServiceAfterDelete<
  TRow extends ServicePriceRowLike,
>(
  row: TRow,
  servicePrices: TRow[],
): boolean {
  return (
    typeof row.service_id === "number" &&
    !servicePrices.some(
      (item) => item.id !== row.id && item.service_id === row.service_id,
    )
  );
}

export function buildResetPricingModalState(hourlyRate: number, currentType: string) {
  return {
    amount: hourlyRate > 0 ? String(Math.round(hourlyRate)) : "",
    unit: currentType === "hourly" ? "par heure" : "par prestation",
  };
}

export function buildCreatePricingModalState(
  service: CatalogServiceLabelLike | undefined,
  hourlyRate: number,
) {
  const suggestedType: "hourly" | "fixed" = hourlyRate > 0 ? "hourly" : "fixed";

  return {
    id: undefined,
    serviceId: service ? String(service.id) : "",
    label: service?.service ?? "",
    type: suggestedType,
    amount: suggestedType === "hourly" && hourlyRate > 0 ? String(Math.round(hourlyRate)) : "",
    unit: suggestedType === "hourly" ? "par heure" : "par prestation",
  };
}

export function buildEditPricingModalState(row: ServicePriceModalRowLike) {
  const safeType: "fixed" | "hourly" =
    row.type === "hourly" ? "hourly" : "fixed";

  return {
    id: row.id,
    serviceId: row.service_id != null ? String(row.service_id) : "",
    label: row.label ?? "",
    type: safeType,
    amount: String(row.amount ?? ""),
    unit: row.unit ?? "par prestation",
  };
}

export function collectServiceIdsToDisable(servicePrices: ServicePriceRowLike[]): number[] {
  return Array.from(
    new Set(
      servicePrices
        .map((row) => row.service_id)
        .filter((value): value is number => typeof value === "number"),
    ),
  );
}

export function syncMissionServiceFromPricing<TProfile extends ProfileWithAvailabilityLike>(
  previousProfile: TProfile | null,
  options: {
    serviceIdNumber: number;
    fallbackLabel?: string;
    mode: "enable" | "disable";
    catalogServices: CatalogServiceLabelLike[];
    parseMissionPayload: (value?: string | null) => MissionPayloadLike;
    parseAvailabilityPayloadRaw: (value?: string | null) => Record<string, unknown>;
    buildLegacyFromMissionProfile: (missionProfile: LegacyMissionProfileInputLike) => {
      missionCatalog: MissionCatalogLike[];
      preferences: unknown;
    };
    normalizeServiceLabel: (value: string) => string;
    toMissionTypeId: (value: string) => string;
  },
): TProfile | null {
  if (!previousProfile) return previousProfile;

  const payload = options.parseMissionPayload(previousProfile.availability_hours);
  const catalogService = options.catalogServices.find(
    (item) => item.id === options.serviceIdNumber,
  );
  const targetLabel = (catalogService?.service ?? options.fallbackLabel ?? "").trim();
  if (!targetLabel) return previousProfile;

  const normalizedTargetLabel = options.normalizeServiceLabel(targetLabel);

  if (options.mode === "enable") {
    const targetMissionId = options.toMissionTypeId(targetLabel);
    const baseMissions =
      payload.missionProfile.missions.length > 0
        ? payload.missionProfile.missions
        : payload.missionCatalog.map((catalogItem) => ({
            id: catalogItem.id,
            label: catalogItem.label,
            isActive: false,
            minNoticeHours: 24,
            allowUrgent: false,
            urgentMultiplier: 1.3,
          }));

    let didChange = false;
    const nextMissions = baseMissions.map((mission) => {
      if (options.normalizeServiceLabel(mission.label) !== normalizedTargetLabel) return mission;
      if (mission.isActive) return mission;
      didChange = true;
      return { ...mission, isActive: true };
    });

    const hasMissionInProfile = nextMissions.some(
      (mission) => options.normalizeServiceLabel(mission.label) === normalizedTargetLabel,
    );
    if (!hasMissionInProfile) {
      didChange = true;
      nextMissions.push({
        id: targetMissionId,
        label: targetLabel,
        isActive: true,
        minNoticeHours: 24,
        allowUrgent: false,
        urgentMultiplier: 1.3,
      });
    }

    if (!didChange) return previousProfile;

    const nextMissionProfile: MissionProfileLike = {
      ...payload.missionProfile,
      missions: nextMissions,
    };
    const legacy = options.buildLegacyFromMissionProfile(nextMissionProfile);

    return {
      ...previousProfile,
      availability_hours: JSON.stringify({
        ...options.parseAvailabilityPayloadRaw(previousProfile.availability_hours),
        missionProfile: nextMissionProfile,
        missionCatalog: legacy.missionCatalog,
        preferences: legacy.preferences,
      }),
    };
  }

  const nextMissions = payload.missionProfile.missions.map((mission) => {
    if (options.normalizeServiceLabel(mission.label) !== normalizedTargetLabel) return mission;
    if (!mission.isActive) return mission;
    return { ...mission, isActive: false };
  });

  const didChange = nextMissions.some((mission, idx) => {
    const previousMission = payload.missionProfile.missions[idx];
    return previousMission && previousMission.isActive !== mission.isActive;
  });
  if (!didChange) return previousProfile;

  const nextMissionProfile: MissionProfileLike = {
    ...payload.missionProfile,
    missions: nextMissions,
  };
  const legacy = options.buildLegacyFromMissionProfile(nextMissionProfile);

  return {
    ...previousProfile,
    availability_hours: JSON.stringify({
      ...options.parseAvailabilityPayloadRaw(previousProfile.availability_hours),
      missionProfile: nextMissionProfile,
      missionCatalog: legacy.missionCatalog,
      preferences: legacy.preferences,
    }),
  };
}

export function selectPricingSegment<T extends PricingSegmentLike>(
  pricingSegments: T[],
  segmentId: string,
): T | null {
  if (pricingSegments.length === 0) return null;
  const byId = pricingSegments.find((segment) => segment.id === segmentId);
  if (byId) return byId;
  return pricingSegments.find((segment) => segment.is_default) ?? pricingSegments[0];
}

export function sortPropertyRulesBySpecificity<T extends PricingPropertyRuleLike>(
  propertyRules: T[],
): T[] {
  return [...propertyRules].sort((a, b) => {
    const scoreA =
      (a.service_id != null ? 2 : 0) +
      (a.property_type ? 1 : 0) +
      (a.min_surface_m2 != null || a.max_surface_m2 != null ? 1 : 0);
    const scoreB =
      (b.service_id != null ? 2 : 0) +
      (b.property_type ? 1 : 0) +
      (b.min_surface_m2 != null || b.max_surface_m2 != null ? 1 : 0);
    return scoreB - scoreA;
  });
}

export function findMatchingPropertyRule<T extends PricingPropertyRuleLike>(
  propertyRules: T[],
  options: {
    selectedServiceId: number | null;
    propertyType: string;
    surfaceM2: number;
  },
): T | null {
  const normalizedPropertyType = options.propertyType.trim().toLowerCase();

  return (
    sortPropertyRulesBySpecificity(propertyRules).find((rule) => {
      if (
        rule.service_id != null &&
        options.selectedServiceId != null &&
        rule.service_id !== options.selectedServiceId
      ) {
        return false;
      }
      if (rule.service_id != null && options.selectedServiceId == null) return false;
      if (
        rule.property_type &&
        rule.property_type.trim().toLowerCase() !== normalizedPropertyType
      ) {
        return false;
      }
      if (rule.min_surface_m2 != null && options.surfaceM2 < rule.min_surface_m2) return false;
      if (rule.max_surface_m2 != null && options.surfaceM2 > rule.max_surface_m2) return false;
      return true;
    }) ?? null
  );
}

export function buildProfileSuccessMessage(sectionTitle: string): string {
  return `✅ ${sectionTitle} mis à jour avec succès`;
}

export function buildSessionUserPayload(
  profile: Pick<ProfileIdentityLike, "first_name" | "last_name">,
  avatarUrl: string | null,
) {
  return {
    image: avatarUrl,
    avatar_url: avatarUrl,
    name: `${profile.first_name} ${profile.last_name}`.trim(),
    firstName: profile.first_name,
    lastName: profile.last_name,
  };
}

export function resolveSavedSectionId(
  editingSection: string | null,
  sectionTitle: string,
  normalizeSectionId: (title: string) => string,
): string {
  return editingSection ?? normalizeSectionId(sectionTitle);
}

export async function patchProfileRequest<T extends ProfileIdentityLike>(
  profile: T,
  avatarUrl: string | null,
  markOnboardingComplete: boolean,
): Promise<T> {
  const response = await fetch("/api/profiles", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      buildProfileSavePayload(profile, avatarUrl, markOnboardingComplete),
    ),
  });

  const result = await response.json();
  if (!response.ok || result?.error) {
    throw new Error(result?.error || "Erreur lors de la sauvegarde");
  }

  return result as T;
}

export async function createQuoteFromMissionRequest(missionId: string): Promise<string> {
  const response = await fetch("/api/quotes/from-mission", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mission_id: missionId }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof result?.error === "string"
        ? result.error
        : "Erreur creation devis depuis mission",
    );
  }

  return typeof result?.quote_number === "string" ? result.quote_number : "devis cree";
}

export async function uploadProfileAvatar(
  file: File,
  userId: string,
): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);

  const response = await fetch("/api/profiles/avatar", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  return result.url as string;
}

export function updateProfileFieldErrorsSafe(
  errors: Record<string, string>,
  name: string,
  value: string,
): Record<string, string> {
  return {
    ...errors,
    [name]: validateProfileField(name, value),
  };
}

export function buildProfileValidationAlertMessageSafe(): string {
  return "Veuillez corriger les erreurs avant de sauvegarder.";
}

export function buildProfileSuccessMessageSafe(sectionTitle: string): string {
  return `${sectionTitle} mis à jour avec succès`;
}
