import type {
  ConciergeMissionProfile,
  MissionAvailability,
  MissionCatalogItem,
  MissionPreferences,
  WeekDay,
} from "@/app/components/missions/types";
import type { PricingV2Config, SeasonalPricingConfig } from "@/app/components/tariffs/types";
import type { ConciergeProfile as Profile } from "@/features/concierge-profile";

export interface StrategySimState {
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

export interface PricingMetaConfig {
  commissionRatePct: number;
  setupFee: number;
}

export const DEFAULT_STRATEGY_SIM: StrategySimState = {
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

export const normalizeStrategySim = (value: unknown): StrategySimState => {
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

const DEFAULT_MISSION_CENTER = { lat: 48.8566, lng: 2.3522 };

export const DEFAULT_MISSION_CATALOG: MissionCatalogItem[] = [
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

export const toMissionTypeId = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const defaultMissionPreferences = (): MissionPreferences => ({
  acceptedMissionTypeIds: [],
  priorityFlags: {
    urgent: true,
    recurrent: false,
    premium: false,
  },
});

export const buildDefaultMissionProfile = (
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

export const buildLegacyFromMissionProfile = (missionProfile: {
  missions: ConciergeMissionProfile["missions"];
  positioning?: ConciergeMissionProfile["positioning"];
}) => {
  const missionCatalog: MissionCatalogItem[] = missionProfile.missions.map((mission) => ({
    id: mission.id,
    label: mission.label,
    basePrice: null,
    customizable: false,
  }));

  const preferences: MissionPreferences = {
    acceptedMissionTypeIds: missionProfile.missions
      .filter((mission) => mission.isActive)
      .map((mission) => mission.id),
    priorityFlags: {
      urgent: missionProfile.missions.some((mission) => mission.isActive && mission.allowUrgent),
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

export const normalizeMissionSchedule = (
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
  }).filter((item): item is MissionAvailability["schedule"][number] => item !== null);

export const parseAvailabilityPayloadRaw = (value?: string | null): Record<string, unknown> => {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return { schedule: parsed };
    }
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

export const parseSeasonalPricing = (value?: string | null): SeasonalPricingConfig => {
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
    cleaningTwoRoomsFee: readNumber("cleaningTwoRoomsFee", defaults.cleaningTwoRoomsFee),
    linenKitFee: readNumber("linenKitFee", defaults.linenKitFee),
    welcomePackFee: readNumber("welcomePackFee", defaults.welcomePackFee),
    urgentPercent: readNumber("urgentPercent", defaults.urgentPercent),
    nightPercent: readNumber("nightPercent", defaults.nightPercent),
    weekendPercent: readNumber("weekendPercent", defaults.weekendPercent),
    highSeasonPercent: readNumber("highSeasonPercent", defaults.highSeasonPercent),
    extraKmFee: readNumber("extraKmFee", defaults.extraKmFee),
    minimumInvoice: readNumber("minimumInvoice", defaults.minimumInvoice),
  };
};

export const parsePricingMeta = (value?: string | null): PricingMetaConfig => {
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

export const syncSeasonalPricingFromPricingV2 = (
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

export const parseMissionPayload = (
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
        typeof rawPriorityFlags?.urgent === "boolean" ? rawPriorityFlags.urgent : true,
      recurrent:
        typeof rawPriorityFlags?.recurrent === "boolean" ? rawPriorityFlags.recurrent : false,
      premium:
        typeof rawPriorityFlags?.premium === "boolean" ? rawPriorityFlags.premium : false,
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
              basePrice: typeof obj.basePrice === "number" ? obj.basePrice : null,
              customizable:
                typeof obj.customizable === "boolean" ? obj.customizable : true,
            } as MissionCatalogItem;
          })
          .filter((item: MissionCatalogItem | null): item is MissionCatalogItem => Boolean(item))
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

    const acceptedFromPreferences = Array.isArray(parsed?.preferences?.acceptedMissionTypeIds)
      ? parsed.preferences.acceptedMissionTypeIds.filter(
          (item: unknown): item is string => typeof item === "string",
        )
      : [];

    const acceptedFromLegacyLabels = Array.isArray(parsed?.missionTypes)
      ? parsed.missionTypes
          .filter((item: unknown): item is string => typeof item === "string")
          .map((label: string) => {
            const byLabel = missionCatalog.find((item: MissionCatalogItem) => item.label === label);
            return byLabel?.id ?? toMissionTypeId(label);
          })
      : [];

    const acceptedMissionTypeIds = (
      acceptedFromPreferences.length > 0
        ? acceptedFromPreferences
        : acceptedFromLegacyLabels
    ).filter((id: string) => missionCatalog.some((item: MissionCatalogItem) => item.id === id));

    const rawMissionProfile = parsed?.missionProfile;
    const missionProfileFromPayload =
      rawMissionProfile && typeof rawMissionProfile === "object"
        ? (rawMissionProfile as Record<string, unknown>)
        : null;
    const specialConditionsPayload =
      missionProfileFromPayload?.specialConditions &&
      typeof missionProfileFromPayload.specialConditions === "object"
        ? (missionProfileFromPayload.specialConditions as Record<string, unknown>)
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
                  const item = mission as Record<string, unknown>;
                  const id = typeof item.id === "string" ? item.id : "";
                  const label = typeof item.label === "string" ? item.label : "";
                  if (!id || !label) return null;
                  return {
                    id,
                    label,
                    isActive: typeof item.isActive === "boolean" ? item.isActive : false,
                    minNoticeHours:
                      typeof item.minNoticeHours === "number" ? item.minNoticeHours : 24,
                    allowUrgent:
                      typeof item.allowUrgent === "boolean" ? item.allowUrgent : false,
                    urgentMultiplier:
                      typeof item.urgentMultiplier === "number" ? item.urgentMultiplier : 1.3,
                  };
                })
                .filter(Boolean) as ConciergeMissionProfile["missions"]
            : buildDefaultMissionProfile(missionCatalog).missions,
          specialConditions: {
            acceptNightInterventions:
              typeof specialConditionsPayload?.acceptNightInterventions === "boolean"
                ? specialConditionsPayload.acceptNightInterventions
                : false,
            acceptWeekendInterventions:
              typeof specialConditionsPayload?.acceptWeekendInterventions === "boolean"
                ? specialConditionsPayload.acceptWeekendInterventions
                : false,
            acceptHighSeasonInterventions:
              typeof specialConditionsPayload?.acceptHighSeasonInterventions === "boolean"
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

const formatFrenchOrdinal = (value: number) => (value === 1 ? "1er" : `${value}e`);

const deriveArrondissementLabel = (
  baseLocation: string | null | undefined,
  city: string | null | undefined,
  postalCode: string | null | undefined,
) => {
  const normalizedBase = (baseLocation ?? city ?? "").trim();
  const normalizedCity = (city ?? baseLocation ?? "").trim().toLowerCase();
  const digits = (postalCode ?? "").replace(/\D/g, "");

  if (digits.length !== 5) {
    return normalizedBase;
  }

  if (normalizedCity.includes("paris") && digits.startsWith("75")) {
    const arrondissement = Number(digits.slice(3, 5));
    if (arrondissement >= 1 && arrondissement <= 20) {
      return `Paris ${formatFrenchOrdinal(arrondissement)}`;
    }
  }

  if (normalizedCity.includes("lyon") && digits.startsWith("69")) {
    const arrondissement = Number(digits.slice(3, 5));
    if (arrondissement >= 1 && arrondissement <= 9) {
      return `Lyon ${formatFrenchOrdinal(arrondissement)}`;
    }
  }

  if (normalizedCity.includes("marseille") && digits.startsWith("13")) {
    const arrondissement = Number(digits.slice(3, 5));
    if (arrondissement >= 1 && arrondissement <= 16) {
      return `Marseille ${formatFrenchOrdinal(arrondissement)}`;
    }
  }

  return normalizedBase;
};

export const buildMissionAvailabilityFromProfile = (
  profile: Profile | null,
): MissionAvailability | null => {
  if (!profile) return null;
  const missionPayload = parseMissionPayload(profile.availability_hours);
  const availabilityRaw = parseAvailabilityPayloadRaw(profile.availability_hours);
  const persistedZones: MissionAvailability["zones"] = Array.isArray(availabilityRaw.zones)
    ? availabilityRaw.zones
        .map((zone, index): MissionAvailability["zones"][number] | null => {
          if (!zone || typeof zone !== "object") return null;
          const candidate = zone as Record<string, unknown>;
          const label = typeof candidate.label === "string" ? candidate.label.trim() : "";
          const lat =
            typeof candidate.lat === "number" && Number.isFinite(candidate.lat)
              ? candidate.lat
              : null;
          const lng =
            typeof candidate.lng === "number" && Number.isFinite(candidate.lng)
              ? candidate.lng
              : null;

          if (!label || lat == null || lng == null) {
            return null;
          }

          return {
            placeId:
              typeof candidate.placeId === "string" && candidate.placeId.trim()
                ? candidate.placeId.trim()
                : `zone-${index}-${label}`,
            label,
            lat,
            lng,
            postcode:
              typeof candidate.postcode === "string" && candidate.postcode.trim()
                ? candidate.postcode.trim()
                : null,
          };
        })
        .filter((zone): zone is MissionAvailability["zones"][number] => zone !== null)
    : [];

  if (persistedZones.length > 0) {
    return {
      zones: persistedZones.slice(0, 1).map((zone): MissionAvailability["zones"][number] => ({
        ...zone,
        label: deriveArrondissementLabel(zone.label, profile.city, profile.postal_code),
      })),
      radiusKm: profile.service_radius_km ?? 30,
      schedule: missionPayload.schedule,
      emergency24h: Boolean(profile.emergency_service),
      rules: missionPayload.rules,
    };
  }

  const primaryLabel = deriveArrondissementLabel(
    (profile.location ?? profile.service_area ?? "")
      .split(",")
      .map((segment) => segment.trim())
      .filter(Boolean)[0] ?? null,
    profile.city,
    profile.postal_code,
  );

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
