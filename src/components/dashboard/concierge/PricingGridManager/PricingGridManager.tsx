"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiHome,
  FiSquare,
  FiClock,
  FiDollarSign,
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiCheck,
} from 'react-icons/fi';
import styles from './PricingGridManager.module.scss';
import type { PricingModifierKey, PricingOverrideValue, PricingV2Config } from '@/components/tariffs/types';

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
  unit: 'EUR',
  property_type: 'appartement',
  surface_min: '',
  surface_max: '',
  estimated_duration: ''
};

interface PricingGridManagerProps {
  activeServiceIds?: string[];
  activeServiceLabels?: string[];
  linkedPackageId?: string;
  linkedPackageName?: string;
  pricingV2?: PricingV2Config;
  onChangePricingV2?: (next: PricingV2Config) => void;
  showHeader?: boolean;
  showQuickStats?: boolean;
  showContextualHeader?: boolean;
}

const PricingGridManager = ({
  activeServiceIds,
  activeServiceLabels,
  linkedPackageId,
  linkedPackageName,
  pricingV2,
  onChangePricingV2,
  showHeader = true,
  showQuickStats = true,
  showContextualHeader = true,
}: PricingGridManagerProps) => {
  const [pricings, setPricings] = useState<Pricing[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<ServicesCatalog>({ byCategory: {} });
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PricingFormData>(EMPTY_FORM);
  const [linkToPackage, setLinkToPackage] = useState(Boolean(linkedPackageId));

  // Filtres
  const [filterPropertyType, setFilterPropertyType] = useState<PropertyType | ''>('');
  const [filterPricingType, setFilterPricingType] = useState<PricingType | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPricingIdsForPack, setSelectedPricingIdsForPack] = useState<string[]>([]);
  const [linkedPricingSignatures, setLinkedPricingSignatures] = useState<Set<string>>(new Set());
  const [isLinkingSelected, setIsLinkingSelected] = useState(false);
  const [prioritySearch, setPrioritySearch] = useState("");
  const [showAdvancedPricingTools, setShowAdvancedPricingTools] = useState(false);
  const [editingPriorityRows, setEditingPriorityRows] = useState<Record<string, boolean>>({});
  const [contextualServiceScope, setContextualServiceScope] = useState<"missions" | "all">("missions");

  const modifierColumns: Array<{
    key: PricingModifierKey;
    label: string;
  }> = [
    { key: 'urgentPercent', label: 'Urgence' },
    { key: 'nightPercent', label: 'Nuit' },
    { key: 'weekendPercent', label: 'Week-end' },
    { key: 'highSeasonPercent', label: 'Haute saison' },
  ];

  const normalizeServiceText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const propertyTypes: Array<{ value: PropertyType; label: string }> = [
    { value: 'appartement', label: 'Appartement' },
    { value: 'maison', label: 'Maison' },
    { value: 'villa', label: 'Villa' },
    { value: 'studio', label: 'Studio' },
    { value: 'bureau', label: 'Bureau' }
  ];

  const pricingTypes: Array<{ value: PricingType; label: string }> = [
    { value: 'hourly', label: 'Horaire' },
    { value: 'fixed', label: 'Forfait' },
    { value: 'monthly', label: 'Mensuel' },
    { value: 'custom', label: 'Personnalise' }
  ];

  /* -------------------------------------------------------------------------- */
  /*                                  EFFECTS                                   */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    Promise.all([fetchPricings(), fetchServicesCatalog()]);
  }, []);

  useEffect(() => {
    if (!linkedPackageId) {
      setLinkedPricingSignatures(new Set());
      setSelectedPricingIdsForPack([]);
      return;
    }

    const fetchLinkedPackPricings = async () => {
      try {
        const res = await fetch(
          `/api/services/pricing-packages?packageId=${encodeURIComponent(linkedPackageId)}`,
        );
        if (!res.ok) return;
        const data: Array<{
          label: string;
          type: PricingType;
          amount: number;
          property_type?: string | null;
        }> = await res.json();
        const nextSet = new Set(
          (Array.isArray(data) ? data : []).map((item) =>
            `${item.label}__${item.type}__${Number(item.amount)}__${item.property_type ?? ""}`,
          ),
        );
        setLinkedPricingSignatures(nextSet);
      } catch {
        // silent fail: this feature is optional
      }
    };

    fetchLinkedPackPricings();
  }, [linkedPackageId]);

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

      const savedPricing: Pricing | null = await res.json().catch(() => null);

      if (!editingId && linkedPackageId && linkToPackage && savedPricing) {
        const linkRes = await fetch('/api/services/pricing-packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            package_id: linkedPackageId,
            label: savedPricing.label,
            type: savedPricing.type,
            amount: savedPricing.amount,
            property_type: savedPricing.property_type ?? null,
          }),
        });

        if (!linkRes.ok) {
          const linkErr = await linkRes.json().catch(() => null);
          console.warn('[Pricing] Link package warning', linkErr);
        } else {
          setLinkedPricingSignatures((prev) => {
            const next = new Set(prev);
            next.add(
              `${savedPricing.label}__${savedPricing.type}__${Number(savedPricing.amount)}__${savedPricing.property_type ?? ""}`,
            );
            return next;
          });
        }
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
      property_type: pricing.property_type || 'appartement',
      surface_min: pricing.surface_min?.toString() || '',
      surface_max: pricing.surface_max?.toString() || '',
      estimated_duration: pricing.estimated_duration?.toString() || ''
    });
    setEditingId(pricing.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Etes-vous sur de vouloir supprimer cette regle tarifaire ?')) return;
    
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
    setLinkToPackage(Boolean(linkedPackageId));
  };

  const getPricingSignature = (pricing: Pricing) =>
    `${pricing.label}__${pricing.type}__${Number(pricing.amount)}__${pricing.property_type ?? ""}`;

  const togglePricingSelectionForPack = (pricingId: string) => {
    setSelectedPricingIdsForPack((prev) =>
      prev.includes(pricingId)
        ? prev.filter((id) => id !== pricingId)
        : [...prev, pricingId],
    );
  };

  const handleAttachSelectedToPack = async () => {
    if (!linkedPackageId || selectedPricingIdsForPack.length === 0) return;

    const selectedPricings = pricings.filter((pricing) =>
      selectedPricingIdsForPack.includes(pricing.id),
    );
    const toAttach = selectedPricings.filter(
      (pricing) => !linkedPricingSignatures.has(getPricingSignature(pricing)),
    );

    if (toAttach.length === 0) {
      alert("Les tarifs selectionnes sont deja lies au pack.");
      return;
    }

    setIsLinkingSelected(true);
    try {
      for (const pricing of toAttach) {
        const res = await fetch('/api/services/pricing-packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            package_id: linkedPackageId,
            label: pricing.label,
            type: pricing.type,
            amount: pricing.amount,
            property_type: pricing.property_type ?? null,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || `Erreur liaison tarif ${pricing.label}`);
        }
      }

      setLinkedPricingSignatures((prev) => {
        const next = new Set(prev);
        toAttach.forEach((pricing) => next.add(getPricingSignature(pricing)));
        return next;
      });
      setSelectedPricingIdsForPack([]);
      alert(`${toAttach.length} tarif(s) lie(s) au pack.`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur liaison au pack";
      alert(errorMessage);
    } finally {
      setIsLinkingSelected(false);
    }
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

  const hasActiveServiceFilter =
    (Array.isArray(activeServiceIds) && activeServiceIds.length > 0) ||
    (Array.isArray(activeServiceLabels) && activeServiceLabels.length > 0);
  const activeServiceIdSet = useMemo(
    () => new Set((activeServiceIds ?? []).filter(Boolean)),
    [activeServiceIds],
  );
  const activeServiceLabelSet = useMemo(
    () =>
      new Set(
        (activeServiceLabels ?? [])
          .filter(Boolean)
          .map((label) => normalizeServiceText(label)),
      ),
    [activeServiceLabels],
  );
  const selectableServicesByCategory = useMemo(() => {
    if (!hasActiveServiceFilter) return servicesCatalog.byCategory;

    return Object.entries(servicesCatalog.byCategory).reduce<Record<string, ServiceCatalogItem[]>>(
      (acc, [category, services]) => {
        const filtered = services.filter(
          (service) =>
            activeServiceIdSet.has(service.id) ||
            activeServiceLabelSet.has(normalizeServiceText(service.service)),
        );
        if (filtered.length > 0) {
          acc[category] = filtered;
        }
        return acc;
      },
      {},
    );
  }, [
    hasActiveServiceFilter,
    servicesCatalog.byCategory,
    activeServiceIdSet,
    activeServiceLabelSet,
  ]);
  const selectableServiceCount = useMemo(
    () => Object.values(selectableServicesByCategory).reduce((acc, items) => acc + items.length, 0),
    [selectableServicesByCategory],
  );
  const visiblePricings = useMemo(() => {
    if (!hasActiveServiceFilter) return filteredPricings;
    return filteredPricings.filter(
      (pricing) =>
        !pricing.service_id ||
        activeServiceIdSet.has(pricing.service_id) ||
        Boolean(
          pricing.service &&
            activeServiceLabelSet.has(normalizeServiceText(pricing.service.service)),
        ),
    );
  }, [
    hasActiveServiceFilter,
    filteredPricings,
    activeServiceIdSet,
    activeServiceLabelSet,
  ]);

  /* -------------------------------------------------------------------------- */
  /*                                 HELPERS                                    */
  /* -------------------------------------------------------------------------- */
  const getSurfaceLabel = (min?: number, max?: number) => {
    if (!min && !max) return '-';
    if (!max || max >= 1000) return `${min}m2 et plus`;
    return `${min}m2 - ${max}m2`;
  };

  const getPriceDisplay = (pricing: Pricing) => {
    const price = pricing.amount.toFixed(2);
    if (pricing.type === 'fixed') {
      return `${price} EUR forfait`;
    }
    if (pricing.type === 'hourly' && pricing.estimated_duration) {
      return `${price} EUR/h (~${Math.round(pricing.amount * pricing.estimated_duration)} EUR)`;
    }
    return `${price}${pricing.unit}`;
  };

  const getPropertyTypeLabel = (type?: PropertyType) => {
    const found = propertyTypes.find(pt => pt.value === type);
    return found ? found.label : '-';
  };

  const hasFilters = Boolean(filterPropertyType || filterPricingType || searchTerm);

  const resetFilters = () => {
    setFilterPropertyType('');
    setFilterPricingType('');
    setSearchTerm('');
  };

  const linkedServiceCount = useMemo(
    () => visiblePricings.filter((pricing) => Boolean(pricing.service_id)).length,
    [visiblePricings],
  );

  const averageFixedAmount = useMemo(() => {
    const fixedPricings = visiblePricings.filter((pricing) => pricing.type === 'fixed');
    if (fixedPricings.length === 0) return 0;
    return Math.round(
      fixedPricings.reduce((acc, pricing) => acc + pricing.amount, 0) / fixedPricings.length,
    );
  }, [visiblePricings]);

  const averageHourlyAmount = useMemo(() => {
    const hourlyPricings = visiblePricings.filter((pricing) => pricing.type === 'hourly');
    if (hourlyPricings.length === 0) return 0;
    return Math.round(
      hourlyPricings.reduce((acc, pricing) => acc + pricing.amount, 0) / hourlyPricings.length,
    );
  }, [visiblePricings]);

  const catalogById = useMemo(() => {
    const entries = Object.values(servicesCatalog.byCategory).flat();
    return entries.reduce<Record<string, ServiceCatalogItem>>((acc, item) => {
      acc[String(item.id)] = item;
      return acc;
    }, {});
  }, [servicesCatalog.byCategory]);

  const activeServiceRows = useMemo(() => {
    const rows = (activeServiceIds ?? [])
      .map((serviceId) => {
        const match = catalogById[String(serviceId)];
        if (!match) return null;
        return {
          id: String(match.id),
          label: match.service,
          category: match.category,
        };
      })
      .filter((item): item is { id: string; label: string; category: string } => Boolean(item));

    if (rows.length > 0) return rows;

    // Fallback affichage si l'ID n'est pas encore resolu (ne persiste pas d'override sans ID).
    return (activeServiceLabels ?? [])
      .filter(Boolean)
      .map((label) => ({
        id: "",
        label,
        category: "Service actif",
      }));
  }, [activeServiceIds, activeServiceLabels, catalogById]);

  const allCatalogRows = useMemo(
    () =>
      Object.values(servicesCatalog.byCategory)
        .flat()
        .map((item) => ({
          id: String(item.id),
          label: item.service,
          category: item.category,
        }))
        .sort((a, b) => `${a.category} ${a.label}`.localeCompare(`${b.category} ${b.label}`)),
    [servicesCatalog.byCategory],
  );

  const contextualServiceRows = useMemo(() => {
    if (contextualServiceScope === "all") return allCatalogRows;
    return activeServiceRows;
  }, [contextualServiceScope, allCatalogRows, activeServiceRows]);

  useEffect(() => {
    if (contextualServiceScope === "missions" && activeServiceRows.length === 0) {
      setContextualServiceScope("all");
    }
  }, [contextualServiceScope, activeServiceRows.length]);

  const isContextualMode = Boolean(
    pricingV2 && onChangePricingV2 && contextualServiceRows.length > 0,
  );
  const shouldShowAdvancedTools = !isContextualMode || showAdvancedPricingTools;

  const filteredContextualServiceRows = useMemo(() => {
    const q = normalizeServiceText(prioritySearch);
    if (!q) return contextualServiceRows;
    return contextualServiceRows.filter((row) =>
      normalizeServiceText(`${row.label} ${row.category}`).includes(q),
    );
  }, [contextualServiceRows, prioritySearch]);

  const getServicePricingType = (serviceId: string): "hourly" | "fixed" => {
    if (!serviceId || !pricingV2) return "hourly";
    return pricingV2.serviceOverrides?.[serviceId]?.pricingType ?? "hourly";
  };

  const handleServicePricingTypeChange = (
    serviceId: string,
    pricingType: "hourly" | "fixed",
  ) => {
    if (!pricingV2 || !onChangePricingV2 || !serviceId) return;
    const currentOverride = pricingV2.serviceOverrides?.[serviceId];

    onChangePricingV2({
      ...pricingV2,
      serviceOverrides: {
        ...(pricingV2.serviceOverrides ?? {}),
        [serviceId]: {
          ...(currentOverride ?? { enabled: true }),
          enabled: true,
          pricingType,
        },
      },
    });
  };

  const togglePriorityRowEdit = (rowKey: string) => {
    setEditingPriorityRows((prev) => ({
      ...prev,
      [rowKey]: !prev[rowKey],
    }));
  };

  const closePriorityRowEdit = (rowKey: string) => {
    setEditingPriorityRows((prev) => ({
      ...prev,
      [rowKey]: false,
    }));
  };

  const getEffectiveModifierPercent = (
    serviceId: string,
    modifierKey: PricingModifierKey,
  ): number => {
    const globalValue = pricingV2?.globalModifiers?.[modifierKey] ?? 0;
    const override = pricingV2?.serviceOverrides?.[serviceId]?.modifierOverride?.[modifierKey];
    if (!override) return globalValue;
    return override.mode === "replace" ? override.value : globalValue + override.value;
  };

  const updateServiceModifier = (
    serviceId: string,
    modifierKey: PricingModifierKey,
    override: PricingOverrideValue | null,
  ) => {
    if (!pricingV2 || !onChangePricingV2 || !serviceId) return;

    const currentOverride = pricingV2.serviceOverrides?.[serviceId];
    const nextModifierOverride = {
      ...(currentOverride?.modifierOverride ?? {}),
    };

    if (override) {
      nextModifierOverride[modifierKey] = override;
    } else {
      delete nextModifierOverride[modifierKey];
    }

    const hasModifierKeys = Object.keys(nextModifierOverride).length > 0;
    const nextServiceOverride = {
      ...(currentOverride ?? { enabled: true }),
      enabled: hasModifierKeys || currentOverride?.enabled === true,
      modifierOverride: nextModifierOverride,
    };

    onChangePricingV2({
      ...pricingV2,
      serviceOverrides: {
        ...(pricingV2.serviceOverrides ?? {}),
        [serviceId]: nextServiceOverride,
      },
    });
  };

  const handlePriceOverrideChange = (
    serviceId: string,
    modifierKey: PricingModifierKey,
    priceValue: string,
  ) => {
    if (!pricingV2) return;
    const numericPrice = Number(priceValue);
    if (!Number.isFinite(numericPrice)) return;

    const base = Math.max(0, pricingV2.base.hourlyRate ?? 0);
    const normalized = Math.max(0, numericPrice);
    const percent = base > 0 ? ((normalized / base) - 1) * 100 : 0;
    updateServiceModifier(serviceId, modifierKey, { mode: "replace", value: percent });
  };

  /* -------------------------------------------------------------------------- */
  /*                                   RENDER                                   */
  /* -------------------------------------------------------------------------- */
  return (
    <div className={styles.root}>
      {/* HEADER & FILTERS */}
      <div className={styles.toolbar}>
        {showHeader && (
          <div className={styles.headingBlock}>
            <h3 className={styles.headingTitle}>
              {isContextualMode
                ? "Tarification contextuelle simplifiee"
                : "Ma grille tarifaire personnalisee"}
            </h3>
            <p className={styles.headingText}>
              {isContextualMode
                ? "Modifiez rapidement vos tarifs par service et par contexte."
                : "Definissez vos tarifs selon le type de bien, la surface et la duree."}
            </p>
            {linkedPackageId && (
              <p className={styles.headingPackHint}>
                Les nouveaux tarifs seront aussi lies au pack :{' '}
                <strong>{linkedPackageName ?? linkedPackageId}</strong>
              </p>
            )}
            <div className={styles.inlineStats}>
              <span className={styles.inlineStat}>
                <strong>{pricings.length}</strong> règles
              </span>
              <span className={styles.inlineStat}>
                <strong>{linkedServiceCount}</strong> liees a un service
              </span>
            </div>
          </div>
        )}

        <div className={styles.controlsPanel}>
          {isContextualMode ? (
            <>
              <select
                className={styles.selectControl}
                value={contextualServiceScope}
                onChange={(e) =>
                  setContextualServiceScope(e.target.value as "missions" | "all")
                }
                aria-label="Source des services de la grille"
              >
                <option value="missions">Services missions</option>
                <option value="all">Tous les services</option>
              </select>
              <div className={styles.searchWrapper}>
                <FiSearch size={16} className={styles.searchIcon} aria-hidden="true" />
                <input
                  className={styles.searchInput}
                  type="text"
                  placeholder="Rechercher un service..."
                  value={prioritySearch}
                  onChange={(e) => setPrioritySearch(e.target.value)}
                  aria-label="Rechercher un service actif"
                />
              </div>
              <button
                type="button"
                className={`${styles.ghostButton} ${styles.buttonWithIcon}`}
                onClick={() => setPrioritySearch("")}
                disabled={!prioritySearch.trim()}
              >
                <FiRefreshCw size={14} aria-hidden="true" />
                Réinitialiser
              </button>
              <button
                type="button"
                className={`${styles.primaryButton} ${styles.buttonWithIcon}`}
                onClick={() => setShowAdvancedPricingTools((prev) => !prev)}
              >
                <FiPlus size={16} aria-hidden="true" />
                {showAdvancedPricingTools ? "Masquer options avancees" : "Options avancees"}
              </button>
            </>
          ) : (
            <>
              <div className={styles.filterGroup}>
                <FiFilter size={16} className={styles.filterIcon} aria-hidden="true" />
                <select
                  className={styles.selectControl}
                  value={filterPropertyType}
                  onChange={(e) => setFilterPropertyType(e.target.value as PropertyType | '')}
                  aria-label="Filtrer par type de bien"
                >
                  <option value="">Tous les types</option>
                  {propertyTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <select
                  className={styles.selectControl}
                  value={filterPricingType}
                  onChange={(e) => setFilterPricingType(e.target.value as PricingType | '')}
                  aria-label="Filtrer par type de tarification"
                >
                  <option value="">Toutes tarifications</option>
                  {pricingTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.searchWrapper}>
                <FiSearch size={16} className={styles.searchIcon} aria-hidden="true" />
                <input
                  className={styles.searchInput}
                  type="text"
                  placeholder="Rechercher un libelle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Rechercher un tarif"
                />
              </div>

              <button
                type="button"
                className={`${styles.ghostButton} ${styles.buttonWithIcon}`}
                onClick={resetFilters}
                disabled={!hasFilters}
              >
                <FiRefreshCw size={14} aria-hidden="true" />
                Réinitialiser
              </button>

              <button
                type="button"
                className={`${styles.primaryButton} ${styles.buttonWithIcon}`}
                onClick={() => setShowAddForm((prev) => !prev)}
              >
                <FiPlus size={16} aria-hidden="true" />
                {showAddForm ? 'Fermer le formulaire' : 'Nouvelle regle'}
              </button>
            </>
          )}
        </div>
      </div>

      {pricingV2 && onChangePricingV2 && contextualServiceRows.length > 0 && (
        <div className={styles.priorityCard}>
          {showContextualHeader && (
            <div className={styles.priorityHeader}>
              <h4>Tarifs par service et contexte</h4>
              <p>
                Modifiez vos tarifs directement ici (horaire ou forfait), puis ajustez
                les contextes: urgence, nuit, week-end, haute saison.
              </p>
            </div>
          )}
          <div className={styles.priorityTableWrap}>
            <table className={styles.priorityTable}>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Type</th>
                  <th>Base</th>
                  {modifierColumns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredContextualServiceRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      <p className={styles.emptyTitle}>
                        Aucun service ne correspond a la recherche.
                      </p>
                    </td>
                  </tr>
                )}
                {filteredContextualServiceRows.map((serviceRow) => (
                  <tr key={`${serviceRow.id || "label"}-${serviceRow.label}`}>
                    <td>
                      <div className={styles.priorityServiceCell}>
                        <div className={styles.priorityServiceTop}>
                          <strong>{serviceRow.label}</strong>
                          {editingPriorityRows[serviceRow.id || `label:${serviceRow.label}`] ? (
                            <button
                              type="button"
                              className={`${styles.priorityEditButton} ${styles.prioritySaveButton}`}
                              disabled={!serviceRow.id}
                              onClick={() =>
                                closePriorityRowEdit(serviceRow.id || `label:${serviceRow.label}`)
                              }
                              title="Valider les modifications"
                              aria-label={`Valider les tarifs de ${serviceRow.label}`}
                            >
                              <FiCheck size={14} />
                            </button>
                          ) : (
                          <button
                            type="button"
                            className={styles.priorityEditButton}
                            disabled={!serviceRow.id}
                            onClick={() =>
                              togglePriorityRowEdit(
                                serviceRow.id || `label:${serviceRow.label}`,
                              )
                            }
                            title={
                              editingPriorityRows[serviceRow.id || `label:${serviceRow.label}`]
                                ? "Terminer la modification"
                                : "Modifier les tarifs"
                            }
                            aria-label={
                              editingPriorityRows[serviceRow.id || `label:${serviceRow.label}`]
                                ? `Terminer la modification de ${serviceRow.label}`
                                : `Modifier les tarifs de ${serviceRow.label}`
                            }
                          >
                            <FiEdit2 size={14} />
                          </button>
                          )}
                        </div>
                        <span>{serviceRow.category}</span>
                      </div>
                    </td>
                    <td>
                      <select
                        className={styles.priorityTypeSelect}
                        value={getServicePricingType(serviceRow.id)}
                        disabled={
                          !serviceRow.id ||
                          !editingPriorityRows[serviceRow.id || `label:${serviceRow.label}`]
                        }
                        onChange={(e) =>
                          handleServicePricingTypeChange(
                            serviceRow.id,
                            e.target.value as "hourly" | "fixed",
                          )
                        }
                        aria-label={`Type de tarification pour ${serviceRow.label}`}
                      >
                        <option value="hourly">Horaire</option>
                        <option value="fixed">Forfait</option>
                      </select>
                    </td>
                    <td>
                      <div className={styles.priorityCell}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={styles.priorityInput}
                          value={Number(pricingV2?.base.hourlyRate ?? 0).toFixed(2)}
                          disabled
                          readOnly
                        />
                        <small>
                          {getServicePricingType(serviceRow.id) === "fixed" ? "EUR" : "EUR/h"}
                        </small>
                      </div>
                    </td>
                    {modifierColumns.map((column) => {
                      const baseHourly = Number(pricingV2?.base.hourlyRate ?? 0);
                      const effectivePercent = serviceRow.id
                        ? getEffectiveModifierPercent(serviceRow.id, column.key)
                        : pricingV2.globalModifiers[column.key] ?? 0;
                      const computedPrice = Math.max(
                        0,
                        baseHourly * (1 + effectivePercent / 100),
                      );
                      const disabled =
                        !serviceRow.id ||
                        !editingPriorityRows[serviceRow.id || `label:${serviceRow.label}`];

                      return (
                        <td key={`${serviceRow.id}-${column.key}`}>
                          <div className={styles.priorityCell}>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className={styles.priorityInput}
                              value={computedPrice.toFixed(2)}
                              disabled={disabled}
                              onChange={(e) =>
                                handlePriceOverrideChange(
                                  serviceRow.id,
                                  column.key,
                                  e.target.value,
                                )
                              }
                            />
                            <small>{effectivePercent >= 0 ? "+" : ""}{effectivePercent.toFixed(0)}%</small>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD/EDIT FORM */}
      {shouldShowAdvancedTools && showAddForm && (
        <div className={styles.formCard}>
          <h4 className={styles.formTitle}>
            {editingId ? 'Modifier la regle' : 'Nouvelle regle tarifaire'}
          </h4>
          
          <div className={styles.formLayout}>
            {/* Service (optionnel) */}
            <div>
              <label className={styles.fieldLabel}>
                Service associe (optionnel)
              </label>
              {hasActiveServiceFilter && (
                <p className={styles.fieldHint}>
                  {selectableServiceCount > 0
                    ? "Seuls les services actifs dans l'onglet Missions sont proposes."
                    : 'Aucun service actif: activez un service dans Missions ou laissez ce champ vide.'}
                </p>
              )}
              <select
                className={styles.inputControl}
                value={formData.service_id}
                onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                aria-label="Service associe"
              >
                <option value="">- Service personnalise -</option>
                {Object.entries(selectableServicesByCategory).map(([cat, services]) => (
                  <optgroup key={cat} label={cat}>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.service}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Libelle */}
            <div>
              <label className={styles.fieldLabel}>
                Libelle du tarif *
              </label>
              <input
                className={styles.inputControl}
                type="text"
                placeholder="Ex: Menage appartement 2 pieces"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
            </div>

            <div className={styles.formGrid}>
              {/* Type de bien */}
              <div>
                <label className={styles.fieldLabel}>
                  Type de bien
                </label>
                <select
                  className={styles.inputControl}
                  value={formData.property_type}
                  onChange={(e) => setFormData({ ...formData, property_type: e.target.value as PropertyType })}
                  aria-label="Type de bien"
                >
                  {propertyTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Type de tarification */}
              <div>
                <label className={styles.fieldLabel}>
                  Type de tarification
                </label>
                <select
                  className={styles.inputControl}
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as PricingType })}
                  aria-label="Type de tarification"
                >
                  {pricingTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Surface min */}
              <div>
                <label className={styles.fieldLabel}>
                  Surface min (m2)
                </label>
                <input
                  className={styles.inputControl}
                  type="number"
                  value={formData.surface_min}
                  onChange={(e) => setFormData({ ...formData, surface_min: e.target.value })}
                  aria-label="Surface minimum en metres carres"
                  placeholder="Ex: 0"
                  min="0"
                />
              </div>

              {/* Surface max */}
              <div>
                <label className={styles.fieldLabel}>
                  Surface max (m2)
                </label>
                <input
                  className={styles.inputControl}
                  type="number"
                  value={formData.surface_max}
                  onChange={(e) => setFormData({ ...formData, surface_max: e.target.value })}
                  aria-label="Surface maximum en metres carres"
                  placeholder="Ex: 50"
                  min="0"
                />
              </div>

              {/* Prix */}
              <div>
                <label className={styles.fieldLabel}>
                  {formData.type === 'fixed' ? 'Prix forfait (EUR) *' : 'Tarif (EUR) *'}
                </label>
                <input
                  className={styles.inputControl}
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  aria-label="Montant du tarif en euros"
                  placeholder="Ex: 45"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Duree estimee */}
              <div>
                <label className={styles.fieldLabel}>
                  Duree estimee (h)
                </label>
                <input
                  className={styles.inputControl}
                  type="number"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                  aria-label="Duree estimee en heures"
                  placeholder="Ex: 2.5"
                  min="0"
                  step="0.5"
                />
              </div>
            </div>

            {linkedPackageId && !editingId && (
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={linkToPackage}
                    onChange={(e) => setLinkToPackage(e.target.checked)}
                  />
                  <span>
                    Lier ce tarif au pack {linkedPackageName ?? linkedPackageId}
                  </span>
                </label>
              </div>
            )}

            {/* Actions */}
            <div className={styles.formActions}>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className={styles.successButton}
              >
                {loading ? 'Enregistrement...' : (editingId ? 'Mettre a jour' : 'Ajouter')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className={styles.secondaryButton}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRICING RULES TABLE */}
      {shouldShowAdvancedTools && linkedPackageId && (
        <div className={styles.packageBar}>
          <p>
            Selectionnez des tarifs existants puis integrez-les au pack {linkedPackageName ?? linkedPackageId}.
          </p>
          <button
            type="button"
            onClick={handleAttachSelectedToPack}
            disabled={selectedPricingIdsForPack.length === 0 || isLinkingSelected}
            className={styles.packLinkButton}
          >
            {isLinkingSelected
              ? 'Integration...'
              : `Integrer au pack (${selectedPricingIdsForPack.length})`}
          </button>
        </div>
      )}

      {shouldShowAdvancedTools && (
      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
        <table className={styles.pricingTable}>
          <thead>
            <tr className={styles.tableHeaderRow}>
              {linkedPackageId && (
                <th className={styles.tableHeadCell}>
                  PACK
                </th>
              )}
              <th className={styles.tableHeadCell}>
                LIBELLE
              </th>
              <th className={styles.tableHeadCell}>
                TYPE DE BIEN
              </th>
              <th className={styles.tableHeadCell}>
                SURFACE
              </th>
              <th className={styles.tableHeadCell}>
                TARIFICATION
              </th>
              <th className={styles.tableHeadCell}>
                DUREE
              </th>
              <th className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}>
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {visiblePricings.length === 0 ? (
              <tr>
                <td colSpan={linkedPackageId ? 7 : 6} className={styles.emptyCell}>
                  <p className={styles.emptyTitle}>
                    {searchTerm || filterPropertyType || filterPricingType
                      ? 'Aucun tarif ne correspond aux filtres'
                      : 'Aucune regle tarifaire definie.'}
                  </p>
                  {(searchTerm || filterPropertyType || filterPricingType) && (
                    <button
                      type="button"
                      className={styles.emptyAction}
                      onClick={resetFilters}
                    >
                      Effacer les filtres
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              visiblePricings.map((pricing) => {
                const isAlreadyLinkedToCurrentPack =
                  linkedPackageId && linkedPricingSignatures.has(getPricingSignature(pricing));
                const isCheckedForPack = selectedPricingIdsForPack.includes(pricing.id);

                return (
                <tr
                  key={pricing.id}
                  className={styles.tableRow}
                >
                  {linkedPackageId && (
                    <td className={styles.tableCell}>
                      <label className={styles.packToggle}>
                        <input
                          type="checkbox"
                          checked={isCheckedForPack}
                          onChange={() => togglePricingSelectionForPack(pricing.id)}
                          disabled={Boolean(isAlreadyLinkedToCurrentPack)}
                        />
                        <span className={styles.packToggleText}>
                          {isAlreadyLinkedToCurrentPack ? 'Deja lie' : 'Lier'}
                        </span>
                      </label>
                    </td>
                  )}
                  <td className={styles.tableCell}>
                    <div className={styles.labelCell}>
                      <span className={styles.labelText}>{pricing.label}</span>
                      {pricing.service && (
                        <div className={styles.serviceMeta}>
                          {pricing.service.category} {"->"} {pricing.service.service}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.inlineCell}>
                      <FiHome size={16} color="#6b7280" />
                      <span>
                        {getPropertyTypeLabel(pricing.property_type)}
                      </span>
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.inlineCell}>
                      <FiSquare size={16} color="#6b7280" />
                      <span>{getSurfaceLabel(pricing.surface_min, pricing.surface_max)}</span>
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={`${styles.inlineCell} ${styles.priceCell}`}>
                      <FiDollarSign size={16} color="#10b981" />
                      <span>
                        {getPriceDisplay(pricing)}
                      </span>
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.inlineCell}>
                      <FiClock size={16} color="#6b7280" />
                      <span>{pricing.estimated_duration ? `${pricing.estimated_duration}h` : '-'}</span>
                    </div>
                  </td>
                  <td className={`${styles.tableCell} ${styles.actionsCell}`}>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        onClick={() => handleEdit(pricing)}
                        aria-label={`Modifier le tarif ${pricing.label}`}
                        title="Modifier"
                        className={`${styles.iconActionButton} ${styles.iconActionEdit}`}
                      >
                        <FiEdit2 size={16} color="#6b7280" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(pricing.id)}
                        aria-label={`Supprimer le tarif ${pricing.label}`}
                        title="Supprimer"
                        className={`${styles.iconActionButton} ${styles.iconActionDelete}`}
                      >
                        <FiTrash2 size={16} color="#dc2626" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>
      </div>
      )}

      {/* QUICK STATS */}
      {shouldShowAdvancedTools && showQuickStats && visiblePricings.length > 0 && (
        <div className={styles.quickStatsCard}>
          <h4 className={styles.quickStatsTitle}>
            Statistiques rapides
          </h4>
          <div className={styles.quickStatsGrid}>
            <div className={styles.quickStatItem}>
              <div className={styles.quickStatLabel}>
                Règles définies
              </div>
              <div className={styles.quickStatValue}>
                {visiblePricings.length}
              </div>
            </div>
            <div className={styles.quickStatItem}>
              <div className={styles.quickStatLabel}>
                Tarifs lies a un service
              </div>
              <div className={styles.quickStatValue}>
                {linkedServiceCount}
              </div>
            </div>
            <div className={styles.quickStatItem}>
              <div className={styles.quickStatLabel}>
                Tarif moyen forfait
              </div>
              <div className={styles.quickStatValue}>
                {averageFixedAmount} EUR
              </div>
            </div>
            <div className={styles.quickStatItem}>
              <div className={styles.quickStatLabel}>
                Tarif horaire moyen
              </div>
              <div className={styles.quickStatValue}>
                {averageHourlyAmount} EUR/h
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingGridManager;
