"use client";

import React from "react";
import { CompletionStatusCard } from "@/components/dashboard";

type MissionProgressStepItem = {
  key: string;
  label: string;
  hint: string;
  done: boolean;
  sectionId?: string;
};

interface MissionsTabLayoutProps {
  styles: Record<string, string>;
  missionProgressPercent: number;
  missionProgressDoneCount: number;
  missionProgressTotal: number;
  showPendingMissionStepsOnly: boolean;
  onTogglePendingSteps: () => void;
  displayedActiveMissionCount: number;
  totalAvailableMissionCount: number;
  recognizedActiveMissionCount: number;
  unrecognizedActiveMissionLabelsCount: number;
  missionOpenDaysCount: number;
  missionRangesCount: number;
  missionZonesCount: number;
  missionProgressSteps: MissionProgressStepItem[];
  openMissionSectionForEdit: (sectionId: string) => void;
  children: React.ReactNode;
  secondaryContent?: React.ReactNode;
  showCompletionCard?: boolean;
  showSecondaryContent?: boolean;
}

export default function MissionsTabLayout({
  styles,
  missionProgressPercent,
  missionProgressDoneCount,
  missionProgressTotal,
  showPendingMissionStepsOnly,
  onTogglePendingSteps,
  displayedActiveMissionCount,
  totalAvailableMissionCount,
  recognizedActiveMissionCount,
  unrecognizedActiveMissionLabelsCount,
  missionOpenDaysCount,
  missionRangesCount,
  missionZonesCount,
  missionProgressSteps,
  openMissionSectionForEdit,
  children,
  secondaryContent,
  showCompletionCard = true,
  showSecondaryContent = true,
}: MissionsTabLayoutProps) {
  const servicesStep = missionProgressSteps.find((step) => step.key === "services");
  const zoneStep = missionProgressSteps.find((step) => step.key === "zone");
  const availabilityStep = missionProgressSteps.find((step) => step.key === "availability");

  const renderMissionStatBadge = (
    step: MissionProgressStepItem | undefined,
    metricDone: boolean,
  ) => {
    const isPending = !metricDone || (step ? !step.done : false);
    if (!isPending || !step?.sectionId) return null;

    return (
      <button
        type="button"
        className={styles.missionPendingBadge}
        onClick={() => openMissionSectionForEdit(step.sectionId!)}
        title={`Completer: ${step.label}`}
      >
        <span className={styles.missionPendingDot} aria-hidden="true" />
        À compléter
      </button>
    );
  };

  return (
    <div className={styles.missionsLayout}>
      <div className={styles.missionsHero}>
        <div className={styles.missionsHeroTitle}>
          <h3>Pilotage des missions</h3>
          <p>Configurez vos services, zones et disponibilites, puis suivez vos indicateurs.</p>
        </div>
        <div className={styles.missionsHeroProgress}>
          <div className={styles.missionsHeroProgressMeta}>
            <span>Progression de configuration</span>
            <strong>{missionProgressPercent}%</strong>
          </div>
          <button
            type="button"
            className={styles.missionProgressTrackButton}
            onClick={onTogglePendingSteps}
            title="Filtrer les étapes à configurer"
            aria-pressed={showPendingMissionStepsOnly}
          >
            <div className={styles.missionProgressTrack} aria-hidden="true">
              <div
                className={styles.missionProgressFill}
                style={{ width: `${missionProgressPercent}%` }}
              />
            </div>
          </button>
          <p className={styles.missionsHeroProgressHint}>
            {missionProgressDoneCount}/{missionProgressTotal} étapes complétées
          </p>
        </div>
        <div className={styles.missionsHeroStats}>
          <div className={styles.missionStat}>
            <div className={styles.missionStatTop}>
              <span className={styles.missionStatLabel}>Services actifs</span>
              {renderMissionStatBadge(servicesStep, displayedActiveMissionCount > 0)}
            </div>
            <strong>
              {displayedActiveMissionCount}
              {totalAvailableMissionCount > 0 ? `/${totalAvailableMissionCount}` : ""}
            </strong>
            {unrecognizedActiveMissionLabelsCount > 0 ? (
              <small className={styles.missionStatSub}>
                {recognizedActiveMissionCount} reconnus, {unrecognizedActiveMissionLabelsCount} non reconnus
              </small>
            ) : null}
          </div>
          <div className={styles.missionStat}>
            <div className={styles.missionStatTop}>
              <span className={styles.missionStatLabel}>Jours ouverts</span>
              {renderMissionStatBadge(availabilityStep, missionOpenDaysCount > 0)}
            </div>
            <strong>{missionOpenDaysCount}/7</strong>
          </div>
          <div className={styles.missionStat}>
            <div className={styles.missionStatTop}>
              <span className={styles.missionStatLabel}>Plages horaires</span>
              {renderMissionStatBadge(availabilityStep, missionRangesCount > 0)}
            </div>
            <strong>{missionRangesCount}</strong>
          </div>
          <div className={styles.missionStat}>
            <div className={styles.missionStatTop}>
              <span className={styles.missionStatLabel}>Zones couvertes</span>
              {renderMissionStatBadge(zoneStep, missionZonesCount > 0)}
            </div>
            <strong>{missionZonesCount}</strong>
          </div>
        </div>
      </div>

      {showCompletionCard ? (
        <CompletionStatusCard
          title="Missions"
          description="Vérifiez en un coup d’œil ce qu'il reste à configurer pour recevoir des demandes qualifiées."
          percentage={missionProgressPercent}
          completedCount={missionProgressDoneCount}
          totalCount={missionProgressTotal}
          missingItems={missionProgressSteps.filter((step) => !step.done).map((step) => step.label)}
          actionLabel="Afficher les points à compléter"
          onAction={onTogglePendingSteps}
        />
      ) : null}

      <div className={styles.missionsColumns}>
        <div className={styles.missionsPrimary}>{children}</div>
        {showSecondaryContent && secondaryContent ? (
          <aside className={styles.missionsSecondary}>{secondaryContent}</aside>
        ) : null}
      </div>
    </div>
  );
}
