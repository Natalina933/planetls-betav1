"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clock3,
  MapPinned,
  Radar,
  Route,
  ShieldCheck,
  Target,
} from "lucide-react";
import type {
  MissionAvailability,
  MissionDaySchedule,
  MissionZone,
  WeekDay,
} from "@/app/components/missions/types";
import { DashboardOperationalPage, DashboardPanel } from "@/components/dashboard";
import { useConciergeOverviewData } from "../../useConciergeOverviewData";
import { MissionProgressPanelSection } from "../../profile/profileTabSections";
import profileStyles from "../../profile/ConciergeProfilePage.module.scss";
import {
  buildMissionProgressSteps,
  computeProgressPercent,
  countCompletedProgressSteps,
} from "../../profile/profileEditing";
import styles from "./page.module.scss";

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

  const firstPendingStep = missionProgressSteps.find((step) => !step.done);
  const missionProfileHref = "/dashboard/concierge/profile?tab=missions";
  const servicesHref = `${missionProfileHref}#${MISSION_SECTION_IDS.SERVICES}`;
  const zonesHref = `${missionProfileHref}#${MISSION_SECTION_IDS.ZONE_RULES}`;
  const availabilityHref = `${missionProfileHref}#${MISSION_SECTION_IDS.WEEKLY_AVAILABILITY}`;
  const openDays = snapshot.availability.schedule.filter((day) => day.ranges.length > 0);
  const serviceItems = snapshot.selectedServices.map((service) => ({
    title: service,
    meta: "Service actif",
    description: "Cette prestation peut être proposée dans les demandes entrantes.",
    action: { label: "Modifier", href: servicesHref },
  }));
  const zoneItems = snapshot.availability.zones.map((zone) => ({
    title: zone.label,
    meta: `${snapshot.availability.radiusKm} km`,
    description: "Zone incluse dans votre couverture de mission actuelle.",
    action: { label: "Ajuster", href: zonesHref },
  }));
  const availabilityItems = [
    ...openDays.map((day) => ({
      title: DAY_LABELS[day.day],
      meta: `${day.ranges.length} plage(s)`,
      description: day.ranges.map((range) => `${range.start}-${range.end}`).join(", "),
      action: { label: "Ajuster", href: availabilityHref },
    })),
    {
      title: "Urgences 24/7",
      meta: snapshot.availability.emergency24h ? "Activées" : "Désactivées",
      description: snapshot.availability.emergency24h
        ? "Les demandes urgentes peuvent être acceptées en dehors des horaires standards."
        : "Activez ce mode seulement si votre organisation peut réellement suivre.",
      action: { label: "Régler", href: availabilityHref },
    },
  ];
  const pendingProgressItems = missionProgressSteps
    .filter((step) => !step.done)
    .map((step) => ({
      title: step.label,
      meta: "À compléter",
      description: step.hint,
      action: {
        label: "Configurer",
        href: `${missionProfileHref}#${step.sectionId ?? MISSION_SECTION_IDS.SERVICES}`,
      },
    }));

  return (
    <DashboardOperationalPage
      tone="concierge"
      badge="Vue opérationnelle"
      title="Offre de missions"
      description="Pilotez les services, la couverture et les disponibilités qui structurent votre activité concierge."
      primaryActions={[
        { label: "Modifier le profil missions", href: missionProfileHref },
        { label: "Voir les missions", href: "/dashboard/concierge/missions" },
      ]}
      metrics={[
        {
          label: "Services",
          value: String(snapshot.selectedServices.length),
          hint: "Prestations actives",
          detailSectionId: "services",
        },
        {
          label: "Zones",
          value: String(snapshot.availability.zones.length),
          hint: `${snapshot.availability.radiusKm} km de rayon`,
          detailSectionId: "zones",
        },
        {
          label: "Disponibilités",
          value: `${snapshot.missionOpenDaysCount}/7`,
          hint: `${snapshot.missionRangesCount} plage(s) renseignée(s)`,
          detailSectionId: "disponibilites",
        },
        {
          label: "Progression",
          value: `${missionProgressPercent}%`,
          hint: `${missionProgressDoneCount}/${missionProgressSteps.length} étapes validées`,
          detailSectionId: "progression",
        },
      ]}
      focus={{
        title: "Priorité de configuration",
        status: firstPendingStep ? "À compléter" : "Prêt",
        statusVariant: firstPendingStep ? "warning" : "success",
        icon: firstPendingStep ? <Target size={28} /> : <CheckCircle2 size={28} />,
        heading: firstPendingStep ? firstPendingStep.label : "Votre offre missions est prête",
        description: firstPendingStep
          ? firstPendingStep.hint
          : "Les éléments clés sont configurés. Vous pouvez maintenant affiner les règles et tarifs associés.",
        action: firstPendingStep
          ? {
              label: "Configurer cette étape",
              href: `${missionProfileHref}#${firstPendingStep.sectionId ?? MISSION_SECTION_IDS.SERVICES}`,
            }
          : { label: "Affiner le profil", href: missionProfileHref },
      }}
      risks={[
        {
          label: "Offre",
          value: snapshot.selectedServices.length,
          hint: "Services actifs",
          icon: BriefcaseBusiness,
          tone: snapshot.selectedServices.length > 0 ? "success" : "warning",
          detailSectionId: "services",
        },
        {
          label: "Couverture",
          value: snapshot.availability.zones.length,
          hint: "Zones de mission",
          icon: MapPinned,
          tone: snapshot.availability.zones.length > 0 ? "success" : "warning",
          detailSectionId: "zones",
        },
        {
          label: "Horaires",
          value: `${snapshot.missionOpenDaysCount}/7`,
          hint: "Jours ouverts",
          icon: Clock3,
          tone: snapshot.missionOpenDaysCount > 0 ? "info" : "warning",
          detailSectionId: "disponibilites",
        },
        {
          label: "Urgence",
          value: snapshot.availability.emergency24h ? "24/7" : "Non",
          hint: "Prise en charge express",
          icon: ShieldCheck,
          tone: snapshot.availability.emergency24h ? "success" : "info",
          detailSectionId: "disponibilites",
        },
      ]}
      cadenceTitle="Cadence de pilotage"
      cadence={[
        {
          label: "Maintenant",
          text: firstPendingStep
            ? `Finaliser : ${firstPendingStep.label.toLowerCase()}.`
            : "Contrôler que l'offre publiée correspond à votre capacité réelle.",
          icon: Radar,
        },
        {
          label: "Cette semaine",
          text: "Vérifier zones, rayon et horaires selon la charge terrain observée.",
          icon: Route,
        },
        {
          label: "Avant publication",
          text: "Relire les services actifs et les règles d’urgence pour éviter les demandes hors cadre.",
          icon: CalendarClock,
        },
      ]}
      detailsBadge="Détails"
      detailsTitle="Configuration exploitable"
      detailsDescription="Cliquez sur un indicateur pour isoler les services, la couverture, les disponibilités ou les étapes restantes."
      detailSections={[
        {
          id: "services",
          title: "Services proposés",
          description: "Prestations actuellement visibles dans votre offre de missions.",
          emptyText: "Aucun service actif pour le moment.",
          items: serviceItems,
        },
        {
          id: "zones",
          title: "Zone d’intervention",
          description: "Périmètre utilisé pour cadrer les demandes entrantes.",
          emptyText: "Aucune zone définie pour le moment.",
          items: zoneItems,
        },
        {
          id: "disponibilites",
          title: "Disponibilités hebdomadaires",
          description: "Créneaux et urgence 24/7 utilisés pour qualifier les missions.",
          emptyText: "Aucune disponibilité définie pour le moment.",
          items: availabilityItems,
        },
        {
          id: "progression",
          title: "Étapes restantes",
          description: "Points à terminer pour rendre cette offre plus robuste.",
          emptyText: "Tout est configuré. Vous pouvez affiner les réglages depuis le profil missions.",
          items: pendingProgressItems,
        },
      ]}
      illustration={{
        mainIcon: BriefcaseBusiness,
        topLeftIcon: Target,
        topRightIcon: MapPinned,
      }}
    >
      <DashboardPanel title="Configuration détaillée" className={styles.operationalPanel}>
        <p className={styles.panelLead}>
          Cette synthèse reprend les éléments publiés dans votre profil missions. Les modifications restent centralisées dans le profil pour garder une source unique.
        </p>
        <div className={styles.configGrid}>
          <ServicesOverviewCard
            services={snapshot.selectedServices}
            onEdit={() => openMissionSectionForEdit(MISSION_SECTION_IDS.SERVICES)}
          />
          <ZoneOverviewCard
            zones={snapshot.availability.zones}
            radiusKm={snapshot.availability.radiusKm}
            onEdit={() => openMissionSectionForEdit(MISSION_SECTION_IDS.ZONE_RULES)}
          />
          <AvailabilityOverviewCard
            schedule={snapshot.availability.schedule}
            emergency24h={snapshot.availability.emergency24h}
            onEdit={() => openMissionSectionForEdit(MISSION_SECTION_IDS.WEEKLY_AVAILABILITY)}
          />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Parcours de configuration" className={styles.operationalPanel}>
        <MissionProgressPanelSection
          styles={profileStyles}
          missionProgressDoneCount={missionProgressDoneCount}
          missionProgressTotal={missionProgressSteps.length}
          showPendingMissionStepsOnly={showPendingMissionStepsOnly}
          setShowPendingMissionStepsOnly={setShowPendingMissionStepsOnly}
          missionProgressSteps={missionProgressSteps}
          openMissionSectionForEdit={openMissionSectionForEdit}
        />
      </DashboardPanel>
    </DashboardOperationalPage>
  );
}
