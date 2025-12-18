import React from "react";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import ProfileKeyFacts from "@/app/components/ui/ProfileKeyFacts/ProfileKeyFacts";
// import ProfileRegistrationDate from "@/app/components/ui/ProfileRegistrationDate/ProfileRegistrationDate";
import ProfileExperienceBadge from "@/app/components/ui/ProfileExperienceBadge/ProfileExperienceBadge";

import styles from "./ProfileSummary.module.scss";

interface ProfileSummaryProps {
  profile: {
    company_name?: string | null;
    years_experience?: number | null;
    experience_level?: "debutant" | "intermediaire" | "experimente" | null;
    option?: string | null;
    service_area?: string | null;
    created_at: string;
    hourly_rate?: number | null;
    certifications?: string | null;
    insurance_number?: string | null;
    emergency_service?: boolean | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    siren?: string | null;
    siret?: string | null;
    street_address?: string | null;
    postal_code?: string | null;
    city?: string | null;
  } | null;
}

const ProfileSummary: React.FC<ProfileSummaryProps> = ({ profile }) => {
  if (profile === null) {
    return (
      <div className={styles.container}>
        <p>Chargement des informations…</p>
      </div>
    );
  }

  if (!profile || Object.keys(profile).length === 0) {
    return (
      <div className={styles.container}>
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  const requiredFields = {
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: profile.email,
    phone: profile.phone,
    company_name: profile.company_name,
    siren: profile.siren,
    siret: profile.siret,
    street_address: profile.street_address,
    postal_code: profile.postal_code,
    city: profile.city,
    experience_level: profile.experience_level,
  };

  const filledFieldsCount = Object.values(requiredFields).filter(
    (value) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
  ).length;

  const totalFieldsCount = Object.keys(requiredFields).length;
  const isComplete = filledFieldsCount === totalFieldsCount;
  const completionPercentage = Math.round(
    (filledFieldsCount / totalFieldsCount) * 100
  );

  const certificationsCount = profile.certifications?.trim()
    ? profile.certifications.split(",").filter(Boolean).length
    : 0;

  const isInsured = Boolean(profile.insurance_number?.trim());

  return (
    <div className={styles.container}>
      {/* Profil professionnel + badge + expérience */}
      <ProfileKeyFacts
        companyName={profile.company_name}
        createdAt={profile.created_at}
        yearsExperience={profile.years_experience}
        experienceLevel={profile.experience_level ?? null}
        isInsured={isInsured}
        certificationsCount={certificationsCount}
      />

      {/* Membre depuis (date + durée) juste en dessous */}
      {/* <ProfileRegistrationDate createdAt={profile.created_at} /> */}
      {/* Badge d'expérience professionnelle (lié à la popup) */}
      <ProfileExperienceBadge
        experienceLevel={profile.experience_level ?? null}
        yearsExperience={profile.years_experience}
        // Tu pourras plus tard passer missionsCount / averageRating
        missionsCount={undefined}
        averageRating={undefined}
      />
      {/* Statut de complétude */}
      <div className={styles.completionStatus}>
        <div className={styles.completionHeader}>
          {isComplete ? (
            <FiCheckCircle className={styles.iconComplete} />
          ) : (
            <FiAlertCircle className={styles.iconIncomplete} />
          )}
          <span className={styles.completionTitle}>
            {isComplete ? "Profil complet" : "Profil incomplet"}
          </span>
        </div>

        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${completionPercentage}%`,
              backgroundColor: isComplete ? "#10B981" : "#F59E0B",
            }}
          />
        </div>

        <div className={styles.completionText}>
          {filledFieldsCount} / {totalFieldsCount} champs renseignés (
          {completionPercentage}%)
        </div>

        {!isComplete && (
          <div className={styles.missingFieldsHint}>
            Complétez votre profil pour améliorer votre visibilité
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSummary;
