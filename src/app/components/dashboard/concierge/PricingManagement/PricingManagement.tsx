// src/app/components/dashboard/concierge/PricingManagement/PricingManagement.tsx
import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, Save, X } from 'lucide-react';

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
    service_id: string | null; // string côté front (converti en number dans l'API)
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
    amount: string; // string pour l'input
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
        fetchPricings();
        fetchServicesCatalog();
    }, []);

    const fetchPricings = async () => {
        try {
            const res = await fetch('/api/pricing');
            const data: Pricing[] = await res.json();
            setPricings(data);
        } catch (error) {
            console.error('Erreur chargement tarifs:', error);
        }
    };

    const fetchServicesCatalog = async () => {
        try {
            const res = await fetch('/api/services-catalog');
            const data: ServicesCatalog = await res.json();
            setServicesCatalog(data);
        } catch (error) {
            console.error('Erreur chargement catalogue:', error);
        }
    };

    const handleSubmit = async () => {
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
                alert(`Erreur: ${error.error}`);
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
    };

    // Filtres appliqués
    const filteredPricings = pricings.filter((pricing) => {
        const matchesCategory =
            !filterCategory || pricing.service?.category === filterCategory;
        const matchesType = !filterType || pricing.type === filterType;
        const matchesSearch =
            !searchTerm ||
            pricing.label.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesCategory && matchesType && matchesSearch;
    });

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header + filtres */}
            {/* Header + filtres - VERSION SÉCURISÉE */}
            <div className="flex justify-between items-center mb-6 gap-4">
                <div className="flex-1 flex gap-4 p-4 bg-gray-50 rounded-lg">
                    {/* ✅ SÉCURITÉ : Vérifie que servicesCatalog est chargé */}
                    {servicesCatalog?.byCategory ? (
                        <>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="px-3 py-2 border rounded-lg"
                            >
                                <option value="">Toutes catégories</option>
                                {Object.keys(servicesCatalog.byCategory).map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </>
                    ) : (
                        <div className="px-3 py-2 text-gray-500">Chargement...</div>
                    )}

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as PricingType | '')}
                        className="px-3 py-2 border rounded-lg"
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
                        className="flex-1 px-3 py-2 border rounded-lg"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap">
                        💰 Mes Tarifs
                    </h2>
                    {!showAddForm && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={20} />
                            Ajouter un tarif
                        </button>
                    )}
                </div>
            </div>

            {/* Formulaire ajout / édition */}
            {showAddForm && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-2 border-blue-200">
                    <h3 className="text-lg font-semibold mb-4">
                        {editingId ? '✏️ Modifier le tarif' : '➕ Nouveau tarif'}
                    </h3>
                    <div className="space-y-4">
                        {/* Service du catalogue */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Service du catalogue (optionnel)
                            </label>
                            <select
                                value={formData.service_id}
                                onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">-- Service personnalisé --</option>
                                {/* ✅ SÉCURITÉ : Vérifie servicesCatalog */}
                                {servicesCatalog?.byCategory ? (
                                    Object.entries(servicesCatalog.byCategory).map(([category, services]) => (
                                        <optgroup key={category} label={category}>
                                            {services.map((service: ServiceCatalogItem) => (
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Libellé *{' '}
                                <span className="text-xs text-gray-500">
                                    (ex: Ménage standard 2 pièces)
                                </span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.label}
                                onChange={(e) =>
                                    setFormData({ ...formData, label: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Décrivez votre prestation"
                            />
                        </div>

                        {/* Type + montant */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type de tarif
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            type: e.target.value as PricingType,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="hourly">Horaire</option>
                                    <option value="fixed">Forfait</option>
                                    <option value="monthly">Mensuel</option>
                                    <option value="custom">Personnalisé</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Montant * (€)
                                </label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    min="0"
                                    value={formData.amount}
                                    onChange={(e) =>
                                        setFormData({ ...formData, amount: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="45.00"
                                />
                            </div>
                        </div>

                        {/* Tarif par défaut */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_default"
                                checked={formData.is_default}
                                onChange={(e) =>
                                    setFormData({ ...formData, is_default: e.target.checked })
                                }
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="is_default" className="text-sm text-gray-700">
                                Définir comme tarif par défaut
                            </label>
                        </div>

                        {/* Actions form */}
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                <Save size={18} />
                                {loading ? 'Sauvegarde...' : editingId ? 'Modifier' : 'Ajouter'}
                            </button>
                            <button
                                onClick={resetForm}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                                <X size={18} />
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Liste des tarifs */}
            <div className="space-y-3">
                {filteredPricings.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-lg">Aucun tarif défini</p>
                        <p className="text-gray-400 text-sm mt-2">
                            Commencez par ajouter vos prestations
                        </p>
                    </div>
                ) : (
                    filteredPricings.map((pricing: Pricing) => (
                        <div
                            key={pricing.id}
                            className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-gray-800">
                                            {pricing.label}
                                        </h3>
                                        {pricing.is_default && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                Défaut
                                            </span>
                                        )}
                                    </div>

                                    {pricing.service && (
                                        <p className="text-sm text-gray-500 mb-1">
                                            📋 {pricing.service.category} → {pricing.service.service}
                                        </p>
                                    )}

                                    <div className="flex gap-4 text-sm text-gray-600">
                                        <span className="font-medium text-green-700">
                                            {pricing.amount.toFixed(2)} {pricing.unit}
                                        </span>
                                        <span className="text-gray-400">•</span>
                                        <span className="capitalize">{pricing.type}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(pricing)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Modifier"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(pricing.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Conseils</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Définissez des tarifs clairs pour chaque type de prestation</li>
                    <li>• Utilisez le catalogue de services pour normaliser vos offres</li>
                    <li>• Le tarif &quot;par défaut&quot; s’affichera en priorité sur votre profil</li>
                    <li>• Vous pouvez créer des tarifs personnalisés sans utiliser le catalogue</li>
                </ul>
            </div>
        </div>
    );
}
