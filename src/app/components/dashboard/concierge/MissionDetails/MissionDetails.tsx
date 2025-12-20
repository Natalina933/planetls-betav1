"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./MissionDetails.module.scss";
import ServiceCatalogSelector from "@/app/components/ui/ServiceCatalogSelector/ServiceCatalogSelector";
import {
    FiTarget,

} from "react-icons/fi";
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

/* =========================
   Component
========================= */

const MissionDetails: React.FC<MissionDetailsProps> = ({
    profile,
    isEditing,
    onChangeOption,
}) => {
    const {
        option,
    } = profile;


    const services: string[] = useMemo(() => {
        if (!option) return [];

        return option
            .replace(/^\[|\]$/g, "")
            .split(",")
            .map((s) => s.replace(/"/g, "").trim())
            .filter(Boolean);
    }, [option]);

    /* =========================
       Catalogue services (API)
    ========================= */

    const [catalog, setCatalog] = useState<ServiceCatalogItem[]>([]);
    const [loadingCatalog, setLoadingCatalog] = useState(true);

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                const res = await fetch("/api/services/services-catalog");
                if (!res.ok) throw new Error("Failed to fetch services catalog");
                const data = await res.json();
                setCatalog(data);
            } catch (error) {
                console.error("Erreur chargement catalog services", error);
            } finally {
                setLoadingCatalog(false);
            }
        };

        fetchCatalog();
    }, []);

    /* =========================
       Regroupement par catégorie
    ========================= */

    const categorySummary = useMemo(() => {
        if (!catalog.length || !services.length) return [];

        const counts: Record<string, number> = {};

        services.forEach((serviceName) => {
            const found = catalog.find(
                (item) => item.service === serviceName
            );
            if (!found) return;

            counts[found.category] =
                (counts[found.category] || 0) + 1;
        });

        return Object.entries(counts).map(([category, count]) => ({
            category,
            count,
        }));
    }, [services, catalog]);

    /* =========================
       Render
    ========================= */

    return (
        <div className={styles.wrapper}>
            {/* =========================
                Services proposés
            ========================= */}
            <div className={`${styles.fieldRow} ${styles.servicesRow}`}>
                <label className={styles.fieldLabel}>
                    Services proposés :
                </label>

                {isEditing ? (
                    <ServiceCatalogSelector
                        selected={services}
                        onChange={onChangeOption || (() => {})}
                        disabled={!isEditing}
                    />
                ) : loadingCatalog ? (
                    <span className={styles.emptyState}>
                        Chargement des services…
                    </span>
                ) : categorySummary.length > 0 ? (
                    <ul className={styles.servicesList}>
                        {categorySummary.map(({ category, count }) => (
                            <li
                                key={category}
                                className={styles.serviceItem}
                            >
                                <FiTarget
                                    className={styles.serviceIcon}
                                />
                                <strong>{category}</strong>
                                <span
                                    className={styles.serviceCount}
                                >
                                    {count} service
                                    {count > 1 ? "s" : ""}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <span className={styles.emptyState}>
                        Aucun service sélectionné
                    </span>
                )}
            </div>


        </div>
    );
};

export default MissionDetails;
