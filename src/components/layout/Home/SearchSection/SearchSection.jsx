"use client";

import { SearchBar, SectionIntro } from "@/components/ui";
import styles from "./SearchSection.module.scss";

export default function SearchSection({ location, setLocation, handleSearch }) {
  return (
    <section className={styles.searchSection}>
      <SectionIntro
        title="Recherchez un professionnel dans votre region"
        description="Entrez une ville ou un code postal pour trouver les bons partenaires pres de chez vous."
      />
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
      <p className={styles.searchGuidance}>Entrez votre emplacement pour lancer une recherche ciblee.</p>
    </section>
  );
}
