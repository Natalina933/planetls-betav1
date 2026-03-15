import React from "react";
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
}

const ProfileSummary: React.FC<ProfileSummaryProps> = ({ profile }) => {
  if (!profile) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Chargement des informations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ProfileKeyFacts
        companyName={profile.company_name}
        createdAt={profile.created_at}
        experienceMonths={profile.years_experience ? profile.years_experience * 12 : null}
        experienceLevel={profile.experience_level}
        isInsured={Boolean(profile.insurance_number)}
        certificationsCount={profile.certifications?.split(",").filter(Boolean).length ?? 0}
      />
    </div>
  );
};

export default ProfileSummary;