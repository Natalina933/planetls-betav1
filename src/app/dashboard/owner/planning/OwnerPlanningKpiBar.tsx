import type { OwnerPlanningKpi } from "./types";
import styles from "./OwnerPlanningKpiBar.module.scss";

type OwnerPlanningKpiBarProps = {
  kpis: OwnerPlanningKpi[];
};

export default function OwnerPlanningKpiBar({ kpis }: OwnerPlanningKpiBarProps) {
  const visibleKpis = kpis.slice(0, 5);

  return (
    <section className={styles.kpiBar} aria-label="Indicateurs du planning">
      {visibleKpis.map((kpi) => (
        <article key={kpi.id} className={`${styles.kpiCard} ${styles[kpi.tone ?? "neutral"]}`}>
          <strong>{kpi.value}</strong>
          <span>{kpi.label}</span>
          {kpi.helperText ? <p>{kpi.helperText}</p> : null}
        </article>
      ))}
    </section>
  );
}
