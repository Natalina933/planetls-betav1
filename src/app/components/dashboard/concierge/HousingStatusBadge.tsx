"use client";

import styles from "./LogementWorkspace.module.scss";

type Props = {
  status: string | null | undefined;
};

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("pret") || normalized.includes("actif")) return styles.statusSuccess;
  if (normalized.includes("check-in") || normalized.includes("check-out")) return styles.statusInfo;
  if (normalized.includes("menage")) return styles.statusWarning;
  if (normalized.includes("maintenance") || normalized.includes("suspendu")) return styles.statusDanger;
  if (normalized.includes("archive")) return styles.statusMuted;
  return styles.statusNeutral;
}

export default function HousingStatusBadge({ status }: Props) {
  const label = status?.trim() || "Brouillon";
  return <span className={`${styles.statusBadge} ${getStatusTone(label)}`}>{label}</span>;
}
