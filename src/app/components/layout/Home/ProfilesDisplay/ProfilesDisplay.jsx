"use client";
import React, { useState } from "react";
import { FaBell, FaBellSlash } from "react-icons/fa";
import styles from "./ProfilesDisplay.module.scss";
import { useSearchParams } from "next/navigation";

export default function ProfilesDisplay({ visibleProfiles }) {
  const searchParams = useSearchParams();
  const category = searchParams.get("filter") || "proprietaire";
  const location = searchParams.get("location") || "non précisée";

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
    } catch (err) {
      alert("Erreur réseau lors de l’envoi de l’alerte");
    }
  };

  return (
    <div className={styles.profilesDisplay}>
      {visibleProfiles.length > 0 ? (
        <ul className={styles.profileList}>
          {visibleProfiles.map(({ id, name, type, photo, services }) => (
            <li key={id} className={`${styles.profileItem} ${styles[type]}`}>
              <img
                src={photo || "/default-profile.png"}
                alt={`Avatar de ${name}, ${type}`}
                className={styles.profileAvatar}
              />
              <div className={styles.profileDetails}>
                <h4>
                  {name} ({type.charAt(0).toUpperCase() + type.slice(1)})
                </h4>
                <p>
                  Services :{" "}
                  {Array.isArray(services) && services.length > 0
                    ? services.join(", ")
                    : "Non renseignés"}
                </p>
                <button
                  className={styles.profileContactBtn}
                  aria-label={`Contacter ${name} (${type})`}
                >
                  Contacter
                </button>
              </div>
            </li>
          ))}
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
              style={{ marginTop: "1rem", color: "#bfa900", fontWeight: "600" }}
            >
              Alerte bien prise en compte !
            </div>
          )}
        </>
      )}
    </div>
  );
}
