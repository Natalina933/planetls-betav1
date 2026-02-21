"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiAlertCircle, FiLoader } from "react-icons/fi";
import styles from "./MissionDetails.module.scss";
import ServiceCatalogSelector from "@/app/components/ui/ServiceCatalogSelector/ServiceCatalogSelector";

/* =========================
    Types
========================= */

interface MissionDetailsProps {
    selectedServices: string[];
    isEditing: boolean;
    onChangeOption?: (selected: string[]) => void;
}

interface ServiceCatalogItem {
    id: number;
    category: string;
    service: string;
}

interface DetailedCategory {
    category: string;
    services: string[];
}

/* =========================
    Helpers
========================= */

/* =========================
    Component
========================= */

const MissionDetails: React.FC<MissionDetailsProps> = ({
    selectedServices,
    isEditing,
    onChangeOption,
}) => {
    const [catalog, setCatalog] = useState<ServiceCatalogItem[]>([]);
    const [loadingCatalog, setLoadingCatalog] = useState(true);
    const [errorCatalog, setErrorCatalog] = useState<string | null>(null);

    const activeServices = useMemo(
        () => selectedServices.filter(Boolean),
        [selectedServices]
    );

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                setLoadingCatalog(true);
                const res = await fetch("/api/services/services-catalog");
                if (!res.ok) throw new Error("Erreur de chargement du catalogue");
                const data = await res.json();
                setCatalog(Array.isArray(data) ? data : []);
            } catch (error) {
                setErrorCatalog(error instanceof Error ? error.message : "Erreur");
            } finally {
                setLoadingCatalog(false);
            }
        };
        fetchCatalog();
    }, []);

    // 3. Mapping détaillé (Strictement basé sur le catalogue)
    const detailedSummary: DetailedCategory[] = useMemo(() => {
        if (loadingCatalog || !catalog.length || !activeServices.length) return [];

        const groups: Record<string, string[]> = {};

        activeServices.forEach((serviceName) => {
            const normalizedInput = serviceName.trim().toLowerCase();

            // On cherche si le service de l'inscription correspond à une CATEGORIE ou un SERVICE du SQL
            const found = catalog.find((item) => {
                const s = item.service.toLowerCase();
                const c = item.category.toLowerCase();
                // Match si le nom de l'inscription est inclus dans la catégorie ou vice-versa
                return s.includes(normalizedInput) || normalizedInput.includes(s) ||
                    c.includes(normalizedInput) || normalizedInput.includes(c);
            });

            // UN SERVICE EST AFFICHÉ UNIQUEMENT S'IL EXISTE DANS LE CATALOGUE
            if (found) {
                if (!groups[found.category]) groups[found.category] = [];
                if (!groups[found.category].includes(found.service)) {
                    groups[found.category].push(found.service);
                }
            }
        });

        // Tri par les catégories officielles
        const order = ["Ménage", "Linge", "Accueil", "Maintenance", "Courses", "Administratif", "Extérieur", "Sécurité", "Confort", "Éco"];

        return Object.entries(groups)
            .map(([category, services]) => ({ category, services }))
            .sort((a, b) => {
                const indexA = order.indexOf(a.category);
                const indexB = order.indexOf(b.category);
                return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
            });
    }, [activeServices, catalog, loadingCatalog]);

    return (
        <div className={styles.wrapper}>
            <div className={styles.contentSection}>
                {isEditing ? (
                    <div className={styles.editorBox}>
                        <p className={styles.infoText}>Mettez à jour vos prestations :</p>
                        <ServiceCatalogSelector
                            selected={activeServices}
                            onChange={(vals) => onChangeOption?.(vals)}
                            disabled={loadingCatalog}
                        />
                    </div>
                ) : (
                    <div className={styles.viewerBox}>
                        {loadingCatalog && <div className={styles.loading}><FiLoader className={styles.spin} /></div>}

                        {errorCatalog && <div className={styles.error}><FiAlertCircle /> {errorCatalog}</div>}

                        {!loadingCatalog && detailedSummary.map((group) => (
                            <div key={group.category} className={styles.categoryCard}>
                                <h4 className={styles.categoryTitle}>
                                    {group.category}
                                    <span className={styles.badge}>{group.services.length}</span>
                                </h4>
                                <ul className={styles.serviceList}>
                                    {group.services.map((s, i) => (
                                        <li key={i} className={styles.serviceItem}>
                                            <FiCheckCircle className={styles.checkIcon} />
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}

                        {!loadingCatalog && detailedSummary.length === 0 && !errorCatalog && (
                            <div className={styles.empty}>Aucun service reconnu. Veuillez éditer votre profil.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MissionDetails;
