"use client"; // conserve si c'est un composant client

import dynamic from 'next/dynamic';
import styles from './SearchSection.module.scss';

// Lazy-load l'icône, pas besoin de SSR ici (false)
const FaSearchLocation = dynamic(() => import('react-icons/fa').then(mod => mod.FaSearchLocation), { ssr: false });

export default function SearchSection({ location, setLocation, handleSearch }) {
  return (
    <section className={styles.searchSection}>
      <h2>Recherchez un professionnel dans votre région</h2>
      <div className={styles.searchInputGroup}>
        <FaSearchLocation className={styles.searchIcon} aria-hidden="true" />
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
