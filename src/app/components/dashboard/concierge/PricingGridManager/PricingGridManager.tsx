import React, { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiHome, FiSquare, FiClock, FiDollarSign, FiFilter, FiSearch } from 'react-icons/fi';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */
type PricingType = 'hourly' | 'fixed' | 'monthly' | 'custom';
type PropertyType = 'appartement' | 'maison' | 'villa' | 'studio' | 'bureau';

interface ServiceCatalogItem {
  id: string;
  service: string;
  category: string;
}

interface ServicesCatalog {
  byCategory: Record<string, ServiceCatalogItem[]>;
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
  type: PricingType;
  amount: number;
  unit: string;
  is_default: boolean;
  service?: PricingServiceRelation | null;
  
  // Nouveaux champs pour la grille tarifaire
  property_type?: PropertyType;
  surface_min?: number;
  surface_max?: number;
  estimated_duration?: number;
}

interface PricingFormData {
  service_id: string;
  label: string;
  type: PricingType;
  amount: string;
  unit: string;
  is_default: boolean;
  
  // Nouveaux champs
  property_type: PropertyType;
  surface_min: string;
  surface_max: string;
  estimated_duration: string;
}

const EMPTY_FORM: PricingFormData = {
  service_id: '',
  label: '',
  type: 'hourly',
  amount: '',
  unit: '€',
  is_default: false,
  property_type: 'appartement',
  surface_min: '',
  surface_max: '',
  estimated_duration: ''
};

const PricingGridManager = () => {
  const [pricings, setPricings] = useState<Pricing[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<ServicesCatalog>({ byCategory: {} });
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PricingFormData>(EMPTY_FORM);

  // Filtres
  const [filterPropertyType, setFilterPropertyType] = useState<PropertyType | ''>('');
  const [filterPricingType, setFilterPricingType] = useState<PricingType | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  const propertyTypes: Array<{ value: PropertyType; label: string }> = [
    { value: 'appartement', label: '🏢 Appartement' },
    { value: 'maison', label: '🏠 Maison' },
    { value: 'villa', label: '🏡 Villa' },
    { value: 'studio', label: '🚪 Studio' },
    { value: 'bureau', label: '💼 Bureau' }
  ];

  const pricingTypes: Array<{ value: PricingType; label: string }> = [
    { value: 'hourly', label: '⏱️ Horaire' },
    { value: 'fixed', label: '📦 Forfait' },
    { value: 'monthly', label: '📅 Mensuel' },
    { value: 'custom', label: '🎯 Personnalisé' }
  ];

  /* -------------------------------------------------------------------------- */
  /*                                  EFFECTS                                   */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    Promise.all([fetchPricings(), fetchServicesCatalog()]);
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                   FETCH                                    */
  /* -------------------------------------------------------------------------- */
  const fetchPricings = async () => {
    try {
      const res = await fetch('/api/pricing');
      if (!res.ok) throw new Error('Erreur API pricing');
      const data: Pricing[] = await res.json();
      setPricings(data);
    } catch (err) {
      console.error('[Pricing] fetchPricings', err);
    }
  };

  const fetchServicesCatalog = async () => {
    try {
      const res = await fetch('/api/services/services-catalog');
      if (!res.ok) throw new Error('Erreur API catalog');
      const data: ServiceCatalogItem[] = await res.json();

      const grouped = data.reduce<Record<string, ServiceCatalogItem[]>>((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {});

      setServicesCatalog({ byCategory: grouped });
    } catch (err) {
      console.error('[Pricing] fetchServicesCatalog', err);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   FORM                                     */
  /* -------------------------------------------------------------------------- */
  const handleSubmit = async () => {
    if (!formData.label || !formData.amount) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }
    
    setLoading(true);
    try {
      const url = editingId ? `/api/pricing/${editingId}` : '/api/pricing';
      const method = editingId ? 'PATCH' : 'POST';
      
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        service_id: formData.service_id || null,
        surface_min: formData.surface_min ? Number(formData.surface_min) : null,
        surface_max: formData.surface_max ? Number(formData.surface_max) : null,
        estimated_duration: formData.estimated_duration ? Number(formData.estimated_duration) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || 'Erreur serveur');
      }

      await fetchPricings();
      resetForm();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pricing: Pricing) => {
    setFormData({
      service_id: pricing.service_id || '',
      label: pricing.label,
      type: pricing.type,
      amount: pricing.amount.toString(),
      unit: pricing.unit,
      is_default: pricing.is_default,
      property_type: pricing.property_type || 'appartement',
      surface_min: pricing.surface_min?.toString() || '',
      surface_max: pricing.surface_max?.toString() || '',
      estimated_duration: pricing.estimated_duration?.toString() || ''
    });
    setEditingId(pricing.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette règle tarifaire ?')) return;
    
    try {
      await fetch(`/api/pricing/${id}`, { method: 'DELETE' });
      await fetchPricings();
    } catch (err) {
      console.error('[Pricing] handleDelete', err);
      alert('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowAddForm(false);
  };

  /* -------------------------------------------------------------------------- */
  /*                                 FILTERING                                  */
  /* -------------------------------------------------------------------------- */
  const filteredPricings = useMemo(() => {
    return pricings.filter((p) => {
      if (filterPropertyType && p.property_type !== filterPropertyType) return false;
      if (filterPricingType && p.type !== filterPricingType) return false;
      if (searchTerm && !p.label.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [pricings, filterPropertyType, filterPricingType, searchTerm]);

  /* -------------------------------------------------------------------------- */
  /*                                 HELPERS                                    */
  /* -------------------------------------------------------------------------- */
  const getSurfaceLabel = (min?: number, max?: number) => {
    if (!min && !max) return '—';
    if (!max || max >= 1000) return `${min}m² et plus`;
    return `${min}m² - ${max}m²`;
  };

  const getPriceDisplay = (pricing: Pricing) => {
    const price = pricing.amount.toFixed(2);
    if (pricing.type === 'fixed') {
      return `${price}€ forfait`;
    }
    if (pricing.type === 'hourly' && pricing.estimated_duration) {
      return `${price}€/h (≈${Math.round(pricing.amount * pricing.estimated_duration)}€)`;
    }
    return `${price}${pricing.unit}`;
  };

  const getPropertyTypeLabel = (type?: PropertyType) => {
    const found = propertyTypes.find(pt => pt.value === type);
    return found ? found.label : '—';
  };

  /* -------------------------------------------------------------------------- */
  /*                                   RENDER                                   */
  /* -------------------------------------------------------------------------- */
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* HEADER & FILTERS */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '1.5rem',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            Ma grille tarifaire personnalisée
          </h3>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
            Définissez vos tarifs selon le type de bien, la surface et la durée
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Filtres */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#f8fafc', padding: '0.5rem', borderRadius: '8px' }}>
            <FiFilter size={16} color="#6b7280" aria-hidden="true" />
            <select
              value={filterPropertyType}
              onChange={(e) => setFilterPropertyType(e.target.value as PropertyType | '')}
              aria-label="Filtrer par type de bien"
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                background: 'white'
              }}
            >
              <option value="">Tous les types</option>
              {propertyTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <select
              value={filterPricingType}
              onChange={(e) => setFilterPricingType(e.target.value as PricingType | '')}
              aria-label="Filtrer par type de tarification"
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                background: 'white'
              }}
            >
              <option value="">Toutes tarifications</option>
              {pricingTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Recherche */}
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={16} aria-hidden="true" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Rechercher un tarif"
              style={{
                padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                width: '200px'
              }}
            />
          </div>

          {/* Bouton Ajouter */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#1d4ed8'}
            onMouseOut={(e) => e.currentTarget.style.background = '#2563eb'}
          >
            <FiPlus size={18} />
            Nouvelle règle
          </button>
        </div>
      </div>

      {/* ADD/EDIT FORM */}
      {showAddForm && (
        <div style={{
          background: '#f8fafc',
          border: '2px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
            {editingId ? '✏️ Modifier la règle' : '➕ Nouvelle règle tarifaire'}
          </h4>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Service (optionnel) */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                Service associé (optionnel)
              </label>
              <select
                value={formData.service_id}
                onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                aria-label="Service associé"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem'
                }}
              >
                <option value="">— Service personnalisé —</option>
                {Object.entries(servicesCatalog.byCategory).map(([cat, services]) => (
                  <optgroup key={cat} label={cat}>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.service}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Libellé */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                Libellé du tarif *
              </label>
              <input
                type="text"
                placeholder="Ex: Ménage appartement 2 pièces"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {/* Type de bien */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  Type de bien
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) => setFormData({ ...formData, property_type: e.target.value as PropertyType })}
                  aria-label="Type de bien"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem'
                  }}
                >
                  {propertyTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Type de tarification */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  Type de tarification
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as PricingType })}
                  aria-label="Type de tarification"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem'
                  }}
                >
                  {pricingTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Surface min */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  Surface min (m²)
                </label>
                <input
                  type="number"
                  value={formData.surface_min}
                  onChange={(e) => setFormData({ ...formData, surface_min: e.target.value })}
                  aria-label="Surface minimum en mètres carrés"
                  placeholder="Ex: 0"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem'
                  }}
                  min="0"
                />
              </div>

              {/* Surface max */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  Surface max (m²)
                </label>
                <input
                  type="number"
                  value={formData.surface_max}
                  onChange={(e) => setFormData({ ...formData, surface_max: e.target.value })}
                  aria-label="Surface maximum en mètres carrés"
                  placeholder="Ex: 50"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem'
                  }}
                  min="0"
                />
              </div>

              {/* Prix */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  {formData.type === 'fixed' ? 'Prix forfait (€) *' : 'Tarif (€) *'}
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  aria-label="Montant du tarif en euros"
                  placeholder="Ex: 45"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem'
                  }}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Durée estimée */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  Durée estimée (h)
                </label>
                <input
                  type="number"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                  aria-label="Durée estimée en heures"
                  placeholder="Ex: 2.5"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem'
                  }}
                  min="0"
                  step="0.5"
                />
              </div>
            </div>

            {/* Tarif par défaut */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.95rem' }}>Définir comme tarif par défaut</span>
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: loading ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 500
                }}
              >
                {loading ? 'Enregistrement...' : (editingId ? 'Mettre à jour' : 'Ajouter')}
              </button>
              <button
                onClick={resetForm}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 500
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRICING RULES TABLE */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#6b7280' }}>
                LIBELLÉ
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#6b7280' }}>
                TYPE DE BIEN
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#6b7280' }}>
                SURFACE
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#6b7280' }}>
                TARIFICATION
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#6b7280' }}>
                DURÉE
              </th>
              <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: 600, color: '#6b7280' }}>
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPricings.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                  {searchTerm || filterPropertyType || filterPricingType
                    ? 'Aucun tarif ne correspond aux filtres'
                    : 'Aucune règle tarifaire définie. Cliquez sur "Nouvelle règle" pour commencer.'}
                </td>
              </tr>
            ) : (
              filteredPricings.map((pricing, index) => (
                <tr 
                  key={pricing.id}
                  style={{ 
                    borderBottom: index < filteredPricings.length - 1 ? '1px solid #f3f4f6' : 'none',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '1rem' }}>
                    <div>
                      <span style={{ fontWeight: 500 }}>{pricing.label}</span>
                      {pricing.is_default && (
                        <span style={{ 
                          marginLeft: '0.5rem',
                          padding: '0.25rem 0.5rem',
                          background: '#dbeafe',
                          color: '#1e40af',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          PAR DÉFAUT
                        </span>
                      )}
                      {pricing.service && (
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          {pricing.service.category} → {pricing.service.service}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FiHome size={16} color="#6b7280" />
                      <span style={{ textTransform: 'capitalize' }}>
                        {getPropertyTypeLabel(pricing.property_type)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FiSquare size={16} color="#6b7280" />
                      <span>{getSurfaceLabel(pricing.surface_min, pricing.surface_max)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FiDollarSign size={16} color="#10b981" />
                      <span style={{ fontWeight: 500, color: '#10b981' }}>
                        {getPriceDisplay(pricing)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FiClock size={16} color="#6b7280" />
                      <span>{pricing.estimated_duration ? `${pricing.estimated_duration}h` : '—'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleEdit(pricing)}
                        aria-label={`Modifier le tarif ${pricing.label}`}
                        title="Modifier"
                        style={{
                          padding: '0.5rem',
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#e5e7eb'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#f3f4f6'}
                      >
                        <FiEdit2 size={16} color="#6b7280" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDelete(pricing.id)}
                        aria-label={`Supprimer le tarif ${pricing.label}`}
                        title="Supprimer"
                        style={{
                          padding: '0.5rem',
                          background: '#fee2e2',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#fecaca'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#fee2e2'}
                      >
                        <FiTrash2 size={16} color="#dc2626" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* QUICK STATS */}
      {filteredPricings.length > 0 && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1.5rem',
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '12px'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600 }}>
            📊 Statistiques rapides
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Règles définies
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0369a1' }}>
                {pricings.length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Tarif moyen forfait
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0369a1' }}>
                {(() => {
                  const forfaits = pricings.filter(r => r.type === 'fixed');
                  return forfaits.length > 0
                    ? Math.round(forfaits.reduce((acc, r) => acc + r.amount, 0) / forfaits.length)
                    : 0;
                })()}€
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Tarif horaire moyen
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0369a1' }}>
                {(() => {
                  const horaires = pricings.filter(r => r.type === 'hourly');
                  return horaires.length > 0
                    ? Math.round(horaires.reduce((acc, r) => acc + r.amount, 0) / horaires.length)
                    : 0;
                })()}€/h
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingGridManager;