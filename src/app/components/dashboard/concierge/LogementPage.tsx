"use client";

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FiCamera, FiEdit2, FiFileText, FiHome, FiList, FiRotateCcw, FiSave } from "react-icons/fi";
import { Avatar } from "@/components/ui/Avatar";
import HousingPhotoManager from "@/app/components/dashboard/housing/HousingPhotoManager";
import styles from "./LogementWorkspace.module.scss";
import HousingStatusBadge from "./HousingStatusBadge";
import HousingOwnerContactSection from "./HousingOwnerContactSection";
import MissionDetails from "./MissionDetails/MissionDetails";
import OwnerInvitationPanel from "./OwnerInvitationPanel";
import type { ConciergeHousing, HousingRow } from "@/types/housing";
import {
  buildHousingMutationPayload,
  HOUSING_PLATFORM_OPTIONS,
  HOUSING_PROPERTY_TYPE_OPTIONS,
  HOUSING_STATUS_EXPLANATIONS,
  HOUSING_STATUS_OPTIONS,
  normalizeHousingRow,
  validateHousingDraft,
} from "@/types/housing";

type TabId = "synthese" | "infos" | "services" | "timeline" | "docs" | "quotes";

type ConciergeProfileService = {
  label: string;
  category: string;
};

type HousingQuoteRow = {
  id: string;
  quote_number: string;
  owner_profile_id: string | null;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
};

type HousingInvoiceRow = {
  id: string;
  invoice_number: string;
  quote_id: string | null;
  owner_profile_id: string | null;
  status: string;
  total_amount: number;
  balance_amount: number;
  currency: string;
  issue_date: string;
};

type ServiceCatalogItem = {
  id: string;
  category: string | null;
  service: string | null;
};

type ServicePackageRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  services_package_items?: Array<{ service_id: string }>;
};

type PricingPackageRow = {
  id: string;
  package_id: string;
  label: string;
  type: string;
  amount: number;
  property_type: string | null;
};

type ServiceSelectionMode = "pack" | "manual";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "synthese", label: "Synthèse" },
  { id: "infos", label: "Infos" },
  { id: "services", label: "Services" },
  { id: "timeline", label: "Historique" },
  { id: "docs", label: "Docs" },
  { id: "quotes", label: "Devis & factures" },
];

export default function LogementPage() {
  const params = useParams();
  const id = params.id as string;

  const [housing, setHousing] = useState<ConciergeHousing | null>(null);
  const [draft, setDraft] = useState<ConciergeHousing | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("synthese");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileServices, setProfileServices] = useState<ConciergeProfileService[]>([]);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalogItem[]>([]);
  const [servicePackages, setServicePackages] = useState<ServicePackageRow[]>([]);
  const [pricingPackages, setPricingPackages] = useState<PricingPackageRow[]>([]);
  const [quotes, setQuotes] = useState<HousingQuoteRow[]>([]);
  const [invoices, setInvoices] = useState<HousingInvoiceRow[]>([]);
  const [serviceSelectionMode, setServiceSelectionMode] = useState<ServiceSelectionMode>("pack");

  useEffect(() => {
    async function loadHousing() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`/api/housing/${id}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger le logement.");
        }

        const normalized = normalizeHousingRow(payload as HousingRow);
        setHousing(normalized);
        setDraft(normalized);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Impossible de charger le logement.");
      } finally {
        setLoading(false);
      }
    }

    void loadHousing();
  }, [id]);

  useEffect(() => {
    async function loadConciergeServices() {
      try {
        const response = await fetch("/api/profiles/current", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) return;

        const rawAvailability = typeof payload?.availability_hours === "string" ? payload.availability_hours : "";
        const parsed = rawAvailability ? JSON.parse(rawAvailability) : {};
        const missionProfile =
          parsed?.missionProfile && typeof parsed.missionProfile === "object" && !Array.isArray(parsed.missionProfile)
            ? parsed.missionProfile
            : null;
        const missionRows = Array.isArray(missionProfile?.missions) ? missionProfile.missions : [];

        const nextServices = missionRows
          .map((mission: unknown) => {
            if (!mission || typeof mission !== "object") return null;
            const item = mission as Record<string, unknown>;
            if (item.isActive !== true) return null;
            const label = String(item.label ?? "").trim();
            const category = String(item.category ?? item.family ?? "Service concierge").trim();
            return label ? { label, category } : null;
          })
          .filter((service: ConciergeProfileService | null): service is ConciergeProfileService => Boolean(service));

        setProfileServices(nextServices);
      } catch {
        setProfileServices([]);
      }
    }

    void loadConciergeServices();
  }, []);

  useEffect(() => {
    async function loadCommercialDocuments() {
      try {
        const [quotesResponse, invoicesResponse] = await Promise.all([
          fetch("/api/quotes?limit=50", { cache: "no-store" }),
          fetch("/api/invoices?limit=50", { cache: "no-store" }),
        ]);

        const quotesPayload = await quotesResponse.json();
        const invoicesPayload = await invoicesResponse.json();

        setQuotes(Array.isArray(quotesPayload) ? quotesPayload : []);
        setInvoices(Array.isArray(invoicesPayload) ? invoicesPayload : []);
      } catch {
        setQuotes([]);
        setInvoices([]);
      }
    }

    void loadCommercialDocuments();
  }, []);

  useEffect(() => {
    async function loadServicePackaging() {
      try {
        const [catalogResponse, packagesResponse, pricingResponse] = await Promise.all([
          fetch("/api/services/services-catalog", { cache: "no-store" }),
          fetch("/api/services/packages", { cache: "no-store" }),
          fetch("/api/services/pricing-packages", { cache: "no-store" }),
        ]);

        const catalogPayload = await catalogResponse.json();
        const packagesPayload = await packagesResponse.json();
        const pricingPayload = await pricingResponse.json();

        setServiceCatalog(Array.isArray(catalogPayload) ? catalogPayload : []);
        setServicePackages(Array.isArray(packagesPayload) ? packagesPayload : []);
        setPricingPackages(Array.isArray(pricingPayload) ? pricingPayload : []);
      } catch {
        setServiceCatalog([]);
        setServicePackages([]);
        setPricingPackages([]);
      }
    }

    void loadServicePackaging();
  }, []);

  const completionRatio = useMemo(() => Math.round((draft?.completion.ratio ?? 0) * 100), [draft]);
  const housingPhotos = useMemo(
    () => draft?.characteristics.photos ?? (draft?.photo_principale ? [draft.photo_principale] : []),
    [draft],
  );
  const selectedHousingServiceLabels = useMemo(
    () => (draft?.services.items ?? []).map((service) => service.label).filter(Boolean),
    [draft?.services.items],
  );
  const serviceCatalogById = useMemo(
    () => new Map(serviceCatalog.map((item) => [item.id, item])),
    [serviceCatalog],
  );
  const packageCards = useMemo(
    () =>
      servicePackages.map((pack) => {
        const linkedPricing = pricingPackages.filter((pricing) => pricing.package_id === pack.id);
        const serviceLabels = (pack.services_package_items ?? [])
          .map((item) => serviceCatalogById.get(item.service_id)?.service || null)
          .filter((label): label is string => Boolean(label));

        return {
          ...pack,
          serviceLabels,
          pricePreview:
            linkedPricing.length > 0
              ? linkedPricing
                  .slice(0, 1)
                  .map((pricing) => `${pricing.label} · ${pricing.amount.toFixed(0)} EUR`)
                  .join("")
              : null,
        };
      }),
    [pricingPackages, serviceCatalogById, servicePackages],
  );
  const relatedQuotes = useMemo(
    () =>
      quotes.filter(
        (quote) =>
          quote.id === draft?.contractInfo.quoteId ||
          (!!draft?.owner.profileId && quote.owner_profile_id === draft.owner.profileId),
      ),
    [draft?.contractInfo.quoteId, draft?.owner.profileId, quotes],
  );
  const relatedInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          invoice.quote_id === draft?.contractInfo.quoteId ||
          (!!draft?.owner.profileId && invoice.owner_profile_id === draft.owner.profileId),
      ),
    [draft?.contractInfo.quoteId, draft?.owner.profileId, invoices],
  );

  function applySavedOwner(nextRow: HousingRow) {
    const normalized = normalizeHousingRow(nextRow);
    setHousing((current) => (current ? { ...current, owner: normalized.owner, completion: normalized.completion } : normalized));
    setDraft((current) => (current ? { ...current, owner: normalized.owner, completion: normalized.completion } : normalized));
  }

  function togglePlatform(platform: string, checked: boolean) {
    if (!draft) return;

    const currentPlatforms = draft.characteristics.platforms ?? [];
    const nextPlatforms = checked
      ? Array.from(new Set([...currentPlatforms, platform]))
      : currentPlatforms.filter((item) => item !== platform);

    updateDraft("characteristics", {
      ...draft.characteristics,
      platforms: nextPlatforms,
    });
    updateDraft("plateforme", nextPlatforms[0] ?? "");
  }

  function updateDraft<T extends keyof ConciergeHousing>(key: T, value: ConciergeHousing[T]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  async function uploadHousingPhotos(files: FileList | null) {
    if (!files || files.length === 0 || !draft) return;

    try {
      setPhotoUploading(true);
      setError("");

      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("housingId", String(id));

        const response = await fetch("/api/housing/photos", {
          method: "POST",
          body: formData,
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok || typeof payload?.url !== "string") {
          throw new Error(typeof payload?.error === "string" ? payload.error : "Upload photo impossible.");
        }

        uploadedUrls.push(payload.url);
      }

      updateDraft("characteristics", {
        ...draft.characteristics,
        photos: [...(draft.characteristics.photos ?? []), ...uploadedUrls],
      });

      if (!draft.photo_principale && uploadedUrls[0]) {
        updateDraft("photo_principale", uploadedUrls[0]);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload photo impossible.");
    } finally {
      setPhotoUploading(false);
    }
  }

  function setPrimaryHousingPhoto(photo: string) {
    if (!draft) return;
    updateDraft("photo_principale", photo);
    updateDraft("characteristics", {
      ...draft.characteristics,
      photos: [photo, ...(draft.characteristics.photos ?? []).filter((item) => item !== photo)],
    });
  }

  function removeHousingPhoto(photo: string) {
    if (!draft) return;
    const nextPhotos = (draft.characteristics.photos ?? []).filter((item) => item !== photo);
    updateDraft("characteristics", {
      ...draft.characteristics,
      photos: nextPhotos,
    });
    if (draft.photo_principale === photo) {
      updateDraft("photo_principale", nextPhotos[0] ?? null);
    }
  }

  function syncHousingServicesFromSelection(selectedLabels: string[]) {
    if (!draft) return;

    const selectedSet = new Set(selectedLabels.map((label) => label.trim().toLowerCase()).filter(Boolean));
    const profileByLabel = new Map(
      profileServices.map((service) => [service.label.trim().toLowerCase(), service]),
    );

    const existingItems = draft.services.items.filter((item) =>
      selectedSet.has(item.label.trim().toLowerCase()),
    );
    const existingLabels = new Set(existingItems.map((item) => item.label.trim().toLowerCase()));

    const createdItems = selectedLabels
      .filter((label) => !existingLabels.has(label.trim().toLowerCase()))
      .map((label, index) => {
        const profileService = profileByLabel.get(label.trim().toLowerCase());
        return {
          id: `housing-service-${label.trim().toLowerCase().replace(/\s+/g, "-")}-${index}`,
          label,
          category: profileService?.category || "Service concierge",
          frequency: "Selon le profil concierge",
          unitPrice: null,
          totalPrice: null,
          included: true,
          status: "active" as const,
          sourceQuoteItemId: null,
          notes: "",
        };
      });

    updateDraft("services", {
      ...draft.services,
      items: [...existingItems, ...createdItems],
    });
  }

  function applyServicePack(packId: string) {
    const pack = servicePackages.find((item) => item.id === packId);
    if (!pack) return;

    const availableLabels = new Set(profileServices.map((service) => service.label.trim().toLowerCase()));
    const selectedLabels = (pack.services_package_items ?? [])
      .map((item) => serviceCatalogById.get(item.service_id)?.service || null)
      .filter((label): label is string => Boolean(label))
      .filter((label) => availableLabels.has(label.trim().toLowerCase()));

    syncHousingServicesFromSelection(selectedLabels);
    setSuccess(`${pack.name} appliqué au logement.`);
    setError("");
  }

  async function saveDraft() {
    if (!draft) return;

    const validationError = validateHousingDraft(draft);
    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const response = await fetch(`/api/housing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildHousingMutationPayload(draft)),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Sauvegarde impossible.");
      }
      const normalized = normalizeHousingRow(payload as HousingRow);
      setHousing(normalized);
      setDraft(normalized);
      setEditing(false);
      setSuccess("Fiche logement mise à jour.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Sauvegarde impossible.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <section className={styles.panel}><p className={styles.muted}>Chargement du logement...</p></section>;
  }

  if (!draft) {
    return <section className={styles.panel}><p className={styles.messageError}>{error || "Logement introuvable."}</p></section>;
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.heroIdentity}>
            <div className={styles.housingAvatarWrap}>
              <Avatar
                src={draft.photo_principale}
                name={draft.nom_logement || "Logement"}
                alt={`Avatar du logement ${draft.nom_logement || ""}`}
                size="lg"
                className={styles.housingAvatar}
              />
              {editing ? (
                <label className={styles.housingCameraButton}>
                  <FiCamera />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(event) => void uploadHousingPhotos(event.target.files)}
                  />
                </label>
              ) : null}
            </div>
            <div>
              <p className={styles.eyebrow}>Fiche logement</p>
              <h1 className={styles.title}>{draft.nom_logement || "Logement sans nom"}</h1>
              <p className={styles.muted}>
                {[draft.locationInfo.addressLine1, draft.locationInfo.postalCode, draft.locationInfo.city].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.pillRow}>
          <HousingStatusBadge status={draft.statut} />
          <span className={styles.pill}>{draft.creationMode === "quote" ? "Créé depuis devis" : "Créé manuellement"}</span>
          <span className={styles.pill}>{draft.characteristics.propertyType || "Type à renseigner"}</span>
          <span className={styles.completionPill}>Complétion {completionRatio}%</span>
        </div>

        <div className={styles.statGrid}>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Propriétaire</span>
            <strong className={styles.statValue}>{draft.owner.fullName || "À renseigner"}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Caractéristiques</span>
            <strong className={styles.statValue}>
              {[draft.characteristics.surfaceSqm ? `${draft.characteristics.surfaceSqm} m2` : "", draft.characteristics.bedroomCount ? `${draft.characteristics.bedroomCount} ch.` : ""].filter(Boolean).join(" - ") || "À compléter"}
            </strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Services</span>
            <strong className={styles.statValue}>{draft.services.items.length}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Dernière intervention</span>
            
            <strong className={styles.statValue}>{draft.timeline[0]?.date ? new Date(draft.timeline[0].date).toLocaleDateString("fr-FR") : "Aucune"}</strong>
          </article>
        </div>

        <div className={styles.progressTrack}>
          <div className={styles.progressBar} style={{ width: `${completionRatio}%` }} />
        </div>

        {success ? <p className={styles.messageSuccess}>{success}</p> : null}
        {error ? <p className={styles.messageError}>{error}</p> : null}
        {photoUploading ? <p className={styles.messageSuccess}>Upload des photos en cours...</p> : null}
      </section>

      <div className={styles.layout}>
        <div className={styles.page}>
          <section className={styles.tabPanel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Edition</p>
            <h2 className={styles.cardTitle}>Contenu du logement</h2>
              </div>
              <div className={styles.toolbar}>
                {!editing ? (
                  <button className={styles.actionPrimary} type="button" onClick={() => setEditing(true)}>
                    <FiEdit2 /> Modifier
                  </button>
                ) : (
                  <>
                    <button
                      className={styles.actionSecondary}
                      type="button"
                      onClick={() => {
                        setDraft(housing);
                        setEditing(false);
                      }}
                    >
                      <FiRotateCcw /> Annuler
                    </button>
                    <button className={styles.actionPrimary} type="button" onClick={saveDraft} disabled={saving}>
                      <FiSave /> {saving ? "Sauvegarde..." : "Sauvegarder"}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className={styles.tabList}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "synthese" ? (
              <div className={styles.page}>
                <section className={styles.panel}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <p className={styles.eyebrow}>Synthèse</p>
                      <h2 className={styles.cardTitle}>Tableau de bord du logement</h2>
                    </div>
                  </div>
                  <div className={styles.statGrid}>
                    <article className={styles.statCard}>
                      <span className={styles.statLabel}>Statut</span>
                      <strong className={styles.statValue}>{draft.statut || "À préciser"}</strong>
                    </article>
                    <article className={styles.statCard}>
                      <span className={styles.statLabel}>Photos</span>
                      <strong className={styles.statValue}>{housingPhotos.length}</strong>
                    </article>
                    <article className={styles.statCard}>
                      <span className={styles.statLabel}>Services</span>
                      <strong className={styles.statValue}>{draft.services.items.length}</strong>
                    </article>
                    <article className={styles.statCard}>
                      <span className={styles.statLabel}>Complétion</span>
                      <strong className={styles.statValue}>{completionRatio}%</strong>
                    </article>
                  </div>
                </section>

                <section className={styles.panel}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <p className={styles.eyebrow}>Galerie</p>
                      <h2 className={styles.cardTitle}>Photos du logement</h2>
                    </div>
                  </div>
                  {housingPhotos.length === 0 ? (
                    <p className={styles.cardMeta}>Aucune photo du logement pour le moment.</p>
                  ) : (
                    <div className={styles.housingGallery}>
                      {housingPhotos.map((photo, index) => (
                        <div className={styles.housingGalleryItem} key={`${photo}-${index}`}>
                          <img src={photo} alt={`Photo ${index + 1} du logement`} className={styles.housingGalleryImage} />
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            ) : null}

            {activeTab === "infos" ? (
              <div className={styles.page}>
                <section className={styles.panel}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <p className={styles.eyebrow}>Identité</p>
                      <h2 className={styles.cardTitle}>Fiche logement</h2>
                    </div>
                    <span className={styles.pill}>
                      {draft.creationMode === "quote" ? "Créé depuis devis" : "Création manuelle"}
                    </span>
                  </div>

                  <div className={styles.fieldGrid}>
                    <label className={styles.label}>
                      <span>Date de création</span>
                      <input className={styles.field} value={draft.created_at ? new Date(draft.created_at).toLocaleString("fr-FR") : ""} disabled />
                    </label>

                    <label className={styles.label}>
                      <span>Id propriétaire</span>
                      <input className={styles.field} value={draft.owner.profileId ?? ""} disabled />
                    </label>

                    <label className={styles.label}>
                      <span>Nom logement</span>
                      <input
                        className={styles.field}
                        value={draft.nom_logement ?? ""}
                        disabled={!editing}
                        onChange={(event) => updateDraft("nom_logement", event.target.value)}
                      />
                    </label>

                    <label className={styles.label}>
                      <span>Type de bien</span>
                      <select
                        className={styles.select}
                        value={draft.characteristics.propertyType}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("characteristics", {
                            ...draft.characteristics,
                            propertyType: event.target.value,
                            categorie: event.target.value,
                          })
                        }
                      >
                        {HOUSING_PROPERTY_TYPE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className={`${styles.label} ${styles.fieldFull}`}>
                      <HousingPhotoManager
                        editing={editing}
                        photos={housingPhotos}
                        primaryPhoto={draft.photo_principale}
                        uploading={photoUploading}
                        title="Galerie du logement"
                        helperText="Ajoute plusieurs photos utiles pour la fiche logement, les demandes de mission et le suivi conciergerie."
                        onUpload={uploadHousingPhotos}
                        onSetPrimary={setPrimaryHousingPhoto}
                        onRemove={removeHousingPhoto}
                      />
                    </div>

                    <label className={styles.label}>
                      <span>Statut</span>
                      <select
                        className={styles.select}
                        value={draft.statut ?? ""}
                        disabled={!editing}
                        onChange={(event) => updateDraft("statut", event.target.value)}
                      >
                        {HOUSING_STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className={styles.inlineHelper}>
                      {HOUSING_STATUS_EXPLANATIONS[draft.statut ?? ""] ??
                        "Choisissez un statut pour refléter l'état opérationnel réel du logement."}
                    </div>

                    <label className={`${styles.label} ${styles.fieldFull}`}>
                      <span>Plateformes de diffusion</span>
                      <div className={styles.checkboxGroup}>
                        {HOUSING_PLATFORM_OPTIONS.map((option) => (
                          <label key={option} className={styles.checkboxCard}>
                            <input
                              type="checkbox"
                              checked={(draft.characteristics.platforms ?? []).includes(option)}
                              disabled={!editing}
                              onChange={(event) => togglePlatform(option, event.target.checked)}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                      <span className={styles.helper}>
                        Coche une ou plusieurs plateformes. La première sélectionnée reste la plateforme principale.
                      </span>
                    </label>
                  </div>
                </section>

                <section className={styles.panel}>
                  <HousingOwnerContactSection
                    housingId={id}
                    owner={draft.owner}
                    onOwnerSaved={(_, row) => applySavedOwner(row)}
                  />

                  <div className={styles.fieldGrid}>
                    <label className={`${styles.label} ${styles.fieldFull}`}>
                      <span>Adresse propriétaire</span>
                      <input
                        className={styles.field}
                        value={draft.owner.address}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("owner", {
                            ...draft.owner,
                            address: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className={styles.label}>
                      <span>Téléphone 2</span>
                      <input
                        className={styles.field}
                        value={draft.owner.secondaryPhone}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("owner", {
                            ...draft.owner,
                            secondaryPhone: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className={styles.label}>
                      <span>Contact principal</span>
                      <input
                        className={styles.field}
                        value={draft.owner.primaryContactName}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("owner", {
                            ...draft.owner,
                            primaryContactName: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className={styles.label}>
                      <span>Mail principal</span>
                      <input
                        className={styles.field}
                        type="email"
                        value={draft.owner.primaryContactEmail}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("owner", {
                            ...draft.owner,
                            primaryContactEmail: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className={styles.label}>
                      <span>Tél. principal</span>
                      <input
                        className={styles.field}
                        value={draft.owner.primaryContactPhone}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("owner", {
                            ...draft.owner,
                            primaryContactPhone: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>

                  <OwnerInvitationPanel
                    housingId={id}
                    housingName={draft.nom_logement || undefined}
                    owner={draft.owner}
                    onOwnerSaved={(_, row) => applySavedOwner(row)}
                    disabled={saving}
                  />
                </section>

                <section className={styles.panel}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <p className={styles.eyebrow}>Localisation</p>
                      <h2 className={styles.cardTitle}>Adresse et accès au bien</h2>
                    </div>
                  </div>

                  <div className={styles.fieldGrid}>
                    <label className={`${styles.label} ${styles.fieldFull}`}>
                      <span>Adresse</span>
                      <input
                        className={styles.field}
                        value={draft.locationInfo.addressLine1}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("locationInfo", {
                            ...draft.locationInfo,
                            addressLine1: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className={`${styles.label} ${styles.fieldFull}`}>
                      <span>Complément d'adresse</span>
                      <input
                        className={styles.field}
                        value={draft.locationInfo.addressLine2}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("locationInfo", {
                            ...draft.locationInfo,
                            addressLine2: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className={`${styles.label} ${styles.fieldFull}`}>
                      <span>Infos / code Wifi</span>
                      <input
                        className={styles.field}
                        value={draft.characteristics.wifiInfo}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("characteristics", {
                            ...draft.characteristics,
                            wifiInfo: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className={styles.label}>
                      <span>Code postal</span>
                      <input
                        className={styles.field}
                        value={draft.locationInfo.postalCode}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("locationInfo", {
                            ...draft.locationInfo,
                            postalCode: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className={styles.label}>
                      <span>Ville</span>
                      <input
                        className={styles.field}
                        value={draft.locationInfo.city}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("locationInfo", {
                            ...draft.locationInfo,
                            city: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className={styles.label}>
                      <span>Étage</span>
                      <input
                        className={styles.field}
                        value={draft.locationInfo.floor}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("locationInfo", {
                            ...draft.locationInfo,
                            floor: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className={styles.label}>
                      <span>Code d'accès</span>
                      <input
                        className={styles.field}
                        value={draft.locationInfo.accessCode}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("locationInfo", {
                            ...draft.locationInfo,
                            accessCode: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className={styles.label}>
                      <span>Caution</span>
                      <input
                        className={styles.field}
                        type="number"
                        value={draft.pricing.securityDeposit ?? ""}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("pricing", {
                            ...draft.pricing,
                            securityDeposit: Number(event.target.value) || null,
                            caution: Number(event.target.value) || null,
                          })
                        }
                      />
                    </label>

                    <label className={`${styles.label} ${styles.fieldFull}`}>
                      <span>Consignes d'entrée</span>
                      <textarea
                        className={styles.textArea}
                        value={draft.locationInfo.entryInstructions}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("locationInfo", {
                            ...draft.locationInfo,
                            entryInstructions: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                </section>

                <section className={styles.panel}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <p className={styles.eyebrow}>Caractéristiques</p>
                      <h2 className={styles.cardTitle}>Configuration du logement</h2>
                    </div>
                  </div>

                  <div className={styles.fieldGrid}>
                    <label className={styles.label}>
                      <span>Surface</span>
                      <input
                        className={styles.field}
                        value={draft.characteristics.surfaceSqm ?? ""}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("characteristics", {
                            ...draft.characteristics,
                            surfaceSqm: Number(event.target.value) || null,
                            superficie: Number(event.target.value) || null,
                          })
                        }
                      />
                    </label>

                    <label className={styles.label}>
                      <span>Pieces</span>
                      <input
                        className={styles.field}
                        value={draft.characteristics.roomCount ?? ""}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("characteristics", {
                            ...draft.characteristics,
                            roomCount: Number(event.target.value) || null,
                          })
                        }
                      />
                    </label>

                    <label className={styles.label}>
                      <span>Chambres</span>
                      <input
                        className={styles.field}
                        value={draft.characteristics.bedroomCount ?? ""}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("characteristics", {
                            ...draft.characteristics,
                            bedroomCount: Number(event.target.value) || null,
                            nb_chambres: Number(event.target.value) || null,
                          })
                        }
                      />
                    </label>

                    <label className={styles.label}>
                      <span>Salles de bain</span>
                      <input
                        className={styles.field}
                        value={draft.characteristics.bathroomCount ?? ""}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("characteristics", {
                            ...draft.characteristics,
                            bathroomCount: Number(event.target.value) || null,
                          })
                        }
                      />
                    </label>

                    <label className={styles.label}>
                      <span>Nombre de couchages</span>
                      <input
                        className={styles.field}
                        value={draft.characteristics.guestCapacity ?? ""}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("characteristics", {
                            ...draft.characteristics,
                            guestCapacity: Number(event.target.value) || null,
                            capacite: Number(event.target.value) || null,
                          })
                        }
                      />
                    </label>

                    <label className={styles.label}>
                      <span>Nombre de clés</span>
                      <input
                        className={styles.field}
                        type="number"
                        value={draft.characteristics.keyCount ?? ""}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("characteristics", {
                            ...draft.characteristics,
                            keyCount: Number(event.target.value) || null,
                          })
                        }
                      />
                    </label>

                    <label className={styles.label}>
                      <span>Nombre de lits</span>
                      <input
                        className={styles.field}
                        value={draft.characteristics.bedCount ?? ""}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("characteristics", {
                            ...draft.characteristics,
                            bedCount: Number(event.target.value) || null,
                          })
                        }
                      />
                    </label>

                    <label className={`${styles.label} ${styles.fieldFull}`}>
                      <span>Equipements</span>
                      <input
                        className={styles.field}
                        value={draft.characteristics.amenities.join(", ")}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("characteristics", {
                            ...draft.characteristics,
                            amenities: event.target.value
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean),
                            equipements: event.target.value
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="Wifi, Climatisation, Parking..."
                      />
                    </label>

                    <div className={`${styles.label} ${styles.fieldFull}`}>
                      <span>Options et besoins du logement</span>
                      <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxCard}>
                          <input
                            type="checkbox"
                            checked={draft.characteristics.terrace}
                            disabled={!editing}
                            onChange={(event) =>
                              updateDraft("characteristics", {
                                ...draft.characteristics,
                                terrace: event.target.checked,
                              })
                            }
                          />
                          <span>Terrasse</span>
                        </label>
                        <label className={styles.checkboxCard}>
                          <input
                            type="checkbox"
                            checked={draft.characteristics.stairs}
                            disabled={!editing}
                            onChange={(event) =>
                              updateDraft("characteristics", {
                                ...draft.characteristics,
                                stairs: event.target.checked,
                              })
                            }
                          />
                          <span>Escaliers</span>
                        </label>
                        <label className={styles.checkboxCard}>
                          <input
                            type="checkbox"
                            checked={draft.characteristics.pool}
                            disabled={!editing}
                            onChange={(event) =>
                              updateDraft("characteristics", {
                                ...draft.characteristics,
                                pool: event.target.checked,
                              })
                            }
                          />
                          <span>Piscine</span>
                        </label>
                        <label className={styles.checkboxCard}>
                          <input
                            type="checkbox"
                            checked={draft.characteristics.petsAllowed}
                            disabled={!editing}
                            onChange={(event) =>
                              updateDraft("characteristics", {
                                ...draft.characteristics,
                                petsAllowed: event.target.checked,
                              })
                            }
                          />
                          <span>Animaux acceptés</span>
                        </label>
                        <label className={styles.checkboxCard}>
                          <input
                            type="checkbox"
                            checked={draft.characteristics.nonSmoking}
                            disabled={!editing}
                            onChange={(event) =>
                              updateDraft("characteristics", {
                                ...draft.characteristics,
                                nonSmoking: event.target.checked,
                              })
                            }
                          />
                          <span>Non fumeur</span>
                        </label>
                        <label className={styles.checkboxCard}>
                          <input
                            type="checkbox"
                            checked={draft.characteristics.barbecue}
                            disabled={!editing}
                            onChange={(event) =>
                              updateDraft("characteristics", {
                                ...draft.characteristics,
                                barbecue: event.target.checked,
                              })
                            }
                          />
                          <span>Barbecue</span>
                        </label>
                        <label className={styles.checkboxCard}>
                          <input
                            type="checkbox"
                            checked={draft.characteristics.chequeRequired}
                            disabled={!editing}
                            onChange={(event) =>
                              updateDraft("characteristics", {
                                ...draft.characteristics,
                                chequeRequired: event.target.checked,
                              })
                            }
                          />
                          <span>Chèque de caution à demander</span>
                        </label>
                      </div>
                    </div>

                    <label className={`${styles.label} ${styles.fieldFull}`}>
                      <span>Description</span>
                      <textarea
                        className={styles.textArea}
                        value={draft.characteristics.description}
                        disabled={!editing}
                        onChange={(event) =>
                          updateDraft("characteristics", {
                            ...draft.characteristics,
                            description: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                </section>
              </div>
            ) : null}

            {activeTab === "services" ? (
              <div className={styles.page}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.eyebrow}>Services associés</p>
                    <h2 className={styles.cardTitle}>Prestations activées sur ce logement</h2>
                  </div>
                </div>
                <div className={styles.invitationCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <p className={styles.eyebrow}>Configuration client</p>
                      <h3 className={styles.cardTitle}>Choisir un pack ou quelques services</h3>
                    </div>
                  </div>

                  {!editing ? (
                    <p className={styles.cardMeta}>
                      Passez en mode édition pour appliquer un pack préconfiguré ou sélectionner quelques services à la carte pour ce logement.
                    </p>
                  ) : (
                    <>
                      <div className={styles.tabList}>
                        <button
                          type="button"
                          className={`${styles.tabButton} ${serviceSelectionMode === "pack" ? styles.tabButtonActive : ""}`}
                          onClick={() => setServiceSelectionMode("pack")}
                        >
                          Choisir un pack
                        </button>
                        <button
                          type="button"
                          className={`${styles.tabButton} ${serviceSelectionMode === "manual" ? styles.tabButtonActive : ""}`}
                          onClick={() => setServiceSelectionMode("manual")}
                        >
                          Choisir des services
                        </button>
                      </div>

                      {serviceSelectionMode === "pack" ? (
                        <div className={styles.page}>
                          {packageCards.length === 0 ? (
                            <p className={styles.cardMeta}>
                              Aucun pack disponible pour le moment. Vous pouvez les préparer dans la page
                              services-packages.
                            </p>
                          ) : (
                            <div className={styles.cardGrid}>
                              {packageCards.map((pack) => (
                                <article key={pack.id} className={styles.quoteCard}>
                                  <div className={styles.sectionHeader}>
                                    <strong className={styles.cardTitle}>{pack.name}</strong>
                                    <button
                                      type="button"
                                      className={styles.actionSecondary}
                                      onClick={() => applyServicePack(pack.id)}
                                    >
                                      Appliquer ce pack
                                    </button>
                                  </div>
                                  <p className={styles.cardMeta}>
                                    {pack.description || pack.category || "Pack prêt à l'emploi"}
                                  </p>
                                  <p className={styles.helper}>
                                    {pack.serviceLabels.length} service(s)
                                    {pack.pricePreview ? ` · ${pack.pricePreview}` : ""}
                                  </p>
                                </article>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          {profileServices.length === 0 ? (
                            <p className={styles.cardMeta}>
                              Aucun service actif trouvé dans Missions & Services. Configurez-les dans votre profil concierge pour pouvoir les réutiliser ici.
                            </p>
                          ) : (
                            <MissionDetails
                              selectedServices={
                                selectedHousingServiceLabels.length > 0
                                  ? selectedHousingServiceLabels
                                  : profileServices.map((service) => service.label)
                              }
                              isEditing={true}
                              onChangeOption={syncHousingServicesFromSelection}
                            />
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
                {draft.services.items.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p className={styles.muted}>Aucun service n'est encore rattaché à ce logement.</p>
                  </div>
                ) : (
                  <div className={styles.cardGrid}>
                    {draft.services.items.map((service) => (
                      <article key={service.id} className={styles.serviceCard}>
                        <div className={styles.sectionHeader}>
                          <strong className={styles.cardTitle}>{service.label}</strong>
                          <HousingStatusBadge status={service.status} />
                        </div>
                        <p className={styles.cardMeta}>
                          {service.category || "Service"}{service.frequency ? ` | ${service.frequency}` : ""}{typeof service.totalPrice === "number" ? ` | ${service.totalPrice} ${draft.pricing.currency}` : ""}
                        </p>
                        {editing ? (
                          <textarea
                            className={styles.textArea}
                            value={service.notes}
                            onChange={(event) =>
                              updateDraft("services", {
                                ...draft.services,
                                items: draft.services.items.map((item) =>
                                  item.id === service.id ? { ...item, notes: event.target.value } : item,
                                ),
                              })
                            }
                          />
                        ) : service.notes ? (
                          <p className={styles.cardMeta}>{service.notes}</p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {activeTab === "timeline" ? (
              <div className={styles.page}>
                <div className={styles.sectionHeader}>
                    <div>
                      <p className={styles.eyebrow}>Historique interventions</p>
                      <h2 className={styles.cardTitle}>Traçabilité des actions et activations</h2>
                    </div>
                  </div>
                {draft.timeline.length === 0 ? (
                  <div className={styles.emptyState}><p className={styles.muted}>Aucune intervention enregistrée.</p></div>
                ) : (
                  <div className={styles.timeline}>
                    {draft.timeline.map((item) => (
                      <article key={item.id} className={styles.timelineCard}>
                        <div className={styles.sectionHeader}>
                          <strong className={styles.cardTitle}>{item.title}</strong>
                          <span className={styles.pill}>{new Date(item.date).toLocaleDateString("fr-FR")}</span>
                        </div>
                        <p className={styles.cardMeta}>{item.description || item.type}</p>
                        <p className={styles.helper}>{item.actor ? `Par ${item.actor}` : item.source}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {activeTab === "docs" ? (
              <div className={styles.page}>
                <div className={styles.sectionHeader}>
                    <div>
                      <p className={styles.eyebrow}>Documents / contrats</p>
                      <h2 className={styles.cardTitle}>Contrats, guides et pièces utiles</h2>
                    </div>
                  </div>
                {draft.documentsList.length === 0 && !draft.contractInfo.contractUrl ? (
                  <div className={styles.emptyState}><p className={styles.muted}>Aucun document rattaché pour le moment.</p></div>
                ) : (
                  <div className={styles.docsGrid}>
                    {draft.contractInfo.contractUrl ? (
                      <article className={styles.docCard}>
                        <div className={styles.sectionHeader}>
                          <strong className={styles.cardTitle}>Contrat principal</strong>
                          <FiFileText />
                        </div>
                        <a href={draft.contractInfo.contractUrl} target="_blank" rel="noreferrer">{draft.contractInfo.contractUrl}</a>
                      </article>
                    ) : null}
                    {draft.documentsList.map((doc) => (
                      <article key={doc.id} className={styles.docCard}>
                        <div className={styles.sectionHeader}>
                          <strong className={styles.cardTitle}>{doc.name}</strong>
                          <FiFileText />
                        </div>
                        {doc.url ? <a href={doc.url} target="_blank" rel="noreferrer">{doc.url}</a> : null}
                        <p className={styles.helper}>{doc.type}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {activeTab === "quotes" ? (
              <div className={styles.page}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.eyebrow}>Devis & factures</p>
                    <h2 className={styles.cardTitle}>Suivi commercial rattaché au logement</h2>
                  </div>
                </div>

                <div className={styles.cardGrid}>
                  <article className={styles.quoteCard}>
                    <div className={styles.sectionHeader}>
                      <strong className={styles.cardTitle}>Devis liés</strong>
                      <span className={styles.pill}>{relatedQuotes.length}</span>
                    </div>
                    {relatedQuotes.length === 0 ? (
                      <p className={styles.cardMeta}>Aucun devis lié à ce logement pour le moment.</p>
                    ) : (
                      relatedQuotes.map((quote) => (
                        <div key={quote.id} className={styles.docCard}>
                          <div className={styles.sectionHeader}>
                            <strong className={styles.cardTitle}>{quote.quote_number}</strong>
                            <span className={styles.pill}>{quote.status}</span>
                          </div>
                          <p className={styles.cardMeta}>
                            {quote.total_amount} {quote.currency}
                          </p>
                          <p className={styles.helper}>
                            Créé le {new Date(quote.created_at).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      ))
                    )}
                  </article>

                  <article className={styles.quoteCard}>
                    <div className={styles.sectionHeader}>
                      <strong className={styles.cardTitle}>Factures liées</strong>
                      <span className={styles.pill}>{relatedInvoices.length}</span>
                    </div>
                    {relatedInvoices.length === 0 ? (
                      <p className={styles.cardMeta}>Aucune facture liée à ce logement pour le moment.</p>
                    ) : (
                      relatedInvoices.map((invoice) => (
                        <div key={invoice.id} className={styles.docCard}>
                          <div className={styles.sectionHeader}>
                            <strong className={styles.cardTitle}>{invoice.invoice_number}</strong>
                            <span className={styles.pill}>{invoice.status}</span>
                          </div>
                          <p className={styles.cardMeta}>
                            {invoice.total_amount} {invoice.currency}
                          </p>
                          <p className={styles.helper}>
                            Solde : {invoice.balance_amount} {invoice.currency} | Émise le{" "}
                            {new Date(invoice.issue_date).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      ))
                    )}
                  </article>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <aside className={styles.stickyAside}>
          <article className={styles.summaryCard}>
            <div className={styles.sectionHeader}>
              <strong className={styles.cardTitle}>Vue d'ensemble</strong>
              <FiHome />
            </div>
            <p className={styles.cardMeta}>{draft.owner.fullName || "Propriétaire à compléter"}</p>
            <p className={styles.cardMeta}>
              {[draft.characteristics.surfaceSqm ? `${draft.characteristics.surfaceSqm} m2` : "", draft.characteristics.bedroomCount ? `${draft.characteristics.bedroomCount} chambres` : "", draft.characteristics.propertyType].filter(Boolean).join(" - ")}
            </p>
          </article>
          <article className={styles.summaryCard}>
            <div className={styles.sectionHeader}>
              <strong className={styles.cardTitle}>Services</strong>
              <FiList />
            </div>
            <p className={styles.cardMeta}>
              {draft.services.items.map((service) => service.label).filter(Boolean).join(", ") || "Aucun service"}
            </p>
          </article>
          <article className={styles.summaryCard}>
            <strong className={styles.cardTitle}>Tarifs</strong>
            <p className={styles.cardMeta}>
              {typeof draft.pricing.totalContractValue === "number"
                ? `${draft.pricing.totalContractValue} ${draft.pricing.currency}`
                : "Tarifs à compléter"}
            </p>
          </article>
        </aside>
      </div>
    </div>
  );
}
