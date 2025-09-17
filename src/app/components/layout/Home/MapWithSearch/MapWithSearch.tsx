"use client";

import { useState, useEffect, useCallback } from "react";
import { FaSearch } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import { createBrowserClient } from "@supabase/ssr";
import iconMap from "@/app/lib/iconMap";
import { geocodeLocation, getDistance } from "@/app/lib/geocode";
import styles from "./MapWithSearch.module.scss";
import "react-toastify/dist/ReactToastify.css";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Category {
  key: string;
  label: string;
  icon: keyof typeof iconMap;
}

interface Profile {
  id: string;
  name: string;
  type: "proprietaire" | "concierge" | "artisan";
  photo?: string;
  services?: string[];
  latitude?: number | null;
  longitude?: number | null;
  available?: boolean;
}

const DESCRIPTIONS = {
  proprietaire: <span className={styles.highlightGold}>Trouvez des propriétaires</span>,
  concierge: <span className={styles.highlightGold}>Trouvez une conciergerie</span>,
  artisan: <span className={styles.highlightGold}>Découvrez les artisans et commerçants locaux</span>,
};

export default function MapWithSearch() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [visibleProfiles, setVisibleProfiles] = useState<Profile[]>([]);
  const [alertConfirmed, setAlertConfirmed] = useState(false);

  // --- Charger les catégories ---
  useEffect(() => {
    const fetchCategories = async () => {
      setStatus("loading");
      try {
        const res = await fetch("/api/categories/groups");
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        const data: Category[] = await res.json();
        setCategories(data);
        if (data.length > 0) setSelectedCategory(data[0].key);
        setStatus("success");
      } catch {
        toast.error("Impossible de charger les filtres 😢");
        setStatus("error");
      }
    };
    fetchCategories();
  }, []);

  // --- Recherche ---
  const handleSearch = useCallback(async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!location.trim()) return toast.warn("Veuillez renseigner une localisation 📍");

    const geo = await geocodeLocation(location);
    if (!geo) return toast.error("Localisation introuvable 😢");

    const res = await fetch(`/api/profiles?category=${selectedCategory}`);
    const data = await res.json();

    const filtered = data.profiles.filter(
      (p: Profile) =>
        p.latitude &&
        p.longitude &&
        getDistance(p.latitude, p.longitude, geo.latitude, geo.longitude) < 10
    );
    setVisibleProfiles(filtered);
  }, [location, selectedCategory]);

  // --- Créer alerte ---
  const handleAlertClick = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return toast.warn("Vous devez être connecté(e) !");

      const geo = await geocodeLocation(location);
      if (!geo) return toast.error("Localisation introuvable 😢");

      const response = await fetch("/api/alertes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          message: `Alerte : ${selectedCategory} à ${location} non trouvé`,
          category: selectedCategory,
          location,
          latitude: geo.latitude,
          longitude: geo.longitude,
        }),
      });

      if (response.ok) {
        setAlertConfirmed(true);
        setTimeout(() => setAlertConfirmed(false), 5000);
      } else toast.error("Impossible d’enregistrer l’alerte 😢");
    } catch {
      toast.error("Erreur réseau lors de l’alerte");
    }
  };

  // --- UI catégories ---
  const renderCategoryToggles = () => {
    if (status === "loading") return <p>Chargement...</p>;
    if (status === "error") return <p>Erreur.</p>;
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

      <h2 className={styles.categoryTitle}>Connectez-vous aux bons partenaires</h2>
      <div className={styles.tripleToggleGroup}>{renderCategoryToggles()}</div>
      {status === "success" && (
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
          className={styles.searchInput}
          required
        />
        <button type="submit"><FaSearch /></button>
      </form>

      {visibleProfiles.length === 0 && location.trim() !== "" && (
        <button className={styles.noResultAlert} onClick={handleAlertClick}>
          Aucun profil trouvé {alertConfirmed ? "✅" : "🔔"}
        </button>
      )}
    </div>
  );
}
