// src/app/components/dashboard/SocialLinksManager/SocialLinksManager.tsx
"use client";

import React from "react";
import {
  FiGlobe,
  FiLinkedin,
  FiInstagram,
  FiFacebook,
  FiExternalLink,
  FiInfo,
} from "react-icons/fi";
import styles from "./SocialLinksManager.module.scss";
import InputWithValidation from "@/app/components/ui/InputWithValidation/InputWithValidation";

interface SocialLinksManagerProps {
  website?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  isEditing: boolean;
  onEdit?: () => void;
  onChange: (field: string, value: string) => void;
  errors?: {
    website?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
  };
}

interface SocialLink {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  placeholder: string;
  value?: string | null;
  gradient?: string;
}

const SocialLinksManager: React.FC<SocialLinksManagerProps> = ({
  website,
  linkedin,
  instagram,
  facebook,
  isEditing,
  onEdit,
  onChange,
  errors = {},
}) => {
  const socialLinks: SocialLink[] = [
    {
      id: "website",
      label: "Site web",
      icon: <FiGlobe size={20} />,
      color: "#667eea",
      placeholder: "https://mon-site.fr",
      value: website,
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      icon: <FiLinkedin size={20} />,
      color: "#0077B5",
      placeholder: "https://linkedin.com/in/mon-profil",
      value: linkedin,
    },
    {
      id: "instagram",
      label: "Instagram",
      icon: <FiInstagram size={20} />,
      color: "#E4405F",
      gradient: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
      placeholder: "https://instagram.com/ma_conciergerie",
      value: instagram,
    },
    {
      id: "facebook",
      label: "Facebook",
      icon: <FiFacebook size={20} />,
      color: "#1877F2",
      placeholder: "https://facebook.com/ma-conciergerie",
      value: facebook,
    },
  ];

  const hasAnyLink = socialLinks.some((link) => link.value);

  const formatUrl = (url: string) => {
    return url.startsWith("http") ? url : `https://${url}`;
  };

  // Mode lecture : Affichage des liens
  if (!isEditing) {
    return (
      <div className={styles.container}>
        {hasAnyLink ? (
          <div className={styles.linksGrid}>
            {socialLinks.map((link) =>
              link.value ? (
                <a
                  key={link.id}
                  href={formatUrl(link.value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkCard}
                >
                  <div
                    className={styles.linkIcon}
                    style={{
                      background: link.gradient || link.color,
                    }}
                  >
                    {link.icon}
                  </div>
                  <div className={styles.linkContent}>
                    <span className={styles.linkLabel}>{link.label}</span>
                    <span className={styles.linkUrl}>
                      {link.value.replace(/^https?:\/\/(www\.)?/, "")}
                    </span>
                  </div>
                  <FiExternalLink size={16} className={styles.externalIcon} />
                </a>
              ) : null
            )}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FiGlobe size={48} />
            </div>
            <h4>Aucun réseau social configuré</h4>
            <p>Ajoutez vos liens pour permettre aux clients de vous suivre</p>
            {onEdit && (
              <button onClick={onEdit} className={styles.emptyButton}>
                <FiGlobe size={18} />
                Ajouter mes liens
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Mode édition : Formulaire
  return (
    <div className={styles.container}>
      <div className={styles.formGrid}>
        {socialLinks.map((link) => (
          <div key={link.id} className={styles.fieldGroup}>
            <div
              className={styles.fieldIcon}
              style={{
                background: link.gradient || link.color,
                color: "white",
              }}
            >
              {link.icon}
            </div>
            <div className={styles.fieldInput}>
              <label htmlFor={link.id} className={styles.fieldLabel}>
                {link.label}
              </label>
              <InputWithValidation
                id={link.id}
                name={link.id}
                type="url"
                value={link.value || ""}
                onChange={(e) => onChange(link.id, e.target.value)}
                placeholder={link.placeholder}
                error={errors[link.id as keyof typeof errors] || ""}
                isValid={
                  !errors[link.id as keyof typeof errors] && !!link.value
                }
              />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.hint}>
        <FiInfo size={16} />
        <span>
          Ces liens apparaîtront sur votre profil public et permettront aux
          clients de vous suivre sur vos réseaux sociaux.
        </span>
      </div>
    </div>
  );
};

export default SocialLinksManager;