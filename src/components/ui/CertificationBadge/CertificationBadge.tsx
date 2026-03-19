// src/app/components/ui/CertificationBadge/CertificationBadge.tsx
"use client";

import React from "react";
import { getCertificationConfig } from "@/config/certificationConfig";
import { CertificationLevel } from "@/types/certification";
import styles from "./CertificationBadge.module.scss";

export interface CertificationBadgeProps {
    level: CertificationLevel;
    size?: "xs" | "sm" | "md" | "lg";
    showLabel?: boolean;
    showTooltip?: boolean;
    animated?: boolean;
    className?: string;
    onClick?: () => void;
}

/**
 * Badge de certification compact
 * Affiche l'icône et optionnellement le label du niveau de certification
 */
export default function CertificationBadge({
    level,
    size = "md",
    showLabel = true,
    showTooltip = true,
    animated = true,
    className = "",
    onClick,
}: CertificationBadgeProps) {
    // Ne rien afficher pour "none"
    if (level === "none") return null;

    const config = getCertificationConfig(level);
    const Icon = config.icon;

    const handleClick = (e: React.MouseEvent) => {
        if (onClick) {
            e.stopPropagation();
            onClick();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onClick();
        }
    };

    // Déterminer l'élément HTML approprié selon l'interaction
    const Component = onClick ? "button" : "div";

    return (
        <Component
            className={`
        ${styles.badge} 
        ${styles[`badge-${size}`]} 
        ${styles[`badge-${level}`]}
        ${animated ? styles.animated : ""}
        ${onClick ? styles.clickable : ""}
        ${className}
      `}
            style={{
                "--badge-color": config.color,
                "--badge-bg": config.bgColor,
                "--badge-border": config.borderColor,
            } as React.CSSProperties}
            onClick={handleClick}
            onKeyPress={onClick ? handleKeyPress : undefined}
            type={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            aria-label={`Certification ${config.label}`}
            title={showTooltip ? config.description : undefined}
        >
            <span className={styles.icon} aria-hidden="true">
                <Icon size={size === "xs" ? 14 : size === "sm" ? 16 : size === "md" ? 20 : 24} />
            </span>

            {showLabel && (
                <span className={styles.label}>
                    {config.label}
                </span>
            )}

            {animated && level === "premium" && (
                <span className={styles.shimmer} aria-hidden="true" />
            )}

            {animated && level === "elite" && (
                <span className={styles.glow} aria-hidden="true" />
            )}
        </Component>
    );
}