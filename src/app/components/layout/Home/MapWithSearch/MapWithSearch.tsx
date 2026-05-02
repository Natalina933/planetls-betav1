"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  JSX,
} from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { FaTimes } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import { Button, SearchBar } from "@/components/ui";

import iconMap from "../../../../lib/iconMap";
import styles from "./MapWithSearch.module.scss";

import CategoryPopup from "../../../popups/CategoryPopup/CategoryPopup";
import AccessPopup from "../../../popups/AccessPopup/AccessPopup";
import ExperiencePopup, {
  ExperienceLevel,
} from "@/app/components/popups/ExperiencePopup/ExperiencePopup";
import OnboardingStepHeader from "@/app/components/onboarding/OnboardingStepHeader/OnboardingStepHeader";
import useReadabilityScale from "@/app/components/onboarding/useReadabilityScale";

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
  companyName: string;
  legalForm: string;
  serviceRadiusKm: string;
  availability: string;
  missionPreference: string;
  signupMode: string;
  onboardingGoal: string;
  supportNeed: string;
  existingTools: string[];
  businessLink: string;
  propertyTypes: string[];
}

interface LocationSuggestion {
  placeId: string;
  label: string;
  displayName: string;
}

interface GeocodeLookupPayload {
  error?: string;
  label?: string;
  displayName?: string;
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
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [validatedLocation, setValidatedLocation] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  const [showExperiencePopup, setShowExperiencePopup] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">("");
  const [yearsExperience, setYearsExperience] = useState("");

  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [showAccessPopup, setShowAccessPopup] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [signupMode, setSignupMode] = useState("simple");
  const { readabilityScale, setReadabilityScale } = useReadabilityScale();
  const isMainModalVisible =
    !showExperiencePopup && !showCategoryPopup && !showAccessPopup;
  const shouldEnableMainScroll =
    readabilityScale !== "normal" || locationSearching || locationSuggestions.length > 0;

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

  useEffect(() => {
    const query = location.trim();

    if (!isMainModalVisible || query.length < 2 || (validatedLocation && query === validatedLocation)) {
      setLocationSuggestions([]);
      setLocationSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setLocationSearching(true);
        const response = await fetch(
          `/api/geocode?q=${encodeURIComponent(query)}&mode=suggest&limit=6`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as {
          error?: string;
          suggestions?: LocationSuggestion[];
        };

        if (!response.ok) {
          throw new Error(payload.error || "Recherche de ville impossible.");
        }

        setLocationSuggestions(Array.isArray(payload.suggestions) ? payload.suggestions : []);
      } catch {
        if (controller.signal.aborted) {
          return;
        }
        setLocationSuggestions([]);
      } finally {
        if (!controller.signal.aborted) {
          setLocationSearching(false);
        }
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [isMainModalVisible, location, validatedLocation]);

  const handleCategoryChange = useCallback((key: CategoryKey) => {
    setSelectedCategory(key);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  const resolveLocationLabel = useCallback(async (query: string) => {
    const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
    const payload = (await response.json()) as GeocodeLookupPayload;

    if (
      !response.ok ||
      (typeof payload.displayName !== "string" && typeof payload.label !== "string")
    ) {
      throw new Error(payload.error || "Veuillez sélectionner une ville reconnue.");
    }

    return payload.displayName ?? payload.label!;
  }, []);

  const handleSearch = useCallback(
    async (query?: string) => {
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

      try {
        const resolvedLocation = await resolveLocationLabel(trimmedLocation);
        if (resolvedLocation !== location) {
          setLocation(resolvedLocation);
        }
        setValidatedLocation(resolvedLocation);
      } catch (error) {
        toast.warn(
          error instanceof Error
            ? error.message
            : "Veuillez sélectionner une ville reconnue.",
          { position: "top-center" },
        );
        searchInputRef.current?.focus();
        return;
      }

      setShowExperiencePopup(true);
    },
    [location, resolveLocationLabel, selectedCategory]
  );

  const handleExperienceSelect = useCallback(
    (level: ExperienceLevel, years: string) => {
      setExperienceLevel(level);
      setYearsExperience(years);
      setSignupMode((current) =>
        selectedCategory === "concierge" && level === "experimente" && current === "simple"
          ? "express"
          : current
      );
      setShowExperiencePopup(false);

      setTimeout(() => {
        setShowCategoryPopup(true);
      }, 150);
    },
    [selectedCategory]
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
        companyName: formData.companyName,
        legalForm: formData.legalForm,
        serviceRadiusKm: formData.serviceRadiusKm,
        availability: formData.availability,
        missionPreference: formData.missionPreference,
        signupMode: formData.signupMode,
        onboardingGoal: formData.onboardingGoal,
        supportNeed: formData.supportNeed,
        existingTools: formData.existingTools.join(","),
        businessLink: formData.businessLink,
        propertyTypes: formData.propertyTypes.join(","),
        category: selectedCategory,
        searchTarget,
        option: selectedOptions.join(","),
        location: (validatedLocation ?? location).trim(),
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
      validatedLocation,
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

  const accessInitialData = useMemo(() => ({ signupMode }), [signupMode]);

  return (
    <>
      {isMainModalVisible && (
        <div
          className={styles.searchOverlay}
          onClick={handleOverlayClick}
          role="presentation"
        >
          <div
            ref={containerRef}
            className={[
              styles.mapWithSearchContainer,
              shouldEnableMainScroll ? styles.scrollEnabled : "",
            ].filter(Boolean).join(" ")}
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

            <Button
              variant="ghost"
              size="sm"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Fermer la fenêtre"
              type="button"
            >
              <FaTimes />
            </Button>

            <section className={styles.categorySearchSection}>
              <OnboardingStepHeader
                title="Étape 1/5 - Votre région"
                step={1}
                readabilityScale={readabilityScale}
                onReadabilityChange={setReadabilityScale}
              />

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
                    <Button
                      key={key}
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-pressed={isActive}
                      aria-label={`Catégorie ${label}`}
                      className={`${styles.tripleToggleButton} ${
                        isActive ? styles.active : ""
                      }`}
                      onClick={() => handleCategoryChange(key)}
                    >
                      {key === "concierge" ? (
                        <Image
                          src="/icons/Mini_logo.svg"
                          alt=""
                          className={styles.toggleLogo}
                          aria-hidden="true"
                          width={20}
                          height={20}
                        />
                      ) : (
                        Icon && <Icon className={styles.toggleIcon} />
                      )}
                      <span>{label}</span>
                    </Button>
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
                value={location}
                placeholder="Votre ville ou arrondissement"
                buttonLabel="Rechercher"
                buttonClassName={validatedLocation ? styles.searchButtonReady : ""}
                inputRef={searchInputRef}
                onSearch={handleSearch}
                inputProps={{
                  type: "search",
                  required: true,
                  autoComplete: "off",
                  spellCheck: "false",
                  onChange: (event) => {
                    setLocation(event.target.value);
                    setValidatedLocation(null);
                  },
                }}
              />

              {locationSearching ? (
                <p className={styles.locationHint}>Recherche de villes reconnues...</p>
              ) : null}

              {!validatedLocation && locationSuggestions.length > 0 ? (
                <div className={styles.suggestionsPanel}>
                  {locationSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.placeId}
                      type="button"
                      className={styles.suggestionBtn}
                      onClick={() => {
                        setLocation(suggestion.displayName);
                        setValidatedLocation(suggestion.displayName);
                        setLocationSuggestions([]);
                      }}
                    >
                      <strong>{suggestion.label}</strong>
                      <span>{suggestion.displayName}</span>
                    </button>
                  ))}
                </div>
              ) : null}

            </section>
          </div>
        </div>
      )}

      {showExperiencePopup && (
        <ExperiencePopup
          category={selectedCategory || undefined}
          onClose={() => setShowExperiencePopup(false)}
          onValidate={handleExperienceSelect}
        />
      )}

      {showCategoryPopup && selectedCategory && (
        <CategoryPopup
          category={selectedCategory}
          experienceLevel={experienceLevel}
          signupMode={signupMode}
          onSignupModeChange={setSignupMode}
          onClose={() => setShowCategoryPopup(false)}
          onNext={handleOptionSelect}
        />
      )}

      {showAccessPopup && (
        <AccessPopup
          selectedOptions={selectedOptions}
          initialData={accessInitialData}
          recap={{
            category: selectedCategory,
            searchTarget,
            location: (validatedLocation ?? location).trim(),
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


