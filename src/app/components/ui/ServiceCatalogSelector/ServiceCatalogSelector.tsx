import React, { useEffect, useState, useCallback } from "react";
import { LucideLoader2 } from 'lucide-react';
import styles from './ServiceCatalogSelector.module.scss';

// --- Définitions de types TypeScript ---

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
}

type GroupedCatalog = Record<string, ServiceItem[]>;

// Fonction pour grouper les services par catégorie
const groupServices = (data: ServiceItem[]): GroupedCatalog => {
    return data.reduce((acc: GroupedCatalog, item: ServiceItem) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as GroupedCatalog);
};

// Le composant principal ServiceCatalogSelector
const ServiceCatalogSelector: React.FC<ServiceCatalogSelectorProps> = ({
    selected,
    onChange,
    disabled = false
}) => {
    const [catalog, setCatalog] = useState<GroupedCatalog>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Chargement du catalogue depuis l'API au montage
    useEffect(() => {
        const loadCatalog = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/services/services-catalog');

                if (!response.ok) {
                    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
                }

                const data: ServiceItem[] = await response.json();

                if (!Array.isArray(data)) {
                    throw new Error('Format de données invalide');
                }

                const groupedCatalog = groupServices(data);
                setCatalog(groupedCatalog);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
                console.error("[ServiceCatalogSelector] Erreur lors du chargement du catalogue:", errorMessage);
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        loadCatalog();
    }, []);

    // Fonction de basculement
    const toggle = useCallback((serviceName: string) => {
        if (disabled) return;

        const newSelected = selected.includes(serviceName)
            ? selected.filter(x => x !== serviceName)
            : [...selected, serviceName];

        onChange(newSelected);
    }, [selected, onChange, disabled]);

    // État de chargement
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <LucideLoader2 className={styles.loadingSpinner} />
                <p className={styles.loadingText}>Chargement du catalogue de services...</p>
            </div>
        );
    }

    // État d'erreur
    if (error) {
        return (
            <div className={styles.errorContainer}>
                <p className={styles.errorText}>
                    ❌ Erreur lors du chargement du catalogue : {error}
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

    // Aucun service disponible
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
                Définissez avec précision les prestations de conciergerie que vous proposez.
                Cette sélection constituera le fondement de votre offre professionnelle auprès des propriétaires et de leur clientèle.
            </p>

            <div className={styles.catalogContent}>
                {Object.entries(catalog).map(([category, services]) => (
                    <div key={category} className={styles.categorySection}>
                        <h3 className={styles.categoryHeader}>{category}</h3>
                        <div className={styles.serviceGrid}>
                            {services.map((item) => {
                                const isSelected = selected.includes(item.service);

                                return (
                                    <label
                                        key={item.id}
                                        className={`${styles.serviceItem} ${isSelected ? styles.selected : ''
                                            } ${disabled ? styles.disabled : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggle(item.service)}
                                            disabled={disabled}
                                            className={styles.serviceCheckbox}
                                        />
                                        <div className={styles.serviceContent}>
                                            <span className={styles.serviceLabel}>
                                                {item.service}
                                            </span>
                                            <p className={styles.serviceDescription}>
                                                {item.description}
                                            </p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {selected.length > 0 && (
                <div className={styles.selectedCount}>
                    {selected.length} service{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
};

export default ServiceCatalogSelector;