import OwnerMissionRow from "./OwnerMissionRow";
import type { OwnerMissionListItem } from "./types";
import styles from "./OwnerMissionsList.module.scss";

type OwnerMissionsListProps = {
  missions: OwnerMissionListItem[];
};

export default function OwnerMissionsList({ missions }: OwnerMissionsListProps) {
  return (
    <section className={styles.listSection} aria-labelledby="owner-missions-list-title">
      <div className={styles.header}>
        <div>
          <p>Suivi opérationnel</p>
          <h2 id="owner-missions-list-title">Missions à suivre</h2>
        </div>
        <span>{missions.length} résultat(s)</span>
      </div>

      {missions.length > 0 ? (
        <div className={styles.list}>
          {missions.map((mission) => (
            <OwnerMissionRow key={mission.id} mission={mission} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h3>Aucune mission trouvée</h3>
          <p>Les missions apparaissent ici après acceptation d’un devis, transmission d’un séjour ou création d’une urgence.</p>
        </div>
      )}
    </section>
  );
}
