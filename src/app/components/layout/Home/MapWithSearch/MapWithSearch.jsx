"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./MapWithSearch.module.scss";
import iconMap from "../../../../lib/iconMap";
import { FaSearch } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function MapWithSearch() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [location, setLocation] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setCategories(data);
        setSelectedCategory(data[0]?.key || "");
      } catch (err) {
        console.error("Erreur chargement des catégories :", err);
        toast.error("Impossible de charger les catégories 😢");
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;

    const fetchProfiles = async () => {
      try {
        const res = await fetch(`/api/profiles?category=${selectedCategory}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setProfiles(data);
      } catch (err) {
        console.error("Erreur chargement des profils :", err);
        toast.error("Impossible de charger les profils 😢");
        setProfiles([]);
      }
    };

    fetchProfiles();
  }, [selectedCategory]);

  const shouldShowAllCategory = profiles.length > 10;

  const displayCategories = shouldShowAllCategory
    ? [
      {
        key: "all",
        label: "Tout afficher",
        icon: "FaGlobe",
        description: "Tous les partenaires réunis",
      },
      ...categories,
    ]
    : categories;

  const handleCategoryClick = (key) => {
    if (!location.trim()) {
      toast.warn("Veuillez renseigner une localisation avant de lancer la recherche 📍");
      return;
    }

    setSelectedCategory(key);
    router.push(`/map-list?filter=${key}&location=${encodeURIComponent(location)}`);
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
      <ToastContainer position="top-right" autoClose={4000} />

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
          {displayCategories.map(({ key, label, icon, description }, index) => {
            const Icon = iconMap[icon]; // récupère le bon composant React

            return (
              <div
                key={key}
                className={`${styles.bubbleBlock} ${selectedCategory === key ? styles.active : ""}`}
                style={getCategoryStyles(key, index)}
              >
                <button
                  className={styles.bubbleBtn}
                  onClick={() => handleCategoryClick(key)}
                  aria-label={`Filtrer par ${label}`}
                  type="button"
                >
                  <span className={styles.bubbleIcon}>
                    {Icon ? <Icon size="1.7em" /> : <FaSearch size="1.7em" />}
                  </span>
                </button>

                {selectedCategory === key && (
                  <div className={styles.categoryTextBubble}>
                    <h3>{label}</h3>
                    <p>{description}</p>
                  </div>
                )}
              </div>
            );
          })}
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
            <button onClick={() => handleCategoryClick(selectedCategory)} type="button" aria-label="Rechercher">
              <FaSearch />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
