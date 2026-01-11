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
import { FaTimes, FaSearch } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";

import iconMap from "../../../../lib/iconMap";
import styles from "./MapWithSearch.module.scss";
import "react-toastify/dist/ReactToastify.css";

import CategoryPopup from "../../../popups/CategoryPopup/CategoryPopup";
import AccessPopup from "../../../popups/AccessPopup/AccessPopup";
import ExperiencePopup, {
  ExperienceLevel,
} from "@/app/components/popups/ExperiencePopup/ExperiencePopup";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

type CategoryKey = "proprietaire" | "concierge" | "artisan";

interface Category {
  key: CategoryKey;
  label: string;
  icon: keyof typeof iconMap;
}

interface MapWithSearchProps {
  onClose: () => void;
}

interface AccessFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  additionalInfo: string;
}

// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------

const DESCRIPTIONS: Record<CategoryKey, JSX.Element> = {
  proprietaire: (
    <>
      <span className={styles.highlightGold}>Trouvez la conciergerie idéale</span>{" "}
      pour simplifier la gestion de vos locations.
    </>
  ),
  concierge: (
    <>
      <span className={styles.highlightGold}>
        Accédez directement aux propriétaires
      </span>{" "}
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

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------

export default function MapWithSearch({ onClose }: MapWithSearchProps) {
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | "">("");
  const [searchTarget, setSearchTarget] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  const [showExperiencePopup, setShowExperiencePopup] = useState(false);

  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">("");
  const [yearsExperience, setYearsExperience] = useState("");

  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [showAccessPopup, setShowAccessPopup] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // ---------------------------------------------------------------------------
  // ACCESSIBILITÉ
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusable[0]?.focus();
  }, []);

  useEffect(() => {
    if (pathname === "/complete-registration") onClose();
  }, [pathname, onClose]);

  // ---------------------------------------------------------------------------
  // DATA
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const fetchCategories = async () => {
      setStatus("loading");
      try {
        const res = await fetch("/api/categories/groups");
        if (!res.ok) throw new Error();

        const data: Category[] = await res.json();
        const first = CATEGORY_ORDER.find((key) =>
          data.some((c) => c.key === key)
        );

        setCategories(data);
        setSelectedCategory(first || data[0]?.key || "");
        setStatus("success");
      } catch {
        toast.error("Impossible de charger les filtres 😢");
        setStatus("error");
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setSearchTarget(SEARCH_TARGETS[selectedCategory]);
    }
  }, [selectedCategory]);

  // ---------------------------------------------------------------------------
  // FLOW
  // ---------------------------------------------------------------------------

  const handleSearch = useCallback(
    (e?: React.FormEvent) => {
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

  const handleExperienceSelect = useCallback(
    (level: ExperienceLevel, years: string) => {
      setExperienceLevel(level);
      setYearsExperience(years);
      setShowExperiencePopup(false);
      setShowCategoryPopup(true);
    },
    []
  );

  const handleOptionSelect = useCallback((options: string[]) => {
    setSelectedOptions(options);
    setShowCategoryPopup(false);
    setShowAccessPopup(true);
  }, []);

  const handleBackToCategoryPopup = useCallback(() => {
    setShowAccessPopup(false);
    setShowCategoryPopup(true);
  }, []);

  const handleAccessValidate = useCallback(
    (formData: AccessFormData) => {
      const params = new URLSearchParams({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        additionalInfo: formData.additionalInfo,
        category: selectedCategory,
        searchTarget,
        option: selectedOptions.join(","),
        location,
        experienceLevel,
        yearsExperience,
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
      yearsExperience,
      router,
      onClose,
    ]
  );

  // ---------------------------------------------------------------------------
  // MEMO
  // ---------------------------------------------------------------------------

  const orderedCategories = useMemo(() => {
    const map = Object.fromEntries(categories.map((c) => [c.key, c]));
    return CATEGORY_ORDER.filter((key) => map[key]).map((key) => map[key]);
  }, [categories]);

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <>
      {!showExperiencePopup && !showCategoryPopup && !showAccessPopup && (
        <div
          ref={containerRef}
          className={`dark ${styles.mapWithSearchContainer} ${styles.fadeIn}`}
          role="dialog"
          aria-modal="true"
        >
          <ToastContainer position="top-right" autoClose={4000} />

          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fermer"
          >
            <FaTimes />
          </button>

          <section className={styles.categorySearchSection}>
            <h2>Inscrivez-vous et connectez-vous aux bons partenaires</h2>

            <div className={styles.tripleToggleGroup}>
              {orderedCategories.map(({ key, label, icon }) => {
                const Icon = iconMap[icon];
                const active = selectedCategory === key;

                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    className={`${styles.tripleToggleButton} ${active ? styles.active : ""
                      }`}
                    onClick={() => setSelectedCategory(key)}
                  >
                    {Icon && <Icon size="1.3em" />} {label}
                  </button>
                );
              })}
            </div>

            {status === "success" && selectedCategory && (
              <div className={`${styles.categoryTextBubble1900} ${styles.fadeIn}`}>
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
                aria-label="Localisation"
              />

              {/* Bouton RECHERCHE */}
              <button
                type="submit"
                className={styles.searchButton}
                aria-label="Lancer la recherche"
              >
                <FaSearch />
              </button>

              {/* Bouton FERMER */}
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Fermer la fenêtre"
              >
                <FaTimes />
              </button>
            </form>

          </section>
        </div>
      )}

      {showExperiencePopup && (
        <ExperiencePopup
          onClose={() => setShowExperiencePopup(false)}
          onValidate={handleExperienceSelect}
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
          recap={{
            category: selectedCategory,
            searchTarget,
            location,
            experienceLevel,
            yearsExperience,
          }}
          onBack={handleBackToCategoryPopup}
          onClose={() => {
            setShowAccessPopup(false);
            onClose();
          }}
          onValidate={handleAccessValidate}
        />

      )}
    </>
  );
}
