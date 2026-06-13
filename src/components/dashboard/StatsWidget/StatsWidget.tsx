import { StatsCard } from "@/components/ui/StatsCard";
import styles from "./StatsWidget.module.scss";
import type { DashboardStatItem } from "../types";

interface StatsWidgetProps {
  items: DashboardStatItem[];
}

export function StatsWidget({ items }: StatsWidgetProps) {
  return (
    <section className={styles.section} aria-label="Statistiques principales">
      <div className={styles.grid}>
        {items.map((item) => (
          <StatsCard
            key={item.label}
            label={item.label}
            value={item.value}
            hint={item.hint}
            trend={item.trend}
            progress={item.progress}
            visual={item.visual}
            visualLabel={item.visualLabel}
          />
        ))}
      </div>
    </section>
  );
}
