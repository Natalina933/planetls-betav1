// src/app/components/layout/Home/MapWithSearch/ProfilesDisplay.jsx
import React from "react";
import styles from "./MapWithSearch.module.scss"; // Réutilisation des styles existants

export default function ProfilesDisplay({ visibleProfiles }) {
    return (
        <div className={styles.profilesDisplay}>
            {visibleProfiles.length > 0 ? (
                <ul className={styles.profileList}>
                    {visibleProfiles.map(({ id, name, type, photo, services }) => (
                        <li key={id} className={`${styles.profileItem} ${styles[type]}`}>
                            <img src={photo} alt={`Avatar de ${name}, ${type}`} className={styles.profileAvatar} />
                            <div className={styles.profileDetails}>
                                <h4>{name} ({type.charAt(0).toUpperCase() + type.slice(1)})</h4>
                                <p>Services : {services.length ? services.join(", ") : "Non renseignés"}</p>
                                <button className={styles.profileContactBtn}>Contacter</button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className={styles.noResult}>Aucun profil trouvé dans cette catégorie pour la démo.</div>
            )}
        </div>
    );
}