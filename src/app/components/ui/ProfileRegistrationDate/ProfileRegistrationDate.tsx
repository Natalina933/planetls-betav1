import React from "react";
import { FiCalendar } from "react-icons/fi";
import styles from "./ProfileRegistrationDate.module.scss";

interface ProfileRegistrationDateProps {
    createdAt: string;
}

const formatDateFR = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
};

const ProfileRegistrationDate: React.FC<ProfileRegistrationDateProps> = ({
    createdAt,
}) => {
    if (!createdAt) return null;

    return (
        <div className={styles.registration}>
            <FiCalendar className={styles.icon} />
            <span className={styles.label}>Inscrit sur PlanetLS</span>
            <span className={styles.value}>
                {formatDateFR(createdAt)}
            </span>
        </div>
    );
};

export default ProfileRegistrationDate;
