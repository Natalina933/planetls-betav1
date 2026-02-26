"use client";

import { useMemo, useState } from "react";
import styles from "./MissionPriorityTypology.module.scss";
import type {
  MissionCatalogItem,
  MissionPreferences,
  MissionPriorityFlags,
} from "./types";

export interface MissionPriorityTypologyValue {
  missionCatalog: MissionCatalogItem[];
  preferences: MissionPreferences;
}

interface Props {
  value: MissionPriorityTypologyValue;
  isEditing: boolean;
  onChange: (value: MissionPriorityTypologyValue) => void;
}

const PRIORITY_OPTIONS: Array<{ key: keyof MissionPriorityFlags; label: string }> = [
  { key: "urgent", label: "Urgentes" },
  { key: "recurrent", label: "Récurrentes" },
  { key: "premium", label: "Clients premium" },
];

const toMissionId = (label: string) =>
  label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function MissionPriorityTypology({ value, isEditing, onChange }: Props) {
  const [newMissionType, setNewMissionType] = useState("");
  const [uiError, setUiError] = useState<string | null>(null);

  const acceptedSet = useMemo(
    () => new Set(value.preferences.acceptedMissionTypeIds),
    [value.preferences.acceptedMissionTypeIds]
  );

  const patchPreferences = (patch: Partial<MissionPreferences>) => {
    onChange({
      ...value,
      preferences: {
        ...value.preferences,
        ...patch,
      },
    });
  };

  const togglePriority = (key: keyof MissionPriorityFlags) => {
    if (!isEditing) return;

    patchPreferences({
      priorityFlags: {
        ...value.preferences.priorityFlags,
        [key]: !value.preferences.priorityFlags[key],
      },
    });
  };

  const toggleMissionType = (missionTypeId: string) => {
    if (!isEditing) return;

    const exists = acceptedSet.has(missionTypeId);
    const acceptedMissionTypeIds = exists
      ? value.preferences.acceptedMissionTypeIds.filter((id) => id !== missionTypeId)
      : [...value.preferences.acceptedMissionTypeIds, missionTypeId];

    patchPreferences({ acceptedMissionTypeIds });
  };

  const addMissionType = () => {
    if (!isEditing) return;

    const label = newMissionType.trim();
    if (!label) {
      setUiError("Saisis un type de mission (ex : Check-in, Ménage…).");
      return;
    }

    const id = toMissionId(label);
    if (!id) {
      setUiError("Nom invalide : utilise des lettres et chiffres.");
      return;
    }

    if (value.missionCatalog.some((item) => item.id === id)) {
      setUiError("Ce type de mission existe déjà.");
      return;
    }

    setUiError(null);

    onChange({
      ...value,
      missionCatalog: [
        ...value.missionCatalog,
        { id, label, basePrice: null, customizable: true },
      ],
      preferences: {
        ...value.preferences,
        acceptedMissionTypeIds: [...value.preferences.acceptedMissionTypeIds, id],
      },
    });

    setNewMissionType("");
  };

  const removeMissionType = (missionTypeId: string) => {
    if (!isEditing) return;

    onChange({
      ...value,
      missionCatalog: value.missionCatalog.filter((item) => item.id !== missionTypeId),
      preferences: {
        ...value.preferences,
        acceptedMissionTypeIds: value.preferences.acceptedMissionTypeIds.filter(
          (id) => id !== missionTypeId
        ),
      },
    });
  };

  const canAdd = isEditing && newMissionType.trim().length > 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.block}>
        <h5 className={styles.title}>Priorités de traitement</h5>

        <div className={styles.chips} role="group" aria-label="Priorités de traitement">
          {PRIORITY_OPTIONS.map((option) => {
            const active = Boolean(value.preferences.priorityFlags[option.key]);
            return (
              <button
                key={option.key}
                type="button"
                className={`${styles.chip} ${active ? styles.chipActive : ""}`}
                onClick={() => togglePriority(option.key)}
                disabled={!isEditing}
                aria-pressed={active}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.block}>
        <h5 className={styles.title}>Typologie de missions acceptées</h5>

        {isEditing && (
          <div className={styles.addRow}>
            <div className={styles.inputCol}>
              <input
                type="text"
                className={styles.input}
                placeholder="Ajouter un type de mission"
                value={newMissionType}
                onChange={(e) => {
                  setNewMissionType(e.target.value);
                  if (uiError) setUiError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMissionType();
                  }
                }}
                aria-invalid={Boolean(uiError)}
                aria-describedby={uiError ? "mission-type-error" : undefined}
              />

              {uiError && (
                <p id="mission-type-error" className={styles.error} role="alert">
                  {uiError}
                </p>
              )}
            </div>

            <button
              type="button"
              className={styles.addBtn}
              onClick={addMissionType}
              disabled={!canAdd}
              aria-disabled={!canAdd}
            >
              Ajouter
            </button>
          </div>
        )}

        <div className={styles.chips} role="group" aria-label="Types de missions">
          {value.missionCatalog.map((item) => {
            const active = acceptedSet.has(item.id);
            const priceLabel =
              typeof item.basePrice === "number" ? ` (${item.basePrice} €)` : "";

            return (
              <div key={item.id} className={styles.chipRow}>
                <button
                  type="button"
                  className={`${styles.chip} ${active ? styles.chipActive : ""}`}
                  onClick={() => toggleMissionType(item.id)}
                  disabled={!isEditing}
                  aria-pressed={active}
                >
                  {item.label}
                  {priceLabel}
                </button>

                {isEditing && item.customizable && (
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeMissionType(item.id)}
                    aria-label={`Supprimer ${item.label}`}
                    title={`Supprimer ${item.label}`}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}