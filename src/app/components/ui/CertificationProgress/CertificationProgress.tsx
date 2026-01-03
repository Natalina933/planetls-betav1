"use client";

import React from "react";
import { ChevronRight, TrendingUp } from "lucide-react";
import { getCertificationConfig, getNextLevel } from "@/config/certificationConfig";
import { CertificationLevel, CriterionStatus } from "@/types/certification";
import CertificationBadge from "../CertificationBadge/CertificationBadge";
import styles from "./CertificationProgress.module.scss";

export interface CertificationProgressProps {
  currentLevel: CertificationLevel;
  progressPercentage: number;
  missingCriteria?: CriterionStatus[];
  onViewDetails?: () => void;
  className?: string;
}

/**
 * Barre de progression vers le prochain niveau de certification
 * Affiche la progression et les critères manquants
 */
export default function CertificationProgress({
  currentLevel,
  progressPercentage,
  missingCriteria = [],
  onViewDetails,
  className = "",
}: CertificationProgressProps) {
  const nextLevel = getNextLevel(currentLevel);
  
  // Si déjà au niveau max
  if (!nextLevel) {
    return (
      <div className={`${styles.container} ${styles.maxLevel} ${className}`}>
        <div className={styles.maxLevelContent}>
          <TrendingUp size={32} className={styles.maxIcon} />
          <div className={styles.maxText}>
            <h3>Niveau maximum atteint ! 🎉</h3>
            <p>Vous avez atteint le plus haut niveau de certification.</p>
          </div>
        </div>
      </div>
    );
  }

  const nextConfig = getCertificationConfig(nextLevel);
  const isComplete = progressPercentage >= 100;

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.levelBlock}>
          <CertificationBadge
            level={currentLevel}
            size="sm"
            showLabel={true}
            animated={false}
          />
          <span className={styles.arrow}>
            <ChevronRight size={20} />
          </span>
          <CertificationBadge
            level={nextLevel}
            size="sm"
            showLabel={true}
            animated={false}
          />
        </div>

        <div className={styles.percentage}>
          <span className={styles.percentageValue}>
            {Math.round(progressPercentage)}%
          </span>
          <span className={styles.percentageLabel}>complété</span>
        </div>
      </div>

      {/* Barre de progression */}
      <div className={styles.progressBar}>
        <div
          className={`${styles.progressFill} ${isComplete ? styles.complete : ""}`}
          style={{
            width: `${Math.min(progressPercentage, 100)}%`,
            backgroundColor: nextConfig.color,
          }}
        >
          {isComplete && (
            <span className={styles.completeIcon}>✓</span>
          )}
        </div>
      </div>

      {/* Message de progression */}
      {isComplete ? (
        <div className={styles.message}>
          <p className={styles.successMessage}>
            🎉 Félicitations ! Vous pouvez maintenant obtenir la certification <strong>{nextConfig.label}</strong>
          </p>
          {onViewDetails && (
            <button
              type="button"
              onClick={onViewDetails}
              className={styles.actionButton}
            >
              Demander la certification
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      ) : (
        <div className={styles.message}>
          <p className={styles.infoMessage}>
            Complétez encore <strong>{missingCriteria.length} critère{missingCriteria.length > 1 ? 's' : ''}</strong> pour débloquer <strong>{nextConfig.label}</strong>
          </p>
          {onViewDetails && (
            <button
              type="button"
              onClick={onViewDetails}
              className={styles.detailsButton}
            >
              Voir les critères
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}

      {/* Critères manquants (aperçu) */}
      {missingCriteria.length > 0 && !isComplete && (
        <div className={styles.criteria}>
          <h4 className={styles.criteriaTitle}>Critères manquants :</h4>
          <ul className={styles.criteriaList}>
            {missingCriteria.slice(0, 3).map((criterion, index) => (
              <li key={index} className={styles.criterionItem}>
                <span className={styles.criterionIcon}>○</span>
                <span className={styles.criterionLabel}>{criterion.label}</span>
                {criterion.progress_percentage !== undefined && (
                  <span className={styles.criterionProgress}>
                    {Math.round(criterion.progress_percentage)}%
                  </span>
                )}
              </li>
            ))}
            {missingCriteria.length > 3 && (
              <li className={styles.criterionMore}>
                +{missingCriteria.length - 3} autre{missingCriteria.length - 3 > 1 ? 's' : ''} critère{missingCriteria.length - 3 > 1 ? 's' : ''}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}