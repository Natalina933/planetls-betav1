import { Loader2 } from "lucide-react";
import styles from "./DashboardLoadingScreen.module.scss";

export type DashboardLoadingScreenProps = {
  label: string;
};

export function DashboardLoadingScreen({ label }: DashboardLoadingScreenProps) {
  return (
    <div className={styles.screen}>
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className={styles.text}>{label}</p>
    </div>
  );
}
