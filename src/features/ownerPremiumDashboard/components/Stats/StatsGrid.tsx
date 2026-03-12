import type { DashboardStat } from "../../types";
import styles from "./StatsGrid.module.scss";

type StatsGridProps = {
  items: DashboardStat[];
};

export function StatsGrid({ items }: StatsGridProps) {
  return (
    <section aria-label="Dashboard KPIs" className={styles.grid}>
      {items.map((item) => (
        <article key={item.id} className={styles.card}>
          <p className={styles.label}>{item.label}</p>
          <p className={styles.value}>{item.value}</p>
          <p className={`${styles.hint} ${styles[item.trend]}`}>{item.hint}</p>
        </article>
      ))}
    </section>
  );
}
