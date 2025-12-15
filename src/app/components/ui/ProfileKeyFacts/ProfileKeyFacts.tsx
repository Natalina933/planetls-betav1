import React from "react";
import {
    FiAward,
    FiShield,
    FiStar
} from "react-icons/fi";
import styles from "./ProfileKeyFacts.module.scss";

interface ProfileKeyFactsProps {
    companyName?: string | null;
    createdAt?: string | null;
    yearsExperience?: number | null;
    isInsured: boolean;
    certificationsCount: number;
}

/**
 * Retourne le nombre d'années d'ancienneté
 */
const getMembershipYears = (createdAt?: string | null): number => {
    if (!createdAt) return 0;

    const created = new Date(createdAt);
    const now = new Date();

    let years = now.getFullYear() - created.getFullYear();

    const hasHadAnniversary =
        now.getMonth() > created.getMonth() ||
        (now.getMonth() === created.getMonth() &&
            now.getDate() >= created.getDate());

    if (!hasHadAnniversary) {
        years -= 1;
    }

    return Math.max(years, 0);
};

/**
 * Détermine le badge selon l'ancienneté
 */
const getMembershipBadge = (years: number) => {
    if (years < 1) {
        return {
            icon: "🌱",
            label: "Nouveau sur PlanetLS",
            className: styles.newMember,
        };
    }

    if (years < 3) {
        return {
            icon: "⭐",
            label: `Membre depuis ${years} an${years > 1 ? "s" : ""}`,
            className: styles.activeMember,
        };
    }

    if (years < 5) {
        return {
            icon: "🏅",
            label: "Expert PlanetLS",
            className: styles.confirmedMember,
        };
    }

    return {
        icon: "👑",
        label: "Référence PlanetLS",
        className: styles.premiumMember,
    };
};

const ProfileKeyFacts: React.FC<ProfileKeyFactsProps> = ({
    companyName,
    createdAt,
    yearsExperience,
    isInsured,
    certificationsCount,
}) => {
    const memberYears = getMembershipYears(createdAt);
    const badge = getMembershipBadge(memberYears);

    return (
        <section className={styles.wrapper}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.company}>
                    {companyName || "Profil professionnel"}
                </div>

                {/* Badge ancienneté PlanetLS */}
                <span className={`${styles.memberBadge} ${badge.className}`}>
                    <span className={styles.badgeIcon}>{badge.icon}</span>
                    {badge.label}
                </span>
            </div>

            {/* Indicateurs de confiance */}
            <div className={styles.trustRow}>
                {yearsExperience && yearsExperience > 0 && (
                    <div className={styles.trustItem}>
                        <FiAward />
                        <span>{yearsExperience} ans d’expérience</span>
                    </div>
                )}

                {isInsured && (
                    <div className={styles.trustItem}>
                        <FiShield />
                        <span>Assurance RC Pro</span>
                    </div>
                )}

                {certificationsCount > 0 && (
                    <div className={styles.trustItem}>
                        <FiStar />
                        <span>
                            {certificationsCount} certification
                            {certificationsCount > 1 ? "s" : ""}
                        </span>
                    </div>
                )}
            </div>
        </section>
    );
};

export default ProfileKeyFacts;
