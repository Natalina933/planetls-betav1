"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import {
  buildMissionProfileFromSelection,
  buildProfileWeeklyAvailabilityUpdate,
  buildProfileZoneUpdate,
} from "./missionEditing";
import {
  FiBarChart,
  FiCheckCircle as FiCheckCircleOutline,
  FiBriefcase,
  FiClock as FiClockOutline,
  FiDollarSign as FiDollarSignOutline,
  FiGlobe,
  FiFile,
  FiMapPin as FiMapPinOutline,
  FiPlayCircle,
  FiShield as FiShieldOutline,
  FiStar as FiStarOutline,
  FiTarget,
  FiUsers,
} from "react-icons/fi";
import { ChevronDown, Edit2, LucideUser, Save, Shield, Star, X as LucideX } from "lucide-react";
import {
  BadgeCheck,
  Building2,
  Camera,
  ClipboardCheck,
  FileText,
  Globe2,
  IdCard,
  MapPinned,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import ServicePackageManager from "@/app/components/dashboard/concierge/ServicePackageManager/ServicePackageManager";
import ProfileSummary from "@/app/components/dashboard/concierge/ProfileSummary/ProfileSummary";
import MissionSnapshotShell from "@/app/components/dashboard/concierge/MissionSnapshotShell";
import SocialLinksManager from "@/app/components/dashboard/SocialLinksManager/SocialLinksManager";
import { DashboardOperationalPage, DashboardPanel } from "@/components/dashboard";
import { ProfileIdentity } from "@/app/components/dashboard/concierge/ProfileSummary/profileIdentity";
import { ProfileOverviewWorkspace } from "@/app/components/dashboard/profile/ProfileOverviewWorkspace";
import MissionDetails from "@/app/components/dashboard/concierge/MissionDetails/MissionDetails";
import MissionZoneAvailability from "@/app/components/missions/MissionZoneAvailability";
import AvailabilityEditor from "@/app/components/missions/AvailabilityEditor";
import TariffBillingDesk from "@/app/components/tariffs/TariffBillingDesk";
import InputWithValidation from "@/app/components/ui/InputWithValidation/InputWithValidation";
import type { ConciergeTabId } from "@/app/components/dashboard/concierge/conciergeTabsConfig";
import { buildConciergeProfileCompletion } from "@/app/dashboard/shared";
import type { MissionAvailability, WeekDay } from "@/app/components/missions/types";
import { ConciergeProfileShell } from "./profileShellSections";
import { CONCIERGE_CARD_COVER_OPTIONS } from "@/features/public-concierges";

type RenderSection = (
  title: string,
  icon: React.ReactNode,
  content: React.ReactNode,
  editable?: boolean,
  sectionId?: string,
  showEditTop?: boolean,
) => React.ReactNode;

type DynamicValue = ReturnType<typeof JSON.parse>;
type RenderField = (label: string, ...args: unknown[]) => React.ReactNode;
type TabIconComponent = React.ComponentType<{ size?: number | string; className?: string }>;
type MissionProgressStepItem = {
  key: string;
  label: string;
  hint: string;
  done: boolean;
  sectionId?: string;
};
type MissionQuoteRowItem = { id: string; title: string; status: string };
type MissionCatalogItem = {
  id: string;
  label: string;
  basePrice?: number | null;
  customizable?: boolean;
};
type MissionProfileItem = {
  id: string;
  label: string;
  isActive: boolean;
  minNoticeHours: number;
  allowUrgent: boolean;
  urgentMultiplier: number;
};
type MissionPayloadState = {
  missionProfile: {
    missions: MissionProfileItem[];
    specialConditions?: {
      acceptHighSeasonInterventions?: boolean;
    };
  };
  missionCatalog: MissionCatalogItem[];
  preferences: {
    priorityFlags: {
      urgent: boolean;
    };
  };
};
type MissionAvailabilityState = MissionAvailability;
type ExperienceLevel = "debutant" | "intermediaire" | "experimente";
type ConciergeProfileDraft = {
  availability_hours?: string | null;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  avatar_url?: string | null;
  image?: string | null;
  avatar_scale?: number | null;
  avatar_offset_x?: number | null;
  avatar_offset_y?: number | null;
  avatar_rotation?: number | null;
  years_experience?: number | string | null;
  experience_level?: ExperienceLevel | null;
  website?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  facebook?: string | null;
};

type OnboardingProfileDetails = {
  selectedServices: string[];
  propertyTypes: string[];
  existingTools: string[];
  availability: string | null;
  missionPreference: string | null;
  signupMode: string | null;
  onboardingGoal: string | null;
  supportNeed: string | null;
  propertyType: string | null;
  needVolume: string | null;
  tradeBody: string | null;
  startingPriceRange: string | null;
  firstRequestTemplate: string | null;
};

const formatOnboardingChoice = (value?: string | null) => {
  if (!value) return "";
  const labels: Record<string, string> = {
    simple: "Mode simple",
    express: "Mode express",
    business: "Mode business",
    temps_plein: "Temps plein",
    temps_partiel: "Temps partiel",
    soirs_weekends: "Soirs et week-ends",
    sur_demande: "Sur demande selon les missions",
    ponctuelles: "Missions ponctuelles",
    regulieres: "Contrats réguliers",
    les_deux: "Missions ponctuelles et contrats réguliers",
    premieres_missions: "Trouver mes premières missions",
    complement_revenu: "Compléter mes revenus",
    structurer_activite: "Structurer mon activité",
    developper_portefeuille: "Développer mon portefeuille clients",
    guidage_simple: "Guidage simple",
    modeles_outils: "Modèles, tarifs et outils",
    missions_qualifiees: "Demandes qualifiées",
    autonome: "Autonome",
    deleguer_location: "Déléguer la gestion locative",
    trouver_concierge: "Trouver une conciergerie fiable",
    securiser_interventions: "Sécuriser les interventions",
    optimiser_revenus: "Optimiser mes revenus",
    besoin_ponctuel: "Besoin ponctuel",
    suivi_regulier: "Suivi régulier",
    urgence_24h: "Urgences sous 24 h",
    interventions_planifiees: "Interventions planifiées",
    assurance_ok: "Assurance professionnelle à jour",
    assurance_a_preciser: "Assurance à préciser plus tard",
    sur_devis: "Sur devis",
    moins_50: "Moins de 50 € / h",
    "50_80": "50 à 80 € / h",
    "80_plus": "80 € / h et +",
  };
  return labels[value] ?? value;
};

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];

const asNullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;

const parseOnboardingProfileDetails = (availabilityHours?: string | null): OnboardingProfileDetails => {
  const empty: OnboardingProfileDetails = {
    selectedServices: [],
    propertyTypes: [],
    existingTools: [],
    availability: null,
    missionPreference: null,
    signupMode: null,
    onboardingGoal: null,
    supportNeed: null,
    propertyType: null,
    needVolume: null,
    tradeBody: null,
    startingPriceRange: null,
    firstRequestTemplate: null,
  };

  if (!availabilityHours) return empty;

  try {
    const parsed = JSON.parse(availabilityHours) as Record<string, unknown>;
    const onboarding =
      typeof parsed.onboarding === "object" && parsed.onboarding !== null
        ? (parsed.onboarding as Record<string, unknown>)
        : {};
    const preferences =
      typeof parsed.preferences === "object" && parsed.preferences !== null
        ? (parsed.preferences as Record<string, unknown>)
        : {};
    const source = { ...preferences, ...onboarding };

    return {
      selectedServices: asStringArray(source.selectedServices),
      propertyTypes: asStringArray(source.propertyTypes),
      existingTools: asStringArray(source.existingTools),
      availability: asNullableString(source.availability),
      missionPreference: asNullableString(source.missionPreference),
      signupMode: asNullableString(source.signupMode),
      onboardingGoal: asNullableString(source.onboardingGoal),
      supportNeed: asNullableString(source.supportNeed),
      propertyType: asNullableString(source.propertyType),
      needVolume: asNullableString(source.needVolume),
      tradeBody: asNullableString(source.tradeBody),
      startingPriceRange: asNullableString(source.startingPriceRange),
      firstRequestTemplate: asNullableString(source.firstRequestTemplate),
    };
  } catch {
    return empty;
  }
};

const parseAvailabilityPayloadJson = (availabilityHours?: string | null) => {
  if (!availabilityHours) return {} as Record<string, unknown>;

  try {
    const parsed = JSON.parse(availabilityHours) as Record<string, unknown>;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const normalizeYoutubeUrl = (value: string) => value.trim();

const extractYoutubeVideoId = (value: string): string | null => {
  const raw = normalizeYoutubeUrl(value);
  if (!raw) return null;

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();

    if (host === "youtu.be") {
      const candidate = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : null;
    }

    if (host !== "youtube.com" && host !== "m.youtube.com" && host !== "music.youtube.com") {
      return null;
    }

    const watchId = url.searchParams.get("v");
    if (watchId && /^[a-zA-Z0-9_-]{11}$/.test(watchId)) {
      return watchId;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const marker = parts[0];
    const candidate = parts[1] ?? "";
    if (
      (marker === "shorts" || marker === "embed" || marker === "live") &&
      /^[a-zA-Z0-9_-]{11}$/.test(candidate)
    ) {
      return candidate;
    }
  } catch {
    return null;
  }

  return null;
};

type YoutubeInspirationVideo = {
  id: string;
  sourceUrl: string;
  embedUrl: string;
  watchUrl: string;
};

const parseInspirationVideos = (availabilityHours?: string | null): YoutubeInspirationVideo[] => {
  const payload = parseAvailabilityPayloadJson(availabilityHours);
  const rawList = Array.isArray(payload.inspirationVideos) ? payload.inspirationVideos : [];
  const seen = new Set<string>();

  return rawList
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => {
      const id = extractYoutubeVideoId(item);
      if (!id || seen.has(id)) return null;
      seen.add(id);
      return {
        id,
        sourceUrl: item.trim(),
        embedUrl: `https://www.youtube.com/embed/${id}`,
        watchUrl: `https://www.youtube.com/watch?v=${id}`,
      };
    })
    .filter((item): item is YoutubeInspirationVideo => item !== null);
};

const buildAvailabilityHoursWithInspirationVideos = (
  availabilityHours: string | null | undefined,
  urls: string[],
) =>
  JSON.stringify({
    ...parseAvailabilityPayloadJson(availabilityHours),
    inspirationVideos: urls,
  });
type EditProfileStateLike = {
  availability_hours?: string | null;
  [key: string]: unknown;
} | null;
type TariffOverviewControlsLike = {
  configuredPricingCount: number;
  tariffReadinessPercent: number;
  pendingTariffReadinessChecks: Array<{ id: string; label: string }>;
  scrollToTariffSection: (sectionId: string) => void;
  handleTabChange: (tabId: ConciergeTabId) => void;
};
type SetEditProfile = React.Dispatch<React.SetStateAction<ConciergeProfileDraft | null>>;
type PricingModalState = {
  id?: string;
  serviceId: string;
  label: string;
  amount: string;
  unit: string;
  type: string;
};
type PricingCatalogRow = {
  id?: string;
  service_id?: number | null;
  label?: string | null;
  type?: string | null;
  amount?: number | null;
  unit?: string | null;
};
type PricingSegmentDraft = {
  name: string;
  commission_delta_pct: string;
  setup_fee_delta_pct: string;
};
type PricingSegment = {
  id: string;
  name: string;
  commission_delta_pct: number;
  setup_fee_delta_pct: number;
  is_default?: boolean;
};
type PricingPropertyRuleDraft = {
  service_id: string;
  property_type: string;
  min_surface_m2: string;
  max_surface_m2: string;
  delta_pct: string;
};
type PricingPropertyRule = {
  id: string;
  service_id: number | null;
  property_type: string | null;
  min_surface_m2: number | null;
  max_surface_m2: number | null;
  delta_pct: number;
};
type PricingStrategySim = {
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
};
type PricingScenario = {
  id: string;
  name: string;
  is_default: boolean;
};
type PricingV2State = {
  base: {
    hourlyRate: number;
    travelFee: number;
    minimumInvoice: number;
  };
  globalModifiers: {
    urgentPercent: number;
    nightPercent: number;
    weekendPercent: number;
    highSeasonPercent: number;
  };
};
type PricingMetaState = {
  commissionRatePct: number;
  setupFee: number;
};
type PricingProjection = {
  commissionEffectivePct: number;
  total: number;
  commissionAmount: number;
  setupAmount: number;
  actAmount: number;
  narrative: string;
};
type CatalogService = {
  id: number;
  service: string;
};
type ConciergeTariffsTabContentProps = {
  styles: Record<string, string>;
  renderSection: RenderSection;
  sectionIds: Record<string, string>;
  mode?: "tarifs" | "devis";
  tariffOverviewControls: TariffOverviewControlsLike;
  tariffFoundationControls: DynamicValue;
  tariffConfigControls: DynamicValue;
  editingSection: string | null;
  pricingCatalogRows: DynamicValue;
  activeMissionServiceLabels: string[];
  renderField: RenderField;
  tariffCatalogControls: DynamicValue;
  pricingSegmentsControls: DynamicValue;
  pricingRulesControls: DynamicValue;
  pricingScenarioControls: DynamicValue;
  pricingModalControls: DynamicValue;
  billingDeskSectionProps: DynamicValue;
  formatExperienceLabel: (level: ExperienceLevel | null) => string;
};

const DAY_LABELS: Record<WeekDay, string> = {
  mon: "Lundi",
  tue: "Mardi",
  wed: "Mercredi",
  thu: "Jeudi",
  fri: "Vendredi",
  sat: "Samedi",
  sun: "Dimanche",
};

const WEEKDAY_IDS: WeekDay[] = ["mon", "tue", "wed", "thu", "fri"];
const WEEKEND_IDS: WeekDay[] = ["sat", "sun"];

function areMissionTimeRangesEqual(
  left: MissionAvailability["schedule"][number]["ranges"],
  right: MissionAvailability["schedule"][number]["ranges"],
) {
  if (left.length !== right.length) return false;
  return left.every(
    (range, index) => range.start === right[index]?.start && range.end === right[index]?.end,
  );
}

function formatMissionScheduleSummary(schedule: MissionAvailability["schedule"], emergency24h: boolean) {
  if (emergency24h) {
    return "24h/24, 7j/7";
  }

  const byDay = new Map(schedule.map((day) => [day.day, day.ranges]));
  const openDays = schedule.filter((day) => day.ranges.length > 0);

  if (openDays.length === 0) {
    return "Aucune disponibilité définie";
  }

  const weekdayRanges = byDay.get("mon") ?? [];
  const weekendRanges = byDay.get("sat") ?? [];
  const sameWeekdays =
    weekdayRanges.length > 0 &&
    WEEKDAY_IDS.every((day) => areMissionTimeRangesEqual(byDay.get(day) ?? [], weekdayRanges));
  const sameWeekend =
    weekendRanges.length > 0 &&
    WEEKEND_IDS.every((day) => areMissionTimeRangesEqual(byDay.get(day) ?? [], weekendRanges));

  if (sameWeekdays && sameWeekend && areMissionTimeRangesEqual(weekdayRanges, weekendRanges)) {
    const range = weekdayRanges[0];
    if (weekdayRanges.length === 1 && range) {
      return `Lun-Dim ${range.start}-${range.end}`;
    }
  }

  if (sameWeekdays && WEEKEND_IDS.every((day) => (byDay.get(day) ?? []).length === 0)) {
    const range = weekdayRanges[0];
    if (weekdayRanges.length === 1 && range) {
      return `Lun-Ven ${range.start}-${range.end}`;
    }
  }

  if (sameWeekend && WEEKDAY_IDS.every((day) => (byDay.get(day) ?? []).length === 0)) {
    const range = weekendRanges[0];
    if (weekendRanges.length === 1 && range) {
      return `Sam-Dim ${range.start}-${range.end}`;
    }
  }

  const firstOpenDay = openDays[0];
  const firstRange = firstOpenDay.ranges[0];
  if (firstRange) {
    return `${DAY_LABELS[firstOpenDay.day]} ${firstRange.start}-${firstRange.end}`;
  }

  return `${openDays.length}/7`;
}

interface EditableProfileFieldProps {
  styles: Record<string, string>;
  label: string;
  name: string;
  value: string | number | boolean | null;
  error?: string;
  isEditing: boolean;
  isTextarea?: boolean;
  required?: boolean;
  placeholder?: string;
  type?: string;
  inputProps?: Record<string, number | string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

interface EditableProfileSectionProps {
  styles: Record<string, string>;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  sectionId?: string;
  canEdit?: boolean;
  collapsible?: boolean;
  isOpen: boolean;
  isEditing: boolean;
  isDirty: boolean;
  isLoading: boolean;
  onToggle: () => void;
  onHeaderKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onBeginEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

interface PacksTabSectionProps {
  renderSection: RenderSection;
  activeMissionServiceIds: string[];
  activeMissionServiceLabels: string[];
}

interface TeamTabSectionProps {
  renderSection: RenderSection;
  renderField: RenderField;
}

interface DocumentsTabSectionProps {
  renderSection: RenderSection;
  placeholderClassName: string;
}

interface FicheTabSectionProps {
  styles: Record<string, string>;
  ficheControls: {
    profile: ConciergeProfileDraft | null;
    avatarFile: File | null;
    defaultAvatar: string;
    sectionIds: {
      INFO_PERSO: string;
      PRESENTATION: string;
      INSPIRATION_VIDEOS: string;
    };
    setAvatarFile: (file: File | null) => void;
    handleSocialChange: (
      field: "website" | "linkedin" | "instagram" | "facebook",
      value: string,
    ) => void;
    errors: Record<string, string>;
  };
  editProfile: ConciergeProfileDraft;
  editingSection: string | null;
  renderSection: RenderSection;
  renderField: RenderField;
  formatExperienceLabel: (level: "debutant" | "intermediaire" | "experimente" | null) => string;
  setEditProfile: SetEditProfile;
  handleSaveSection: (sectionTitle: string) => void;
  beginSectionEdit: (sectionId: string) => void;
}

interface FicheSidebarCardProps {
  styles: Record<string, string>;
  profile: ConciergeProfileDraft | null;
  editProfile: ConciergeProfileDraft;
  editingSection: string | null;
  avatarFile: File | null;
  defaultAvatar: string;
  setAvatarFile: (file: File | null) => void;
  setEditProfile: SetEditProfile;
  handleSaveSection: (sectionTitle: string) => void;
  beginSectionEdit: (sectionId: string) => void;
}

interface FichePresentationSectionProps {
  styles: Record<string, string>;
  renderSection: RenderSection;
  renderField: RenderField;
  editProfile: ConciergeProfileDraft;
  setEditProfile: SetEditProfile;
  editingSection: string | null;
  sectionId: string;
}

interface FichePersonalInfoSectionProps {
  styles: Record<string, string>;
  renderSection: RenderSection;
  renderField: RenderField;
  editProfile: ConciergeProfileDraft;
  editingSection: string | null;
  sectionId: string;
  setEditProfile: SetEditProfile;
  formatExperienceLabel: (level: "debutant" | "intermediaire" | "experimente" | null) => string;
}

interface FicheSimpleSectionProps {
  renderSection: RenderSection;
  renderField: RenderField;
}

interface FicheSocialSectionProps {
  renderSection: RenderSection;
  editProfile: ConciergeProfileDraft;
  editingSection: string | null;
  beginSectionEdit: (sectionId: string) => void;
  handleSocialChange: (
    field: "website" | "linkedin" | "instagram" | "facebook",
    value: string,
  ) => void;
  errors: Record<string, string>;
}

interface FicheInspirationVideosSectionProps {
  styles: Record<string, string>;
  renderSection: RenderSection;
  editProfile: ConciergeProfileDraft;
  editingSection: string | null;
  beginSectionEdit: (sectionId: string) => void;
  setEditProfile: SetEditProfile;
  sectionId: string;
}

interface FicheStaticSidebarSectionProps {
  styles: Record<string, string>;
  profile: ConciergeProfileDraft;
  renderSection: RenderSection;
}

interface MissionsSecondaryPanelsProps {
  styles: Record<string, string>;
  missionProgressDoneCount: number;
  missionProgressTotal: number;
  showPendingMissionStepsOnly: boolean;
  setShowPendingMissionStepsOnly: React.Dispatch<React.SetStateAction<boolean>>;
  missionProgressSteps: MissionProgressStepItem[];
  openMissionSectionForEdit: (sectionId: string) => void;
  renderSection: RenderSection;
  missionQuoteControls: {
    selectedMissionQuoteId: string;
    setSelectedMissionQuoteId: React.Dispatch<React.SetStateAction<string>>;
    missionRows: MissionQuoteRowItem[];
    missionQuoteBusy: boolean;
    createQuoteFromMission: () => void;
    missionQuoteFeedback: string;
  };
}

export function EditableProfileField({
  styles,
  label,
  name,
  value,
  error,
  isEditing,
  isTextarea = false,
  required = false,
  placeholder = "",
  type = "text",
  inputProps,
  onChange,
}: EditableProfileFieldProps) {
  const isReadonlyField = name === "email";

  if (type === "checkbox") {
    return (
      <div className={styles.fieldRow}>
        <label className={styles.fieldLabel}>
          <input
            type="checkbox"
            name={name}
            checked={!!value}
            onChange={onChange}
            disabled={!isEditing}
            className={styles.checkbox}
          />
          {label}
        </label>
      </div>
    );
  }

  return (
    <div className={styles.fieldRow}>
      <label htmlFor={name} className={styles.fieldLabel}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      {isEditing && !isReadonlyField ? (
        isTextarea ? (
          <textarea
            id={name}
            name={name}
            value={(value ?? "") as string}
            onChange={onChange}
            className={styles.fieldTextarea}
            placeholder={placeholder || label}
            rows={3}
          />
        ) : (
          <InputWithValidation
            id={name}
            name={name}
            type={type}
            value={(value ?? "") as string}
            onChange={onChange}
            placeholder={placeholder || label}
            error={error || ""}
            isValid={!error && !!value}
            {...inputProps}
          />
        )
      ) : (
        <span className={styles.fieldValue}>
          {typeof value === "boolean" ? (value ? "Oui" : "Non") : value !== null && value !== "" ? value : "Non renseigné"}
        </span>
      )}
    </div>
  );
}

export function EditableProfileSection({
  styles,
  title,
  icon,
  children,
  sectionId,
  canEdit = true,
  collapsible = true,
  isOpen,
  isEditing,
  isDirty,
  isLoading,
  onToggle,
  onHeaderKeyDown,
  onBeginEdit,
  onSave,
  onCancel,
}: EditableProfileSectionProps) {
  const renderEditActions = () => (
    <>
      <button
        onClick={onSave}
        className={styles.saveBtn}
        disabled={isLoading}
        title="Sauvegarder"
        aria-label="Sauvegarder"
      >
        {isLoading ? <div className={styles.spinnerMini} /> : <Save size={16} />}
      </button>
      <button
        onClick={onCancel}
        className={styles.cancelBtn}
        title="Annuler"
        aria-label="Annuler"
      >
        <LucideX size={16} />
      </button>
    </>
  );

  return (
    <div id={sectionId} className={styles.section}>
      <div className={styles.sectionHeader}>
        {collapsible ? (
          <div
            className={styles.sectionTitleWrapper}
            onClick={onToggle}
            onKeyDown={onHeaderKeyDown}
            role="button"
            tabIndex={0}
          >
            <div className={styles.sectionTitleLeft}>
              <span className={styles.sectionIcon}>{icon}</span>
              <h2 className={styles.sectionTitle}>{title}</h2>
            </div>
            <ChevronDown
              size={16}
              className={`${styles.toggleIcon} ${isOpen ? styles.toggleIconOpen : ""}`}
            />
          </div>
        ) : (
          <div className={styles.sectionTitleWrapper}>
            <div className={styles.sectionTitleLeft}>
              <span className={styles.sectionIcon}>{icon}</span>
              <h2 className={styles.sectionTitle}>{title}</h2>
            </div>
          </div>
        )}

        {canEdit && (
          <div className={styles.sectionActions}>
            {isEditing ? (
              renderEditActions()
            ) : (
              <button
                onClick={onBeginEdit}
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
      {canEdit && isEditing && isDirty && (
        <div className={styles.unsavedBadge} role="status">
          Modifications non enregistrées
        </div>
      )}

      <div className={`${styles.sectionContent} ${isOpen ? styles.sectionContentOpen : ""}`}>
        {children}
        {canEdit && isEditing && isOpen && (
          <div className={styles.sectionActionsBottom}>{renderEditActions()}</div>
        )}
      </div>
    </div>
  );
}

interface MissionsPrimarySectionsProps {
  styles: Record<string, string>;
  renderSection: RenderSection;
  renderField: RenderField;
  sectionIds: {
    SERVICES: string;
    ZONE_RULES: string;
    WEEKLY_AVAILABILITY: string;
  };
  editingSection: string | null;
  missionPayload: MissionPayloadState;
  missionAvailability: MissionAvailabilityState;
  unrecognizedActiveMissionLabels: string[];
  removeUnrecognizedServices: () => void;
  catalogSyncBusy: boolean;
  setEditProfile: SetEditProfile;
  parseAvailabilityPayloadRaw: (value: string | null | undefined) => Record<string, unknown>;
  parseMissionPayload: (value: string | null | undefined) => MissionPayloadState;
  buildLegacyFromMissionProfile: (profile: MissionPayloadState["missionProfile"]) => {
    missionCatalog: MissionCatalogItem[];
    preferences: unknown;
  };
  toMissionTypeId: (value: string) => string;
  normalizeMissionSchedule: (
    schedule: MissionAvailability["schedule"],
  ) => MissionAvailability["schedule"];
}

interface MissionServicesSectionProps extends MissionsPrimarySectionsProps {}

interface MissionZoneRulesSectionProps {
  styles: Record<string, string>;
  renderSection: RenderSection;
  sectionId: string;
  editingSection: string | null;
  missionAvailability: MissionAvailabilityState;
  setEditProfile: SetEditProfile;
  parseAvailabilityPayloadRaw: (value: string | null | undefined) => Record<string, unknown>;
}

interface MissionWeeklyAvailabilitySectionProps {
  styles: Record<string, string>;
  renderSection: RenderSection;
  sectionId: string;
  editingSection: string | null;
  missionAvailability: MissionAvailabilityState;
  setEditProfile: SetEditProfile;
  parseAvailabilityPayloadRaw: (value: string | null | undefined) => Record<string, unknown>;
  normalizeMissionSchedule: (
    schedule: MissionAvailability["schedule"],
  ) => MissionAvailability["schedule"];
}

interface MissionProgressPanelSectionProps {
  styles: Record<string, string>;
  missionProgressDoneCount: number;
  missionProgressTotal: number;
  showPendingMissionStepsOnly: boolean;
  setShowPendingMissionStepsOnly: React.Dispatch<React.SetStateAction<boolean>>;
  missionProgressSteps: Array<{
    key: string;
    label: string;
    hint: string;
    done: boolean;
    sectionId?: string;
  }>;
  openMissionSectionForEdit: (sectionId: string) => void;
}

interface MissionQuickQuoteSectionProps {
  styles: Record<string, string>;
  renderSection: RenderSection;
  selectedMissionQuoteId: string;
  setSelectedMissionQuoteId: React.Dispatch<React.SetStateAction<string>>;
  missionRows: Array<{ id: string; title: string; status: string }>;
  missionQuoteBusy: boolean;
  createQuoteFromMission: () => void;
  missionQuoteFeedback: string;
}

interface MissionProgressControlsLike {
  missionProgressPercent: number;
  missionProgressDoneCount: number;
  missionProgressSteps: MissionProgressStepItem[];
  showPendingMissionStepsOnly: boolean;
  setShowPendingMissionStepsOnly: React.Dispatch<React.SetStateAction<boolean>>;
  openMissionSectionForEdit: (sectionId: string) => void;
}

interface MissionOverviewStatsLike {
  activeMissionRawLabels: string[];
  displayedActiveMissionCount: number;
  totalAvailableMissionCount: number;
  recognizedActiveMissionCount: number;
  unrecognizedActiveMissionLabels: string[];
  missionOpenDaysCount: number;
  missionRangesCount: number;
  missionAvailability: MissionAvailabilityState | null;
}

interface ProfileEditorControlsLike {
  editProfile: unknown;
  editingSection: string | null;
  renderSection: RenderSection;
  renderField: unknown;
  formatExperienceLabel: (level: "debutant" | "intermediaire" | "experimente" | null) => string;
  setEditProfile: unknown;
  handleSaveSection: (sectionTitle: string) => void;
  beginSectionEdit: (sectionId: string) => void;
}

interface MissionFoundationControlsLike {
  missionPayload: MissionPayloadState;
  missionAvailability: MissionAvailabilityState | null;
  unrecognizedActiveMissionLabels: string[];
  removeUnrecognizedServices: () => void;
  catalogSyncBusy: boolean;
  setEditProfile: unknown;
  parseAvailabilityPayloadRaw: (value: string | null | undefined) => Record<string, unknown>;
  parseMissionPayload: (value: string | null | undefined) => MissionPayloadState;
  buildLegacyFromMissionProfile: (profile: MissionPayloadState["missionProfile"]) => {
    missionCatalog: MissionCatalogItem[];
    preferences: unknown;
  };
  toMissionTypeId: (value: string) => string;
  normalizeMissionSchedule: (
    schedule: MissionAvailability["schedule"],
  ) => MissionAvailability["schedule"];
}

interface ConciergeProfileActiveTabContentProps {
  activeTab: ConciergeTabId;
  styles: Record<string, string>;
  ficheControls: FicheTabSectionProps["ficheControls"];
  profileEditorControls: ProfileEditorControlsLike;
  missionSectionIds: MissionsPrimarySectionsProps["sectionIds"];
  tariffSectionIds: Record<string, string>;
  missionProgressControls: MissionProgressControlsLike;
  missionOverviewStats: MissionOverviewStatsLike;
  missionQuoteControls: MissionsSecondaryPanelsProps["missionQuoteControls"];
  missionFoundationControls: MissionFoundationControlsLike;
  simpleTabControls: {
    renderSection: RenderSection;
    renderField: unknown;
    placeholderClassName: string;
    profile?: unknown;
    activeMissionServiceCatalogIds: string[];
    activeMissionServiceLabels: string[];
  };
  tariffOverviewControls: TariffOverviewControlsLike;
  tariffFoundationControls: ConciergeTariffsTabContentProps["tariffFoundationControls"];
  tariffConfigControls: ConciergeTariffsTabContentProps["tariffConfigControls"];
  pricingCatalogRows: DynamicValue;
  tariffCatalogControls: ConciergeTariffsTabContentProps["tariffCatalogControls"];
  pricingSegmentsControls: ConciergeTariffsTabContentProps["pricingSegmentsControls"];
  pricingRulesControls: ConciergeTariffsTabContentProps["pricingRulesControls"];
  pricingScenarioControls: ConciergeTariffsTabContentProps["pricingScenarioControls"];
  pricingModalControls: ConciergeTariffsTabContentProps["pricingModalControls"];
  billingDeskSectionProps: ConciergeTariffsTabContentProps["billingDeskSectionProps"];
}

interface ConciergeMissionsTabContentProps {
  styles: Record<string, string>;
  renderSection: RenderSection;
  renderField: RenderField;
  sectionIds: MissionsPrimarySectionsProps["sectionIds"];
  editingSection: string | null;
  missionProgressControls: MissionProgressControlsLike;
  missionOverviewStats: MissionOverviewStatsLike;
  missionQuoteControls: MissionsSecondaryPanelsProps["missionQuoteControls"];
  missionFoundationControls: MissionFoundationControlsLike;
}

interface TariffWorkflowSectionProps {
  styles: Record<string, string>;
  renderSection: RenderSection;
  sectionId: string;
  title: string;
  commissionRatePct: number;
  hourlyRate: number;
  configuredPricingCount: number;
  tariffReadinessPercent: number;
  pendingChecksCount: number;
  pendingChecks: Array<{ id: string; label: string }>;
  onScrollConfig: () => void;
  onScrollBilling: () => void;
  onGoToMissions: () => void;
}

interface TariffPillarsSectionProps {
  styles: Record<string, string>;
  hourlyRate: number;
  travelFee: number;
  minimumInvoice: number;
  commissionRatePct: number;
  setupFee: number;
  editingDisabled: boolean;
  onCommissionRateChange: (value: number) => void;
  onSetupFeeChange: (value: number) => void;
  configuredPricingCount: number;
  pricingCatalogRowsCount: number;
  activeMissionServiceLabelsCount: number;
}

interface TariffConfigShellProps {
  styles: Record<string, string>;
  renderSection: RenderSection;
  sectionId: string;
  children: React.ReactNode;
}

interface TariffContextSectionProps {
  styles: Record<string, string>;
  experienceLabel: string;
  locationLabel: string;
  radiusKm: number;
  urgentEnabled: boolean;
  urgentPercent: number;
  highSeasonEnabled: boolean;
  highSeasonPercent: number;
}

interface TariffBaseSectionProps {
  styles: Record<string, string>;
  renderField: RenderField;
  sectionId: string;
  editingSection: string | null;
  minimumInvoice: number;
  onMinimumInvoiceChange: (value: number) => void;
}

interface TariffModifiersSectionProps {
  styles: Record<string, string>;
  propertyTypeOptions: Array<{ key: string; label: string }>;
  getPropertyTypeDeltaPercent: (key: string) => number;
  updatePropertyTypeDeltaPercent: (key: string, value: number) => void;
  editingSection: string | null;
  sectionId: string;
  urgentPercent: number;
  nightPercent: number;
  weekendPercent: number;
  highSeasonPercent: number;
  minimumInvoice: number;
}

interface TariffBillingDeskSectionProps {
  styles: Record<string, string>;
  renderSection: RenderSection;
  sectionId: string;
  title?: string;
  collapsible?: boolean;
  missionRowsCount: number;
  deskProps: {
    hourlyRate: number;
    travelFee: number;
    minimumInvoice: number;
    urgentPercent: number;
    nightPercent: number;
    weekendPercent: number;
    highSeasonPercent: number;
    commissionRatePct: number;
    setupFee: number;
    presetVersion: number;
    presetMonthlyRevenueEstimate: number;
    presetNewListingsEstimate: number;
    presetActServicesEstimate: number;
  };
}

interface TariffPricingModalProps {
  styles: Record<string, string>;
  isOpen: boolean;
  state: PricingModalState;
  catalogServices: Array<{ id: number; service: string }>;
  saving: boolean;
  canEdit: boolean;
  error: string;
  pricingUnitOptions: readonly string[];
  closeModal: () => void;
  saveServicePrice: () => void;
  resetState: () => void;
  setState: React.Dispatch<React.SetStateAction<PricingModalState>>;
}

interface TariffServicesCatalogSectionProps {
  styles: Record<string, string>;
  configuredPricingCount: number;
  pricingCatalogRowsCount: number;
  pricingSortMode: "category" | "service";
  setPricingSortMode: React.Dispatch<React.SetStateAction<"category" | "service">>;
  showAllPricingServices: boolean;
  setShowAllPricingServices: React.Dispatch<React.SetStateAction<boolean>>;
  canEditTariffConfig: boolean;
  servicePricesCount: number;
  servicePricesBusyId: string | null;
  servicePricesLoading: boolean;
  visiblePricingCatalogRowsCount: number;
  groupedPricingCatalogRows: Array<{
    category: string;
    rows: Array<{
      service: { id: number; service: string };
      pricing: { amount: number; unit: string | null } | null;
      isActiveMissionService: boolean;
    }>;
  }>;
  collapsedPricingCategories: Record<string, boolean>;
  togglePricingCategory: (category: string) => void;
  pricingServiceActions: {
    openCreatePricingModal: (service?: { id: number; service: string }) => void;
    openEditPricingModal: (pricing: PricingCatalogRow) => void;
    deleteServicePrice: (pricing: PricingCatalogRow) => void;
    resetAllServicePrices: () => void;
  };
}

interface TariffSegmentsSectionProps {
  styles: Record<string, string>;
  canEditTariffConfig: boolean;
  segmentDraft: PricingSegmentDraft;
  setSegmentDraft: React.Dispatch<React.SetStateAction<PricingSegmentDraft>>;
  segmentsBusyId: string | null;
  createPricingSegment: () => void;
  segmentsLoading: boolean;
  pricingSegments: PricingSegment[];
  setPricingSegments: React.Dispatch<React.SetStateAction<PricingSegment[]>>;
  updatePricingSegment: (segment: PricingSegment) => void;
  deletePricingSegment: (id: string) => void;
}

interface TariffPropertyRulesSectionProps {
  styles: Record<string, string>;
  canEditTariffConfig: boolean;
  propertyRuleDraft: PricingPropertyRuleDraft;
  setPropertyRuleDraft: React.Dispatch<React.SetStateAction<PricingPropertyRuleDraft>>;
  propertyRulesBusyId: string | null;
  createPricingPropertyRule: () => void;
  propertyRulesLoading: boolean;
  propertyRules: PricingPropertyRule[];
  setPropertyRules: React.Dispatch<React.SetStateAction<PricingPropertyRule[]>>;
  updatePricingPropertyRule: (rule: PricingPropertyRule) => void;
  deletePricingPropertyRule: (id: string) => void;
  catalogServices: Array<{ id: number; service: string }>;
}

interface TariffStrategySectionProps {
  styles: Record<string, string>;
  strategySim: PricingStrategySim;
  setStrategySim: React.Dispatch<React.SetStateAction<PricingStrategySim>>;
  pricingSegments: PricingSegment[];
  catalogServices: Array<{ id: number; service: string }>;
  propertyTypeOptions: Array<{ key: string; label: string }>;
  applyStrategyProjectionToBillingDesk: () => void;
  scenarioDraftName: string;
  setScenarioDraftName: React.Dispatch<React.SetStateAction<string>>;
  canEditTariffConfig: boolean;
  scenariosBusyId: string | null;
  createPricingScenario: () => void;
  resetStrategySim: () => void;
  scenariosLoading: boolean;
  pricingScenarios: PricingScenario[];
  loadPricingScenario: (row: PricingScenario) => void;
  setDefaultPricingScenario: (row: PricingScenario) => void;
  deletePricingScenario: (id: string) => void;
  selectedPricingSegmentName: string;
  strategyProjection: {
    commissionEffectivePct: number;
    total: number;
    commissionAmount: number;
    setupAmount: number;
    actAmount: number;
    narrative: string;
  };
  formatCurrency: (value: number, currency?: string) => string;
}

export function PacksTabSection({
  renderSection,
  activeMissionServiceIds,
  activeMissionServiceLabels,
}: PacksTabSectionProps) {
  return (
    <div>
      {renderSection(
        "Composer l'offre",
        <FiBriefcase />,
        <>
          <p>
            Sélectionnez les services inclus, donnez un nom clair à l&apos;offre, puis reliez-la aux tarifs et contrats.
          </p>
          <ServicePackageManager
            activeMissionServiceIds={activeMissionServiceIds}
            activeMissionServiceLabels={activeMissionServiceLabels}
          />
        </>,
        false,
      )}
    </div>
  );
}

export function TeamTabSection({
  renderSection,
  renderField,
}: TeamTabSectionProps) {
  return (
    <>
      {renderSection(
        "Mon équipe",
        <FiUsers />,
        <div>
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
}

export function ConciergeTeamTabContent(props: TeamTabSectionProps) {
  return <TeamTabSection {...props} />;
}

export function DocumentsTabSection({
  renderSection,
  placeholderClassName,
}: DocumentsTabSectionProps) {
  return (
    <>
      {renderSection(
        "Documents professionnels",
        <FiFile />,
        <div className={placeholderClassName}>
          <p>Section en cours de développement</p>
          <p>Gérez vos documents professionnels (kbis, assurances, etc.).</p>
        </div>,
      )}

      {renderSection(
        "Avis clients",
        <FiStarOutline />,
        <div className={placeholderClassName}>
          <p>Section en cours de développement</p>
          <p>Consultez les avis de vos clients ici.</p>
        </div>,
      )}
    </>
  );
}

export function ConciergeDocumentsTabContent(props: DocumentsTabSectionProps) {
  return <DocumentsTabSection {...props} />;
}

export function ConciergeProfileActiveTabContent({
  activeTab,
  styles,
  ficheControls,
  profileEditorControls,
  missionSectionIds,
  tariffSectionIds,
  missionProgressControls,
  missionOverviewStats,
  missionQuoteControls,
  missionFoundationControls,
  simpleTabControls,
  tariffOverviewControls,
  tariffFoundationControls,
  tariffConfigControls,
  pricingCatalogRows,
  tariffCatalogControls,
  pricingSegmentsControls,
  pricingRulesControls,
  pricingScenarioControls,
  pricingModalControls,
  billingDeskSectionProps,
}: ConciergeProfileActiveTabContentProps) {
  if (!ficheControls?.profile || !profileEditorControls?.editProfile) return null;

  const profileCompletion = buildConciergeProfileCompletion(ficheControls.profile);
  const profileMissingItems = profileCompletion.missingItems.slice(0, 5);
  const tabActions = [
    { label: "Vue d'ensemble", href: "/dashboard/concierge/profile" },
    { label: "Fiche", href: "/dashboard/concierge/profile?tab=fiche" },
    { label: "Missions", href: "/dashboard/concierge/profile?tab=missions" },
    { label: "Packs", href: "/dashboard/concierge/profile?tab=packs" },
    { label: "Tarifs", href: "/dashboard/concierge/profile?tab=tarifs" },
    { label: "Devis", href: "/dashboard/concierge/profile?tab=devis" },
    { label: "Équipe", href: "/dashboard/concierge/profile?tab=equipe" },
    { label: "Documents", href: "/dashboard/concierge/profile?tab=documents" },
  ];
  const profileDetailSections = [
    {
      id: "profil",
      title: "Éléments à compléter",
      description: "Les points qui améliorent directement la crédibilité du profil.",
      emptyText: "Le profil est complet sur les points principaux.",
      items: profileMissingItems.map((item) => ({
        title: item,
        meta: "À compléter",
        description: "Complétez cette information depuis l'onglet Fiche pour renforcer la visibilité du profil.",
        action: { label: "Ouvrir la fiche", href: "/dashboard/concierge/profile?tab=fiche" },
      })),
    },
    {
      id: "navigation",
      title: "Onglets du profil",
      description: "Chaque onglet garde son rôle, avec la même lecture opérationnelle.",
      emptyText: "Aucun onglet disponible.",
      items: tabActions.map((action) => ({
        title: action.label,
        meta: "Onglet",
        description: "Accéder directement à cette partie du profil concierge.",
        action,
      })),
    },
  ];
  const wrapProfileTab = ({
    title,
    description,
    metrics,
    focus,
    risks,
    cadence,
    detailsBadge = "Profil",
    detailsTitle = "Sections liées",
    detailsDescription = "Cliquez sur un indicateur pour isoler les informations utiles de cet onglet.",
    detailSections = profileDetailSections,
    showDetails,
    illustration,
    children,
  }: {
    title: string;
    description: string;
    metrics: React.ComponentProps<typeof DashboardOperationalPage>["metrics"];
    focus: React.ComponentProps<typeof DashboardOperationalPage>["focus"];
    risks: React.ComponentProps<typeof DashboardOperationalPage>["risks"];
    cadence: React.ComponentProps<typeof DashboardOperationalPage>["cadence"];
    detailsBadge?: string;
    detailsTitle?: string;
    detailsDescription?: string;
    detailSections?: React.ComponentProps<typeof DashboardOperationalPage>["detailSections"];
    showDetails?: React.ComponentProps<typeof DashboardOperationalPage>["showDetails"];
    illustration?: React.ComponentProps<typeof DashboardOperationalPage>["illustration"];
    children: React.ReactNode;
  }) => (
    <DashboardOperationalPage
      tone="concierge"
      badge="Vue opérationnelle"
      title={title}
      description={description}
      primaryActions={tabActions}
      metrics={metrics}
      focus={focus}
      risks={risks}
      cadenceTitle="Cadence de pilotage"
      cadence={cadence}
      detailsBadge={detailsBadge}
      detailsTitle={detailsTitle}
      detailsDescription={detailsDescription}
      detailSections={detailSections}
      showDetails={showDetails}
      illustration={illustration}
    >
      <DashboardPanel title={title} className={styles.operationalPanel}>
        {children}
      </DashboardPanel>
    </DashboardOperationalPage>
  );
  switch (activeTab) {
    case "overview":
      return wrapProfileTab({
        title: "Profil concierge",
        description: "Suivez la complétion du profil, les informations publiques et les onglets à maintenir pour une présence professionnelle.",
        metrics: [
          { label: "Complétion", value: `${profileCompletion.percentage}%`, hint: `${profileCompletion.completedCount}/${profileCompletion.totalCount} éléments`, detailSectionId: "profil" },
          { label: "Manquants", value: String(profileMissingItems.length), hint: "Points à compléter", detailSectionId: "profil" },
          { label: "Onglets", value: String(tabActions.length), hint: "Espaces du profil", detailSectionId: "navigation" },
          { label: "Statut", value: profileCompletion.percentage >= 90 ? "Prêt" : "À faire", hint: "Visibilité profil", detailSectionId: "profil" },
        ],
        focus: {
          title: "Priorité profil",
          status: profileCompletion.percentage >= 90 ? "Prêt" : "À compléter",
          statusVariant: profileCompletion.percentage >= 90 ? "success" : "warning",
          icon: profileCompletion.percentage >= 90 ? <BadgeCheck size={28} /> : <ClipboardCheck size={28} />,
          heading: profileMissingItems[0] ?? "Profil bien renseigné",
          description: profileMissingItems.length > 0
            ? "Complétez les informations manquantes pour renforcer la confiance propriétaire."
            : "Votre profil est prêt, pensez à le relire régulièrement.",
          action: { label: "Compléter ma fiche", href: "/dashboard/concierge/profile?tab=fiche" },
        },
        risks: [
          { label: "Fiche", value: `${profileCompletion.percentage}%`, hint: "Complétion", icon: UserRound, tone: profileCompletion.percentage >= 90 ? "success" : "warning", detailSectionId: "profil" },
          { label: "Documents", value: "Avis", hint: "Justificatifs", icon: FileText, tone: "info", detailSectionId: "navigation" },
          { label: "Missions", value: `${missionProgressControls.missionProgressPercent}%`, hint: "Configuration", icon: ClipboardCheck, tone: missionProgressControls.missionProgressPercent >= 90 ? "success" : "warning", detailSectionId: "navigation" },
          { label: "Tarifs", value: `${tariffOverviewControls.tariffReadinessPercent}%`, hint: "Prêts", icon: Building2, tone: tariffOverviewControls.tariffReadinessPercent >= 90 ? "success" : "warning", detailSectionId: "navigation" },
        ],
        cadence: [
          { label: "Aujourd'hui", text: "Traiter les champs manquants les plus visibles.", icon: ClipboardCheck },
          { label: "Cette semaine", text: "Relire missions, tarifs et documents associés.", icon: ShieldCheck },
          { label: "Chaque mois", text: "Actualiser expérience, présentation et preuves de confiance.", icon: Sparkles },
        ],
        showDetails: false,
        illustration: { mainIcon: UserRound, topLeftIcon: BadgeCheck, topRightIcon: FileText },
        children: (
          <ProfileOverviewWorkspace
          tone="concierge"
          eyebrow="Pilotage du profil"
          title="Profil"
          description="Cette vue rassemble uniquement l'état de votre profil concierge. Les autres onglets servent à compléter votre fiche, vos justificatifs et votre présence publique."
          chips={["Vue synthèse", "Profil", "Fiche visible"]}
          actions={[
            {
              label: "Fiche & Infos",
              href: "/dashboard/concierge/profile?tab=fiche",
              variant: "primary",
            },
            {
              label: "Documents & Avis",
              href: "/dashboard/concierge/profile?tab=documents",
              variant: "secondary",
            },
          ]}
          card={{
            title: "Profil",
            description:
              "Complétez votre fiche pour renforcer votre visibilité et débloquer les étapes de vérification.",
            percentage: profileCompletion.percentage,
            completedCount: profileCompletion.completedCount,
            totalCount: profileCompletion.totalCount,
            missingItems: profileCompletion.missingItems,
            actionLabel: "Compléter ma fiche",
            actionHref: "/dashboard/concierge/profile?tab=fiche",
          }}
          />
        ),
      });
    case "fiche":
      return (
        <ConciergeFicheTabContent
          styles={styles}
          ficheControls={ficheControls}
          editProfile={profileEditorControls.editProfile}
          editingSection={profileEditorControls.editingSection}
          renderSection={profileEditorControls.renderSection}
          renderField={profileEditorControls.renderField as RenderField}
          formatExperienceLabel={profileEditorControls.formatExperienceLabel}
          setEditProfile={profileEditorControls.setEditProfile as SetEditProfile}
          handleSaveSection={profileEditorControls.handleSaveSection}
          beginSectionEdit={profileEditorControls.beginSectionEdit}
        />
      );
    case "missions":
      return wrapProfileTab({
        title: "Profil missions",
        description: "Configurez les prestations acceptées, la couverture et les disponibilités qui alimentent vos missions.",
        metrics: [
          { label: "Progression", value: `${missionProgressControls.missionProgressPercent}%`, hint: `${missionProgressControls.missionProgressDoneCount}/${missionProgressControls.missionProgressSteps.length} étapes`, detailSectionId: "progression", href: `/dashboard/concierge/profile?tab=missions#${missionProgressControls.missionProgressSteps.find((step) => !step.done)?.sectionId ?? missionSectionIds.SERVICES}` },
          { label: "Services", value: String(missionOverviewStats.displayedActiveMissionCount), hint: "Prestations acceptées", detailSectionId: "services", href: `/dashboard/concierge/profile?tab=missions#${missionSectionIds.SERVICES}` },
          { label: "Zones", value: String(missionOverviewStats.missionAvailability?.zones.length ?? 0), hint: "Couverture terrain", detailSectionId: "zone", href: `/dashboard/concierge/profile?tab=missions#${missionSectionIds.ZONE_RULES}` },
          { label: "Horaires", value: `${missionOverviewStats.missionOpenDaysCount}/7`, hint: `${missionOverviewStats.missionRangesCount} plage(s)`, detailSectionId: "disponibilites", href: `/dashboard/concierge/profile?tab=missions#${missionSectionIds.WEEKLY_AVAILABILITY}` },
        ],
        focus: {
          title: "Priorité missions",
          status: missionProgressControls.missionProgressPercent >= 90 ? "Prêt" : "À configurer",
          statusVariant: missionProgressControls.missionProgressPercent >= 90 ? "success" : "warning",
          icon: <ClipboardCheck size={28} />,
          heading: missionProgressControls.missionProgressSteps.find((step) => !step.done)?.label ?? "Configuration missions prête",
          description: "Gardez services, zone et disponibilités cohérents avec votre capacité réelle.",
          action: {
            label: "Configurer cette partie",
            href: `/dashboard/concierge/profile?tab=missions#${missionProgressControls.missionProgressSteps.find((step) => !step.done)?.sectionId ?? missionSectionIds.SERVICES}`,
          },
        },
        risks: [
          { label: "Services", value: missionOverviewStats.displayedActiveMissionCount, hint: "Actifs", icon: ClipboardCheck, tone: missionOverviewStats.displayedActiveMissionCount > 0 ? "success" : "warning", detailSectionId: "services", href: `/dashboard/concierge/profile?tab=missions#${missionSectionIds.SERVICES}` },
          { label: "Zone", value: missionOverviewStats.missionAvailability?.zones.length ?? 0, hint: "Zones", icon: MapPinned, tone: (missionOverviewStats.missionAvailability?.zones.length ?? 0) > 0 ? "success" : "warning", detailSectionId: "zone", href: `/dashboard/concierge/profile?tab=missions#${missionSectionIds.ZONE_RULES}` },
          { label: "Planning", value: `${missionOverviewStats.missionOpenDaysCount}/7`, hint: "Jours ouverts", icon: ClipboardCheck, tone: missionOverviewStats.missionOpenDaysCount > 0 ? "success" : "warning", detailSectionId: "disponibilites", href: `/dashboard/concierge/profile?tab=missions#${missionSectionIds.WEEKLY_AVAILABILITY}` },
          { label: "Catalogue", value: missionOverviewStats.unrecognizedActiveMissionLabels.length, hint: "À nettoyer", icon: ShieldCheck, tone: missionOverviewStats.unrecognizedActiveMissionLabels.length > 0 ? "warning" : "success", detailSectionId: "services", href: `/dashboard/concierge/profile?tab=missions#${missionSectionIds.SERVICES}` },
        ],
        cadence: [
          { label: "Aujourd'hui", text: "Finaliser les étapes missions incomplètes.", icon: ClipboardCheck },
          { label: "Cette semaine", text: "Adapter zone et horaires à la charge terrain.", icon: MapPinned },
          { label: "Avant publication", text: "Relire les services visibles et les règles d'urgence.", icon: ShieldCheck },
        ],
        detailsBadge: "Missions",
        detailsTitle: "Configuration missions",
        detailsDescription: "Chaque bloc renvoie vers la section d'édition qui pilote vos missions terrain.",
        showDetails: false,
        detailSections: [
          {
            id: "progression",
            title: "Étapes de configuration",
            description: "Points nécessaires pour rendre le profil missions exploitable.",
            emptyText: "Toutes les étapes missions sont configurées.",
            items: missionProgressControls.missionProgressSteps
              .filter((step) => !step.done)
              .map((step) => ({
                title: step.label,
                meta: "À configurer",
                description: step.hint,
                action: {
                  label: "Configurer",
                  href: `/dashboard/concierge/profile?tab=missions#${step.sectionId ?? missionSectionIds.SERVICES}`,
                },
              })),
          },
          {
            id: "services",
            title: "Services acceptés",
            description: "Prestations visibles dans votre profil missions.",
            emptyText: "Aucun service actif pour le moment.",
            items: missionOverviewStats.activeMissionRawLabels.map((label) => ({
              title: label,
              meta: "Actif",
              description: "Service proposé aux propriétaires dans le cadre des missions.",
              action: { label: "Modifier", href: `/dashboard/concierge/profile?tab=missions#${missionSectionIds.SERVICES}` },
            })),
          },
          {
            id: "zone",
            title: "Zone d'intervention",
            description: "Couverture géographique utilisée pour qualifier les demandes.",
            emptyText: "Aucune zone d'intervention configurée.",
            items: (missionOverviewStats.missionAvailability?.zones ?? []).map((zone) => ({
              title: zone.label,
              meta: `${missionOverviewStats.missionAvailability?.radiusKm ?? 0} km`,
              description: "Zone active pour vos missions concierge.",
              action: { label: "Ajuster", href: `/dashboard/concierge/profile?tab=missions#${missionSectionIds.ZONE_RULES}` },
            })),
          },
          {
            id: "disponibilites",
            title: "Disponibilités hebdomadaires",
            description: "Créneaux utilisés pour cadrer les missions et urgences.",
            emptyText: "Aucune disponibilité hebdomadaire configurée.",
            items: (missionOverviewStats.missionAvailability?.schedule ?? [])
              .filter((day) => day.ranges.length > 0)
              .map((day) => ({
                title: DAY_LABELS[day.day],
                meta: `${day.ranges.length} plage(s)`,
                description: day.ranges.map((range) => `${range.start}-${range.end}`).join(", "),
                action: { label: "Ajuster", href: `/dashboard/concierge/profile?tab=missions#${missionSectionIds.WEEKLY_AVAILABILITY}` },
              })),
          },
        ],
        illustration: { mainIcon: ClipboardCheck, topLeftIcon: MapPinned, topRightIcon: ShieldCheck },
        children: (
        <ConciergeMissionsTabContent
          styles={styles}
          renderSection={profileEditorControls.renderSection}
          renderField={profileEditorControls.renderField as RenderField}
          sectionIds={missionSectionIds}
          editingSection={profileEditorControls.editingSection}
          missionProgressControls={missionProgressControls}
          missionOverviewStats={missionOverviewStats}
          missionQuoteControls={missionQuoteControls}
          missionFoundationControls={missionFoundationControls}
        />
        ),
      });
    case "packs":
      return wrapProfileTab({
        title: "Atelier packs",
        description: "Composez une offre prête à vendre en sélectionnant les services inclus, la promesse commerciale et les éléments à relier aux tarifs.",
        metrics: [
          {
            label: "Services disponibles",
            value: String(simpleTabControls.activeMissionServiceLabels.length),
            hint: "À inclure dans le pack",
            href: "/dashboard/concierge/profile?tab=missions",
          },
          {
            label: "Pack",
            value: "Offre",
            hint: "Offre en construction",
          },
          {
            label: "Catalogue",
            value: String(simpleTabControls.activeMissionServiceCatalogIds.length),
            hint: "Services reliés",
          },
          {
            label: "Statut",
            value: simpleTabControls.activeMissionServiceLabels.length > 0 ? "Prêt" : "À préparer",
            hint: "Composition",
          },
        ],
        focus: {
          title: "Priorité atelier",
          status: simpleTabControls.activeMissionServiceLabels.length > 0 ? "Base prête" : "Services requis",
          statusVariant: simpleTabControls.activeMissionServiceLabels.length > 0 ? "success" : "warning",
          icon: <Building2 size={28} />,
          heading:
            simpleTabControls.activeMissionServiceLabels.length > 0
              ? "Composer un pack clair"
              : "Configurer les services missions",
          description:
            "Un bon pack se lit vite : un nom explicite, quelques services inclus, une promesse propriétaire et des limites faciles à comprendre.",
          action: {
            label:
              simpleTabControls.activeMissionServiceLabels.length > 0
                ? "Composer l'offre"
                : "Configurer les services",
            href:
              simpleTabControls.activeMissionServiceLabels.length > 0
                ? "/dashboard/concierge/profile?tab=packs"
                : "/dashboard/concierge/profile?tab=missions",
          },
        },
        risks: [
          {
            label: "Services",
            value: simpleTabControls.activeMissionServiceLabels.length,
            hint: "Actifs",
            icon: ClipboardCheck,
            tone: simpleTabControls.activeMissionServiceLabels.length > 0 ? "success" : "warning",
            href: "/dashboard/concierge/profile?tab=missions",
          },
          {
            label: "Promesse",
            value: "Claire",
            hint: "À formuler",
            icon: Sparkles,
            tone: "info",
          },
          {
            label: "Tarifs",
            value: `${tariffOverviewControls.tariffReadinessPercent}%`,
            hint: "Cohérence prix",
            icon: Building2,
            tone: tariffOverviewControls.tariffReadinessPercent >= 90 ? "success" : "warning",
            href: "/dashboard/concierge/profile?tab=tarifs",
          },
          {
            label: "Devis",
            value: "Reliés",
            hint: "Conversion",
            icon: FileText,
            tone: "info",
            href: "/dashboard/concierge/profile?tab=devis",
          },
        ],
        cadence: [
          { label: "Étape 1", text: "Choisir les services inclus dans le pack.", icon: ClipboardCheck },
          { label: "Étape 2", text: "Nommer l'offre et clarifier sa promesse propriétaire.", icon: Sparkles },
          { label: "Étape 3", text: "Relier le pack aux tarifs et contrats avant publication.", icon: ShieldCheck },
        ],
        showDetails: false,
        illustration: { mainIcon: Building2, topLeftIcon: Sparkles, topRightIcon: ClipboardCheck },
        children: (
          <ConciergePacksTabContent
            styles={styles}
            renderSection={simpleTabControls.renderSection}
            activeMissionServiceIds={simpleTabControls.activeMissionServiceCatalogIds}
            activeMissionServiceLabels={simpleTabControls.activeMissionServiceLabels}
          />
        ),
      });
    case "tarifs":
      return wrapProfileTab({
        title: "Tarifs concierge",
        description: "Pilotez les bases tarifaires, les règles de variation et la cohérence prix avant publication.",
        metrics: [
          { label: "Préparation", value: `${tariffOverviewControls.tariffReadinessPercent}%`, hint: "Tarifs prêts" },
          { label: "Prix configurés", value: String(tariffOverviewControls.configuredPricingCount), hint: "Lignes actives" },
          { label: "Services", value: String(simpleTabControls.activeMissionServiceLabels.length), hint: "Prestations reliées", href: "/dashboard/concierge/profile?tab=missions" },
          { label: "À traiter", value: String(tariffOverviewControls.pendingTariffReadinessChecks.length), hint: "Contrôles restants" },
        ],
        focus: {
          title: "Priorité tarifs",
          status: tariffOverviewControls.tariffReadinessPercent >= 90 ? "Prêt" : "À compléter",
          statusVariant: tariffOverviewControls.tariffReadinessPercent >= 90 ? "success" : "warning",
          icon: <Building2 size={28} />,
          heading: tariffOverviewControls.pendingTariffReadinessChecks[0]?.label ?? "Tarifs cohérents",
          description: "Gardez des tarifs lisibles, reliés aux services actifs et faciles à transformer en devis.",
          action: { label: "Configurer les tarifs", href: "/dashboard/concierge/profile?tab=tarifs" },
        },
        risks: [
          { label: "Base", value: `${tariffOverviewControls.tariffReadinessPercent}%`, hint: "Préparation", icon: ClipboardCheck, tone: tariffOverviewControls.tariffReadinessPercent >= 90 ? "success" : "warning" },
          { label: "Services", value: simpleTabControls.activeMissionServiceLabels.length, hint: "Reliés", icon: ShieldCheck, tone: simpleTabControls.activeMissionServiceLabels.length > 0 ? "success" : "warning", href: "/dashboard/concierge/profile?tab=missions" },
          { label: "Packs", value: "Offres", hint: "À aligner", icon: Building2, tone: "info", href: "/dashboard/concierge/profile?tab=packs" },
          { label: "Devis", value: "Simulation", hint: "Conversion", icon: FileText, tone: "info", href: "/dashboard/concierge/profile?tab=devis" },
        ],
        cadence: [
          { label: "Aujourd'hui", text: "Compléter les prix manquants sur les services vendus.", icon: ClipboardCheck },
          { label: "Cette semaine", text: "Vérifier les majorations, frais et minimums facturables.", icon: ShieldCheck },
          { label: "Avant devis", text: "Comparer les tarifs avec les packs et les conditions terrain.", icon: Sparkles },
        ],
        showDetails: false,
        illustration: { mainIcon: Building2, topLeftIcon: ClipboardCheck, topRightIcon: FileText },
        children: (
          <ConciergeTariffsTabContent
            styles={styles}
            renderSection={profileEditorControls.renderSection}
            sectionIds={tariffSectionIds}
            mode="tarifs"
            tariffOverviewControls={tariffOverviewControls}
            tariffFoundationControls={tariffFoundationControls}
            tariffConfigControls={tariffConfigControls}
            editingSection={profileEditorControls.editingSection}
            pricingCatalogRows={pricingCatalogRows}
            activeMissionServiceLabels={simpleTabControls.activeMissionServiceLabels}
            renderField={profileEditorControls.renderField as RenderField}
            tariffCatalogControls={tariffCatalogControls}
            pricingSegmentsControls={pricingSegmentsControls}
            pricingRulesControls={pricingRulesControls}
            pricingScenarioControls={pricingScenarioControls}
            pricingModalControls={pricingModalControls}
            billingDeskSectionProps={billingDeskSectionProps}
            formatExperienceLabel={profileEditorControls.formatExperienceLabel}
          />
        ),
      });
    case "devis":
      return wrapProfileTab({
        title: "Devis concierge",
        description: "Préparez les simulations, scénarios et éléments de facturation qui transforment une demande en proposition claire.",
        metrics: [
          { label: "Tarifs", value: `${tariffOverviewControls.tariffReadinessPercent}%`, hint: "Base prête", href: "/dashboard/concierge/profile?tab=tarifs" },
          { label: "Services", value: String(simpleTabControls.activeMissionServiceLabels.length), hint: "Prestations devisables", href: "/dashboard/concierge/profile?tab=missions" },
          { label: "Contrôles", value: String(tariffOverviewControls.pendingTariffReadinessChecks.length), hint: "À finaliser" },
          { label: "Statut", value: tariffOverviewControls.tariffReadinessPercent >= 90 ? "Prêt" : "À préparer", hint: "Création devis" },
        ],
        focus: {
          title: "Priorité devis",
          status: tariffOverviewControls.tariffReadinessPercent >= 90 ? "Prêt" : "Tarifs requis",
          statusVariant: tariffOverviewControls.tariffReadinessPercent >= 90 ? "success" : "warning",
          icon: <FileText size={28} />,
          heading: tariffOverviewControls.pendingTariffReadinessChecks[0]?.label ?? "Base de devis exploitable",
          description: "Un devis fiable dépend de tarifs complets, de services actifs et de conditions de mission explicites.",
          action: { label: "Préparer les devis", href: "/dashboard/concierge/profile?tab=devis" },
        },
        risks: [
          { label: "Tarifs", value: `${tariffOverviewControls.tariffReadinessPercent}%`, hint: "Prêts", icon: Building2, tone: tariffOverviewControls.tariffReadinessPercent >= 90 ? "success" : "warning", href: "/dashboard/concierge/profile?tab=tarifs" },
          { label: "Services", value: simpleTabControls.activeMissionServiceLabels.length, hint: "Actifs", icon: ClipboardCheck, tone: simpleTabControls.activeMissionServiceLabels.length > 0 ? "success" : "warning", href: "/dashboard/concierge/profile?tab=missions" },
          { label: "Scénarios", value: "Test", hint: "Simulation", icon: Sparkles, tone: "info" },
          { label: "Facturation", value: "Base", hint: "À vérifier", icon: ShieldCheck, tone: "info" },
        ],
        cadence: [
          { label: "Aujourd'hui", text: "Vérifier les services et tarifs nécessaires à un devis propre.", icon: ClipboardCheck },
          { label: "Cette semaine", text: "Tester un scénario type propriétaire avec frais, urgences et options.", icon: Sparkles },
          { label: "Avant envoi", text: "Relire le total, les conditions et les limites de prestation.", icon: ShieldCheck },
        ],
        showDetails: false,
        illustration: { mainIcon: FileText, topLeftIcon: Building2, topRightIcon: Sparkles },
        children: (
          <ConciergeTariffsTabContent
            styles={styles}
            renderSection={profileEditorControls.renderSection}
            sectionIds={tariffSectionIds}
            mode="devis"
            tariffOverviewControls={tariffOverviewControls}
            tariffFoundationControls={tariffFoundationControls}
            tariffConfigControls={tariffConfigControls}
            editingSection={profileEditorControls.editingSection}
            pricingCatalogRows={pricingCatalogRows}
            activeMissionServiceLabels={simpleTabControls.activeMissionServiceLabels}
            renderField={profileEditorControls.renderField as RenderField}
            tariffCatalogControls={tariffCatalogControls}
            pricingSegmentsControls={pricingSegmentsControls}
            pricingRulesControls={pricingRulesControls}
            pricingScenarioControls={pricingScenarioControls}
            pricingModalControls={pricingModalControls}
            billingDeskSectionProps={billingDeskSectionProps}
            formatExperienceLabel={profileEditorControls.formatExperienceLabel}
          />
        ),
      });
    case "equipe":
      return wrapProfileTab({
        title: "Équipe concierge",
        description: "Préparez l'organisation, les zones et les relais qui soutiennent vos missions terrain.",
        metrics: [
          { label: "Équipe", value: "À structurer", hint: "Collaborateurs" },
          { label: "Zone", value: missionOverviewStats.missionAvailability?.zones[0]?.label ?? "À définir", hint: "Couverture" },
          { label: "Missions", value: `${missionProgressControls.missionProgressPercent}%`, hint: "Configuration", href: "/dashboard/concierge/profile?tab=missions" },
          { label: "Profil", value: `${profileCompletion.percentage}%`, hint: "Base publique", href: "/dashboard/concierge/profile?tab=fiche" },
        ],
        focus: {
          title: "Priorité équipe",
          status: "À structurer",
          statusVariant: "info",
          icon: <UserRound size={28} />,
          heading: "Clarifier les relais opérationnels",
          description: "L'équipe doit rester reliée aux zones, disponibilités et types de missions réellement acceptés.",
          action: { label: "Voir les missions", href: "/dashboard/concierge/profile?tab=missions" },
        },
        risks: [
          { label: "Zones", value: missionOverviewStats.missionAvailability?.zones.length ?? 0, hint: "Couverture", icon: MapPinned, tone: (missionOverviewStats.missionAvailability?.zones.length ?? 0) > 0 ? "success" : "warning", href: "/dashboard/concierge/profile?tab=missions" },
          { label: "Horaires", value: `${missionOverviewStats.missionOpenDaysCount}/7`, hint: "Ouverture", icon: ClipboardCheck, tone: missionOverviewStats.missionOpenDaysCount > 0 ? "success" : "warning", href: "/dashboard/concierge/profile?tab=missions" },
          { label: "Documents", value: "À venir", hint: "Confiance", icon: FileText, tone: "info", href: "/dashboard/concierge/profile?tab=documents" },
          { label: "Fiche", value: `${profileCompletion.percentage}%`, hint: "Crédibilité", icon: BadgeCheck, tone: profileCompletion.percentage >= 90 ? "success" : "warning", href: "/dashboard/concierge/profile?tab=fiche" },
        ],
        cadence: [
          { label: "Aujourd'hui", text: "Vérifier que la zone d'intervention correspond à la capacité réelle.", icon: MapPinned },
          { label: "Cette semaine", text: "Préparer les rôles, relais et disponibilités nécessaires.", icon: UserRound },
          { label: "Avant croissance", text: "Relier équipe, missions, documents et responsabilités.", icon: ShieldCheck },
        ],
        showDetails: false,
        illustration: { mainIcon: UserRound, topLeftIcon: MapPinned, topRightIcon: ShieldCheck },
        children: (
          <ConciergeTeamTabContent
            renderSection={profileEditorControls.renderSection}
            renderField={profileEditorControls.renderField as RenderField}
          />
        ),
      });
    case "documents":
      return wrapProfileTab({
        title: "Documents & avis",
        description: "Centralisez les justificatifs professionnels, les preuves de confiance et les avis clients liés à votre profil.",
        metrics: [
          { label: "Documents", value: "2", hint: "Espaces prévus", detailSectionId: "documents" },
          { label: "Avis", value: "À venir", hint: "Retours clients", detailSectionId: "avis" },
          { label: "Profil", value: `${profileCompletion.percentage}%`, hint: "Complétion", detailSectionId: "profil" },
          { label: "Statut", value: "Préparation", hint: "Module documents", detailSectionId: "documents" },
        ],
        focus: {
          title: "Priorité documents",
          status: "À structurer",
          statusVariant: "info",
          icon: <FileText size={28} />,
          heading: "Justificatifs professionnels",
          description: "Préparez les documents qui rassurent les propriétaires : assurance, Kbis, certifications et preuves d'activité.",
          action: { label: "Revenir à la fiche", href: "/dashboard/concierge/profile?tab=fiche" },
        },
        risks: [
          { label: "Assurance", value: "RC Pro", hint: "À déposer", icon: ShieldCheck, tone: "info", detailSectionId: "documents" },
          { label: "Entreprise", value: "Kbis", hint: "À préparer", icon: Building2, tone: "info", detailSectionId: "documents" },
          { label: "Avis", value: "Clients", hint: "À connecter", icon: BadgeCheck, tone: "info", detailSectionId: "avis" },
          { label: "Fiche", value: `${profileCompletion.percentage}%`, hint: "Base profil", icon: UserRound, tone: profileCompletion.percentage >= 90 ? "success" : "warning", detailSectionId: "profil" },
        ],
        cadence: [
          { label: "Aujourd'hui", text: "Vérifier que les informations de fiche sont cohérentes avec les documents.", icon: ClipboardCheck },
          { label: "Cette semaine", text: "Préparer assurance, justificatifs entreprise et certifications.", icon: ShieldCheck },
          { label: "Après mission", text: "Collecter les avis clients utiles à la preuve sociale.", icon: BadgeCheck },
        ],
        detailsBadge: "Documents",
        detailsTitle: "Preuves de confiance",
        detailsDescription: "Gardez une vue claire sur les documents et avis qui renforceront votre profil.",
        showDetails: false,
        detailSections: [
          {
            id: "documents",
            title: "Documents professionnels",
            description: "Justificatifs à déposer ou à relier au profil.",
            emptyText: "Aucun document à afficher pour le moment.",
            items: [
              {
                title: "Assurance professionnelle",
                meta: "RC Pro",
                description: "Document clé pour rassurer les propriétaires avant intervention.",
                action: { label: "Compléter la fiche", href: "/dashboard/concierge/profile?tab=fiche" },
              },
              {
                title: "Justificatif entreprise",
                meta: "Kbis / SIRET",
                description: "Vérifiez la cohérence avec les informations entreprise de la fiche.",
                action: { label: "Voir entreprise", href: "/dashboard/concierge/profile?tab=fiche#Informations_entreprise" },
              },
            ],
          },
          {
            id: "avis",
            title: "Avis clients",
            description: "Retours propriétaires et preuves sociales à valoriser.",
            emptyText: "Aucun avis disponible pour le moment.",
            items: [],
          },
          profileDetailSections[0],
        ],
        illustration: { mainIcon: FileText, topLeftIcon: ShieldCheck, topRightIcon: BadgeCheck },
        children: (
          <ConciergeDocumentsTabContent
            renderSection={simpleTabControls.renderSection}
            placeholderClassName={simpleTabControls.placeholderClassName}
          />
        ),
      });
    default:
      return null;
  }
}

function FicheSidebarCard({
  styles,
  profile,
  editProfile,
  editingSection,
  avatarFile,
  defaultAvatar,
  setAvatarFile,
  setEditProfile,
  handleSaveSection,
  beginSectionEdit,
}: FicheSidebarCardProps) {
  return (
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
          existingAvatarUrl={editProfile.avatar_url ?? defaultAvatar}
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
          onEditAvatarClick={() => beginSectionEdit("Photo de profil")}
        />

        <div className={styles.profileStats}>
          <div className={styles.profileStatItem}>
            <p className={styles.profileStatLabel}>Note</p>
            <p className={styles.profileStatValue}>
              4.9
              <Star size={14} className={styles.profileStatIconStar} />
            </p>
          </div>
          <div className={styles.profileStatItem}>
            <p className={styles.profileStatLabel}>Expérience</p>
            <p className={styles.profileStatValue}>
              {profile?.years_experience != null
                ? `${profile.years_experience} ans`
                : "Non renseigné"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FichePresentationSection({
  styles,
  renderSection,
  renderField,
  editProfile,
  setEditProfile,
  editingSection,
  sectionId,
}: FichePresentationSectionProps) {
  const isEditing = editingSection === sectionId;
  const currentCover = editProfile.image || CONCIERGE_CARD_COVER_OPTIONS[0].url;
  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/profiles/avatar", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();

    if (!response.ok || typeof result?.url !== "string") {
      throw new Error(result?.error || "Impossible d'envoyer l'image.");
    }

    setEditProfile((prev) => (prev ? { ...prev, image: result.url } : prev));
  };

  return (
    <div className={styles.presentationFeatured}>
      {renderSection(
        "Présentation",
        <FiTarget />,
        <>
          <p className={styles.sectionIntroText}>
            Cette présentation est visible par les propriétaires sur votre profil et
            dans la recherche. Elle augmente vos chances d&apos;être contacté.
          </p>
          {editingSection === sectionId && (
            <div className={styles.presentationExample}>
              <strong>Exemple</strong>
              <p>
                Conciergerie locale à Paris, disponible 7j/7, spécialisée en accueil
                voyageurs, ménage et intendance.
              </p>
            </div>
          )}
          <div className={styles.publicCoverPicker}>
            <div className={styles.publicCoverPreview}>
              <Image src={currentCover} alt="" fill sizes="(max-width: 768px) 100vw, 360px" />
            </div>
            <div className={styles.publicCoverContent}>
              <strong>Image de couverture publique</strong>
              <p>
                Cette image apparaît sur vos cards publiques. Choisissez un visuel PlanetLS ou
                ajoutez votre propre image.
              </p>
              {isEditing ? (
                <>
                  <div className={styles.publicCoverOptions}>
                    {CONCIERGE_CARD_COVER_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={editProfile.image === option.url ? styles.publicCoverOptionActive : ""}
                        onClick={() =>
                          setEditProfile((prev) => (prev ? { ...prev, image: option.url } : prev))
                        }
                      >
                        <Image src={option.url} alt="" width={64} height={44} />
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                  <label className={styles.publicCoverUpload}>
                    Ajouter mon image
                    <input type="file" accept="image/*" onChange={handleCoverUpload} />
                  </label>
                </>
              ) : null}
            </div>
          </div>
          {renderField(
            "URL image de couverture",
            "image",
            sectionId,
            false,
            false,
            CONCIERGE_CARD_COVER_OPTIONS[0].url,
          )}
          {renderField(
            "Ma présentation",
            "additional_info",
            sectionId,
            true,
            false,
            "Décrivez votre zone d’intervention, vos services clés et ce qui vous différencie.",
          )}
        </>,
        true,
        sectionId,
        false,
      )}
    </div>
  );
}

function FichePersonalInfoSection({
  styles,
  renderSection,
  renderField,
  editProfile,
  editingSection,
  sectionId,
  setEditProfile,
  formatExperienceLabel,
}: FichePersonalInfoSectionProps) {
  return renderSection(
    "Informations personnelles",
    <LucideUser />,
    <>
      <div className={styles.fieldsGrid}>
        {renderField("Nom d'utilisateur", "username", sectionId, false)}
        {renderField("Prénom", "first_name", sectionId, false)}
        {renderField("Nom", "last_name", sectionId, false)}
        {renderField(
          "Email (lecture seule)",
          "email",
          sectionId,
          false,
          true,
          "email@exemple.com",
          "email",
        )}
        {renderField(
          "Téléphone",
          "phone",
          sectionId,
          false,
          true,
          "+33 6 12 34 56 78",
          "tel",
        )}
      </div>

      <div className={styles.fieldRow}>
        <label htmlFor="experience_level" className={styles.fieldLabel}>
          Niveau d&apos;expérience
        </label>
        {editingSection === sectionId ? (
          <select
            id="experience_level"
            name="experience_level"
            value={editProfile.experience_level ?? ""}
            onChange={(e) => {
              const value = e.target.value as "" | "debutant" | "intermediaire" | "experimente";
              setEditProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      experience_level: value === "" ? null : value,
                    }
                  : prev,
              );
            }}
            className={styles.fieldSelect}
          >
            <option value="">Sélectionner un niveau</option>
            <option value="debutant">Débutant (moins de 6 mois)</option>
            <option value="intermediaire">Intermédiaire (6 mois à 3 ans)</option>
            <option value="experimente">Expérimenté (plus de 3 ans)</option>
          </select>
        ) : (
          <span className={styles.fieldValue}>
            {formatExperienceLabel(editProfile.experience_level ?? null)}
          </span>
        )}
      </div>

      {renderField(
        "Années d'expérience",
        "years_experience",
        sectionId,
        false,
        false,
        "Nombre d'années",
        "number",
        { min: "0", max: "50" },
      )}
    </>,
  );
}

function FicheCompanySection({ renderSection, renderField }: FicheSimpleSectionProps) {
  return renderSection(
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
      {renderField("SIREN", "siren", "Informations_entreprise", false, true, "123 456 789 (9 chiffres)")}
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
  );
}

function FicheAddressSection({ renderSection, renderField }: FicheSimpleSectionProps) {
  return renderSection(
    "Adresse professionnelle",
    <FiMapPinOutline />,
    <>
      {renderField("Adresse", "street_address", "Adresse_professionnelle", false, true, "12 Rue de la République")}
      {renderField("Code postal", "postal_code", "Adresse_professionnelle", false, true, "75001")}
      {renderField("Localisation", "location", "Adresse_professionnelle", false, true, "Paris")}
      {renderField("Pays", "country", "Adresse_professionnelle", false, false, "France")}
    </>,
  );
}

function FicheInsuranceSection({ renderSection, renderField }: FicheSimpleSectionProps) {
  return renderSection(
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
        "Qualité, labels...",
      )}
    </>,
  );
}

function FicheSocialSection({
  renderSection,
  editProfile,
  editingSection,
  beginSectionEdit,
  handleSocialChange,
  errors,
}: FicheSocialSectionProps) {
  return renderSection(
    "Web & Réseaux sociaux",
    <FiGlobe />,
    <SocialLinksManager
      website={editProfile.website}
      linkedin={editProfile.linkedin}
      instagram={editProfile.instagram}
      facebook={editProfile.facebook}
      isEditing={editingSection === "Web___R_seaux_sociaux"}
      onEdit={() => beginSectionEdit("Web___R_seaux_sociaux")}
      onChange={handleSocialChange}
      errors={{
        website: errors.website,
        linkedin: errors.linkedin,
        instagram: errors.instagram,
        facebook: errors.facebook,
      }}
    />,
  );
}

function FicheInspirationVideosSection({
  styles,
  renderSection,
  editProfile,
  editingSection,
  beginSectionEdit,
  setEditProfile,
  sectionId,
}: FicheInspirationVideosSectionProps) {
  const videos = parseInspirationVideos(editProfile.availability_hours);
  const textareaValue = videos.map((video) => video.sourceUrl).join("\n");
  const isEditing = editingSection === sectionId;

  return renderSection(
    "Videos d'inspiration",
    <FiPlayCircle />,
    <div className={styles.videoInspirationSection}>
      <div className={styles.videoInspirationIntro}>
        <p>
          Collez ici vos liens YouTube pour garder des exemples de mise en scene, d'accueil, de menage ou de contenus
          inspirants dans votre tableau de bord.
        </p>
        <span>Formats acceptes: `youtube.com/watch`, `youtube.com/shorts`, `youtu.be`.</span>
      </div>

      {isEditing ? (
        <label className={styles.videoTextareaLabel}>
          <span>Un lien par ligne</span>
          <textarea
            className={styles.videoTextarea}
            rows={5}
            value={textareaValue}
            placeholder={
              "https://www.youtube.com/shorts/h7PTdVaD15I\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ"
            }
            onChange={(event) => {
              const nextUrls = event.target.value
                .split(/\r?\n/)
                .map((item) => item.trim())
                .filter(Boolean);
              setEditProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      availability_hours: buildAvailabilityHoursWithInspirationVideos(
                        prev.availability_hours,
                        nextUrls,
                      ),
                    }
                  : prev,
              );
            }}
          />
        </label>
      ) : null}

      {videos.length === 0 ? (
        <div className={styles.videoEmptyState}>
          <strong>Aucune video pour le moment</strong>
          <p>Ajoutez vos liens YouTube ou Shorts pour vous constituer une bibliotheque d'inspiration.</p>
          {!isEditing ? (
            <button type="button" className={styles.videoInlineAction} onClick={() => beginSectionEdit(sectionId)}>
              Ajouter des videos
            </button>
          ) : null}
        </div>
      ) : (
        <div className={styles.videoGrid}>
          {videos.map((video) => (
            <article key={video.id} className={styles.videoCard}>
              <div className={styles.videoEmbedWrap}>
                <iframe
                  src={video.embedUrl}
                  title={`Video YouTube ${video.id}`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className={styles.videoCardFooter}>
                <span>{video.sourceUrl.includes("/shorts/") ? "Short YouTube" : "Video YouTube"}</span>
                <a href={video.watchUrl} target="_blank" rel="noreferrer">
                  Ouvrir sur YouTube
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>,
    true,
    sectionId,
  );
}

function FicheOnboardingDetailsSection({
  styles,
  renderSection,
  editProfile,
}: {
  styles: Record<string, string>;
  renderSection: RenderSection;
  editProfile: ConciergeProfileDraft;
}) {
  const details = parseOnboardingProfileDetails(editProfile.availability_hours);
  const rows = [
    { label: "Mode d'inscription", value: formatOnboardingChoice(details.signupMode) },
    { label: "Objectif", value: formatOnboardingChoice(details.onboardingGoal) },
    { label: "Disponibilité", value: formatOnboardingChoice(details.availability) },
    { label: "Collaboration recherchée", value: formatOnboardingChoice(details.missionPreference) },
    { label: "Accompagnement", value: formatOnboardingChoice(details.supportNeed) },
    { label: "Type de bien principal", value: details.propertyType },
    { label: "Volume du besoin", value: formatOnboardingChoice(details.needVolume) },
    { label: "Métier", value: details.tradeBody },
    { label: "Tarif de départ", value: formatOnboardingChoice(details.startingPriceRange) },
  ].filter((row) => row.value);
  const hasContent =
    rows.length > 0 ||
    details.selectedServices.length > 0 ||
    details.propertyTypes.length > 0 ||
    details.existingTools.length > 0 ||
    Boolean(details.firstRequestTemplate);

  if (!hasContent) return null;

  return renderSection(
    "Informations renseignées à l’inscription",
    <FiCheckCircleOutline />,
    <div className={styles.onboardingDetails}>
      {rows.length > 0 ? (
        <div className={styles.onboardingDetailsGrid}>
          {rows.map((row) => (
            <div key={row.label} className={styles.onboardingDetailItem}>
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {details.propertyTypes.length > 0 ? (
        <div className={styles.onboardingDetailGroup}>
          <strong>Types de biens que vous pouvez gérer</strong>
          <div className={styles.onboardingChips}>
            {details.propertyTypes.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      ) : null}

      {details.selectedServices.length > 0 ? (
        <div className={styles.onboardingDetailGroup}>
          <strong>Services sélectionnés à l’inscription</strong>
          <div className={styles.onboardingChips}>
            {details.selectedServices.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      ) : null}

      {details.existingTools.length > 0 ? (
        <div className={styles.onboardingDetailGroup}>
          <strong>Outils déjà utilisés</strong>
          <div className={styles.onboardingChips}>
            {details.existingTools.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      ) : null}

      {details.firstRequestTemplate ? (
        <div className={styles.onboardingDetailGroup}>
          <strong>Première demande / note</strong>
          <p>{details.firstRequestTemplate}</p>
        </div>
      ) : null}
    </div>,
    false,
  );
}

function FicheBadgeSection({ styles }: Pick<FicheStaticSidebarSectionProps, "styles">) {
  return (
    <div className={styles.badgeCard}>
      <h4 className={styles.badgeTitle}>
        <Shield size={16} />
        <span>Badge Vérifié</span>
      </h4>
      <p className={styles.badgeText}>
        Votre profil a été certifié par nos équipes. Vous profitez d&apos;une
        visibilité prioritaire sur les recherches de clients Premium.
      </p>
    </div>
  );
}

function FicheSummarySection({
  profile,
  renderSection,
}: Pick<FicheStaticSidebarSectionProps, "profile" | "renderSection">) {
  return renderSection(
    "Résumé du profil",
    <FiBarChart />,
    profile ? <ProfileSummary profile={profile as React.ComponentProps<typeof ProfileSummary>["profile"]} /> : null,
    false,
  );
}

export function FicheTabSection({
  styles,
  ficheControls,
  editProfile,
  editingSection,
  renderSection,
  renderField,
  formatExperienceLabel,
  setEditProfile,
  handleSaveSection,
  beginSectionEdit,
}: FicheTabSectionProps) {
  const completion = buildConciergeProfileCompletion(ficheControls.profile ?? editProfile);
  const readProfileValue = (key: string) =>
    String((editProfile as Record<string, unknown>)[key] ?? "").trim();
  const additionalInfo = readProfileValue("additional_info");
  const legalForm = readProfileValue("legal_form");
  const siren = readProfileValue("siren");
  const siret = readProfileValue("siret");
  const streetAddress = readProfileValue("street_address");
  const postalCode = readProfileValue("postal_code");
  const insuranceCompany = readProfileValue("insurance_company");
  const insuranceNumber = readProfileValue("insurance_number");
  const certifications = readProfileValue("certifications");
  const fullName = [editProfile.first_name, editProfile.last_name].filter(Boolean).join(" ").trim();
  const displayName = fullName || editProfile.username || "Profil concierge";
  const identityReady = Boolean(editProfile.first_name && editProfile.last_name && editProfile.email && editProfile.phone);
  const presentationReady = Boolean(additionalInfo);
  const companyReady = Boolean(legalForm && siren && siret);
  const addressReady = Boolean(streetAddress && postalCode && editProfile.location);
  const insuranceReady = Boolean(insuranceCompany || insuranceNumber || certifications);
  const socialLinksCount = [editProfile.website, editProfile.linkedin, editProfile.instagram, editProfile.facebook].filter(Boolean).length;
  const inspirationVideos = parseInspirationVideos(editProfile.availability_hours);
  const visibilityAssetsCount = socialLinksCount + inspirationVideos.length;
  const missingItems = completion.missingItems.slice(0, 4);
  const priorityLabel = missingItems[0] ?? "Fiche prête à publier";
  const hasAvatar = Boolean(ficheControls.avatarFile || editProfile.avatar_url);
  const readinessItems = [
    { label: "Photo", ready: hasAvatar },
    { label: "Coordonnées", ready: identityReady },
    { label: "Présentation", ready: presentationReady },
    { label: "Entreprise", ready: companyReady },
    { label: "Localisation", ready: addressReady },
    { label: "Confiance", ready: insuranceReady },
  ];
  const profileHref = "/dashboard/concierge/profile?tab=fiche";
  const profileTabActions = [
    { label: "Vue d'ensemble", href: "/dashboard/concierge/profile" },
    { label: "Fiche", href: "/dashboard/concierge/profile?tab=fiche" },
    { label: "Missions", href: "/dashboard/concierge/profile?tab=missions" },
    { label: "Packs", href: "/dashboard/concierge/profile?tab=packs" },
    { label: "Tarifs", href: "/dashboard/concierge/profile?tab=tarifs" },
    { label: "Devis", href: "/dashboard/concierge/profile?tab=devis" },
    { label: "Équipe", href: "/dashboard/concierge/profile?tab=equipe" },
    { label: "Documents", href: "/dashboard/concierge/profile?tab=documents" },
  ];
  const toProfileAction = (label: string, hash: string) => ({
    label,
    href: `${profileHref}#${hash}`,
  });
  const detailSections = [
    {
      id: "identite",
      title: "Identité publique",
      description: "Les informations qui permettent aux propriétaires de vous identifier et de vous contacter.",
      emptyText: "Les informations d’identité sont complètes.",
      items: [
        {
          title: displayName,
          meta: identityReady ? "Complet" : "À compléter",
          description: editProfile.email
            ? `${editProfile.email}${editProfile.phone ? ` - ${editProfile.phone}` : ""}`
            : "Ajoutez au minimum nom, prénom, email et téléphone.",
          action: toProfileAction("Modifier", ficheControls.sectionIds.INFO_PERSO),
        },
      ],
    },
    {
      id: "presentation",
      title: "Présentation commerciale",
      description: "Le texte et les éléments qui donnent de la crédibilité à votre fiche.",
      emptyText: "La présentation est complète.",
      items: [
        {
          title: "Présentation",
          meta: presentationReady ? "Visible" : "À rédiger",
          description: presentationReady
            ? additionalInfo.slice(0, 150)
            : "Présentez votre zone, vos services clés et votre différence.",
          action: toProfileAction("Rédiger", ficheControls.sectionIds.PRESENTATION),
        },
        {
          title: "Entreprise",
          meta: companyReady ? "Renseignée" : "À vérifier",
          description: legalForm || "Ajoutez forme juridique, SIREN et SIRET.",
          action: toProfileAction("Vérifier", "Informations_entreprise"),
        },
      ],
    },
    {
      id: "confiance",
      title: "Confiance et conformité",
      description: "Adresse, assurance, certifications et signaux de réassurance.",
      emptyText: "Les éléments de confiance sont renseignés.",
      items: [
        {
          title: "Adresse professionnelle",
          meta: addressReady ? "Localisée" : "À compléter",
          description: editProfile.location || "Ajoutez adresse, code postal, ville et pays.",
          action: toProfileAction("Compléter", "Adresse_professionnelle"),
        },
        {
          title: "Assurance & certifications",
          meta: insuranceReady ? "Documentée" : "À renforcer",
          description: insuranceCompany || "Ajoutez votre RC Pro ou vos certifications.",
          action: toProfileAction("Renforcer", "Assurance___Certifications"),
        },
      ],
    },
    {
      id: "visibilite",
      title: "Visibilité",
      description: "Canaux qui enrichissent votre présence et facilitent la vérification.",
      emptyText: "Aucun canal externe renseigné.",
      items: [
        {
          title: "Web & réseaux sociaux",
          meta: `${socialLinksCount} lien(s)`,
          description:
            socialLinksCount > 0
              ? "Vos liens renforcent la lecture de votre activité."
              : "Ajoutez un site ou un réseau professionnel si vous en avez un.",
          action: toProfileAction("Gérer", "Web___R_seaux_sociaux"),
        },
        {
          title: "Videos d'inspiration",
          meta: `${inspirationVideos.length} video(s)`,
          description:
            inspirationVideos.length > 0
              ? "Vos inspirations video restent consultables directement dans la fiche."
              : "Ajoutez vos videos YouTube et Shorts de reference.",
          action: toProfileAction("Organiser", ficheControls.sectionIds.INSPIRATION_VIDEOS),
        },
      ],
    },
  ];

  return (
    <DashboardOperationalPage
      tone="concierge"
      badge="Vue opérationnelle"
      title="Fiche concierge"
      description="Pilotez votre identité publique, votre présentation, vos informations légales et les signaux de confiance visibles par les propriétaires."
      primaryActions={profileTabActions}
      metrics={[
        {
          label: "Complétion",
          value: `${completion.percentage}%`,
          hint: `${completion.completedCount}/${completion.totalCount} éléments validés`,
          detailSectionId: "presentation",
          href: `${profileHref}#fiche-publication`,
        },
        {
          label: "Identité",
          value: identityReady ? "OK" : "À faire",
          hint: "Contact et expérience",
          detailSectionId: "identite",
          href: `${profileHref}#${ficheControls.sectionIds.INFO_PERSO}`,
        },
        {
          label: "Confiance",
          value: `${[addressReady, insuranceReady, companyReady].filter(Boolean).length}/3`,
          hint: "Entreprise, adresse, assurance",
          detailSectionId: "confiance",
          href: `${profileHref}#Assurance___Certifications`,
        },
        {
          label: "Visibilité",
          value: String(visibilityAssetsCount),
          hint: "Liens + videos",
          detailSectionId: "visibilite",
          href: `${profileHref}#${ficheControls.sectionIds.INSPIRATION_VIDEOS}`,
        },
      ]}
      focus={{
        title: "Priorité fiche",
        status: completion.percentage >= 90 ? "Prêt" : "À compléter",
        statusVariant: completion.percentage >= 90 ? "success" : "warning",
        icon: completion.percentage >= 90 ? <BadgeCheck size={28} /> : <ClipboardCheck size={28} />,
        heading: priorityLabel,
        description:
          completion.percentage >= 90
            ? "Votre fiche est suffisamment complète pour inspirer confiance. Gardez les informations à jour."
            : "Complétez les champs manquants pour améliorer la lisibilité et la crédibilité de votre profil.",
        action: { label: "Continuer la fiche", href: profileHref },
      }}
      risks={[
        {
          label: "Identité",
          value: identityReady ? "OK" : "Manquant",
          hint: "Coordonnées",
          icon: IdCard,
          tone: identityReady ? "success" : "warning",
          detailSectionId: "identite",
          href: `${profileHref}#${ficheControls.sectionIds.INFO_PERSO}`,
        },
        {
          label: "Présentation",
          value: presentationReady ? "OK" : "À rédiger",
          hint: "Texte public",
          icon: FileText,
          tone: presentationReady ? "success" : "warning",
          detailSectionId: "presentation",
          href: `${profileHref}#${ficheControls.sectionIds.PRESENTATION}`,
        },
        {
          label: "Assurance",
          value: insuranceReady ? "OK" : "À vérifier",
          hint: "RC Pro / labels",
          icon: ShieldCheck,
          tone: insuranceReady ? "success" : "info",
          detailSectionId: "confiance",
          href: `${profileHref}#Assurance___Certifications`,
        },
        {
          label: "Liens",
          value: visibilityAssetsCount,
          hint: "Site, réseaux, videos",
          icon: Globe2,
          tone: visibilityAssetsCount > 0 ? "success" : "info",
          detailSectionId: "visibilite",
          href: `${profileHref}#${ficheControls.sectionIds.INSPIRATION_VIDEOS}`,
        },
      ]}
      cadenceTitle="Cadence de mise à jour"
      cadence={[
        {
          label: "Aujourd’hui",
          text: "Corriger les informations manquantes qui bloquent la confiance.",
          icon: ClipboardCheck,
        },
        {
          label: "Cette semaine",
          text: "Relire la présentation et vérifier la cohérence entreprise, adresse et assurance.",
          icon: Building2,
        },
        {
          label: "Chaque mois",
          text: "Actualiser photo, liens, expérience et éléments différenciants.",
          icon: Sparkles,
        },
      ]}
      detailsBadge="Fiche"
      detailsTitle="Sections à harmoniser"
      detailsDescription="Cliquez sur un indicateur pour isoler les parties de la fiche à corriger ou à enrichir."
      detailSections={detailSections}
      showDetails={false}
      illustration={{
        mainIcon: UserRound,
        topLeftIcon: Camera,
        topRightIcon: MapPinned,
      }}
    >
      <DashboardPanel title="Édition reliée de la fiche" className={styles.operationalPanel}>
        <div id="fiche-publication" className={styles.ficheEditIntro}>
          <p>
            Les indicateurs au-dessus renvoient aux mêmes familles que les sections ci-dessous. Utilisez ces raccourcis pour aller directement au bloc à corriger.
          </p>
          <div className={styles.ficheSectionLinks}>
            <Link href={`${profileHref}#${ficheControls.sectionIds.INFO_PERSO}`}>Identité</Link>
            <Link href={`${profileHref}#${ficheControls.sectionIds.PRESENTATION}`}>Présentation</Link>
            <Link href={`${profileHref}#Informations_entreprise`}>Entreprise</Link>
            <Link href={`${profileHref}#Adresse_professionnelle`}>Adresse</Link>
            <Link href={`${profileHref}#Assurance___Certifications`}>Confiance</Link>
            <Link href={`${profileHref}#Web___R_seaux_sociaux`}>Visibilité</Link>
            <Link href={`${profileHref}#${ficheControls.sectionIds.INSPIRATION_VIDEOS}`}>Videos</Link>
          </div>
        </div>
        <div className={styles.grid}>
          <aside className={styles.leftColumn}>
            <FicheSidebarCard
              styles={styles}
              profile={ficheControls.profile}
              editProfile={editProfile}
              editingSection={editingSection}
              avatarFile={ficheControls.avatarFile}
              defaultAvatar={ficheControls.defaultAvatar}
              setAvatarFile={ficheControls.setAvatarFile}
              setEditProfile={setEditProfile}
              handleSaveSection={handleSaveSection}
              beginSectionEdit={beginSectionEdit}
            />

            <FichePresentationSection
              styles={styles}
              renderSection={renderSection}
              renderField={renderField}
              editProfile={editProfile}
              setEditProfile={setEditProfile}
              editingSection={editingSection}
              sectionId={ficheControls.sectionIds.PRESENTATION}
            />

            <div className={styles.ficheReadinessPanel}>
              <div>
                <span>Repères de publication</span>
                <strong>{completion.percentage}% complet</strong>
              </div>
              <div className={styles.ficheReadinessList}>
                {readinessItems.map((item) => (
                  <span key={item.label} className={item.ready ? styles.ficheReadinessDone : ""}>
                    {item.label}
                  </span>
                ))}
              </div>
              {missingItems.length > 0 ? (
                <p>Priorité : {missingItems[0]}</p>
              ) : (
                <p>La fiche est cohérente. Pensez seulement à la relire régulièrement.</p>
              )}
            </div>
          </aside>

          <section className={styles.rightColumn}>
            <FichePersonalInfoSection
              styles={styles}
              renderSection={renderSection}
              renderField={renderField}
              editProfile={editProfile}
              editingSection={editingSection}
              sectionId={ficheControls.sectionIds.INFO_PERSO}
              setEditProfile={setEditProfile}
              formatExperienceLabel={formatExperienceLabel}
            />
            <FicheCompanySection renderSection={renderSection} renderField={renderField} />
            <FicheAddressSection renderSection={renderSection} renderField={renderField} />
            <FicheInsuranceSection renderSection={renderSection} renderField={renderField} />
            <FicheSocialSection
              renderSection={renderSection}
              editProfile={editProfile}
              editingSection={editingSection}
              beginSectionEdit={beginSectionEdit}
              handleSocialChange={ficheControls.handleSocialChange}
              errors={ficheControls.errors}
            />
            <FicheInspirationVideosSection
              styles={styles}
              renderSection={renderSection}
              editProfile={editProfile}
              editingSection={editingSection}
              beginSectionEdit={beginSectionEdit}
              setEditProfile={setEditProfile}
              sectionId={ficheControls.sectionIds.INSPIRATION_VIDEOS}
            />
          </section>
        </div>
      </DashboardPanel>
    </DashboardOperationalPage>
  );
}

export function ConciergeFicheTabContent(props: FicheTabSectionProps) {
  return <FicheTabSection {...props} />;
}

export function ConciergePacksTabContent({
  styles,
  renderSection,
  activeMissionServiceIds,
  activeMissionServiceLabels,
}: PacksTabSectionProps & { styles: Record<string, string> }) {
  return (
    <div className={styles.financeGrid}>
      <div className={styles.financeCard}>
        <PacksTabSection
          renderSection={renderSection}
          activeMissionServiceIds={activeMissionServiceIds}
          activeMissionServiceLabels={activeMissionServiceLabels}
        />
      </div>
    </div>
  );
}

export function MissionsPrimarySections({
  styles,
  renderSection,
  renderField,
  sectionIds,
  editingSection,
  missionPayload,
  missionAvailability,
  unrecognizedActiveMissionLabels,
  removeUnrecognizedServices,
  catalogSyncBusy,
  setEditProfile,
  parseAvailabilityPayloadRaw,
  parseMissionPayload,
  buildLegacyFromMissionProfile,
  toMissionTypeId,
  normalizeMissionSchedule,
}: MissionsPrimarySectionsProps) {
  return (
    <div className={styles.missionConfigLayout}>
      <div className={styles.missionConfigPrimary}>
        <MissionServicesSection
          styles={styles}
          renderSection={renderSection}
          renderField={renderField}
          sectionIds={sectionIds}
          editingSection={editingSection}
          missionPayload={missionPayload}
          missionAvailability={missionAvailability}
          unrecognizedActiveMissionLabels={unrecognizedActiveMissionLabels}
          removeUnrecognizedServices={removeUnrecognizedServices}
          catalogSyncBusy={catalogSyncBusy}
          setEditProfile={setEditProfile}
          parseAvailabilityPayloadRaw={parseAvailabilityPayloadRaw}
          parseMissionPayload={parseMissionPayload}
          buildLegacyFromMissionProfile={buildLegacyFromMissionProfile}
          toMissionTypeId={toMissionTypeId}
          normalizeMissionSchedule={normalizeMissionSchedule}
        />
      </div>

      <div className={styles.missionConfigSecondary}>
      <MissionZoneRulesSection
        styles={styles}
        renderSection={renderSection}
        sectionId={sectionIds.ZONE_RULES}
        editingSection={editingSection}
        missionAvailability={missionAvailability}
        setEditProfile={setEditProfile}
        parseAvailabilityPayloadRaw={parseAvailabilityPayloadRaw}
      />

        <MissionWeeklyAvailabilitySection
          styles={styles}
          renderSection={renderSection}
          sectionId={sectionIds.WEEKLY_AVAILABILITY}
          editingSection={editingSection}
          missionAvailability={missionAvailability}
          setEditProfile={setEditProfile}
          parseAvailabilityPayloadRaw={parseAvailabilityPayloadRaw}
          normalizeMissionSchedule={normalizeMissionSchedule}
        />
      </div>
    </div>
  );
}

export function MissionServicesSection({
  styles,
  renderSection,
  sectionIds,
  editingSection,
  missionPayload,
  unrecognizedActiveMissionLabels,
  removeUnrecognizedServices,
  catalogSyncBusy,
  setEditProfile,
  parseAvailabilityPayloadRaw,
  parseMissionPayload,
  buildLegacyFromMissionProfile,
  toMissionTypeId,
}: MissionServicesSectionProps) {
  return renderSection(
    "Services proposés",
    <FiTarget />,
    <>
      <MissionDetails
        selectedServices={missionPayload.missionProfile.missions
          .filter((mission) => mission.isActive)
          .map((mission) => mission.label)}
        isEditing={editingSection === sectionIds.SERVICES}
        onChangeOption={(selected) =>
          setEditProfile((prev: EditProfileStateLike) =>
            prev
              ? (() => {
                  const existingPayload = parseAvailabilityPayloadRaw(prev.availability_hours);
                  const parsed = parseMissionPayload(prev.availability_hours);
                  const nextMissionProfile = buildMissionProfileFromSelection(
                    parsed,
                    selected,
                    toMissionTypeId,
                  );
                  const legacy = buildLegacyFromMissionProfile(nextMissionProfile);

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
      {unrecognizedActiveMissionLabels.length > 0 && (
        <div className={styles.missionUnknownPanel}>
          <p>
            Services actifs non reconnus dans le catalogue : {unrecognizedActiveMissionLabels.length}
          </p>
          <div className={styles.missionUnknownList}>
            {unrecognizedActiveMissionLabels.map((label) => (
              <span key={label} className={styles.missionUnknownItem}>
                {label}
              </span>
            ))}
          </div>
          <div className={styles.missionUnknownActions}>
            <button
              type="button"
              className={styles.missionUnknownActionBtn}
              onClick={removeUnrecognizedServices}
              disabled={catalogSyncBusy}
            >
              {catalogSyncBusy ? "Suppression en cours..." : "Supprimer tous les non reconnus"}
            </button>
          </div>
        </div>
      )}
    </>,
    true,
    sectionIds.SERVICES,
    false,
  );
}

export function MissionZoneRulesSection({
  styles,
  renderSection,
  sectionId,
  editingSection,
  missionAvailability,
  setEditProfile,
  parseAvailabilityPayloadRaw,
}: MissionZoneRulesSectionProps) {
  const zones = missionAvailability?.zones ?? [];
  const primaryZone = zones[0] ?? null;
  const radiusKm = missionAvailability?.radiusKm ?? 0;
  const isEditingSection = editingSection === sectionId;
  const readZonePostcode = (zone: MissionAvailabilityState["zones"][number] | null) => {
    if (!zone || typeof zone !== "object") return null;
    const candidate = zone as { postcode?: string | null };
    return candidate.postcode?.trim() || null;
  };
  const primaryZonePostcode = readZonePostcode(primaryZone);
  const summaryLabel = primaryZone
    ? primaryZonePostcode
      ? `${primaryZone.label} (${primaryZonePostcode})`
      : primaryZone.label
    : null;

  return renderSection(
    "Zone d'intervention",
    <FiMapPinOutline />,
    <>
      <MissionSnapshotShell
        styles={styles}
        eyebrow="Couverture"
        title={summaryLabel ?? "Aucune zone définie"}
        footer={
          <>
            Rayon d’intervention : <strong>{radiusKm > 0 ? `${radiusKm} km` : "à définir"}</strong>
          </>
        }
      />
      {isEditingSection ? (
        <div className={styles.missionEditorPanel}>
          <MissionZoneAvailability
            value={missionAvailability}
            isEditing={true}
            lockZones
            showScheduleSection={false}
            showRulesSection={false}
            onChange={(data) =>
              setEditProfile((prev: EditProfileStateLike) =>
                prev ? buildProfileZoneUpdate(prev, data, parseAvailabilityPayloadRaw) : prev,
              )
            }
          />
        </div>
      ) : null}
    </>,
    true,
    sectionId,
  );
}

export function MissionWeeklyAvailabilitySection({
  styles,
  renderSection,
  sectionId,
  editingSection,
  missionAvailability,
  setEditProfile,
  parseAvailabilityPayloadRaw,
  normalizeMissionSchedule,
}: MissionWeeklyAvailabilitySectionProps) {
  const schedule = missionAvailability?.schedule ?? [];
  const emergency24h = missionAvailability?.emergency24h ?? false;
  const openDays = schedule.filter((day) => day.ranges.length > 0);
  const isEditingSection = editingSection === sectionId;
  const scheduleSummary = formatMissionScheduleSummary(schedule, emergency24h);

  return renderSection(
    "Disponibilités hebdomadaires",
    <FiClockOutline />,
    <>
      {!isEditingSection ? (
        <MissionSnapshotShell styles={styles} eyebrow="Disponibilité" title="Horaires hebdomadaires">
          <p className={styles.missionSnapshotNote}>
            <strong>{scheduleSummary}</strong>
          </p>
          <div className={styles.missionBadgeRow}>
            <span className={styles.missionUnknownItem}>{openDays.length}/7</span>
            <span className={styles.missionUnknownItem}>
              24/7 urgences {emergency24h ? "Oui" : "Non"}
            </span>
          </div>
        </MissionSnapshotShell>
      ) : null}

      {isEditingSection ? (
        <div className={styles.missionEditorPanel}>
          <AvailabilityEditor
            value={schedule}
            emergency24h={emergency24h}
            isEditing={true}
            onChange={(nextSchedule, nextEmergency24h) =>
              setEditProfile((prev: EditProfileStateLike) =>
                prev
                  ? buildProfileWeeklyAvailabilityUpdate(
                      prev,
                      nextSchedule,
                      nextEmergency24h,
                      parseAvailabilityPayloadRaw,
                      normalizeMissionSchedule,
                    )
                  : prev,
              )
            }
          />
        </div>
      ) : null}
    </>,
    true,
    sectionId,
  );
}
export function MissionProgressPanelSection({
  styles,
  missionProgressDoneCount,
  missionProgressTotal,
  showPendingMissionStepsOnly,
  setShowPendingMissionStepsOnly,
  missionProgressSteps,
  openMissionSectionForEdit,
}: MissionProgressPanelSectionProps) {
  const visibleSteps = showPendingMissionStepsOnly
    ? missionProgressSteps.filter((step) => !step.done)
    : missionProgressSteps;

  return (
    <div className={styles.missionProgressPanel}>
      <div className={styles.missionProgressHeader}>
        <h4>Parcours de configuration</h4>
        <span>
          {missionProgressDoneCount}/{missionProgressTotal} completes
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
          À configurer
        </button>
      </div>
      <div className={styles.missionProgressList}>
        {visibleSteps.map((step, index) => (
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
                onClick={() => openMissionSectionForEdit(step.sectionId!)}
              >
                {step.done ? "Modifier" : "Configurer"}
              </button>
            )}
          </div>
        ))}
      </div>
      {showPendingMissionStepsOnly && missionProgressSteps.every((step) => step.done) && (
        <p className={styles.missionProgressEmpty}>
          Tout est configuré. Vous pouvez maintenant affiner les réglages.
        </p>
      )}
    </div>
  );
}

export function MissionQuickQuoteSection({
  styles,
  renderSection,
  selectedMissionQuoteId,
  setSelectedMissionQuoteId,
  missionRows,
  missionQuoteBusy,
  createQuoteFromMission,
  missionQuoteFeedback,
}: MissionQuickQuoteSectionProps) {
  return renderSection(
    "Devis rapides depuis mission",
    <FiFile />,
    <>
      <div className={styles.missionToolbar}>
        <div className={styles.missionToolbarItem}>
          <span>Mission source</span>
          <select
            aria-label="Selection de la mission source"
            title="Selection de la mission source"
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
            onClick={createQuoteFromMission}
          >
            {missionQuoteBusy ? "Génération..." : "Créer devis"}
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
  );
}

export function MissionsSecondaryPanels({
  styles,
  missionProgressDoneCount,
  missionProgressTotal,
  showPendingMissionStepsOnly,
  setShowPendingMissionStepsOnly,
  missionProgressSteps,
  openMissionSectionForEdit,
  renderSection,
  missionQuoteControls,
}: MissionsSecondaryPanelsProps) {
  return (
    <>
      <MissionProgressPanelSection
        styles={styles}
        missionProgressDoneCount={missionProgressDoneCount}
        missionProgressTotal={missionProgressTotal}
        showPendingMissionStepsOnly={showPendingMissionStepsOnly}
        setShowPendingMissionStepsOnly={setShowPendingMissionStepsOnly}
        missionProgressSteps={missionProgressSteps}
        openMissionSectionForEdit={openMissionSectionForEdit}
      />
      <MissionQuickQuoteSection
        styles={styles}
        renderSection={renderSection}
        selectedMissionQuoteId={missionQuoteControls.selectedMissionQuoteId}
        setSelectedMissionQuoteId={missionQuoteControls.setSelectedMissionQuoteId}
        missionRows={missionQuoteControls.missionRows}
        missionQuoteBusy={missionQuoteControls.missionQuoteBusy}
        createQuoteFromMission={missionQuoteControls.createQuoteFromMission}
        missionQuoteFeedback={missionQuoteControls.missionQuoteFeedback}
      />
    </>
  );
}

export function ConciergeMissionsTabContent({
  styles,
  renderSection,
  renderField,
  sectionIds,
  editingSection,
  missionProgressControls,
  missionOverviewStats,
  missionQuoteControls,
  missionFoundationControls,
}: ConciergeMissionsTabContentProps) {
  const missionRows = missionQuoteControls.missionRows.slice(0, 3);

  return (
    <div className={styles.missionsFocusedLayout}>
      <DashboardPanel title="Missions en cours" className={styles.missionsCurrentPanel}>
        {missionRows.length > 0 ? (
          <div className={styles.missionsCurrentList}>
            {missionRows.map((mission) => (
              <div key={mission.id} className={styles.missionsCurrentItem}>
                <div>
                  <strong>{mission.title}</strong>
                  <span>{mission.status}</span>
                </div>
                <Link href="/dashboard/concierge/missions">Voir</Link>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.missionsEmptyText}>
            Aucune mission en cours à afficher ici. Cette page sert surtout à configurer les services qui généreront les prochaines missions.
          </p>
        )}
      </DashboardPanel>

      <DashboardPanel title="Services proposés pour les missions" className={styles.missionsServicesPanel}>
        <MissionsPrimarySections
          styles={styles}
          renderSection={renderSection}
          renderField={renderField}
          sectionIds={sectionIds}
          editingSection={editingSection}
          missionPayload={missionFoundationControls.missionPayload}
          missionAvailability={
            missionFoundationControls.missionAvailability ?? {
              zones: [],
              radiusKm: 0,
              schedule: [],
              emergency24h: false,
              rules: {
                refuseOutOfZone: true,
                refuseOutOfSchedule: true,
                autoAcceptEmergency: false,
              },
            }
          }
          unrecognizedActiveMissionLabels={missionFoundationControls.unrecognizedActiveMissionLabels}
          removeUnrecognizedServices={missionFoundationControls.removeUnrecognizedServices}
          catalogSyncBusy={missionFoundationControls.catalogSyncBusy}
          setEditProfile={missionFoundationControls.setEditProfile as SetEditProfile}
          parseAvailabilityPayloadRaw={missionFoundationControls.parseAvailabilityPayloadRaw}
          parseMissionPayload={missionFoundationControls.parseMissionPayload}
          buildLegacyFromMissionProfile={missionFoundationControls.buildLegacyFromMissionProfile}
          toMissionTypeId={missionFoundationControls.toMissionTypeId}
          normalizeMissionSchedule={missionFoundationControls.normalizeMissionSchedule}
        />
      </DashboardPanel>
    </div>
  );
}

export function TariffWorkflowSection({
  styles,
  renderSection,
  sectionId,
  title,
  commissionRatePct,
  hourlyRate,
  configuredPricingCount,
  tariffReadinessPercent,
  pendingChecksCount,
  pendingChecks,
  onScrollConfig,
  onScrollBilling,
  onGoToMissions,
}: TariffWorkflowSectionProps) {
  const getReadinessTargetLabel = (checkId: string) => {
    if (checkId === "rate") return "Tarifs > Configuration";
    if (checkId === "services") return "Missions > Services proposés";
    if (checkId === "zone") return "Missions > Zone d'intervention";
    if (checkId === "missions") return "Missions > Disponibilités";
    return "Configuration";
  };

  const goToReadinessCheck = (checkId: string) => {
    if (checkId === "rate") {
      onScrollConfig();
      return;
    }

    if (checkId === "services" || checkId === "zone" || checkId === "missions") {
      onGoToMissions();
      return;
    }

    onScrollConfig();
  };

  return (
    <div className={`${styles.financeCard} ${styles.financeCardFull} ${styles.tariffPanelCard}`}>
      {renderSection(
        title,
        <FiTarget />,
        <div className={styles.tariffWorkflow}>
          <div className={styles.tariffHero}>
            <div className={styles.tariffHeroIntro}>
              <span className={styles.tariffPill}>Pilotage global</span>
              <p className={styles.tariffWorkflowLead}>
                Ajustez vos prix rapidement, puis utilisez-les directement dans vos devis et vos factures.
              </p>
              <div className={styles.tariffExpertCard}>
                <h4>Conseil Expert</h4>
                <span
                  className={`${styles.tariffMarketBadge} ${
                    commissionRatePct < 15
                      ? styles.tariffMarketBadgeLow
                      : commissionRatePct <= 25
                        ? styles.tariffMarketBadgeAvg
                        : styles.tariffMarketBadgeHigh
                  }`}
                >
                  {commissionRatePct < 15 ? "Sous marché" : commissionRatePct <= 25 ? "Marché" : "Premium"}
                </span>
                <p className={styles.tariffExpertSummary}>
                  {hourlyRate > 0
                    ? `Base ${hourlyRate} EUR/h, ${configuredPricingCount} service(s) avec tarif.`
                    : "Définissez d'abord votre tarif horaire puis ajoutez vos services à l'acte."}
                </p>
              </div>
            </div>
            <div className={styles.tariffHeroAside}>
              <div className={styles.tariffTopCards}>
                <article className={styles.tariffMetric}>
                  <span>Commission</span>
                  <strong>{commissionRatePct}%</strong>
                </article>
                <article className={styles.tariffMetric}>
                  <span>Tarif horaire</span>
                  <strong>{hourlyRate > 0 ? `${hourlyRate} EUR/h` : "À définir"}</strong>
                </article>
                <article className={styles.tariffMetric}>
                  <span>Services avec tarif</span>
                  <strong>{configuredPricingCount}</strong>
                </article>
              </div>
              <article className={styles.tariffReadyCard}>
                <span className={styles.tariffReadyLabel}>Prêt à chiffrer</span>
                <strong className={styles.tariffReadyScore}>{tariffReadinessPercent}%</strong>
                <p>
                  {pendingChecksCount > 0
                    ? `${pendingChecksCount} point(s) à compléter. Voir les bulles rouges ci-dessous.`
                    : "Configuration complète. Vous pouvez envoyer vos devis."}
                </p>
                {pendingChecksCount > 0 ? (
                  <span className={styles.tariffPendingCount} aria-hidden>
                    {pendingChecksCount}
                  </span>
                ) : null}
              </article>
            </div>
          </div>

          <div className={styles.tariffSectionNav}>
            <button type="button" className={styles.tariffSectionLink} onClick={onScrollConfig}>
              Configurer les tarifs
            </button>
            <button type="button" className={styles.tariffSectionLink} onClick={onScrollBilling}>
              Generer devis/factures
            </button>
          </div>

          {pendingChecksCount > 0 ? (
            <div className={styles.tariffPendingList}>
              {pendingChecks.map((check, index) => (
                <button
                  key={check.id}
                  type="button"
                  className={styles.tariffPendingBtn}
                  onClick={() => goToReadinessCheck(check.id)}
                >
                  <span className={styles.tariffPendingItemCount} aria-hidden>
                    {index + 1}
                  </span>
                  <span className={styles.tariffPendingDot} aria-hidden />
                  <span>{check.label}</span>
                  <small className={styles.tariffPendingTarget}>
                    {getReadinessTargetLabel(check.id)}
                  </small>
                </button>
              ))}
            </div>
          ) : null}
        </div>,
        false,
        sectionId,
      )}
    </div>
  );
}

export function TariffPillarsSection({
  styles,
  hourlyRate,
  travelFee,
  minimumInvoice,
  commissionRatePct,
  setupFee,
  editingDisabled,
  onCommissionRateChange,
  onSetupFeeChange,
  configuredPricingCount,
  pricingCatalogRowsCount,
  activeMissionServiceLabelsCount,
}: TariffPillarsSectionProps) {
  return (
    <div className={styles.tariffPillarsGrid}>
      <article className={styles.tariffPillarCard}>
        <h3>Pilier 1 - Tarif de base</h3>
        <p>Socle commun applique a vos prestations.</p>
        <div className={styles.tariffPillarStats}>
          <span>
            Horaire: <strong>{hourlyRate > 0 ? `${hourlyRate} EUR/h` : "À définir"}</strong>
          </span>
          <span>
            Deplacement: <strong>{travelFee} EUR</strong>
          </span>
          <span>
            Minimum: <strong>{minimumInvoice} EUR</strong>
          </span>
        </div>
      </article>

      <article className={styles.tariffPillarCard}>
        <h3>Pilier 2 - Commission & set-up</h3>
        <p>Revenus variables et ponctuels par logement.</p>
        <div className={styles.tariffPillarFields}>
          <label>
            <span>Commission sur revenus (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={commissionRatePct}
              disabled={editingDisabled}
              onChange={(e) => onCommissionRateChange(Number(e.target.value || 0))}
            />
          </label>
          <label>
            <span>Frais de mise en place (EUR)</span>
            <input
              aria-label="Frais de mise en place en euros"
              type="number"
              min={0}
              step="1"
              value={setupFee}
              disabled={editingDisabled}
              onChange={(e) => onSetupFeeChange(Number(e.target.value || 0))}
            />
          </label>
        </div>
      </article>

      <article className={styles.tariffPillarCard}>
        <h3>Pilier 3 - Catalogue à l&apos;acte</h3>
        <p>Services nommes librement pour plus de transparence.</p>
        <div className={styles.tariffPillarStats}>
          <span>
            Services configurés : <strong>{configuredPricingCount} / {pricingCatalogRowsCount}</strong>
          </span>
          <span>
            Services actifs: <strong>{activeMissionServiceLabelsCount}</strong>
          </span>
        </div>
      </article>
    </div>
  );
}

export function TariffConfigShell({
  styles,
  renderSection,
  sectionId,
  children,
}: TariffConfigShellProps) {
  return (
    <div
      id="tariffs-config"
      className={`${styles.financeCard} ${styles.financeCardWide} ${styles.tariffPanelCard}`}
    >
      {renderSection(
        "1. Configuration tarifaire",
        <FiDollarSignOutline />,
        <>{children}</>,
        true,
        sectionId,
      )}
    </div>
  );
}

export function TariffContextSection({
  styles,
  experienceLabel,
  locationLabel,
  radiusKm,
  urgentEnabled,
  urgentPercent,
  highSeasonEnabled,
  highSeasonPercent,
}: TariffContextSectionProps) {
  return (
    <section className={styles.tariffSimpleCard}>
      <h3 className={styles.tariffSimpleTitle}>A. Contexte automatique</h3>
      <div className={styles.tariffSimpleRows}>
        <p>
          <strong>Positionnement :</strong> {experienceLabel}
        </p>
        <p>
          <strong>Lieu :</strong> {locationLabel}
        </p>
        <p>
          <strong>Rayon :</strong> {radiusKm} km
        </p>
        <p>
          <strong>Urgences activées :</strong> {urgentEnabled ? "Oui" : "Non"} (+{urgentPercent}%)
        </p>
        <p>
          <strong>Haute saison :</strong> {highSeasonEnabled ? "Oui" : "Non"} (+{highSeasonPercent}%)
        </p>
      </div>
    </section>
  );
}

export function TariffBaseSection({
  styles,
  renderField,
  sectionId,
  editingSection,
  minimumInvoice,
  onMinimumInvoiceChange,
}: TariffBaseSectionProps) {
  return (
    <section className={styles.tariffSimpleCard}>
      <h3 className={styles.tariffSimpleTitle}>B. Tarif de base</h3>
      <p className={styles.tariffHint}>
        Définissez votre base de facturation commune à toutes les missions.
      </p>
      <div className={styles.tariffFieldPanel}>
        {renderField("Tarif horaire (EUR/h)", "hourly_rate", sectionId, false, true, "45", "number")}
        {renderField(
          "Frais de déplacement (EUR)",
          "travel_fee",
          sectionId,
          false,
          false,
          "15",
          "number",
        )}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="minimum-invoice-input">
            Minimum de facture (EUR)
          </label>
          <input
            id="minimum-invoice-input"
            aria-label="Minimum de facture en euros"
            type="number"
            min={0}
            step="1"
            value={Math.round(minimumInvoice)}
            disabled={editingSection !== sectionId}
            onChange={(e) => onMinimumInvoiceChange(Math.max(0, Number(e.target.value || 0)))}
          />
        </div>
      </div>
    </section>
  );
}

export function TariffModifiersSection({
  styles,
  propertyTypeOptions,
  getPropertyTypeDeltaPercent,
  updatePropertyTypeDeltaPercent,
  editingSection,
  sectionId,
  urgentPercent,
  nightPercent,
  weekendPercent,
  highSeasonPercent,
  minimumInvoice,
}: TariffModifiersSectionProps) {
  return (
    <section className={styles.tariffSimpleCard}>
      <h3 className={styles.tariffSimpleTitle}>D. Variables et majorations</h3>
      <p className={styles.tariffHint}>
        Adaptez vos prix selon le type de bien et les conditions d&apos;intervention.
      </p>
      <div className={styles.tariffPropertyMatrix}>
        {propertyTypeOptions.map((option) => (
          <label key={option.key} className={styles.tariffPropertyRow}>
            <span>{option.label}</span>
            <input
              type="number"
              step="1"
              value={getPropertyTypeDeltaPercent(option.key)}
              disabled={editingSection !== sectionId}
              onChange={(e) => updatePropertyTypeDeltaPercent(option.key, Number(e.target.value || 0))}
            />
            <small>%</small>
          </label>
        ))}
      </div>
      <ul className={styles.tariffRuleList}>
        <li>Urgence (&lt;24h): +{urgentPercent}%</li>
        <li>Nuit: +{nightPercent}%</li>
        <li>Week-end: +{weekendPercent}%</li>
        <li>Haute saison: +{highSeasonPercent}%</li>
        <li>Minimum de facture: {minimumInvoice} EUR</li>
      </ul>
    </section>
  );
}

export function TariffBillingDeskSection({
  styles,
  renderSection,
  sectionId,
  title = "Devis & factures",
  collapsible = true,
  missionRowsCount,
  deskProps,
}: TariffBillingDeskSectionProps) {
  return (
    <div
      id="tariffs-billing-desk"
      className={`${styles.financeCard} ${styles.financeCardFull} ${styles.tariffPanelCard} ${styles.tariffEmphasisCard}`}
    >
      {renderSection(
        title,
        <FiFile />,
        <>
          <div className={styles.tariffCardIntro}>
            <div className={styles.tariffInlineHeader}>
              <h3 className={styles.tariffMiniTitle}>Production documentaire</h3>
              <span className={styles.tariffConfigChip}>{missionRowsCount} mission(s) disponible(s)</span>
            </div>
            <p className={styles.tariffHint}>
              Créez, validez et suivez vos devis/factures depuis une interface unique.
            </p>
          </div>
          <div className={styles.tariffToolPanel}>
            <TariffBillingDesk {...deskProps} />
          </div>
        </>,
        false,
        sectionId,
        collapsible,
      )}
    </div>
  );
}

export function TariffPricingModal({
  styles,
  isOpen,
  state,
  catalogServices,
  saving,
  canEdit,
  error,
  pricingUnitOptions,
  closeModal,
  saveServicePrice,
  resetState,
  setState,
}: TariffPricingModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.pricingModalOverlay} role="dialog" aria-modal="true">
      <div className={styles.pricingModal}>
        <div className={styles.pricingModalHeader}>
          <h4>{state.id ? "Modifier le tarif" : "Ajouter un tarif"}</h4>
          <button
            type="button"
            className={styles.pricingModalClose}
            onClick={closeModal}
            aria-label="Fermer la modale tarif"
            title="Fermer la modale tarif"
          >
            ×
          </button>
        </div>
        <div className={styles.pricingModalBody}>
          <label>
            <span>Service</span>
            <select
              aria-label="Service du tarif"
              title="Service du tarif"
              value={state.serviceId}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  serviceId: e.target.value,
                  label:
                    prev.label ||
                    catalogServices.find((item) => String(item.id) === e.target.value)?.service ||
                    "",
                }))
              }
              disabled={saving || !canEdit}
            >
              <option value="">Sélectionner un service</option>
              {catalogServices.map((service) => (
                <option key={service.id} value={String(service.id)}>
                  {service.service}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Libellé (optionnel)</span>
            <input
              aria-label="Libellé du tarif"
              type="text"
              value={state.label}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  label: e.target.value,
                }))
              }
              disabled={saving || !canEdit}
              placeholder="Ex : Ménage villa haute saison"
            />
          </label>
          <div className={styles.pricingModalGrid}>
            <label>
              <span>Tarif (EUR)</span>
              <input
                aria-label="Montant du tarif en euros"
                type="number"
                min={0}
                step="1"
                value={state.amount}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                disabled={saving || !canEdit}
              />
            </label>
            <label>
              <span>Unite</span>
              <select
                aria-label="Unite du tarif"
                title="Unite du tarif"
                value={state.unit}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    unit: e.target.value,
                  }))
                }
                disabled={saving || !canEdit}
              >
                {pricingUnitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            <span>Type de tarification</span>
            <select
              aria-label="Type de tarification"
              title="Type de tarification"
              value={state.type}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  type: e.target.value,
                }))
              }
              disabled={saving || !canEdit}
            >
              <option value="fixed">Forfait</option>
              <option value="hourly">Horaire</option>
              <option value="monthly">Mensuel</option>
              <option value="custom">Personnalise</option>
            </select>
          </label>
          {error && <p className={styles.pricingModalError}>{error}</p>}
        </div>
        <div className={styles.pricingModalActions}>
          <button type="button" className={styles.pricingActionBtn} onClick={resetState} disabled={saving || !canEdit}>
            Réinitialiser
          </button>
          <button type="button" className={styles.pricingActionBtn} onClick={closeModal} disabled={saving}>
            Annuler
          </button>
          <button type="button" className={styles.tariffNavBtn} onClick={saveServicePrice} disabled={saving || !canEdit}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TariffServicesCatalogSection({
  styles,
  configuredPricingCount,
  pricingCatalogRowsCount,
  pricingSortMode,
  setPricingSortMode,
  showAllPricingServices,
  setShowAllPricingServices,
  canEditTariffConfig,
  servicePricesCount,
  servicePricesBusyId,
  servicePricesLoading,
  visiblePricingCatalogRowsCount,
  groupedPricingCatalogRows,
  collapsedPricingCategories,
  togglePricingCategory,
  pricingServiceActions,
}: TariffServicesCatalogSectionProps) {
  return (
    <section className={styles.tariffSimpleCard}>
      <h3 className={styles.tariffSimpleTitle}>C. Catalogue de services</h3>
      <p className={styles.tariffHint}>
        Nommez vos prestations librement et fixez un tarif par service pour plus de transparence client.
      </p>
      <div className={styles.pricingToolbar}>
        <span className={styles.pricingSummary}>
          {configuredPricingCount} / {pricingCatalogRowsCount} services configurés
        </span>
        <div className={styles.pricingToolbarActions}>
          <label className={styles.pricingSelectRow}>
            <span>Trier</span>
            <select
              value={pricingSortMode}
              onChange={(e) => setPricingSortMode(e.target.value === "service" ? "service" : "category")}
            >
              <option value="category">Par categorie</option>
              <option value="service">Par service</option>
            </select>
          </label>
          <label className={styles.pricingToggleRow}>
            <input
              type="checkbox"
              checked={showAllPricingServices}
              onChange={(e) => setShowAllPricingServices(e.target.checked)}
            />
            <span>Afficher tous les services catalogués</span>
          </label>
          <button
            type="button"
            className={styles.tariffNavBtn}
            disabled={!canEditTariffConfig}
            onClick={() => pricingServiceActions.openCreatePricingModal()}
          >
            Ajouter un tarif
          </button>
          <button
            type="button"
            className={styles.tariffNavBtn}
            disabled={!canEditTariffConfig || servicePricesCount === 0 || servicePricesBusyId === "all"}
            onClick={pricingServiceActions.resetAllServicePrices}
          >
            Réinitialiser
          </button>
        </div>
      </div>
      {servicePricesLoading ? (
        <p className={styles.tariffHint}>Chargement de la grille tarifaire...</p>
      ) : visiblePricingCatalogRowsCount === 0 ? (
        <p className={styles.tariffHint}>
          Aucun service mission actif. Activez vos services depuis l&apos;onglet Missions.
        </p>
      ) : (
        <div className={styles.pricingTableScroll}>
          <div className={styles.pricingTableHead}>
            <span>Service</span>
            <span>Tarif</span>
            <span>Unite</span>
            <span>Actions</span>
          </div>
          <div className={styles.pricingTable}>
            {groupedPricingCatalogRows.map((group) => (
              <section key={group.category} className={styles.pricingCategoryBlock}>
                <button
                  type="button"
                  className={styles.pricingCategoryTitle}
                  onClick={() => togglePricingCategory(group.category)}
                >
                  <span>{group.category}</span>
                  <small>{group.rows.length}</small>
                  <strong>{collapsedPricingCategories[group.category] ? "+" : "-"}</strong>
                </button>
                {!collapsedPricingCategories[group.category] &&
                  group.rows.map(({ service, pricing, isActiveMissionService }) => (
                    <div key={service.id} className={styles.pricingTableRow}>
                      <div className={styles.pricingServiceCell}>
                        <strong>{service.service}</strong>
                        <div className={styles.pricingBadgeRow}>
                          <span
                            className={`${styles.pricingStatusBadge} ${
                              pricing ? styles.pricingStatusConfigured : styles.pricingStatusMissing
                            }`}
                          >
                            {pricing ? "Actif" : "Non configuré"}
                          </span>
                          {!isActiveMissionService && (
                            <span className={styles.pricingTagMuted}>Hors offre</span>
                          )}
                        </div>
                      </div>
                      <div>
                        {pricing ? (
                          <strong>{Math.round(pricing.amount)} EUR</strong>
                        ) : (
                          <span className={styles.pricingEmptyValue}>-</span>
                        )}
                      </div>
                      <div>
                        {pricing?.unit ? (
                          <span>{pricing.unit}</span>
                        ) : (
                          <span className={styles.pricingEmptyValue}>-</span>
                        )}
                      </div>
                      <div className={styles.pricingRowActions}>
                        {pricing ? (
                          <>
                            <button
                              type="button"
                              className={styles.pricingActionBtn}
                              disabled={!canEditTariffConfig || servicePricesBusyId != null}
                              onClick={() => pricingServiceActions.openEditPricingModal(pricing)}
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              className={styles.pricingActionBtnDanger}
                              disabled={!canEditTariffConfig || servicePricesBusyId != null}
                              onClick={() => pricingServiceActions.deleteServicePrice(pricing)}
                            >
                              Supprimer
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className={styles.pricingActionBtn}
                            disabled={!canEditTariffConfig || servicePricesBusyId != null}
                            onClick={() => pricingServiceActions.openCreatePricingModal(service)}
                          >
                            Ajouter
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </section>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function TariffSegmentsSection({
  styles,
  canEditTariffConfig,
  segmentDraft,
  setSegmentDraft,
  segmentsBusyId,
  createPricingSegment,
  segmentsLoading,
  pricingSegments,
  setPricingSegments,
  updatePricingSegment,
  deletePricingSegment,
}: TariffSegmentsSectionProps) {
  return (
    <section className={styles.tariffSimpleCard}>
      <h3 className={styles.tariffSimpleTitle}>E. Segments propriétaires</h3>
      <p className={styles.tariffHint}>
        Appliquez des variations de commission et de set-up selon votre typologie client.
      </p>
      <div className={styles.pricingSegmentsDraft}>
        <input
          type="text"
          aria-label="Nom du segment propriétaire"
          title="Nom du segment propriétaire"
          placeholder="Nom du segment (ex: Grands comptes)"
          value={segmentDraft.name}
          disabled={!canEditTariffConfig}
          onChange={(e) => setSegmentDraft((prev) => ({ ...prev, name: e.target.value }))}
        />
        <input
          type="number"
          step="0.1"
          aria-label="Variation de commission du segment en pourcentage"
          title="Variation de commission du segment en pourcentage"
          placeholder="Delta commission %"
          value={segmentDraft.commission_delta_pct}
          disabled={!canEditTariffConfig}
          onChange={(e) =>
            setSegmentDraft((prev) => ({
              ...prev,
              commission_delta_pct: e.target.value,
            }))
          }
        />
        <input
          type="number"
          step="0.1"
          aria-label="Variation des frais de set-up du segment en pourcentage"
          title="Variation des frais de set-up du segment en pourcentage"
          placeholder="Delta set-up %"
          value={segmentDraft.setup_fee_delta_pct}
          disabled={!canEditTariffConfig}
          onChange={(e) =>
            setSegmentDraft((prev) => ({
              ...prev,
              setup_fee_delta_pct: e.target.value,
            }))
          }
        />
        <button
          type="button"
          className={styles.tariffNavBtn}
          disabled={!canEditTariffConfig || segmentsBusyId === "create"}
          onClick={createPricingSegment}
        >
          Ajouter segment
        </button>
      </div>
      {segmentsLoading ? (
        <p className={styles.tariffHint}>Chargement des segments...</p>
      ) : pricingSegments.length === 0 ? (
        <p className={styles.tariffHint}>Aucun segment configuré.</p>
      ) : (
        <div className={styles.pricingSegmentsList}>
          {pricingSegments.map((segment) => (
            <article key={segment.id} className={styles.pricingSegmentRow}>
              <input
                aria-label={`Nom du segment ${segment.name}`}
                type="text"
                value={segment.name}
                disabled={!canEditTariffConfig || segmentsBusyId === segment.id}
                onChange={(e) =>
                  setPricingSegments((prev) =>
                    prev.map((item) =>
                      item.id === segment.id ? { ...item, name: e.target.value } : item,
                    ),
                  )
                }
              />
              <input
                aria-label={`Delta commission du segment ${segment.name}`}
                type="number"
                step="0.1"
                value={segment.commission_delta_pct}
                disabled={!canEditTariffConfig || segmentsBusyId === segment.id}
                onChange={(e) =>
                  setPricingSegments((prev) =>
                    prev.map((item) =>
                      item.id === segment.id
                        ? { ...item, commission_delta_pct: Number(e.target.value || 0) }
                        : item,
                    ),
                  )
                }
              />
              <input
                aria-label={`Delta frais de set-up du segment ${segment.name}`}
                type="number"
                step="0.1"
                value={segment.setup_fee_delta_pct}
                disabled={!canEditTariffConfig || segmentsBusyId === segment.id}
                onChange={(e) =>
                  setPricingSegments((prev) =>
                    prev.map((item) =>
                      item.id === segment.id
                        ? { ...item, setup_fee_delta_pct: Number(e.target.value || 0) }
                        : item,
                    ),
                  )
                }
              />
              <label className={styles.pricingSegmentDefault}>
                <input
                  type="checkbox"
                  checked={segment.is_default}
                  disabled={!canEditTariffConfig || segmentsBusyId === segment.id}
                  onChange={(e) =>
                    setPricingSegments((prev) =>
                      prev.map((item) =>
                        item.id === segment.id
                          ? { ...item, is_default: e.target.checked }
                          : e.target.checked
                            ? { ...item, is_default: false }
                            : item,
                      ),
                    )
                  }
                />
                <span>Defaut</span>
              </label>
              <div className={styles.pricingRowActions}>
                <button
                  type="button"
                  className={styles.pricingActionBtn}
                  disabled={!canEditTariffConfig || segmentsBusyId === segment.id}
                  onClick={() => updatePricingSegment(segment)}
                >
                  Sauver
                </button>
                <button
                  type="button"
                  className={styles.pricingActionBtnDanger}
                  disabled={!canEditTariffConfig || segmentsBusyId === segment.id}
                  onClick={() => deletePricingSegment(segment.id)}
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function TariffPropertyRulesSection({
  styles,
  canEditTariffConfig,
  propertyRuleDraft,
  setPropertyRuleDraft,
  propertyRulesBusyId,
  createPricingPropertyRule,
  propertyRulesLoading,
  propertyRules,
  setPropertyRules,
  updatePricingPropertyRule,
  deletePricingPropertyRule,
  catalogServices,
}: TariffPropertyRulesSectionProps) {
  return (
    <section className={styles.tariffSimpleCard}>
      <h3 className={styles.tariffSimpleTitle}>F. Complexite mission</h3>
      <p className={styles.tariffHint}>Créez des modulateurs par type de bien et surface.</p>
      <div className={styles.pricingSegmentsDraft}>
        <select
          aria-label="Service optionnel pour la règle de bien"
          title="Service optionnel pour la règle de bien"
          value={propertyRuleDraft.service_id}
          disabled={!canEditTariffConfig}
          onChange={(e) =>
            setPropertyRuleDraft((prev) => ({
              ...prev,
              service_id: e.target.value,
            }))
          }
        >
          <option value="">Service (optionnel)</option>
          {catalogServices.map((service) => (
            <option key={service.id} value={String(service.id)}>
              {service.service}
            </option>
          ))}
        </select>
        <input
          aria-label="Type de bien pour la nouvelle règle"
          type="text"
          placeholder="Type de bien (ex: villa)"
          value={propertyRuleDraft.property_type}
          disabled={!canEditTariffConfig}
          onChange={(e) =>
            setPropertyRuleDraft((prev) => ({
              ...prev,
              property_type: e.target.value,
            }))
          }
        />
        <input
          aria-label="Surface minimale pour la nouvelle règle"
          type="number"
          placeholder="Surface min m²"
          value={propertyRuleDraft.min_surface_m2}
          disabled={!canEditTariffConfig}
          onChange={(e) =>
            setPropertyRuleDraft((prev) => ({
              ...prev,
              min_surface_m2: e.target.value,
            }))
          }
        />
        <input
          aria-label="Surface maximale pour la nouvelle règle"
          type="number"
          placeholder="Surface max m²"
          value={propertyRuleDraft.max_surface_m2}
          disabled={!canEditTariffConfig}
          onChange={(e) =>
            setPropertyRuleDraft((prev) => ({
              ...prev,
              max_surface_m2: e.target.value,
            }))
          }
        />
        <input
          aria-label="Variation en pourcentage pour la nouvelle règle"
          type="number"
          step="0.1"
          placeholder="Variation %"
          value={propertyRuleDraft.delta_pct}
          disabled={!canEditTariffConfig}
          onChange={(e) =>
            setPropertyRuleDraft((prev) => ({
              ...prev,
              delta_pct: e.target.value,
            }))
          }
        />
        <button
          type="button"
          className={styles.tariffNavBtn}
          disabled={!canEditTariffConfig || propertyRulesBusyId === "create"}
          onClick={createPricingPropertyRule}
        >
          Ajouter règle
        </button>
      </div>
      {propertyRulesLoading ? (
        <p className={styles.tariffHint}>Chargement des règles...</p>
      ) : propertyRules.length === 0 ? (
        <p className={styles.tariffHint}>Aucune règle définie.</p>
      ) : (
        <div className={styles.pricingSegmentsList}>
          {propertyRules.map((rule) => (
            <article key={rule.id} className={styles.pricingSegmentRow}>
              <input
                aria-label={`Type de bien pour la règle ${rule.id}`}
                type="text"
                value={rule.property_type ?? ""}
                disabled={!canEditTariffConfig || propertyRulesBusyId === rule.id}
                onChange={(e) =>
                  setPropertyRules((prev) =>
                    prev.map((item) =>
                      item.id === rule.id ? { ...item, property_type: e.target.value || null } : item,
                    ),
                  )
                }
              />
              <input
                aria-label={`Surface minimale pour la règle ${rule.id}`}
                type="number"
                placeholder="min"
                value={rule.min_surface_m2 ?? ""}
                disabled={!canEditTariffConfig || propertyRulesBusyId === rule.id}
                onChange={(e) =>
                  setPropertyRules((prev) =>
                    prev.map((item) =>
                      item.id === rule.id
                        ? { ...item, min_surface_m2: e.target.value ? Number(e.target.value) : null }
                        : item,
                    ),
                  )
                }
              />
              <input
                aria-label={`Surface maximale pour la règle ${rule.id}`}
                type="number"
                placeholder="max"
                value={rule.max_surface_m2 ?? ""}
                disabled={!canEditTariffConfig || propertyRulesBusyId === rule.id}
                onChange={(e) =>
                  setPropertyRules((prev) =>
                    prev.map((item) =>
                      item.id === rule.id
                        ? { ...item, max_surface_m2: e.target.value ? Number(e.target.value) : null }
                        : item,
                    ),
                  )
                }
              />
              <input
                aria-label={`Variation en pourcentage pour la règle ${rule.id}`}
                type="number"
                step="0.1"
                value={rule.delta_pct}
                disabled={!canEditTariffConfig || propertyRulesBusyId === rule.id}
                onChange={(e) =>
                  setPropertyRules((prev) =>
                    prev.map((item) =>
                      item.id === rule.id ? { ...item, delta_pct: Number(e.target.value || 0) } : item,
                    ),
                  )
                }
              />
              <div className={styles.pricingRowActions}>
                <button
                  type="button"
                  className={styles.pricingActionBtn}
                  disabled={!canEditTariffConfig || propertyRulesBusyId === rule.id}
                  onClick={() => updatePricingPropertyRule(rule)}
                >
                  Sauver
                </button>
                <button
                  type="button"
                  className={styles.pricingActionBtnDanger}
                  disabled={!canEditTariffConfig || propertyRulesBusyId === rule.id}
                  onClick={() => deletePricingPropertyRule(rule.id)}
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function TariffStrategySection({
  styles,
  strategySim,
  setStrategySim,
  pricingSegments,
  catalogServices,
  propertyTypeOptions,
  applyStrategyProjectionToBillingDesk,
  scenarioDraftName,
  setScenarioDraftName,
  canEditTariffConfig,
  scenariosBusyId,
  createPricingScenario,
  resetStrategySim,
  scenariosLoading,
  pricingScenarios,
  loadPricingScenario,
  setDefaultPricingScenario,
  deletePricingScenario,
  selectedPricingSegmentName,
  strategyProjection,
  formatCurrency,
}: TariffStrategySectionProps) {
  return (
    <section className={styles.tariffSimpleCard}>
      <h3 className={styles.tariffSimpleTitle}>G. Simulateur stratégique</h3>
      <p className={styles.tariffHint}>
        Testez un scénario commercial puis injectez-le dans Devis & factures.
      </p>
      <div className={styles.pricingSegmentsDraft}>
        <select
          aria-label="Segment pour la simulation stratégique"
          title="Segment pour la simulation stratégique"
          value={strategySim.segmentId}
          onChange={(e) => setStrategySim((prev) => ({ ...prev, segmentId: e.target.value }))}
        >
          <option value="">Segment automatique (défaut)</option>
          {pricingSegments.map((segment) => (
            <option key={segment.id} value={segment.id}>
              {segment.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Service acte pour la simulation stratégique"
          title="Service acte pour la simulation stratégique"
          value={strategySim.serviceId}
          onChange={(e) => setStrategySim((prev) => ({ ...prev, serviceId: e.target.value }))}
        >
          <option value="">Service acte (optionnel)</option>
          {catalogServices.map((service) => (
            <option key={service.id} value={String(service.id)}>
              {service.service}
            </option>
          ))}
        </select>
        <select
          aria-label="Type de bien pour la simulation stratégique"
          title="Type de bien pour la simulation stratégique"
          value={strategySim.propertyType}
          onChange={(e) => setStrategySim((prev) => ({ ...prev, propertyType: e.target.value }))}
        >
          {propertyTypeOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          aria-label="Surface du bien pour la simulation stratégique"
          type="number"
          min={0}
          step={1}
          value={strategySim.surfaceM2}
          onChange={(e) => setStrategySim((prev) => ({ ...prev, surfaceM2: e.target.value }))}
          placeholder="Surface m2"
        />
        <input
          aria-label="Revenus mensuels estimés pour la simulation stratégique"
          type="number"
          min={0}
          step={100}
          value={strategySim.revenueEstimate}
          onChange={(e) => setStrategySim((prev) => ({ ...prev, revenueEstimate: e.target.value }))}
          placeholder="Revenus mensuels EUR"
        />
        <input
          aria-label="Nombre de nouveaux logements par mois pour la simulation stratégique"
          type="number"
          min={0}
          step={1}
          value={strategySim.newListingsCount}
          onChange={(e) => setStrategySim((prev) => ({ ...prev, newListingsCount: e.target.value }))}
          placeholder="Nouveaux logements / mois"
        />
      </div>
      <div className={styles.pricingSegmentsDraft}>
        <input
          aria-label="Nombre de services à l'acte par mois pour la simulation stratégique"
          type="number"
          min={0}
          step={1}
          value={strategySim.actServicesCount}
          onChange={(e) => setStrategySim((prev) => ({ ...prev, actServicesCount: e.target.value }))}
          placeholder="Services a l'acte / mois"
        />
        <label className={styles.tariffQuoteToggle}>
          <input
            type="checkbox"
            checked={strategySim.isUrgent}
            onChange={(e) => setStrategySim((prev) => ({ ...prev, isUrgent: e.target.checked }))}
          />
          <span>Urgence</span>
        </label>
        <label className={styles.tariffQuoteToggle}>
          <input
            type="checkbox"
            checked={strategySim.isNight}
            onChange={(e) => setStrategySim((prev) => ({ ...prev, isNight: e.target.checked }))}
          />
          <span>Nuit</span>
        </label>
        <label className={styles.tariffQuoteToggle}>
          <input
            type="checkbox"
            checked={strategySim.isWeekend}
            onChange={(e) => setStrategySim((prev) => ({ ...prev, isWeekend: e.target.checked }))}
          />
          <span>Week-end</span>
        </label>
        <label className={styles.tariffQuoteToggle}>
          <input
            type="checkbox"
            checked={strategySim.isHighSeason}
            onChange={(e) => setStrategySim((prev) => ({ ...prev, isHighSeason: e.target.checked }))}
          />
          <span>Haute saison</span>
        </label>
        <button type="button" className={styles.tariffNavBtn} onClick={applyStrategyProjectionToBillingDesk}>
          Appliquer au devis/facturation
        </button>
      </div>
      <div className={styles.pricingSegmentsDraft}>
        <input
          aria-label="Nom du scénario stratégique"
          type="text"
          placeholder="Nom du scénario (ex : Premium Paris)"
          value={scenarioDraftName}
          disabled={!canEditTariffConfig}
          onChange={(e) => setScenarioDraftName(e.target.value)}
        />
        <button
          type="button"
          className={styles.tariffNavBtn}
          disabled={!canEditTariffConfig || scenariosBusyId === "create"}
          onClick={createPricingScenario}
        >
          {scenariosBusyId === "create" ? "Enregistrement..." : "Enregistrer scénario"}
        </button>
        <button type="button" className={styles.pricingActionBtn} onClick={resetStrategySim}>
          Réinitialiser simulation
        </button>
      </div>
      {scenariosLoading ? (
        <p className={styles.tariffHint}>Chargement des scénarios...</p>
      ) : pricingScenarios.length === 0 ? (
        <p className={styles.tariffHint}>Aucun scénario enregistré.</p>
      ) : (
        <div className={styles.pricingSegmentsList}>
          {pricingScenarios.map((row) => (
            <article key={row.id} className={styles.pricingSegmentRow}>
              <strong>{row.name}</strong>
              <span>{row.is_default ? "Par défaut" : "Scénario"}</span>
              <div className={styles.pricingRowActions}>
                <button
                  type="button"
                  className={styles.pricingActionBtn}
                  disabled={scenariosBusyId === row.id}
                  onClick={() => loadPricingScenario(row)}
                >
                  Charger
                </button>
                <button
                  type="button"
                  className={styles.pricingActionBtn}
                  disabled={scenariosBusyId === row.id}
                  onClick={() => setDefaultPricingScenario(row)}
                >
                  Defaut
                </button>
                <button
                  type="button"
                  className={styles.pricingActionBtnDanger}
                  disabled={scenariosBusyId === row.id}
                  onClick={() => deletePricingScenario(row.id)}
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className={styles.tariffSimpleRows}>
        <p>
          Segment actif: <strong>{selectedPricingSegmentName}</strong>
        </p>
        <p>
          Commission simulee: <strong>{strategyProjection.commissionEffectivePct.toFixed(1)}%</strong>
        </p>
        <p>
          Projection mensuelle: <strong>{formatCurrency(strategyProjection.total, "EUR")}</strong>
        </p>
      </div>
      <ul className={styles.tariffRuleList}>
        <li>Commission: {formatCurrency(strategyProjection.commissionAmount, "EUR")}</li>
        <li>Set-up: {formatCurrency(strategyProjection.setupAmount, "EUR")}</li>
        <li>Catalogue: {formatCurrency(strategyProjection.actAmount, "EUR")}</li>
        <li>{strategyProjection.narrative}</li>
      </ul>
    </section>
  );
}

export function ConciergeTariffsTabContent({
  styles,
  renderSection,
  sectionIds,
  mode = "tarifs",
  tariffOverviewControls,
  tariffFoundationControls,
  tariffConfigControls,
  editingSection,
  pricingCatalogRows,
  activeMissionServiceLabels,
  renderField,
  tariffCatalogControls,
  pricingSegmentsControls,
  pricingRulesControls,
  pricingScenarioControls,
  pricingModalControls,
  billingDeskSectionProps,
  formatExperienceLabel,
}: ConciergeTariffsTabContentProps) {
  if (mode === "devis") {
    return (
      <div className={styles.financeGrid}>
        <TariffBillingDeskSection
          styles={styles}
          renderSection={renderSection}
          sectionId={sectionIds.BILLING_DESK}
          title="Devis & factures"
          collapsible={false}
          missionRowsCount={billingDeskSectionProps.missionRowsCount}
          deskProps={billingDeskSectionProps.deskProps}
        />
      </div>
    );
  }

  return (
    <div className={styles.financeGrid}>
      <TariffWorkflowSection
        styles={styles}
        renderSection={renderSection}
        sectionId={sectionIds.WORKFLOW}
        title="Grille tarifaire"
        commissionRatePct={tariffFoundationControls.pricingMeta.commissionRatePct}
        hourlyRate={tariffFoundationControls.pricingV2.base.hourlyRate}
        configuredPricingCount={tariffOverviewControls.configuredPricingCount}
        tariffReadinessPercent={tariffOverviewControls.tariffReadinessPercent}
        pendingChecksCount={tariffOverviewControls.pendingTariffReadinessChecks.length}
        pendingChecks={tariffOverviewControls.pendingTariffReadinessChecks}
        onScrollConfig={() => tariffOverviewControls.scrollToTariffSection("tariffs-config")}
        onScrollBilling={() => tariffOverviewControls.scrollToTariffSection("tariffs-billing-desk")}
        onGoToMissions={() => tariffOverviewControls.handleTabChange("missions")}
      />

      <TariffConfigShell
        styles={styles}
        renderSection={renderSection}
        sectionId={sectionIds.CONFIG}
      >
        <TariffPillarsSection
          styles={styles}
          hourlyRate={tariffFoundationControls.pricingV2.base.hourlyRate}
          travelFee={tariffFoundationControls.pricingV2.base.travelFee}
          minimumInvoice={tariffFoundationControls.pricingV2.base.minimumInvoice}
          commissionRatePct={tariffFoundationControls.pricingMeta.commissionRatePct}
          setupFee={tariffFoundationControls.pricingMeta.setupFee}
          editingDisabled={editingSection !== sectionIds.CONFIG}
          onCommissionRateChange={(value) =>
            tariffConfigControls.applyPricingMeta({
              ...tariffFoundationControls.pricingMeta,
              commissionRatePct: value,
            })
          }
          onSetupFeeChange={(value) =>
            tariffConfigControls.applyPricingMeta({
              ...tariffFoundationControls.pricingMeta,
              setupFee: value,
            })
          }
          configuredPricingCount={tariffOverviewControls.configuredPricingCount}
          pricingCatalogRowsCount={pricingCatalogRows.length}
          activeMissionServiceLabelsCount={activeMissionServiceLabels.length}
        />

        <div className={styles.tariffSimpleGrid}>
          <TariffContextSection
            styles={styles}
            experienceLabel={tariffFoundationControls.formatExperienceLabel(tariffFoundationControls.editProfile.experience_level ?? null)}
            locationLabel={tariffConfigControls.tariffLocationLabel}
            radiusKm={tariffFoundationControls.missionAvailability?.radiusKm ?? 0}
            urgentEnabled={tariffFoundationControls.missionPayload.preferences.priorityFlags.urgent}
            urgentPercent={tariffFoundationControls.pricingV2.globalModifiers.urgentPercent}
            highSeasonEnabled={
              tariffFoundationControls.missionPayload.missionProfile.specialConditions
                .acceptHighSeasonInterventions
            }
            highSeasonPercent={tariffFoundationControls.pricingV2.globalModifiers.highSeasonPercent}
          />

          <TariffBaseSection
            styles={styles}
            renderField={renderField}
            sectionId={sectionIds.CONFIG}
            editingSection={editingSection}
            minimumInvoice={tariffFoundationControls.pricingV2.base.minimumInvoice}
            onMinimumInvoiceChange={(value) =>
              tariffConfigControls.applyPricingV2({
                ...tariffFoundationControls.pricingV2,
                base: {
                  ...tariffFoundationControls.pricingV2.base,
                  minimumInvoice: value,
                },
              })
            }
          />

          <TariffServicesCatalogSection
            styles={styles}
            configuredPricingCount={tariffOverviewControls.configuredPricingCount}
            pricingCatalogRowsCount={pricingCatalogRows.length}
            pricingSortMode={tariffCatalogControls.pricingSortMode}
            setPricingSortMode={tariffCatalogControls.setPricingSortMode}
            showAllPricingServices={tariffCatalogControls.showAllPricingServices}
            setShowAllPricingServices={tariffCatalogControls.setShowAllPricingServices}
            canEditTariffConfig={tariffCatalogControls.canEditTariffConfig}
            servicePricesCount={tariffCatalogControls.servicePrices.length}
            servicePricesBusyId={tariffCatalogControls.servicePricesBusyId}
            servicePricesLoading={tariffCatalogControls.servicePricesLoading}
            visiblePricingCatalogRowsCount={tariffCatalogControls.visiblePricingCatalogRows.length}
            groupedPricingCatalogRows={tariffCatalogControls.groupedPricingCatalogRows}
            collapsedPricingCategories={tariffCatalogControls.collapsedPricingCategories}
            togglePricingCategory={tariffCatalogControls.togglePricingCategory}
            pricingServiceActions={tariffCatalogControls.pricingServiceActions}
          />

          <TariffModifiersSection
            styles={styles}
            propertyTypeOptions={tariffConfigControls.propertyTypeOptions}
            getPropertyTypeDeltaPercent={tariffConfigControls.getPropertyTypeDeltaPercent}
            updatePropertyTypeDeltaPercent={tariffConfigControls.updatePropertyTypeDeltaPercent}
            editingSection={editingSection}
            sectionId={sectionIds.CONFIG}
            urgentPercent={tariffFoundationControls.pricingV2.globalModifiers.urgentPercent}
            nightPercent={tariffFoundationControls.pricingV2.globalModifiers.nightPercent}
            weekendPercent={tariffFoundationControls.pricingV2.globalModifiers.weekendPercent}
            highSeasonPercent={tariffFoundationControls.pricingV2.globalModifiers.highSeasonPercent}
            minimumInvoice={tariffFoundationControls.pricingV2.base.minimumInvoice}
          />

          <TariffSegmentsSection
            styles={styles}
            canEditTariffConfig={pricingSegmentsControls.canEditTariffConfig}
            segmentDraft={pricingSegmentsControls.segmentDraft}
            setSegmentDraft={pricingSegmentsControls.setSegmentDraft}
            segmentsBusyId={pricingSegmentsControls.segmentsBusyId}
            createPricingSegment={pricingSegmentsControls.pricingSegmentActions.createPricingSegment}
            segmentsLoading={pricingSegmentsControls.segmentsLoading}
            pricingSegments={pricingSegmentsControls.pricingSegments}
            setPricingSegments={pricingSegmentsControls.setPricingSegments}
            updatePricingSegment={pricingSegmentsControls.pricingSegmentActions.updatePricingSegment}
            deletePricingSegment={pricingSegmentsControls.pricingSegmentActions.deletePricingSegment}
          />

          <TariffPropertyRulesSection
            styles={styles}
            canEditTariffConfig={pricingRulesControls.canEditTariffConfig}
            propertyRuleDraft={pricingRulesControls.propertyRuleDraft}
            setPropertyRuleDraft={pricingRulesControls.setPropertyRuleDraft}
            propertyRulesBusyId={pricingRulesControls.propertyRulesBusyId}
            createPricingPropertyRule={pricingRulesControls.pricingPropertyRuleActions.createPricingPropertyRule}
            propertyRulesLoading={pricingRulesControls.propertyRulesLoading}
            propertyRules={pricingRulesControls.propertyRules}
            setPropertyRules={pricingRulesControls.setPropertyRules}
            updatePricingPropertyRule={pricingRulesControls.pricingPropertyRuleActions.updatePricingPropertyRule}
            deletePricingPropertyRule={pricingRulesControls.pricingPropertyRuleActions.deletePricingPropertyRule}
            catalogServices={pricingRulesControls.catalogServices}
          />

          <TariffStrategySection
            styles={styles}
            strategySim={pricingScenarioControls.strategySim}
            setStrategySim={pricingScenarioControls.setStrategySim}
            pricingSegments={pricingScenarioControls.pricingSegments}
            catalogServices={pricingScenarioControls.catalogServices}
            propertyTypeOptions={pricingScenarioControls.propertyTypeOptions}
            applyStrategyProjectionToBillingDesk={pricingScenarioControls.applyStrategyProjectionToBillingDesk}
            scenarioDraftName={pricingScenarioControls.scenarioDraftName}
            setScenarioDraftName={pricingScenarioControls.setScenarioDraftName}
            canEditTariffConfig={pricingScenarioControls.canEditTariffConfig}
            scenariosBusyId={pricingScenarioControls.scenariosBusyId}
            createPricingScenario={pricingScenarioControls.pricingScenarioActions.createPricingScenario}
            resetStrategySim={pricingScenarioControls.pricingScenarioActions.resetStrategySim}
            scenariosLoading={pricingScenarioControls.scenariosLoading}
            pricingScenarios={pricingScenarioControls.pricingScenarios}
            loadPricingScenario={pricingScenarioControls.pricingScenarioActions.loadPricingScenario}
            setDefaultPricingScenario={pricingScenarioControls.pricingScenarioActions.setDefaultPricingScenario}
            deletePricingScenario={pricingScenarioControls.pricingScenarioActions.deletePricingScenario}
            selectedPricingSegmentName={pricingScenarioControls.selectedPricingSegment?.name ?? "Standard"}
            strategyProjection={pricingScenarioControls.strategyProjection}
            formatCurrency={pricingScenarioControls.formatCurrency}
          />
        </div>

        <TariffPricingModal
          styles={styles}
          isOpen={pricingModalControls.pricingModalOpen}
          state={pricingModalControls.pricingModalState}
          catalogServices={pricingRulesControls.catalogServices}
          saving={pricingModalControls.pricingModalSaving}
          canEdit={tariffCatalogControls.canEditTariffConfig}
          error={pricingModalControls.pricingModalError}
          pricingUnitOptions={pricingModalControls.pricingUnitOptions}
          closeModal={pricingModalControls.closePricingModal}
          saveServicePrice={pricingModalControls.saveServicePrice}
          resetState={pricingModalControls.resetPricingModalToDefaults}
          setState={pricingModalControls.setPricingModalState}
        />
      </TariffConfigShell>

      <TariffBillingDeskSection
        styles={styles}
        renderSection={renderSection}
        sectionId={sectionIds.BILLING_DESK}
        title="Devis & factures"
        missionRowsCount={billingDeskSectionProps.missionRowsCount}
        deskProps={billingDeskSectionProps.deskProps}
      />
    </div>
  );
}




