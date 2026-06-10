import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import {
  formatPlanningDateTime,
  planningStatusLabels,
  planningTypeLabels,
} from "./planningLabels";
import type { OwnerPlanningItem } from "./types";
import styles from "./OwnerPlanningPriorities.module.scss";

type OwnerPlanningPrioritiesProps = {
  priorities: OwnerPlanningItem[];
};

export default function OwnerPlanningPriorities({ priorities }: OwnerPlanningPrioritiesProps) {
  const visiblePriorities = priorities.slice(0, 4);

  return (
    <section className={styles.priorities} aria-labelledby="owner-planning-priorities-title">
      <div className={styles.header}>
        <div>
          <p>À vérifier maintenant</p>
          <h2 id="owner-planning-priorities-title">Priorités du moment</h2>
        </div>
        <span>{visiblePriorities.length} action(s)</span>
      </div>

      {visiblePriorities.length > 0 ? (
        <div className={styles.priorityList}>
          {visiblePriorities.map((item) => (
            <article key={item.id} className={`${styles.priorityCard} ${styles[item.status]}`}>
              <div className={styles.iconWrap} aria-hidden="true">
                {item.status === "urgent" ? (
                  <AlertTriangle size={19} />
                ) : item.status === "pret_voyageurs" ? (
                  <CheckCircle2 size={19} />
                ) : (
                  <Clock3 size={19} />
                )}
              </div>
              <div className={styles.priorityContent}>
                <span className={styles.status}>{planningStatusLabels[item.status]}</span>
                <h3>{planningTypeLabels[item.type]}</h3>
                <p>
                  {item.propertyName}
                  {item.city ? ` — ${item.city}` : ""} · {formatPlanningDateTime(item.date)}
                </p>
                <p>Responsable : {item.assignedTo || "À assigner"}</p>
              </div>
              <Link href={`/dashboard/owner/missions/${item.id}`} className={styles.actionLink}>
                Voir détail
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <CheckCircle2 size={20} aria-hidden="true" />
          <p>Aucune urgence ni validation en attente. Votre planning est sous contrôle.</p>
        </div>
      )}
    </section>
  );
}
