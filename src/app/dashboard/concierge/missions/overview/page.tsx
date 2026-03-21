"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiClock as FiClockOutline,
  FiMapPin as FiMapPinOutline,
  FiTarget,
} from "react-icons/fi";
import type {
  MissionAvailability,
  MissionDaySchedule,
  MissionZone,
  WeekDay,
} from "@/app/components/missions/types";
import MissionsTabLayout from "@/app/components/dashboard/concierge/MissionsTabLayout";
import { useConciergeOverviewData } from "../../useConciergeOverviewData";
import {
  EditableProfileSection,
  MissionProgressPanelSection,
} from "../../profile/profileTabSections";
import profileStyles from "../../profile/ConciergeProfilePage.module.scss";
import {
  buildMissionProgressSteps,
  computeProgressPercent,
  countCompletedProgressSteps,
} from "../../profile/profileEditing";

type GenericRecord = Record<string, unknown>;

const DAY_LABELS: Record<WeekDay, string> = {
  mon: "Lundi",
  tue: "Mardi",
  wed: "Mercredi",
  thu: "Jeudi",
  fri: "Vendredi",
  sat: "Samedi",
  sun: "Dimanche",
};

const normalizeSectionId = (title: string) => title.replace(/[^a-zA-Z0-9]/g, "_");

const MISSION_SECTION_IDS = {
  SERVICES: normalizeSectionId("Services proposés"),
  ZONE_RULES: normalizeSectionId("Zone, disponibilités & règles de mission"),
  WEEKLY_AVAILABILITY: normalizeSectionId("Disponibilités hebdomadaires"),
} as const;

const DEFAULT_MISSION_AVAILABILITY: MissionAvailability = {
  zones: [],
  radiusKm: 30,
  schedule: [],
  emergency24h: false,
  rules: {
    refuseOutOfZone: true,
    refuseOutOfSchedule: true,
    autoAcceptEmergency: false,
  },
};

function parseAvailabilityPayload(value: unknown): GenericRecord {
  if (typeof value !== "string" || !value.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as GenericRecord;
    }
  } catch {
    return {};
  }

  return {};
}

function sanitizeZones(rawZones: unknown, fallbackLabel: string): MissionZone[] {
  if (Array.isArray(rawZones)) {
    const zones = rawZones
      .map((zone, index) => {
        if (!zone || typeof zone !== "object") return null;
        const item = zone as GenericRecord;
        const label = String(item.label ?? "").trim();
        const placeId = String(item.placeId ?? `zone-${index}`).trim();
        const lat = Number(item.lat ?? 0);
        const lng = Number(item.lng ?? 0);

        if (!label) return null;

        return {
          placeId: placeId || `zone-${index}`,
          label,
          lat: Number.isFinite(lat) ? lat : 0,
          lng: Number.isFinite(lng) ? lng : 0,
        };
      })
      .filter((zone): zone is MissionZone => Boolean(zone));

    if (zones.length > 0) {
      return zones;
    }
  }

  if (!fallbackLabel) {
    return [];
  }

  return [
    {
      placeId: `zone-0-${fallbackLabel}`,
      label: fallbackLabel,
      lat: 0,
      lng: 0,
    },
  ];
}

function sanitizeSchedule(rawSchedule: unknown): MissionDaySchedule[] {
  if (!Array.isArray(rawSchedule)) {
    return [];
  }

  return rawSchedule
    .map((day) => {
      if (!day || typeof day !== "object") return null;
      const item = day as GenericRecord;
      const dayId = String(item.day ?? "") as WeekDay;
      const ranges = Array.isArray(item.ranges)
        ? item.ranges
            .map((range) => {
              if (!range || typeof range !== "object") return null;
              const rangeItem = range as GenericRecord;
              const start = String(rangeItem.start ?? "").trim();
              const end = String(rangeItem.end ?? "").trim();

              if (!start || !end) return null;

              return { start, end };
            })
            .filter(
              (
                range,
              ): range is MissionDaySchedule["ranges"][number] => Boolean(range),
            )
        : [];

      if (!dayId) return null;

      return {
        day: dayId,
        ranges,
      };
    })
    .filter((day): day is MissionDaySchedule => Boolean(day));
}

function buildMissionOverviewSnapshot(profile: GenericRecord | null) {
  const availabilityPayload = parseAvailabilityPayload(profile?.availability_hours);
  const missionProfile =
    availabilityPayload.missionProfile &&
    typeof availabilityPayload.missionProfile === "object" &&
    !Array.isArray(availabilityPayload.missionProfile)
      ? (availabilityPayload.missionProfile as GenericRecord)
      : null;
  const missionRows = Array.isArray(missionProfile?.missions)
    ? missionProfile.missions
    : [];

  const selectedServices = missionRows
    .map((mission) => {
      if (!mission || typeof mission !== "object") return null;
      const item = mission as GenericRecord;
      if (item.isActive !== true) return null;
      const label = String(item.label ?? "").trim();
      return label || null;
    })
    .filter((label): label is string => Boolean(label));

  const fallbackLocation = String(
    profile?.location ?? profile?.service_area ?? profile?.city ?? "",
  ).trim();
  const zones = sanitizeZones(availabilityPayload.zones, fallbackLocation);
  const schedule = sanitizeSchedule(availabilityPayload.schedule);
  const emergency24h = Boolean(profile?.emergency_service);
  const missionOpenDaysCount = schedule.filter((day) => day.ranges.length > 0).length;
  const missionRangesCount = schedule.reduce((total, day) => total + day.ranges.length, 0);

  return {
    selectedServices,
    availability: {
      ...DEFAULT_MISSION_AVAILABILITY,
      zones,
      radiusKm: Number(profile?.service_radius_km ?? DEFAULT_MISSION_AVAILABILITY.radiusKm),
      schedule,
      emergency24h,
    },
    missionOpenDaysCount,
    missionRangesCount,
  };
}

function ReadOnlyMissionSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <EditableProfileSection
      styles={profileStyles}
      title={title}
      icon={icon}
      canEdit={false}
      collapsible={false}
      isOpen
      isEditing={false}
      isDirty={false}
      isLoading={false}
      onToggle={() => undefined}
      onHeaderKeyDown={() => undefined}
      onBeginEdit={() => undefined}
      onSave={() => undefined}
      onCancel={() => undefined}
    >
      {children}
    </EditableProfileSection>
  );
}

function ZoneOverviewCard({
  zones,
  radiusKm,
  onEdit,
}: {
  zones: MissionZone[];
  radiusKm: number;
  onEdit: () => void;
}) {
  return (
    <div className={profileStyles.missionSnapshotCard}>
      <div className={profileStyles.missionSnapshotHeader}>
        <div>
          <p className={profileStyles.missionSnapshotEyebrow}>Couverture</p>
          <h4>Zone d’intervention</h4>
        </div>
        <button
          type="button"
          className={profileStyles.missionProgressAction}
          onClick={onEdit}
        >
          Modifier
        </button>
      </div>

      <div className={profileStyles.missionMetaGrid}>
        <div className={profileStyles.missionMetaItem}>
          <span>Zones actives</span>
          <strong>{zones.length}</strong>
        </div>
        <div className={profileStyles.missionMetaItem}>
          <span>Rayon</span>
          <strong>{radiusKm} km</strong>
        </div>
      </div>

      <div className={profileStyles.missionBadgeRow}>
        {zones.length > 0 ? (
          zones.map((zone) => (
            <span key={zone.placeId} className={profileStyles.missionUnknownItem}>
              {zone.label}
            </span>
          ))
        ) : (
          <span className={profileStyles.missionEmptyInline}>
            Aucune zone définie pour le moment.
          </span>
        )}
      </div>
    </div>
  );
}

function ServicesOverviewCard({
  services,
  onEdit,
}: {
  services: string[];
  onEdit: () => void;
}) {
  return (
    <div className={profileStyles.missionSnapshotCard}>
      <div className={profileStyles.missionSnapshotHeader}>
        <div>
          <p className={profileStyles.missionSnapshotEyebrow}>Offre active</p>
          <h4>Services proposés</h4>
        </div>
        <button
          type="button"
          className={profileStyles.missionProgressAction}
          onClick={onEdit}
        >
          Modifier
        </button>
      </div>

      <div className={profileStyles.missionMetaGrid}>
        <div className={profileStyles.missionMetaItem}>
          <span>Services actifs</span>
          <strong>{services.length}</strong>
        </div>
        <div className={profileStyles.missionMetaItem}>
          <span>Statut</span>
          <strong>{services.length > 0 ? "Configuré" : "À compléter"}</strong>
        </div>
      </div>

      <div className={profileStyles.missionBadgeRow}>
        {services.length > 0 ? (
          services.map((service) => (
            <span key={service} className={profileStyles.missionUnknownItem}>
              {service}
            </span>
          ))
        ) : (
          <span className={profileStyles.missionEmptyInline}>
            Aucun service actif pour le moment.
          </span>
        )}
      </div>
    </div>
  );
}

function AvailabilityOverviewCard({
  schedule,
  emergency24h,
  onEdit,
}: {
  schedule: MissionDaySchedule[];
  emergency24h: boolean;
  onEdit: () => void;
}) {
  const openDays = schedule.filter((day) => day.ranges.length > 0);
  const firstOpenDays = openDays.slice(0, 3);
  const totalRanges = schedule.reduce((total, day) => total + day.ranges.length, 0);

  return (
    <div className={profileStyles.missionSnapshotCard}>
      <div className={profileStyles.missionSnapshotHeader}>
        <div>
          <p className={profileStyles.missionSnapshotEyebrow}>Disponibilité</p>
          <h4>Horaires hebdomadaires</h4>
        </div>
        <button
          type="button"
          className={profileStyles.missionProgressAction}
          onClick={onEdit}
        >
          Ajuster
        </button>
      </div>

      {emergency24h ? (
        <div className={profileStyles.missionAlwaysOnCard}>
          <strong>24h/24, 7j/7</strong>
          <span>Les urgences peuvent être prises en charge à tout moment.</span>
        </div>
      ) : null}

      <div className={profileStyles.missionMetaGrid}>
        <div className={profileStyles.missionMetaItem}>
          <span>Jours ouverts</span>
          <strong>{openDays.length}/7</strong>
        </div>
        <div className={profileStyles.missionMetaItem}>
          <span>Plages horaires</span>
          <strong>{totalRanges}</strong>
        </div>
      </div>

      <div className={profileStyles.missionBadgeRow}>
        {firstOpenDays.length > 0 ? (
          firstOpenDays.map((day) => (
            <span key={day.day} className={profileStyles.missionUnknownItem}>
              {DAY_LABELS[day.day]}
            </span>
          ))
        ) : (
          <span className={profileStyles.missionEmptyInline}>
            Aucune disponibilité définie pour le moment.
          </span>
        )}
        {openDays.length > firstOpenDays.length ? (
          <span className={profileStyles.missionUnknownItem}>
            +{openDays.length - firstOpenDays.length} jour(x)
          </span>
        ) : null}
      </div>

      <p className={profileStyles.missionSnapshotNote}>
        Les horaires détaillés se modifient uniquement dans votre profil missions.
      </p>
    </div>
  );
}

export default function ConciergeMissionsOverviewPage() {
  const router = useRouter();
  const { profile } = useConciergeOverviewData();
  const [showPendingMissionStepsOnly, setShowPendingMissionStepsOnly] = useState(false);

  const snapshot = useMemo(() => buildMissionOverviewSnapshot(profile), [profile]);

  const missionProgressSteps = useMemo(
    () =>
      buildMissionProgressSteps(
        snapshot.selectedServices.length,
        snapshot.availability.zones.length,
        snapshot.missionOpenDaysCount,
        snapshot.missionRangesCount,
        MISSION_SECTION_IDS,
      ),
    [
      snapshot.availability.zones.length,
      snapshot.missionOpenDaysCount,
      snapshot.missionRangesCount,
      snapshot.selectedServices.length,
    ],
  );

  const missionProgressDoneCount = useMemo(
    () => countCompletedProgressSteps(missionProgressSteps),
    [missionProgressSteps],
  );

  const missionProgressPercent = useMemo(
    () => computeProgressPercent(missionProgressDoneCount, missionProgressSteps.length),
    [missionProgressDoneCount, missionProgressSteps.length],
  );

  const openMissionSectionForEdit = (sectionId: string) => {
    router.push(`/dashboard/concierge/profile?tab=missions#${sectionId}`);
  };

  return (
    <MissionsTabLayout
      styles={profileStyles}
      missionProgressPercent={missionProgressPercent}
      missionProgressDoneCount={missionProgressDoneCount}
      missionProgressTotal={missionProgressSteps.length}
      showPendingMissionStepsOnly={showPendingMissionStepsOnly}
      onTogglePendingSteps={() => setShowPendingMissionStepsOnly((prev) => !prev)}
      displayedActiveMissionCount={snapshot.selectedServices.length}
      totalAvailableMissionCount={snapshot.selectedServices.length}
      recognizedActiveMissionCount={snapshot.selectedServices.length}
      unrecognizedActiveMissionLabelsCount={0}
      missionOpenDaysCount={snapshot.missionOpenDaysCount}
      missionRangesCount={snapshot.missionRangesCount}
      missionZonesCount={snapshot.availability.zones.length}
      missionProgressSteps={missionProgressSteps}
      openMissionSectionForEdit={openMissionSectionForEdit}
      secondaryContent={
        <MissionProgressPanelSection
          styles={profileStyles}
          missionProgressDoneCount={missionProgressDoneCount}
          missionProgressTotal={missionProgressSteps.length}
          showPendingMissionStepsOnly={showPendingMissionStepsOnly}
          setShowPendingMissionStepsOnly={setShowPendingMissionStepsOnly}
          missionProgressSteps={missionProgressSteps}
          openMissionSectionForEdit={openMissionSectionForEdit}
        />
      }
    >
      <ReadOnlyMissionSection title="Services proposés" icon={<FiTarget />}>
        <p className={profileStyles.missionSectionLead}>
          Cette vue présente votre offre active. Toute modification détaillée reste centralisée dans votre profil missions.
        </p>
        <ServicesOverviewCard
          services={snapshot.selectedServices}
          onEdit={() => openMissionSectionForEdit(MISSION_SECTION_IDS.SERVICES)}
        />
      </ReadOnlyMissionSection>

      <div className={profileStyles.missionOverviewGrid}>
        <ReadOnlyMissionSection title="Zone d’intervention" icon={<FiMapPinOutline />}>
          <ZoneOverviewCard
            zones={snapshot.availability.zones}
            radiusKm={snapshot.availability.radiusKm}
            onEdit={() => openMissionSectionForEdit(MISSION_SECTION_IDS.ZONE_RULES)}
          />
        </ReadOnlyMissionSection>

        <ReadOnlyMissionSection title="Disponibilités hebdomadaires" icon={<FiClockOutline />}>
          <AvailabilityOverviewCard
            schedule={snapshot.availability.schedule}
            emergency24h={snapshot.availability.emergency24h}
            onEdit={() => openMissionSectionForEdit(MISSION_SECTION_IDS.WEEKLY_AVAILABILITY)}
          />
        </ReadOnlyMissionSection>
      </div>
    </MissionsTabLayout>
  );
}
