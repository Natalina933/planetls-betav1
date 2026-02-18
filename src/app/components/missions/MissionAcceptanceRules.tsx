"use client";

import styles from "./MissionAcceptanceRules.module.scss";
import type { MissionAvailability } from "./types";

type Rules = MissionAvailability["rules"];

interface Props {
  value: Rules;
  isEditing: boolean;
  onChange: (value: Rules) => void;
}

const RULES_CONFIG: Array<{
  key: keyof Rules;
  title: string;
  description: string;
}> = [
  {
    key: "refuseOutOfZone",
    title: "Refuser automatiquement hors zone",
    description:
      "Les demandes en dehors de votre perimetre seront declinees automatiquement.",
  },
  {
    key: "refuseOutOfSchedule",
    title: "Refuser les missions hors horaires",
    description:
      "Seules les demandes pendant vos creneaux definis seront acceptees.",
  },
  {
    key: "autoAcceptEmergency",
    title: "Accepter automatiquement les urgences",
    description: "Les missions urgentes seront acceptees meme hors horaires.",
  },
];

export default function MissionAcceptanceRules({
  value,
  isEditing,
  onChange,
}: Props) {
  const toggle = (key: keyof Rules) => {
    if (!isEditing) return;
    onChange({ ...value, [key]: !value[key] });
  };

  return (
    <div className={styles.rulesGrid}>
      {RULES_CONFIG.map((rule) => (
        <label
          key={rule.key}
          className={`${styles.ruleItem} ${!isEditing ? styles.disabled : ""}`}
        >
          <input
            type="checkbox"
            checked={Boolean(value[rule.key])}
            disabled={!isEditing}
            onChange={() => toggle(rule.key)}
            className={styles.checkbox}
          />
          <div className={styles.ruleContent}>
            <span className={styles.ruleTitle}>{rule.title}</span>
            <span className={styles.ruleDescription}>{rule.description}</span>
          </div>
        </label>
      ))}
    </div>
  );
}
