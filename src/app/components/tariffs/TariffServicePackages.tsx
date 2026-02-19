"use client";

import styles from "./TariffServicePackages.module.scss";
import type { SeasonalPricingConfig } from "./types";

interface Props {
  value: SeasonalPricingConfig;
  isEditing: boolean;
  onChange: (value: SeasonalPricingConfig) => void;
}

const clampMoney = (value: number) => Math.max(0, Math.min(value, 9999));

const packageFields: Array<{ key: keyof SeasonalPricingConfig; label: string }> = [
  { key: "checkInFee", label: "Check-in standard" },
  { key: "checkOutFee", label: "Check-out standard" },
  { key: "cleaningStudioFee", label: "Menage studio/T1" },
  { key: "cleaningTwoRoomsFee", label: "Menage T2/T3" },
  { key: "linenKitFee", label: "Kit linge (par sejour)" },
  { key: "welcomePackFee", label: "Pack accueil voyageur" },
];

export default function TariffServicePackages({
  value,
  isEditing,
  onChange,
}: Props) {
  return (
    <div className={styles.grid}>
      {packageFields.map((field) => (
        <label key={field.key} className={styles.row}>
          <span>{field.label}</span>
          <input
            type="number"
            min={0}
            max={9999}
            step={1}
            className={styles.input}
            disabled={!isEditing}
            value={value[field.key]}
            onChange={(e) =>
              onChange({
                ...value,
                [field.key]: clampMoney(Number(e.target.value || 0)),
              })
            }
          />
          <small>EUR</small>
        </label>
      ))}
    </div>
  );
}
