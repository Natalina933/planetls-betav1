import { ButtonLink, Card } from "@/components/ui";
import OwnerPlanningStatus from "./OwnerPlanningStatus";
import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import {
  formatPlanningDateTime,
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
        <ButtonLink href="/dashboard/owner/mission-urgente" variant="ghost" size="sm">Signaler une urgence</ButtonLink>
      </div>

      {visiblePriorities.length > 0 ? (
        <div className={styles.priorityList}>
          {visiblePriorities.map((item) => (
            <Card key={item.id} className={styles.priorityCard} tone="outlined">
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
                <OwnerPlanningStatus status={item.status} />
                <h3>{planningTypeLabels[item.type]}</h3>
                <p>
                  {item.propertyName}
                  {item.city ? ` — ${item.city}` : ""} · {formatPlanningDateTime(item.date)}
                </p>
                <p>Responsable : {item.assignedTo || "À assigner"}</p>
              </div>
              <ButtonLink href={`/dashboard/owner/missions/${item.id}`} variant="secondary" size="sm">
                Voir détail
              </ButtonLink>
            </Card>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <CheckCircle2 size={20} aria-hidden="true" />
          <p>Aucune priorité signalée dans les missions chargées.</p>
        </div>
      )}
      {priorities.length > visiblePriorities.length && <p>{visiblePriorities.length} priorités affichées sur {priorities.length}. Retrouvez les autres dans l’agenda avec les filtres de statut.</p>}
    </section>
  );
}
