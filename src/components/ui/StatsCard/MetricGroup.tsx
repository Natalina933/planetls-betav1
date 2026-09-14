import type { HTMLAttributes } from "react";
import styles from "./StatsCard.module.scss";

/** Grille sans calcul métier : elle accepte aussi des cartes spécialisées. */
export function MetricGroup({ className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={[styles.metricGroup, className].filter(Boolean).join(" ")} {...props} />;
}
