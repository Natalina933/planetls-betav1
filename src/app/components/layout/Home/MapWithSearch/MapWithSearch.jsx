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
  const [categories, setCategories] = useState([]);

  // Charger les catégories principales (families)
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

  const handleCategoryClick = (key) => {
    setSelectedCategory(key);
  };

  const handleSearchClick = () => {
    if (!location.trim()) {
      toast.warn("Veuillez renseigner une localisation avant de lancer la recherche 📍");
      return;
    }
    router.push(`/map-list?filter=${selectedCategory}&location=${encodeURIComponent(location)}`);
  };

  // Cherche la catégorie sélectionnée pour l'afficher en-dessous
  const selectedCat = categories.find((cat) => cat.key === selectedCategory);

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

        {/* Rangée de bulles */}
        <div className={styles.bubblesRow}>
          {categories.map(({ key, label, icon }, index) => {
            const Icon = iconMap[icon];
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
              </div>
            );
          })}
        </div>

        {/* Texte de la catégorie sélectionnée sous la ligne */}
        <div
          className={styles.categoryTextBubble1900}
          style={{
            backgroundImage: "url('/ornements/mucha-background-pattern-light.png')",
            backgroundRepeat: "repeat",
            backgroundPosition: "center",
            backgroundSize: "250px 250px",
            position: "relative",
            padding: "1rem",
            opacity: 0.9,
            borderRadius: "20px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            marginTop: "1rem",
            color: "var(--color-text)",}}
        >
          {selectedCat && (
            <>
              <h3>{selectedCat.label}</h3>
              <p>{selectedCat.description}</p>
            </>
          )}
        </div>


        {/* Barre de recherche */}
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
            <button onClick={handleSearchClick} type="button" aria-label="Rechercher">
              <FaSearch />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
