import React, { useEffect, useState, useCallback, useMemo } from "react";
import { LucideLoader2 } from "lucide-react";
import { ServiceCatalogPicker } from "@/components/ui";
import {
    groupServiceCatalog,
    sortServiceCatalogCategories,
    type ServiceCatalogItem,
} from "@/app/lib/serviceCatalog";
import styles from "./ServiceCatalogSelector.module.scss";

interface ServiceItem extends ServiceCatalogItem {
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
    introText?: string;
    searchPlaceholder?: string;
    priorityCategories?: string[];
    initialCategoryCount?: number;
    recentServices?: string[];
}

type GroupedCatalog = Record<string, ServiceItem[]>;

const normalizeText = (value: string): string =>
    value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

const groupServices = (data: ServiceItem[]): GroupedCatalog => {
    return groupServiceCatalog(data).reduce((acc: GroupedCatalog, group) => {
        acc[group.category] = group.services as ServiceItem[];
        return acc;
    }, {} as GroupedCatalog);
};

const ServiceCatalogSelector: React.FC<ServiceCatalogSelectorProps> = ({
    selected,
    onChange,
    disabled = false,
    introText,
    searchPlaceholder = "Rechercher un service, une description...",
    priorityCategories = [],
    initialCategoryCount = 5,
    recentServices = [],
}) => {
    const [catalog, setCatalog] = useState<GroupedCatalog>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [showAllCategories, setShowAllCategories] = useState(false);

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

    const orderedCategories = useMemo(() => {
        const categories = Object.keys(catalog);
        return categories.sort((a, b) => {
            const priorityIndexA = priorityCategories.indexOf(a);
            const priorityIndexB = priorityCategories.indexOf(b);

            if (priorityIndexA !== -1 || priorityIndexB !== -1) {
                if (priorityIndexA === -1) return 1;
                if (priorityIndexB === -1) return -1;
                return priorityIndexA - priorityIndexB;
            }

            return sortServiceCatalogCategories(a, b);
        });
    }, [catalog, priorityCategories]);

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

    const visibleCatalogEntries = useMemo(() => {
        if (searchQuery.trim() || activeCategory !== "all" || showAllCategories) {
            return filteredCatalogEntries;
        }

        return filteredCatalogEntries.slice(0, initialCategoryCount);
    }, [filteredCatalogEntries, searchQuery, activeCategory, showAllCategories, initialCategoryCount]);

    const hiddenCategoryCount = Math.max(filteredCatalogEntries.length - visibleCatalogEntries.length, 0);
    const visibleCatalogItems = useMemo(
        () => visibleCatalogEntries.flatMap(([, services]) => services),
        [visibleCatalogEntries]
    );
    const selectedServicesPreview = useMemo(() => selected.slice(0, 6), [selected]);
    const recentServicesPreview = useMemo(
        () => recentServices.filter((service) => !selected.includes(service)).slice(0, 6),
        [recentServices, selected]
    );

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <LucideLoader2 className={styles.loadingSpinner} />
                <p className={styles.loadingText}>Chargement du catalogue de services...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <p className={styles.errorText}>⚠️ Erreur lors du chargement du catalogue : {error}</p>
                <button onClick={() => window.location.reload()} className={styles.retryButton}>
                    Réessayer
                </button>
            </div>
        );
    }

    if (Object.keys(catalog).length === 0) {
        return (
            <div className={styles.emptyContainer}>
                <p className={styles.emptyText}>Aucun service disponible dans le catalogue.</p>
            </div>
        );
    }

    return (
        <div className={styles.serviceCatalog}>
            {introText && (
                <p className={styles.catalogIntro}>
                    Définissez avec précision les prestations de conciergerie que vous proposez.
                    Cette sélection constituera le fondement de votre offre professionnelle auprès
                    des propriétaires et de leur clientèle.
                </p>
            )}

            <div className={styles.catalogControls}>
                <label htmlFor="category-filter" className={styles.visuallyHidden}>
                    Filtrer par catégorie
                </label>
                <input
                    type="search"
                    className={styles.searchInput}
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    disabled={disabled}
                />
                <select
                    id="category-filter"
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

            <div className={styles.catalogActionsRow}>
                <span className={styles.catalogSelectionCount}>
                    {selected.length} sélectionné{selected.length > 1 ? "s" : ""}
                </span>
            </div>

            {hiddenCategoryCount > 0 && (
                <div className={styles.catalogPreviewRow}>
                    <p className={styles.catalogPreviewText}>
                        {visibleCatalogEntries.length} catégories affichées, {hiddenCategoryCount} masquée
                        {hiddenCategoryCount > 1 ? "s" : ""}.
                    </p>
                    <button
                        type="button"
                        className={styles.catalogPreviewButton}
                        onClick={() => setShowAllCategories((current) => !current)}
                    >
                        {showAllCategories ? "Afficher moins" : "Voir tout le catalogue"}
                    </button>
                </div>
            )}

            {selectedServicesPreview.length > 0 && (
                <div className={styles.quickAccessBlock}>
                    <p className={styles.quickAccessTitle}>Déjà sélectionnés</p>
                    <div className={styles.quickAccessList}>
                        {selectedServicesPreview.map((service) => (
                            <button
                                key={`selected-${service}`}
                                type="button"
                                className={`${styles.quickAccessChip} ${styles.quickAccessChipActive}`}
                                onClick={() => toggle(service)}
                                disabled={disabled}
                            >
                                {service}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {recentServicesPreview.length > 0 && (
                <div className={styles.quickAccessBlock}>
                    <p className={styles.quickAccessTitle}>Plus utilisés récemment</p>
                    <div className={styles.quickAccessList}>
                        {recentServicesPreview.map((service) => (
                            <button
                                key={`recent-${service}`}
                                type="button"
                                className={styles.quickAccessChip}
                                onClick={() => toggle(service)}
                                disabled={disabled}
                            >
                                {service}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className={styles.catalogContent}>
                {filteredCatalogEntries.length === 0 ? (
                    <div className={styles.noResult}>Aucun service ne correspond à votre recherche.</div>
                ) : (
                    <ServiceCatalogPicker
                        items={visibleCatalogItems}
                        selected={selected}
                        onChange={onChange}
                        disabled={disabled}
                        mode="offer"
                    />
                )}
            </div>
        </div>
    );
};

export default ServiceCatalogSelector;
