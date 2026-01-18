"use client";

import React, { useState } from "react";
import { FaBell, FaBellSlash } from "react-icons/fa";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import styles from "./ProfilesDisplay.module.scss";

/* ----------------------------- */
/* Types                         */
/* ----------------------------- */

export interface Profile {
  id: number;
  name: string;
  type: string; // "proprietaire" | "concierge" | "artisan" | string
  photo?: string;
  services?: string[];
  available?: boolean;
  created_at?: string;
}

interface ProfilesDisplayProps {
  visibleProfiles: Profile[];
  onHover?: (id: number) => void;
  onLeave?: () => void;
}

/* ----------------------------- */
/* Mapping catégories            */
/* ----------------------------- */

const categoriesMap: Record<string, { label: string; description: string }> = {
  proprietaire: {
    label: "Propriétaire",
    description: "Propriétaires locaux, engagés et à l’écoute",
  },
  concierge: {
    label: "Conciergerie",
    description: "Concierges de quartier, service sur-mesure",
  },
  artisan: {
    label: "Artisan",
    description: "Artisans passionnés, savoir-faire local",
  },
};

/* ----------------------------- */
/* Composant                     */
/* ----------------------------- */

export default function ProfilesDisplay({
  visibleProfiles,
  onHover,
  onLeave,
}: ProfilesDisplayProps) {
  const searchParams = useSearchParams();
  const category = searchParams.get("filter") ?? "proprietaire";
  const location = searchParams.get("location") ?? "non précisée";

  const [alertConfirmed, setAlertConfirmed] = useState(false);

  const handleAlertClick = async () => {
    try {
      const userId = "a1b2c3d4-1234-5678-90ab-cdef12345678"; // TODO: remplacer par l’ID du user connecté
      const message = `Alerte : aucun profil trouvé pour ${category} à ${location}`;

      const response = await fetch("/api/alertes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message }),
      });

      if (response.ok) {
        setAlertConfirmed(true);
        setTimeout(() => setAlertConfirmed(false), 5000);
      } else {
        alert("Erreur lors de l’envoi de l’alerte");
      }
    } catch {
      alert("Erreur réseau lors de l’envoi de l’alerte");
    }
  };

  return (
    <div className={styles.profilesDisplay}>
      {visibleProfiles.length > 0 ? (
        <ul className={styles.profileList}>
          {visibleProfiles.map((profile) => {
            const { id, name, type, photo, services = [], available, created_at } = profile;

            const categoryInfo = categoriesMap[type] ?? {
              label: type,
              description: "Professionnel local",
            };

            return (
              <li
                key={id}
                className={`${styles.profileItem} ${styles[type]}`}
                onMouseEnter={() => onHover?.(id)}
                onMouseLeave={() => onLeave?.()}
              >
                <Image
                  src={photo || "/default-profile.png"}
                  alt={`Avatar de ${name}, ${type}`}
                  className={styles.profileAvatar}
                  width={60}        // largeur souhaitée
                  height={60}       // hauteur souhaitée
                  style={{ borderRadius: "50%" }} // si tu veux un rond
                />

                <div className={styles.profileDetails}>
                  <h4>
                    {name} <span className={styles.categoryLabel}>({categoryInfo.label})</span>
                  </h4>
                  <p className={styles.categoryDescription}>{categoryInfo.description}</p>

                  <div className={styles.services}>
                    {services.length > 0 ? (
                      <>
                        {services.slice(0, 3).map((srv, i) => (
                          <span key={i} className={styles.serviceBadge}>
                            {srv}
                          </span>
                        ))}
                        {services.length > 3 && (
                          <span className={styles.more}>+{services.length - 3}</span>
                        )}
                      </>
                    ) : (
                      <span className={styles.serviceNone}>Aucun service renseigné</span>
                    )}
                  </div>

                  <p className={styles.location}>📍 Secteur : {location}</p>
                  {created_at && (
                    <p className={styles.experience}>
                      Membre depuis {new Date(created_at).getFullYear()}
                    </p>
                  )}

                  <div className={styles.status}>
                    {available ? (
                      <span className={styles.available}>🟢 Disponible</span>
                    ) : (
                      <span className={styles.unavailable}>🔴 Indisponible</span>
                    )}
                  </div>

                  <div className={styles.actions}>
                    <button className={styles.profileContactBtn}>Contacter</button>
                    <button className={styles.profileMoreBtn}>Voir profil</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <>
          <button
            className={styles.noResultAlert}
            onClick={handleAlertClick}
            aria-label={
              alertConfirmed
                ? "Alerte prise en compte"
                : "Alerte non prise en compte, cliquer pour notifier"
            }
            type="button"
          >
            Aucun profil trouvé
            {alertConfirmed ? (
              <FaBellSlash
                aria-hidden="true"
                style={{ color: "gold", marginLeft: 8, fontSize: 24 }}
                title="Alerte prise en compte"
              />
            ) : (
              <FaBell
                aria-hidden="true"
                style={{ color: "gold", marginLeft: 8, fontSize: 24 }}
                title="Alerte non prise en compte"
              />
            )}
          </button>

          {alertConfirmed && (
            <div
              className={styles.confirmationMessage}
              role="alert"
              aria-live="assertive"
              style={{ marginTop: "1rem", color: "#bfa900", fontWeight: 600 }}
            >
              Alerte bien prise en compte !
            </div>
          )}
        </>
      )}
    </div>
  );
}
