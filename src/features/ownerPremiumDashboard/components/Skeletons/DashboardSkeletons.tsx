import styles from "./DashboardSkeletons.module.scss";

export function DashboardSkeletons() {
  return (
    <div className={styles.skeletonLayout} aria-hidden="true">
      <div className={styles.statsRow}>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={styles.block} />
        ))}
      </div>
      <div className={styles.bodyGrid}>
        <div className={styles.large} />
        <div className={styles.side}>
          <div className={styles.block} />
          <div className={styles.block} />
        </div>
      </div>
    </div>
  );
}
