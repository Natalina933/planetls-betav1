import React from "react";
import {
    FiCheckCircle,
    FiAlertCircle,
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
        // Champs nécessaires pour vérifier la complétude
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

    // Vérification de la complétude des informations de l'onglet "Fiche"
    const requiredFields = {
        // Informations personnelles
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        
        // Informations entreprise
        company_name: profile.company_name,
        siren: profile.siren,
        siret: profile.siret,
        
        // Adresse professionnelle
        street_address: profile.street_address,
        postal_code: profile.postal_code,
        city: profile.city,
    };

    const filledFieldsCount = Object.values(requiredFields).filter(
        value => value !== null && value !== undefined && String(value).trim() !== ""
    ).length;
    
    const totalFieldsCount = Object.keys(requiredFields).length;
    const isComplete = filledFieldsCount === totalFieldsCount;
    const completionPercentage = Math.round((filledFieldsCount / totalFieldsCount) * 100);

    // Calculs pour ProfileKeyFacts
    const certificationsCount = profile.certifications?.trim()
        ? profile.certifications.split(",").filter(Boolean).length
        : 0;

    const isInsured = Boolean(profile.insurance_number?.trim());

    return (
        <div className={styles.container}>
            {/* Composant ProfileKeyFacts : Nom société + Badge + Indicateurs de confiance */}
            <ProfileKeyFacts
                companyName={profile.company_name}
                createdAt={profile.created_at}
                yearsExperience={profile.years_experience}
                isInsured={isInsured}
                certificationsCount={certificationsCount}
            />

            {/* Statut de complétude du profil */}
            <div className={styles.completionStatus}>
                <div className={styles.completionHeader}>
                    {isComplete ? (
                        <FiCheckCircle className={styles.iconComplete} />
                    ) : (
                        <FiAlertCircle className={styles.iconIncomplete} />
                    )}
                    <span className={styles.completionTitle}>
                        {isComplete 
                            ? "Profil complet" 
                            : "Profil incomplet"}
                    </span>
                </div>
                
                <div className={styles.progressBar}>
                    <div 
                        className={styles.progressFill}
                        style={{ 
                            width: `${completionPercentage}%`,
                            backgroundColor: isComplete ? '#10B981' : '#F59E0B'
                        }}
                    />
                </div>
                
                <div className={styles.completionText}>
                    {filledFieldsCount} / {totalFieldsCount} champs renseignés ({completionPercentage}%)
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