"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./MapWithSearch.module.scss";
import iconMap from "@/app/lib/iconMap";
import { FaSearch } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function MapWithSearch() {
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [location, setLocation] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories/groups");
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setCategories(data);
        setSelectedCategory(data[0]?.key || "");
      } catch (err) {
        toast.error("Impossible de charger les catégories 😢");
      }
    };
    fetchCategories();
  }, []);

  const handleToggleClick = (key) => {
    setSelectedCategory(key);
  };

  const handleSearchClick = () => {
    if (!location.trim()) {
      toast.warn("Veuillez renseigner une localisation 📍");
      return;
    }
    router.push(
      `/map-list?filter=${selectedCategory}&location=${encodeURIComponent(location)}`
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearchClick();
    }
  };

  // Descriptions associées à chaque catégorie avec clé dynamique sur span highlight
  const descriptions = {
    proprietaire: (
      <>
        <span key={selectedCategory} className={styles.highlightGold}>
          Trouvez des propriétaires
        </span>{" "}
        à la recherche d'une conciergerie fiable pour gérer et valoriser leur bien en location saisonnière.
      </>
    ),
    concierge: (
      <>
        <span key={selectedCategory} className={styles.highlightGold}>
          Trouvez une conciergerie
        </span>
        , indépendante ou professionnelle, cherchant à étendre son réseau de biens saisonniers dans votre région.
      </>
    ),
    artisan: (
      <>
        <span key={selectedCategory} className={styles.highlightGold}>
          Découvrez les artisans et commerçants locaux
        </span>{" "}
        offrant des produits ou prestations adaptés à la location saisonnière.
      </>
    ),
  };

  return (
    <div className={styles.mapWithSearchSection}>

      <ToastContainer position="top-right" autoClose={4000} />

      <section className={styles.categorySearchSection}>
        <header className={styles.categoryInstructionWrapper}>
          <h2 className={styles.categoryTitle}>
            Connectez-vous aux bons partenaires de la location saisonnière
          </h2>
          <h3 className={styles.categoryInstruction}>
            Choisissez selon vos besoins : propriétaire, conciergerie, artisan,
            commerçant… recherchant ou proposant leurs services dans votre région.
          </h3>
        </header>

        {/* Toggle Group */}
        <div className={styles.tripleToggleGroup}>
          {categories.slice(0, 3).map(({ key, label, icon }) => {
            const Icon = iconMap[icon];
            return (
              <button
                key={key}
                className={`${styles.tripleToggleButton} ${selectedCategory === key ? styles.active : ""
                  }`}
                onClick={() => handleToggleClick(key)}
                type="button"
                aria-label={`Filtrer par ${label}`}
              >
                {Icon ? (
                  <Icon size="1.3em" style={{ marginRight: 6, verticalAlign: "middle" }} />
                ) : null}
                {label}
              </button>
            );
          })}
        </div>

        {/* Texte descriptif sous les boutons */}
        <div className={styles.categoryTextBubble1900}>
          <p>{descriptions[selectedCategory]}</p>
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
              onKeyDown={handleKeyDown}
              aria-label="Rechercher une localisation"
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
