// // src/app/components/dashboard/concierge/PricingManagement/PricingManagement.tsx
// import React, { useEffect, useMemo, useState } from 'react';
// import { Trash2, Plus, Edit2, Save, X } from 'lucide-react';
// import styles from './PricingManagement.module.scss';

// /* -------------------------------------------------------------------------- */
// /*                                   TYPES                                    */
// /* -------------------------------------------------------------------------- */

// type PricingType = 'hourly' | 'fixed' | 'monthly' | 'custom';

// interface ServiceCatalogItem {
//     id: string;
//     service: string;
//     category: string;
// }

// interface ServicesCatalog {
//     byCategory: Record<string, ServiceCatalogItem[]>;
// }

// interface PricingServiceRelation {
//     id: string;
//     service: string;
//     category: string;
// }

// interface Pricing {
//     id: string;
//     service_id: string | null;
//     label: string;
//     type: PricingType;
//     amount: number;
//     unit: string;
//     is_default: boolean;
//     service?: PricingServiceRelation | null;
// }

// interface PricingFormData {
//     service_id: string;
//     label: string;
//     type: PricingType;
//     amount: string;
//     unit: string;
//     is_default: boolean;
// }

// /* -------------------------------------------------------------------------- */
// /*                              DEFAULT VALUES                                */
// /* -------------------------------------------------------------------------- */

// const EMPTY_FORM: PricingFormData = {
//     service_id: '',
//     label: '',
//     type: 'hourly',
//     amount: '',
//     unit: '€',
//     is_default: false,
// };

// /* -------------------------------------------------------------------------- */
// /*                               COMPONENT                                    */
// /* -------------------------------------------------------------------------- */

// export default function PricingManagement() {
//     const [pricings, setPricings] = useState<Pricing[]>([]);
//     const [servicesCatalog, setServicesCatalog] = useState<ServicesCatalog>({ byCategory: {} });
//     const [loading, setLoading] = useState(false);
//     const [editingId, setEditingId] = useState<string | null>(null);
//     const [showForm, setShowForm] = useState(false);
//     const [formData, setFormData] = useState<PricingFormData>(EMPTY_FORM);

//     /* -------------------------------- Filters -------------------------------- */
//     const [filterCategory, setFilterCategory] = useState('');
//     const [filterType, setFilterType] = useState<PricingType | ''>('');
//     const [searchTerm, setSearchTerm] = useState('');

//     /* -------------------------------------------------------------------------- */
//     /*                                  EFFECTS                                   */
//     /* -------------------------------------------------------------------------- */
//     useEffect(() => {
//         Promise.all([fetchPricings(), fetchServicesCatalog()]);
//     }, []);

//     /* -------------------------------------------------------------------------- */
//     /*                                   FETCH                                    */
//     /* -------------------------------------------------------------------------- */
//     const fetchPricings = async () => {
//         try {
//             const res = await fetch('/api/pricing');
//             if (!res.ok) throw new Error('Erreur API pricing');
//             const data: Pricing[] = await res.json();
//             setPricings(data);
//         } catch (err) {
//             console.error('[Pricing] fetchPricings', err);
//         }
//     };

//     const fetchServicesCatalog = async () => {
//         try {
//             const res = await fetch('/api/services/services-catalog');
//             if (!res.ok) throw new Error('Erreur API catalog');
//             const data: ServiceCatalogItem[] = await res.json();

//             const grouped = data.reduce<Record<string, ServiceCatalogItem[]>>((acc, item) => {
//                 if (!acc[item.category]) acc[item.category] = [];
//                 acc[item.category].push(item);
//                 return acc;
//             }, {});

//             setServicesCatalog({ byCategory: grouped });
//         } catch (err) {
//             console.error('[Pricing] fetchServicesCatalog', err);
//         }
//     };

//     /* -------------------------------------------------------------------------- */
//     /*                                   FORM                                     */
//     /* -------------------------------------------------------------------------- */
//     const handleFormChange = <K extends keyof PricingFormData>(field: K, value: PricingFormData[K]) => {
//         setFormData((prev) => ({ ...prev, [field]: value }));
//     };

//     const resetForm = () => {
//         setFormData(EMPTY_FORM);
//         setEditingId(null);
//         setShowForm(false);
//     };

//     const handleSubmit = async () => {
//         if (!formData.label || !formData.amount) return alert('Champs requis manquants');
//         setLoading(true);
//         try {
//             const url = editingId ? `/api/pricing/${editingId}` : '/api/pricing';
//             const method = editingId ? 'PATCH' : 'POST';
//             const res = await fetch(url, {
//                 method,
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ ...formData, amount: Number(formData.amount), service_id: formData.service_id || null }),
//             });
//             if (!res.ok) {
//                 const err = await res.json();
//                 throw new Error(err?.error || 'Erreur serveur');
//             }
//             await fetchPricings();
//             resetForm();
//         } catch (err) {
//             const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
//             alert(errorMessage);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleEdit = (pricing: Pricing) => {
//         setEditingId(pricing.id);
//         setFormData({
//             service_id: pricing.service_id || '',
//             label: pricing.label,
//             type: pricing.type,
//             amount: pricing.amount.toString(),
//             unit: pricing.unit,
//             is_default: pricing.is_default,
//         });
//         setShowForm(true);
//     };

//     const handleDelete = async (id: string) => {
//         if (!confirm('Supprimer ce tarif ?')) return;
//         await fetch(`/api/pricing/${id}`, { method: 'DELETE' });
//         fetchPricings();
//     };

//     /* -------------------------------------------------------------------------- */
//     /*                                 FILTERING                                  */
//     /* -------------------------------------------------------------------------- */
//     const filteredPricings = useMemo(() => {
//         return pricings
//             .filter((p) => {
//                 if (filterCategory && p.service?.category !== filterCategory) return false;
//                 if (filterType && p.type !== filterType) return false;
//                 if (searchTerm && !p.label.toLowerCase().includes(searchTerm.toLowerCase())) return false;
//                 return true;
//             })
//             .sort((a, b) => {
//                 // Les tarifs par défaut en premier
//                 if (a.is_default && !b.is_default) return -1;
//                 if (!a.is_default && b.is_default) return 1;
//                 // Inversion de la grille (derniers ajoutés en haut)
//                 return 0;
//             });
//     }, [pricings, filterCategory, filterType, searchTerm]);

//     /* -------------------------------------------------------------------------- */
//     /*                                   RENDER                                   */
//     /* -------------------------------------------------------------------------- */
//     return (
//         <div className={styles.pricingContainer}>
//             {/* HEADER */}
//             <div className={styles.headerFilters}>
//                 <div className={styles.filtersPanel}>
//                     <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
//                         <option value="">Toutes catégories</option>
//                         {Object.keys(servicesCatalog.byCategory).map((cat) => (
//                             <option key={cat} value={cat}>{cat}</option>
//                         ))}
//                     </select>

//                     <select value={filterType} onChange={(e) => setFilterType(e.target.value as PricingType | '')}>
//                         <option value="">Tous types</option>
//                         <option value="hourly">Horaire</option>
//                         <option value="fixed">Forfait</option>
//                         <option value="monthly">Mensuel</option>
//                         <option value="custom">Personnalisé</option>
//                     </select>

//                     <input
//                         placeholder="Rechercher un tarif"
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                     />
//                 </div>

//                 {!showForm && (
//                     <button onClick={() => setShowForm(true)} className={styles.addTariffBtn}>
//                         <Plus size={18} /> Ajouter un tarif
//                     </button>
//                 )}
//             </div>

//             {/* FORM */}
//             {showForm && (
//                 <div className={styles.tariffForm}>
//                     <h3>{editingId ? 'Modifier un tarif' : 'Nouveau tarif'}</h3>

//                     <select value={formData.service_id} onChange={(e) => handleFormChange('service_id', e.target.value)}>
//                         <option value="">— Service personnalisé —</option>
//                         {Object.entries(servicesCatalog.byCategory).map(([cat, services]) => (
//                             <optgroup key={cat} label={cat}>
//                                 {services.map((s) => (
//                                     <option key={s.id} value={s.id}>{s.service}</option>
//                                 ))}
//                             </optgroup>
//                         ))}
//                     </select>

//                     <input
//                         placeholder="Libellé"
//                         value={formData.label}
//                         onChange={(e) => handleFormChange('label', e.target.value)}
//                     />

//                     <div className={styles.formGrid}>
//                         <select value={formData.type} onChange={(e) => handleFormChange('type', e.target.value as PricingType)}>
//                             <option value="hourly">Horaire</option>
//                             <option value="fixed">Forfait</option>
//                             <option value="monthly">Mensuel</option>
//                             <option value="custom">Personnalisé</option>
//                         </select>

//                         <input
//                             type="number"
//                             step="0.01"
//                             value={formData.amount}
//                             onChange={(e) => handleFormChange('amount', e.target.value)}
//                         />
//                     </div>

//                     <label>
//                         <input
//                             type="checkbox"
//                             checked={formData.is_default}
//                             onChange={(e) => handleFormChange('is_default', e.target.checked)}
//                         />
//                         Tarif par défaut
//                     </label>

//                     <div className={styles.formActions}>
//                         <button onClick={handleSubmit} disabled={loading}>
//                             <Save size={16} /> Sauvegarder
//                         </button>
//                         <button onClick={resetForm}><X size={16} /> Annuler</button>
//                     </div>
//                 </div>
//             )}

//             {/* LIST */}
//             <div className={styles.tariffsList}>
//                 {filteredPricings.map((p) => (
//                     <div key={p.id} className={styles.tariffCard}>
//                         <div>
//                             <strong>{p.label}</strong>
//                             {p.is_default && <span className={styles.defaultBadge}>Défaut</span>}
//                             {p.service && <p>{p.service.category} → {p.service.service}</p>}
//                             <p>{p.amount.toFixed(2)} {p.unit} • {p.type}</p>
//                         </div>

//                         <div className={styles.cardActions}>
//                             <button onClick={() => handleEdit(p)}><Edit2 size={16} /></button>
//                             <button onClick={() => handleDelete(p.id)}><Trash2 size={16} /></button>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// }