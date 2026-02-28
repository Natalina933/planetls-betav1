"use client";

import React, {
  useState,
  useEffect,
  ChangeEvent,
  useMemo,
  useCallback,
  useRef,
  KeyboardEvent,
} from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

import styles from "./ConciergeProfilePage.module.scss";
import {
  buildProfileSuccessMessageSafe,
  buildProfileValidationAlertMessageSafe,
  buildSessionUserPayload,
  createQuoteFromMissionRequest,
  ensureOpenSection,
  hasSectionUnsavedChanges,
  hasValidationErrors,
  patchProfileRequest,
  removeSectionSnapshot,
  resolveSavedSectionId,
  type SectionEditSnapshots,
  shouldCompleteMissionOnboarding,
  toggleOpenSection,
  upsertSectionSnapshot,
  uploadProfileAvatar,
  updateProfileFieldErrorsSafe,
  updateProfileFieldValue,
  updateSocialFieldValue,
} from "./profileEditing";
import {
  ConciergeProfileActiveTabContent,
  ConciergeProfileShell,
  EditableProfileField,
  EditableProfileSection,
} from "./profileTabSections";
import {
  CONCIERGE_TABS,
  ConciergeTabId,
} from "@/app/components/dashboard/concierge/conciergeTabsConfig";
import { parsePricingV2FromAvailabilityHours } from "@/app/components/tariffs/pricingEngine";
import type {
  ConciergeMissionProfile,
  MissionAvailability,
  MissionCatalogItem,
  MissionPreferences,
  WeekDay,
} from "@/app/components/missions/types";
import type { PricingV2Config, SeasonalPricingConfig } from "@/app/components/tariffs/types";

const DEFAULT_AVATAR = "/icons/account-svgrepo-com.svg";

type TabId = ConciergeTabId;

export interface Profile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  additional_info: string | null;
  category: string;
  created_at: string;
  location: string | null;
  option: string | null;
  search_target: string | null;
  role: string | null;
  travel_fee: number | null;
  avatar_scale: number | null;
  avatar_offset_x?: number | null;
  avatar_offset_y?: number | null;
  avatar_rotation?: number | null;
  company_name: string | null;
  legal_form: string | null;
  siret: string | null;
  siren: string | null;
  vat_number: string | null;
  street_address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  linkedin: string | null;
  facebook: string | null;
  instagram: string | null;
  insurance_number: string | null;
  insurance_company: string | null;
  hourly_rate: number | null;
  monthly_rate: number | null;
  availability_hours?: string | null;
  emergency_service?: boolean | null;
  certifications: string | null;
  mission_settings?: string | null;
  years_experience: number | null;
  experience_level: "debutant" | "intermediaire" | "experimente" | null;
  iban: string | null;
  bic: string | null;
  // champs étendus pour l'onglet équipe
  service_area?: string | null;
  service_radius_km?: number | null;
  onboarding_complete?: boolean;
  onboarding_completed_at?: string | null;
}

const formatExperienceLabel = (
  level: "debutant" | "intermediaire" | "experimente" | null,
): string => {
  switch (level) {
    case "debutant":
      return "Débutant";
    case "intermediaire":
      return "Petite expérience";
    case "experimente":
      return "Expérimenté";
    default:
      return "Non renseigné";
  }
};

const formatCurrency = (value: number, currency = "EUR"): string =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const normalizeSectionId = (title: string) =>
  title.replace(/[^a-zA-Z0-9]/g, "_");

const SECTION_IDS = {
  INFO_PERSO: normalizeSectionId("Informations personnelles"),
  PRESENTATION: normalizeSectionId("Presentation de la conciergerie"),
  SERVICES_ZONE: normalizeSectionId("Services & Zone d'intervention"),
  TARIFS: normalizeSectionId("Ma grille tarifaire"),
} as const;

const TARIFF_SECTION_IDS = {
  WORKFLOW: normalizeSectionId("Parcours devis & facturation"),
  CONFIG: normalizeSectionId("Configuration tarifs conciergerie"),
  BILLING_DESK: normalizeSectionId("Devis et factures operationnels"),
} as const;

const MISSION_SECTION_IDS = {
  SERVICES: normalizeSectionId("Services proposés"),
  ZONE_RULES: normalizeSectionId("Zone, disponibilités & règles de mission"),
  WEEKLY_AVAILABILITY: normalizeSectionId("Disponibilités hebdomadaires"),
} as const;

type ExtendedFieldName =
  | keyof Profile
  | "service_area"
  | "service_radius_km";

interface CatalogServiceItem {
  id: number;
  category: string;
  service: string;
  description?: string | null;
}

interface ActiveTariffServiceRow {
  id: string;
  label: string;
  category: string;
}

type PricingTypeValue = "hourly" | "fixed" | "monthly" | "custom";

interface ConciergeServicePriceRow {
  id: string;
  service_id: number | null;
  label: string;
  type: PricingTypeValue | null;
  amount: number;
  unit: string | null;
  created_at: string | null;
  service?: {
    id: number;
    category: string;
    service: string;
    description: string | null;
  } | null;
}

interface PricingModalState {
  id?: string;
  serviceId: string;
  label: string;
  type: PricingTypeValue;
  amount: string;
  unit: string;
}

interface PricingSegmentRow {
  id: string;
  concierge_profile_id: string;
  name: string;
  commission_delta_pct: number;
  setup_fee_delta_pct: number;
  is_default: boolean;
  created_at: string | null;
}

interface PricingPropertyRuleRow {
  id: string;
  concierge_profile_id: string;
  service_id: number | null;
  property_type: string | null;
  min_surface_m2: number | null;
  max_surface_m2: number | null;
  delta_pct: number;
  created_at: string | null;
}

interface StrategySimState {
  segmentId: string;
  serviceId: string;
  propertyType: string;
  surfaceM2: string;
  revenueEstimate: string;
  newListingsCount: string;
  actServicesCount: string;
  isUrgent: boolean;
  isNight: boolean;
  isWeekend: boolean;
  isHighSeason: boolean;
}

interface PricingStrategyScenarioRow {
  id: string;
  concierge_profile_id: string;
  name: string;
  simulation: unknown;
  is_default: boolean;
  created_at: string | null;
}

const PROPERTY_TYPE_OPTIONS: Array<{ key: string; label: string }> = [
  { key: "studio", label: "Studio / T1" },
  { key: "apartment", label: "Appartement" },
  { key: "house", label: "Maison" },
  { key: "villa", label: "Villa" },
];

const PRICING_UNIT_OPTIONS = [
  "par prestation",
  "par heure",
  "par nuit",
  "par sejour",
  "par sac",
] as const;

const DEFAULT_PRICING_MODAL: PricingModalState = {
  serviceId: "",
  label: "",
  type: "fixed",
  amount: "",
  unit: "par prestation",
};

const DEFAULT_STRATEGY_SIM: StrategySimState = {
  segmentId: "",
  serviceId: "",
  propertyType: "apartment",
  surfaceM2: "55",
  revenueEstimate: "6000",
  newListingsCount: "1",
  actServicesCount: "4",
  isUrgent: false,
  isNight: false,
  isWeekend: false,
  isHighSeason: false,
};

const toSafeString = (value: unknown, fallback: string): string =>
  typeof value === "string" ? value : fallback;

const toSafeBool = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

const toSafeNumericString = (value: unknown, fallback: string): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
};

const normalizeStrategySim = (value: unknown): StrategySimState => {
  const source =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    segmentId: toSafeString(source.segmentId, DEFAULT_STRATEGY_SIM.segmentId),
    serviceId: toSafeString(source.serviceId, DEFAULT_STRATEGY_SIM.serviceId),
    propertyType: toSafeString(source.propertyType, DEFAULT_STRATEGY_SIM.propertyType),
    surfaceM2: toSafeNumericString(source.surfaceM2, DEFAULT_STRATEGY_SIM.surfaceM2),
    revenueEstimate: toSafeNumericString(
      source.revenueEstimate,
      DEFAULT_STRATEGY_SIM.revenueEstimate,
    ),
    newListingsCount: toSafeNumericString(
      source.newListingsCount,
      DEFAULT_STRATEGY_SIM.newListingsCount,
    ),
    actServicesCount: toSafeNumericString(
      source.actServicesCount,
      DEFAULT_STRATEGY_SIM.actServicesCount,
    ),
    isUrgent: toSafeBool(source.isUrgent),
    isNight: toSafeBool(source.isNight),
    isWeekend: toSafeBool(source.isWeekend),
    isHighSeason: toSafeBool(source.isHighSeason),
  };
};

interface MissionListItem {
  id: string;
  title: string;
  status: string;
  amount: number | null;
  currency: string;
  owner_profile_id: string | null;
}

const DEFAULT_MISSION_CENTER = { lat: 48.8566, lng: 2.3522 };

const DEFAULT_MISSION_CATALOG: MissionCatalogItem[] = [
  {
    id: "check-in-check-out",
    label: "Check-in / Check-out",
    basePrice: null,
    customizable: false,
  },
  { id: "menage", label: "Ménage", basePrice: null, customizable: false },
  {
    id: "maintenance",
    label: "Maintenance",
    basePrice: null,
    customizable: false,
  },
  { id: "intendance", label: "Intendance", basePrice: null, customizable: false },
  {
    id: "accueil-voyageurs",
    label: "Accueil voyageurs",
    basePrice: null,
    customizable: false,
  },
  {
    id: "urgence-de-nuit",
    label: "Urgence de nuit",
    basePrice: null,
    customizable: false,
  },
];

const toMissionTypeId = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeServiceLabel = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const parseLegacySelectedOptions = (value?: string | null): string[] => {
  if (!value) return [];
  const raw = value.trim();
  if (!raw) return [];

  try {
    if (raw.startsWith("[") && raw.endsWith("]")) {
      const parsed = JSON.parse(raw);
      const options = Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
      return Array.from(new Set(options));
    }
  } catch {
    // fallback csv parsing below
  }

  const options = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(options));
};

const ONBOARDING_OPTION_CATEGORY_MATCHERS: Record<string, string[]> = {
  menage: ["menage", "nettoyage"],
  linge: ["linge", "blanchisserie", "textile"],
  "accueil et check-in/check-out": ["accueil", "check-in", "check out", "voyageur"],
  "maintenance et petites reparations": ["maintenance", "reparation", "depannage"],
  "courses et intendance": ["courses", "intendance", "approvisionnement"],
  "gestion administrative": ["gestion administrative", "administratif", "fiscal"],
  "entretien exterieur": ["entretien exterieur", "jardin", "terrasse", "piscine", "toiture"],
  "securite du logement": ["securite", "surveillance", "controle"],
  "services de confort": ["services de confort", "confort"],
  "conciergerie digitale": ["conciergerie digitale", "digital", "automatisation"],
  "gestion complete": ["gestion complete"],
  "gestion des cles": ["cles"],
  "services ponctuels": ["services ponctuels", "urgence", "intervention"],
  "autres services": ["autres services", "autre"],
};

const ONBOARDING_OPTION_LABEL_FALLBACK: Record<string, string[]> = {
  "accueil et check-in/check-out": ["accueil", "check-in", "check out"],
  "maintenance et petites reparations": ["maintenance", "reparation"],
  "courses et intendance": ["courses", "intendance"],
};

const matchesOnboardingOption = (
  optionNormalized: string,
  service: CatalogServiceItem,
): boolean => {
  const normalizedCategory = normalizeServiceLabel(service.category);
  const normalizedLabel = normalizeServiceLabel(service.service);

  const categoryKeywords = ONBOARDING_OPTION_CATEGORY_MATCHERS[optionNormalized] ?? [
    optionNormalized,
  ];

  if (categoryKeywords.some((keyword) => normalizedCategory.includes(keyword))) {
    return true;
  }

  const labelKeywords = ONBOARDING_OPTION_LABEL_FALLBACK[optionNormalized] ?? [];
  return labelKeywords.some((keyword) => normalizedLabel.includes(keyword));
};

const defaultMissionPreferences = (): MissionPreferences => ({
  acceptedMissionTypeIds: [],
  priorityFlags: {
    urgent: true,
    recurrent: false,
    premium: false,
  },
});

const buildDefaultMissionProfile = (
  missionCatalog: MissionCatalogItem[] = DEFAULT_MISSION_CATALOG,
): ConciergeMissionProfile => ({
  positioning: "standard",
  missions: missionCatalog.map((item) => ({
    id: item.id,
    label: item.label,
    isActive: false,
    minNoticeHours: 24,
    allowUrgent: false,
    urgentMultiplier: 1.3,
  })),
  specialConditions: {
    acceptNightInterventions: false,
    acceptWeekendInterventions: false,
    acceptHighSeasonInterventions: false,
    highSeasonMultiplier: 1.2,
    geographicNotes: "",
  },
});

const inferPositioningFromLegacy = (
  preferences: MissionPreferences,
): ConciergeMissionProfile["positioning"] => {
  if (preferences.priorityFlags.urgent) return "urgent_24_7";
  if (preferences.priorityFlags.premium) return "premium";
  return "standard";
};

const buildLegacyFromMissionProfile = (missionProfile: ConciergeMissionProfile) => {
  const missionCatalog: MissionCatalogItem[] = missionProfile.missions.map(
    (mission) => ({
      id: mission.id,
      label: mission.label,
      basePrice: null,
      customizable: false,
    }),
  );

  const preferences: MissionPreferences = {
    acceptedMissionTypeIds: missionProfile.missions
      .filter((mission) => mission.isActive)
      .map((mission) => mission.id),
    priorityFlags: {
      urgent: missionProfile.missions.some(
        (mission) => mission.isActive && mission.allowUrgent,
      ),
      recurrent: false,
      premium: missionProfile.positioning === "premium",
    },
  };

  return { missionCatalog, preferences };
};

const defaultSeasonalPricing = (): SeasonalPricingConfig => ({
  checkInFee: 35,
  checkOutFee: 35,
  cleaningStudioFee: 55,
  cleaningTwoRoomsFee: 85,
  linenKitFee: 20,
  welcomePackFee: 25,
  urgentPercent: 30,
  nightPercent: 20,
  weekendPercent: 15,
  highSeasonPercent: 25,
  extraKmFee: 2,
  minimumInvoice: 35,
});

const WEEK_DAY_ORDER: WeekDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const normalizeMissionSchedule = (
  schedule: MissionAvailability["schedule"],
): MissionAvailability["schedule"] =>
  WEEK_DAY_ORDER.map((day) => {
    const currentDay = schedule.find((item) => item.day === day);
    if (!currentDay) return null;

    const ranges = currentDay.ranges
      .filter((range) => range.start < range.end)
      .sort((a, b) => a.start.localeCompare(b.start));

    if (ranges.length === 0) return null;
    return { day, ranges };
  }).filter(
    (
      item,
    ): item is MissionAvailability["schedule"][number] => item !== null,
  );

const parseAvailabilityPayloadRaw = (
  value?: string | null,
): Record<string, unknown> => {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return { schedule: parsed };
    }
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

const parseSeasonalPricing = (value?: string | null): SeasonalPricingConfig => {
  const defaults = defaultSeasonalPricing();
  const raw = parseAvailabilityPayloadRaw(value);
  const pricing =
    raw.pricing && typeof raw.pricing === "object"
      ? (raw.pricing as Record<string, unknown>)
      : null;
  if (!pricing) return defaults;

  const readNumber = (key: keyof SeasonalPricingConfig, fallback: number) =>
    typeof pricing[key] === "number" ? (pricing[key] as number) : fallback;

  return {
    checkInFee: readNumber("checkInFee", defaults.checkInFee),
    checkOutFee: readNumber("checkOutFee", defaults.checkOutFee),
    cleaningStudioFee: readNumber("cleaningStudioFee", defaults.cleaningStudioFee),
    cleaningTwoRoomsFee: readNumber(
      "cleaningTwoRoomsFee",
      defaults.cleaningTwoRoomsFee,
    ),
    linenKitFee: readNumber("linenKitFee", defaults.linenKitFee),
    welcomePackFee: readNumber("welcomePackFee", defaults.welcomePackFee),
    urgentPercent: readNumber("urgentPercent", defaults.urgentPercent),
    nightPercent: readNumber("nightPercent", defaults.nightPercent),
    weekendPercent: readNumber("weekendPercent", defaults.weekendPercent),
    highSeasonPercent: readNumber(
      "highSeasonPercent",
      defaults.highSeasonPercent,
    ),
    extraKmFee: readNumber("extraKmFee", defaults.extraKmFee),
    minimumInvoice: readNumber("minimumInvoice", defaults.minimumInvoice),
  };
};

interface PricingMetaConfig {
  commissionRatePct: number;
  setupFee: number;
}

const parsePricingMeta = (value?: string | null): PricingMetaConfig => {
  const raw = parseAvailabilityPayloadRaw(value);
  const meta =
    raw.pricing_meta && typeof raw.pricing_meta === "object"
      ? (raw.pricing_meta as Record<string, unknown>)
      : {};

  const commissionRatePct =
    typeof meta.commissionRatePct === "number" && Number.isFinite(meta.commissionRatePct)
      ? Math.max(0, Math.min(100, meta.commissionRatePct))
      : 20;

  const setupFee =
    typeof meta.setupFee === "number" && Number.isFinite(meta.setupFee)
      ? Math.max(0, meta.setupFee)
      : 0;

  return { commissionRatePct, setupFee };
};

const syncSeasonalPricingFromPricingV2 = (
  seasonal: SeasonalPricingConfig,
  pricingV2: PricingV2Config,
): SeasonalPricingConfig => ({
  ...seasonal,
  urgentPercent: pricingV2.globalModifiers.urgentPercent,
  nightPercent: pricingV2.globalModifiers.nightPercent,
  weekendPercent: pricingV2.globalModifiers.weekendPercent,
  highSeasonPercent: pricingV2.globalModifiers.highSeasonPercent,
  minimumInvoice: pricingV2.base.minimumInvoice,
});

const parseMissionPayload = (
  value?: string | null,
): Pick<MissionAvailability, "schedule" | "rules"> & {
  missionCatalog: MissionCatalogItem[];
  preferences: MissionPreferences;
  missionProfile: ConciergeMissionProfile;
} => {
  const defaultRules: MissionAvailability["rules"] = {
    refuseOutOfZone: true,
    refuseOutOfSchedule: true,
    autoAcceptEmergency: false,
  };
  const defaultPreferences = defaultMissionPreferences();

  if (!value) {
    return {
      schedule: [],
      rules: defaultRules,
      missionCatalog: DEFAULT_MISSION_CATALOG,
      preferences: defaultPreferences,
      missionProfile: buildDefaultMissionProfile(DEFAULT_MISSION_CATALOG),
    };
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return {
        schedule: normalizeMissionSchedule(parsed),
        rules: defaultRules,
        missionCatalog: DEFAULT_MISSION_CATALOG,
        preferences: defaultPreferences,
        missionProfile: buildDefaultMissionProfile(DEFAULT_MISSION_CATALOG),
      };
    }

    const schedule = normalizeMissionSchedule(
      Array.isArray(parsed?.schedule) ? parsed.schedule : [],
    );
    const rules = parsed?.rules
      ? {
          refuseOutOfZone:
            typeof parsed.rules.refuseOutOfZone === "boolean"
              ? parsed.rules.refuseOutOfZone
              : true,
          refuseOutOfSchedule:
            typeof parsed.rules.refuseOutOfSchedule === "boolean"
              ? parsed.rules.refuseOutOfSchedule
              : true,
          autoAcceptEmergency:
            typeof parsed.rules.autoAcceptEmergency === "boolean"
              ? parsed.rules.autoAcceptEmergency
              : false,
        }
      : defaultRules;

    const rawPriorityFlags = parsed?.preferences?.priorityFlags ?? parsed?.priorities;
    const priorityFlags = {
      urgent:
        typeof rawPriorityFlags?.urgent === "boolean"
          ? rawPriorityFlags.urgent
          : true,
      recurrent:
        typeof rawPriorityFlags?.recurrent === "boolean"
          ? rawPriorityFlags.recurrent
          : false,
      premium:
        typeof rawPriorityFlags?.premium === "boolean"
          ? rawPriorityFlags.premium
          : false,
    };

    const parsedCatalog = Array.isArray(parsed?.missionCatalog)
      ? parsed.missionCatalog
          .map((item: unknown) => {
            if (!item || typeof item !== "object") return null;
            const obj = item as Record<string, unknown>;
            const id = typeof obj.id === "string" ? obj.id : "";
            const label = typeof obj.label === "string" ? obj.label : "";
            if (!id || !label) return null;
            return {
              id,
              label,
              basePrice:
                typeof obj.basePrice === "number" ? obj.basePrice : null,
              customizable:
                typeof obj.customizable === "boolean" ? obj.customizable : true,
            } as MissionCatalogItem;
          })
          .filter((item: MissionCatalogItem | null): item is MissionCatalogItem =>
            Boolean(item),
          )
      : [];

    const legacyMissionTypeOptions = Array.isArray(parsed?.missionTypeOptions)
      ? parsed.missionTypeOptions.filter(
          (item: unknown): item is string => typeof item === "string",
        )
      : [];

    const missionCatalog: MissionCatalogItem[] =
      parsedCatalog.length > 0
        ? parsedCatalog
        : legacyMissionTypeOptions.length > 0
          ? legacyMissionTypeOptions.map((label: string) => ({
              id: toMissionTypeId(label),
              label,
              basePrice: null,
              customizable: true,
            }))
          : DEFAULT_MISSION_CATALOG;

    const acceptedFromPreferences = Array.isArray(
      parsed?.preferences?.acceptedMissionTypeIds,
    )
      ? parsed.preferences.acceptedMissionTypeIds.filter(
          (item: unknown): item is string => typeof item === "string",
        )
      : [];

    const acceptedFromLegacyLabels = Array.isArray(parsed?.missionTypes)
      ? parsed.missionTypes
          .filter((item: unknown): item is string => typeof item === "string")
          .map((label: string) => {
            const byLabel = missionCatalog.find(
              (item: MissionCatalogItem) => item.label === label,
            );
            return byLabel?.id ?? toMissionTypeId(label);
          })
      : [];

    const acceptedMissionTypeIds = (
      acceptedFromPreferences.length > 0
        ? acceptedFromPreferences
        : acceptedFromLegacyLabels
    ).filter((id: string) =>
      missionCatalog.some((item: MissionCatalogItem) => item.id === id),
    );

    const rawMissionProfile = parsed?.missionProfile;
    const missionProfileFromPayload =
      rawMissionProfile && typeof rawMissionProfile === "object"
        ? (rawMissionProfile as Record<string, unknown>)
        : null;
    const specialConditionsPayload =
      missionProfileFromPayload?.specialConditions &&
      typeof missionProfileFromPayload.specialConditions === "object"
        ? (missionProfileFromPayload.specialConditions as Record<
            string,
            unknown
          >)
        : null;

    const missionProfile: ConciergeMissionProfile = missionProfileFromPayload
      ? {
          positioning:
            missionProfileFromPayload.positioning === "premium" ||
            missionProfileFromPayload.positioning === "urgent_24_7" ||
            missionProfileFromPayload.positioning === "checkin_specialist" ||
            missionProfileFromPayload.positioning === "full_service"
              ? missionProfileFromPayload.positioning
              : "standard",
          missions: Array.isArray(missionProfileFromPayload.missions)
            ? missionProfileFromPayload.missions
                .map((mission) => {
                  if (!mission || typeof mission !== "object") return null;
                  const item = mission as unknown as Record<string, unknown>;
                  const id = typeof item.id === "string" ? item.id : "";
                  const label = typeof item.label === "string" ? item.label : "";
                  if (!id || !label) return null;
                  return {
                    id,
                    label,
                    isActive:
                      typeof item.isActive === "boolean" ? item.isActive : false,
                    minNoticeHours:
                      typeof item.minNoticeHours === "number"
                        ? item.minNoticeHours
                        : 24,
                    allowUrgent:
                      typeof item.allowUrgent === "boolean"
                        ? item.allowUrgent
                        : false,
                    urgentMultiplier:
                      typeof item.urgentMultiplier === "number"
                        ? item.urgentMultiplier
                        : 1.3,
                  };
                })
                .filter(Boolean) as ConciergeMissionProfile["missions"]
            : buildDefaultMissionProfile(missionCatalog).missions,
          specialConditions: {
            acceptNightInterventions:
              typeof specialConditionsPayload?.acceptNightInterventions ===
              "boolean"
                ? specialConditionsPayload.acceptNightInterventions
                : false,
            acceptWeekendInterventions:
              typeof specialConditionsPayload?.acceptWeekendInterventions ===
              "boolean"
                ? specialConditionsPayload.acceptWeekendInterventions
                : false,
            acceptHighSeasonInterventions:
              typeof specialConditionsPayload?.acceptHighSeasonInterventions ===
              "boolean"
                ? specialConditionsPayload.acceptHighSeasonInterventions
                : false,
            highSeasonMultiplier:
              typeof specialConditionsPayload?.highSeasonMultiplier === "number"
                ? specialConditionsPayload.highSeasonMultiplier
                : 1.2,
            geographicNotes:
              typeof specialConditionsPayload?.geographicNotes === "string"
                ? specialConditionsPayload.geographicNotes
                : "",
          },
        }
      : {
          positioning: inferPositioningFromLegacy({
            acceptedMissionTypeIds,
            priorityFlags,
          }),
          missions: missionCatalog.map((item) => ({
            id: item.id,
            label: item.label,
            isActive: acceptedMissionTypeIds.includes(item.id),
            minNoticeHours: 24,
            allowUrgent: priorityFlags.urgent,
            urgentMultiplier: 1.3,
          })),
          specialConditions: {
            acceptNightInterventions: false,
            acceptWeekendInterventions: false,
            acceptHighSeasonInterventions: false,
            highSeasonMultiplier: 1.2,
            geographicNotes: "",
          },
        };

    return {
      schedule,
      rules,
      missionCatalog,
      preferences: {
        acceptedMissionTypeIds,
        priorityFlags,
      },
      missionProfile,
    };
  } catch {
    return {
      schedule: [],
      rules: defaultRules,
      missionCatalog: DEFAULT_MISSION_CATALOG,
      preferences: defaultPreferences,
      missionProfile: buildDefaultMissionProfile(DEFAULT_MISSION_CATALOG),
    };
  }
};

const buildMissionAvailabilityFromProfile = (
  profile: Profile | null,
): MissionAvailability | null => {
  if (!profile) return null;
  const missionPayload = parseMissionPayload(profile.availability_hours);

  const primaryLabel = (profile.location ?? profile.service_area ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];

  const labels = primaryLabel ? [primaryLabel] : [];

  return {
    zones: labels.map((label, index) => ({
      placeId: `zone-${index}-${label}`,
      label,
      lat: DEFAULT_MISSION_CENTER.lat + index * 0.01,
      lng: DEFAULT_MISSION_CENTER.lng + index * 0.01,
    })),
    radiusKm: profile.service_radius_km ?? 30,
    schedule: missionPayload.schedule,
    emergency24h: Boolean(profile.emergency_service),
    rules: missionPayload.rules,
  };
};

export default function ConciergeProfilePage() {
  const { update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabFromUrl = useMemo(() => {
    const tab = searchParams.get("tab") as TabId;
    return CONCIERGE_TABS.some((t) => t.id === tab) ? tab : "fiche";
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionEditSnapshots, setSectionEditSnapshots] = useState<SectionEditSnapshots>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPendingMissionStepsOnly, setShowPendingMissionStepsOnly] =
    useState(false);
  const [catalogServices, setCatalogServices] = useState<CatalogServiceItem[]>([]);
  const [missionRows, setMissionRows] = useState<MissionListItem[]>([]);
  const [selectedMissionQuoteId, setSelectedMissionQuoteId] = useState("");
  const [missionQuoteBusy, setMissionQuoteBusy] = useState(false);
  const [missionQuoteFeedback, setMissionQuoteFeedback] = useState("");
  const [servicePrices, setServicePrices] = useState<ConciergeServicePriceRow[]>([]);
  const [servicePricesLoading, setServicePricesLoading] = useState(false);
  const [servicePricesBusyId, setServicePricesBusyId] = useState<string | null>(null);
  const [showAllPricingServices, setShowAllPricingServices] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [pricingModalSaving, setPricingModalSaving] = useState(false);
  const [pricingModalError, setPricingModalError] = useState("");
  const [pricingModalState, setPricingModalState] =
    useState<PricingModalState>(DEFAULT_PRICING_MODAL);
  const [catalogSyncBusy, setCatalogSyncBusy] = useState(false);
  const [pricingSortMode, setPricingSortMode] = useState<"category" | "service">(
    "category",
  );
  const [collapsedPricingCategories, setCollapsedPricingCategories] = useState<
    Record<string, boolean>
  >({});
  const [pricingSegments, setPricingSegments] = useState<PricingSegmentRow[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [segmentsBusyId, setSegmentsBusyId] = useState<string | null>(null);
  const [segmentDraft, setSegmentDraft] = useState({
    name: "",
    commission_delta_pct: "0",
    setup_fee_delta_pct: "0",
  });
  const [propertyRules, setPropertyRules] = useState<PricingPropertyRuleRow[]>([]);
  const [propertyRulesLoading, setPropertyRulesLoading] = useState(false);
  const [propertyRulesBusyId, setPropertyRulesBusyId] = useState<string | null>(null);
  const [propertyRuleDraft, setPropertyRuleDraft] = useState({
    service_id: "",
    property_type: "",
    min_surface_m2: "",
    max_surface_m2: "",
    delta_pct: "0",
  });
  const [strategySim, setStrategySim] = useState<StrategySimState>(DEFAULT_STRATEGY_SIM);
  const [pricingScenarios, setPricingScenarios] = useState<PricingStrategyScenarioRow[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(false);
  const [scenariosBusyId, setScenariosBusyId] = useState<string | null>(null);
  const [scenarioDraftName, setScenarioDraftName] = useState("");
  const [billingDeskPresetVersion, setBillingDeskPresetVersion] = useState(0);
  const [billingDeskPreset, setBillingDeskPreset] = useState({
    monthlyRevenueEstimate: 6000,
    newListingsEstimate: 1,
    actServicesEstimate: 4,
  });
  const didSeedFromOnboardingRef = useRef(false);
  const missionPayload = useMemo(
    () => parseMissionPayload(editProfile?.availability_hours),
    [editProfile?.availability_hours],
  );
  const missionAvailability = useMemo(
    () => buildMissionAvailabilityFromProfile(editProfile),
    [editProfile],
  );
  const seasonalPricing = useMemo(
    () => parseSeasonalPricing(editProfile?.availability_hours),
    [editProfile?.availability_hours],
  );
  const pricingV2 = useMemo<PricingV2Config>(
    () =>
      parsePricingV2FromAvailabilityHours(editProfile?.availability_hours, {
        hourlyRate: editProfile?.hourly_rate ?? 0,
        travelFee: editProfile?.travel_fee ?? 0,
        seasonalPricing,
      }),
    [
      editProfile?.availability_hours,
      editProfile?.hourly_rate,
      editProfile?.travel_fee,
      seasonalPricing,
    ],
  );
  const activeMissionServiceLabels = useMemo(
    () => {
      const rawActiveLabels = Array.from(
        new Set(
          missionPayload.missionProfile.missions
            .filter((mission) => mission.isActive)
            .map((mission) => mission.label.trim())
            .filter(Boolean),
        ),
      );

      // Keep mission/services tab coherent with the service catalog.
      if (catalogServices.length === 0) return rawActiveLabels;

      const catalogByNormalizedLabel = new Map(
        catalogServices.map((service) => [
          normalizeServiceLabel(service.service),
          service.service,
        ]),
      );

      const catalogMatchedLabels = rawActiveLabels
        .map((label) => {
          const catalogLabel = catalogByNormalizedLabel.get(normalizeServiceLabel(label));
          return catalogLabel ?? label;
        })
        .filter((label): label is string => Boolean(label));

      return Array.from(new Set(catalogMatchedLabels));
    },
    [missionPayload.missionProfile.missions, catalogServices],
  );
  const activeMissionRawLabels = useMemo(
    () =>
      Array.from(
        new Set(
          missionPayload.missionProfile.missions
            .filter((mission) => mission.isActive)
            .map((mission) => mission.label.trim())
            .filter(Boolean),
        ),
      ),
    [missionPayload.missionProfile.missions],
  );
  const unrecognizedActiveMissionLabels = useMemo(() => {
    if (activeMissionRawLabels.length === 0) return [];
    if (catalogServices.length === 0) return activeMissionRawLabels;
    const knownLabels = new Set(
      catalogServices.map((service) => normalizeServiceLabel(service.service)),
    );
    return activeMissionRawLabels.filter(
      (label) => !knownLabels.has(normalizeServiceLabel(label)),
    );
  }, [activeMissionRawLabels, catalogServices]);
  const recognizedActiveMissionCount = useMemo(
    () => Math.max(0, activeMissionRawLabels.length - unrecognizedActiveMissionLabels.length),
    [activeMissionRawLabels.length, unrecognizedActiveMissionLabels.length],
  );
  const activeMissionServiceCatalogIds = useMemo(() => {
    if (catalogServices.length === 0 || activeMissionServiceLabels.length === 0) return [];

    const labelSet = new Set(
      activeMissionServiceLabels.map((label) => normalizeServiceLabel(label)),
    );

    return Array.from(
      new Set(
        catalogServices
          .filter((service) =>
            labelSet.has(normalizeServiceLabel(service.service)),
          )
          .map((service) => String(service.id)),
      ),
    );
  }, [catalogServices, activeMissionServiceLabels]);
  const missionOpenDaysCount = useMemo(
    () =>
      missionAvailability?.schedule.filter((day) => day.ranges.length > 0).length ?? 0,
    [missionAvailability],
  );
  const missionRangesCount = useMemo(
    () =>
      missionAvailability?.schedule.reduce(
        (acc, day) => acc + day.ranges.length,
        0,
      ) ?? 0,
    [missionAvailability],
  );
  const missionProgressSteps = useMemo(
    () => [
      {
        key: "services",
        label: "Services proposes",
        hint: "Definissez les prestations que vous acceptez.",
        done: activeMissionServiceLabels.length > 0,
        sectionId: MISSION_SECTION_IDS.SERVICES,
      },
      {
        key: "zone",
        label: "Zone d'intervention",
        hint: "Ajoutez des zones et un rayon de couverture.",
        done: (missionAvailability?.zones.length ?? 0) > 0,
        sectionId: MISSION_SECTION_IDS.ZONE_RULES,
      },
      {
        key: "availability",
        label: "Disponibilites hebdomadaires",
        hint: "Renseignez vos jours et plages horaires.",
        done: missionOpenDaysCount > 0 && missionRangesCount > 0,
        sectionId: MISSION_SECTION_IDS.WEEKLY_AVAILABILITY,
      },
    ],
    [
      activeMissionServiceLabels.length,
      missionAvailability,
      missionOpenDaysCount,
      missionRangesCount,
    ],
  );
  const missionProgressDoneCount = useMemo(
    () => missionProgressSteps.filter((step) => step.done).length,
    [missionProgressSteps],
  );
  const missionProgressPercent = useMemo(
    () =>
      missionProgressSteps.length > 0
        ? Math.round((missionProgressDoneCount / missionProgressSteps.length) * 100)
        : 0,
    [missionProgressDoneCount, missionProgressSteps.length],
  );
  const tariffReadinessChecks = useMemo(
    () => [
      {
        id: "services",
        label: "Services actifs",
        ready: activeMissionServiceLabels.length > 0,
      },
      {
        id: "rate",
        label: "Tarif horaire defini",
        ready: Number(editProfile?.hourly_rate ?? 0) > 0,
      },
      {
        id: "zone",
        label: "Zone d'intervention",
        ready: Boolean((editProfile?.location ?? editProfile?.service_area ?? "").trim()),
      },
      {
        id: "missions",
        label: "Missions disponibles",
        ready: missionRows.length > 0,
      },
    ],
    [
      activeMissionServiceLabels.length,
      editProfile?.hourly_rate,
      editProfile?.location,
      editProfile?.service_area,
      missionRows.length,
    ],
  );
  const tariffReadinessDoneCount = useMemo(
    () => tariffReadinessChecks.filter((check) => check.ready).length,
    [tariffReadinessChecks],
  );
  const tariffReadinessPercent = useMemo(
    () =>
      tariffReadinessChecks.length > 0
        ? Math.round((tariffReadinessDoneCount / tariffReadinessChecks.length) * 100)
        : 0,
    [tariffReadinessDoneCount, tariffReadinessChecks.length],
  );
  const pendingTariffReadinessChecks = useMemo(
    () => tariffReadinessChecks.filter((check) => !check.ready),
    [tariffReadinessChecks],
  );
  const activeTariffServiceRows = useMemo<ActiveTariffServiceRow[]>(() => {
    const catalogByLabel = new Map(
      catalogServices.map((item) => [normalizeServiceLabel(item.service), item]),
    );

    const rows = activeMissionServiceLabels.map((label) => {
      const match = catalogByLabel.get(normalizeServiceLabel(label));
      return {
        id: match ? String(match.id) : toMissionTypeId(label),
        label: match?.service ?? label,
        category: match?.category ?? "Mission",
      };
    });

    const seen = new Set<string>();
    return rows.filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
  }, [activeMissionServiceLabels, catalogServices]);

  const activeServiceCatalogIdSet = useMemo(
    () =>
      new Set(
        activeTariffServiceRows
          .map((item) => Number(item.id))
          .filter((value) => Number.isFinite(value)),
      ),
    [activeTariffServiceRows],
  );
  const servicePriceByServiceId = useMemo(() => {
    const byService = new Map<number, ConciergeServicePriceRow>();
    for (const row of servicePrices) {
      if (typeof row.service_id !== "number") continue;
      if (!byService.has(row.service_id)) byService.set(row.service_id, row);
    }
    return byService;
  }, [servicePrices]);
  const pricingCatalogRows = useMemo(() => {
    const rows = catalogServices.map((service) => {
      const pricing = servicePriceByServiceId.get(service.id) ?? null;
      return {
        service,
        pricing,
        isActiveMissionService: activeServiceCatalogIdSet.has(service.id),
      };
    });

    rows.sort((a, b) => {
      if (a.isActiveMissionService !== b.isActiveMissionService) {
        return a.isActiveMissionService ? -1 : 1;
      }
      return a.service.service.localeCompare(b.service.service, "fr");
    });

    return rows;
  }, [catalogServices, servicePriceByServiceId, activeServiceCatalogIdSet]);
  const visiblePricingCatalogRows = useMemo(
    () =>
      showAllPricingServices
        ? pricingCatalogRows
        : pricingCatalogRows.filter((row) => row.isActiveMissionService),
    [pricingCatalogRows, showAllPricingServices],
  );
  const sortedVisiblePricingRows = useMemo(() => {
    const rows = [...visiblePricingCatalogRows];
    if (pricingSortMode === "category") {
      rows.sort((a, b) => {
        const byCategory = a.service.category.localeCompare(b.service.category, "fr");
        if (byCategory !== 0) return byCategory;
        return a.service.service.localeCompare(b.service.service, "fr");
      });
      return rows;
    }
    rows.sort((a, b) => a.service.service.localeCompare(b.service.service, "fr"));
    return rows;
  }, [visiblePricingCatalogRows, pricingSortMode]);
  const groupedPricingCatalogRows = useMemo(() => {
    const map = new Map<
      string,
      Array<{
        service: CatalogServiceItem;
        pricing: ConciergeServicePriceRow | null;
        isActiveMissionService: boolean;
      }>
    >();
    for (const row of sortedVisiblePricingRows) {
      const key = row.service.category || "Autres";
      const bucket = map.get(key);
      if (bucket) {
        bucket.push(row);
      } else {
        map.set(key, [row]);
      }
    }
    return Array.from(map.entries()).map(([category, rows]) => ({ category, rows }));
  }, [sortedVisiblePricingRows]);
  const togglePricingCategory = useCallback((category: string) => {
    setCollapsedPricingCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);
  const configuredPricingCount = useMemo(
    () => pricingCatalogRows.filter((row) => Boolean(row.pricing)).length,
    [pricingCatalogRows],
  );
  const canEditTariffConfig = editingSection === TARIFF_SECTION_IDS.CONFIG;

  const scrollToTariffSection = useCallback((sectionId: string) => {
    const target = document.getElementById(sectionId);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  const refreshCatalogServices = useCallback(async () => {
    const response = await fetch("/api/services/services-catalog");
    if (!response.ok) {
      throw new Error("Impossible de charger le catalogue.");
    }
    const data = (await response.json()) as CatalogServiceItem[];
    setCatalogServices(Array.isArray(data) ? data : []);
  }, []);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    [SECTION_IDS.INFO_PERSO]: true,
    [SECTION_IDS.SERVICES_ZONE]: true,
    [SECTION_IDS.TARIFS]: true,
    [TARIFF_SECTION_IDS.WORKFLOW]: true,
  });

  // Synchroniser l'onglet avec l'URL
  useEffect(() => {
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl, activeTab]);

  // Charger le profil au montage
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profiles/current");
        const data: Profile | { error: string } = await response.json();

        if (!isMounted) return;

        if ("error" in data) {
          throw new Error(data.error);
        }

        if (data.avatar_url && data.avatar_url.includes("/avatars//")) {
          data.avatar_url = data.avatar_url.replace(
            "/avatars/avatars/",
            "/avatars/",
          );
        }

        const hydratedData: Profile = {
          ...data,
          location: data.location ?? data.service_area ?? null,
          service_area: data.service_area ?? data.location ?? null,
          service_radius_km: data.service_radius_km ?? null,
        };

        setProfile(hydratedData);
        setEditProfile(hydratedData);
      } catch (error: unknown) {
        if (!isMounted) return;
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        console.error(
          "[ConciergeProfilePage] Erreur lors du chargement du profil:",
          errorMessage,
        );
        setErrorMsg(errorMessage);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "missions") return;

    let isMounted = true;
    const fetchMissions = async () => {
      try {
        const response = await fetch("/api/missions?scope=concierge&limit=60", {
          cache: "no-store",
        });
        const data: MissionListItem[] | { error: string } = await response.json();
        if (!isMounted) return;

        if (!response.ok || !Array.isArray(data)) {
          return;
        }

        setMissionRows(data);
        if (!selectedMissionQuoteId && data.length > 0) {
          setSelectedMissionQuoteId(data[0].id);
        }
      } catch {
        // silent fail: missions panel remains usable
      }
    };

    fetchMissions();

    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedMissionQuoteId]);

  useEffect(() => {
    if (didSeedFromOnboardingRef.current) return;
    if (!catalogServices.length) return;
    if (!editProfile) return;

    const parsed = parseMissionPayload(editProfile.availability_hours);
    const payloadRaw = parseAvailabilityPayloadRaw(editProfile.availability_hours);

    if (payloadRaw.onboardingCategorySeedApplied === true) {
      didSeedFromOnboardingRef.current = true;
      return;
    }

    // Do not overwrite if user already selected detailed services in missions.
    if (parsed.missionProfile.missions.some((mission) => mission.isActive)) {
      didSeedFromOnboardingRef.current = true;
      return;
    }

    const selectedOptions = parseLegacySelectedOptions(editProfile.option);
    if (selectedOptions.length === 0) {
      didSeedFromOnboardingRef.current = true;
      return;
    }

    const normalizedOptions = selectedOptions.map((opt) => normalizeServiceLabel(opt));
    const matchedCatalogItems = catalogServices.filter((service) => {
      return normalizedOptions.some((option) =>
        matchesOnboardingOption(option, service),
      );
    });

    if (matchedCatalogItems.length === 0) {
      didSeedFromOnboardingRef.current = true;
      return;
    }

    const matchedLabelSet = new Set(
      matchedCatalogItems.map((item) => normalizeServiceLabel(item.service)),
    );

    setEditProfile((prev) => {
      if (!prev) return prev;

      const existingPayload = parseAvailabilityPayloadRaw(prev.availability_hours);
      const parsedFromPrev = parseMissionPayload(prev.availability_hours);
      const hasMissionProfile = parsedFromPrev.missionProfile.missions.length > 0;

      const baseMissions = hasMissionProfile
        ? parsedFromPrev.missionProfile.missions
        : parsedFromPrev.missionCatalog.map((catalogItem) => ({
            id: catalogItem.id,
            label: catalogItem.label,
            isActive: false,
            minNoticeHours: 24,
            allowUrgent: false,
            urgentMultiplier: 1.3,
          }));

      const existingIdSet = new Set(baseMissions.map((mission) => mission.id));
      const missingMissions = matchedCatalogItems
        .map((item) => {
          const id = toMissionTypeId(item.service);
          if (existingIdSet.has(id)) return null;
          existingIdSet.add(id);
          return {
            id,
            label: item.service,
            isActive: true,
            minNoticeHours: 24,
            allowUrgent: false,
            urgentMultiplier: 1.3,
          };
        })
        .filter(
          (
            mission,
          ): mission is ConciergeMissionProfile["missions"][number] => Boolean(mission),
        );

      const nextMissions = [...baseMissions, ...missingMissions].map((mission) => ({
        ...mission,
        isActive: matchedLabelSet.has(normalizeServiceLabel(mission.label)),
      }));

      const nextMissionProfile: ConciergeMissionProfile = {
        ...parsedFromPrev.missionProfile,
        missions: nextMissions,
      };
      const legacy = buildLegacyFromMissionProfile(nextMissionProfile);

      return {
        ...prev,
        availability_hours: JSON.stringify({
          ...existingPayload,
          missionProfile: nextMissionProfile,
          missionCatalog: legacy.missionCatalog,
          preferences: legacy.preferences,
          onboardingCategorySeedApplied: true,
        }),
      };
    });

    didSeedFromOnboardingRef.current = true;
  }, [catalogServices, editProfile]);

  useEffect(() => {
    let isMounted = true;
    refreshCatalogServices().catch(() => {
      if (!isMounted) return;
      setCatalogServices([]);
    });

    return () => {
      isMounted = false;
    };
  }, [refreshCatalogServices]);


  const hasUnsavedChanges = useCallback(
    (sectionId: string | null): boolean => {
      return hasSectionUnsavedChanges(sectionEditSnapshots, sectionId, editProfile);
    },
    [editProfile, sectionEditSnapshots],
  );

  const confirmDiscardIfNeeded = useCallback(
    (sectionId: string | null): boolean => {
      if (!hasUnsavedChanges(sectionId)) return true;
      return window.confirm(
        "Vous avez des modifications non enregistrées. Voulez-vous quitter sans sauvegarder ?",
      );
    },
    [hasUnsavedChanges],
  );

  const handleTabChange = useCallback((tabId: TabId) => {
    if (tabId === activeTab) return;
    if (!confirmDiscardIfNeeded(editingSection)) return;

    if (editingSection) {
      setSectionEditSnapshots((prev) => removeSectionSnapshot(prev, editingSection));
      setEditingSection(null);
      setEditProfile(profile);
      setErrors({});
      setAvatarFile(null);
    }

    setActiveTab(tabId);
    router.push(`?tab=${tabId}`, { scroll: false });
  }, [activeTab, confirmDiscardIfNeeded, editingSection, profile, router]);

  const applyPricingV2 = useCallback((next: PricingV2Config) => {
    setEditProfile((prev) =>
      prev
        ? (() => {
            const legacy = parseSeasonalPricing(prev.availability_hours);
            const syncedLegacy = syncSeasonalPricingFromPricingV2(legacy, next);

            return {
            ...prev,
            hourly_rate: next.base.hourlyRate,
            travel_fee: next.base.travelFee,
            availability_hours: JSON.stringify({
              ...parseAvailabilityPayloadRaw(prev.availability_hours),
              pricing: syncedLegacy,
              pricing_v2: next,
            }),
          };
        })()
        : prev,
    );
  }, []);
  const applyPricingMeta = useCallback((next: PricingMetaConfig) => {
    setEditProfile((prev) =>
      prev
        ? {
            ...prev,
            availability_hours: JSON.stringify({
              ...parseAvailabilityPayloadRaw(prev.availability_hours),
              pricing_meta: {
                commissionRatePct: Math.max(0, Math.min(100, next.commissionRatePct)),
                setupFee: Math.max(0, next.setupFee),
              },
            }),
          }
        : prev,
    );
  }, []);

  const pushTransientMessage = useCallback(
    (kind: "success" | "error", message: string) => {
      if (kind === "success") {
        setSuccessMsg(message);
        setTimeout(() => setSuccessMsg(""), 4000);
        return;
      }
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(""), 5000);
    },
    [],
  );
  const removeUnrecognizedServices = useCallback(async () => {
    if (unrecognizedActiveMissionLabels.length === 0) return;
    setCatalogSyncBusy(true);
    try {
      setEditProfile((prev) => {
        if (!prev) return prev;
        const payload = parseMissionPayload(prev.availability_hours);
        const knownLabels = new Set(
          catalogServices.map((service) => normalizeServiceLabel(service.service)),
        );

        const nextMissions = payload.missionProfile.missions.filter((mission) =>
          knownLabels.has(normalizeServiceLabel(mission.label)),
        );
        if (nextMissions.length === payload.missionProfile.missions.length) return prev;

        const nextMissionProfile: ConciergeMissionProfile = {
          ...payload.missionProfile,
          missions: nextMissions,
        };
        const legacy = buildLegacyFromMissionProfile(nextMissionProfile);

        return {
          ...prev,
          availability_hours: JSON.stringify({
            ...parseAvailabilityPayloadRaw(prev.availability_hours),
            missionProfile: nextMissionProfile,
            missionCatalog: legacy.missionCatalog,
            preferences: legacy.preferences,
          }),
        };
      });

      pushTransientMessage(
        "success",
        `${unrecognizedActiveMissionLabels.length} service(s) non reconnu(s) supprime(s).`,
      );
    } catch {
      pushTransientMessage(
        "error",
        "Erreur pendant la suppression des services non reconnus.",
      );
    } finally {
      setCatalogSyncBusy(false);
    }
  }, [unrecognizedActiveMissionLabels, catalogServices, pushTransientMessage]);
  const fetchServicePrices = useCallback(async () => {
    setServicePricesLoading(true);
    try {
        const res = await fetch("/api/pricing", { cache: "no-store" });
      const data: ConciergeServicePriceRow[] | { error: string } = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        throw new Error(
          !res.ok && data && typeof data === "object" && "error" in data
            ? data.error
            : "Impossible de charger la grille tarifaire.",
        );
      }
      setServicePrices(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors du chargement des tarifs.";
      pushTransientMessage("error", message);
    } finally {
      setServicePricesLoading(false);
    }
  }, [pushTransientMessage]);
  const fetchPricingSegments = useCallback(async () => {
    setSegmentsLoading(true);
    try {
      const res = await fetch("/api/pricing/segments", { cache: "no-store" });
      const data: PricingSegmentRow[] | { error: string } = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        throw new Error(
          !res.ok && data && typeof data === "object" && "error" in data
            ? data.error
            : "Impossible de charger les segments propriétaires.",
        );
      }
      setPricingSegments(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur chargement segments.";
      pushTransientMessage("error", message);
    } finally {
      setSegmentsLoading(false);
    }
  }, [pushTransientMessage]);
  const fetchPricingPropertyRules = useCallback(async () => {
    setPropertyRulesLoading(true);
    try {
      const res = await fetch("/api/pricing/property-rules", { cache: "no-store" });
      const data: PricingPropertyRuleRow[] | { error: string } = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        throw new Error(
          !res.ok && data && typeof data === "object" && "error" in data
            ? data.error
            : "Impossible de charger les règles de complexité.",
        );
      }
      setPropertyRules(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur chargement règles.";
      pushTransientMessage("error", message);
    } finally {
      setPropertyRulesLoading(false);
    }
  }, [pushTransientMessage]);
  const fetchPricingScenarios = useCallback(async () => {
    setScenariosLoading(true);
    try {
      const res = await fetch("/api/pricing/strategy-scenarios", { cache: "no-store" });
      const data: PricingStrategyScenarioRow[] | { error: string } = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        throw new Error(
          !res.ok && data && typeof data === "object" && "error" in data
            ? data.error
            : "Impossible de charger les scénarios.",
        );
      }
      setPricingScenarios(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur chargement scénarios.";
      pushTransientMessage("error", message);
    } finally {
      setScenariosLoading(false);
    }
  }, [pushTransientMessage]);
  const createPricingScenario = useCallback(async () => {
    if (!canEditTariffConfig) return;
    const name = scenarioDraftName.trim();
    if (!name) {
      pushTransientMessage("error", "Nom du scénario obligatoire.");
      return;
    }
    setScenariosBusyId("create");
    try {
      const res = await fetch("/api/pricing/strategy-scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          simulation: strategySim,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data && typeof data === "object" && "error" in data
            ? String(data.error)
            : "Impossible de créer le scénario.",
        );
      }
      await fetchPricingScenarios();
      setScenarioDraftName("");
      pushTransientMessage("success", "Scénario enregistré.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur création scénario.";
      pushTransientMessage("error", message);
    } finally {
      setScenariosBusyId(null);
    }
  }, [
    canEditTariffConfig,
    scenarioDraftName,
    strategySim,
    fetchPricingScenarios,
    pushTransientMessage,
  ]);
  const setDefaultPricingScenario = useCallback(
    async (row: PricingStrategyScenarioRow) => {
      if (!canEditTariffConfig) return;
      setScenariosBusyId(row.id);
      try {
        const res = await fetch(
          `/api/pricing/strategy-scenarios/${encodeURIComponent(row.id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_default: true }),
          },
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data && typeof data === "object" && "error" in data
              ? String(data.error)
              : "Impossible de définir le scénario par défaut.",
          );
        }
        await fetchPricingScenarios();
        pushTransientMessage("success", "Scénario défini par défaut.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erreur mise à jour scénario.";
        pushTransientMessage("error", message);
      } finally {
        setScenariosBusyId(null);
      }
    },
    [canEditTariffConfig, fetchPricingScenarios, pushTransientMessage],
  );
  const deletePricingScenario = useCallback(
    async (id: string) => {
      if (!canEditTariffConfig) return;
      if (!window.confirm("Supprimer ce scénario ?")) return;
      setScenariosBusyId(id);
      try {
        const res = await fetch(
          `/api/pricing/strategy-scenarios/${encodeURIComponent(id)}`,
          { method: "DELETE" },
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data && typeof data === "object" && "error" in data
              ? String(data.error)
              : "Impossible de supprimer le scénario.",
          );
        }
        await fetchPricingScenarios();
        pushTransientMessage("success", "Scénario supprimé.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erreur suppression scénario.";
        pushTransientMessage("error", message);
      } finally {
        setScenariosBusyId(null);
      }
    },
    [canEditTariffConfig, fetchPricingScenarios, pushTransientMessage],
  );
  const loadPricingScenario = useCallback(
    (row: PricingStrategyScenarioRow) => {
      const nextSim = normalizeStrategySim(row.simulation);
      setStrategySim(nextSim);
      pushTransientMessage("success", `Scénario chargé : ${row.name}.`);
    },
    [pushTransientMessage],
  );
  const createPricingSegment = useCallback(async () => {
    if (!canEditTariffConfig) return;
    const name = segmentDraft.name.trim();
    if (!name) {
      pushTransientMessage("error", "Le nom du segment est obligatoire.");
      return;
    }
    setSegmentsBusyId("create");
    try {
      const payload = {
        name,
        commission_delta_pct: Number(segmentDraft.commission_delta_pct || 0),
        setup_fee_delta_pct: Number(segmentDraft.setup_fee_delta_pct || 0),
      };
      const res = await fetch("/api/pricing/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data && typeof data === "object" && "error" in data
            ? String(data.error)
            : "Impossible de créer le segment.",
        );
      }
      await fetchPricingSegments();
      setSegmentDraft({ name: "", commission_delta_pct: "0", setup_fee_delta_pct: "0" });
      pushTransientMessage("success", "Segment ajouté.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur creation segment.";
      pushTransientMessage("error", message);
    } finally {
      setSegmentsBusyId(null);
    }
  }, [
    canEditTariffConfig,
    segmentDraft,
    fetchPricingSegments,
    pushTransientMessage,
  ]);
  const updatePricingSegment = useCallback(
    async (row: PricingSegmentRow) => {
      if (!canEditTariffConfig) return;
      setSegmentsBusyId(row.id);
      try {
        const res = await fetch(`/api/pricing/segments/${encodeURIComponent(row.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: row.name,
            commission_delta_pct: row.commission_delta_pct,
            setup_fee_delta_pct: row.setup_fee_delta_pct,
            is_default: row.is_default,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data && typeof data === "object" && "error" in data
              ? String(data.error)
              : "Impossible de mettre a jour le segment.",
          );
        }
        await fetchPricingSegments();
        pushTransientMessage("success", "Segment mis à jour.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erreur mise a jour segment.";
        pushTransientMessage("error", message);
      } finally {
        setSegmentsBusyId(null);
      }
    },
    [canEditTariffConfig, fetchPricingSegments, pushTransientMessage],
  );
  const deletePricingSegment = useCallback(
    async (id: string) => {
      if (!canEditTariffConfig) return;
      if (!window.confirm("Supprimer ce segment ?")) return;
      setSegmentsBusyId(id);
      try {
        const res = await fetch(`/api/pricing/segments/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data && typeof data === "object" && "error" in data
              ? String(data.error)
              : "Impossible de supprimer ce segment.",
          );
        }
        await fetchPricingSegments();
        pushTransientMessage("success", "Segment supprimé.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erreur suppression segment.";
        pushTransientMessage("error", message);
      } finally {
        setSegmentsBusyId(null);
      }
    },
    [canEditTariffConfig, fetchPricingSegments, pushTransientMessage],
  );
  const createPricingPropertyRule = useCallback(async () => {
    if (!canEditTariffConfig) return;
    setPropertyRulesBusyId("create");
    try {
      const payload = {
        service_id: propertyRuleDraft.service_id ? Number(propertyRuleDraft.service_id) : null,
        property_type: propertyRuleDraft.property_type.trim() || null,
        min_surface_m2: propertyRuleDraft.min_surface_m2
          ? Number(propertyRuleDraft.min_surface_m2)
          : null,
        max_surface_m2: propertyRuleDraft.max_surface_m2
          ? Number(propertyRuleDraft.max_surface_m2)
          : null,
        delta_pct: Number(propertyRuleDraft.delta_pct || 0),
      };
      const res = await fetch("/api/pricing/property-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data && typeof data === "object" && "error" in data
            ? String(data.error)
            : "Impossible de créer la règle.",
        );
      }
      await fetchPricingPropertyRules();
      setPropertyRuleDraft({
        service_id: "",
        property_type: "",
        min_surface_m2: "",
        max_surface_m2: "",
        delta_pct: "0",
      });
      pushTransientMessage("success", "Règle ajoutée.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur creation regle.";
      pushTransientMessage("error", message);
    } finally {
      setPropertyRulesBusyId(null);
    }
  }, [
    canEditTariffConfig,
    propertyRuleDraft,
    fetchPricingPropertyRules,
    pushTransientMessage,
  ]);
  const updatePricingPropertyRule = useCallback(
    async (row: PricingPropertyRuleRow) => {
      if (!canEditTariffConfig) return;
      setPropertyRulesBusyId(row.id);
      try {
        const res = await fetch(
          `/api/pricing/property-rules/${encodeURIComponent(row.id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              service_id: row.service_id,
              property_type: row.property_type,
              min_surface_m2: row.min_surface_m2,
              max_surface_m2: row.max_surface_m2,
              delta_pct: row.delta_pct,
            }),
          },
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data && typeof data === "object" && "error" in data
              ? String(data.error)
              : "Impossible de mettre a jour la regle.",
          );
        }
        await fetchPricingPropertyRules();
        pushTransientMessage("success", "Règle mise à jour.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erreur mise a jour regle.";
        pushTransientMessage("error", message);
      } finally {
        setPropertyRulesBusyId(null);
      }
    },
    [canEditTariffConfig, fetchPricingPropertyRules, pushTransientMessage],
  );
  const deletePricingPropertyRule = useCallback(
    async (id: string) => {
      if (!canEditTariffConfig) return;
      if (!window.confirm("Supprimer cette regle ?")) return;
      setPropertyRulesBusyId(id);
      try {
        const res = await fetch(`/api/pricing/property-rules/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data && typeof data === "object" && "error" in data
              ? String(data.error)
              : "Impossible de supprimer cette regle.",
          );
        }
        await fetchPricingPropertyRules();
        pushTransientMessage("success", "Règle supprimée.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erreur suppression regle.";
        pushTransientMessage("error", message);
      } finally {
        setPropertyRulesBusyId(null);
      }
    },
    [canEditTariffConfig, fetchPricingPropertyRules, pushTransientMessage],
  );
  const resetPricingModal = useCallback(() => {
    setPricingModalState(DEFAULT_PRICING_MODAL);
    setPricingModalError("");
  }, []);
  const closePricingModal = useCallback(() => {
    setPricingModalOpen(false);
    resetPricingModal();
  }, [resetPricingModal]);
  const resetPricingModalToDefaults = useCallback(() => {
    setPricingModalState((prev) => ({
      ...prev,
      amount: pricingV2.base.hourlyRate > 0 ? String(Math.round(pricingV2.base.hourlyRate)) : "",
      unit: prev.type === "hourly" ? "par heure" : "par prestation",
    }));
  }, [pricingV2.base.hourlyRate]);
  const openCreatePricingModal = useCallback(
    (service?: CatalogServiceItem) => {
      const suggestedLabel = service?.service ?? "";
      const suggestedType: PricingTypeValue = pricingV2.base.hourlyRate > 0 ? "hourly" : "fixed";
      const suggestedUnit =
        suggestedType === "hourly" ? "par heure" : DEFAULT_PRICING_MODAL.unit;

      setPricingModalState({
        id: undefined,
        serviceId: service ? String(service.id) : "",
        label: suggestedLabel,
        type: suggestedType,
        amount:
          suggestedType === "hourly" && pricingV2.base.hourlyRate > 0
            ? String(Math.round(pricingV2.base.hourlyRate))
            : "",
        unit: suggestedUnit,
      });
      setPricingModalError("");
      setPricingModalOpen(true);
    },
    [pricingV2.base.hourlyRate],
  );
  const openEditPricingModal = useCallback((row: ConciergeServicePriceRow) => {
    setPricingModalState({
      id: row.id,
      serviceId: row.service_id != null ? String(row.service_id) : "",
      label: row.label ?? "",
      type: (row.type as PricingTypeValue | null) ?? "fixed",
      amount: String(row.amount ?? ""),
      unit: row.unit ?? "par prestation",
    });
    setPricingModalError("");
    setPricingModalOpen(true);
  }, []);
  const ensureMissionServiceActiveFromPricing = useCallback(
    (serviceIdNumber: number, fallbackLabel?: string) => {
      setEditProfile((prev) => {
        if (!prev) return prev;

        const payload = parseMissionPayload(prev.availability_hours);
        const catalogService = catalogServices.find((item) => item.id === serviceIdNumber);
        const targetLabel = (catalogService?.service ?? fallbackLabel ?? "").trim();
        if (!targetLabel) return prev;

        const normalizedTargetLabel = normalizeServiceLabel(targetLabel);
        const targetMissionId = toMissionTypeId(targetLabel);
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
          if (normalizeServiceLabel(mission.label) !== normalizedTargetLabel) return mission;
          if (mission.isActive) return mission;
          didChange = true;
          return { ...mission, isActive: true };
        });

        const hasMissionInProfile = nextMissions.some(
          (mission) => normalizeServiceLabel(mission.label) === normalizedTargetLabel,
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

        if (!didChange) return prev;

        const nextMissionProfile: ConciergeMissionProfile = {
          ...payload.missionProfile,
          missions: nextMissions,
        };
        const legacy = buildLegacyFromMissionProfile(nextMissionProfile);

        return {
          ...prev,
          availability_hours: JSON.stringify({
            ...parseAvailabilityPayloadRaw(prev.availability_hours),
            missionProfile: nextMissionProfile,
            missionCatalog: legacy.missionCatalog,
            preferences: legacy.preferences,
          }),
        };
      });
    },
    [catalogServices],
  );
  const disableMissionServiceFromPricing = useCallback(
    (serviceIdNumber: number, fallbackLabel?: string) => {
      setEditProfile((prev) => {
        if (!prev) return prev;

        const payload = parseMissionPayload(prev.availability_hours);
        const catalogService = catalogServices.find((item) => item.id === serviceIdNumber);
        const targetLabel = (catalogService?.service ?? fallbackLabel ?? "").trim();
        if (!targetLabel) return prev;

        const normalizedTargetLabel = normalizeServiceLabel(targetLabel);
        const nextMissions = payload.missionProfile.missions.map((mission) => {
          if (normalizeServiceLabel(mission.label) !== normalizedTargetLabel) return mission;
          if (!mission.isActive) return mission;
          return { ...mission, isActive: false };
        });

        const didChange = nextMissions.some((mission, idx) => {
          const prevMission = payload.missionProfile.missions[idx];
          return prevMission && prevMission.isActive !== mission.isActive;
        });
        if (!didChange) return prev;

        const nextMissionProfile: ConciergeMissionProfile = {
          ...payload.missionProfile,
          missions: nextMissions,
        };
        const legacy = buildLegacyFromMissionProfile(nextMissionProfile);

        return {
          ...prev,
          availability_hours: JSON.stringify({
            ...parseAvailabilityPayloadRaw(prev.availability_hours),
            missionProfile: nextMissionProfile,
            missionCatalog: legacy.missionCatalog,
            preferences: legacy.preferences,
          }),
        };
      });
    },
    [catalogServices],
  );
  const saveServicePrice = useCallback(async () => {
    if (!canEditTariffConfig) return;

    const serviceIdNumber = Number(pricingModalState.serviceId);
    if (!Number.isFinite(serviceIdNumber) || serviceIdNumber <= 0) {
      setPricingModalError("Selectionnez un service.");
      return;
    }

    const parsedAmount = Number(pricingModalState.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setPricingModalError("Le tarif doit etre superieur a 0.");
      return;
    }

    if (!pricingModalState.unit.trim()) {
      setPricingModalError("L'unite est obligatoire.");
      return;
    }

    setPricingModalSaving(true);
    setPricingModalError("");
    try {
      const serviceRef = catalogServices.find((item) => item.id === serviceIdNumber);
      const payload = {
        service_id: serviceIdNumber,
        label: pricingModalState.label.trim() || serviceRef?.service || "Service",
        type: pricingModalState.type,
        amount: parsedAmount,
        unit: pricingModalState.unit,
        };
        const isUpdate = Boolean(pricingModalState.id);
        const endpoint = isUpdate
          ? `/api/pricing/${encodeURIComponent(pricingModalState.id ?? "")}`
          : "/api/pricing";
        const method = isUpdate ? "PATCH" : "POST";
        const payloadWithId = isUpdate
          ? payload
          : payload;
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadWithId),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data && typeof data === "object" && "error" in data
            ? String(data.error)
            : "Erreur lors de l'enregistrement du tarif.",
        );
      }

      await fetchServicePrices();
      ensureMissionServiceActiveFromPricing(serviceIdNumber, payload.label);
      closePricingModal();
      pushTransientMessage("success", "Tarif enregistré avec succès.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible d'enregistrer ce tarif.";
      setPricingModalError(message);
    } finally {
      setPricingModalSaving(false);
    }
  }, [
    canEditTariffConfig,
    pricingModalState,
    catalogServices,
    fetchServicePrices,
    ensureMissionServiceActiveFromPricing,
    closePricingModal,
    pushTransientMessage,
  ]);
  const deleteServicePrice = useCallback(
    async (row: ConciergeServicePriceRow) => {
      if (!canEditTariffConfig) return;
      if (!window.confirm("Supprimer ce tarif ?")) return;

      setServicePricesBusyId(row.id);
      try {
          const res = await fetch(`/api/pricing/${encodeURIComponent(row.id)}`, {
            method: "DELETE",
          });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data && typeof data === "object" && "error" in data
              ? String(data.error)
            : "Erreur lors de la suppression.",
          );
        }
        const shouldDisableInMissions =
          typeof row.service_id === "number" &&
          !servicePrices.some(
            (item) => item.id !== row.id && item.service_id === row.service_id,
          );
        await fetchServicePrices();
        if (shouldDisableInMissions && typeof row.service_id === "number") {
          disableMissionServiceFromPricing(row.service_id, row.label);
        }
        pushTransientMessage("success", "Tarif supprimé.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Impossible de supprimer ce tarif.";
        pushTransientMessage("error", message);
      } finally {
        setServicePricesBusyId(null);
      }
    },
    [
      canEditTariffConfig,
      servicePrices,
      fetchServicePrices,
      disableMissionServiceFromPricing,
      pushTransientMessage,
    ],
  );
  const pricingMeta = useMemo(
    () => parsePricingMeta(editProfile?.availability_hours),
    [editProfile?.availability_hours],
  );
  const tariffLocationLabel = useMemo(
    () =>
      editProfile?.location?.trim() ||
      editProfile?.service_area?.trim() ||
      "Non renseigne",
    [editProfile?.location, editProfile?.service_area],
  );
  const selectedPricingSegment = useMemo(() => {
    if (pricingSegments.length === 0) return null;
    const byId = pricingSegments.find((segment) => segment.id === strategySim.segmentId);
    if (byId) return byId;
    return pricingSegments.find((segment) => segment.is_default) ?? pricingSegments[0];
  }, [pricingSegments, strategySim.segmentId]);
  const strategyProjection = useMemo(() => {
    const revenueEstimate = Math.max(0, Number(strategySim.revenueEstimate || 0));
    const newListingsCount = Math.max(0, Number(strategySim.newListingsCount || 0));
    const actServicesCount = Math.max(0, Number(strategySim.actServicesCount || 0));
    const surfaceM2 = Math.max(0, Number(strategySim.surfaceM2 || 0));
    const selectedServiceId = strategySim.serviceId ? Number(strategySim.serviceId) : null;

    const segmentCommissionDelta = selectedPricingSegment?.commission_delta_pct ?? 0;
    const segmentSetupDelta = selectedPricingSegment?.setup_fee_delta_pct ?? 0;

    const commissionEffectivePct = Math.max(
      0,
      Math.min(100, pricingMeta.commissionRatePct + segmentCommissionDelta),
    );
    const commissionAmount = (revenueEstimate * commissionEffectivePct) / 100;

    const setupUnit = pricingMeta.setupFee * (1 + segmentSetupDelta / 100);
    const setupAmount = setupUnit * newListingsCount;

    const contextPercent =
      (strategySim.isUrgent ? pricingV2.globalModifiers.urgentPercent : 0) +
      (strategySim.isNight ? pricingV2.globalModifiers.nightPercent : 0) +
      (strategySim.isWeekend ? pricingV2.globalModifiers.weekendPercent : 0) +
      (strategySim.isHighSeason ? pricingV2.globalModifiers.highSeasonPercent : 0);

    const propertyRulesSorted = [...propertyRules].sort((a, b) => {
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

    const matchedRule =
      propertyRulesSorted.find((rule) => {
        if (rule.service_id != null && selectedServiceId != null && rule.service_id !== selectedServiceId) {
          return false;
        }
        if (rule.service_id != null && selectedServiceId == null) return false;
        if (
          rule.property_type &&
          rule.property_type.trim().toLowerCase() !== strategySim.propertyType.trim().toLowerCase()
        ) {
          return false;
        }
        if (rule.min_surface_m2 != null && surfaceM2 < rule.min_surface_m2) return false;
        if (rule.max_surface_m2 != null && surfaceM2 > rule.max_surface_m2) return false;
        return true;
      }) ?? null;

    const propertyDeltaPct = matchedRule?.delta_pct ?? 0;
    const actBase = Math.max(pricingV2.base.minimumInvoice, pricingV2.base.hourlyRate * 2 + pricingV2.base.travelFee);
    const actUnit = actBase * (1 + propertyDeltaPct / 100) * (1 + contextPercent / 100);
    const actAmount = actUnit * actServicesCount;

    const total = commissionAmount + setupAmount + actAmount;
    const contexts = [
      strategySim.isUrgent ? "urgence" : null,
      strategySim.isNight ? "nuit" : null,
      strategySim.isWeekend ? "week-end" : null,
      strategySim.isHighSeason ? "haute saison" : null,
    ].filter((value): value is string => Boolean(value));

    const narrative = `Segment ${selectedPricingSegment?.name ?? "Standard"} (${segmentCommissionDelta >= 0 ? "+" : ""}${segmentCommissionDelta}% commission), type ${strategySim.propertyType}, surface ${surfaceM2} m2, modulateur bien ${propertyDeltaPct >= 0 ? "+" : ""}${propertyDeltaPct}%${contexts.length > 0 ? `, contexte ${contexts.join(", ")}` : ""}.`;

    return {
      revenueEstimate,
      newListingsCount,
      actServicesCount,
      commissionEffectivePct,
      commissionAmount,
      setupUnit,
      setupAmount,
      contextPercent,
      propertyDeltaPct,
      actUnit,
      actAmount,
      total,
      narrative,
    };
  }, [
    strategySim,
    pricingMeta.commissionRatePct,
    pricingMeta.setupFee,
    selectedPricingSegment,
    pricingV2.base.hourlyRate,
    pricingV2.base.minimumInvoice,
    pricingV2.base.travelFee,
    pricingV2.globalModifiers.highSeasonPercent,
    pricingV2.globalModifiers.nightPercent,
    pricingV2.globalModifiers.urgentPercent,
    pricingV2.globalModifiers.weekendPercent,
    propertyRules,
  ]);
  const applyStrategyProjectionToBillingDesk = useCallback(() => {
    setBillingDeskPreset({
      monthlyRevenueEstimate: strategyProjection.revenueEstimate,
      newListingsEstimate: strategyProjection.newListingsCount,
      actServicesEstimate: strategyProjection.actServicesCount,
    });
    setBillingDeskPresetVersion((prev) => prev + 1);
    scrollToTariffSection("tariffs-billing-desk");
  }, [strategyProjection, scrollToTariffSection]);
  const billingDeskProps = useMemo(
    () => ({
      hourlyRate: pricingV2.base.hourlyRate,
      travelFee: pricingV2.base.travelFee,
      minimumInvoice: pricingV2.base.minimumInvoice,
      urgentPercent: pricingV2.globalModifiers.urgentPercent,
      nightPercent: pricingV2.globalModifiers.nightPercent,
      weekendPercent: pricingV2.globalModifiers.weekendPercent,
      highSeasonPercent: pricingV2.globalModifiers.highSeasonPercent,
      commissionRatePct: pricingMeta.commissionRatePct,
      setupFee: pricingMeta.setupFee,
      presetVersion: billingDeskPresetVersion,
      presetMonthlyRevenueEstimate: billingDeskPreset.monthlyRevenueEstimate,
      presetNewListingsEstimate: billingDeskPreset.newListingsEstimate,
      presetActServicesEstimate: billingDeskPreset.actServicesEstimate,
    }),
    [
      billingDeskPreset.actServicesEstimate,
      billingDeskPreset.monthlyRevenueEstimate,
      billingDeskPreset.newListingsEstimate,
      billingDeskPresetVersion,
      pricingMeta.commissionRatePct,
      pricingMeta.setupFee,
      pricingV2.base.hourlyRate,
      pricingV2.base.minimumInvoice,
      pricingV2.base.travelFee,
      pricingV2.globalModifiers.highSeasonPercent,
      pricingV2.globalModifiers.nightPercent,
      pricingV2.globalModifiers.urgentPercent,
      pricingV2.globalModifiers.weekendPercent,
    ],
  );
  const resetAllServicePrices = useCallback(async () => {
    if (!canEditTariffConfig || servicePrices.length === 0) return;
    if (!window.confirm("Réinitialiser la grille et supprimer tous les tarifs personnalisés ?")) {
      return;
    }

    setServicePricesBusyId("all");
    try {
      const serviceIdsToDisable = Array.from(
        new Set(
          servicePrices
            .map((row) => row.service_id)
            .filter((value): value is number => typeof value === "number"),
        ),
      );
      await Promise.all(
        servicePrices.map((row) =>
          fetch(`/api/pricing/${encodeURIComponent(row.id)}`, { method: "DELETE" }),
        ),
      );
      await fetchServicePrices();
      serviceIdsToDisable.forEach((serviceId) => disableMissionServiceFromPricing(serviceId));
      pushTransientMessage("success", "Grille tarifaire réinitialisée.");
    } catch {
      pushTransientMessage("error", "Erreur pendant la réinitialisation des tarifs.");
    } finally {
      setServicePricesBusyId(null);
    }
  }, [
    canEditTariffConfig,
    servicePrices,
    fetchServicePrices,
    disableMissionServiceFromPricing,
    pushTransientMessage,
  ]);

  useEffect(() => {
    if (activeTab !== "tarifs") return;
    fetchServicePrices();
    fetchPricingSegments();
    fetchPricingPropertyRules();
    fetchPricingScenarios();
  }, [
    activeTab,
    fetchServicePrices,
    fetchPricingSegments,
    fetchPricingPropertyRules,
    fetchPricingScenarios,
  ]);

  const getPropertyTypeDeltaPercent = useCallback(
    (propertyType: string): number => {
      const rule = pricingV2.contextRules.find(
        (item) => item.id === `property-type-${propertyType}`,
      );
      if (!rule?.adjustments?.multiplier) return 0;
      return Math.round((rule.adjustments.multiplier - 1) * 100);
    },
    [pricingV2.contextRules],
  );

  const updatePropertyTypeDeltaPercent = useCallback(
    (propertyType: string, deltaPercent: number) => {
      const safePercent = Number.isFinite(deltaPercent) ? deltaPercent : 0;
      const nextRuleId = `property-type-${propertyType}`;
      const existing = pricingV2.contextRules.filter((item) => item.id !== nextRuleId);
      const nextRule = {
        id: nextRuleId,
        enabled: safePercent !== 0,
        priority: 60,
        scope: { propertyType },
        adjustments: { multiplier: 1 + safePercent / 100 },
      };

      applyPricingV2({
        ...pricingV2,
        contextRules: [...existing, nextRule],
      });
    },
    [applyPricingV2, pricingV2],
  );


  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!editProfile) return;

    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setEditProfile((prev) => (prev ? { ...prev, [name]: checked } : prev));
      return;
    }

    setEditProfile((prev) =>
      updateProfileFieldValue(prev, name, value, {
        parseSeasonalPricing,
        parsePricingV2FromAvailabilityHours,
        syncSeasonalPricingFromPricingV2,
        parseAvailabilityPayloadRaw,
      }),
    );

    setErrors((prevErrors) => updateProfileFieldErrorsSafe(prevErrors, name, value));
  };

  const handleSaveSection = async (sectionTitle: string) => {
    if (!editProfile) return;

    if (hasValidationErrors(errors)) {
      alert(buildProfileValidationAlertMessageSafe());
      return;
    }

    setLoading(true);
    let avatarUrl = editProfile.avatar_url;
    const shouldMarkOnboardingComplete = shouldCompleteMissionOnboarding(
      activeTab,
      missionProgressSteps,
      editProfile,
    );

    try {
      if (avatarFile && sectionTitle === "Photo de profil") {
        avatarUrl = await uploadProfileAvatar(avatarFile, editProfile.id);
      }

      const updatedProfile = await patchProfileRequest(
        editProfile,
        avatarUrl,
        shouldMarkOnboardingComplete,
      );
      const savedSectionId = resolveSavedSectionId(
        editingSection,
        sectionTitle,
        normalizeSectionId,
      );
      setProfile(updatedProfile);
      setEditProfile(updatedProfile);
      setEditingSection(null);
      setSectionEditSnapshots((prev) => removeSectionSnapshot(prev, savedSectionId));
      setAvatarFile(null);

      await update({
        user: buildSessionUserPayload(editProfile, avatarUrl),
      });
      window.dispatchEvent(new Event("user-profile-updated"));

      pushTransientMessage("success", buildProfileSuccessMessageSafe(sectionTitle));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error("[ConciergeProfilePage] Erreur sauvegarde:", errorMessage);
      pushTransientMessage("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => toggleOpenSection(prev, sectionId));
  };

  const beginSectionEdit = (sectionId: string) => {
    if (editingSection && editingSection !== sectionId) {
      if (!confirmDiscardIfNeeded(editingSection)) return;
      setSectionEditSnapshots((prev) => removeSectionSnapshot(prev, editingSection));
    }

    if (editProfile) {
      setSectionEditSnapshots((prev) => upsertSectionSnapshot(prev, sectionId, editProfile));
    }
    setEditingSection(sectionId);
  };

  const openMissionSectionForEdit = (sectionId: string) => {
    beginSectionEdit(sectionId);
    setOpenSections((prev) => ensureOpenSection(prev, sectionId));
  };

  const cancelSectionEdit = () => {
    if (!confirmDiscardIfNeeded(editingSection)) return;

    if (editingSection) {
      setSectionEditSnapshots((prev) => removeSectionSnapshot(prev, editingSection));
    }
    setEditingSection(null);
    setEditProfile(profile);
    setErrors({});
    setAvatarFile(null);
  };

  const handleSectionHeaderKeyDown = (
    e: KeyboardEvent<HTMLDivElement>,
    sectionId: string,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleSection(sectionId);
    }
  };

  const renderField = (
    label: string,
    name: ExtendedFieldName,
    sectionId: string,
    isTextarea: boolean = false,
    required: boolean = false,
    placeholder: string = "",
    type: string = "text",
    inputProps?: Record<string, number | string>,
    ) => {
      const isThisSectionEditing = editingSection === sectionId;
      const value = (editProfile?.[name as keyof Profile] ??
        "") as string | number | null;
      const error = errors[name as string];

    return (
      <EditableProfileField
        styles={styles}
        label={label}
        name={name.toString()}
        value={value}
        error={error}
        isEditing={isThisSectionEditing}
        isTextarea={isTextarea}
        required={required}
        placeholder={placeholder}
        type={type}
        inputProps={inputProps}
        onChange={handleChange}
      />
    );
  };

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    children: React.ReactNode,
    canEdit: boolean = true,
    sectionIdOverride?: string,
    collapsible: boolean = true,
  ) => {
    const sectionId = sectionIdOverride ?? normalizeSectionId(title);
    const isOpen = collapsible ? (openSections[sectionId] ?? false) : true;
    const isEditingThis = editingSection === sectionId;
    const isSectionDirty =
      isEditingThis &&
      hasSectionUnsavedChanges(sectionEditSnapshots, sectionId, editProfile);

    return (
      <EditableProfileSection
        styles={styles}
        title={title}
        icon={icon}
        canEdit={canEdit}
        collapsible={collapsible}
        isOpen={isOpen}
        isEditing={isEditingThis}
        isDirty={isSectionDirty}
        isLoading={loading}
        onToggle={() => toggleSection(sectionId)}
        onHeaderKeyDown={(e) => handleSectionHeaderKeyDown(e, sectionId)}
        onBeginEdit={() => {
          beginSectionEdit(sectionId);
          if (collapsible && !isOpen) toggleSection(sectionId);
        }}
        onSave={() => handleSaveSection(title)}
        onCancel={cancelSectionEdit}
      >
        {children}
      </EditableProfileSection>
    );
  };

  const handleSocialChange = (
    field: "website" | "linkedin" | "instagram" | "facebook",
    value: string,
  ) => {
    setEditProfile((prev) => updateSocialFieldValue(prev, field, value));
  };

  const createQuoteFromMission = useCallback(async () => {
    if (!selectedMissionQuoteId) return;
    try {
      setMissionQuoteBusy(true);
      setMissionQuoteFeedback("");
      const quoteNumber = await createQuoteFromMissionRequest(selectedMissionQuoteId);
      setMissionQuoteFeedback(`${quoteNumber} genere. Onglet Tarifs mis a jour.`);
      handleTabChange("tarifs");
    } catch (error) {
      setMissionQuoteFeedback(
        error instanceof Error ? error.message : "Erreur creation devis",
      );
    } finally {
      setMissionQuoteBusy(false);
    }
  }, [handleTabChange, selectedMissionQuoteId]);

  const activeTabContent = (
    <ConciergeProfileActiveTabContent
      activeTab={activeTab}
      styles={styles}
      profile={profile}
      editProfile={editProfile}
      editingSection={editingSection}
      avatarFile={avatarFile}
      defaultAvatar={DEFAULT_AVATAR}
      sectionIds={{
        INFO_PERSO: SECTION_IDS.INFO_PERSO,
        PRESENTATION: SECTION_IDS.PRESENTATION,
      }}
      missionSectionIds={MISSION_SECTION_IDS}
      tariffSectionIds={TARIFF_SECTION_IDS}
      renderSection={renderSection}
      renderField={renderField}
      formatExperienceLabel={formatExperienceLabel}
      setAvatarFile={setAvatarFile}
      setEditProfile={setEditProfile}
      handleSaveSection={handleSaveSection}
      beginSectionEdit={beginSectionEdit}
      handleSocialChange={handleSocialChange}
      errors={errors}
      missionProgressPercent={missionProgressPercent}
      missionProgressDoneCount={missionProgressDoneCount}
      missionProgressSteps={missionProgressSteps}
      showPendingMissionStepsOnly={showPendingMissionStepsOnly}
      setShowPendingMissionStepsOnly={setShowPendingMissionStepsOnly}
      activeMissionRawLabels={activeMissionRawLabels}
      recognizedActiveMissionCount={recognizedActiveMissionCount}
      unrecognizedActiveMissionLabels={unrecognizedActiveMissionLabels}
      missionOpenDaysCount={missionOpenDaysCount}
      missionRangesCount={missionRangesCount}
      missionAvailability={missionAvailability}
      openMissionSectionForEdit={openMissionSectionForEdit}
      selectedMissionQuoteId={selectedMissionQuoteId}
      setSelectedMissionQuoteId={setSelectedMissionQuoteId}
      missionRows={missionRows}
      missionQuoteBusy={missionQuoteBusy}
      createQuoteFromMission={createQuoteFromMission}
      missionQuoteFeedback={missionQuoteFeedback}
      missionPayload={missionPayload}
      removeUnrecognizedServices={removeUnrecognizedServices}
      catalogSyncBusy={catalogSyncBusy}
      parseAvailabilityPayloadRaw={parseAvailabilityPayloadRaw}
      parseMissionPayload={parseMissionPayload}
      buildLegacyFromMissionProfile={buildLegacyFromMissionProfile}
      toMissionTypeId={toMissionTypeId}
      normalizeMissionSchedule={normalizeMissionSchedule}
      activeMissionServiceCatalogIds={activeMissionServiceCatalogIds}
      activeMissionServiceLabels={activeMissionServiceLabels}
      pricingMeta={pricingMeta}
      pricingV2={pricingV2}
      configuredPricingCount={configuredPricingCount}
      tariffReadinessPercent={tariffReadinessPercent}
      pendingTariffReadinessChecks={pendingTariffReadinessChecks}
      scrollToTariffSection={scrollToTariffSection}
      handleTabChange={handleTabChange}
      tariffLocationLabel={tariffLocationLabel}
      applyPricingMeta={applyPricingMeta}
      pricingCatalogRows={pricingCatalogRows}
      applyPricingV2={applyPricingV2}
      pricingSortMode={pricingSortMode}
      setPricingSortMode={setPricingSortMode}
      showAllPricingServices={showAllPricingServices}
      setShowAllPricingServices={setShowAllPricingServices}
      canEditTariffConfig={canEditTariffConfig}
      servicePrices={servicePrices}
      servicePricesBusyId={servicePricesBusyId}
      servicePricesLoading={servicePricesLoading}
      visiblePricingCatalogRows={visiblePricingCatalogRows}
      groupedPricingCatalogRows={groupedPricingCatalogRows}
      collapsedPricingCategories={collapsedPricingCategories}
      togglePricingCategory={togglePricingCategory}
      openCreatePricingModal={openCreatePricingModal}
      openEditPricingModal={openEditPricingModal}
      deleteServicePrice={deleteServicePrice}
      resetAllServicePrices={resetAllServicePrices}
      propertyTypeOptions={PROPERTY_TYPE_OPTIONS}
      getPropertyTypeDeltaPercent={getPropertyTypeDeltaPercent}
      updatePropertyTypeDeltaPercent={updatePropertyTypeDeltaPercent}
      segmentDraft={segmentDraft}
      setSegmentDraft={setSegmentDraft}
      segmentsBusyId={segmentsBusyId}
      createPricingSegment={createPricingSegment}
      segmentsLoading={segmentsLoading}
      pricingSegments={pricingSegments}
      setPricingSegments={setPricingSegments}
      updatePricingSegment={updatePricingSegment}
      deletePricingSegment={deletePricingSegment}
      propertyRuleDraft={propertyRuleDraft}
      setPropertyRuleDraft={setPropertyRuleDraft}
      propertyRulesBusyId={propertyRulesBusyId}
      createPricingPropertyRule={createPricingPropertyRule}
      propertyRulesLoading={propertyRulesLoading}
      propertyRules={propertyRules}
      setPropertyRules={setPropertyRules}
      updatePricingPropertyRule={updatePricingPropertyRule}
      deletePricingPropertyRule={deletePricingPropertyRule}
      catalogServices={catalogServices}
      strategySim={strategySim}
      setStrategySim={setStrategySim}
      applyStrategyProjectionToBillingDesk={applyStrategyProjectionToBillingDesk}
      scenarioDraftName={scenarioDraftName}
      setScenarioDraftName={setScenarioDraftName}
      scenariosBusyId={scenariosBusyId}
      createPricingScenario={createPricingScenario}
      resetStrategySim={() => setStrategySim(DEFAULT_STRATEGY_SIM)}
      scenariosLoading={scenariosLoading}
      pricingScenarios={pricingScenarios}
      loadPricingScenario={loadPricingScenario}
      setDefaultPricingScenario={setDefaultPricingScenario}
      deletePricingScenario={deletePricingScenario}
      selectedPricingSegment={selectedPricingSegment}
      strategyProjection={strategyProjection}
      formatCurrency={formatCurrency}
      pricingModalOpen={pricingModalOpen}
      pricingModalState={pricingModalState}
      pricingModalSaving={pricingModalSaving}
      pricingModalError={pricingModalError}
      pricingUnitOptions={PRICING_UNIT_OPTIONS}
      closePricingModal={closePricingModal}
      saveServicePrice={saveServicePrice}
      resetPricingModalToDefaults={resetPricingModalToDefaults}
      setPricingModalState={setPricingModalState}
      billingDeskProps={billingDeskProps}
    />
  );

  if (errorMsg && !profile) {
    return <div className={styles.errorMsg}>{errorMsg}</div>;
  }

  if (!profile || !editProfile) {
    return <div className={styles.loading}>Chargement du profil...</div>;
  }

  return (
    <ConciergeProfileShell
      styles={styles}
      title="Espace Concierge"
      successMsg={successMsg}
      errorMsg={errorMsg}
      tabs={CONCIERGE_TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      activeTabContent={activeTabContent}
    />
  );
}










