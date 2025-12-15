import React from "react";
import {
    FiPackage,
    FiMapPin,
} from "react-icons/fi";
import ProfileKeyFacts from "@/app/components/ui/ProfileKeyFacts/ProfileKeyFacts";

import styles from "./ProfileSummary.module.scss";

interface ProfileSummaryProps {
    profile: {
        company_name?: string | null;
        years_experience?: number | null;
        option?: string | null;
        service_area?: string | null;
        created_at: string;
        hourly_rate?: number | null;
        certifications?: string | null;
        insurance_number?: string | null;
        emergency_service?: boolean | null;
    } | null;
}

interface SummaryCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subValue?: string;
    highlight?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
    icon,
    label,
    value,
    subValue,
    highlight = false
}) => (
    <div className={`${styles.card} ${highlight ? styles.cardHighlight : ""}`}>
        <div className={styles.cardIcon}>{icon}</div>
        <div className={styles.cardContent}>
            <span className={styles.cardLabel}>{label}</span>
            <span className={styles.cardValue}>{value}</span>
            {subValue && (
                <span className={styles.cardSubValue}>{subValue}</span>
            )}
        </div>
    </div>
);

const ProfileSummary: React.FC<ProfileSummaryProps> = ({ profile }) => {
    console.log("ProfileSummary → profile:", profile);

    /** Loading state */
    if (profile === null) {
        return (
            <div className={styles.container}>
                <p>Chargement des informations…</p>
            </div>
        );
    }

    /** No data state */
    if (!profile || Object.keys(profile).length === 0) {
        return (
            <div className={styles.container}>
                <p>Aucune donnée disponible</p>
            </div>
        );
    }

    /** Safe parsing */
    const servicesCount = profile.option?.trim()
        ? profile.option.split(",").filter(Boolean).length
        : 0;

    const certificationsCount = profile.certifications?.trim()
        ? profile.certifications.split(",").filter(Boolean).length
        : 0;

    const isInsured = Boolean(profile.insurance_number?.trim());

    return (
        <div className={styles.container}>
            <ProfileKeyFacts
                companyName={profile.company_name}
                createdAt={profile.created_at}
                yearsExperience={profile.years_experience}
                isInsured={isInsured}
                certificationsCount={certificationsCount}
            />

            <div className={styles.grid}>


                {/* Services */}
                <SummaryCard
                    icon={<FiPackage />}
                    label="Services"
                    value={servicesCount}
                    subValue={
                        servicesCount > 1
                            ? "services proposés"
                            : "service proposé"
                    }
                    highlight={servicesCount > 0}
                />

                {/* Zone */}
                <SummaryCard
                    icon={<FiMapPin />}
                    label="Zone"
                    value={profile.service_area?.trim() || "Non définie"}
                />



            </div>
        </div>
    );
};

export default ProfileSummary;
