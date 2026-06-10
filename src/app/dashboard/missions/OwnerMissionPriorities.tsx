import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import {
  formatOwnerMissionDate,
  ownerMissionStatusLabels,
  ownerMissionTypeLabels,
} from "./ownerMissionLabels";
import type { OwnerMissionItem } from "./ownerMissionTypes";
import styles from "./OwnerMissionPriorities.module.scss";

type OwnerMissionPrioritiesProps = {
  priorities: OwnerMissionItem[];
};

export default function OwnerMissionPriorities({ priorities }: OwnerMissionPrioritiesProps) {
  const visiblePriorities = priorities.slice(0, 4);

  return (
    <section className={styles.priorities} aria-labelledby="owner-mission-priorities-title">
      <div className={styles.header}>
        <div>
          <p>À vérifier</p>
          <h2 id="owner-mission-priorities-title">Priorités</h2>
        </div>
        <span>{visiblePriorities.length} action(s)</span>
      </div>

      {visiblePriorities.length > 0 ? (
        <div className={styles.priorityList}>
          {visiblePriorities.map((mission) => (
            <article key={mission.id} className={`${styles.priorityCard} ${styles[mission.status]}`}>
              <div className={styles.iconWrap} aria-hidden="true">
                {mission.status === "en_retard" ? (
                  <AlertTriangle size={19} />
                ) : mission.status === "termine" ? (
                  <CheckCircle2 size={19} />
                ) : (
                  <Clock3 size={19} />
                )}
              </div>
              <div className={styles.content}>
                <span>{ownerMissionStatusLabels[mission.status]}</span>
                <h3>{ownerMissionTypeLabels[mission.type]}</h3>
                <p>
                  {mission.propertyName}
                  {mission.city ? ` - ${mission.city}` : ""} · {formatOwnerMissionDate(mission.date)}
                </p>
                <p>Intervenant : {mission.assignedTo || "À assigner"}</p>
              </div>
              <Link href={`/dashboard/owner/missions/${mission.id}`} className={styles.actionLink}>
                Voir la mission
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <CheckCircle2 size={20} aria-hidden="true" />
          <p>Aucune action urgente pour cette mission.</p>
        </div>
      )}
    </section>
  );
}
