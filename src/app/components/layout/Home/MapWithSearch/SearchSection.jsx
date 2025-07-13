// src/app/components/layout/Home/MapWithSearch/SearchSection.jsx
"use client"; // Indique que ce composant est un Client Component dans Next.js

import React from 'react';
import { FaSearchLocation } from 'react-icons/fa';
import styles from './SearchSection.module.scss'; // Importe le SCSS dédié à cette section

/**
 * Composant SearchSection pour la recherche de professionnels par localisation.
 *
 * @param {object} props - Les props du composant.
 * @param {string} props.location - La valeur actuelle du champ de localisation.
 * @param {function} props.setLocation - Fonction pour mettre à jour la localisation.
 * @param {function} props.handleSearch - Fonction à appeler lors du clic sur le bouton de recherche.
 */
export default function SearchSection({ location, setLocation, handleSearch }) {
    return (
        <section className={styles.searchSection}>
            <h2>Recherchez un professionnel dans votre région</h2>
            <div className={styles.searchInputGroup}>
                <FaSearchLocation className={styles.searchIcon} aria-hidden="true" />
                {/* <label htmlFor="location-input" className="sr-only">Saisir une ville, code postal...</label> */}
                <input
                    id="location-input"
                    type="text"
                    placeholder="Saisir une ville, code postal..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={styles.locationInput}
                    aria-label="Saisir une ville ou un code postal"
                />
                <button onClick={handleSearch} className={styles.searchButton} type="button">
                    Rechercher
                </button>
            </div>
            <p className={styles.searchGuidance}>
                Entrez votre emplacement pour trouver les professionnels disponibles près de chez vous.
            </p>
        </section>
    );
}