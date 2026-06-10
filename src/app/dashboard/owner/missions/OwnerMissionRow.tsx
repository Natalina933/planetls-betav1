import Link from "next/link";
import { CalendarClock, Home, UserRound } from "lucide-react";
import type { OwnerMissionListItem, OwnerMissionStatus, OwnerMissionType } from "./types";
import styles from "./OwnerMissionRow.module.scss";

const statusLabels: Record<OwnerMissionStatus, string> = {
  a_faire: "À planifier",
  en_cours: "En cours",
  en_attente_validation: "En attente de validation",
  en_retard: "En retard",
  termine: "Terminée",
};

const typeLabels: Record<OwnerMissionType, string> = {
  menage: "Ménage",
  maintenance: "Maintenance",
  checkin: "Check-in",
  checkout: "Check-out",
  autre: "Autre mission",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date à confirmer";

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

type OwnerMissionRowProps = {
  mission: OwnerMissionListItem;
};

export default function OwnerMissionRow({ mission }: OwnerMissionRowProps) {
  const timeSlot = mission.timeSlot || formatTime(mission.date) || "Créneau à confirmer";
  const planningParams = new URLSearchParams();
  planningParams.set("date", mission.date.slice(0, 10));
  if (mission.propertyId) planningParams.set("logement", String(mission.propertyId));

  return (
    <article className={styles.row}>
      <div className={styles.main}>
        <span className={`${styles.statusBadge} ${styles[mission.status]}`}>{statusLabels[mission.status]}</span>
        <h3>{typeLabels[mission.type]}</h3>
        <p>
          <Home size={15} aria-hidden="true" />
          {mission.propertyName}
          {mission.city ? ` - ${mission.city}` : ""}
        </p>
      </div>

      <div className={styles.meta}>
        <span>
          <CalendarClock size={15} aria-hidden="true" />
          {formatDate(mission.date)}
        </span>
        <span>{timeSlot}</span>
      </div>

      <div className={styles.assignee}>
        <UserRound size={15} aria-hidden="true" />
        <span>{mission.assignedTo || "Conciergerie à préciser"}</span>
      </div>

      <div className={styles.actions}>
        <Link href={`/dashboard/owner/missions/${mission.id}`} className={styles.actionLink}>
          Voir la mission
        </Link>
        <Link href={`/dashboard/owner/planning?${planningParams.toString()}`} className={styles.secondaryLink}>
          Voir dans le planning
        </Link>
      </div>
    </article>
  );
}
