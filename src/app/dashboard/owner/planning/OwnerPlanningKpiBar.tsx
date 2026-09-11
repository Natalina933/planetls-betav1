import type { OwnerPlanningKpi } from "./types";
import { Card } from "@/components/ui";
import { CalendarCheck, ClipboardCheck, Home, ListTodo } from "lucide-react";
import styles from "./OwnerPlanningKpiBar.module.scss";

type OwnerPlanningKpiBarProps = {
  kpis: OwnerPlanningKpi[];
  loading?: boolean;
  unavailable?: boolean;
};

export default function OwnerPlanningKpiBar({ kpis, loading, unavailable }: OwnerPlanningKpiBarProps) {
  const visibleKpis = kpis.slice(0, 4);
  const icons = [ListTodo, ClipboardCheck, Home, CalendarCheck];

  return (
    <section className={styles.kpiBar} aria-label="Indicateurs du planning">
      {visibleKpis.map((kpi, index) => {
        const Icon = icons[index];
        return <Card key={kpi.id} className={styles.kpiCard} tone="outlined">
          <Icon size={20} aria-hidden="true" /><div>
          <strong>{loading ? "…" : unavailable ? "—" : kpi.value}</strong>
          <span>{kpi.label}</span>
          {!loading && !unavailable && kpi.helperText ? <p>{kpi.helperText}</p> : null}
          </div>
        </Card>;
      })}
    </section>
  );
}
