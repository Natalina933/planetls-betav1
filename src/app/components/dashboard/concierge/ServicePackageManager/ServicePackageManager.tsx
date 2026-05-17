"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Package,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Tag,
  Unlink,
  X,
  Zap,
} from "lucide-react";
import {
  DEFAULT_SERVICE_PACK_TEMPLATES,
  type DefaultPackTemplate,
  normalizeServicePackageName,
  normalizeServicePackageText,
} from "@/types/servicePackages";
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
  accent: PackAccent;
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
  accent?: PackAccent | null;
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
  { id: "1", category: "Ménage", service: "Ménage standard", description: "Nettoyage complet", isProposed: true },
  { id: "2", category: "Ménage", service: "Ménage entre voyageurs", description: "Nettoyage rapide", isProposed: true },
  { id: "13", category: "Linge", service: "Gestion stock linge", description: "Inventaire et renouvellement", isProposed: true },
  { id: "15", category: "Linge", service: "Linge bébé", description: "Draps et lit parapluie", isProposed: true },
  { id: "16", category: "Accueil", service: "Check-in / Check-out", description: "Accueil voyageurs", isProposed: true },
  { id: "17", category: "Accueil", service: "Conciergerie 24/7", description: "Disponibilité 24h/24", isProposed: true },
  { id: "18", category: "Accueil", service: "Kit de bienvenue", description: "Kit personnalisé", isProposed: true },
  { id: "25", category: "Maintenance", service: "Contrôle d'état", description: "Vérification logement", isProposed: true },
  { id: "35", category: "Courses", service: "Courses d'arrivée", description: "Produits première nécessité", isProposed: true },
];

type PackAccent = DefaultPackTemplate["accent"];

const PACK_ACCENTS: Array<{ id: PackAccent; label: string }> = [
  { id: "teal", label: "Aqua" },
  { id: "sand", label: "Sable" },
  { id: "gold", label: "Or" },
  { id: "slate", label: "Ardoise" },
];

const toAccentClassName = (accent: PackAccent) =>
  `templateCard${accent.charAt(0).toUpperCase()}${accent.slice(1)}`;

const normalizePackage = (pkg: ApiPackage, services: Service[]): ServicePackage => {
  const idsFromItems = Array.isArray(pkg.services_package_items)
    ? pkg.services_package_items.map((item) => item.service_id)
    : [];
  const serviceIds =
    Array.isArray(pkg.service_ids) && pkg.service_ids.length > 0 ? pkg.service_ids : idsFromItems;

  return {
    id: pkg.id,
    name: pkg.name,
    description: pkg.description ?? "",
    category: pkg.category ?? "Général",
    accent: pkg.accent ?? "teal",
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
    level: "Essentiel",
    startingPrice: "",
    promise: "",
    accent: "teal" as PackAccent,
    selected_service_ids: [] as string[],
  });

  const missionLabelSet = useMemo(
    () =>
      new Set(
        (activeMissionServiceLabels ?? [])
          .filter(Boolean)
          .map((label) => normalizeServicePackageText(label)),
      ),
    [activeMissionServiceLabels],
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
        missionLabelSet.has(normalizeServicePackageText(service.service)),
    );
  }, [proposedServices, missionIdSet, missionLabelSet]);

  const existingPackageNames = useMemo(
    () => new Set(packages.map((pkg) => normalizeServicePackageName(pkg.name))),
    [packages],
  );

  const usedAccents = useMemo(
    () => new Set(packages.map((pkg) => pkg.accent)),
    [packages],
  );

  const availableAccents = useMemo(
    () => PACK_ACCENTS.filter((accent) => !usedAccents.has(accent.id)),
    [usedAccents],
  );

  const suggestedTemplates = useMemo(
    () =>
      DEFAULT_SERVICE_PACK_TEMPLATES.filter(
        (template) =>
          !existingPackageNames.has(normalizeServicePackageName(template.name)) &&
          !usedAccents.has(template.accent),
      ),
    [existingPackageNames, usedAccents],
  );

  React.useEffect(() => {
    if (!usedAccents.has(formData.accent)) return;
    const nextAccent = availableAccents[0]?.id;
    if (nextAccent) {
      setFormData((prev) => ({ ...prev, accent: nextAccent }));
    }
  }, [availableAccents, formData.accent, usedAccents]);

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
          // fallback local si catalogue indisponible
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

  const selectedServicesPreview = useMemo(
    () =>
      availableServices.filter((service) =>
        formData.selected_service_ids.includes(service.id),
      ),
    [availableServices, formData.selected_service_ids],
  );

  const handleCreatePackage = useCallback(async () => {
    const availableIdSet = new Set(availableServices.map((service) => service.id));
    const selectedAllowedServiceIds = formData.selected_service_ids.filter((id) =>
      availableIdSet.has(id),
    );
    const normalizedIncomingName = normalizeServicePackageName(formData.name);

    if (!formData.name.trim() || !formData.category || selectedAllowedServiceIds.length === 0) {
      alert("Remplissez tous les champs et sélectionnez au moins un service");
      return;
    }

    if (existingPackageNames.has(normalizedIncomingName)) {
      alert("Un pack avec ce nom existe déjà.");
      return;
    }

    if (usedAccents.has(formData.accent)) {
      alert("Choisissez une couleur disponible pour ce pack.");
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
          accent: formData.accent,
          service_ids: selectedAllowedServiceIds,
        }),
      });

      if (!response.ok) throw new Error("Erreur création pack");

      const created: ApiPackage = await response.json();
      const newPackage = normalizePackage(created, proposedServices);

      setPackages((prev) => {
        const next = [newPackage, ...prev];
        onPacksLoaded?.(next);
        return next;
      });
      onPackCreated?.(newPackage);
      setSelectedPackId(newPackage.id);
      setFormData({
        name: "",
        description: "",
        category: "",
        level: "Essentiel",
        startingPrice: "",
        promise: "",
        accent: availableAccents[0]?.id ?? "teal",
        selected_service_ids: [],
      });
      setShowNewPackForm(false);
    } catch (err) {
      console.error("Erreur création pack:", err);
      alert("Erreur lors de la création du pack");
    } finally {
      setIsSubmitting(false);
    }
  }, [availableAccents, availableServices, existingPackageNames, formData, onPackCreated, onPacksLoaded, proposedServices, usedAccents]);

  const handleCreateTemplate = useCallback(
    async (template: DefaultPackTemplate) => {
      const matchedServiceIds = availableServices
        .filter((service) => {
          const haystack = normalizeServicePackageText(
            `${service.category} ${service.service} ${service.description}`,
          );
          return template.serviceHints.some((hint) =>
            haystack.includes(normalizeServicePackageText(hint)),
          );
        })
        .map((service) => service.id);

      const uniqueServiceIds = Array.from(new Set(matchedServiceIds));

      if (uniqueServiceIds.length === 0) {
        alert("Aucun service actif ne correspond encore à ce modèle.");
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await fetch("/api/services/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: template.name,
            description: template.description,
            category: template.category,
            accent: template.accent,
            service_ids: uniqueServiceIds,
          }),
        });

        if (!response.ok) throw new Error("Erreur création pack");

        const created: ApiPackage = await response.json();
        const newPackage = normalizePackage(created, proposedServices);

        setPackages((prev) => {
          const next = [newPackage, ...prev];
          onPacksLoaded?.(next);
          return next;
        });
        onPackCreated?.(newPackage);
        setSelectedPackId(newPackage.id);
      } catch (err) {
        console.error("Erreur création pack modèle:", err);
        alert("Erreur lors de la création du pack");
      } finally {
        setIsSubmitting(false);
      }
    },
    [availableServices, onPackCreated, onPacksLoaded, proposedServices],
  );

  React.useEffect(() => {
    const availableIdSet = new Set(availableServices.map((service) => service.id));
    setFormData((prev) => ({
      ...prev,
      selected_service_ids: prev.selected_service_ids.filter((id) => availableIdSet.has(id)),
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
          throw new Error("Erreur chargement tarifs liés");
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
        console.warn("Chargement tarifs liés indisponible:", err);
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
          throw new Error("Erreur suppression tarif lié");
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
        console.error("Erreur suppression tarif lié:", err);
        alert("Erreur lors de la suppression du tarif lié");
      }
    },
    [selectedPackId],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>
            <Sparkles size={24} /> Offres
          </h2>
          <p>Visualisez vos packs et composez une nouvelle offre.</p>
        </div>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.back()}
        >
          Retour
        </button>
      </div>

      <div className={`${styles.content} ${!selectedPackage ? styles.contentSingle : ""}`}>
        <div className={styles.packsList}>
          <div className={styles.listHeader}>
            <h3>{showNewPackForm ? "Composition" : "Packs existants"}</h3>
            {!showNewPackForm && (
              <button onClick={() => setShowNewPackForm(true)} className={styles.addButton}>
                <Plus size={18} /> Créer un pack
              </button>
            )}
          </div>

          {showNewPackForm && (
            <div className={styles.newPackForm}>
              <div className={styles.formHeader}>
                <span>
                  <Sparkles size={18} />
                </span>
                <div>
                  <h4>Informations de l&apos;offre</h4>
                  <p>Nom, description et services.</p>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Nom du pack *</label>
                <input
                  type="text"
                  placeholder="Ex : Pack courte durée, Pack luxe..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  placeholder="Décrire ce pack..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Promesse</label>
                <input
                  type="text"
                  placeholder="Ex : Accueil fluide, logement prêt, voyageurs rassurés"
                  value={formData.promise}
                  onChange={(e) => setFormData({ ...formData, promise: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="service-package-category">Catégorie principale *</label>
                <select
                  id="service-package-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Sélectionner...</option>
                  {Object.keys(servicesByCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="service-package-level">Niveau</label>
                <select
                  id="service-package-level"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                >
                  <option value="Essentiel">Essentiel</option>
                  <option value="Confort">Confort</option>
                  <option value="Premium">Premium</option>
                  <option value="Sur-mesure">Sur-mesure</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Prix indicatif</label>
                <input
                  type="text"
                  placeholder="Ex : À partir de 149 €"
                  value={formData.startingPrice}
                  onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                />
              </div>

              <div className={styles.colorChoice}>
                <label>Couleur du pack</label>
                <div className={styles.colorOptions}>
                  {PACK_ACCENTS.map((accent) => {
                    const disabled = usedAccents.has(accent.id);
                    return (
                      <button
                        key={accent.id}
                        type="button"
                        className={`${styles.colorOption} ${styles[`colorOption${accent.id.charAt(0).toUpperCase()}${accent.id.slice(1)}`]} ${
                          formData.accent === accent.id ? styles.colorOptionActive : ""
                        }`}
                        onClick={() => setFormData({ ...formData, accent: accent.id })}
                        disabled={disabled}
                        aria-pressed={formData.accent === accent.id}
                      >
                        <span />
                        {accent.label}
                      </button>
                    );
                  })}
                </div>
                {availableAccents.length === 0 ? (
                  <p className={styles.hint}>Toutes les couleurs sont déjà utilisées.</p>
                ) : null}
              </div>

              <div className={styles.serviceSelection}>
                <label>Services inclus *</label>
                <p className={styles.hint}>
                  {availableServices.length} service(s) disponible(s).
                </p>

                {availableServices.length === 0 && (
                  <p className={styles.hint}>
                    Aucun service actif trouvé dans Missions. Activez vos services dans
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
                          <span className={styles.serviceText}>
                            <span className={styles.serviceName}>{svc.service}</span>
                            <span className={styles.serviceDesc}>{svc.description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <aside
                className={`${styles.ownerPreview} ${styles[toAccentClassName(formData.accent)]}`}
                aria-label="Aperçu propriétaire"
              >
                <div className={styles.previewTopline}>
                  <span>
                    <Tag size={15} />
                    {formData.level || "Essentiel"}
                  </span>
                  <strong>{formData.startingPrice || "Prix à préciser"}</strong>
                </div>
                <h4>{formData.name || "Nom du pack"}</h4>
                <p>{formData.promise || formData.description || "Promesse courte visible côté propriétaire."}</p>
                <div className={styles.previewServices}>
                  {selectedServicesPreview.slice(0, 4).map((service) => (
                    <span key={service.id}>{service.service}</span>
                  ))}
                  {selectedServicesPreview.length === 0 ? <span>Services à sélectionner</span> : null}
                </div>
              </aside>

              <div className={styles.formActions}>
                <button
                  onClick={handleCreatePackage}
                  disabled={isSubmitting}
                  className={styles.saveButton}
                >
                  <Save size={18} /> {isSubmitting ? "Enregistrement..." : "Enregistrer l'offre"}
                </button>
                <button
                  onClick={() => {
                    setShowNewPackForm(false);
                    setFormData({
                      name: "",
                      description: "",
                      category: "",
                      level: "Essentiel",
                      startingPrice: "",
                      promise: "",
                      accent: availableAccents[0]?.id ?? "teal",
                      selected_service_ids: [],
                    });
                  }}
                  className={styles.cancelButton}
                >
                  Voir les packs existants
                </button>
              </div>
            </div>
          )}

          <div className={styles.packItems}>
            {!isLoadingPackages && !loadError && !showNewPackForm && packages.length > 0 && (
              <div className={styles.packsIntro}>
                <div className={styles.emptyIcon}>
                  <Package size={20} />
                </div>
                <div>
                  <strong>Construisez votre première offre prête à vendre</strong>
                  <p>Créez un pack à partir de vos services.</p>
                </div>
              </div>
            )}

            {!isLoadingPackages && !loadError && packages.length > 0 && (
              <div className={styles.existingPacksHeader}>
                <div>
                  <h4>Packs existants</h4>
                  <p>Sélectionnez un pack pour voir le détail.</p>
                </div>
                <span>{packages.length}</span>
              </div>
            )}

            {loadError && (
              <div className={styles.empty}>
                <p>{loadError}</p>
                <button
                  className={styles.addButton}
                  onClick={() => window.location.reload()}
                  type="button"
                >
                  Réessayer
                </button>
              </div>
            )}

            {isLoadingPackages && (
              <div className={styles.empty}>
                <p>Chargement des packs...</p>
              </div>
            )}

            {!isLoadingPackages && !loadError && packages.length === 0 && (
              <div className={styles.empty}>
                <div className={styles.emptyHero}>
                  <div className={styles.emptyIcon}>
                    <Sparkles size={20} />
                  </div>
                  <div className={styles.emptyContent}>
                    <strong>Aucun pack pour le moment</strong>
                    <p>
                      Utilisez un modèle ou créez votre propre pack.
                    </p>
                  </div>
                </div>
                {!showNewPackForm && (
                  <button
                    type="button"
                    className={styles.addButton}
                    onClick={() => setShowNewPackForm(true)}
                  >
                    <Plus size={18} /> Créer un pack
                  </button>
                )}
              </div>
            )}

            {!isLoadingPackages && !loadError && !showNewPackForm && suggestedTemplates.length > 0 && (
              <div className={styles.templatesPanel}>
                <div className={styles.templatesHeader}>
                  <div>
                    <h5>{packages.length === 0 ? "Modèles proposés" : "Autres modèles disponibles"}</h5>
                    <p>Des bases prêtes.</p>
                  </div>
                </div>
                <div className={styles.templateGrid}>
                  {suggestedTemplates.map((template) => (
                    <article
                      key={template.id}
                      className={`${styles.templateCard} ${styles[toAccentClassName(template.accent)]}`}
                    >
                      <div className={styles.templateVisual}>
                        <span className={styles.templateVisualWindow} />
                        <span className={styles.templateVisualKey} />
                        <span className={styles.templateVisualTag} />
                        <div className={styles.templateVisualCopy}>
                          <span>{template.category}</span>
                          <strong>{template.name}</strong>
                          <small>{template.id === "premium" ? "Recommandé" : "Prêt à adapter"}</small>
                        </div>
                      </div>
                      <div className={styles.templateTopRow}>
                        <span className={styles.templateCategory}>{template.category}</span>
                        {template.id === "premium" ? (
                          <span className={styles.templateRecommended}>Recommandé</span>
                        ) : (
                          <span className={styles.templateState}>Prêt à adapter</span>
                        )}
                      </div>
                      <div className={styles.templateBody}>
                        <strong className={styles.templateTitle}>{template.name}</strong>
                        <p className={styles.templateDescription}>{template.description}</p>
                        <div className={styles.templatePromise}>
                          <ShieldCheck size={15} />
                          <span>{template.promise}</span>
                        </div>
                        <div className={styles.templateHints}>
                          {template.serviceHints.slice(0, 4).map((hint) => (
                            <span key={hint}>{hint}</span>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={styles.templateButton}
                        onClick={() => handleCreateTemplate(template)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Enregistrement..." : "Utiliser ce modèle"}
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`${styles.packItem} ${styles[toAccentClassName(pkg.accent)]} ${selectedPackId === pkg.id ? styles.active : ""}`}
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
                type="button"
                onClick={() => {
                  handleRemovePackage(selectedPackage.id);
                }}
                className={styles.deleteButton}
                aria-label={`Supprimer le pack ${selectedPackage.name}`}
              >
                <X size={18} />
              </button>
            </div>

            {selectedPackage.description && (
              <p className={styles.detailsDescription}>{selectedPackage.description}</p>
            )}

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
                <h4>Tarifs attachés</h4>
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
                  <Zap size={16} /> Ajouter un tarif
                </button>
              </div>
              {isLoadingAttachedPricings ? (
                <p className={styles.emptyState}>Chargement des tarifs liés...</p>
              ) : selectedPackage.attached_pricings.length === 0 ? (
                <p className={styles.emptyState}>Aucun tarif lié. Créez un tarif pour ce pack.</p>
              ) : (
                <ul className={styles.linkedList}>
                  {selectedPackage.attached_pricings.map((pricing) => (
                    <li key={pricing.id}>
                      <span>
                        {pricing.label} ({Number(pricing.amount).toFixed(2)} EUR)
                      </span>
                      <button
                        className={styles.unlinkButton}
                        onClick={() => handleRemoveAttachedPricing(pricing.id)}
                        type="button"
                        aria-label={`Supprimer le tarif lié ${pricing.label}`}
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
                <h4>Modèles de contrats</h4>
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
                  <Zap size={16} /> Ajouter un modèle
                </button>
              </div>
              {selectedPackage.attached_contract_ids.length === 0 ? (
                <p className={styles.emptyState}>Aucun modèle attaché.</p>
              ) : (
                <ul className={styles.linkedList}>
                  {selectedPackage.attached_contract_ids.map((contractId) => (
                    <li key={contractId}>
                      <span>Contrat #{contractId}</span>
                      <button
                        className={styles.unlinkButton}
                        type="button"
                        aria-label={`Détacher le modèle de contrat ${contractId}`}
                      >
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
                Reliez ce pack à ses tarifs et contrats.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicePackageManager;
