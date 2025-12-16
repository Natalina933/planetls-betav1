"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./MissionDetails.module.scss";
import ServiceCatalogSelector from "@/app/components/ui/ServiceCatalogSelector/ServiceCatalogSelector";
import {
    FiMapPin,
    FiClock,
    FiTarget,
    FiAlertCircle,
} from "react-icons/fi";
import type { Profile } from "@/app/dashboard/concierge/profile/page";

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
    onChangeField,
}) => {
    const {
        option,
        service_area,
        service_radius_km,
        availability_hours,
        emergency_service,
    } = profile;

    /* =========================
       Services sélectionnés
    ========================= */

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

            {/* =========================
                Zone d’intervention
            ========================= */}
            <div className={styles.fieldRow}>
                <FiMapPin className={styles.fieldIcon} />
                <span className={styles.fieldLabel}>
                    Zone d&apos;intervention :
                </span>
                {isEditing ? (
                    <input
                        type="text"
                        value={service_area || ""}
                        onChange={(e) =>
                            onChangeField?.(
                                "service_area",
                                e.target.value
                            )
                        }
                        className={styles.fieldInput}
                        placeholder="Paris et Île-de-France"
                    />
                ) : (
                    <span className={styles.fieldValue}>
                        {service_area || "Non définie"}
                    </span>
                )}
            </div>

            {/* =========================
                Rayon d’intervention
            ========================= */}
            <div className={styles.fieldRow}>
                <FiMapPin className={styles.fieldIcon} />
                <span className={styles.fieldLabel}>
                    Rayon (km) :
                </span>
                {isEditing ? (
                    <input
                        type="number"
                        value={service_radius_km ?? ""}
                        onChange={(e) =>
                            onChangeField?.(
                                "service_radius_km",
                                Number(e.target.value)
                            )
                        }
                        className={styles.fieldInput}
                        placeholder="30"
                    />
                ) : (
                    <span className={styles.fieldValue}>
                        {service_radius_km ?? "—"}
                    </span>
                )}
            </div>

            {/* =========================
                Horaires
            ========================= */}
            <div className={styles.fieldRow}>
                <FiClock className={styles.fieldIcon} />
                <span className={styles.fieldLabel}>
                    Horaires :
                </span>
                {isEditing ? (
                    <input
                        type="text"
                        value={availability_hours || ""}
                        onChange={(e) =>
                            onChangeField?.(
                                "availability_hours",
                                e.target.value
                            )
                        }
                        className={styles.fieldInput}
                        placeholder="Lun–Ven 8h–20h"
                    />
                ) : (
                    <span className={styles.fieldValue}>
                        {availability_hours || "—"}
                    </span>
                )}
            </div>

            {/* =========================
                Service d’urgence
            ========================= */}
            <div className={styles.fieldRow}>
                <FiAlertCircle className={styles.fieldIcon} />
                <span className={styles.fieldLabel}>
                    Service d&apos;urgence 24/7 :
                </span>
                {isEditing ? (
                    <input
                        type="checkbox"
                        className={styles.checkboxCustom}
                        checked={!!emergency_service}
                        onChange={(e) =>
                            onChangeField?.(
                                "emergency_service",
                                e.target.checked
                            )
                        }
                    />
                ) : (
                    <span className={styles.fieldValue}>
                        {emergency_service ? "Oui" : "Non"}
                    </span>
                )}
            </div>
        </div>
    );
};

export default MissionDetails;
