"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  JSX,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { FaSearch, FaTimes } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import iconMap from "../../../../lib/iconMap";
import styles from "./MapWithSearch.module.scss";
import "react-toastify/dist/ReactToastify.css";

import CategoryPopup from "../../../popups/CategoryPopup/CategoryPopup";
import AccessPopup from "../../../popups/AccessPopup/AccessPopup";
import ExperiencePopup from "@/app/components/popups/ExperiencePopup/ExperiencePopup";

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
      pour simplifier la gestion de vos locations.
    </>
  ),
  concierge: (
    <>
      <span className={styles.highlightGold}>Accédez directement aux propriétaires</span>{" "}
      qui recherchent une conciergerie fiable.
    </>
  ),
  artisan: (
    <>
      <span className={styles.highlightGold}>Découvrez les artisans locaux</span>{" "}
      pour valoriser vos biens et soutenir le circuit court.
    </>
  ),
};

const CATEGORY_ORDER: CategoryKey[] = [
  "proprietaire",
  "concierge",
  "artisan",
];

const SEARCH_TARGETS: Record<CategoryKey, string> = {
  proprietaire: "concierge",
  concierge: "proprietaire",
  artisan: "proprietaire",
};

export default function MapWithSearch({ onClose }: MapWithSearchProps) {
  const pathname = usePathname();
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | "">("");
  const [searchTarget, setSearchTarget] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  const [showExperiencePopup, setShowExperiencePopup] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState<
    "debutant" | "intermediaire" | "experimente" | ""
  >("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");

  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [showAccessPopup, setShowAccessPopup] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // --- ACCESSIBILITÉ : fermeture via Escape ---
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // --- ACCESSIBILITÉ : focus trap ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }, []);

  // Fermer automatiquement si on arrive sur /complete-registration
  useEffect(() => {
    if (pathname === "/complete-registration") onClose();
  }, [pathname, onClose]);

  // Charger les catégories
  useEffect(() => {
    const fetchCategories = async () => {
      setStatus("loading");
      try {
        const res = await fetch("/api/categories/groups");
        if (!res.ok) throw new Error(`API Error: ${res.status}`);

        const data: Category[] = await res.json();
        const firstCategoryKey = CATEGORY_ORDER.find((key) =>
          data.some((c) => c.key === key)
        );

        setSelectedCategory(firstCategoryKey || data[0]?.key || "");
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

  // Mettre à jour la cible recherchée
  useEffect(() => {
    if (selectedCategory) {
      setSearchTarget(SEARCH_TARGETS[selectedCategory as CategoryKey] || "");
    }
  }, [selectedCategory]);

  // Étape 1 : validation localisation + catégorie → ExperiencePopup
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

      setShowExperiencePopup(true);
    },
    [location, selectedCategory]
  );

  // Étape 2 : sélection niveau d'expérience → CategoryPopup
  const handleExperienceSelect = useCallback(
    (level: "debutant" | "intermediaire" | "experimente", years: string) => {
      setExperienceLevel(level);
      setYearsOfExperience(years);
      setShowExperiencePopup(false);
      setShowCategoryPopup(true);
    },
    []
  );

  // Étape 3 : sélection des options → AccessPopup
  const handleOptionSelect = useCallback((options: string[]) => {
    setSelectedOptions(options);
    setShowCategoryPopup(false);
    setShowAccessPopup(true);
  }, []);

  // NOUVEAU : Retour de AccessPopup vers CategoryPopup
  const handleBackToCategoryPopup = useCallback(() => {
    setShowAccessPopup(false);
    setShowCategoryPopup(true);
  }, []);
type AccessFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  additionalInfo: string;
};
  // Étape 4 : validation finale → redirection
const handleAccessValidate = useCallback(
  (formData: AccessFormData) => {
    const params = new URLSearchParams({
      // 🔹 Coordonnées utilisateur
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      additionalInfo: formData.additionalInfo,

      // 🔹 Données métier déjà existantes
      category: selectedCategory,
      searchTarget,
      option: selectedOptions.join(","),
      location,
      experience_level: experienceLevel,
      years_of_experience: yearsOfExperience,
    }).toString();

    router.push(`/complete-registration?${params}`);
    onClose();
  },
  [
    selectedCategory,
    searchTarget,
    selectedOptions,
    location,
    experienceLevel,
    yearsOfExperience,
    router,
    onClose,
  ]
);


  // Liste des catégories optimisée
  const orderedCategories = useMemo(() => {
    const map = Object.fromEntries(categories.map((c) => [c.key, c]));
    return CATEGORY_ORDER.filter((key) => map[key]).map((key) => map[key]);
  }, [categories]);

  return (
    <>
      {/* --- POPUP PRINCIPALE --- */}
      {!showExperiencePopup && !showCategoryPopup && !showAccessPopup && (
        <div
          ref={containerRef}
          className={`dark ${styles.mapWithSearchContainer} ${styles.fadeIn}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="search-title"
        >
          <ToastContainer position="top-right" autoClose={4000} hideProgressBar />

          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fermer la recherche"
          >
            <FaTimes />
          </button>

          <section className={styles.categorySearchSection}>
            <h2 id="search-title">Inscrivez-vous et connectez-vous aux bons partenaires</h2>

            <div className={styles.tripleToggleGroup}>
              {orderedCategories.map(({ key, label, icon }) => {
                const Icon = iconMap[icon];
                const isActive = selectedCategory === key;

                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={isActive}
                    className={`${styles.tripleToggleButton} ${
                      isActive ? styles.active : ""
                    }`}
                    onClick={() => setSelectedCategory(key)}
                  >
                    {Icon && <Icon size="1.3em" style={{ marginRight: 6 }} />}
                    {label}
                  </button>
                );
              })}
            </div>

            {status === "success" && selectedCategory && (
              <div className={`${styles.categoryTextBubble1900} ${styles.fadeIn}`}>
                {DESCRIPTIONS[selectedCategory as CategoryKey]}
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

      {/* --- POPUPS SECONDAIRES --- */}
      {showExperiencePopup && (
        <ExperiencePopup
          onClose={() => setShowExperiencePopup(false)}
          onNext={handleExperienceSelect}
        />
      )}

      {showCategoryPopup && selectedCategory && (
        <CategoryPopup
          category={selectedCategory}
          onClose={() => setShowCategoryPopup(false)}
          onNext={handleOptionSelect}
        />
      )}

      {showAccessPopup && (
        <AccessPopup
          selectedOptions={selectedOptions}
          onClose={() => {
            setShowAccessPopup(false);
            onClose();
          }}
          onBack={handleBackToCategoryPopup}
          onValidate={handleAccessValidate}
        />
      )}
    </>
  );
}