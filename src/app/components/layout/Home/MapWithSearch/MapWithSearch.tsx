"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/navigation";
import iconMap from "../../../../lib/iconMap";
import styles from "./MapWithSearch.module.scss";
import "react-toastify/dist/ReactToastify.css";
import CategoryPopup from "../../../popups/CategoryPopup/CategoryPopup";

interface Category {
  key: string;
  label: string;
  icon: keyof typeof iconMap;
}

interface MapWithSearchProps {
  onClose: () => void;
}

const DESCRIPTIONS: Record<string, React.ReactNode> = {
  proprietaire: <>Trouvez une conciergerie indépendante ou professionnelle.</>,
  concierge: <>Trouvez des propriétaires à la recherche d&apos;une conciergerie fiable.</>,
  artisan: <>Découvrez les artisans et commerçants locaux pour vos besoins.</>,
};

export default function MapWithSearch({ onClose }: MapWithSearchProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const router = useRouter();

  const isPopupOpen = showCategoryPopup;

  // Chargement des catégories
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

  // Soumission du formulaire
  const handleSearch = useCallback(
    (e?: React.FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      if (!location.trim()) return toast.warn("Veuillez renseigner une localisation 📍");
      if (!selectedCategory) return toast.warn("Veuillez sélectionner une catégorie 🧭");
      setShowCategoryPopup(true);
    },
    [location, selectedCategory]
  );

  // Gestion de la sélection dans le popup
  const handleOptionSelect = (option: string) => {
    // Redirection vers la page formulaire avec query
    const params = new URLSearchParams({
      category: selectedCategory,
      option,
      location,
    }).toString();
    router.push(`/search-form?${params}`);
  };

  // Affichage des boutons catégories
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
      {!isPopupOpen && (
        <div className={styles.mapWithSearchContainer}>
          <ToastContainer position="top-right" autoClose={4000} hideProgressBar />
          <button className={styles.closeButton} onClick={onClose} aria-label="Fermer la recherche">
            <FaTimes />
          </button>

          <section className={styles.categorySearchSection}>
            <h2>Connectez-vous aux bons partenaires</h2>
            <div className={styles.tripleToggleGroup}>{renderCategoryToggles()}</div>

            {status === "success" && selectedCategory && (
              <div className={styles.categoryTextBubble1900}>
                {DESCRIPTIONS[selectedCategory]}
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
    </>
  );
}
