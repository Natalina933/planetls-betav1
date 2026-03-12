import type { RevenuePoint } from "../../types";
import styles from "./RevenueChart.module.scss";

type RevenueChartProps = {
  data: RevenuePoint[];
};

function buildPath(points: RevenuePoint[], width: number, height: number) {
  const max = Math.max(...points.map((point) => point.value), 1);
  const stepX = width / (points.length - 1);

  return points
    .map((point, index) => {
      const x = index * stepX;
      const y = height - (point.value / max) * (height - 12);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function RevenueChart({ data }: RevenueChartProps) {
  const width = 760;
  const height = 240;
  const path = buildPath(data, width, height);
  const max = Math.max(...data.map((item) => item.value));

  return (
    <section className={styles.card} aria-label="Revenue chart">
      <header className={styles.header}>
        <h2>Revenue trend</h2>
        <span>YTD gross revenue</span>
      </header>

      <div className={styles.canvasWrap}>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Revenue line chart">
          <defs>
            <linearGradient id="lineGold" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8ea2c2" />
              <stop offset="60%" stopColor="#c8a75b" />
              <stop offset="100%" stopColor="#ad8c43" />
            </linearGradient>
          </defs>

          <path className={styles.path} d={path} stroke="url(#lineGold)" />

          {data.map((point, index) => {
            const x = (width / (data.length - 1)) * index;
            const y = height - (point.value / max) * (height - 12);
            return <circle key={point.label} cx={x} cy={y} r="4" className={styles.point} />;
          })}
        </svg>
      </div>

      <div className={styles.labels}>
        {data.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </section>
  );
}
