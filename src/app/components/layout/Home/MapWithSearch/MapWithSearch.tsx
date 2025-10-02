"use client";

import React, { useState, useEffect, useCallback, JSX } from "react";
import { usePathname } from "next/navigation";
import { FaSearch, FaTimes } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import iconMap from "../../../../lib/iconMap";
import styles from "./MapWithSearch.module.scss";
import "react-toastify/dist/ReactToastify.css";

import CategoryPopup from "../../../popups/CategoryPopup/CategoryPopup";
import AccessPopup from "../../../popups/AccessPopup/AccessPopup";

type CategoryKey = "proprietaire" | "concierge" | "artisan";

interface Category {
  key: CategoryKey;
  label: string;
  icon: keyof typeof iconMap;
}

interface MapWithSearchProps {
  onClose: () => void;
}

const DESCRIPTIONS: Record<CategoryKey, JSX.Element> = {
  proprietaire: (
    <>
      <span className={styles.highlightGold}>Trouvez la conciergerie idéale</span>{" "}
      — qu’elle soit indépendante ou professionnelle — pour simplifier la gestion
      de vos locations et gagner du temps.
    </>
  ),
  concierge: (
    <>
      <span className={styles.highlightGold}>Accédez directement aux propriétaires</span>{" "}
      qui recherchent une conciergerie fiable, et développez votre activité avec
      des partenariats durables.
    </>
  ),
  artisan: (
    <>
      <span className={styles.highlightGold}>Découvrez les artisans et commerçants locaux</span>{" "}
      pour valoriser vos biens, entretenir vos logements et soutenir le circuit court.
    </>
  ),
};

// 🌟 Ordre fixe
const CATEGORY_ORDER: CategoryKey[] = ["proprietaire", "concierge", "artisan"];

export default function MapWithSearch({ onClose }: MapWithSearchProps) {
  const pathname = usePathname();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | "">("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [showAccessPopup, setShowAccessPopup] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // 🚀 Fermer automatiquement si on arrive sur /search-form
  useEffect(() => {
    if (pathname === "/search-form") {
      onClose();
    }
  }, [pathname, onClose]);

  // --- Charger les catégories ---
  useEffect(() => {
    const fetchCategories = async () => {
      setStatus("loading");
      try {
        const res = await fetch("/api/categories/groups");
        if (!res.ok) throw new Error(`API Error: ${res.status}`);

        const data: Category[] = await res.json();

        // Initialiser avec la première catégorie selon l’ordre
        const firstCategoryKey = CATEGORY_ORDER.find((key) =>
          data.some((c) => c.key === key)
        );
        setSelectedCategory(firstCategoryKey || (data[0]?.key ?? ""));
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

  // --- Recherche ---
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
    },
    [location, selectedCategory]
  );

  // --- Sélection options ---
  const handleOptionSelect = (options: string[]) => {
    setSelectedOptions(options);
    setShowCategoryPopup(false);
    setShowAccessPopup(true);
  };

  // --- Rendu catégories ---
  const renderCategoryToggles = () => {
    if (status === "loading") return <p>Chargement des filtres...</p>;
    if (status === "error") return <p>Erreur lors du chargement des filtres.</p>;

    const categoriesMap = categories.reduce((acc, category) => {
      acc[category.key] = category;
      return acc;
    }, {} as Record<CategoryKey, Category>);

    return CATEGORY_ORDER.filter((key) => categoriesMap[key]).map((key) => {
      const { label, icon } = categoriesMap[key]!;
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

  // --- Render ---
  return (
    <>
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
                {DESCRIPTIONS[selectedCategory]}
              </div>
            )}

            <form onSubmit={handleSearch} className={styles.searchBar}>
              <input
                type="search"
                placeholder="Où recherchez-vous ?"
                aria-label="Saisir une localisation"
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

      {showCategoryPopup && selectedCategory && (
        <CategoryPopup
          category={selectedCategory}
          onClose={() => setShowCategoryPopup(false)}
          onNext={handleOptionSelect}
        />
      )}

      {showAccessPopup && selectedCategory && (
        <AccessPopup
          selectedOptions={selectedOptions}
          category={selectedCategory}
          location={location}
          onClose={() => {
            setShowAccessPopup(false);
            onClose(); // ferme aussi la popup principale
          }}
        />
      )}
    </>
  );
}
