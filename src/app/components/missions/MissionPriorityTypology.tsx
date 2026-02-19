"use client";

import { useState } from "react";
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

const PRIORITY_OPTIONS: Array<{
  key: keyof MissionPriorityFlags;
  label: string;
}> = [
    { key: "urgent", label: "Urgentes" },
    { key: "recurrent", label: "Recurrentes" },
    { key: "premium", label: "Clients premium" },
  ];

const toMissionId = (label: string) =>
  label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function MissionPriorityTypology({
  value,
  isEditing,
  onChange,
}: Props) {
  const [newMissionType, setNewMissionType] = useState("");

  const togglePriority = (key: keyof MissionPriorityFlags) => {
    if (!isEditing) return;
    onChange({
      ...value,
      preferences: {
        ...value.preferences,
        priorityFlags: {
          ...value.preferences.priorityFlags,
          [key]: !value.preferences.priorityFlags[key],
        },
      },
    });
  };

  const toggleMissionType = (missionTypeId: string) => {
    if (!isEditing) return;

    const exists =
      value.preferences.acceptedMissionTypeIds.includes(missionTypeId);
    const acceptedMissionTypeIds = exists
      ? value.preferences.acceptedMissionTypeIds.filter(
        (item) => item !== missionTypeId,
      )
      : [...value.preferences.acceptedMissionTypeIds, missionTypeId];

    onChange({
      ...value,
      preferences: {
        ...value.preferences,
        acceptedMissionTypeIds,
      },
    });
  };

  const addMissionType = () => {
    if (!isEditing) return;
    const label = newMissionType.trim();
    if (!label) return;

    const id = toMissionId(label);
    if (!id) return;

    if (value.missionCatalog.some((item) => item.id === id)) {
      setNewMissionType("");
      return;
    }

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
      missionCatalog: value.missionCatalog.filter(
        (item) => item.id !== missionTypeId,
      ),
      preferences: {
        ...value.preferences,
        acceptedMissionTypeIds: value.preferences.acceptedMissionTypeIds.filter(
          (item) => item !== missionTypeId,
        ),
      },
    });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.block}>
        <h5 className={styles.title}>Priorites de traitement</h5>
        <div className={styles.chips}>
          {PRIORITY_OPTIONS.map((option) => {
            const active = value.preferences.priorityFlags[option.key];
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
        <h5 className={styles.title}>Typologie de missions acceptees</h5>
        {isEditing && (
          <div className={styles.addRow}>
            <input
              type="text"
              className={styles.input}
              placeholder="Ajouter un type de mission"
              value={newMissionType}
              onChange={(e) => setNewMissionType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addMissionType();
                }
              }}
            />
            <button
              type="button"
              className={styles.addBtn}
              onClick={addMissionType}
            >
              Ajouter
            </button>
          </div>
        )}

        <div className={styles.chips}>
          {value.missionCatalog.map((item: MissionCatalogItem) => {
            const active =
              value.preferences.acceptedMissionTypeIds.includes(item.id);
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
                  {typeof item.basePrice === "number"
                    ? ` (${item.basePrice} EUR)`
                    : ""}
                </button>
                {isEditing && item.customizable && (
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeMissionType(item.id)}
                    aria-label={`Supprimer ${item.label}`}
                  >
                    x
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
