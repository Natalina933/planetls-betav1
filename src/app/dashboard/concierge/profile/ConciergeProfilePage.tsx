"use client";

import React, {
  useState,
  useEffect,
  ChangeEvent,
  useMemo,
  useCallback,
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
import ServicePackageManager from "@/app/components/dashboard/concierge/ServicePackageManager/ServicePackageManager";
import TariffServicePackages from "@/app/components/tariffs/TariffServicePackages";
import TariffAdjustments from "@/app/components/tariffs/TariffAdjustments";
import type {
  ConciergeMissionProfile,
  MissionAvailability,
  MissionCatalogItem,
  MissionPreferences,
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
  SERVICES_ZONE: normalizeSectionId("Services & Zone d'intervention"),
  TARIFS: normalizeSectionId("Ma grille tarifaire"),
} as const;

const TARIFF_SECTION_IDS = {
  BASE: normalizeSectionId("Tarifs de base"),
  PACKS: normalizeSectionId("Packs location saisonniere"),
  ADJUSTMENTS: normalizeSectionId("Majorations et regles de facturation"),
} as const;

const MISSION_SECTION_IDS = {
  SERVICES: normalizeSectionId("Services proposés"),
  ZONE_RULES: normalizeSectionId("Zone, disponibilités & règles de mission"),
  ACCEPTANCE_RULES: normalizeSectionId("Règles d'acceptation des missions"),
  PRIORITY_TYPES: normalizeSectionId("Priorité & typologie des missions"),
} as const;

type ExtendedFieldName =
  | keyof Profile
  | "service_area"
  | "service_radius_km";

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
        schedule: parsed,
        rules: defaultRules,
        missionCatalog: DEFAULT_MISSION_CATALOG,
        preferences: defaultPreferences,
        missionProfile: buildDefaultMissionProfile(DEFAULT_MISSION_CATALOG),
      };
    }

    const schedule = Array.isArray(parsed?.schedule) ? parsed.schedule : [];
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
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const missionPayload = useMemo(
    () => parseMissionPayload(editProfile?.availability_hours),
    [editProfile?.availability_hours],
  );
  const seasonalPricing = useMemo(
    () => parseSeasonalPricing(editProfile?.availability_hours),
    [editProfile?.availability_hours],
  );
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    [SECTION_IDS.INFO_PERSO]: true,
    [SECTION_IDS.SERVICES_ZONE]: true,
    [SECTION_IDS.TARIFS]: true,
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

  const handleTabChange = (tabId: TabId) => {
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
      alert("⚠️ Veuillez corriger les erreurs avant de sauvegarder.");
      return;
    }

    setLoading(true);
    let avatarUrl = editProfile.avatar_url;

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
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Erreur lors de la sauvegarde");
      }

      const updatedProfile: Profile = result;
      setProfile(updatedProfile);
      setEditProfile(updatedProfile);
      setEditingSection(null);
      setAvatarFile(null);

      setSuccessMsg(`✅ ${sectionTitle} mis à jour avec succès`);

      await update({
        user: {
          image: avatarUrl,              // 👈 CHAMP CLÉ NEXTAUTH
          avatar_url: avatarUrl,         // 👈 ton champ custom (OK)
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
            {value !== null && value !== "" ? value : "—"}
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
  ) => {
    const sectionId = normalizeSectionId(title);
    const isOpen = openSections[sectionId] ?? false;
    const isEditingThis = editingSection === sectionId;

    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div
            className={styles.sectionTitleWrapper}
            onClick={() => toggleSection(sectionId)}
            onKeyDown={(e) => handleSectionHeaderKeyDown(e, sectionId)}
            role="button"
            tabIndex={0}
          >
            <div className={styles.sectionTitleLeft}>
              <span className={styles.sectionIcon}>{icon}</span>
              <h2 className={styles.sectionTitle}>{title}</h2>
            </div>
            <ChevronDown
              size={16}
              className={`${styles.toggleIcon} ${isOpen ? styles.toggleIconOpen : ""
                }`}
            />
          </div>

          {canEdit && (
            <div className={styles.sectionActions}>
              {isEditingThis ? (
                <>
                  <button
                    onClick={() => handleSaveSection(title)}
                    className={styles.saveBtn}
                    disabled={loading}
                    title="Sauvegarder"
                    aria-label="Sauvegarder"
                  >
                    {loading ? (
                      <div className={styles.spinnerMini} />
                    ) : (
                      <Save size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingSection(null);
                      setEditProfile(profile);
                      setErrors({});
                      setAvatarFile(null);
                    }}
                    className={styles.cancelBtn}
                    title="Annuler"
                    aria-label="Annuler"
                  >
                    <LucideX size={16} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setEditingSection(sectionId);
                    if (!isOpen) toggleSection(sectionId);
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

        <div
          className={`${styles.sectionContent} ${isOpen ? styles.sectionContentOpen : ""
            }`}
        >
          {children}
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

  const renderPlaceholderCurrentMissions = () => (
    <div className={styles.placeholderContent}>
      <p>Aucune mission en cours</p>
      <p>
        Les missions actives apparaîtront ici avec leur statut, le logement
        concerné et le client.
      </p>
    </div>
  );

  const renderPlaceholderHistory = () => (
    <div className={styles.placeholderContent}>
      <p>Aucune mission terminée</p>
      <p>
        Vous retrouverez ici l&apos;historique de vos interventions, factures et
        évaluations clients.
      </p>
    </div>
  );

  const renderPlaceholderKpis = () => (
    <div className={styles.placeholderContent}>
      <p>Ces indicateurs seront calculés automatiquement :</p>
      <ul>
        <li>• Taux d&apos;acceptation des missions</li>
        <li>• Délai moyen d&apos;intervention</li>
        <li>• Nombre de missions ce mois-ci</li>
        <li>• Note moyenne des clients</li>
      </ul>
    </div>
  );

  const renderMissionsStaticSections = () => (
    <>

      {renderSection(
        "Priorité & typologie des missions",
        <FiStarOutline />,
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
      )}
      {renderSection(
        "Missions en cours",
        <FiClockOutline />,
        renderPlaceholderCurrentMissions(),
        false,
      )}
      {renderSection(
        "Historique des missions",
        <FiCheckCircleOutline />,
        renderPlaceholderHistory(),
        false,
      )}
      {renderSection(
        "Indicateurs de performance",
        <FiTrendingUp />,
        renderPlaceholderKpis(),
        false,
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
                      setEditingSection("Photo de profil")
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
                        {profile.years_experience ?? "—"} ans
                      </p>
                    </div>
                  </div>
                </div>
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
                      true,
                    )}
                    {renderField(
                      "Prénom",
                      "first_name",
                      SECTION_IDS.INFO_PERSO,
                      true,
                    )}
                    {renderField(
                      "Nom",
                      "last_name",
                      SECTION_IDS.INFO_PERSO,
                      true,
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
                    "Nom commercial",
                    "company_name",
                    "Informations_entreprise",
                    false,
                    true,
                    "Ma Conciergerie",
                  )}
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
                    setEditingSection("Web___R_seaux_sociaux")
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
          <>
            {renderSection(
              "Services proposés",
              <FiTarget />,
              <MissionDetails
                profile={editProfile as Profile}
                isEditing={editingSection === MISSION_SECTION_IDS.SERVICES}
                // On retire onChangeField car il n'est plus défini dans les Props de MissionDetails
                onChangeOption={(selected) =>
                  setEditProfile((prev) =>
                    prev
                      ? { ...prev, option: JSON.stringify(selected) }
                      : prev,
                  )
                }
              />,
            )}

            {renderSection(
              "Zone, disponibilités & règles de mission",
              <FiMapPinOutline />,
              <MissionZoneAvailability
                value={buildMissionAvailabilityFromProfile(editProfile)}
                isEditing={editingSection === MISSION_SECTION_IDS.ZONE_RULES}
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
                            schedule: data.schedule,
                            rules: data.rules,
                          }),
                          emergency_service: data.emergency24h,
                        }
                      : prev,
                  )
                }
              />,
            )}

            {renderMissionsStaticSections()}
          </>
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
                  <ServicePackageManager />
                </>,
                false,
              )}
            </div>
          </div>
        );

      case "tarifs":
        return (
          <div className={styles.financeGrid}>
            <div className={styles.financeCard}>
              {renderSection(
                "Positionnement tarifaire",
                <FiDollarSignOutline />,
                <div className={styles.pricingQuickStats}>
                  <h4>Repere rapide location saisonniere</h4>
                  <ul>
                    <li>
                      Tarif horaire: {editProfile.hourly_rate ?? 0} EUR/h
                    </li>
                    <li>
                      Check-in + check-out:{" "}
                      {seasonalPricing.checkInFee + seasonalPricing.checkOutFee} EUR
                    </li>
                    <li>
                      Menage T2/T3: {seasonalPricing.cleaningTwoRoomsFee} EUR
                    </li>
                    <li>
                      Panier urgence nuit:{" "}
                      {Math.round(
                        (editProfile.hourly_rate ?? 0) *
                          (1 + seasonalPricing.urgentPercent / 100) *
                          (1 + seasonalPricing.nightPercent / 100),
                      )}{" "}
                      EUR/h
                    </li>
                  </ul>
                </div>,
                false,
              )}
            </div>

            <div className={styles.financeCard}>
              {renderSection(
                "Tarifs de base",
                <DollarSign />,
                <>
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
                    "Forfait mensuel (EUR)",
                    "monthly_rate",
                    TARIFF_SECTION_IDS.BASE,
                    false,
                    false,
                    "1500",
                    "number",
                  )}
                  {renderField(
                    "Frais de deplacement (EUR)",
                    "travel_fee",
                    TARIFF_SECTION_IDS.BASE,
                    false,
                    false,
                    "15",
                    "number",
                  )}
                </>,
              )}
            </div>

            <div className={styles.financeCard}>
              {renderSection(
                "Packs location saisonniere",
                <FiBriefcase />,
                <TariffServicePackages
                  value={seasonalPricing}
                  isEditing={editingSection === TARIFF_SECTION_IDS.PACKS}
                  onChange={applySeasonalPricing}
                />,
              )}
            </div>

            <div className={styles.financeCard}>
              {renderSection(
                "Majorations et regles de facturation",
                <FiTrendingUp />,
                <TariffAdjustments
                  value={seasonalPricing}
                  isEditing={editingSection === TARIFF_SECTION_IDS.ADJUSTMENTS}
                  onChange={applySeasonalPricing}
                />,
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







