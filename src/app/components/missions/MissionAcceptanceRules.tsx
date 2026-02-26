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
  hint?: string;
}> = [
  {
    key: "refuseOutOfZone",
    title: "Refuser automatiquement hors zone",
    description:
      "Les demandes en dehors de votre périmètre seront déclinées automatiquement.",
  },
  {
    key: "refuseOutOfSchedule",
    title: "Refuser les missions hors horaires",
    description:
      "Seules les demandes pendant vos créneaux définis seront acceptées.",
  },
  {
    key: "autoAcceptEmergency",
    title: "Accepter automatiquement les urgences",
    description: "Les missions urgentes seront acceptées même hors horaires.",
    hint: "Astuce : utile surtout si vous refusez les missions hors horaires.",
  },
];

export default function MissionAcceptanceRules({ value, isEditing, onChange }: Props) {
  const setRule = (key: keyof Rules, checked: boolean) => {
    if (!isEditing) return;

    // Exemple de petite logique UX (optionnelle) :
    // si on désactive "refuseOutOfSchedule", alors "autoAcceptEmergency" n'a plus vraiment de sens
    if (key === "refuseOutOfSchedule" && checked === false && value.autoAcceptEmergency) {
      onChange({ ...value, refuseOutOfSchedule: false, autoAcceptEmergency: false });
      return;
    }

    onChange({ ...value, [key]: checked });
  };

  return (
    <fieldset className={styles.rulesGrid} aria-disabled={!isEditing}>
      <legend className={styles.legend}>Règles d’acceptation</legend>

      {RULES_CONFIG.map((rule) => {
        const checked = Boolean(value[rule.key]);

        const isRuleDisabled =
          !isEditing ||
          (rule.key === "autoAcceptEmergency" && value.refuseOutOfSchedule === false);

        const describedBy = rule.hint ? `rule-hint-${rule.key}` : undefined;

        return (
          <label
            key={rule.key}
            className={[
              styles.ruleItem,
              !isEditing ? styles.disabled : "",
              isRuleDisabled ? styles.ruleDisabled : "",
            ].join(" ")}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={isRuleDisabled}
              onChange={(e) => setRule(rule.key, e.target.checked)}
              className={styles.checkbox}
              aria-describedby={describedBy}
            />

            <div className={styles.ruleContent}>
              <span className={styles.ruleTitle}>{rule.title}</span>
              <span className={styles.ruleDescription}>{rule.description}</span>

              {rule.key === "autoAcceptEmergency" && value.refuseOutOfSchedule === false && (
                <span id={`rule-hint-${rule.key}`} className={styles.ruleHint}>
                  Activez d’abord “Refuser les missions hors horaires” pour utiliser cette option.
                </span>
              )}

              {rule.hint && value.refuseOutOfSchedule !== false && (
                <span id={`rule-hint-${rule.key}`} className={styles.ruleHint}>
                  {rule.hint}
                </span>
              )}
            </div>
          </label>
        );
      })}
    </fieldset>
  );
}
