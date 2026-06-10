import Link from "next/link";
import { CalendarClock, Home, UserRound } from "lucide-react";
import {
  formatOwnerMissionDate,
  formatOwnerMissionTime,
  ownerMissionStatusLabels,
  ownerMissionTypeLabels,
} from "./ownerMissionLabels";
import type { OwnerMissionItem } from "./ownerMissionTypes";
import styles from "./OwnerMissionList.module.scss";

type OwnerMissionListProps = {
  missions: OwnerMissionItem[];
};

export default function OwnerMissionList({ missions }: OwnerMissionListProps) {
  return (
    <section className={styles.missionList} aria-labelledby="owner-mission-list-title">
      <div className={styles.header}>
        <div>
          <p>Planning</p>
          <h2 id="owner-mission-list-title">Interventions liées</h2>
        </div>
        <span>{missions.length} mission(s)</span>
      </div>

      {missions.length > 0 ? (
        <div className={styles.list}>
          {missions.map((mission) => (
            <article key={mission.id} className={styles.missionCard}>
              <div className={styles.dateBlock}>
                <strong>{formatOwnerMissionTime(mission.date)}</strong>
                <span>{formatOwnerMissionDate(mission.date)}</span>
              </div>
              <div className={styles.content}>
                <span className={`${styles.statusPill} ${styles[mission.status]}`}>
                  {ownerMissionStatusLabels[mission.status]}
                </span>
                <h3>{ownerMissionTypeLabels[mission.type]}</h3>
                <div className={styles.factRow}>
                  <span>
                    <Home size={15} aria-hidden="true" />
                    {mission.propertyName}
                    {mission.city ? ` - ${mission.city}` : ""}
                  </span>
                  <span>
                    <UserRound size={15} aria-hidden="true" />
                    {mission.assignedTo || "À assigner"}
                  </span>
                  <span>
                    <CalendarClock size={15} aria-hidden="true" />
                    {mission.timeSlot || "Créneau à confirmer"}
                  </span>
                </div>
                {mission.notes ? <p>{mission.notes}</p> : null}
              </div>
              <div className={styles.actions}>
                <Link href={`/dashboard/owner/missions/${mission.id}`}>Voir</Link>
                {mission.status === "en_attente_validation" ? (
                  <Link href={`/dashboard/owner/missions/${mission.id}`}>Valider</Link>
                ) : null}
                {mission.status === "en_retard" ? <Link href="/dashboard/owner/messages">Relancer</Link> : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h3>Aucune intervention liée</h3>
          <p>Les interventions créées depuis le devis apparaîtront ici.</p>
        </div>
      )}
    </section>
  );
}
