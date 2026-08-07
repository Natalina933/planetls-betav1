"use client";

import React from "react";
import { FiGlobe, FiLinkedin, FiInstagram, FiFacebook } from "react-icons/fi";
import {
    getPublicProfileLinks,
    type PublicProfileLinkItem,
} from "@/features/public-concierges/publicProfileLinks";
import styles from "./SocialLinks.module.scss";

interface SocialLinksProps {
    website?: string | null;
    linkedin?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    onLinkClick?: (payload: { key: PublicProfileLinkItem["key"]; href: string }) => void;
}

const SocialLinks: React.FC<SocialLinksProps> = ({
    website,
    linkedin,
    instagram,
    facebook,
    onLinkClick,
}) => {
    const iconByKey = {
        website: <FiGlobe />,
        linkedin: <FiLinkedin />,
        instagram: <FiInstagram />,
        facebook: <FiFacebook />,
    };
    const links = getPublicProfileLinks({
        website,
        linkedin,
        instagram,
        facebook,
    }).map((link) => ({
        ...link,
        icon: iconByKey[link.key],
    }));

    const hasAnyLink = links.length > 0;

    return (
        <div className={styles.wrapper}>
            <span className={styles.label}>Présence en ligne</span>

            {hasAnyLink ? (
                <div className={styles.chipsRow}>
                    {links.map((link) => (
                        <a
                            key={link.key}
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.chip}
                            onClick={() => onLinkClick?.({ key: link.key, href: link.href })}
                        >
                            <span className={styles.icon}>{link.icon}</span>
                            <span>{link.label}</span>
                        </a>
                    ))}
                </div>
            ) : (
                <p className={styles.empty}>
                    Ajoutez votre site, vos profils LinkedIn, Instagram ou Facebook pour
                    rassurer les propriétaires.
                </p>
            )}
        </div>
    );
};

export default SocialLinks;
