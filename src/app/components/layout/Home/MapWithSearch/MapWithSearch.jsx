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
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories/groups");
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setCategories(data);
        setSelectedCategory(data[0]?.key || "");
      } catch {
        toast.error("Impossible de charger les catégories 😢");
      }
    }
    fetchCategories();
  }, []);

  const descriptions = {
    proprietaire: (
      <>
        <span className={styles.highlightGold}>Trouvez des propriétaires</span>{" "}
        à la recherche d'une conciergerie fiable pour gérer et valoriser leur bien en location saisonnière.
      </>
    ),
    concierge: (
      <>
        <span className={styles.highlightGold}>Trouvez une conciergerie</span>, indépendante ou professionnelle,
        cherchant à étendre son réseau de biens saisonniers dans votre région.
      </>
    ),
    artisan: (
      <>
        <span className={styles.highlightGold}>Découvrez les artisans et commerçants locaux</span>{" "}
        offrant des produits ou prestations adaptés à la location saisonnière.
      </>
    ),
  };

  const onToggleClick = (key) => setSelectedCategory(key);

  const onSearch = () => {
    if (!location.trim()) {
      toast.warn("Veuillez renseigner une localisation 📍");
      return;
    }
    router.push(`/map-list?filter=${selectedCategory}&location=${encodeURIComponent(location)}`);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") onSearch();
  };

  return (
    <div className={styles.mapWithSearchSection}>
      <ToastContainer position="top-right" autoClose={4000} />

      <section className={styles.categorySearchSection}>
      
        <h2 className={styles.categoryTitle}>
          Connectez-vous aux bons partenaires
        </h2>

        {/* Toggle catégories */}
        <div className={styles.tripleToggleGroup}>
          {categories.slice(0, 3).map(({ key, label, icon }) => {
            const Icon = iconMap[icon];
            const activeClass = selectedCategory === key ? styles.active : "";
            return (
              <button
                key={key}
                type="button"
                aria-label={`Filtrer par ${label}`}
                className={`${styles.tripleToggleButton} ${activeClass}`}
                onClick={() => onToggleClick(key)}
              >
                {Icon && <Icon size="1.3em" style={{ marginRight: 6, verticalAlign: "middle" }} />}
                {label}
              </button>
            );
          })}
        </div>

        {/* Description dynamique */}
        <div className={styles.categoryTextBubble1900}>
          <p>{descriptions[selectedCategory]}</p>
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
              onKeyDown={onKeyDown}
              aria-label="Rechercher une localisation"
              className={styles.searchInput}
            />
            <button onClick={onSearch} type="button" aria-label="Rechercher">
              <FaSearch />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
