"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./MissionDetails.module.scss";
import ServiceCatalogSelector from "@/app/components/ui/ServiceCatalogSelector/ServiceCatalogSelector";
import { FiTarget } from "react-icons/fi";
import type { Profile } from "@/app/dashboard/concierge/profile/ConciergeProfilePage";

/* =========================
   Types
========================= */

interface MissionDetailsProps {
    profile: Profile;
    isEditing: boolean;
    onChangeOption?: (selected: string[]) => void;
    onChangeField?: (
        name: keyof Profile,
        value: string | number | boolean
    ) => void;
}

interface ServiceCatalogItem {
    id: number;
    category: string;
    service: string;
}

interface CategorySummary {
    category: string;
    count: number;
}

/* =========================
   Helpers
========================= */

/**
 * Parse une chaîne JSON de services en tableau
 * Supporte les formats: '["service1","service2"]' ou 'service1,service2'
 */
const parseServicesString = (option: string | null | undefined): string[] => {
    if (!option || option.trim() === "") return [];

    try {
        // Tenter de parser comme JSON d'abord
        if (option.startsWith("[") && option.endsWith("]")) {
            const parsed = JSON.parse(option);
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        }

        // Sinon, traiter comme une chaîne délimitée par des virgules
        return option
            .replace(/^\[|\]$/g, "")
            .split(",")
            .map((s) => s.replace(/"/g, "").trim())
            .filter(Boolean);
    } catch (error) {
        console.error("Erreur lors du parsing des services:", error);
        return [];
    }
};

/* =========================
   Component
========================= */

const MissionDetails: React.FC<MissionDetailsProps> = ({
    profile,
    isEditing,
    onChangeOption,
}) => {
    const { option } = profile;

    /* =========================
       Services actifs
    ========================= */
    const services: string[] = useMemo(
        () => parseServicesString(option),
        [option]
    );

    /* =========================
       Catalogue services (API)
    ========================= */
    const [catalog, setCatalog] = useState<ServiceCatalogItem[]>([]);
    const [loadingCatalog, setLoadingCatalog] = useState(true);
    const [errorCatalog, setErrorCatalog] = useState<string | null>(null);

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                setLoadingCatalog(true);
                setErrorCatalog(null);

                const res = await fetch("/api/services/services-catalog");

                if (!res.ok) {
                    throw new Error(`Erreur HTTP: ${res.status}`);
                }

                const data = await res.json();

                if (!Array.isArray(data)) {
                    throw new Error("Format de données invalide");
                }

                setCatalog(data);
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Erreur inconnue";
                console.error("Erreur chargement catalog services:", error);
                setErrorCatalog(message);
            } finally {
                setLoadingCatalog(false);
            }
        };

        fetchCatalog();
    }, []);

    /* =========================
       Regroupement par catégorie
    ========================= */
    const categorySummary: CategorySummary[] = useMemo(() => {
        if (!catalog.length || !services.length) return [];

        const counts: Record<string, number> = {};

        services.forEach((serviceName) => {
            const found = catalog.find(
                (item) => item.service.toLowerCase() === serviceName.toLowerCase()
            );

            if (!found) {
                console.warn(`Service non trouvé dans le catalogue: ${serviceName}`);
                return;
            }

            counts[found.category] = (counts[found.category] || 0) + 1;
        });

        // Trier par nombre de services (décroissant)
        return Object.entries(counts)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);
    }, [services, catalog]);

    /* =========================
       Handler pour le sélecteur
    ========================= */
    const handleServiceChange = (selected: string[]) => {
        if (onChangeOption) {
            onChangeOption(selected);
        }
    };

    /* =========================
       Render
    ========================= */
    return (
        <div className={styles.wrapper}>
            {/* Services proposés */}
            <div className={`${styles.fieldRow} ${styles.servicesRow}`}>
                <label className={styles.fieldLabel}>
                    <FiTarget className={styles.labelIcon} aria-hidden="true" />
                    Services proposés
                </label>

                {isEditing ? (
                    // Mode édition : affiche le sélecteur
                    <ServiceCatalogSelector
                        selected={services}
                        onChange={handleServiceChange}
                        disabled={false}
                    />
                ) : (
                    // Mode lecture : affiche le résumé
                    <>
                        {loadingCatalog && (
                            <div className={styles.loadingState}>
                                <div className={styles.skeleton} />
                                <div className={styles.skeleton} />
                                <div className={styles.skeleton} />
                            </div>
                        )}

                        {errorCatalog && !loadingCatalog && (
                            <span className={styles.emptyState} role="alert">
                                ⚠️ Erreur: {errorCatalog}
                            </span>
                        )}

                        {!loadingCatalog && !errorCatalog && categorySummary.length > 0 && (
                            <ul className={styles.servicesList} role="list">
                                {categorySummary.map(({ category, count }) => (
                                    <li
                                        key={category}
                                        className={styles.serviceItem}
                                    >
                                        <FiTarget
                                            className={styles.serviceIcon}
                                            aria-hidden="true"
                                        />
                                        <strong>{category}</strong>
                                        <span className={styles.serviceCount}>
                                            {count} service{count > 1 ? "s" : ""}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {!loadingCatalog && !errorCatalog && categorySummary.length === 0 && (
                            <span className={styles.emptyState}>
                                Aucun service sélectionné
                            </span>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MissionDetails;