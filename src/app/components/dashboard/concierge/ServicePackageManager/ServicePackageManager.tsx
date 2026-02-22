"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Package, Zap, AlertCircle, Save, Unlink } from "lucide-react";
import styles from "./ServicePackageManager.module.scss";

interface Service {
  id: string;
  category: string;
  service: string;
  description: string;
  isProposed: boolean;
}

interface ServicePackage {
  id: string;
  name: string;
  description?: string;
  category: string;
  service_ids: string[];
  services: Service[];
  attached_pricings: AttachedPricing[];
  attached_contract_ids: string[];
}

interface ApiPackageItem {
  service_id: string;
}

interface AttachedPricing {
  id: string;
  package_id: string;
  label: string;
  type: "hourly" | "fixed" | "monthly" | "custom";
  amount: number;
  property_type?: string | null;
}

interface ApiPackage {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  service_ids?: string[];
  services_package_items?: ApiPackageItem[];
}

interface ApiError {
  error?: string;
}

interface Props {
  onPackCreated?: (pack: ServicePackage) => void;
  onPacksLoaded?: (packs: ServicePackage[]) => void;
  activeMissionServiceIds?: string[];
  activeMissionServiceLabels?: string[];
}

const PROPOSED_SERVICES: Service[] = [
  { id: "1", category: "Menage", service: "Menage standard", description: "Nettoyage complet", isProposed: true },
  { id: "2", category: "Menage", service: "Menage entre voyageurs", description: "Nettoyage rapide", isProposed: true },
  { id: "13", category: "Linge", service: "Gestion stock linge", description: "Inventaire et renouvellement", isProposed: true },
  { id: "15", category: "Linge", service: "Linge bebe", description: "Draps et lit parapluie", isProposed: true },
  { id: "16", category: "Accueil", service: "Check-in / Check-out", description: "Accueil voyageurs", isProposed: true },
  { id: "17", category: "Accueil", service: "Conciergerie 24/7", description: "Disponibilite 24h/24", isProposed: true },
  { id: "18", category: "Accueil", service: "Kit de bienvenue", description: "Kit personnalise", isProposed: true },
  { id: "25", category: "Maintenance", service: "Controle d'etat", description: "Verification logement", isProposed: true },
  { id: "35", category: "Courses", service: "Courses d'arrivee", description: "Produits premiere necessite", isProposed: true },
];

const normalizePackage = (pkg: ApiPackage, services: Service[]): ServicePackage => {
  const idsFromItems = Array.isArray(pkg.services_package_items)
    ? pkg.services_package_items.map((item) => item.service_id)
    : [];
  const serviceIds = Array.isArray(pkg.service_ids) && pkg.service_ids.length > 0 ? pkg.service_ids : idsFromItems;

  return {
    id: pkg.id,
    name: pkg.name,
    description: pkg.description ?? "",
    category: pkg.category ?? "General",
    service_ids: serviceIds,
    services: services.filter((svc) => serviceIds.includes(svc.id)),
    attached_pricings: [],
    attached_contract_ids: [],
  };
};

const ServicePackageManager: React.FC<Props> = ({
  onPackCreated,
  onPacksLoaded,
  activeMissionServiceIds,
  activeMissionServiceLabels,
}) => {
  const router = useRouter();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [proposedServices, setProposedServices] = useState<Service[]>(PROPOSED_SERVICES);
  const [showNewPackForm, setShowNewPackForm] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingAttachedPricings, setIsLoadingAttachedPricings] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    selected_service_ids: [] as string[],
  });

  const normalizeServiceText = useCallback(
    (value: string) =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim(),
    [],
  );

  const missionLabelSet = useMemo(
    () =>
      new Set(
        (activeMissionServiceLabels ?? [])
          .filter(Boolean)
          .map((label) => normalizeServiceText(label)),
      ),
    [activeMissionServiceLabels, normalizeServiceText],
  );
  const missionIdSet = useMemo(
    () => new Set((activeMissionServiceIds ?? []).filter(Boolean)),
    [activeMissionServiceIds],
  );

  const availableServices = useMemo(() => {
    const hasMissionFilter = missionLabelSet.size > 0 || missionIdSet.size > 0;
    if (!hasMissionFilter) return proposedServices;

    return proposedServices.filter(
      (service) =>
        missionIdSet.has(service.id) ||
        missionLabelSet.has(normalizeServiceText(service.service)),
    );
  }, [proposedServices, missionIdSet, missionLabelSet, normalizeServiceText]);

  React.useEffect(() => {
    const loadPackages = async () => {
      setIsLoadingPackages(true);
      setLoadError(null);
      try {
        let servicesForMapping = PROPOSED_SERVICES;
        try {
          const servicesRes = await fetch("/api/services/services-catalog");
          if (servicesRes.ok) {
            const servicesData = (await servicesRes.json()) as Array<{
              id: number;
              category: string;
              service: string;
              description?: string | null;
            }>;
            const mappedServices = (Array.isArray(servicesData) ? servicesData : []).map(
              (item) => ({
                id: String(item.id),
                category: item.category,
                service: item.service,
                description: item.description ?? "",
                isProposed: true,
              }),
            );
            if (mappedServices.length > 0) {
              servicesForMapping = mappedServices;
              setProposedServices(mappedServices);
            }
          }
        } catch {
          // Fallback to static list if services catalog is unavailable
        }

        const response = await fetch("/api/services/packages");
        if (!response.ok) {
          const payload: ApiError | null = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "Erreur chargement packs");
        }
        const data: ApiPackage[] = await response.json();
        const mapped = data.map((pkg) => normalizePackage(pkg, servicesForMapping));
        setPackages(mapped);
        onPacksLoaded?.(mapped);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur chargement packs";
        console.warn("Chargement packs indisponible:", message);
        setLoadError(message);
      } finally {
        setIsLoadingPackages(false);
      }
    };

    loadPackages();
  }, [onPacksLoaded]);

  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, Service[]> = {};
    availableServices.forEach((svc) => {
      if (!grouped[svc.category]) grouped[svc.category] = [];
      grouped[svc.category].push(svc);
    });
    return grouped;
  }, [availableServices]);

  const handleCreatePackage = useCallback(async () => {
    const availableIdSet = new Set(availableServices.map((service) => service.id));
    const selectedAllowedServiceIds = formData.selected_service_ids.filter((id) =>
      availableIdSet.has(id),
    );

    if (!formData.name.trim() || !formData.category || selectedAllowedServiceIds.length === 0) {
      alert("Remplissez tous les champs et selectionnez au moins un service");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/services/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          service_ids: selectedAllowedServiceIds,
        }),
      });

      if (!response.ok) throw new Error("Erreur creation pack");

      const created: ApiPackage = await response.json();
      const newPackage = normalizePackage(created, proposedServices);

      setPackages((prev) => {
        const next = [newPackage, ...prev];
        onPacksLoaded?.(next);
        return next;
      });
      onPackCreated?.(newPackage);

      setFormData({ name: "", description: "", category: "", selected_service_ids: [] });
      setShowNewPackForm(false);
    } catch (err) {
      console.error("Erreur creation pack:", err);
      alert("Erreur lors de la creation du pack");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, proposedServices, onPackCreated, onPacksLoaded, availableServices]);

  React.useEffect(() => {
    const availableIdSet = new Set(availableServices.map((service) => service.id));
    setFormData((prev) => ({
      ...prev,
      selected_service_ids: prev.selected_service_ids.filter((id) =>
        availableIdSet.has(id),
      ),
    }));
  }, [availableServices]);

  const handleToggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      selected_service_ids: prev.selected_service_ids.includes(serviceId)
        ? prev.selected_service_ids.filter((id) => id !== serviceId)
        : [...prev.selected_service_ids, serviceId],
    }));
  };

  const handleRemovePackage = (packageId: string) => {
    setPackages((prev) => {
      const next = prev.filter((p) => p.id !== packageId);
      onPacksLoaded?.(next);
      return next;
    });
    setSelectedPackId(null);
  };

  const selectedPackage = packages.find((p) => p.id === selectedPackId);

  React.useEffect(() => {
    if (!selectedPackId) return;

    const loadAttachedPricings = async () => {
      setIsLoadingAttachedPricings(true);
      try {
        const response = await fetch(
          `/api/services/pricing-packages?packageId=${encodeURIComponent(selectedPackId)}`,
        );
        if (!response.ok) {
          throw new Error("Erreur chargement tarifs lies");
        }

        const data = (await response.json()) as AttachedPricing[];
        setPackages((prev) =>
          prev.map((pkg) =>
            pkg.id === selectedPackId
              ? { ...pkg, attached_pricings: Array.isArray(data) ? data : [] }
              : pkg,
          ),
        );
      } catch (err) {
        console.warn("Chargement tarifs lies indisponible:", err);
      } finally {
        setIsLoadingAttachedPricings(false);
      }
    };

    loadAttachedPricings();
  }, [selectedPackId]);

  const handleRemoveAttachedPricing = useCallback(
    async (pricingId: string) => {
      if (!selectedPackId) return;

      try {
        const response = await fetch(`/api/services/pricing-packages/${pricingId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Erreur suppression tarif lie");
        }

        setPackages((prev) =>
          prev.map((pkg) =>
            pkg.id === selectedPackId
              ? {
                  ...pkg,
                  attached_pricings: pkg.attached_pricings.filter(
                    (pricing) => pricing.id !== pricingId,
                  ),
                }
              : pkg,
          ),
        );
      } catch (err) {
        console.error("Erreur suppression tarif lie:", err);
        alert("Erreur lors de la suppression du tarif lie");
      }
    },
    [selectedPackId],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>
          <Package size={24} /> Packs de Services
        </h2>
        <p>Groupez vos services proposes pour creer des packages tarifaires et contractuels</p>
      </div>

      <div className={styles.content}>
        <div className={styles.packsList}>
          <div className={styles.listHeader}>
            <h3>Mes Packs ({packages.length})</h3>
            {!showNewPackForm && (
              <button onClick={() => setShowNewPackForm(true)} className={styles.addButton}>
                <Plus size={18} /> Nouveau Pack
              </button>
            )}
          </div>

          {showNewPackForm && (
            <div className={styles.newPackForm}>
              <h4>Creer un nouveau pack</h4>

              <div className={styles.formGroup}>
                <label>Nom du pack *</label>
                <input
                  type="text"
                  placeholder="Ex: Pack Courte Duree, Pack Luxe..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  placeholder="Decrire ce pack..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Categorie principale *</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  <option value="">Selectionner...</option>
                  {Object.keys(servicesByCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.serviceSelection}>
                <label>Services du pack *</label>
                <p className={styles.hint}>
                  Selectionnez au moins un service propose actif dans Missions :
                </p>
                <p className={styles.hint}>
                  {availableServices.length} service(s) disponible(s) selon vos services actifs.
                </p>

                {availableServices.length === 0 && (
                  <p className={styles.hint}>
                    Aucun service actif trouve dans Missions. Activez vos services dans
                    l&apos;onglet Missions pour les utiliser dans les packs.
                  </p>
                )}

                {Object.entries(servicesByCategory).map(([category, services]) => (
                  <div key={category} className={styles.categoryGroup}>
                    <h5>{category}</h5>
                    <div className={styles.serviceList}>
                      {services.map((svc) => (
                        <label key={svc.id} className={styles.serviceCheckbox}>
                          <input
                            type="checkbox"
                            checked={formData.selected_service_ids.includes(svc.id)}
                            onChange={() => handleToggleService(svc.id)}
                          />
                          <span className={styles.serviceName}>{svc.service}</span>
                          <span className={styles.serviceDesc}>{svc.description}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.formActions}>
                <button onClick={handleCreatePackage} disabled={isSubmitting} className={styles.saveButton}>
                  <Save size={18} /> {isSubmitting ? "Creation..." : "Creer le Pack"}
                </button>
                <button
                  onClick={() => {
                    setShowNewPackForm(false);
                    setFormData({ name: "", description: "", category: "", selected_service_ids: [] });
                  }}
                  className={styles.cancelButton}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          <div className={styles.packItems}>
            {loadError && (
              <div className={styles.empty}>
                <p>{loadError}</p>
                <button
                  className={styles.addButton}
                  onClick={() => window.location.reload()}
                  type="button"
                >
                  Reessayer
                </button>
              </div>
            )}

            {isLoadingPackages && <div className={styles.empty}><p>Chargement des packs...</p></div>}

            {!isLoadingPackages && !loadError && packages.length === 0 && !showNewPackForm && (
              <div className={styles.empty}>
                <Package size={40} />
                <p>Aucun pack cree. Commencez par creer votre premier pack.</p>
              </div>
            )}

            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`${styles.packItem} ${selectedPackId === pkg.id ? styles.active : ""}`}
                onClick={() => setSelectedPackId(pkg.id)}
              >
                <div className={styles.packItemHeader}>
                  <h4>{pkg.name}</h4>
                  <span className={styles.badgeCategory}>{pkg.category}</span>
                </div>
                <p className={styles.serviceCount}>
                  {pkg.services.length} service{pkg.services.length > 1 ? "s" : ""}
                </p>
                {pkg.description && <p className={styles.packDescription}>{pkg.description}</p>}
              </div>
            ))}
          </div>
        </div>

        {selectedPackage && (
          <div className={styles.packDetails}>
            <div className={styles.detailsHeader}>
              <h3>{selectedPackage.name}</h3>
              <button
                onClick={() => {
                  handleRemovePackage(selectedPackage.id);
                }}
                className={styles.deleteButton}
              >
                <X size={18} />
              </button>
            </div>

            {selectedPackage.description && <p className={styles.detailsDescription}>{selectedPackage.description}</p>}

            <div className={styles.detailsSection}>
              <h4>Services inclus</h4>
              <ul className={styles.servicesList}>
                {selectedPackage.services.map((svc) => (
                  <li key={svc.id} className={styles.serviceItem}>
                    <span className={styles.serviceName}>{svc.service}</span>
                    <span className={styles.serviceCategory}>{svc.category}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.detailsSection}>
              <div className={styles.sectionHeader}>
                <h4>Tarifs attaches</h4>
                <button
                  className={styles.linkButton}
                  onClick={() =>
                    router.push(
                      `/dashboard/concierge/pricing?packageId=${encodeURIComponent(
                        selectedPackage.id,
                      )}&packageName=${encodeURIComponent(selectedPackage.name)}`,
                    )
                  }
                >
                  <Zap size={16} /> Ajouter Tarif
                </button>
              </div>
              {isLoadingAttachedPricings ? (
                <p className={styles.emptyState}>Chargement des tarifs lies...</p>
              ) : selectedPackage.attached_pricings.length === 0 ? (
                <p className={styles.emptyState}>Aucun tarif lie. Creez un tarif pour ce pack.</p>
              ) : (
                <ul>
                  {selectedPackage.attached_pricings.map((pricing) => (
                    <li key={pricing.id}>
                      <span>
                        {pricing.label} ({Number(pricing.amount).toFixed(2)} EUR)
                      </span>
                      <button
                        className={styles.unlinkButton}
                        onClick={() => handleRemoveAttachedPricing(pricing.id)}
                        type="button"
                        aria-label={`Supprimer le tarif lie ${pricing.label}`}
                      >
                        <Unlink size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.detailsSection}>
              <div className={styles.sectionHeader}>
                <h4>Modeles de contrats</h4>
                <button
                  className={styles.linkButton}
                  onClick={() =>
                    router.push(
                      `/dashboard/concierge/contract-templates?packageId=${encodeURIComponent(
                        selectedPackage.id,
                      )}&packageName=${encodeURIComponent(selectedPackage.name)}`,
                    )
                  }
                >
                  <Zap size={16} /> Ajouter Modele
                </button>
              </div>
              {selectedPackage.attached_contract_ids.length === 0 ? (
                <p className={styles.emptyState}>Aucun modele attache.</p>
              ) : (
                <ul>
                  {selectedPackage.attached_contract_ids.map((contractId) => (
                    <li key={contractId}>
                      <span>Contrat #{contractId}</span>
                      <button className={styles.unlinkButton}>
                        <Unlink size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.infoBox}>
              <AlertCircle size={18} />
              <p>
                Ce pack regroupe vos services proposes. Vous pouvez le lier a des tarifs
                specifiques et des modeles de contrats.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicePackageManager;
