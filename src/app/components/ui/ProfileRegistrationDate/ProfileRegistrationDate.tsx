import React from "react";
import { FiCalendar } from "react-icons/fi";
import styles from "./ProfileRegistrationDate.module.scss";

interface ProfileRegistrationDateProps {
    createdAt: string;
}

/**
 * Formate une date ISO en format français lisible
 */
const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    
    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
    };
    
    return date.toLocaleDateString("fr-FR", options);
};

/**
 * Calcule la durée depuis l'inscription
 */
const getMembershipDuration = (createdAt: string): string => {
    const created = new Date(createdAt);
    const now = new Date();
    
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
        return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
    }
    
    if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `Il y a ${months} mois`;
    }
    
    const years = Math.floor(diffDays / 365);
    return `Il y a ${years} an${years > 1 ? "s" : ""}`;
};

const ProfileRegistrationDate: React.FC<ProfileRegistrationDateProps> = ({ createdAt }) => {
    const formattedDate = formatDate(createdAt);
    const duration = getMembershipDuration(createdAt);

    return (
        <div className={styles.wrapper}>
            <div className={styles.registrationDate}>
                <FiCalendar className={styles.icon} />
                <span className={styles.label}>Membre depuis</span>
                <span className={styles.date}>{formattedDate}</span>
                <span className={styles.label}>{duration}</span>
            </div>
        </div>
    );
};

export default ProfileRegistrationDate;