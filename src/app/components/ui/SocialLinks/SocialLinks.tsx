"use client";

import React from "react";
import { FiGlobe, FiLinkedin, FiInstagram, FiFacebook } from "react-icons/fi";
import styles from "./SocialLinks.module.scss";

interface SocialLinksProps {
    website?: string | null;
    linkedin?: string | null;
    instagram?: string | null;
    facebook?: string | null;
}

const normalizeUrl = (url?: string | null) => {
    if (!url) return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
};

const SocialLinks: React.FC<SocialLinksProps> = ({
    website,
    linkedin,
    instagram,
    facebook,
}) => {
    const links = [
        {
            key: "website",
            label: "Site web",
            icon: <FiGlobe />,
            href: normalizeUrl(website),
        },
        {
            key: "linkedin",
            label: "LinkedIn",
            icon: <FiLinkedin />,
            href: normalizeUrl(linkedin),
        },
        {
            key: "instagram",
            label: "Instagram",
            icon: <FiInstagram />,
            href: normalizeUrl(instagram),
        },
        {
            key: "facebook",
            label: "Facebook",
            icon: <FiFacebook />,
            href: normalizeUrl(facebook),
        },
    ].filter((l) => !!l.href);

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
