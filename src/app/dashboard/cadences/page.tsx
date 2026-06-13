import type { CSSProperties } from "react";
import Image from "next/image";
import DashboardStatusBadge from "@/app/components/dashboard/saas/DashboardStatusBadge";
import {
  DASHBOARD_MISSION_PACE_LEVELS,
  getDashboardMissionPaceMetaForLevel,
  type DashboardMissionPaceLevel,
} from "@/app/components/dashboard/saas";
import styles from "./page.module.scss";

const SAMPLE_BY_LEVEL: Record<DashboardMissionPaceLevel, { count: string; detail: string; tone: string }> = {
  calm: {
    count: "0 mission aujourd'hui",
    detail: "Cadence affichée quand aucune mission n'est prévue sur la journée.",
    tone: "#1badbe",
  },
  soft: {
    count: "1 à 2 missions",
    detail: "Cadence légère, utile quand la journée reste confortable.",
    tone: "#3f8fd2",
  },
  active: {
    count: "3 à 5 missions",
    detail: "Cadence active, la journée demande une vraie attention planning.",
    tone: "#e29d16",
  },
  high: {
    count: "6 missions et plus",
    detail: "Forte cadence, à utiliser pour signaler une charge élevée.",
    tone: "#2e77be",
  },
};

export default function CadencesPreviewPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Bibliothèque visuelle</p>
        <h1>Cadences missions</h1>
        <p>
          Les quatre images utilisent la même base visuelle de mer calme. Elles sont partagées par les espaces
          propriétaire, concierge, artisan/prestataire et administrateur selon le nombre de missions du jour.
        </p>
      </section>

      <section className={styles.grid} aria-label="Prévisualisation des cadences">
        {DASHBOARD_MISSION_PACE_LEVELS.map((level) => {
          const meta = getDashboardMissionPaceMetaForLevel(level);
          const sample = SAMPLE_BY_LEVEL[level];

          return (
            <article key={level} className={styles.card} style={{ "--tone": sample.tone } as CSSProperties}>
              <div className={styles.imageWrap}>
                <Image src={meta.iconSrc} width={128} height={128} alt="" aria-hidden="true" unoptimized />
              </div>
              <div className={styles.cardHeader}>
                <h2>{meta.label}</h2>
                <DashboardStatusBadge label={meta.label} tone={meta.tone} icon={meta.icon} iconOnly />
              </div>
              <p>{sample.count}</p>
              <small>{sample.detail}</small>
            </article>
          );
        })}
      </section>

      <section className={styles.usage}>
        <h2>Utilisation prévue</h2>
        <ul>
          <li>Propriétaire et concierge : badge cadence sur la carte missions du tableau de bord.</li>
          <li>Artisan/prestataire : visuel cadence sur la statistique des interventions du jour.</li>
          <li>Administrateur : visuel cadence sur la carte planning, selon les missions planifiées aujourd&apos;hui.</li>
        </ul>
      </section>
    </div>
  );
}
