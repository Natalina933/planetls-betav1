import React from "react";
import { FiShield, FiStar } from "react-icons/fi";
import styles from "./ProfileKeyFacts.module.scss";

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type ExperienceLevel = "debutant" | "intermediaire" | "experimente";

interface ProfileKeyFactsProps {
    companyName?: string | null;
    createdAt?: string | null;

    /** Ancienneté réelle en mois (prioritaire si fournie) */
    experienceMonths?: number | null;

    /** Niveau d’expérience déclaré */
    experienceLevel?: ExperienceLevel | null;

    isInsured: boolean;
    certificationsCount: number;
}

/* -------------------------------------------------------------------------- */
/*                         CONFIGURATION MÉTIER                                */
/* -------------------------------------------------------------------------- */

interface ExperienceMeta {
    label: string;
    subtitle: string;
    rangeLabel: string;
    icon: string;
    className: string;
}

const EXPERIENCE_CONFIG: Record<ExperienceLevel, ExperienceMeta> = {
    debutant: {
        label: "Débutant",
        subtitle: "En phase de lancement",
        rangeLabel: "Moins de 6 mois d’activité",
        icon: "🌱",
        className: styles.levelBeginner,
    },
    intermediaire: {
        label: "Intermédiaire",
        subtitle: "Activité confirmée",
        rangeLabel: "6 mois à 3 ans d’expérience",
        icon: "🌿",
        className: styles.levelIntermediate,
    },
    experimente: {
        label: "Expérimenté",
        subtitle: "Expertise éprouvée",
        rangeLabel: "Plus de 3 ans d’expérience",
        icon: "🌳",
        className: styles.levelExpert,
    },
};

/* -------------------------------------------------------------------------- */
/*                                UTILITAIRES                                  */
/* -------------------------------------------------------------------------- */

const getMembershipYears = (createdAt?: string | null): number | null => {
    if (!createdAt) return null;

    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) return null;

    const now = new Date();
    let years = now.getFullYear() - created.getFullYear();

    const hasHadAnniversary =
        now.getMonth() > created.getMonth() ||
        (now.getMonth() === created.getMonth() &&
            now.getDate() >= created.getDate());

    if (!hasHadAnniversary) years -= 1;

    return years > 0 ? years : null;
};

// const formatExperienceDuration = (
//   months?: number | null
// ): string | null => {
//   if (!months || months <= 0) return null;

//   if (months < 12) {
//     return `${months} mois d’activité`;
//   }

//   const years = Math.floor(months / 12);
//   const remainingMonths = months % 12;

//   if (remainingMonths === 0) {
//     return `${years} an${years > 1 ? "s" : ""} d’activité`;
//   }

//   return `${years} an${years > 1 ? "s" : ""} et ${remainingMonths} mois`;
// };

/* -------------------------------------------------------------------------- */
/*                                COMPONENT                                   */
/* -------------------------------------------------------------------------- */

const ProfileKeyFacts: React.FC<ProfileKeyFactsProps> = ({
    companyName,
    createdAt,
    //   experienceMonths,
    experienceLevel,
    isInsured,
    certificationsCount,
}) => {
    const membershipYears = getMembershipYears(createdAt);
    //   const experienceDurationLabel =
    //     formatExperienceDuration(experienceMonths);

    const experienceMeta = experienceLevel
        ? EXPERIENCE_CONFIG[experienceLevel]
        : null;

    return (
        <section className={styles.wrapper}>
            {/* ============================= HEADER ============================== */}
            <header className={styles.header}>
                <div className={styles.company}>
                    {companyName?.trim() || "Profil professionnel"}
                </div>

                {membershipYears && (
                    <span className={styles.membership}>
                        Membre PlanetLS depuis {membershipYears} an
                        {membershipYears > 1 ? "s" : ""}
                    </span>
                )}
            </header>

            {/* ======================= EXPÉRIENCE (CENTRAL) ====================== */}
            {experienceMeta && (
                <div
                    className={`${styles.experienceBlock} ${experienceMeta.className}`}
                >
                    <div className={styles.experienceIcon}>
                        {experienceMeta.icon}
                    </div>

                    <div className={styles.experienceContent}>
                        <h3 className={styles.experienceTitle}>
                            {experienceMeta.label}
                        </h3>

                        <p className={styles.experienceSubtitle}>
                            {experienceMeta.subtitle}
                        </p>

                        <p className={styles.experienceRange}>
                            {experienceMeta.rangeLabel}
                        </p>

                        {/* {experienceDurationLabel && (
              <p className={styles.experienceDuration}>
                <FiTrendingUp />
                {experienceDurationLabel}
              </p>
            )} */}
                    </div>
                </div>
            )}

            {/* ===================== INDICATEURS DE CONFIANCE ===================== */}
            <div className={styles.trustRow}>
                {isInsured && (
                    <div className={styles.trustItem}>
                        <FiShield />
                        <span>Assurance RC Pro vérifiée</span>
                    </div>
                )}

                {certificationsCount > 0 && (
                    <div className={styles.trustItem}>
                        <FiStar />
                        <span>
                            {certificationsCount} certification
                            {certificationsCount > 1 ? "s" : ""} professionnelle
                        </span>
                    </div>
                )}
            </div>
        </section>
    );
};

export default ProfileKeyFacts;
