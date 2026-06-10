import {
  formatOwnerMissionDate,
  formatOwnerMissionTime,
  ownerMissionStatusLabels,
  ownerMissionTypeLabels,
} from "./ownerMissionLabels";
import type { OwnerMissionItem, OwnerMissionKpi } from "./ownerMissionTypes";
import styles from "./OwnerMissionPage.module.scss";

type OwnerMissionPageProps = {
  kpis: OwnerMissionKpi[];
  priorities: OwnerMissionItem[];
  missions: OwnerMissionItem[];
};

export default function OwnerMissionPage({ missions }: OwnerMissionPageProps) {
  const mission = missions[0];

  if (!mission) {
    return (
      <section className={styles.missionPage} aria-label="Détail propriétaire de la mission">
        <div className={styles.hero}>
          <div>
            <p>Mission propriétaire</p>
            <h2>Mission à suivre</h2>
          </div>
          <span>Les informations de la mission apparaîtront ici dès le chargement.</span>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.missionPage} aria-label="Détail propriétaire de la mission">
      <div className={styles.hero}>
        <div>
          <p>Mission propriétaire</p>
          <h2>{ownerMissionTypeLabels[mission.type]}</h2>
          <span className={`${styles.statusPill} ${styles[mission.status]}`}>
            {ownerMissionStatusLabels[mission.status]}
          </span>
        </div>
        <div className={styles.heroFacts}>
          <span>
            <strong>{mission.propertyName}</strong>
            {mission.city ? ` - ${mission.city}` : ""}
          </span>
          <span>{formatOwnerMissionDate(mission.date)} à {formatOwnerMissionTime(mission.date)}</span>
          <span>{mission.assignedTo || "Intervenant à préciser"}</span>
        </div>
      </div>
    </section>
  );
}
