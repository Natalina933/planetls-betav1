import React from "react";
import { FiAward, FiShield, FiStar } from "react-icons/fi";
import styles from "./ProfileKeyFacts.module.scss";

interface ProfileKeyFactsProps {
    companyName?: string | null;
    createdAt?: string | null;
    yearsExperience?: number | null;
    experienceLevel?: "debutant" | "intermediaire" | "experimente" | null;
    isInsured: boolean;
    certificationsCount: number;
}

type ExperienceLevel = "debutant" | "intermediaire" | "experimente";

const getExperienceLabel = (level?: ExperienceLevel | null): string | null => {
    switch (level) {
        case "debutant":
            return "Débutant";
        case "intermediaire":
            return "Petite expérience";
        case "experimente":
            return "Expérimenté";
        default:
            return null;
    }
};

const getMembershipYears = (createdAt?: string | null): number => {
    if (!createdAt) return 0;

    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) return 0;

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
    experienceLevel,
    isInsured,
    certificationsCount,
}) => {
    const memberYears = getMembershipYears(createdAt);
    const badge = getMembershipBadge(memberYears);
    const experienceLabel = getExperienceLabel(experienceLevel);

    const hasYearsExperience =
        typeof yearsExperience === "number" && yearsExperience > 0;

    return (
        <section className={styles.wrapper}>
            <div className={styles.header}>
                <div className={styles.company}>
                    {companyName?.trim() || "Statut PlanetLS"}
                </div>

                <span className={`${styles.memberBadge} ${badge.className}`}>
                    <span className={styles.badgeIcon}>{badge.icon}</span>
                    {badge.label}
                </span>
            </div>

            {/* Indicateurs de confiance : expérience pro, assurance, certifications */}
            <div className={styles.trustRow}>
                {/* Expérience professionnelle (niveau) */}
                {experienceLabel && (
                    <div className={styles.trustItem}>
                        <FiAward />
                        <span>Expérience professionnelle : {experienceLabel}</span>
                    </div>
                )}

                {/* Nombre d'années d’expérience (optionnel) */}
                {hasYearsExperience && (
                    <div className={styles.trustItem}>
                        <FiAward />
                        <span>
                            {yearsExperience} an{yearsExperience > 1 ? "s" : ""} d’expérience
                        </span>
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
