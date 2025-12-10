// src/app/components/dashboard/concierge/PricingManagement/PricingManagement.tsx
import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, Save, X } from 'lucide-react';
import styles from './PricingManagement.module.scss';

type PricingType = 'hourly' | 'fixed' | 'monthly' | 'custom';

interface ServiceCatalogItem {
    id: string;
    service: string;
    category: string;
}

interface ServicesCatalogByCategory {
    [category: string]: ServiceCatalogItem[];
}

interface ServicesCatalog {
    byCategory: ServicesCatalogByCategory;
}

interface PricingServiceRelation {
    id: string;
    service: string;
    category: string;
}

interface Pricing {
    id: string;
    service_id: string | null;
    label: string;
    type: string;
    amount: number;
    unit: string;
    is_default: boolean;
    service?: PricingServiceRelation | null;
}

interface PricingFormData {
    service_id: string;
    label: string;
    type: PricingType;
    amount: string;
    unit: string;
    is_default: boolean;
}

export default function PricingManagement() {
    const [pricings, setPricings] = useState<Pricing[]>([]);
    const [servicesCatalog, setServicesCatalog] = useState<ServicesCatalog>({
        byCategory: {},
    });
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState<PricingFormData>({
        service_id: '',
        label: '',
        type: 'hourly',
        amount: '',
        unit: '€',
        is_default: false,
    });

    // Filtres
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [filterType, setFilterType] = useState<PricingType | ''>('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                await Promise.all([fetchPricings(), fetchServicesCatalog()]);
            } catch (error) {
                console.error('Erreur chargement données:', error);
            }
        };
        loadData();
    }, []);

    const fetchPricings = async () => {
        try {
            const res = await fetch('/api/pricing');
            if (!res.ok) throw new Error('Erreur API');
            const data: Pricing[] = await res.json();
            setPricings(data);
        } catch (error) {
            console.error('Erreur chargement tarifs:', error);
        }
    };

    const fetchServicesCatalog = async () => {
        try {
            const res = await fetch('/api/services-catalog');
            if (!res.ok) throw new Error('Erreur API');
            const data: ServicesCatalog = await res.json();
            setServicesCatalog(data);
        } catch (error) {
            console.error('Erreur chargement catalogue:', error);
        }
    };

    const handleSubmit = async () => {
        if (!formData.label || !formData.amount) {
            alert('Label et montant requis');
            return;
        }

        setLoading(true);

        try {
            const url = editingId ? `/api/pricing/${editingId}` : '/api/pricing';
            const method = editingId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                    service_id: formData.service_id || null,
                }),
            });

            if (res.ok) {
                await fetchPricings();
                resetForm();
            } else {
                const error = await res.json();
                alert(`Erreur: ${error.error || 'Échec opération'}`);
            }
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            alert('Erreur lors de la sauvegarde');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer ce tarif ?')) return;

        try {
            const res = await fetch(`/api/pricing/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchPricings();
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
        }
    };

    const handleEdit = (pricing: Pricing) => {
        setEditingId(pricing.id);
        setFormData({
            service_id: pricing.service_id || '',
            label: pricing.label,
            type: pricing.type as PricingType,
            amount: pricing.amount.toString(),
            unit: pricing.unit,
            is_default: pricing.is_default,
        });
        setShowAddForm(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setShowAddForm(false);
        setFormData({
            service_id: '',
            label: '',
            type: 'hourly',
            amount: '',
            unit: '€',
            is_default: false,
        });
        setFilterCategory('');
        setFilterType('');
        setSearchTerm('');
    };

    const filteredPricings = pricings.filter((pricing) => {
        const matchesCategory = !filterCategory || pricing.service?.category === filterCategory;
        const matchesType = !filterType || pricing.type === filterType;
        const matchesSearch = !searchTerm || pricing.label.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesType && matchesSearch;
    });

    const handleFormChange = (field: keyof PricingFormData, value: string | boolean) => {
        setFormData({ ...formData, [field]: value });
    };

    return (
        <div className={styles.pricingContainer}>
            {/* Header + filtres */}
            <div className={styles.headerFilters}>
                <div className={styles.filtersPanel}>
                    {servicesCatalog?.byCategory ? (
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="">Toutes catégories</option>
                            {Object.keys(servicesCatalog.byCategory).map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    ) : (
                        <div className={styles.filterLoading}>Chargement...</div>
                    )}

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as PricingType | '')}
                        className={styles.filterSelect}
                    >
                        <option value="">Tous types</option>
                        <option value="hourly">Horaire</option>
                        <option value="fixed">Forfait</option>
                        <option value="monthly">Mensuel</option>
                        <option value="custom">Personnalisé</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Rechercher un service..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.filterInput}
                    />
                </div>

                <div className="flex items-center gap-4">
                    <h2 className={styles.headerTitle}>💰 Mes Tarifs</h2>
                    {!showAddForm && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className={styles.addTariffBtn}
                        >
                            <Plus size={20} />
                            Ajouter un tarif
                        </button>
                    )}
                </div>
            </div>

            {/* Formulaire ajout / édition */}
            {showAddForm && (
                <div className={styles.tariffForm}>
                    <h3 className={styles.formTitle}>
                        {editingId ? '✏️ Modifier le tarif' : '➕ Nouveau tarif'}
                    </h3>
                    <div className="space-y-4">
                        {/* Service du catalogue */}
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>
                                Service du catalogue (optionnel)
                            </label>
                            <select
                                value={formData.service_id}
                                onChange={(e) => handleFormChange('service_id', e.target.value)}
                                className={styles.formInput}
                            >
                                <option value="">— Service personnalisé —</option>
                                {servicesCatalog?.byCategory ? (
                                    Object.entries(servicesCatalog.byCategory).map(([category, services]) => (
                                        <optgroup key={category} label={category}>
                                            {services.map((service) => (
                                                <option key={service.id} value={service.id}>
                                                    {service.service}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))
                                ) : (
                                    <option disabled>Chargement catalogue...</option>
                                )}
                            </select>
                        </div>

                        {/* Libellé */}
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>
                                Libellé * <span>(ex: Ménage standard 2 pièces)</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.label}
                                onChange={(e) => handleFormChange('label', e.target.value)}
                                className={styles.formInput}
                                placeholder="Décrivez votre prestation"
                            />
                        </div>

                        {/* Type + montant */}
                        <div className={styles.formGrid}>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Type de tarif</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleFormChange('type', e.target.value as PricingType)}
                                    className={styles.formInput}
                                >
                                    <option value="hourly">Horaire</option>
                                    <option value="fixed">Forfait</option>
                                    <option value="monthly">Mensuel</option>
                                    <option value="custom">Personnalisé</option>
                                </select>
                            </div>

                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Montant * (€)</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    min="0"
                                    value={formData.amount}
                                    onChange={(e) => handleFormChange('amount', e.target.value)}
                                    className={`${styles.formInput} ${styles.amountInput}`}
                                    placeholder="45.00"
                                />
                            </div>
                        </div>

                        {/* Tarif par défaut */}
                        <div className={styles.checkboxRow}>
                            <input
                                type="checkbox"
                                id="is_default"
                                checked={formData.is_default}
                                onChange={(e) => handleFormChange('is_default', e.target.checked)}
                            />
                            <label htmlFor="is_default">
                                Définir comme tarif par défaut
                            </label>
                        </div>

                        {/* Actions form */}
                        <div className={styles.formActions}>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className={styles.submitBtn}
                            >
                                <Save size={18} />
                                {loading ? 'Sauvegarde...' : editingId ? 'Modifier' : 'Ajouter'}
                            </button>
                            <button onClick={resetForm} className={styles.cancelBtn}>
                                <X size={18} />
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Liste des tarifs */}
            <div className={styles.tariffsList}>
                {filteredPricings.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>Aucun tarif défini</p>
                        <p>Commencez par ajouter vos prestations</p>
                    </div>
                ) : (
                    filteredPricings.map((pricing) => (
                        <div key={pricing.id} className={styles.tariffCard}>
                            <div className={styles.cardContent}>
                                <div className={styles.cardInfo}>
                                    <div className={styles.cardHeader}>
                                        <h3>{pricing.label}</h3>
                                        {pricing.is_default && <span className={styles.defaultBadge}>Défaut</span>}
                                    </div>

                                    {pricing.service && (
                                        <p className={styles.serviceInfo}>
                                            📋 {pricing.service.category} → {pricing.service.service}
                                        </p>
                                    )}

                                    <div className={styles.priceInfo}>
                                        <span className={styles.price}>
                                            {pricing.amount.toFixed(2)} {pricing.unit}
                                        </span>
                                        <span>•</span>
                                        <span className={styles.type}>{pricing.type}</span>
                                    </div>
                                </div>

                                <div className={styles.cardActions}>
                                    <button
                                        onClick={() => handleEdit(pricing)}
                                        className={styles.editBtn}
                                        title="Modifier"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(pricing.id)}
                                        className={styles.deleteBtn}
                                        title="Supprimer"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Conseils */}
            <div className={styles.adviceBox}>
                <h4>Conseils</h4>
                <ul>
                    <li>Définissez des tarifs clairs pour chaque type de prestation</li>
                    <li>Utilisez le catalogue de services pour normaliser vos offres</li>
                    <li>Le tarif &quot;par défaut&quot; s&apos;affichera en priorité sur votre profil</li>
                    <li>Vous pouvez créer des tarifs personnalisés sans utiliser le catalogue</li>
                </ul>
            </div>
        </div>
    );
}
