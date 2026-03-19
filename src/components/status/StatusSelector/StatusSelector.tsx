// src/app/components/status/StatusSelector.tsx
"use client";

import { useState } from "react";
import StatusBadge from "../StatusBadge/StatusBadge";
import type { UserStatus } from "../userStatusTypes";
import { USER_STATUS_LABELS } from "../userStatusTypes";
import styles from "./StatusSelector.module.scss";

const ALL_STATUSES: UserStatus[] = [
  "active",
  "busy",
  "away",
  "vacation",
  "offline",
];

interface StatusSelectorProps {
  defaultStatus?: UserStatus;
  onChange?: (status: UserStatus) => void;
}

export default function StatusSelector({
  defaultStatus = "active",
  onChange,
}: StatusSelectorProps) {
  const [selected, setSelected] = useState<UserStatus>(defaultStatus);

  const handleSelect = (status: UserStatus) => {
    setSelected(status);
    onChange?.(status);
  };

  return (
    <div className={styles.selector}>
      {ALL_STATUSES.map((status) => (
<button
  key={status}
  type="button"
  title={`Changer le statut en ${USER_STATUS_LABELS[status]}`}
  className={`${styles.option} ${selected === status ? styles.active : ""}`}
  onClick={() => handleSelect(status)}
>
  <StatusBadge status={status} size="md" />
</button>


      ))}
    </div>
  );
}
