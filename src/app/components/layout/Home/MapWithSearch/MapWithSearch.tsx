"use client";

import React, { useState, useEffect, useCallback, JSX } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import iconMap from "../../../../lib/iconMap";
import styles from "./MapWithSearch.module.scss";
import "react-toastify/dist/ReactToastify.css";

import CategoryPopup from "../../../popups/CategoryPopup/CategoryPopup";
import AccessPopup from "../../../popups/AccessPopup/AccessPopup";

interface Category {
  key: "proprietaire" | "concierge" | "artisan";
  label: string;
  icon: keyof typeof iconMap;
}

interface MapWithSearchProps {
  onClose: () => void;
}

const DESCRIPTIONS: Record<"proprietaire" | "concierge" | "artisan", JSX.Element> = {
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

export default function MapWithSearch({ onClose }: MapWithSearchProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<"" | "proprietaire" | "concierge" | "artisan">("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [showAccessPopup, setShowAccessPopup] = useState(false);

  // options choisies
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);


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
        console.error(error);
        toast.error("Impossible de charger les filtres 😢");
        setStatus("error");
      }
    };
    fetchCategories();
  }, []);

  const handleSearch = useCallback(
    (e?: React.FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      if (!location.trim())
        return toast.warn("Veuillez renseigner une localisation 📍");
      if (!selectedCategory)
        return toast.warn("Veuillez sélectionner une catégorie 🧭");
      setShowCategoryPopup(true);
    },
    [location, selectedCategory]
  );

  const handleOptionSelect = (options: string[]) => {
    setSelectedOptions(options);
    setShowCategoryPopup(false);
    setShowAccessPopup(true);
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
          {Icon && <Icon size="1.3em" style={{ marginRight: 6 }} />}
          {label}
        </button>
      );
    });
  };

  return (
    <>
      {/* Section principale */}
      {!showCategoryPopup && !showAccessPopup && (
        <div className={styles.mapWithSearchContainer}>
          <ToastContainer position="top-right" autoClose={4000} hideProgressBar />
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fermer la recherche"
          >
            <FaTimes />
          </button>
          <section className={styles.categorySearchSection}>
            <h2>Connectez-vous aux bons partenaires</h2>
            <div className={styles.tripleToggleGroup}>{renderCategoryToggles()}</div>
            {status === "success" && selectedCategory && (
              <div className={styles.categoryTextBubble1900}>
                {DESCRIPTIONS[selectedCategory as keyof typeof DESCRIPTIONS]}
              </div>
            )}
            <form onSubmit={handleSearch} className={styles.searchBar}>
              <input
                type="search"
                placeholder="Où recherchez-vous ?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
              <button type="submit" aria-label="Rechercher">
                <FaSearch />
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Popup catégorie */}
      {showCategoryPopup && selectedCategory && (
        <CategoryPopup
          category={selectedCategory}
          onClose={() => setShowCategoryPopup(false)}
          onNext={handleOptionSelect}
        />
      )}

      {/* Popup accès */}
      {showAccessPopup && selectedCategory && (
        <AccessPopup
          selectedOptions={selectedOptions}
          category={selectedCategory}
          location={location}
          onClose={() => {
            setShowAccessPopup(false);
            onClose(); // <-- ferme aussi la popup globale MapWithSearch
          }}
        />
      )}
    </>
  );
}
