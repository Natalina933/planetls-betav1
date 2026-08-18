import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import styles from "./BusinessStrategyCenter.module.scss";

export function MetricsCard({ label, value, variation, help, icon }: { label: string; value: string; variation: string; help: string; icon: ReactNode }) {
  return <article className={styles.metricCard}><div className={styles.metricIcon}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{variation}</small></div><button type="button" title={help} aria-label={`${label} : ${help}`}><CircleHelp size={15} /></button></article>;
}