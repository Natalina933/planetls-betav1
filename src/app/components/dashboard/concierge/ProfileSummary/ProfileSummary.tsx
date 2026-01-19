// src/app/components/dashboard/concierge/ProfileSummary/ProfileSummary.tsx
import React from "react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiEdit3,
} from "react-icons/fi";

import ProfileKeyFacts from "@/app/components/ui/ProfileKeyFacts/ProfileKeyFacts";

import styles from "./ProfileSummary.module.scss";

type ExperienceLevel = "debutant" | "intermediaire" | "experimente";

interface ProfileData {
  company_name?: string | null;
  created_at: string;

  experience_level?: ExperienceLevel | null;
  years_experience?: number | null;

  certifications?: string | null;
  insurance_number?: string | null;

  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;

  siren?: string | null;
  siret?: string | null;
  street_address?: string | null;
  postal_code?: string | null;
  city?: string | null;
}

interface ProfileSummaryProps {
  profile: ProfileData | null;
  onEdit?: () => void;
}

const REQUIRED_FIELDS: Record<keyof ProfileData, string> = {
  first_name: "Prénom",
  last_name: "Nom",
  email: "Email",
  phone: "Téléphone",
  company_name: "Nom commercial",
  siren: "SIREN",
  siret: "SIRET",
  street_address: "Adresse",
  postal_code: "Code postal",
  city: "Ville",
  experience_level: "Niveau d'expérience",
  created_at: "",
  years_experience: "",
  certifications: "",
  insurance_number: "",
};

const ProfileSummary: React.FC<ProfileSummaryProps> = ({ profile, onEdit }) => {
  /* -----------------------------
     États simples
  ----------------------------- */
  if (!profile) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Chargement des informations…</p>
        </div>
      </div>
    );
  }

  /* -----------------------------
     Complétude du profil
  ----------------------------- */
  const missingFields = Object.entries(REQUIRED_FIELDS)
    .filter(([key, label]) => {
      if (!label) return false;
      const value = profile[key as keyof ProfileData];
      return !value || String(value).trim() === "";
    })
    .map(([, label]) => label);

  const totalRequired = Object.values(REQUIRED_FIELDS).filter(Boolean).length;
  const filledCount = totalRequired - missingFields.length;

  const completionPercentage = Math.round(
    (filledCount / totalRequired) * 100
  );

  const isComplete = completionPercentage === 100;

  /* -----------------------------
     Statut visuel de complétion
  ----------------------------- */
  const completionStatus =
    completionPercentage === 100
      ? {
        color: "#10B981",
        bgColor: "#D1FAE5",
        icon: <FiCheckCircle />,
        title: "Profil complet",
        message: "Votre profil est visible et attractif pour les clients",
      }
      : completionPercentage >= 70
        ? {
          color: "#F59E0B",
          bgColor: "#FEF3C7",
          icon: <FiAlertCircle />,
          title: "Profil presque prêt",
          message: "Encore quelques champs pour maximiser votre visibilité",
        }
        : {
          color: "#EF4444",
          bgColor: "#FEE2E2",
          icon: <FiAlertCircle />,
          title: "Profil incomplet",
          message: "Complétez votre profil pour apparaître dans les recherches",
        };

  /* -----------------------------
     Rendu
  ----------------------------- */
  return (
    <div className={styles.container}>
      {/* =============================
          Carte identité pro (focus expérience)
      ============================= */}
      <ProfileKeyFacts
        companyName={profile.company_name}
        createdAt={profile.created_at}
        experienceMonths={
          profile.years_experience
            ? profile.years_experience * 12
            : null
        }
        experienceLevel={profile.experience_level}
        isInsured={Boolean(profile.insurance_number)}
        certificationsCount={
          profile.certifications?.split(",").filter(Boolean).length ?? 0
        }
      />

      {/* =============================
          Carte complétude profil
      ============================= */}
      <div
        className={styles.completionCard}
        style={{ borderColor: completionStatus.color }}
      >
        <div className={styles.completionHeader}>
          <div className={styles.completionTitleRow}>
            <div
              className={styles.completionIcon}
              style={{
                // backgroundColor: completionStatus.bgColor,
                color: completionStatus.color,
              }}
            >
              {completionStatus.icon}
            </div>

            <div className={styles.completionInfo}>
              <h4 className={styles.completionTitle}>
                {completionStatus.title}
              </h4>
              <p className={styles.completionMessage}>
                {completionStatus.message}
              </p>
            </div>
          </div>

          <div
            className={styles.completionPercentage}
            style={{ color: completionStatus.color }}
          >
            <span className={styles.percentageNumber}>
              {completionPercentage}
            </span>
            <span className={styles.percentageSymbol}>%</span>
          </div>
        </div>

        {/* Barre de progression */}
        <div className={styles.progressBarWrapper}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${completionPercentage}%`,
                backgroundColor: completionStatus.color,
              }}
            >
              <span className={styles.progressGlow} />
            </div>
          </div>
          <div className={styles.progressLabel}>
            {filledCount} / {totalRequired} champs renseignés
          </div>
        </div>

        {/* Champs manquants */}
        {!isComplete && missingFields.length > 0 && (
          <div className={styles.missingFieldsSection}>
            <div className={styles.missingFieldsHeader}>
              <FiTrendingUp />
              <span>À compléter ({missingFields.length})</span>
            </div>

            <div className={styles.missingFieldsList}>
              {missingFields.slice(0, 5).map((field) => (
                <span key={field} className={styles.missingFieldTag}>
                  {field}
                </span>
              ))}
              {missingFields.length > 5 && (
                <span className={styles.missingFieldTag}>
                  +{missingFields.length - 5}
                </span>
              )}
            </div>

            {onEdit && (
              <button
                onClick={onEdit}
                className={styles.completeProfileButton}
              >
                <FiEdit3 />
                Compléter mon profil
              </button>
            )}
          </div>
        )}

        {isComplete && (
          <div className={styles.successMessage}>
            <FiCheckCircle />
            <span>
              Félicitations ! Votre profil est prêt à convertir des clients.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSummary;
