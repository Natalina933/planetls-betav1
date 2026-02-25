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
import Link from "next/link";

import styles from "./ConciergeProfilePage.module.scss";

import InputWithValidation from "@/app/components/ui/InputWithValidation/InputWithValidation";
import {
  CONCIERGE_TABS,
  ConciergeTabId,
} from "@/app/components/dashboard/concierge/conciergeTabsConfig";
import ProfileSummary from "@/app/components/dashboard/concierge/ProfileSummary/ProfileSummary";
import MissionDetails from "@/app/components/dashboard/concierge/MissionDetails/MissionDetails";
import SocialLinksManager from "@/app/components/dashboard/SocialLinksManager/SocialLinksManager";
import MissionZoneAvailability from "@/app/components/missions/MissionZoneAvailability";
import MissionProfileModule from "@/app/components/missions/MissionProfileModule";
import AvailabilityEditor from "@/app/components/missions/AvailabilityEditor";
import ServicePackageManager from "@/app/components/dashboard/concierge/ServicePackageManager/ServicePackageManager";
import TariffServicePackages from "@/app/components/tariffs/TariffServicePackages";
import TariffAdjustments from "@/app/components/tariffs/TariffAdjustments";
import TariffRevenueEstimator from "@/app/components/tariffs/TariffRevenueEstimator";
import TariffBillingDesk from "@/app/components/tariffs/TariffBillingDesk";
import PricingGridManager from "@/app/components/dashboard/concierge/PricingGridManager/PricingGridManager";
import type {
  ConciergeMissionProfile,
  MissionAvailability,
  MissionCatalogItem,
  MissionPreferences,
  WeekDay,
} from "@/app/components/missions/types";
import type { SeasonalPricingConfig } from "@/app/components/tariffs/types";
import { ProfileIdentity } from "@/app/components/dashboard/concierge/ProfileSummary/profileIdentity";

import {
  FiBarChart,
  FiBriefcase,
  FiMapPin as FiMapPinOutline,
  FiShield as FiShieldOutline,
  FiGlobe,
  FiTarget,
  FiClock as FiClockOutline,
  FiDollarSign as FiDollarSignOutline,
  FiUsers,
  FiFile,
  FiStar as FiStarOutline,
  FiCheckCircle as FiCheckCircleOutline,
  FiTrendingUp,
} from "react-icons/fi";
import {
  User as LucideUser,
  Shield,
  DollarSign,
  ChevronDown,
  Save,
  X as LucideX,
  Edit2,
  Star,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

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
  BASE: normalizeSectionId("Tarifs de base"),
  BILLING: normalizeSectionId("Paramètres de facturation"),
} as const;

const MISSION_SECTION_IDS = {
  SERVICES: normalizeSectionId("Services proposés"),
  ZONE_RULES: normalizeSectionId("Zone, disponibilités & règles de mission"),
  WEEKLY_AVAILABILITY: normalizeSectionId("Disponibilités hebdomadaires"),
  ACCEPTANCE_RULES: normalizeSectionId("Règles d'acceptation des missions"),
  PRIORITY_TYPES: normalizeSectionId("Priorité & typologie des missions"),
} as const;

const SECTION_HEADER_BADGES: Record<string, string> = {
  "Devis rapides depuis mission": "Automatisation",
  "Priorité & typologie des missions": "Pilotage",
  "Présentation": "Identité",
  "Résumé du profil": "Synthèse",
  "Informations personnelles": "Essentiel",
  "Informations entreprise": "Entreprise",
  "Adresse professionnelle": "Localisation",
  "Assurance & Certifications": "Confiance",
  "Web & Réseaux sociaux": "Visibilité",
  "Services proposés": "Offre",
  "Zone d'intervention & règles de mission": "Couverture",
  "Disponibilités hebdomadaires": "Planning",
  "Mes packs de services": "Monétisation",
  "Parcours devis & facturation": "Workflow",
  "Tarifs de base": "Tarification",
  "Paramètres de facturation": "Finance",
  "Grille tarifaire détaillée": "Détail",
  "Devis et factures opérationnels": "Opérations",
  "Prévision de revenus": "Prévision",
  "Mon équipe": "Ressources",
  "Zones d'intervention": "Territoire",
  "Documents professionnels": "Conformité",
  "Avis clients": "Réputation",
};

type ExtendedFieldName =
  | keyof Profile
  | "service_area"
  | "service_radius_km";

interface CatalogServiceItem {
  id: number;
  category: string;
  service: string;
}

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
  { id: "menage", label: "Menage", basePrice: null, customizable: false },
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

  const labels = (profile.service_area ?? profile.location ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

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
  const [sectionEditSnapshots, setSectionEditSnapshots] = useState<
    Record<string, string>
  >({});
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
  const activeMissionServiceLabels = useMemo(
    () =>
      Array.from(
        new Set(
          missionPayload.missionProfile.missions
            .filter((mission) => mission.isActive)
            .map((mission) => mission.label),
        ),
      ),
    [missionPayload.missionProfile.missions],
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
      {
        key: "priority",
        label: "Priorites de mission",
        hint: "Ajustez votre positionnement et vos regles.",
        done:
          missionPayload.missionProfile.positioning !== "standard" ||
          missionPayload.missionProfile.specialConditions.acceptNightInterventions ||
          missionPayload.missionProfile.specialConditions.acceptWeekendInterventions ||
          missionPayload.missionProfile.specialConditions.acceptHighSeasonInterventions,
        sectionId: MISSION_SECTION_IDS.PRIORITY_TYPES,
      },
    ],
    [
      activeMissionServiceLabels.length,
      missionAvailability,
      missionOpenDaysCount,
      missionPayload.missionProfile.positioning,
      missionPayload.missionProfile.specialConditions.acceptHighSeasonInterventions,
      missionPayload.missionProfile.specialConditions.acceptNightInterventions,
      missionPayload.missionProfile.specialConditions.acceptWeekendInterventions,
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
        ready: Boolean((editProfile?.service_area ?? editProfile?.location ?? "").trim()),
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
  const scrollToTariffSection = useCallback((sectionId: string) => {
    const target = document.getElementById(sectionId);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

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

    const fetchServicesCatalog = async () => {
      try {
        const response = await fetch("/api/services/services-catalog");
        if (!response.ok) return;
        const data = (await response.json()) as CatalogServiceItem[];
        if (!isMounted) return;
        setCatalogServices(Array.isArray(data) ? data : []);
      } catch {
        if (!isMounted) return;
        setCatalogServices([]);
      }
    };

    fetchServicesCatalog();

    return () => {
      isMounted = false;
    };
  }, []);


  const hasUnsavedChanges = (sectionId: string | null): boolean => {
    if (!sectionId || !editProfile) return false;
    const snapshot = sectionEditSnapshots[sectionId];
    if (typeof snapshot !== "string") return false;
    return snapshot !== JSON.stringify(editProfile);
  };

  const confirmDiscardIfNeeded = (sectionId: string | null): boolean => {
    if (!hasUnsavedChanges(sectionId)) return true;
    return window.confirm(
      "Vous avez des modifications non enregistrées. Voulez-vous quitter sans sauvegarder ?",
    );
  };

  const handleTabChange = (tabId: TabId) => {
    if (tabId === activeTab) return;
    if (!confirmDiscardIfNeeded(editingSection)) return;

    if (editingSection) {
      setSectionEditSnapshots((prev) => {
        const next = { ...prev };
        delete next[editingSection];
        return next;
      });
      setEditingSection(null);
      setEditProfile(profile);
      setErrors({});
      setAvatarFile(null);
    }

    setActiveTab(tabId);
    router.push(`?tab=${tabId}`, { scroll: false });
  };

  const applySeasonalPricing = useCallback((next: SeasonalPricingConfig) => {
    setEditProfile((prev) =>
      prev
        ? {
            ...prev,
            availability_hours: JSON.stringify({
              ...parseAvailabilityPayloadRaw(prev.availability_hours),
              pricing: next,
            }),
          }
        : prev,
    );
  }, []);


  const validateField = (name: string, value: string): string => {
    if (!value) return "";

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
  };

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

    setEditProfile((prev) => (prev ? { ...prev, [name]: value } : prev));

    const errorMessage = validateField(name, value);
    setErrors((prevErrors) => ({ ...prevErrors, [name]: errorMessage }));
  };

  const handleAvatarUpload = async (file: File): Promise<string | null> => {
    if (!editProfile) return null;
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", editProfile.id);

      const response = await fetch("/api/profiles/avatar", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      return result.url as string;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur d'upload";
      console.error(
        "[ConciergeProfilePage] Erreur upload avatar:",
        errorMessage,
      );
      throw error;
    }
  };

  const handleSaveSection = async (sectionTitle: string) => {
    if (!editProfile) return;

    const hasErrors = Object.values(errors).some((error) => error !== "");
    if (hasErrors) {
      alert("âš ï¸ Veuillez corriger les erreurs avant de sauvegarder.");
      return;
    }

    setLoading(true);
    let avatarUrl = editProfile.avatar_url;
    const onboardingReady =
      missionProgressSteps.length > 0 &&
      missionProgressSteps.every((step) => step.done);
    const shouldMarkOnboardingComplete =
      activeTab === "missions" &&
      onboardingReady &&
      editProfile.onboarding_complete !== true;

    try {
      if (avatarFile && sectionTitle === "Photo de profil") {
        avatarUrl = await handleAvatarUpload(avatarFile);
      }

      const response = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editProfile,
          avatar_url: avatarUrl,
          ...(shouldMarkOnboardingComplete ? { onboarding_complete: true } : {}),
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Erreur lors de la sauvegarde");
      }

      const updatedProfile: Profile = result;
      const savedSectionId = editingSection ?? normalizeSectionId(sectionTitle);
      setProfile(updatedProfile);
      setEditProfile(updatedProfile);
      setEditingSection(null);
      setSectionEditSnapshots((prev) => {
        const next = { ...prev };
        delete next[savedSectionId];
        return next;
      });
      setAvatarFile(null);

      setSuccessMsg(`✅ ${sectionTitle} mis à jour avec succès`);

      await update({
        user: {
          image: avatarUrl,              // CHAMP CLE NEXTAUTH
          avatar_url: avatarUrl,         // champ custom (OK)
          name: `${editProfile.first_name} ${editProfile.last_name}`.trim(),
          firstName: editProfile.first_name,
          lastName: editProfile.last_name,
        },
      });
      window.dispatchEvent(new Event("user-profile-updated"));

      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error("[ConciergeProfilePage] Erreur sauvegarde:", errorMessage);
      setErrorMsg(errorMessage);
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const beginSectionEdit = (sectionId: string) => {
    if (editingSection && editingSection !== sectionId) {
      if (!confirmDiscardIfNeeded(editingSection)) return;
      setSectionEditSnapshots((prev) => {
        const next = { ...prev };
        delete next[editingSection];
        return next;
      });
    }

    if (editProfile) {
      setSectionEditSnapshots((prev) => ({
        ...prev,
        [sectionId]: JSON.stringify(editProfile),
      }));
    }
    setEditingSection(sectionId);
  };

  const openMissionSectionForEdit = (sectionId: string) => {
    beginSectionEdit(sectionId);
    setOpenSections((prev) => ({ ...prev, [sectionId]: true }));
  };

  const cancelSectionEdit = () => {
    if (!confirmDiscardIfNeeded(editingSection)) return;

    if (editingSection) {
      setSectionEditSnapshots((prev) => {
        const next = { ...prev };
        delete next[editingSection];
        return next;
      });
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
    emptyText: string = "Non renseigné",
  ) => {
    const isThisSectionEditing = editingSection === sectionId;
    const value = (editProfile?.[name as keyof Profile] ??
      "") as string | number | null;
    const error = errors[name as string];

    if (type === "checkbox") {
      return (
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>
            <input
              type="checkbox"
              name={name.toString()}
              checked={!!value}
              onChange={handleChange}
              disabled={!isThisSectionEditing}
              className={styles.checkbox}
            />
            {label}
          </label>
        </div>
      );
    }

    return (
      <div className={styles.fieldRow}>
        <label htmlFor={name.toString()} className={styles.fieldLabel}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
        {isThisSectionEditing ? (
          isTextarea ? (
            <textarea
              id={name.toString()}
              name={name.toString()}
              value={(value ?? "") as string}
              onChange={handleChange}
              className={styles.fieldTextarea}
              placeholder={placeholder || label}
              rows={3}
            />
          ) : (
            <InputWithValidation
              id={name.toString()}
              name={name.toString()}
              type={type}
              value={(value ?? "") as string}
              onChange={handleChange}
              placeholder={placeholder || label}
              error={error || ""}
              isValid={!error && !!value}
              {...inputProps}
            />
          )
        ) : (
          <span className={styles.fieldValue}>
            {value !== null && value !== "" ? value : emptyText}
          </span>
        )}
      </div>
    );
  };

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    children: React.ReactNode,
    canEdit: boolean = true,
    sectionIdOverride?: string,
    collapsible: boolean = true,
    headerBadge?: string,
    headerSubtitle?: string,
  ) => {
    const sectionId = sectionIdOverride ?? normalizeSectionId(title);
    const resolvedHeaderBadge = headerBadge ?? SECTION_HEADER_BADGES[title] ?? "Section";
    const isOpen = collapsible ? (openSections[sectionId] ?? true) : true;
    const isEditingThis = editingSection === sectionId;
    const sectionSnapshot = sectionEditSnapshots[sectionId];
    const isSectionDirty =
      isEditingThis &&
      typeof sectionSnapshot === "string" &&
      Boolean(editProfile) &&
      sectionSnapshot !== JSON.stringify(editProfile);
    const renderEditActions = () => (
      <>
        <button
          onClick={() => handleSaveSection(title)}
          className={styles.saveBtn}
          disabled={loading}
          title="Sauvegarder"
          aria-label="Sauvegarder"
        >
          {loading ? <div className={styles.spinnerMini} /> : <Save size={16} />}
        </button>
        <button
          onClick={cancelSectionEdit}
          className={styles.cancelBtn}
          title="Annuler"
          aria-label="Annuler"
        >
          <LucideX size={16} />
        </button>
      </>
    );

    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          {collapsible ? (
            <div
              className={styles.sectionTitleWrapper}
              onClick={() => toggleSection(sectionId)}
              onKeyDown={(e) => handleSectionHeaderKeyDown(e, sectionId)}
              role="button"
              tabIndex={0}
            >
              <div className={styles.sectionTitleLeft}>
                <span className={styles.sectionIcon}>{icon}</span>
                <div>
                  <div className={styles.sectionTitleRow}>
                    <h2 className={styles.sectionTitle}>{title}</h2>
                    {resolvedHeaderBadge && <span className={styles.sectionChip}>{resolvedHeaderBadge}</span>}
                  </div>
                  {headerSubtitle && (
                    <p className={styles.sectionSubtitle}>{headerSubtitle}</p>
                  )}
                </div>
              </div>
              <ChevronDown
                size={16}
                className={`${styles.toggleIcon} ${isOpen ? styles.toggleIconOpen : ""
                  }`}
              />
            </div>
          ) : (
            <div className={styles.sectionTitleWrapper}>
              <div className={styles.sectionTitleLeft}>
                <span className={styles.sectionIcon}>{icon}</span>
                <div>
                  <div className={styles.sectionTitleRow}>
                    <h2 className={styles.sectionTitle}>{title}</h2>
                    {resolvedHeaderBadge && <span className={styles.sectionChip}>{resolvedHeaderBadge}</span>}
                  </div>
                  {headerSubtitle && (
                    <p className={styles.sectionSubtitle}>{headerSubtitle}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {canEdit && (
            <div className={styles.sectionActions}>
              {isEditingThis ? (
                renderEditActions()
              ) : (
                <button
                  onClick={() => {
                    beginSectionEdit(sectionId);
                    if (collapsible && !isOpen) toggleSection(sectionId);
                  }}
                  className={styles.editBtn}
                  title="Modifier"
                  aria-label="Modifier"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>
          )}
        </div>
        {canEdit && isEditingThis && isSectionDirty && (
          <div className={styles.unsavedBadge} role="status">
            Modifications non enregistrées
          </div>
        )}

        <div
          className={`${styles.sectionContent} ${isOpen ? styles.sectionContentOpen : ""
            }`}
        >
          {children}
          {canEdit && isEditingThis && isOpen && (
            <div className={styles.sectionActionsBottom}>{renderEditActions()}</div>
          )}
        </div>
      </div>
    );
  };

  const handleSocialChange = (
    field: "website" | "linkedin" | "instagram" | "facebook",
    value: string,
  ) => {
    setEditProfile((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const renderMissionProgressPanel = () => (
    <div className={styles.missionProgressPanel}>
      <div className={styles.missionProgressHeader}>
        <h4>Parcours de configuration</h4>
        <span>
          {missionProgressDoneCount}/
          {missionProgressSteps.length} completes
        </span>
      </div>
      <div className={styles.missionProgressFilters}>
        <button
          type="button"
          className={`${styles.missionProgressFilterBtn} ${
            !showPendingMissionStepsOnly ? styles.missionProgressFilterBtnActive : ""
          }`}
          onClick={() => setShowPendingMissionStepsOnly(false)}
        >
          Tout
        </button>
        <button
          type="button"
          className={`${styles.missionProgressFilterBtn} ${
            showPendingMissionStepsOnly ? styles.missionProgressFilterBtnActive : ""
          }`}
          onClick={() => setShowPendingMissionStepsOnly(true)}
        >
          A configurer
        </button>
      </div>
      <div className={styles.missionProgressList}>
        {(showPendingMissionStepsOnly
          ? missionProgressSteps.filter((step) => !step.done)
          : missionProgressSteps
        ).map((step, index) => (
          <div
            key={step.key}
            className={`${styles.missionProgressItem} ${
              step.done ? styles.missionProgressItemDone : ""
            }`}
          >
            <div className={styles.missionProgressIndex}>
              {step.done ? <FiCheckCircleOutline /> : index + 1}
            </div>
            <div className={styles.missionProgressBody}>
              <p className={styles.missionProgressLabel}>{step.label}</p>
              <p className={styles.missionProgressHint}>{step.hint}</p>
            </div>
            {step.sectionId && (
              <button
                type="button"
                className={styles.missionProgressAction}
                onClick={() => openMissionSectionForEdit(step.sectionId)}
              >
                {step.done ? "Modifier" : "Configurer"}
              </button>
            )}
          </div>
        ))}
      </div>
      {showPendingMissionStepsOnly &&
        missionProgressSteps.every((step) => step.done) && (
          <p className={styles.missionProgressEmpty}>
            Tout est configure. Vous pouvez maintenant affiner les reglages.
          </p>
        )}
    </div>
  );

  const renderMissionsStaticSections = () => (
    <>

      {renderSection(
        "Devis rapides depuis mission",
        <FiFile />,
        <>
          <div className={styles.missionToolbar}>
            <div className={styles.missionToolbarItem}>
              <span>Mission source</span>
              <select
                value={selectedMissionQuoteId}
                onChange={(e) => setSelectedMissionQuoteId(e.target.value)}
                disabled={missionRows.length === 0 || missionQuoteBusy}
              >
                {missionRows.length === 0 && <option value="">Aucune mission disponible</option>}
                {missionRows.map((mission) => (
                  <option key={mission.id} value={mission.id}>
                    {mission.title} - {mission.status}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.missionToolbarItem}>
              <span>Action</span>
              <button
                type="button"
                className={styles.missionDetailButton}
                disabled={!selectedMissionQuoteId || missionQuoteBusy}
                onClick={async () => {
                  if (!selectedMissionQuoteId) return;
                  try {
                    setMissionQuoteBusy(true);
                    setMissionQuoteFeedback("");
                    const response = await fetch("/api/quotes/from-mission", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ mission_id: selectedMissionQuoteId }),
                    });
                    const result = await response.json();
                    if (!response.ok) {
                      throw new Error(
                        typeof result?.error === "string"
                          ? result.error
                          : "Erreur creation devis depuis mission",
                      );
                    }

                    const quoteNumber =
                      typeof result?.quote_number === "string"
                        ? result.quote_number
                        : "devis cree";

                    setMissionQuoteFeedback(`${quoteNumber} genere. Onglet Tarifs mis a jour.`);
                    handleTabChange("tarifs");
                  } catch (error) {
                    setMissionQuoteFeedback(
                      error instanceof Error ? error.message : "Erreur creation devis",
                    );
                  } finally {
                    setMissionQuoteBusy(false);
                  }
                }}
              >
                {missionQuoteBusy ? "Generation..." : "Creer devis"}
              </button>
            </div>
          </div>
          <p className={styles.missionProgressHint}>
            Transformez une mission en devis brouillon sans ressaisie.
          </p>
          {missionQuoteFeedback && (
            <p className={styles.missionProgressHint}>{missionQuoteFeedback}</p>
          )}
        </>,
        false,
        undefined,
        false,
      )}

      {renderSection(
        "Priorité & typologie des missions",
        <FiStarOutline />,
        <>
          <MissionProfileModule
            value={missionPayload.missionProfile}
            isEditing={editingSection === MISSION_SECTION_IDS.PRIORITY_TYPES}
            onChange={(next) =>
              setEditProfile((prev) =>
                prev
                  ? (() => {
                      const legacy = buildLegacyFromMissionProfile(next);
                      return {
                        ...prev,
                        availability_hours: JSON.stringify({
                          ...parseAvailabilityPayloadRaw(prev.availability_hours),
                          missionProfile: next,
                          missionCatalog: legacy.missionCatalog,
                          preferences: legacy.preferences,
                        }),
                      };
                    })()
                  : prev,
              )
            }
          />
        </>
      )}
    </>
  );

  const renderTabContent = () => {
    if (!profile || !editProfile) return null;

    switch (activeTab) {
      case "fiche":
        return (
          <div className={styles.grid}>
            <aside className={styles.leftColumn}>
              <div className={styles.profileCard}>
                <div className={styles.avatarWrapper} />

                <div className={styles.profileIdentity}>
                  <ProfileIdentity
                    fullName={`${editProfile.first_name} ${editProfile.last_name}`}
                    roleLabel="Concierge partenaire"
                    email={editProfile.email}
                    phone={editProfile.phone}
                    location={editProfile.location ?? "Ville non renseignée, FR"}
                    isEditing={editingSection === "Photo de profil"}
                    avatarFile={avatarFile}
                    existingAvatarUrl={
                      editProfile.avatar_url ?? DEFAULT_AVATAR
                    }
                    existingScale={editProfile.avatar_scale ?? 1}
                    existingOffsetX={editProfile.avatar_offset_x ?? 0}
                    existingOffsetY={editProfile.avatar_offset_y ?? 0}
                    existingRotation={editProfile.avatar_rotation ?? 0}
                    onAvatarChange={setAvatarFile}
                    onAvatarScaleChange={(scale) =>
                      setEditProfile((prev) =>
                        prev ? { ...prev, avatar_scale: scale } : prev,
                      )
                    }
                    onAvatarOffsetChange={(offsetX, offsetY) =>
                      setEditProfile((prev) =>
                        prev
                          ? {
                            ...prev,
                            avatar_offset_x: offsetX,
                            avatar_offset_y: offsetY,
                          }
                          : prev,
                      )
                    }
                    onAvatarRotationChange={(rotation) =>
                      setEditProfile((prev) =>
                        prev ? { ...prev, avatar_rotation: rotation } : prev,
                      )
                    }
                    onAvatarSave={() => handleSaveSection("Photo de profil")}
                    onAvatarRemove={() => {
                      setAvatarFile(null);
                      setEditProfile((prev) =>
                        prev
                          ? {
                            ...prev,
                            avatar_url: null,
                            avatar_scale: 1,
                            avatar_offset_x: 0,
                            avatar_offset_y: 0,
                            avatar_rotation: 0,
                          }
                          : prev,
                      );
                    }}
                    onEditAvatarClick={() =>
                      beginSectionEdit("Photo de profil")
                    }
                  />

                  <div className={styles.profileStats}>
                    <div className={styles.profileStatItem}>
                      <p className={styles.profileStatLabel}>Note</p>
                      <p className={styles.profileStatValue}>
                        4.9
                        <Star
                          size={14}
                          className={styles.profileStatIconStar}
                        />
                      </p>
                    </div>
                    <div className={styles.profileStatItem}>
                      <p className={styles.profileStatLabel}>Expérience</p>
                      <p className={styles.profileStatValue}>
                        {profile.years_experience != null
                          ? `${profile.years_experience} ans`
                          : "Non renseigné"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.presentationFeatured}>
                {renderSection(
                  "Présentation",
                  <FiTarget />,
                  <>
                    {editingSection === SECTION_IDS.PRESENTATION && (
                      <div className={styles.presentationExample}>
                        <strong>Exemple</strong>
                        <p>
                          Conciergerie locale à Paris, disponible 7j/7, spécialisée
                          en accueil voyageurs, ménage et intendance.
                        </p>
                      </div>
                    )}
                    <div className={styles.presentationField}>
                      {editingSection === SECTION_IDS.PRESENTATION ? (
                        <textarea
                          id="additional_info"
                          name="additional_info"
                          value={editProfile.additional_info ?? ""}
                          onChange={handleChange}
                          className={`${styles.fieldTextarea} ${styles.presentationTextarea}`}
                          placeholder="Décrivez votre zone d’intervention, vos services clés et ce qui vous différencie."
                          rows={5}
                        />
                      ) : (
                        <div
                          className={`${styles.presentationPreviewBox} ${
                            !editProfile.additional_info?.trim()
                              ? styles.presentationPreviewEmpty
                              : ""
                          }`}
                        >
                          {editProfile.additional_info?.trim() ? (
                            editProfile.additional_info
                          ) : (
                            <span className={styles.presentationPlaceholder}>
                              Ajoutez une courte présentation professionnelle
                              pour renforcer la confiance.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </>,
                  true,
                  SECTION_IDS.PRESENTATION,
                  false,
                  undefined,
                  "Affichez votre positionnement et inspirez confiance en quelques lignes claires.",
                )}
              </div>

              <div className={styles.badgeCard}>
                <h4 className={styles.badgeTitle}>
                  <Shield size={16} />
                  <span>Badge Vérifié</span>
                </h4>
                <p className={styles.badgeText}>
                  Votre profil a été certifié par nos équipes. Vous profitez
                  d&apos;une visibilité prioritaire sur les recherches de
                  clients Premium.
                </p>
              </div>

              {renderSection(
                "Résumé du profil",
                <FiBarChart />,
                <ProfileSummary profile={profile} />,
                false,
              )}
            </aside>

            <section className={styles.rightColumn}>
              {renderSection(
                "Informations personnelles",
                <LucideUser />,
                <>
                  <div className={styles.fieldsGrid}>
                    {renderField(
                      "Nom d'utilisateur",
                      "username",
                      SECTION_IDS.INFO_PERSO,
                      false,
                    )}
                    {renderField(
                      "Prénom",
                      "first_name",
                      SECTION_IDS.INFO_PERSO,
                      false,
                    )}
                    {renderField(
                      "Nom",
                      "last_name",
                      SECTION_IDS.INFO_PERSO,
                      false,
                    )}
                    {renderField(
                      "Email",
                      "email",
                      SECTION_IDS.INFO_PERSO,
                      false,
                      true,
                      "email@exemple.com",
                      "email",
                    )}
                    {renderField(
                      "Téléphone",
                      "phone",
                      SECTION_IDS.INFO_PERSO,
                      false,
                      true,
                      "+33 6 12 34 56 78",
                      "tel",
                    )}
                  </div>

                  <div className={styles.fieldRow}>
                    <label
                      htmlFor="experience_level"
                      className={styles.fieldLabel}
                    >
                      Niveau d&apos;expérience
                    </label>
                    {editingSection === SECTION_IDS.INFO_PERSO ? (
                      <select
                        id="experience_level"
                        name="experience_level"
                        value={editProfile.experience_level ?? ""}
                        onChange={(e) => {
                          const value = e.target.value as
                            | ""
                            | "debutant"
                            | "intermediaire"
                            | "experimente";
                          setEditProfile((prev) =>
                            prev
                              ? {
                                ...prev,
                                experience_level:
                                  value === "" ? null : value,
                              }
                              : prev,
                          );
                        }}
                        className={styles.fieldSelect}
                      >
                        <option value="">Sélectionner un niveau</option>
                        <option value="debutant">
                          Débutant (moins de 6 mois)
                        </option>
                        <option value="intermediaire">
                          Intermédiaire (6 mois à 3 ans)
                        </option>
                        <option value="experimente">
                          Expérimenté (plus de 3 ans)
                        </option>
                      </select>
                    ) : (
                      <span className={styles.fieldValue}>
                        {formatExperienceLabel(editProfile.experience_level)}
                      </span>
                    )}
                  </div>

                  {renderField(
                    "Années d'expérience",
                    "years_experience",
                    SECTION_IDS.INFO_PERSO,
                    false,
                    false,
                    "Nombre d'années",
                    "number",
                    { min: "0", max: "50" },
                  )}
                </>,
              )}

              {renderSection(
                "Informations entreprise",
                <FiBriefcase />,
                <>
                  {renderField(
                    "Forme juridique",
                    "legal_form",
                    "Informations_entreprise",
                    false,
                    false,
                    "Auto-entrepreneur, SAS, SARL...",
                  )}
                  {renderField(
                    "SIREN",
                    "siren",
                    "Informations_entreprise",
                    false,
                    true,
                    "123 456 789 (9 chiffres)",
                  )}
                  {renderField(
                    "SIRET",
                    "siret",
                    "Informations_entreprise",
                    false,
                    true,
                    "123 456 789 00012 (14 chiffres)",
                  )}
                  {renderField(
                    "N° TVA intracommunautaire",
                    "vat_number",
                    "Informations_entreprise",
                    false,
                    false,
                    "FR 12 123456789",
                  )}
                </>,
              )}

              {renderSection(
                "Adresse professionnelle",
                <FiMapPinOutline />,
                <>
                  {renderField(
                    "Adresse",
                    "street_address",
                    "Adresse_professionnelle",
                    false,
                    true,
                    "12 Rue de la République",
                  )}
                  {renderField(
                    "Code postal",
                    "postal_code",
                    "Adresse_professionnelle",
                    false,
                    true,
                    "75001",
                  )}
                  {renderField(
                    "Ville",
                    "city",
                    "Adresse_professionnelle",
                    false,
                    true,
                    "Paris",
                  )}
                  {renderField(
                    "Pays",
                    "country",
                    "Adresse_professionnelle",
                    false,
                    false,
                    "France",
                  )}
                </>,
              )}

              {renderSection(
                "Assurance & Certifications",
                <FiShieldOutline />,
                <>
                  {renderField(
                    "Compagnie d'assurance",
                    "insurance_company",
                    "Assurance___Certifications",
                    false,
                    false,
                    "AXA, Allianz...",
                  )}
                  {renderField(
                    "N° contrat RC Pro",
                    "insurance_number",
                    "Assurance___Certifications",
                    false,
                    false,
                    "RC123456789",
                  )}
                  {renderField(
                    "Certifications",
                    "certifications",
                    "Assurance___Certifications",
                    true,
                    false,
                    "Qualité, Labels...",
                  )}
                </>,
              )}

              {renderSection(
                "Web & Réseaux sociaux",
                <FiGlobe />,
                <SocialLinksManager
                  website={editProfile.website}
                  linkedin={editProfile.linkedin}
                  instagram={editProfile.instagram}
                  facebook={editProfile.facebook}
                  isEditing={
                    editingSection === "Web___R_seaux_sociaux"
                  }
                  onEdit={() =>
                    beginSectionEdit("Web___R_seaux_sociaux")
                  }
                  onChange={handleSocialChange}
                  errors={{
                    website: errors.website,
                    linkedin: errors.linkedin,
                    instagram: errors.instagram,
                    facebook: errors.facebook,
                  }}
                />,
              )}
            </section>
          </div>
        );

      case "missions":
        return (
          <div className={styles.missionsLayout}>
            <div className={styles.missionsHero}>
              <div className={styles.missionsHeroTitle}>
                <h3>Pilotage des missions</h3>
                <p>Configurez vos services, zones et disponibilites, puis suivez vos indicateurs.</p>
              </div>
              <div className={styles.missionsHeroProgress}>
                <div className={styles.missionsHeroProgressMeta}>
                  <span>Progression de configuration</span>
                  <strong>{missionProgressPercent}%</strong>
                </div>
                <button
                  type="button"
                  className={styles.missionProgressTrackButton}
                  onClick={() =>
                    setShowPendingMissionStepsOnly((prev) => !prev)
                  }
                  title="Filtrer les etapes a configurer"
                >
                  <div className={styles.missionProgressTrack} aria-hidden="true">
                    <div
                      className={styles.missionProgressFill}
                      style={{ width: `${missionProgressPercent}%` }}
                    />
                  </div>
                </button>
                <p className={styles.missionsHeroProgressHint}>
                  {missionProgressDoneCount}/{missionProgressSteps.length} etapes completees
                </p>
              </div>
              <div className={styles.missionsHeroStats}>
                <div className={styles.missionStat}>
                  <span className={styles.missionStatLabel}>Services actifs</span>
                  <strong>{activeMissionServiceLabels.length}</strong>
                </div>
                <div className={styles.missionStat}>
                  <span className={styles.missionStatLabel}>Jours ouverts</span>
                  <strong>{missionOpenDaysCount}/7</strong>
                </div>
                <div className={styles.missionStat}>
                  <span className={styles.missionStatLabel}>Plages horaires</span>
                  <strong>{missionRangesCount}</strong>
                </div>
                <div className={styles.missionStat}>
                  <span className={styles.missionStatLabel}>Zones couvertes</span>
                  <strong>{missionAvailability?.zones.length ?? 0}</strong>
                </div>
              </div>
            </div>

            <div className={styles.missionsColumns}>
              <div className={styles.missionsPrimary}>
            {renderSection(
              "Services proposés",
              <FiTarget />,
              <>
                <MissionDetails
                  selectedServices={missionPayload.missionProfile.missions
                    .filter((mission) => mission.isActive)
                    .map((mission) => mission.label)}
                  isEditing={editingSection === MISSION_SECTION_IDS.SERVICES}
                  onChangeOption={(selected) =>
                    setEditProfile((prev) =>
                      prev
                        ? (() => {
                            const existingPayload = parseAvailabilityPayloadRaw(
                              prev.availability_hours,
                            );
                            const parsed = parseMissionPayload(
                              prev.availability_hours,
                            );
                            const normalizedSelected = selected.map((item) =>
                              item.trim().toLowerCase(),
                            );
                            const selectedIdSet = new Set<string>();

                            selected.forEach((item) => {
                              const byCatalogLabel = parsed.missionCatalog.find(
                                (catalogItem) =>
                                  catalogItem.label.trim().toLowerCase() ===
                                  item.trim().toLowerCase(),
                              );
                              const byCatalogId = parsed.missionCatalog.find(
                                (catalogItem) => catalogItem.id === item,
                              );
                              selectedIdSet.add(
                                byCatalogLabel?.id ??
                                  byCatalogId?.id ??
                                  toMissionTypeId(item),
                              );
                            });

                            const hasMissionProfile =
                              parsed.missionProfile.missions.length > 0;
                            const baseMissions = hasMissionProfile
                              ? parsed.missionProfile.missions
                              : parsed.missionCatalog.map((catalogItem) => ({
                                  id: catalogItem.id,
                                  label: catalogItem.label,
                                  isActive: false,
                                  minNoticeHours: 24,
                                  allowUrgent: false,
                                  urgentMultiplier: 1.3,
                                }));
                            const existingMissionIds = new Set(
                              baseMissions.map((mission) => mission.id),
                            );
                            const missingSelectedMissions = selected
                              .map((item) => {
                                const byCatalogLabel = parsed.missionCatalog.find(
                                  (catalogItem) =>
                                    catalogItem.label.trim().toLowerCase() ===
                                    item.trim().toLowerCase(),
                                );
                                const byCatalogId = parsed.missionCatalog.find(
                                  (catalogItem) => catalogItem.id === item,
                                );
                                const id =
                                  byCatalogLabel?.id ??
                                  byCatalogId?.id ??
                                  toMissionTypeId(item);
                                const label =
                                  byCatalogLabel?.label ??
                                  byCatalogId?.label ??
                                  item;

                                if (existingMissionIds.has(id)) return null;
                                existingMissionIds.add(id);

                                return {
                                  id,
                                  label,
                                  isActive: true,
                                  minNoticeHours: 24,
                                  allowUrgent: false,
                                  urgentMultiplier: 1.3,
                                };
                              })
                              .filter(
                                (
                                  mission,
                                ): mission is ConciergeMissionProfile["missions"][number] =>
                                  Boolean(mission),
                              );

                            const nextMissions = [
                              ...baseMissions,
                              ...missingSelectedMissions,
                            ].map((mission) => ({
                              ...mission,
                              isActive:
                                selectedIdSet.has(mission.id) ||
                                normalizedSelected.includes(
                                  mission.label.trim().toLowerCase(),
                                ),
                            }));

                            const nextMissionProfile: ConciergeMissionProfile = {
                              ...parsed.missionProfile,
                              missions: nextMissions,
                            };
                            const legacy =
                              buildLegacyFromMissionProfile(nextMissionProfile);

                            return {
                              ...prev,
                              availability_hours: JSON.stringify({
                                ...existingPayload,
                                missionProfile: nextMissionProfile,
                                missionCatalog: legacy.missionCatalog,
                                preferences: legacy.preferences,
                              }),
                            };
                          })()
                        : prev,
                    )
                  }
                />
              </>,
              true,
              MISSION_SECTION_IDS.SERVICES,
              false,
            )}

            {renderSection(
              "Zone d'intervention & règles de mission",
              <FiMapPinOutline />,
              <>
                <MissionZoneAvailability
                  value={missionAvailability}
                  isEditing={editingSection === MISSION_SECTION_IDS.ZONE_RULES}
                  showScheduleSection={false}
                  onChange={(data) =>
                    setEditProfile((prev) =>
                      prev
                        ? {
                            ...prev,
                            service_area:
                              data.zones.length > 0
                                ? data.zones.map((z) => z.label).join(", ")
                                : prev.service_area ?? prev.location ?? null,
                            service_radius_km: data.radiusKm,
                            availability_hours: JSON.stringify({
                              ...parseAvailabilityPayloadRaw(prev.availability_hours),
                              rules: data.rules,
                            }),
                          }
                        : prev,
                    )
                  }
                />
              </>,
            )}

            {renderSection(
              "Disponibilités hebdomadaires",
              <FiClockOutline />,
              <>
                <AvailabilityEditor
                  value={missionAvailability?.schedule ?? []}
                  emergency24h={missionAvailability?.emergency24h ?? false}
                  isEditing={editingSection === MISSION_SECTION_IDS.WEEKLY_AVAILABILITY}
                  onChange={(schedule, emergency24h) =>
                    setEditProfile((prev) =>
                      prev
                        ? {
                            ...prev,
                            availability_hours: JSON.stringify({
                              ...parseAvailabilityPayloadRaw(prev.availability_hours),
                              schedule: normalizeMissionSchedule(schedule),
                            }),
                            emergency_service: emergency24h,
                          }
                        : prev,
                    )
                  }
                />
              </>,
              true,
              MISSION_SECTION_IDS.WEEKLY_AVAILABILITY,
            )}

              </div>
              <aside className={styles.missionsSecondary}>
                {renderMissionProgressPanel()}
                {renderMissionsStaticSections()}
              </aside>
            </div>
          </div>
        );

      case "packs":
        return (
          <div className={styles.financeGrid}>
            <div className={styles.financeCard}>
              {renderSection(
                "Mes packs de services",
                <FiBriefcase />,
                <>
                  <p>
                    Creez et gerez vos packs directement depuis votre profil concierge.
                    Vous pourrez ensuite les relier a votre grille tarifaire et vos modeles de contrats.
                  </p>
                  <p>
                    <Link href="/dashboard/concierge/services-packages/seed">
                      Ouvrir la page seed test (2 packs + 2 modeles)
                    </Link>
                  </p>
                  <ServicePackageManager
                    activeMissionServiceIds={activeMissionServiceCatalogIds}
                    activeMissionServiceLabels={activeMissionServiceLabels}
                  />
                </>,
                false,
              )}
            </div>
          </div>
        );

      case "tarifs":
        return (
          <div className={styles.financeGrid}>
            <div
              className={`${styles.financeCard} ${styles.financeCardFull} ${styles.tariffPanelCard}`}
            >
              {renderSection(
                "Parcours devis & facturation",
                <FiTarget />,
                <div className={styles.tariffWorkflow}>
                  <div className={styles.tariffHero}>
                    <div className={styles.tariffHeroIntro}>
                      <span className={styles.tariffPill}>Pilotage global</span>
                      <p className={styles.tariffWorkflowLead}>
                        Centralisez vos regles de prix, puis produisez devis et
                        factures sans ressaisie.
                      </p>
                    </div>
                    <div className={styles.tariffHeroStats}>
                      <article className={styles.tariffMetric}>
                        <span>Services actifs</span>
                        <strong>{activeMissionServiceLabels.length}</strong>
                      </article>
                      <article className={styles.tariffMetric}>
                        <span>Missions configurees</span>
                        <strong>{missionProgressPercent}%</strong>
                      </article>
                      <article className={styles.tariffMetric}>
                        <span>Tarif horaire</span>
                        <strong>
                          {editProfile.hourly_rate != null
                            ? `${editProfile.hourly_rate} EUR/h`
                            : "A definir"}
                        </strong>
                      </article>
                      <article className={styles.tariffMetric}>
                        <span>Minimum facture</span>
                        <strong>{seasonalPricing.minimumInvoice} EUR</strong>
                      </article>
                    </div>
                    <div className={styles.tariffReadiness}>
                      <div className={styles.tariffReadinessHeader}>
                        <strong>Pret a chiffrer</strong>
                        <span>{tariffReadinessPercent}%</span>
                      </div>
                      <div className={styles.tariffReadinessTrack}>
                        <span style={{ width: `${tariffReadinessPercent}%` }} />
                      </div>
                      {pendingTariffReadinessChecks.length > 0 ? (
                        <div className={styles.tariffReadinessList}>
                          {pendingTariffReadinessChecks.map((check) => (
                            <div key={check.id} className={styles.tariffReadinessItem}>
                              <span className={styles.tariffReadinessDot}>
                                <AlertCircle size={12} />
                              </span>
                              <span>{check.label}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.tariffReadinessSuccess}>
                          Configuration complete. Vous pouvez lancer vos devis.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={styles.tariffQuickActions}>
                    <button
                      type="button"
                      className={`${styles.tariffNavBtn} ${styles.tariffNavBtnPrimary}`}
                      onClick={() => handleTabChange("missions")}
                    >
                      Configurer Missions
                    </button>
                    <button
                      type="button"
                      className={styles.tariffNavBtn}
                      onClick={() => handleTabChange("packs")}
                    >
                      Configurer Mes Packs
                    </button>
                    <button
                      type="button"
                      className={styles.tariffNavBtn}
                      onClick={() => scrollToTariffSection("tariffs-billing-desk")}
                    >
                      Aller à Devis / Factures
                    </button>
                  </div>

                  <div className={styles.tariffSectionNav}>
                    <button
                      type="button"
                      className={styles.tariffSectionLink}
                      onClick={() => scrollToTariffSection("tariffs-base")}
                    >
                      Tarifs de base
                    </button>
                    <button
                      type="button"
                      className={styles.tariffSectionLink}
                      onClick={() => scrollToTariffSection("tariffs-grid")}
                    >
                      Grille détaillée
                    </button>
                    <button
                      type="button"
                      className={styles.tariffSectionLink}
                      onClick={() => scrollToTariffSection("tariffs-billing-desk")}
                    >
                      Devis / Factures
                    </button>
                    <button
                      type="button"
                      className={styles.tariffSectionLink}
                      onClick={() => scrollToTariffSection("tariffs-settings")}
                    >
                      Paramètres
                    </button>
                    <button
                      type="button"
                      className={styles.tariffSectionLink}
                      onClick={() => scrollToTariffSection("tariffs-forecast")}
                    >
                      Prévision
                    </button>
                  </div>
                </div>,
                false,
                TARIFF_SECTION_IDS.WORKFLOW,
              )}
            </div>

            <div
              id="tariffs-base"
              className={`${styles.financeCard} ${styles.tariffPanelCard}`}
            >
              {renderSection(
                "Tarifs de base",
                <DollarSign />,
                <>
                  <div className={styles.tariffCardIntro}>
                    <div className={styles.tariffInlineHeader}>
                      <h3 className={styles.tariffMiniTitle}>Base de chiffrage</h3>
                      <span className={styles.tariffConfigChip}>Base principale</span>
                    </div>
                    <p className={styles.tariffHint}>
                      Appliquée automatiquement sur les devis hors cas spécifiques.
                    </p>
                    <div className={styles.tariffMetaGrid}>
                      <article className={styles.tariffMetaCard}>
                        <span className={styles.tariffMetaLabel}>Statut</span>
                        <strong className={styles.tariffMetaValue}>
                          {Number(editProfile.hourly_rate ?? 0) > 0
                            ? "Base tarifaire renseignée"
                            : "Tarif horaire à définir"}
                        </strong>
                      </article>
                      <article className={styles.tariffMetaCard}>
                        <span className={styles.tariffMetaLabel}>Tarif actuel</span>
                        <strong className={styles.tariffMetaValue}>
                          {editProfile.hourly_rate != null
                            ? `${editProfile.hourly_rate} EUR/h`
                            : "Non renseigné"}
                        </strong>
                      </article>
                      <article className={styles.tariffMetaCard}>
                        <span className={styles.tariffMetaLabel}>Deplacement</span>
                        <strong className={styles.tariffMetaValue}>
                          {editProfile.travel_fee != null
                            ? `${editProfile.travel_fee} EUR`
                            : "A confirmer"}
                        </strong>
                      </article>
                    </div>
                  </div>
                  <div className={styles.tariffFieldPanel}>
                    {renderField(
                      "Tarif horaire (EUR/h)",
                      "hourly_rate",
                      TARIFF_SECTION_IDS.BASE,
                      false,
                      true,
                      "45",
                      "number",
                    )}
                    {renderField(
                  "Frais de déplacement (EUR)",
                      "travel_fee",
                      TARIFF_SECTION_IDS.BASE,
                      false,
                      false,
                      "15",
                      "number",
                    )}
                  </div>
                </>,
              )}
            </div>

            <div
              id="tariffs-settings"
              className={`${styles.financeCard} ${styles.tariffPanelCard}`}
            >
              {renderSection(
                "Paramètres de facturation",
                <FiTrendingUp />,
                <>
                  <div className={styles.tariffCardIntro}>
                    <div className={styles.tariffInlineHeader}>
                      <h3 className={styles.tariffMiniTitle}>Regles transverses</h3>
                      <span className={styles.tariffConfigChip}>Appliquees aux devis/factures</span>
                    </div>
                    <p className={styles.tariffHint}>
                      Définissez les frais standards, majorations et seuils
                      minimum.
                    </p>
                    </div>
                    <div className={styles.tariffConfigSnapshot}>
                      <span className={styles.tariffConfigChip}>
                        Urgence +{seasonalPricing.urgentPercent}%
                      </span>
                      <span className={styles.tariffConfigChip}>
                        Nuit +{seasonalPricing.nightPercent}%
                      </span>
                      <span className={styles.tariffConfigChip}>
                        Week-end +{seasonalPricing.weekendPercent}%
                      </span>
                      <span className={styles.tariffConfigChip}>
                        Haute saison +{seasonalPricing.highSeasonPercent}%
                      </span>
                      <span className={styles.tariffConfigChip}>
                        Minimum {seasonalPricing.minimumInvoice} EUR
                      </span>
                    </div>
                  <div className={styles.tariffToolPanel}>
                    <h3 className={styles.tariffSubsectionTitle}>
                      Prestations standard sejour
                    </h3>
                    <TariffServicePackages
                      value={seasonalPricing}
                      isEditing={editingSection === TARIFF_SECTION_IDS.BILLING}
                      onChange={applySeasonalPricing}
                    />
                    <h3 className={styles.tariffSubsectionTitle}>
                      Majorations et seuil minimum
                    </h3>
                    <TariffAdjustments
                      value={seasonalPricing}
                      isEditing={editingSection === TARIFF_SECTION_IDS.BILLING}
                      onChange={applySeasonalPricing}
                    />
                  </div>
                </>,
                true,
                TARIFF_SECTION_IDS.BILLING,
              )}
            </div>

            <div
              id="tariffs-grid"
              className={`${styles.financeCard} ${styles.financeCardWide} ${styles.tariffPanelCard}`}
            >
              {renderSection(
                "Grille tarifaire détaillée",
                <FiDollarSignOutline />,
                <>
                  <div className={styles.tariffCardIntro}>
                    <div className={styles.tariffInlineHeader}>
                      <h3 className={styles.tariffMiniTitle}>Tarification contextuelle</h3>
                      <span className={styles.tariffConfigChip}>Regles avancees</span>
                    </div>
                    <p className={styles.tariffHint}>
                      Affinez vos prix selon le type de demande et le contexte
                      d&apos;intervention.
                    </p>
                    <div className={styles.tariffContextLine}>
                      <div className={styles.tariffContextItem}>
                        <CheckCircle2 size={14} />
                        <span>{activeMissionServiceLabels.length} services relies</span>
                      </div>
                      <div className={styles.tariffContextItem}>
                        <CheckCircle2 size={14} />
                        <span>Règles par bien, surface et durée</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.tariffToolPanel}>
                    <PricingGridManager
                      activeServiceIds={activeMissionServiceCatalogIds}
                      activeServiceLabels={activeMissionServiceLabels}
                      showHeader={false}
                      showQuickStats={false}
                    />
                  </div>
                </>,
                false,
              )}
            </div>

            <div
              id="tariffs-billing-desk"
              className={`${styles.financeCard} ${styles.financeCardFull} ${styles.tariffPanelCard} ${styles.tariffEmphasisCard}`}
            >
              {renderSection(
                "Devis et factures opérationnels",
                <FiFile />,
                <>
                  <div className={styles.tariffCardIntro}>
                    <div className={styles.tariffInlineHeader}>
                      <h3 className={styles.tariffMiniTitle}>Production documentaire</h3>
                      <span className={styles.tariffConfigChip}>
                        {missionRows.length} mission(s) disponible(s)
                      </span>
                    </div>
                    <p className={styles.tariffHint}>
                      Créez, validez et suivez vos devis/factures depuis une
                      interface unique.
                    </p>
                  </div>
                  <div className={styles.tariffToolPanel}>
                    <TariffBillingDesk />
                  </div>
                </>,
                false,
              )}
            </div>

            <div
              id="tariffs-forecast"
              className={`${styles.financeCard} ${styles.tariffPanelCard}`}
            >
              {renderSection(
                "Prévision de revenus",
                <FiBarChart />,
                <>
                  <div className={styles.tariffCardIntro}>
                    <div className={styles.tariffInlineHeader}>
                      <h3 className={styles.tariffMiniTitle}>Simulation rapide</h3>
                      <span className={styles.tariffConfigChip}>Aide à la décision</span>
                    </div>
                    <p className={styles.tariffHint}>
                      Ajustez vos propositions avant envoi selon vos règles
                      actuelles.
                    </p>
                    <div className={styles.tariffForecastPanel}>
                      <span className={styles.tariffConfigChip}>
                        Base horaire: {editProfile.hourly_rate ?? 0} EUR/h
                      </span>
                      <span className={styles.tariffConfigChip}>
                        Déplacement: {editProfile.travel_fee ?? 0} EUR
                      </span>
                      <span className={styles.tariffConfigChip}>
                        Minimum facture: {seasonalPricing.minimumInvoice} EUR
                      </span>
                    </div>
                  </div>
                  <div className={styles.tariffToolPanel}>
                    <TariffRevenueEstimator
                      hourlyRate={editProfile.hourly_rate ?? 0}
                      travelFee={editProfile.travel_fee ?? 0}
                      pricing={seasonalPricing}
                    />
                  </div>
                </>,
                false,
              )}
            </div>
          </div>
        );

      case "equipe":
        return (
          <>
            {renderSection(
              "Mon équipe",
              <FiUsers />,
              <div className={styles.placeholderContent}>
                <p>Section en cours de développement</p>
                <p>Gérez votre équipe et vos collaborateurs ici.</p>
              </div>,
            )}

            {renderSection(
              "Zones d'intervention",
              <FiMapPinOutline />,
              <>
                {renderField(
                  "Zone d'intervention",
                  "service_area",
                  "Zones_d_intervention",
                  false,
                  false,
                  "Paris et Île-de-France",
                )}
                {renderField(
                  "Rayon d'intervention (km)",
                  "service_radius_km",
                  "Zones_d_intervention",
                  false,
                  false,
                  "30",
                  "number",
                )}
              </>,
            )}
          </>
        );

      case "documents":
        return (
          <>
            {renderSection(
              "Documents professionnels",
              <FiFile />,
              <div className={styles.placeholderContent}>
                <p>Section en cours de développement</p>
                <p>
                  Gérez vos documents professionnels (kbis, assurances, etc.).
                </p>
              </div>,
            )}

            {renderSection(
              "Avis clients",
              <FiStarOutline />,
              <div className={styles.placeholderContent}>
                <p>Section en cours de développement</p>
                <p>Consultez les avis de vos clients ici.</p>
              </div>,
            )}
          </>
        );

      default:
        return null;
    }
  };

  if (errorMsg && !profile) {
    return <div className={styles.errorMsg}>{errorMsg}</div>;
  }

  if (!profile || !editProfile) {
    return <div className={styles.loading}>Chargement du profil...</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.logo}>
            <Shield size={22} />
          </div>
          <h1 className={styles.pageTitle}>Espace Concierge</h1>
        </div>
      </header>

      <main className={styles.main}>
        {successMsg && (
          <div
            className={`${styles.notification} ${styles.notificationSuccess}`}
          >
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div
            className={`${styles.notification} ${styles.notificationError}`}
          >
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className={styles.tabs}>
          {CONCIERGE_TABS.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`${styles.tab} ${isActive ? styles.tabActive : ""
                  }`}
                style={{ "--tab-index": index } as React.CSSProperties}
              >
                <span className={styles.tabIcon}>
                  <Icon />
                </span>
                <span className={styles.tabLabel}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.tabContent}>
          <div key={activeTab} className={styles.tabPane} aria-live="polite">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
}










