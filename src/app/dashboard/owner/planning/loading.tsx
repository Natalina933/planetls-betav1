import { AsyncState } from "@/components/ui/AsyncState";
import styles from "./OwnerPlanningPage.module.scss";

export default function OwnerPlanningLoading() {
  return (
    <div className={styles.page} aria-busy="true">
      <AsyncState loading loadingLabel="Chargement du planning…" className={styles.sections}>
        {null}
      </AsyncState>
    </div>
  );
}
