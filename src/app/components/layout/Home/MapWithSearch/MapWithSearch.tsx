"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FaSearch } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/navigation";
import iconMap from "../../../../lib/iconMap";
import styles from "./MapWithSearch.module.scss";
import "react-toastify/dist/ReactToastify.css";
import CategoryPopup from "../../../popups/CategoryPopup/CategoryPopup";
import AccessPopup from "../../../popups/AccessPopup/AccessPopup";

interface Category {
  key: string;
  label: string;
  icon: keyof typeof iconMap;
}

const DESCRIPTIONS = {
  proprietaire: (
    <>
      <span className={styles.highlightGold}>Trouvez une conciergerie,</span> indépendante ou professionnelle.
    </>
  ),
  concierge: (
    <>
      <span className={styles.highlightGold}>Trouvez des propriétaires</span> à la recherche d&apos;une conciergerie fiable.
    </>
  ),
  artisan: (
    <>
      <span className={styles.highlightGold}>Découvrez les artisans et commerçants locaux</span> pour vos besoins.
    </>
  ),
};

export default function MapWithSearch() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAccessPopup, setShowAccessPopup] = useState(false);
  const [hideMainSection, setHideMainSection] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      setStatus("loading");
      try {
        const res = await fetch("/api/categories/groups");
        if (!res.ok) throw new Error(`API Error: ${res.status}`);

        const data: Category[] = await res.json();
        if (data.length > 0) setSelectedCategory(data[0].key);
        setCategories(data);
        setStatus("success");
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast.error("Impossible de charger les filtres 😢");
        setStatus("error");
      }
    };

    fetchCategories();
  }, []);

  const handleSearch = useCallback(
    (e?: React.FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      if (!location.trim()) {
        toast.warn("Veuillez renseigner une localisation 📍");
        return;
      }

      if (!selectedCategory) {
        toast.warn("Veuillez sélectionner une catégorie 🧭");
        return;
      }

      setShowCategoryPopup(true);
      setHideMainSection(true); // cache la section principale
    },
    [location, selectedCategory]
  );

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setShowCategoryPopup(false);
    setShowAccessPopup(true);
  };

  const handleClosePopup = () => {
    setShowCategoryPopup(false);
    setHideMainSection(false); // réaffiche la section si on revient
    router.push("/"); // redirection vers la page d’accueil
  };

  const renderCategoryToggles = () => {
    if (status === "loading") return <p>Chargement des filtres...</p>;
    if (status === "error") return <p>Erreur lors du chargement des filtres.</p>;

    return categories.slice(0, 3).map(({ key, label, icon }) => {
      const Icon = iconMap[icon];
      const isActive = selectedCategory === key;
      return (
        <button
          key={key}
          type="button"
          aria-pressed={isActive}
          className={`${styles.tripleToggleButton} ${isActive ? styles.active : ""}`}
          onClick={() => setSelectedCategory(key)}
        >
          {Icon && <Icon size="1.3em" style={{ marginRight: 6, verticalAlign: "middle" }} />}
          {label}
        </button>
      );
    });
  };

  return (
    <div className={styles.mapWithSearchSection}>
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar />

      {!hideMainSection && (
        <section className={styles.categorySearchSection}>
          <h2 className={styles.categoryTitle}>Connectez-vous aux bons partenaires</h2>

          <div className={styles.tripleToggleGroup}>{renderCategoryToggles()}</div>

          {status === "success" && (
            <div className={styles.categoryTextBubble1900}>
              <p>{DESCRIPTIONS[selectedCategory as keyof typeof DESCRIPTIONS]}</p>
            </div>
          )}

          <div className={styles.searchBarWrapper}>
            <span className={styles.categoryInstruction}>
              Utilisez les filtres ci-dessus et indiquez votre localisation.
            </span>
            <form onSubmit={handleSearch} className={styles.searchBar}>
              <label htmlFor="location-search" className={styles.srOnly}>
                Recherche de localisation
              </label>
              <input
                type="search"
                id="location-search"
                name="location"
                placeholder="Où recherchez-vous ?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className={styles.searchInput}
              />
              <button type="submit" aria-label="Rechercher">
                <FaSearch aria-hidden="true" />
              </button>
            </form>
          </div>
        </section>
      )}

      {showCategoryPopup && selectedCategory && (
        <CategoryPopup
          category={selectedCategory}
          onClose={handleClosePopup}
          onNext={handleOptionSelect}
        />
      )}

      {showAccessPopup && selectedOption && (
        <AccessPopup
          selectedOption={selectedOption}
          onClose={() => setShowAccessPopup(false)}
        />
      )}
    </div>
  );
}
