"use client";

import Link from "next/link";
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
  FiShield as FiShieldOutline,
  FiStar as FiStarOutline,
  FiTarget,
  FiUsers,
} from "react-icons/fi";
import { ChevronDown, Edit2, LucideUser, Save, Shield, Star, X as LucideX } from "lucide-react";
import ServicePackageManager from "@/app/components/dashboard/concierge/ServicePackageManager/ServicePackageManager";
import ProfileSummary from "@/app/components/dashboard/concierge/ProfileSummary/ProfileSummary";
import { CompletionStatusCard } from "@/components/dashboard";
import SocialLinksManager from "@/app/components/dashboard/SocialLinksManager/SocialLinksManager";
import { ProfileIdentity } from "@/app/components/dashboard/concierge/ProfileSummary/profileIdentity";
import { ProfileOverviewWorkspace } from "@/app/components/dashboard/profile/ProfileOverviewWorkspace";
import MissionDetails from "@/app/components/dashboard/concierge/MissionDetails/MissionDetails";
import MissionZoneAvailability from "@/app/components/missions/MissionZoneAvailability";
import AvailabilityEditor from "@/app/components/missions/AvailabilityEditor";
import TariffBillingDesk from "@/app/components/tariffs/TariffBillingDesk";
import InputWithValidation from "@/app/components/ui/InputWithValidation/InputWithValidation";
import type { ConciergeTabId } from "@/app/components/dashboard/concierge/conciergeTabsConfig";
import { buildConciergeProfileCompletion } from "@/app/dashboard/shared";
import type { MissionAvailability } from "@/app/components/missions/types";
import { ConciergeProfileShell } from "./profileShellSections";

type RenderSection = (
  title: string,
  icon: React.ReactNode,
  content: React.ReactNode,
  editable?: boolean,
  sectionId?: string,
  showEditTop?: boolean,
) => React.ReactNode;

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
  missionProfile: { missions: MissionProfileItem[] };
  missionCatalog: MissionCatalogItem[];
  preferences: unknown;
};
type MissionAvailabilityState = MissionAvailability;
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
type SetEditProfile = React.Dispatch<React.SetStateAction<EditProfileStateLike>>;
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

interface EditableProfileFieldProps {
  styles: Record<string, string>;
  label: string;
  name: string;
  value: string | number | null;
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
    profile: any;
    avatarFile: File | null;
    defaultAvatar: string;
    sectionIds: {
      INFO_PERSO: string;
      PRESENTATION: string;
    };
    setAvatarFile: (file: File | null) => void;
    handleSocialChange: (
      field: "website" | "linkedin" | "instagram" | "facebook",
      value: string,
    ) => void;
    errors: Record<string, string>;
  };
  editProfile: any;
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
  profile: any;
  editProfile: any;
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
  editingSection: string | null;
  sectionId: string;
}

interface FichePersonalInfoSectionProps {
  styles: Record<string, string>;
  renderSection: RenderSection;
  renderField: RenderField;
  editProfile: any;
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
  editProfile: any;
  editingSection: string | null;
  beginSectionEdit: (sectionId: string) => void;
  handleSocialChange: (
    field: "website" | "linkedin" | "instagram" | "facebook",
    value: string,
  ) => void;
  errors: Record<string, string>;
}

interface FicheStaticSidebarSectionProps {
  styles: Record<string, string>;
  profile: any;
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
          {value !== null && value !== "" ? value : "Non renseigné"}
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
    <div className={styles.section}>
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

interface MissionsTabLayoutProps {
  styles: Record<string, string>;
  missionProgressPercent: number;
  missionProgressDoneCount: number;
  missionProgressTotal: number;
  showPendingMissionStepsOnly: boolean;
  onTogglePendingSteps: () => void;
  activeMissionRawLabelsCount: number;
  recognizedActiveMissionCount: number;
  unrecognizedActiveMissionLabelsCount: number;
  missionOpenDaysCount: number;
  missionRangesCount: number;
  missionZonesCount: number;
  missionProgressSteps: MissionProgressStepItem[];
  openMissionSectionForEdit: (sectionId: string) => void;
  children: React.ReactNode;
  secondaryContent: React.ReactNode;
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
  renderSection: RenderSection;
  renderField: RenderField;
  sectionId: string;
  editingSection: string | null;
  missionAvailability: MissionAvailabilityState;
  setEditProfile: SetEditProfile;
  parseAvailabilityPayloadRaw: (value: string | null | undefined) => Record<string, unknown>;
}

interface MissionWeeklyAvailabilitySectionProps {
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
  tariffFoundationControls: unknown;
  tariffConfigControls: unknown;
  pricingCatalogRows: unknown;
  tariffCatalogControls: unknown;
  pricingSegmentsControls: unknown;
  pricingRulesControls: unknown;
  pricingScenarioControls: unknown;
  pricingModalControls: unknown;
  billingDeskSectionProps: unknown;
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
        "Mes packs de services",
        <FiBriefcase />,
        <>
          <p>
            Créez et gérez vos packs directement depuis votre profil concierge.
            Vous pourrez ensuite les relier à votre grille tarifaire et vos modèles de contrats.
          </p>
          <p>
            <Link href="/dashboard/concierge/services-packages/seed">
              Ouvrir la page seed test (2 packs + 2 modèles)
            </Link>
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
  switch (activeTab) {
    case "overview":
      return (
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
      );
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
      return (
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
      );
    case "packs":
      return (
        <ConciergePacksTabContent
          styles={styles}
          renderSection={simpleTabControls.renderSection}
          activeMissionServiceIds={simpleTabControls.activeMissionServiceCatalogIds}
          activeMissionServiceLabels={simpleTabControls.activeMissionServiceLabels}
        />
      );
    case "tarifs":
      return (
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
      );
    case "devis":
      return (
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
      );
    case "equipe":
      return (
        <ConciergeTeamTabContent
          renderSection={profileEditorControls.renderSection}
          renderField={profileEditorControls.renderField as RenderField}
        />
      );
    case "documents":
      return (
        <ConciergeDocumentsTabContent
          renderSection={simpleTabControls.renderSection}
          placeholderClassName={simpleTabControls.placeholderClassName}
        />
      );
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
            setEditProfile((prev: EditProfileStateLike) =>
              prev ? { ...prev, avatar_scale: scale } : prev,
            )
          }
          onAvatarOffsetChange={(offsetX, offsetY) =>
            setEditProfile((prev: EditProfileStateLike) =>
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
            setEditProfile((prev: EditProfileStateLike) =>
              prev ? { ...prev, avatar_rotation: rotation } : prev,
            )
          }
          onAvatarSave={() => handleSaveSection("Photo de profil")}
          onAvatarRemove={() => {
            setAvatarFile(null);
            setEditProfile((prev: EditProfileStateLike) =>
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
              {profile.years_experience != null
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
  editingSection,
  sectionId,
}: FichePresentationSectionProps) {
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
              setEditProfile((prev: EditProfileStateLike) =>
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
            {formatExperienceLabel(editProfile.experience_level)}
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
  return renderSection("Résumé du profil", <FiBarChart />, <ProfileSummary profile={profile} />, false);
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
  return (
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
          editingSection={editingSection}
          sectionId={ficheControls.sectionIds.PRESENTATION}
        />

        <FicheBadgeSection styles={styles} />
        <FicheSummarySection profile={ficheControls.profile} renderSection={renderSection} />
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
      </section>
    </div>
  );
}

export function ConciergeFicheTabContent(props: FicheTabSectionProps) {
  return <FicheTabSection {...props} />;
}

export function MissionsTabLayout({
  styles,
  missionProgressPercent,
  missionProgressDoneCount,
  missionProgressTotal,
  showPendingMissionStepsOnly,
  onTogglePendingSteps,
  activeMissionRawLabelsCount,
  recognizedActiveMissionCount,
  unrecognizedActiveMissionLabelsCount,
  missionOpenDaysCount,
  missionRangesCount,
  missionZonesCount,
  missionProgressSteps,
  openMissionSectionForEdit,
  children,
  secondaryContent,
}: MissionsTabLayoutProps) {
  const servicesStep = missionProgressSteps.find((step) => step.key === "services");
  const zoneStep = missionProgressSteps.find((step) => step.key === "zone");
  const availabilityStep = missionProgressSteps.find((step) => step.key === "availability");

  const renderMissionStatBadge = (step: MissionProgressStepItem | undefined, metricDone: boolean) => {
    const isPending = !metricDone || (step ? !step.done : false);
    if (!isPending || !step?.sectionId) return null;

    return (
      <button
        type="button"
        className={styles.missionPendingBadge}
        onClick={() => openMissionSectionForEdit(step.sectionId!)}
        title={`Completer: ${step.label}`}
      >
        <span className={styles.missionPendingDot} aria-hidden="true" />
        À compléter
      </button>
    );
  };

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
            onClick={onTogglePendingSteps}
            title="Filtrer les étapes à configurer"
            aria-pressed={showPendingMissionStepsOnly}
          >
            <div className={styles.missionProgressTrack} aria-hidden="true">
              <div
                className={styles.missionProgressFill}
                style={{ width: `${missionProgressPercent}%` }}
              />
            </div>
          </button>
          <p className={styles.missionsHeroProgressHint}>
            {missionProgressDoneCount}/{missionProgressTotal} étapes complétées
          </p>
        </div>
        <div className={styles.missionsHeroStats}>
          <div className={styles.missionStat}>
            <div className={styles.missionStatTop}>
              <span className={styles.missionStatLabel}>Services actifs</span>
              {renderMissionStatBadge(servicesStep, activeMissionRawLabelsCount > 0)}
            </div>
            <strong>{activeMissionRawLabelsCount}</strong>
            {unrecognizedActiveMissionLabelsCount > 0 && (
              <small className={styles.missionStatSub}>
                {recognizedActiveMissionCount} reconnus, {unrecognizedActiveMissionLabelsCount} non reconnus
              </small>
            )}
          </div>
          <div className={styles.missionStat}>
            <div className={styles.missionStatTop}>
              <span className={styles.missionStatLabel}>Jours ouverts</span>
              {renderMissionStatBadge(availabilityStep, missionOpenDaysCount > 0)}
            </div>
            <strong>{missionOpenDaysCount}/7</strong>
          </div>
          <div className={styles.missionStat}>
            <div className={styles.missionStatTop}>
              <span className={styles.missionStatLabel}>Plages horaires</span>
              {renderMissionStatBadge(availabilityStep, missionRangesCount > 0)}
            </div>
            <strong>{missionRangesCount}</strong>
          </div>
          <div className={styles.missionStat}>
            <div className={styles.missionStatTop}>
              <span className={styles.missionStatLabel}>Zones couvertes</span>
              {renderMissionStatBadge(zoneStep, missionZonesCount > 0)}
            </div>
            <strong>{missionZonesCount}</strong>
          </div>
        </div>
      </div>

      <CompletionStatusCard
        title="Missions"
        description="Vérifiez en un coup d’œil ce qu'il reste à configurer pour recevoir des demandes qualifiées."
        percentage={missionProgressPercent}
        completedCount={missionProgressDoneCount}
        totalCount={missionProgressTotal}
        missingItems={missionProgressSteps.filter((step) => !step.done).map((step) => step.label)}
        actionLabel="Afficher les points à compléter"
        onAction={onTogglePendingSteps}
      />

      <div className={styles.missionsColumns}>
        <div className={styles.missionsPrimary}>{children}</div>
        <aside className={styles.missionsSecondary}>{secondaryContent}</aside>
      </div>
    </div>
  );
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
    <>
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

      <MissionZoneRulesSection
        renderSection={renderSection}
        renderField={renderField}
        sectionId={sectionIds.ZONE_RULES}
        editingSection={editingSection}
        missionAvailability={missionAvailability}
        setEditProfile={setEditProfile}
        parseAvailabilityPayloadRaw={parseAvailabilityPayloadRaw}
      />

      <MissionWeeklyAvailabilitySection
        renderSection={renderSection}
        sectionId={sectionIds.WEEKLY_AVAILABILITY}
        editingSection={editingSection}
        missionAvailability={missionAvailability}
        setEditProfile={setEditProfile}
        parseAvailabilityPayloadRaw={parseAvailabilityPayloadRaw}
        normalizeMissionSchedule={normalizeMissionSchedule}
      />
    </>
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
  renderSection,
  renderField,
  sectionId,
  editingSection,
  missionAvailability,
  setEditProfile,
  parseAvailabilityPayloadRaw,
}: MissionZoneRulesSectionProps) {
  return renderSection(
    "Zone d'intervention",
    <FiMapPinOutline />,
    <>
      {renderField(
        "Zone de travail (location)",
        "location",
        sectionId,
        false,
        true,
        "Ex: Paris, Lyon, Bordeaux...",
      )}
      <MissionZoneAvailability
        value={missionAvailability}
        isEditing={editingSection === sectionId}
        lockZones
        showScheduleSection={false}
        showRulesSection={false}
        onChange={(data) =>
          setEditProfile((prev: EditProfileStateLike) =>
            prev ? buildProfileZoneUpdate(prev, data, parseAvailabilityPayloadRaw) : prev,
          )
        }
      />
    </>,
    true,
    sectionId,
  );
}

export function MissionWeeklyAvailabilitySection({
  renderSection,
  sectionId,
  editingSection,
  missionAvailability,
  setEditProfile,
  parseAvailabilityPayloadRaw,
  normalizeMissionSchedule,
}: MissionWeeklyAvailabilitySectionProps) {
  return renderSection(
    "Disponibilités hebdomadaires",
    <FiClockOutline />,
    <>
      <AvailabilityEditor
        value={missionAvailability?.schedule ?? []}
        emergency24h={missionAvailability?.emergency24h ?? false}
        isEditing={editingSection === sectionId}
        onChange={(schedule, emergency24h) =>
          setEditProfile((prev: EditProfileStateLike) =>
            prev
              ? buildProfileWeeklyAvailabilityUpdate(
                  prev,
                  schedule,
                  emergency24h,
                  parseAvailabilityPayloadRaw,
                  normalizeMissionSchedule,
                )
              : prev,
          )
        }
      />
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
  return (
    <MissionsTabLayout
      styles={styles}
      missionProgressPercent={missionProgressControls.missionProgressPercent}
      missionProgressDoneCount={missionProgressControls.missionProgressDoneCount}
      missionProgressTotal={missionProgressControls.missionProgressSteps.length}
      showPendingMissionStepsOnly={missionProgressControls.showPendingMissionStepsOnly}
      onTogglePendingSteps={() =>
        missionProgressControls.setShowPendingMissionStepsOnly((prev: boolean) => !prev)
      }
      activeMissionRawLabelsCount={missionOverviewStats.activeMissionRawLabels.length}
      recognizedActiveMissionCount={missionOverviewStats.recognizedActiveMissionCount}
      unrecognizedActiveMissionLabelsCount={missionOverviewStats.unrecognizedActiveMissionLabels.length}
      missionOpenDaysCount={missionOverviewStats.missionOpenDaysCount}
      missionRangesCount={missionOverviewStats.missionRangesCount}
      missionZonesCount={missionOverviewStats.missionAvailability?.zones.length ?? 0}
      missionProgressSteps={missionProgressControls.missionProgressSteps}
      openMissionSectionForEdit={missionProgressControls.openMissionSectionForEdit}
      secondaryContent={
        <MissionsSecondaryPanels
          styles={styles}
          missionProgressDoneCount={missionProgressControls.missionProgressDoneCount}
          missionProgressTotal={missionProgressControls.missionProgressSteps.length}
          showPendingMissionStepsOnly={missionProgressControls.showPendingMissionStepsOnly}
          setShowPendingMissionStepsOnly={missionProgressControls.setShowPendingMissionStepsOnly}
          missionProgressSteps={missionProgressControls.missionProgressSteps}
          openMissionSectionForEdit={missionProgressControls.openMissionSectionForEdit}
          renderSection={renderSection}
          missionQuoteControls={missionQuoteControls}
        />
      }
    >
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
    </MissionsTabLayout>
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
}: any) {
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
            experienceLabel={tariffFoundationControls.formatExperienceLabel(tariffFoundationControls.editProfile.experience_level)}
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




