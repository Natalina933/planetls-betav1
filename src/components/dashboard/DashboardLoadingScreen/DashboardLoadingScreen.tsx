import { Loader2 } from "lucide-react";
import styles from "./DashboardLoadingScreen.module.scss";

export type DashboardLoadingScreenProps = {
  label: string;
};

export function DashboardLoadingScreen({ label }: DashboardLoadingScreenProps) {
  return (
    <div className={styles.screen} role="status" aria-live="polite">
      <section className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.spinner}>
            <Loader2 size={22} />
          </span>
          <div>
            <strong>{label}</strong>
            <p>Preparation de votre espace de travail.</p>
          </div>
        </div>
        <div className={styles.skeletonGrid} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className={styles.skeletonList} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
    </div>
  );
}
