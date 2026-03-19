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
  {
    value: "standard",
    label: "Débutant",
    hint: "Ménage + check-in basique, créneaux classiques.",
  },
  {
    value: "urgent_24_7",
    label: "Urgentiste",
    hint: "Urgences 24/7, week-ends et nuits inclus.",
  },
  {
    value: "premium",
    label: "Premium",
    hint: "Accueil VIP et services haut de gamme.",
  },
  {
    value: "checkin_specialist",
    label: "Spécialiste check-in",
    hint: "Focus arrivées/départs voyageurs.",
  },
  // ✅ Tu avais déjà le preset en code : autant l’exposer
  {
    value: "full_service",
    label: "Full service",
    hint: "Couverture large + services complets, forte disponibilité.",
  },
];

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

const isCheckinMission = (mission: MissionConfig) => {
  const text = `${mission.id} ${mission.label}`.toLowerCase();
  return text.includes("check") || text.includes("accueil");
};

const applyPositioningPreset = (
  positioning: ConciergePositioning,
  profile: ConciergeMissionProfile
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
      case "checkin_specialist": {
        const isCheckin = isCheckinMission(mission);
        return {
          ...mission,
          isActive: isCheckin,
          minNoticeHours: isCheckin ? 6 : 48,
          allowUrgent: isCheckin,
          urgentMultiplier: isCheckin ? 1.25 : 1.1,
        };
      }
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
          highSeasonMultiplier: positioning === "checkin_specialist" ? 1.15 : 1.2,
        };

  return { ...profile, positioning, missions, specialConditions };
};

export default function MissionProfileModule({ value, isEditing, onChange }: Props) {
  const patchProfile = (patch: Partial<ConciergeMissionProfile>) => {
    if (!isEditing) return;
    onChange({ ...value, ...patch });
  };

  const setPositioning = (positioning: ConciergePositioning) => {
    if (!isEditing) return;
    onChange(applyPositioningPreset(positioning, value));
  };

  const patchSpecialConditions = (
    patch: Partial<ConciergeMissionProfile["specialConditions"]>
  ) => {
    if (!isEditing) return;
    patchProfile({
      specialConditions: {
        ...value.specialConditions,
        ...patch,
      },
    });
  };

  const patchUrgentHandling = (enabled: boolean) => {
    if (!isEditing) return;

    patchProfile({
      missions: value.missions.map((mission) => {
        if (!mission.isActive) return mission;

        return {
          ...mission,
          allowUrgent: enabled,
          minNoticeHours: enabled
            ? clamp(Math.min(mission.minNoticeHours, 24), 0, 168)
            : clamp(Math.max(mission.minNoticeHours, 24), 0, 168),
          urgentMultiplier: enabled
            ? clamp(Math.max(mission.urgentMultiplier, 1.25), 1, 3)
            : mission.urgentMultiplier,
        };
      }),
    });
  };

  const activeMissionsCount = value.missions.filter((m) => m.isActive).length;
  const urgentEnabledCount = value.missions.filter((m) => m.isActive && m.allowUrgent).length;
  const hasUrgentEnabled = urgentEnabledCount > 0;

  const highSeasonMultiplier = clamp(value.specialConditions.highSeasonMultiplier || 1.25, 1, 3);
  const highSeasonPercent = Math.round((highSeasonMultiplier - 1) * 100);

  return (
    <div className={styles.wrapper}>
      <section className={styles.block}>
        <div className={styles.headingRow}>
          <h5 className={styles.title}>Votre positionnement</h5>
          <span className={styles.optionalBadge}>Optionnel</span>
        </div>

        <p className={styles.subtitle}>
          Choisissez le profil qui décrit le mieux votre activité. Vous pourrez l&apos;affiner plus tard.
        </p>

        <div className={styles.positioningGrid} role="list">
          {POSITIONING_OPTIONS.map((option) => {
            const active = value.positioning === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={`${styles.positioningCard} ${
                  active ? styles.positioningCardActive : ""
                }`}
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
        <fieldset className={styles.fieldset} aria-disabled={!isEditing}>
          <legend className={styles.title}>Priorités de mission</legend>

          <div className={styles.togglesGrid}>
            <label className={styles.toggleItem}>
              <input
                type="checkbox"
                checked={hasUrgentEnabled}
                disabled={!isEditing || activeMissionsCount === 0}
                onChange={(e) => patchUrgentHandling(e.target.checked)}
              />
              <span>
                Accepte urgences <small>(&lt; 24h de préavis)</small>
                <small className={styles.muted}>
                  {activeMissionsCount > 0
                    ? ` — appliqué à ${urgentEnabledCount}/${activeMissionsCount} missions actives`
                    : " — aucune mission active"}
                </small>
              </span>
            </label>

            <label className={styles.toggleItem}>
              <input
                type="checkbox"
                checked={value.specialConditions.acceptWeekendInterventions}
                disabled={!isEditing}
                onChange={(e) =>
                  patchSpecialConditions({ acceptWeekendInterventions: e.target.checked })
                }
              />
              <span>Interventions week-end</span>
            </label>

            <label className={styles.toggleItem}>
              <input
                type="checkbox"
                checked={value.specialConditions.acceptHighSeasonInterventions}
                disabled={!isEditing}
                onChange={(e) =>
                  patchSpecialConditions({
                    acceptHighSeasonInterventions: e.target.checked,
                    highSeasonMultiplier: e.target.checked ? highSeasonMultiplier : 1,
                  })
                }
              />
              <span>
                Haute saison{" "}
                <small>
                  (+{value.specialConditions.acceptHighSeasonInterventions ? highSeasonPercent : 0}%)
                </small>
              </span>
            </label>
          </div>
        </fieldset>
      </section>
    </div>
  );
}