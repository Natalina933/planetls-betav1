//src/app/components/dashboard/concierge/MissionDetails/MissionDetails.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiAlertCircle, FiLoader } from "react-icons/fi";
import styles from "./MissionDetails.module.scss";
import ServiceCatalogSelector from "@/app/components/ui/ServiceCatalogSelector/ServiceCatalogSelector";
import {
    buildDetailedMissionSummary,
    type DetailedMissionCategory,
} from "./missionCatalogSummary";

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
    const detailedSummary: DetailedMissionCategory[] = useMemo(
        () => (loadingCatalog ? [] : buildDetailedMissionSummary(activeServices, catalog)),
        [activeServices, catalog, loadingCatalog]
    );

    const activeCategoryCount = detailedSummary.length;
    const selectedServiceCount = activeServices.length;

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <p className={styles.eyebrow}>Catalogue missions</p>
                    <h3 className={styles.title}>Services proposés</h3>
                    <p className={styles.description}>
                        Retrouvez ici votre offre active, regroupée par famille de services pour une lecture plus claire.
                    </p>
                </div>
                <div className={styles.metrics}>
                    <div className={styles.metric}>
                        <span>Catégories</span>
                        <strong>{activeCategoryCount}</strong>
                    </div>
                    <div className={styles.metric}>
                        <span>Services</span>
                        <strong>{selectedServiceCount}</strong>
                    </div>
                </div>
            </div>

            <div className={styles.contentSection}>
                <div className={styles.servicesScroll}>
                    {isEditing ? (
                        <div className={styles.editorBox}>
                            <ServiceCatalogSelector
                                selected={activeServices}
                                onChange={(vals) => onChangeOption?.(vals)}
                                disabled={loadingCatalog}
                                hints={{
                                    menage: "Entre deux séjours, grand ménage, remise en état, fin de location.",
                                    accueil: "Check-in/check-out voyageurs, accueil VIP, remise des clés.",
                                    maintenance: "Interventions techniques, suivi prestataires, dépannage léger.",
                                    administratif: "Coordination contrats, suivi incidents, reporting propriétaire.",
                                }}
                            />
                        </div>
                    ) : (
                        <div className={styles.viewerBox}>
                            {loadingCatalog && <div className={styles.loading}><FiLoader className={styles.spin} /></div>}

                            {errorCatalog && <div className={styles.error}><FiAlertCircle /> {errorCatalog}</div>}

                            {!loadingCatalog && detailedSummary.length > 0 && (
                                <div className={styles.activeCategories}>
                                    {detailedSummary.map((group) => (
                                        <span key={group.category} className={styles.categoryPill}>
                                            {group.category}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {!loadingCatalog && detailedSummary.map((group) => (
                                <div key={group.category} className={styles.categoryCard}>
                                    <div className={styles.categoryHeader}>
                                        <h4 className={styles.categoryTitle}>
                                            {group.category}
                                        </h4>
                                        <span className={styles.badge}>{group.services.length}</span>
                                    </div>
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
        </div>
    );
};

export default MissionDetails;

