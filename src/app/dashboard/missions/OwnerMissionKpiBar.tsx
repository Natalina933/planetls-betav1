import type { OwnerMissionKpi } from "./ownerMissionTypes";
import { MetricDonut } from "@/components/dashboard";
import styles from "./OwnerMissionKpiBar.module.scss";

type OwnerMissionKpiBarProps = {
  kpis: OwnerMissionKpi[];
};

export default function OwnerMissionKpiBar({ kpis }: OwnerMissionKpiBarProps) {
  const maxValue = Math.max(...kpis.map((kpi) => kpi.value), 1);

  return (
    <section className={styles.kpiBar} aria-label="Indicateurs des missions">
      {kpis.slice(0, 5).map((kpi) => (
        <MetricDonut
          key={kpi.id}
          label={kpi.label}
          value={`${kpi.value}`}
          detail={kpi.helperText}
          percent={kpi.value > 0 ? Math.max(12, Math.round((kpi.value / maxValue) * 100)) : 0}
          className={`${styles.kpiCard} ${styles[kpi.tone ?? "neutral"]}`}
        />
      ))}
    </section>
  );
}
