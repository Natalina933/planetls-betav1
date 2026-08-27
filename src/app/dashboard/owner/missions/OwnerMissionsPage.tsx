"use client";

import { useMemo, useState } from "react";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { matchesHousingReference } from "@/app/lib/listingReferences";
import { AsyncState } from "@/components/ui";
import { useOwnerDashboardData } from "../useOwnerDashboardData";
import OwnerMissionsFilters from "./OwnerMissionsFilters";
import OwnerMissionsList from "./OwnerMissionsList";
import type {
  OwnerMissionListItem,
  OwnerMissionStatus,
  OwnerMissionType,
  OwnerMissionsFiltersValue,
} from "./types";
import styles from "./OwnerMissionsPage.module.scss";

const DAY_MS = 24 * 60 * 60 * 1000;

type MissionSource = {
  id: string;
  title: string | null;
  status: string | null;
  scheduled_start: string | null;
  scheduled_end?: string | null;
  property_id?: string | number | null;
  concierge_name?: string | null;
  metadata?: Record<string, unknown> | null;
};

function getMissionStatus(mission: MissionSource): OwnerMissionStatus {
  const status = mission.status;
  const scheduledStart = mission.scheduled_start ? new Date(mission.scheduled_start) : null;
  const isPast = scheduledStart && !Number.isNaN(scheduledStart.getTime()) && scheduledStart.getTime() < Date.now();
  const isOpen = !["completed", "validated", "closed", "canceled"].includes(status || "");

  if (isPast && isOpen) return "en_retard";
  if (["to_schedule", "date_requested", "date_proposed", "awaiting_owner_validation"].includes(status || "")) {
    return "en_attente_validation";
  }
  if (["assigned", "accepted", "date_confirmed", "scheduled", "in_progress"].includes(status || "")) return "en_cours";
  if (["completed", "validated", "closed"].includes(status || "")) return "termine";
  return "a_faire";
}

function getMissionType(mission: MissionSource): OwnerMissionType {
  const title = (mission.title || "").toLowerCase();
  const metadataActions = Array.isArray(mission.metadata?.actions)
    ? mission.metadata.actions.filter((item): item is string => typeof item === "string")
    : [];
  const joined = `${title} ${metadataActions.join(" ")}`.toLowerCase();

  if (joined.includes("ménage") || joined.includes("menage") || joined.includes("clean")) return "menage";
  if (joined.includes("maintenance") || joined.includes("réparation") || joined.includes("serrure")) return "maintenance";
  if (joined.includes("check-in") || joined.includes("checkin") || joined.includes("arrivée")) return "checkin";
  if (joined.includes("check-out") || joined.includes("checkout") || joined.includes("départ")) return "checkout";
  return "autre";
}

function getTimeSlot(start?: string | null, end?: string | null) {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  if (!startDate || Number.isNaN(startDate.getTime())) return undefined;

  const formatter = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (!endDate || Number.isNaN(endDate.getTime())) return formatter.format(startDate);
  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

function getPeriodLimit(period: OwnerMissionsFiltersValue["period"]) {
  if (period === "semaine") return 7;
  if (period === "mois") return 31;
  return null;
}

export default function OwnerMissionsPage() {
  const { isAuthenticated, user } = useCurrentUser();
  const { properties, missions, loading, error } = useOwnerDashboardData(isAuthenticated, { missionLimit: 200 });
  const [filters, setFilters] = useState<OwnerMissionsFiltersValue>({
    status: "tous",
    property: "tous",
    period: "toutes",
  });

  const ownerName = user?.firstName || user?.username || "Nathalie";
  const missionItems = useMemo<OwnerMissionListItem[]>(() => {
    return missions
      .map((mission) => {
        const property = properties.find((item) =>
          matchesHousingReference(
            {
              propertyId: mission.property_id ?? null,
              metadata: mission.metadata ?? null,
            },
            item.id,
          ),
        );
        const fallbackDate = mission.scheduled_start || mission.scheduled_end || new Date().toISOString();

        return {
          id: mission.id,
          propertyId: mission.property_id ?? undefined,
          propertyName: property?.nom_logement || "Logement à préciser",
          city: property?.ville || undefined,
          type: getMissionType(mission),
          date: fallbackDate,
          timeSlot: getTimeSlot(mission.scheduled_start, mission.scheduled_end),
          status: getMissionStatus(mission),
          assignedTo: mission.concierge_name || undefined,
        };
      })
      .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
  }, [missions, properties]);

  const propertyOptions = useMemo(
    () => Array.from(new Set(missionItems.map((mission) => mission.propertyName))).sort((a, b) => a.localeCompare(b, "fr")),
    [missionItems],
  );

  const filteredMissions = useMemo(() => {
    const now = new Date();
    const periodDays = getPeriodLimit(filters.period);
    const maxDate = periodDays ? new Date(now.getTime() + periodDays * DAY_MS) : null;

    return missionItems.filter((mission) => {
      const missionDate = new Date(mission.date);
      const matchesStatus = filters.status === "tous" || mission.status === filters.status;
      const matchesProperty = filters.property === "tous" || mission.propertyName === filters.property;
      const matchesPeriod =
        !maxDate ||
        (!Number.isNaN(missionDate.getTime()) && missionDate >= now && missionDate <= maxDate);

      return matchesStatus && matchesProperty && matchesPeriod;
    });
  }, [filters, missionItems]);

  const actionCount = missionItems.filter((mission) =>
    ["a_faire", "en_attente_validation", "en_retard"].includes(mission.status),
  ).length;

  return (
    <div className="dashboard-grid">
      <OwnerWorkspacePage
        eyebrow="Missions"
        title={`Vos missions à suivre, ${ownerName}`}
        description="Ici, vous suivez les missions déjà liées à une conciergerie : séjours voyageurs, interventions, validations et urgences. Pour rechercher des services ou demander un devis, utilisez la page Demandes."
        metrics={[
          { label: "Missions", value: loading ? "..." : String(missionItems.length) },
          { label: "À traiter", value: loading ? "..." : String(actionCount) },
          {
            label: "Terminées",
            value: loading ? "..." : String(missionItems.filter((mission) => mission.status === "termine").length),
          },
        ]}
        actions={[
          { label: "Transmettre un séjour", href: "/dashboard/owner/missions/voyageurs" },
          { label: "Faire une demande", href: "/dashboard/owner/demandes" },
          { label: "Mission urgente", href: "/dashboard/owner/mission-urgente" },
          { label: "Voir le planning", href: "/dashboard/owner/planning" },
        ]}
        cards={[]}
      >
        <section className={styles.page}>
          <div className={styles.routingHint}>
            <article>
              <strong>Demandes</strong>
              <span>Rechercher une conciergerie, demander des services, recevoir et accepter un devis.</span>
            </article>
            <article>
              <strong>Missions</strong>
              <span>Suivre ce qui doit être réalisé après un devis accepté ou un séjour transmis.</span>
            </article>
            <article>
              <strong>Séjours voyageurs</strong>
              <span>Envoyer à la concierge les arrivées, départs et consignes de réservation.</span>
            </article>
          </div>
          <OwnerMissionsFilters value={filters} properties={propertyOptions} onChange={setFilters} />
          <AsyncState loading={loading} error={error}>
            <OwnerMissionsList missions={filteredMissions} />
          </AsyncState>
        </section>
      </OwnerWorkspacePage>
    </div>
  );
}
