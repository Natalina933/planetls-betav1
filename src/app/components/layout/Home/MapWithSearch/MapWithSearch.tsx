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
import { FaTimes } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import { SearchBar } from "@/components/ui";

import iconMap from "../../../../lib/iconMap";
import styles from "./MapWithSearch.module.scss";
import "react-toastify/dist/ReactToastify.css";

import CategoryPopup from "../../../popups/CategoryPopup/CategoryPopup";
import AccessPopup from "../../../popups/AccessPopup/AccessPopup";
import ExperiencePopup, {
  ExperienceLevel,
} from "@/app/components/popups/ExperiencePopup/ExperiencePopup";

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

const DESCRIPTIONS: Record<CategoryKey, JSX.Element> = {
  proprietaire: (
    <>
      <span className={styles.highlightGold}>Trouvez la conciergerie idéale</span>{" "}
      pour simplifier la gestion de vos locations et maximiser vos revenus.
    </>
  ),
  concierge: (
    <>
      <span className={styles.highlightGold}>
        Accédez directement aux propriétaires
      </span>{" "}
      qui recherchent une conciergerie fiable et professionnelle.
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
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | "">("");
  const [searchTarget, setSearchTarget] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  const [showExperiencePopup, setShowExperiencePopup] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">("");
  const [yearsExperience, setYearsExperience] = useState("");

  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [showAccessPopup, setShowAccessPopup] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // ACCESSIBILITÉ & UX
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (pathname === "/complete-registration") onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      setStatus("loading");
      try {
        const res = await fetch("/api/categories/groups");
        if (!res.ok) throw new Error("Erreur lors du chargement");

        const data: Category[] = await res.json();
        const first = CATEGORY_ORDER.find((key) =>
          data.some((c) => c.key === key)
        );

        setCategories(data);
        setSelectedCategory(first || data[0]?.key || "");
        setStatus("success");
      } catch (error) {
        console.error("Erreur chargement catégories:", error);
        toast.error("Impossible de charger les catégories.", {
          position: "top-center",
        });
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

  const handleCategoryChange = useCallback((key: CategoryKey) => {
    setSelectedCategory(key);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  const handleSearch = useCallback(
    (query?: string) => {
      const trimmedLocation = (query ?? location).trim();

      if (!trimmedLocation) {
        toast.warn("Veuillez renseigner une localisation.", {
          position: "top-center",
        });
        searchInputRef.current?.focus();
        return;
      }

      if (!selectedCategory) {
        toast.warn("Veuillez sélectionner une catégorie.", {
          position: "top-center",
        });
        return;
      }

      if (trimmedLocation !== location) {
        setLocation(trimmedLocation);
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

      setTimeout(() => {
        setShowCategoryPopup(true);
      }, 150);
    },
    []
  );

  const handleOptionSelect = useCallback((options: string[]) => {
    setSelectedOptions(options);
    setShowCategoryPopup(false);

    setTimeout(() => {
      setShowAccessPopup(true);
    }, 150);
  }, []);

  const handleBackToCategoryPopup = useCallback(() => {
    setShowAccessPopup(false);
    setTimeout(() => {
      setShowCategoryPopup(true);
    }, 150);
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
        location: location.trim(),
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

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const orderedCategories = useMemo(() => {
    const map = Object.fromEntries(categories.map((c) => [c.key, c]));
    return CATEGORY_ORDER.filter((key) => map[key]).map((key) => map[key]);
  }, [categories]);

  const isMainModalVisible =
    !showExperiencePopup && !showCategoryPopup && !showAccessPopup;

  return (
    <>
      <button
        className={styles.globalCloseButton}
        onClick={onClose}
        aria-label="Fermer"
        type="button"
      >
        <FaTimes />
      </button>
      {isMainModalVisible && (
        <div
          className={styles.searchOverlay}
          onClick={handleOverlayClick}
          role="presentation"
        >
          <div
            ref={containerRef}
            className={styles.mapWithSearchContainer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <ToastContainer
              position="top-center"
              autoClose={4000}
              hideProgressBar={false}
              closeOnClick
              pauseOnHover
              draggable
            />

            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Fermer la fenêtre"
              type="button"
            >
              <FaTimes />
            </button>

            <section className={styles.categorySearchSection}>
              <h2 id="modal-title">
                Inscrivez-vous et connectez-vous aux bons partenaires
              </h2>

              <div
                className={styles.tripleToggleGroup}
                role="group"
                aria-label="Catégories"
              >
                {orderedCategories.map(({ key, label, icon }) => {
                  const Icon = iconMap[icon];
                  const isActive = selectedCategory === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={isActive}
                      aria-label={`Catégorie ${label}`}
                      className={`${styles.tripleToggleButton} ${
                        isActive ? styles.active : ""
                      }`}
                      onClick={() => handleCategoryChange(key)}
                    >
                      {Icon && <Icon className={styles.toggleIcon} />}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {status === "success" && selectedCategory && (
                <div className={styles.categoryTextBubble1900}>
                  {DESCRIPTIONS[selectedCategory]}
                </div>
              )}

              <SearchBar
                className={styles.searchBar}
                defaultValue={location}
                placeholder="Ou recherchez-vous ?"
                buttonLabel="Rechercher"
                inputRef={searchInputRef}
                onSearch={handleSearch}
                inputProps={{
                  type: "search",
                  required: true,
                  autoComplete: "off",
                  spellCheck: "false",
                  onChange: (event) => setLocation(event.target.value),
                }}
              />
            </section>
          </div>
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
            location: location.trim(),
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


