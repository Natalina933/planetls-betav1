"use client";

import React from "react";
import { CheckCircle, ChevronRight } from "lucide-react";
import { getCertificationConfig } from "@/config/certificationConfig";
import { CertificationLevel } from "@/types/certification";
import CertificationBadge from "../CertificationBadge/CertificationBadge";
import styles from "./CertificationCard.module.scss";

export interface CertificationCardProps {
    level: CertificationLevel;
    isCurrentLevel?: boolean;
    isUnlocked?: boolean;
    showBenefits?: boolean;
    onUpgrade?: () => void;
    className?: string;
}

/**
 * Carte de certification détaillée
 * Affiche le niveau, la description, les bénéfices et l'action
 */
export default function CertificationCard({
    level,
    isCurrentLevel = false,
    isUnlocked = false,
    showBenefits = true,
    onUpgrade,
    className = "",
}: CertificationCardProps) {
    const config = getCertificationConfig(level);
    const Icon = config.icon;

    // Ne pas afficher "none"
    if (level === "none") return null;

    const canUpgrade = !isCurrentLevel && !isUnlocked && onUpgrade;

    return (
        <div
            className={`
        ${styles.card}
        ${styles[`card-${level}`]}
        ${isCurrentLevel ? styles.current : ""}
        ${isUnlocked ? styles.unlocked : ""}
        ${canUpgrade ? styles.upgradable : ""}
        ${className}
      `}
            style={{
                "--card-color": config.color,
                "--card-bg": config.bgColor,
                "--card-border": config.borderColor,
            } as React.CSSProperties}
        >
            {/* Header avec badge et statut */}
            <div className={styles.header}>
                <div className={styles.iconWrapper}>
                    <Icon size={32} className={styles.icon} />
                    {isCurrentLevel && (
                        <span className={styles.currentBadge}>
                            <CheckCircle size={16} />
                            Actuel
                        </span>
                    )}
                    {isUnlocked && !isCurrentLevel && (
                        <span className={styles.unlockedBadge}>
                            <CheckCircle size={16} />
                            Débloqué
                        </span>
                    )}
                </div>

                <div className={styles.titleBlock}>
                    <h3 className={styles.title}>{config.label}</h3>
                    <p className={styles.description}>{config.description}</p>
                </div>

                <CertificationBadge
                    level={level}
                    size="sm"
                    showLabel={false}
                    showTooltip={false}
                    animated={false}
                />
            </div>

            {/* Réduction commission si applicable */}
            {config.commission_discount > 0 && (
                <div className={styles.discount}>
                    <span className={styles.discountIcon}>🎁</span>
                    <span className={styles.discountText}>
                        <strong>-{config.commission_discount}%</strong> de commission
                    </span>
                </div>
            )}

            {/* Liste des bénéfices */}
            {showBenefits && config.benefits.length > 0 && (
                <div className={styles.benefits}>
                    <h4 className={styles.benefitsTitle}>Avantages :</h4>
                    <ul className={styles.benefitsList}>
                        {config.benefits.map((benefit, index) => (
                            <li key={index} className={styles.benefitItem}>
                                <CheckCircle size={16} className={styles.benefitIcon} />
                                <span>{benefit}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Action button */}
            {canUpgrade && (
                <button
                    type="button"
                    onClick={onUpgrade}
                    className={styles.upgradeButton}
                >
                    <span>Obtenir cette certification</span>
                    <ChevronRight size={18} />
                </button>
            )}

            {isCurrentLevel && (
                <div className={styles.currentLabel}>
                    Votre niveau actuel
                </div>
            )}
        </div>
    );
}