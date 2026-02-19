"use client";

import styles from "./MissionProfileModule.module.scss";
import type {
  ConciergeMissionProfile,
  ConciergePositioning,
  MissionConfig,
} from "./types";

interface Props {
  value: ConciergeMissionProfile;
  isEditing: boolean;
  onChange: (value: ConciergeMissionProfile) => void;
}

const POSITIONING_OPTIONS: Array<{
  value: ConciergePositioning;
  label: string;
  hint: string;
}> = [
  { value: "standard", label: "Standard", hint: "Service classique" },
  { value: "premium", label: "Premium", hint: "Exigence elevee" },
  { value: "urgent_24_7", label: "Urgences 24/7", hint: "Intervention rapide" },
  {
    value: "checkin_specialist",
    label: "Specialiste check-in",
    hint: "Arrivees et departs",
  },
  { value: "full_service", label: "Full service", hint: "Accompagnement global" },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const isCheckinMission = (mission: MissionConfig) => {
  const text = `${mission.id} ${mission.label}`.toLowerCase();
  return text.includes("check") || text.includes("accueil");
};

const applyPositioningPreset = (
  positioning: ConciergePositioning,
  profile: ConciergeMissionProfile,
): ConciergeMissionProfile => {
  const missions = profile.missions.map((mission) => {
    switch (positioning) {
      case "standard":
        return {
          ...mission,
          isActive: !String(mission.id).includes("urgence"),
          minNoticeHours: 24,
          allowUrgent: false,
          urgentMultiplier: 1.2,
        };
      case "premium":
        return {
          ...mission,
          isActive: true,
          minNoticeHours: 12,
          allowUrgent: true,
          urgentMultiplier: 1.35,
        };
      case "urgent_24_7":
        return {
          ...mission,
          isActive: true,
          minNoticeHours: 2,
          allowUrgent: true,
          urgentMultiplier: 1.5,
        };
      case "checkin_specialist":
        return {
          ...mission,
          isActive: isCheckinMission(mission),
          minNoticeHours: isCheckinMission(mission) ? 6 : 48,
          allowUrgent: isCheckinMission(mission),
          urgentMultiplier: isCheckinMission(mission) ? 1.25 : 1.1,
        };
      case "full_service":
        return {
          ...mission,
          isActive: true,
          minNoticeHours: 6,
          allowUrgent: true,
          urgentMultiplier: 1.4,
        };
      default:
        return mission;
    }
  });

  const specialConditions =
    positioning === "urgent_24_7" || positioning === "full_service"
      ? {
          ...profile.specialConditions,
          acceptNightInterventions: true,
          acceptWeekendInterventions: true,
          acceptHighSeasonInterventions: true,
          highSeasonMultiplier: 1.3,
        }
      : positioning === "premium"
        ? {
            ...profile.specialConditions,
            acceptNightInterventions: true,
            acceptWeekendInterventions: true,
            acceptHighSeasonInterventions: true,
            highSeasonMultiplier: 1.25,
          }
        : {
            ...profile.specialConditions,
            acceptNightInterventions: false,
            acceptWeekendInterventions: positioning === "checkin_specialist",
            acceptHighSeasonInterventions: positioning === "checkin_specialist",
            highSeasonMultiplier:
              positioning === "checkin_specialist" ? 1.15 : 1.2,
          };

  return { ...profile, positioning, missions, specialConditions };
};

export default function MissionProfileModule({
  value,
  isEditing,
  onChange,
}: Props) {
  const setPositioning = (positioning: ConciergePositioning) => {
    if (!isEditing) return;
    onChange(applyPositioningPreset(positioning, value));
  };

  const patchMission = (missionId: string, patch: Partial<MissionConfig>) => {
    if (!isEditing) return;
    onChange({
      ...value,
      missions: value.missions.map((mission) =>
        mission.id === missionId ? { ...mission, ...patch } : mission,
      ),
    });
  };

  return (
    <div className={styles.wrapper}>
      <section className={styles.block}>
        <h5 className={styles.title}>1. Positionnement</h5>
        <div className={styles.positioningGrid}>
          {POSITIONING_OPTIONS.map((option) => {
            const active = value.positioning === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={`${styles.positioningCard} ${active ? styles.positioningCardActive : ""}`}
                onClick={() => setPositioning(option.value)}
                disabled={!isEditing}
                aria-pressed={active}
              >
                <span className={styles.positioningLabel}>{option.label}</span>
                <span className={styles.positioningHint}>{option.hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.block}>
        <h5 className={styles.title}>2. Missions acceptees et niveau de service</h5>
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>Mission</span>
            <span>Acceptee</span>
            <span>Delai min (h)</span>
            <span>Urgence</span>
            <span>Majoration urgence</span>
          </div>

          {value.missions.map((mission) => (
            <div key={mission.id} className={styles.tableRow}>
              <span className={styles.missionLabel}>{mission.label}</span>
              <label className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  checked={mission.isActive}
                  disabled={!isEditing}
                  onChange={(e) =>
                    patchMission(mission.id, { isActive: e.target.checked })
                  }
                />
              </label>
              <input
                type="number"
                className={styles.input}
                value={mission.minNoticeHours}
                min={0}
                max={168}
                disabled={!isEditing || !mission.isActive}
                onChange={(e) =>
                  patchMission(mission.id, {
                    minNoticeHours: clamp(Number(e.target.value || 0), 0, 168),
                  })
                }
              />
              <label className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  checked={mission.allowUrgent}
                  disabled={!isEditing || !mission.isActive}
                  onChange={(e) =>
                    patchMission(mission.id, {
                      allowUrgent: e.target.checked,
                    })
                  }
                />
              </label>
              <input
                type="number"
                className={styles.input}
                value={mission.urgentMultiplier}
                min={1}
                max={3}
                step={0.05}
                disabled={!isEditing || !mission.isActive || !mission.allowUrgent}
                onChange={(e) =>
                  patchMission(mission.id, {
                    urgentMultiplier: clamp(Number(e.target.value || 1), 1, 3),
                  })
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section className={styles.block}>
        <h5 className={styles.title}>3. Conditions speciales</h5>
        <div className={styles.conditionsGrid}>
          <label className={styles.conditionItem}>
            <input
              type="checkbox"
              checked={value.specialConditions.acceptNightInterventions}
              disabled={!isEditing}
              onChange={(e) =>
                onChange({
                  ...value,
                  specialConditions: {
                    ...value.specialConditions,
                    acceptNightInterventions: e.target.checked,
                  },
                })
              }
            />
            <span>Interventions de nuit</span>
          </label>

          <label className={styles.conditionItem}>
            <input
              type="checkbox"
              checked={value.specialConditions.acceptWeekendInterventions}
              disabled={!isEditing}
              onChange={(e) =>
                onChange({
                  ...value,
                  specialConditions: {
                    ...value.specialConditions,
                    acceptWeekendInterventions: e.target.checked,
                  },
                })
              }
            />
            <span>Interventions week-end</span>
          </label>

          <label className={styles.conditionItem}>
            <input
              type="checkbox"
              checked={value.specialConditions.acceptHighSeasonInterventions}
              disabled={!isEditing}
              onChange={(e) =>
                onChange({
                  ...value,
                  specialConditions: {
                    ...value.specialConditions,
                    acceptHighSeasonInterventions: e.target.checked,
                  },
                })
              }
            />
            <span>Haute saison</span>
          </label>

          <label className={styles.multiplierItem}>
            <span>Majoration haute saison</span>
            <input
              type="number"
              className={styles.input}
              value={value.specialConditions.highSeasonMultiplier}
              min={1}
              max={3}
              step={0.05}
              disabled={
                !isEditing ||
                !value.specialConditions.acceptHighSeasonInterventions
              }
              onChange={(e) =>
                onChange({
                  ...value,
                  specialConditions: {
                    ...value.specialConditions,
                    highSeasonMultiplier: clamp(Number(e.target.value || 1), 1, 3),
                  },
                })
              }
            />
          </label>
        </div>

        <label className={styles.notesLabel} htmlFor="mission-geographic-notes">
          Notes geographiques
        </label>
        <textarea
          id="mission-geographic-notes"
          className={styles.textarea}
          value={value.specialConditions.geographicNotes}
          disabled={!isEditing}
          onChange={(e) =>
            onChange({
              ...value,
              specialConditions: {
                ...value.specialConditions,
                geographicNotes: e.target.value,
              },
            })
          }
          placeholder="Ex: centre-ville sous 2h, peri-urbain sous 6h"
          rows={3}
        />
      </section>
    </div>
  );
}
