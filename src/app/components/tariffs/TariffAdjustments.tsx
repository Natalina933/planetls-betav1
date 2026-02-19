"use client";

import styles from "./TariffAdjustments.module.scss";
import type { SeasonalPricingConfig } from "./types";

interface Props {
  value: SeasonalPricingConfig;
  isEditing: boolean;
  onChange: (value: SeasonalPricingConfig) => void;
}

const clampPercent = (value: number) => Math.max(0, Math.min(value, 200));
const clampMoney = (value: number) => Math.max(0, Math.min(value, 999));

const percentFields: Array<{ key: keyof SeasonalPricingConfig; label: string }> = [
  { key: "urgentPercent", label: "Urgence (-24h)" },
  { key: "nightPercent", label: "Nuit (22h-7h)" },
  { key: "weekendPercent", label: "Week-end" },
  { key: "highSeasonPercent", label: "Haute saison" },
];

export default function TariffAdjustments({ value, isEditing, onChange }: Props) {
  return (
    <div className={styles.grid}>
      {percentFields.map((field) => (
        <label key={field.key} className={styles.row}>
          <span>{field.label}</span>
          <input
            type="number"
            min={0}
            max={200}
            step={1}
            className={styles.input}
            disabled={!isEditing}
            value={value[field.key]}
            onChange={(e) =>
              onChange({
                ...value,
                [field.key]: clampPercent(Number(e.target.value || 0)),
              })
            }
          />
          <small>%</small>
        </label>
      ))}

      <label className={styles.row}>
        <span>Frais par km hors zone</span>
        <input
          type="number"
          min={0}
          max={999}
          step={1}
          className={styles.input}
          disabled={!isEditing}
          value={value.extraKmFee}
          onChange={(e) =>
            onChange({
              ...value,
              extraKmFee: clampMoney(Number(e.target.value || 0)),
            })
          }
        />
        <small>EUR</small>
      </label>

      <label className={styles.row}>
        <span>Facturation minimum</span>
        <input
          type="number"
          min={0}
          max={999}
          step={1}
          className={styles.input}
          disabled={!isEditing}
          value={value.minimumInvoice}
          onChange={(e) =>
            onChange({
              ...value,
              minimumInvoice: clampMoney(Number(e.target.value || 0)),
            })
          }
        />
        <small>EUR</small>
      </label>
    </div>
  );
}
