import React from "react";
import {
    FiZap,
    FiStar,
    FiAward,
} from "react-icons/fi";
import { FaCrown } from "react-icons/fa";
import styles from "./MembershipBadge.module.scss";

interface MembershipBadgeProps {
    createdAt: string;
}

const getMembershipLevel = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const years =
        now.getFullYear() -
        created.getFullYear();

    if (years < 1) {
        return {
            label: "Nouveau membre",
            description: "Nouveau sur PlanetLS",
            icon: <FiZap />,
            level: "new",
        };
    }

    if (years < 3) {
        return {
            label: `Membre depuis ${years} an${years > 1 ? "s" : ""}`,
            description: "Membre actif",
            icon: <FiStar />,
            level: "active",
        };
    }

    if (years < 5) {
        return {
            label: "Membre confirmé",
            description: "Expert PlanetLS",
            icon: <FiAward />,
            level: "confirmed",
        };
    }

    return {
        label: "Membre premium",
        description: "Référence PlanetLS",
        icon: <FaCrown />,
        level: "premium",
    };
};

const MembershipBadge: React.FC<MembershipBadgeProps> = ({ createdAt }) => {
    const badge = getMembershipLevel(createdAt);

    return (
        <div className={`${styles.badge} ${styles[badge.level]}`}>
            <span className={styles.icon}>{badge.icon}</span>
            <div className={styles.text}>
                <span className={styles.label}>{badge.label}</span>
                <span className={styles.description}>{badge.description}</span>
            </div>
        </div>
    );
};

export default MembershipBadge;
