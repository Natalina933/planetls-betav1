import React, { useEffect, useState, useCallback, useMemo } from "react";
import { LucideLoader2 } from "lucide-react";
import styles from "./ServiceCatalogSelector.module.scss";

interface ServiceItem {
    id: number;
    category: string;
    service: string;
    description: string;
    created_at?: string;
    updated_at?: string;
}

interface ServiceCatalogSelectorProps {
    selected: string[];
    onChange: (selected: string[]) => void;
    disabled?: boolean;
    hints?: Record<string, string>;
}

type GroupedCatalog = Record<string, ServiceItem[]>;

const CATEGORY_ORDER = [
    "Ménage",
    "Linge",
    "Accueil",
    "Maintenance",
    "Courses",
    "Administratif",
    "Extérieur",
    "Sécurité",
    "Confort",
    "Éco",
];

const normalizeText = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

const groupServices = (data: ServiceItem[]): GroupedCatalog => {
    return data.reduce((acc: GroupedCatalog, item: ServiceItem) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as GroupedCatalog);
};

const ServiceCatalogSelector: React.FC<ServiceCatalogSelectorProps> = ({
    selected,
    onChange,
    disabled = false,
    hints,
}) => {
    const [catalog, setCatalog] = useState<GroupedCatalog>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<string>("all");

    const toggleCategory = (category: string) => {
        setOpenCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    useEffect(() => {
        const loadCatalog = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch("/api/services/services-catalog");

                if (!response.ok) {
                    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
                }

                const data: ServiceItem[] = await response.json();

                if (!Array.isArray(data)) {
                    throw new Error("Format de données invalide");
                }

                const groupedCatalog = groupServices(data);
                setCatalog(groupedCatalog);

                const initialOpenState: Record<string, boolean> = {};
                Object.keys(groupedCatalog).forEach((category) => {
                    initialOpenState[category] = true;
                });
                setOpenCategories(initialOpenState);
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Erreur inconnue";
                console.error(
                    "[ServiceCatalogSelector] Erreur lors du chargement du catalogue:",
                    errorMessage
                );
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        loadCatalog();
    }, []);

    const toggle = useCallback(
        (serviceName: string) => {
            if (disabled) return;

            const newSelected = selected.includes(serviceName)
                ? selected.filter((x) => x !== serviceName)
                : [...selected, serviceName];

            onChange(newSelected);
        },
        [selected, onChange, disabled]
    );

    const normalizeHintKey = (value: string) =>
        value
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

    const getHintForItem = (item: ServiceItem): string | null => {
        if (!hints) return null;
        const byService = hints[normalizeHintKey(item.service)];
        if (byService) return byService;
        const byCategory = hints[normalizeHintKey(item.category)];
        if (byCategory) return byCategory;
        return null;
    };

    const orderedCategories = useMemo(() => {
        const categories = Object.keys(catalog);
        return categories.sort((a, b) => {
            const indexA = CATEGORY_ORDER.indexOf(a);
            const indexB = CATEGORY_ORDER.indexOf(b);

            if (indexA === -1 && indexB === -1) return a.localeCompare(b, "fr");
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
    }, [catalog]);

    useEffect(() => {
        if (activeCategory !== "all" && !orderedCategories.includes(activeCategory)) {
            setActiveCategory("all");
        }
    }, [activeCategory, orderedCategories]);

    const filteredCatalogEntries = useMemo(() => {
        const normalizedQuery = normalizeText(searchQuery);

        return orderedCategories
            .filter((category) => activeCategory === "all" || category === activeCategory)
            .map((category) => {
                const services = catalog[category] ?? [];
                const filteredServices = normalizedQuery
                    ? services.filter((item) => {
                        const haystack = normalizeText(
                            `${item.service} ${item.description ?? ""} ${item.category}`
                        );
                        return haystack.includes(normalizedQuery);
                    })
                    : services;

                return [category, filteredServices] as const;
            })
            .filter(([, services]) => services.length > 0);
    }, [orderedCategories, activeCategory, searchQuery, catalog]);

    const totalServicesCount = useMemo(
        () =>
            Object.values(catalog).reduce(
                (total, services) => total + services.length,
                0
            ),
        [catalog]
    );

    const filteredServicesCount = useMemo(
        () =>
            filteredCatalogEntries.reduce(
                (total, [, services]) => total + services.length,
                0
            ),
        [filteredCatalogEntries]
    );

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <LucideLoader2 className={styles.loadingSpinner} />
                <p className={styles.loadingText}>
                    Chargement du catalogue de services...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <p className={styles.errorText}>
                    ⚠️ Erreur lors du chargement du catalogue : {error}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className={styles.retryButton}
                >
                    Réessayer
                </button>
            </div>
        );
    }

    if (Object.keys(catalog).length === 0) {
        return (
            <div className={styles.emptyContainer}>
                <p className={styles.emptyText}>
                    Aucun service disponible dans le catalogue.
                </p>
            </div>
        );
    }

    return (
        <div className={styles.serviceCatalog}>
            <p className={styles.catalogIntro}>
                Définissez avec précision les prestations de conciergerie que vous
                proposez. Cette sélection constituera le fondement de votre offre
                professionnelle auprès des propriétaires et de leur clientèle.
            </p>

            <div className={styles.catalogControls}>
                <input
                    type="search"
                    className={styles.searchInput}
                    placeholder="Rechercher un service, une description..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    disabled={disabled}
                />
                <select
                    className={styles.categoryFilter}
                    value={activeCategory}
                    onChange={(event) => setActiveCategory(event.target.value)}
                    disabled={disabled}
                >
                    <option value="all">Toutes les catégories</option>
                    {orderedCategories.map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    className={styles.clearFiltersBtn}
                    onClick={() => {
                        setSearchQuery("");
                        setActiveCategory("all");
                    }}
                    disabled={disabled || (searchQuery === "" && activeCategory === "all")}
                >
                    Réinitialiser
                </button>
            </div>

            <p className={styles.filterMeta}>
                {filteredServicesCount} service{filteredServicesCount > 1 ? "s" : ""} affiché
                {filteredServicesCount > 1 ? "s" : ""} sur {totalServicesCount}
            </p>

            <div className={styles.catalogContent}>
                {filteredCatalogEntries.length === 0 && (
                    <div className={styles.noResult}>
                        Aucun service ne correspond à votre recherche.
                    </div>
                )}

                {filteredCatalogEntries.map(([category, services]) => {
                    const isOpen = openCategories[category] ?? false;
                    const totalServices = services.length;
                    const selectedCount = services.filter((item) =>
                        selected.includes(item.service)
                    ).length;
                    return (
                        <div key={category} className={styles.categorySection}>
                            <button
                                type="button"
                                className={`${styles.categoryHeader} ${isOpen ? styles.categoryHeaderOpen : ""
                                    }`}
                                onClick={() => toggleCategory(category)}
                            >
                                <span className={styles.categoryTitle}>{category}</span>

                                <span className={styles.categoryStats}>
                                    {selectedCount} / {totalServices}
                                </span>

                                <span
                                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""
                                        }`}
                                >
                                    ▾
                                </span>
                            </button>

                            {isOpen && (
                                <div className={styles.serviceGrid}>
                                    {services.map((item) => {
                                        const isSelected = selected.includes(item.service);
                                        const hint = getHintForItem(item);

                                        return (
                                            <label
                                                key={item.id}
                                                className={`${styles.serviceItem} ${isSelected ? styles.selected : ""
                                                    } ${disabled ? styles.disabled : ""}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggle(item.service)}
                                                    disabled={disabled}
                                                    className={styles.serviceCheckbox}
                                                />
                                                <div className={styles.serviceContent}>
                                                    <div className={styles.serviceLabelRow}>
                                                        <span className={styles.serviceLabel}>
                                                            {item.service}
                                                        </span>
                                                        {hint && (
                                                            <span
                                                                className={styles.serviceHintBadge}
                                                                title={hint}
                                                            >
                                                                ?
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={styles.serviceDescription}>
                                                        {item.description}
                                                    </p>
                                                    {hint && (
                                                        <p className={styles.serviceHintText}>{hint}</p>
                                                    )}
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {Object.keys(catalog).length > 0 && (
                <div className={styles.selectedCount}>
                    {selected.length} service
                    {selected.length > 1 ? "s" : ""} sélectionné
                    {selected.length > 1 ? "s" : ""} /
                    {" "}
                    {totalServicesCount} proposé
                    {totalServicesCount > 1
                        ? "s"
                        : ""}
                </div>
            )}

        </div>
    );
};

export default ServiceCatalogSelector;
