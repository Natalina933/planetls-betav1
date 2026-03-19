// src/app/components/ui/ProfileExperienceBadge/ProfileExperienceBadge.tsx
import React from "react";
import { FiAward, FiTrendingUp } from "react-icons/fi";
import styles from "./ProfileExperienceBadge.module.scss";

type ExperienceLevel = "debutant" | "intermediaire" | "experimente";

interface ProfileExperienceBadgeProps {
    experienceLevel: ExperienceLevel | null;
    yearsExperience?: number | null;
    // Ces champs pourront évoluer quand tu auras des stats PlanetLS
    missionsCount?: number | null;
    averageRating?: number | null;
}

const getExperienceConfig = (level: ExperienceLevel | null) => {
    switch (level) {
        case "debutant":
            return {
                label: "Débutant",
                description: "Vous démarrez votre activité de conciergerie.",
                className: styles.levelBeginner,
                icon: "🌱",
            };
        case "intermediaire":
            return {
                label: "Petite expérience",
                description: "Vous avez déjà quelques missions à votre actif.",
                className: styles.levelIntermediate,
                icon: "🧭",
            };
        case "experimente":
            return {
                label: "Expérimenté",
                description: "Vous disposez d’une expérience solide et régulière.",
                className: styles.levelExpert,
                icon: "🏆",
            };
        default:
            return {
                label: "Niveau non renseigné",
                description: "Renseignez votre niveau pour inspirer confiance.",
                className: styles.levelUnknown,
                icon: "❓",
            };
    }
};

const ProfileExperienceBadge: React.FC<ProfileExperienceBadgeProps> = ({
    experienceLevel,
    yearsExperience,
    missionsCount,
    averageRating,
}) => {
    const config = getExperienceConfig(experienceLevel);
    const hasYearsExperience =
        typeof yearsExperience === "number" && yearsExperience > 0;

    return (
        <section className={styles.wrapper}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <FiAward className={styles.titleIcon} />
                    <span>Expérience professionnelle</span>
                </div>

                <span className={`${styles.levelBadge} ${config.className}`}>
                    <span className={styles.levelIcon}>{config.icon}</span>
                    {config.label}
                </span>
            </div>

            <p className={styles.description}>{config.description}</p>

            <div className={styles.statsRow}>
                {hasYearsExperience && (
                    <div className={styles.statItem}>
                        <FiTrendingUp />
                        <span>
                            {yearsExperience} an{yearsExperience > 1 ? "s" : ""} d’expérience
                        </span>
                    </div>
                )}

                {typeof missionsCount === "number" && missionsCount > 0 && (
                    <div className={styles.statItem}>
                        <FiTrendingUp />
                        <span>
                            {missionsCount} mission
                            {missionsCount > 1 ? "s" : ""} sur PlanetLS
                        </span>
                    </div>
                )}

                {typeof averageRating === "number" && averageRating > 0 && (
                    <div className={styles.statItem}>
                        <FiTrendingUp />
                        <span>Note moyenne : {averageRating.toFixed(1)} / 5</span>
                    </div>
                )}
            </div>
        </section>
    );
};

export default ProfileExperienceBadge;
