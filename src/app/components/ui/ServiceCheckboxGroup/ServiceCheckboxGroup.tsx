//app/components/ui/ServiceCheckboxGroup/ServiceCheckboxGroup.tsx
"use client";

import React from "react";
import styles from "./ServiceCheckboxGroup.module.scss";

interface ServiceCheckboxGroupProps {
  selected: string[]; // services sélectionnés
  onChange: (selected: string[]) => void; // callback parent
  disabled?: boolean;
}

const SERVICE_OPTIONS = [
  { id: "cleaning", label: "Ménage" },
  { id: "laundry", label: "Linge" },
  { id: "checkin", label: "Check-in / Check-out" },
  { id: "maintenance", label: "Maintenance" },
  { id: "welcome", label: "Accueil voyageurs" },
  { id: "management", label: "Gestion complète" },
];

export default function ServiceCheckboxGroup({
  selected,
  onChange,
  disabled = false,
}: ServiceCheckboxGroupProps) {
  const toggle = (id: string) => {
    if (disabled) return;
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className={styles.group}>
      {SERVICE_OPTIONS.map((service) => (
        <label key={service.id} className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={selected.includes(service.id)}
            onChange={() => toggle(service.id)}
            disabled={disabled}
            aria-label={service.label}
          />
          <span className={styles.customBox}></span>
          {service.label}
        </label>
      ))}
    </div>
  );
}
