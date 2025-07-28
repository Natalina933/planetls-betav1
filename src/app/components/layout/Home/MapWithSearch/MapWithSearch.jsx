"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./MapWithSearch.module.scss";
import { FaHome, FaBell, FaTools, FaGlobe, FaSearch } from "react-icons/fa";
import SearchSection from "../SearchSection/SearchSection";
import ProfilesDisplay from "../ProfilesDisplay/ProfilesDisplay";

const BASE_CATEGORIES = [
  {
    key: "proprietaire",
    label: "Propriétaires",
    icon: FaHome,
    image: "/images/carousel/proprio.jpeg",
    description: "Propriétaires locaux, engagés et à l’écoute",
  },
  {
    key: "concierge",
    label: "Conciergerie",
    icon: FaBell,
    image: "/images/carousel/concierges.jpg",
    description: "Concierges de quartier, service sur-mesure",
  },
  {
    key: "artisan",
    label: "Artisans",
    icon: FaTools,
    image: "/images/carousel/artisans.jpg",
    description: "Artisans passionnés, savoir-faire local",
  },
];

export default function MapWithSearch() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("proprietaire");
  const [location, setLocation] = useState("");
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await fetch(`/api/profiles?category=${selectedCategory}`);
        const data = await res.json();
        setProfiles(data);
      } catch (error) {
        console.error("Erreur chargement profils :", error);
        setProfiles([]);
      }
    };

    fetchProfiles();
  }, [selectedCategory]);

  const shouldShowAllCategory = profiles.length > 10;

  const categories = shouldShowAllCategory
    ? [
        {
          key: "all",
          label: "Tout afficher",
          icon: FaGlobe,
          image: "/images/carousel/all.jpg",
          description: "Tous les partenaires réunis",
        },
        ...BASE_CATEGORIES,
      ]
    : BASE_CATEGORIES;

  const activeCategory = categories.find((cat) => cat.key === selectedCategory);

  const handleSearch = () => {
    router.push(`/map-list?filter=${selectedCategory}&location=${encodeURIComponent(location)}`);
  };

  const getCategoryStyles = (key, index) => ({
    "--bubble-primary": `var(--${key}-primary, var(--color-primary))`,
    "--bubble-hover": `var(--${key}-hover, var(--color-primary-light))`,
    "--bubble-bg": `var(--${key}-bg, #fff)`,
    "--bubble-text": `var(--${key}-text, var(--color-text))`,
    animationDelay: `${index * 0.1}s`,
  });

  return (
    <div className={styles.mapWithSearchSection}>
      <SearchSection />
      <section className={styles.categorySearchSection}>
        <header className={styles.categoryInstructionWrapper}>
          <h2 className={styles.categoryTitle}>
            Trouvez les bons partenaires pour votre activité saisonnière
          </h2>
          <h3 className={styles.categoryInstruction}>
            Recherchez facilement conciergeries, artisans, et collaborateurs locaux pour propulser vos projets.
          </h3>
        </header>

        <div className={styles.bubblesRow}>
          {categories.map(({ key, label, icon: Icon, description }, index) => (
            <div
              key={key}
              className={`${styles.bubbleBlock} ${selectedCategory === key ? styles.active : ""}`}
              style={getCategoryStyles(key, index)}
            >
              <button
                className={styles.bubbleBtn}
                onClick={() => setSelectedCategory(key)}
                aria-label={`Filtrer par ${label}`}
                type="button"
              >
                <span className={styles.bubbleIcon}><Icon size="1.7em" /></span>
              </button>

              {selectedCategory === key && (
                <div className={styles.categoryTextBubble}>
                  <h3>{label}</h3>
                  <p>{description}</p>
                </div>
              )}

              {selectedCategory === key && (
                <ProfilesDisplay visibleProfiles={profiles} />
              )}
            </div>
          ))}
        </div>

        <div className={styles.searchBarWrapper}>
          <span className={styles.categoryInstruction}>
            Utilisez les filtres ci-dessus et indiquez votre localisation.
          </span>

          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Où recherchez-vous ?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={styles.searchInput}
            />
            <button onClick={handleSearch} type="button" aria-label="Rechercher">
              <FaSearch />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
