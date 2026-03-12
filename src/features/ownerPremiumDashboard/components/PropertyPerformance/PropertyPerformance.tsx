import type { PropertyPerformanceItem } from "../../types";
import styles from "./PropertyPerformance.module.scss";

type PropertyPerformanceProps = {
  items: PropertyPerformanceItem[];
};

function currency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export function PropertyPerformance({ items }: PropertyPerformanceProps) {
  return (
    <section className={styles.card} aria-label="Property performance section">
      <header className={styles.header}>
        <h2>Property performance</h2>
      </header>

      <div className={styles.list}>
        {items.map((item) => (
          <article key={item.id} className={styles.item}>
            <div>
              <h3>{item.name}</h3>
              <p>{currency(item.monthlyRevenue)} monthly revenue</p>
            </div>

            <div className={styles.metrics}>
              <span>{item.occupancyRate}% occupancy</span>
              <span>{item.reviewsAverage.toFixed(2)} rating</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
