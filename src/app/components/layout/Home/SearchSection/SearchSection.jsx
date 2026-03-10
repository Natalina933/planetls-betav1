"use client";

import { SearchBar } from "@/components/ui";
import styles from "./SearchSection.module.scss";

export default function SearchSection({ location, setLocation, handleSearch }) {
  return (
    <section className={styles.searchSection}>
      <h2>Recherchez un professionnel dans votre region</h2>
      <div className={styles.searchInputGroup}>
        <SearchBar
          className={styles.searchBar}
          defaultValue={location}
          placeholder="Saisir une ville, code postal..."
          buttonLabel="Rechercher"
          onSearch={handleSearch}
          inputProps={{
            id: "location-input",
            onChange: (event) => setLocation(event.target.value),
          }}
        />
      </div>
      <p className={styles.searchGuidance}>
        Entrez votre emplacement pour trouver les professionnels disponibles pres de chez vous.
      </p>
    </section>
  );
}
