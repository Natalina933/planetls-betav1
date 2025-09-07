"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaSearch } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import iconMap from "@/app/lib/iconMap";
import styles from "./MapWithSearch.module.scss";
import "react-toastify/dist/ReactToastify.css";

// 1. Définir un type pour les données des catégories
interface Category {
  key: string;
  label: string;
  icon: keyof typeof iconMap; // Assure que l'icône existe dans iconMap
}

// Objet des descriptions, inchangé mais pourrait venir de l'API
const DESCRIPTIONS = {
  proprietaire: (
    <>
      <span className={styles.highlightGold}>Trouvez des propriétaires</span> à la recherche d&apos;une conciergerie fiable.
    </>
  ),
  concierge: (
    <>
      <span className={styles.highlightGold}>Trouvez une conciergerie</span>, indépendante ou professionnelle.
    </>
  ),
  artisan: (
    <>
      <span className={styles.highlightGold}>Découvrez les artisans et commerçants locaux</span> pour vos besoins.
    </>
  ),
};

export default function MapWithSearch() {
  const router = useRouter();

  // 2. Gestion d'état groupée et typée
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const fetchCategories = async () => {
      setStatus("loading");
      try {
        const res = await fetch("/api/categories/groups");
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        
        const data: Category[] = await res.json();
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategory(data[0].key);
        }
        setStatus("success");
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast.error("Impossible de charger les filtres 😢");
        setStatus("error");
      }
    };

    fetchCategories();
  }, []); // Le tableau vide est correct, l'effet ne s'exécute qu'une fois

  // 3. Fonctions mémoisées avec useCallback
  const handleSearch = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault(); // Empêche le rechargement de la page par le formulaire
    if (!location.trim()) {
      toast.warn("Veuillez renseigner une localisation 📍");
      return;
    }
    router.push(`/map-list?filter=${selectedCategory}&location=${encodeURIComponent(location)}`);
  }, [location, selectedCategory, router]);

  // Rendu des boutons de catégorie
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
      <section className={styles.categorySearchSection}>
        <h2 className={styles.categoryTitle}>Connectez-vous aux bons partenaires</h2>

        <div className={styles.tripleToggleGroup}>
          {renderCategoryToggles()}
        </div>
        
        {status === "success" && (
          <div className={styles.categoryTextBubble1900}>
            <p>{DESCRIPTIONS[selectedCategory as keyof typeof DESCRIPTIONS]}</p>
          </div>
        )}

        <div className={styles.searchBarWrapper}>
          <span className={styles.categoryInstruction}>
            Utilisez les filtres ci-dessus et indiquez votre localisation.
          </span>
          {/* 4. Le formulaire gère la soumission, plus besoin de onKeyDown */}
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
    </div>
  );
}