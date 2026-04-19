"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FiAlertTriangle,
  FiBox,
  FiCamera,
  FiCalendar,
  FiEdit2,
  FiFileText,
  FiHome,
  FiRotateCcw,
  FiSave,
  FiBarChart2,
} from "react-icons/fi";
import { Avatar } from "@/components/ui/Avatar";
import HousingPhotoManager from "@/app/components/dashboard/housing/HousingPhotoManager";
import styles from "../../../concierge/logements/[id]/FicheLogement.module.scss";
import type { ConciergeHousing, HousingRow } from "@/types/housing";
import {
  buildHousingMutationPayload,
  HOUSING_PLATFORM_OPTIONS,
  HOUSING_PROPERTY_TYPE_OPTIONS,
  normalizeHousingRow,
} from "@/types/housing";

type OwnerHousingTab = "synthese" | "infos" | "documents" | "stocks" | "planning" | "litiges";

type MissionRow = {
  id: string;
  property_id: string | null;
  title: string;
  status: string | null;
  priority: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
};

type InspectionSummary = {
  id: string;
  status: string;
};

type InspectionChecklistItem = {
  id: string;
  item_label: string;
  item_status: "ok" | "issue" | "na";
};

type InspectionMediaItem = {
  id: string;
  media_type: "photo" | "video";
  storage_path: string;
  created_at: string;
};

const tabs: Array<{ id: OwnerHousingTab; label: string; icon: React.ComponentType }> = [
  { id: "synthese", label: "Synthèse", icon: FiBarChart2 },
  { id: "infos", label: "Informations", icon: FiHome },
  { id: "documents", label: "Documents", icon: FiFileText },
  { id: "stocks", label: "Stocks et équipements", icon: FiBox },
  { id: "planning", label: "Planning", icon: FiCalendar },
  { id: "litiges", label: "Litige", icon: FiAlertTriangle },
];

function makeClientId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Non planifié";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("fr-FR");
}

function toggleStringInList(values: string[], nextValue: string) {
  return values.includes(nextValue)
    ? values.filter((value) => value !== nextValue)
    : [...values, nextValue];
}

function parseCommaSeparatedList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNullableNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function validateOwnerHousingDraft(logement: ConciergeHousing | null) {
  if (!logement) return "Logement introuvable.";
  if (!(logement.nom_logement ?? "").trim()) return "Le nom du logement est obligatoire.";
  if (!(logement.locationInfo.addressLine1 ?? "").trim()) return "L'adresse du logement est obligatoire.";
  if (!(logement.locationInfo.city ?? "").trim()) return "La ville du logement est obligatoire.";
  if (!(logement.characteristics.propertyType ?? "").trim()) return "Le type de bien est obligatoire.";
  if (!(logement.owner.fullName ?? "").trim()) return "Le nom du propriétaire est obligatoire.";
  if (logement.owner.email && !logement.owner.email.includes("@")) {
    return "L'email propriétaire semble invalide.";
  }

  const invalidMetric = [
    logement.characteristics.surfaceSqm,
    logement.characteristics.bedroomCount,
    logement.characteristics.bathroomCount,
    logement.characteristics.bedCount,
    logement.characteristics.guestCapacity,
    logement.characteristics.keyCount,
  ].some((value) => value !== null && value !== undefined && value < 0);

  return invalidMetric ? "Certaines valeurs numériques sont invalides." : null;
}

export default function OwnerHousingDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [logement, setLogement] = useState<ConciergeHousing | null>(null);
  const [draft, setDraft] = useState<ConciergeHousing | null>(null);
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<OwnerHousingTab>("synthese");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [inspectionStatus, setInspectionStatus] = useState<string | null>(null);
  const [inspectionChecklist, setInspectionChecklist] = useState<InspectionChecklistItem[]>([]);
  const [inspectionMedia, setInspectionMedia] = useState<InspectionMediaItem[]>([]);
  const [disputeType, setDisputeType] = useState<"damage" | "missing_item" | "cleaning" | "other">("damage");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [selectedChecklistItemIds, setSelectedChecklistItemIds] = useState<string[]>([]);
  const [disputeBusy, setDisputeBusy] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const [disputeSuccess, setDisputeSuccess] = useState<string | null>(null);

  const supabasePublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const loadInspectionDetails = useCallback(async (nextInspectionId: string) => {
    const detailRes = await fetch(`/api/inspections/${nextInspectionId}`, { cache: "no-store" });
    if (!detailRes.ok) {
      throw new Error("Impossible de charger l'inspection.");
    }

    const payload = (await detailRes.json()) as {
      inspection?: { id?: string; status?: string };
      checklist?: InspectionChecklistItem[];
      media?: InspectionMediaItem[];
    };

    const checklist = Array.isArray(payload.checklist) ? payload.checklist : [];
    const media = Array.isArray(payload.media) ? payload.media : [];
    setInspectionId(nextInspectionId);
    setInspectionStatus(payload.inspection?.status ?? null);
    setInspectionChecklist(checklist);
    setInspectionMedia(media);
    setSelectedChecklistItemIds(checklist.filter((item) => item.item_status === "issue").map((item) => item.id));
    setSelectedMediaIds(media.map((item) => item.id));
  }, []);

  const loadLatestInspection = useCallback(async (housingId: string) => {
    const inspectionsRes = await fetch(`/api/inspections?housingId=${housingId}&limit=1`, {
      cache: "no-store",
    });

    if (!inspectionsRes.ok) return;

    const inspections = (await inspectionsRes.json()) as InspectionSummary[];
    const latest = Array.isArray(inspections) && inspections.length > 0 ? inspections[0] : null;

    if (!latest?.id) {
      setInspectionId(null);
      setInspectionStatus(null);
      setInspectionChecklist([]);
      setInspectionMedia([]);
      setSelectedMediaIds([]);
      setSelectedChecklistItemIds([]);
      return;
    }

    await loadInspectionDetails(latest.id);
  }, [loadInspectionDetails]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [housingResponse, missionsResponse] = await Promise.all([
          fetch(`/api/housing/${id}`, { cache: "no-store" }),
          fetch("/api/missions?scope=owner&limit=200", { cache: "no-store" }),
        ]);

        const housingPayload = await housingResponse.json();
        const missionsPayload = await missionsResponse.json();

        if (!housingResponse.ok) {
          throw new Error(housingPayload?.error || "Logement introuvable");
        }

        if (!missionsResponse.ok) {
          throw new Error(missionsPayload?.error || "Impossible de charger le planning lié");
        }

        const normalized = normalizeHousingRow(housingPayload as HousingRow);
        setLogement(normalized);
        setDraft(normalized);
        setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
        await loadLatestInspection(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [id, loadLatestInspection]);

  useEffect(() => {
    if (disputeDescription.trim()) return;
    const issueItems = inspectionChecklist.filter((item) => item.item_status === "issue");
    const details = [
      "Litige ouvert suite à l'inspection de départ voyageur.",
      issueItems.length > 0 ? `Anomalies constatées: ${issueItems.map((item) => item.item_label).join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
    if (details) {
      setDisputeDescription(details);
    }
  }, [inspectionChecklist, disputeDescription]);

  useEffect(() => {
    if (!disputeError && !disputeSuccess && !success) return;
    const timeout = window.setTimeout(() => {
      setDisputeError(null);
      setDisputeSuccess(null);
      setSuccess("");
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [disputeError, disputeSuccess, success]);

  const relatedMissions = useMemo(
    () => missions.filter((mission) => String(mission.property_id ?? "") === String(id)),
    [id, missions],
  );

  const planningEvents = useMemo(() => draft?.timeline ?? [], [draft]);
  const documents = useMemo(() => draft?.documentsList ?? [], [draft]);
  const equipments = useMemo(() => draft?.characteristics.amenities ?? [], [draft]);
  const housingPhotos = useMemo(
    () => draft?.characteristics.photos ?? (draft?.photo_principale ? [draft.photo_principale] : []),
    [draft],
  );
  const issueChecklistItems = useMemo(
    () => inspectionChecklist.filter((item) => item.item_status === "issue"),
    [inspectionChecklist],
  );

  const buildMediaPreviewUrl = (storagePath: string) => {
    if (!supabasePublicUrl || !storagePath) return null;
    return `${supabasePublicUrl}/storage/v1/object/public/inspection-evidence/${storagePath}`;
  };

  function applyDraftUpdate(updater: (current: ConciergeHousing) => ConciergeHousing) {
    setDraft((current) => (current ? updater(current) : current));
  }

  async function uploadHousingPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;

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

      applyDraftUpdate((current) => {
        const nextPhotos = [...(current.characteristics.photos ?? []), ...uploadedUrls];
        return {
          ...current,
          photo_principale: current.photo_principale || nextPhotos[0] || null,
          characteristics: {
            ...current.characteristics,
            photos: nextPhotos,
          },
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload des photos.");
    } finally {
      setPhotoUploading(false);
    }
  }

  function removeHousingPhoto(targetUrl: string) {
    applyDraftUpdate((current) => {
      const nextPhotos = (current.characteristics.photos ?? []).filter((photo) => photo !== targetUrl);
      return {
        ...current,
        photo_principale: current.photo_principale === targetUrl ? nextPhotos[0] ?? null : current.photo_principale,
        characteristics: {
          ...current.characteristics,
          photos: nextPhotos,
        },
      };
    });
  }

  function setPrimaryHousingPhoto(targetUrl: string) {
    applyDraftUpdate((current) => ({
      ...current,
      photo_principale: targetUrl,
      characteristics: {
        ...current.characteristics,
        photos: [
          targetUrl,
          ...(current.characteristics.photos ?? []).filter((photo) => photo !== targetUrl),
        ],
      },
    }));
  }

  function addDraftDocument() {
    applyDraftUpdate((current) => ({
      ...current,
      documentsList: [
        ...current.documentsList,
        {
          id: makeClientId("doc"),
          name: "",
          type: "other",
          url: "",
          uploadedAt: new Date().toISOString(),
          status: "draft",
        },
      ],
    }));
  }

  function updateDraftDocument(index: number, field: "name" | "type" | "url", value: string) {
    applyDraftUpdate((current) => ({
      ...current,
      documentsList: current.documentsList.map((doc, itemIndex) =>
        itemIndex === index ? { ...doc, [field]: value } : doc,
      ),
    }));
  }

  function removeDraftDocument(index: number) {
    applyDraftUpdate((current) => ({
      ...current,
      documentsList: current.documentsList.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function addPlanningEvent() {
    applyDraftUpdate((current) => ({
      ...current,
      timeline: [
        ...current.timeline,
        {
          id: makeClientId("timeline"),
          title: "",
          description: "",
          date: new Date().toISOString(),
          type: "note",
          status: "planned",
          actor: "Propriétaire",
          source: "owner-dashboard",
        },
      ],
    }));
  }

  function updatePlanningEvent(index: number, field: "title" | "description" | "date", value: string) {
    applyDraftUpdate((current) => ({
      ...current,
      timeline: current.timeline.map((event, itemIndex) =>
        itemIndex === index ? { ...event, [field]: value } : event,
      ),
    }));
  }

  function removePlanningEvent(index: number) {
    applyDraftUpdate((current) => ({
      ...current,
      timeline: current.timeline.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function saveHousingChanges() {
    const validationError = validateOwnerHousingDraft(draft);
    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    if (!draft) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/housing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildHousingMutationPayload(draft)),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "Mise à jour impossible.");
      }

      const normalized = normalizeHousingRow(payload as HousingRow);
      setLogement(normalized);
      setDraft(normalized);
      setEditing(false);
      setSuccess("Informations du logement mises à jour.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdition() {
    setDraft(logement);
    setEditing(false);
    setError("");
    setSuccess("");
  }

  async function openDisputeFromInspection() {
    if (!inspectionId) {
      setDisputeError("Aucune inspection disponible pour ce logement.");
      return;
    }

    if (selectedMediaIds.length === 0 && selectedChecklistItemIds.length === 0) {
      setDisputeError("Sélectionnez au moins une preuve (média ou checklist).");
      return;
    }

    try {
      setDisputeBusy(true);
      setDisputeError(null);
      setDisputeSuccess(null);

      const amountValue = estimatedAmount.trim().length > 0 ? Number(estimatedAmount) : null;
      if (amountValue !== null && (!Number.isFinite(amountValue) || amountValue < 0)) {
        throw new Error("Montant estimé invalide.");
      }

      const response = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspectionId,
          disputeType,
          title: `Litige - ${draft?.nom_logement || "Logement"}`,
          description: disputeDescription.trim() || null,
          estimatedAmount: amountValue,
          currency: "EUR",
          evidence: {
            mediaIds: selectedMediaIds,
            checklistItemIds: selectedChecklistItemIds,
          },
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "Ouverture litige impossible.");
      }

      await loadInspectionDetails(inspectionId);
      setDisputeSuccess("Litige ouvert avec succès.");
    } catch (err) {
      setDisputeError(err instanceof Error ? err.message : "Erreur ouverture litige.");
    } finally {
      setDisputeBusy(false);
    }
  }

  if (loading) return <div className={styles.loading}>Chargement...</div>;
  if (error && !draft) return <div className={styles.error}>{error}</div>;
  if (!draft) return <div className={styles.error}>Erreur</div>;

  const planningCount = planningEvents.length;
  const documentCount = documents.length;
  const equipmentCount = equipments.length;

  return (
    <div className={styles.ficheLogement}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.heroIdentity}>
            <div className={styles.housingAvatarWrap}>
              <Avatar
                src={draft.photo_principale}
                name={draft.nom_logement ?? "Logement"}
                alt={`Avatar du logement ${draft.nom_logement ?? ""}`}
                size="lg"
                className={styles.housingAvatar}
              />
              {editing ? (
                <>
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
                </>
              ) : null}
            </div>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Parc immobilier</p>
              <h1>{draft.nom_logement}</h1>
              <p>
                {draft.locationInfo.addressLine1}, {draft.locationInfo.city}
              </p>
              <div className={styles.heroMeta}>
                <span className={styles.metaPill}>{draft.characteristics.propertyType || "Bien"}</span>
                <span className={styles.metaPill}>
                  {draft.characteristics.guestCapacity || "Couchages à préciser"}
                </span>
                <span className={styles.metaPill}>
                  {draft.characteristics.bedroomCount || "Chambres à préciser"}
                </span>
                <span className={styles.metaPill}>
                  {housingPhotos.length} photo{housingPhotos.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Link className={styles.cancelBtn} href="/dashboard/owner/logements">
              Retour aux logements
            </Link>
            {!editing ? (
              <button className={styles.editBtn} type="button" onClick={() => setEditing(true)}>
                Modifier
              </button>
            ) : (
              <>
                <button className={styles.cancelBtn} type="button" onClick={cancelEdition}>
                  <FiRotateCcw /> Annuler
                </button>
                <button className={styles.saveBtn} type="button" onClick={saveHousingChanges} disabled={saving}>
                  <FiSave /> {saving ? "Sauvegarde..." : "Sauvegarder"}
                </button>
              </>
            )}
          </div>
        </div>

        {photoUploading ? <p className={styles.feedbackSuccess}>Upload des photos en cours...</p> : null}

        {error ? <p className={styles.feedbackError}>{error}</p> : null}
        {success ? <p className={styles.feedbackSuccess}>{success}</p> : null}

        <div className={styles.heroStats}>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Équipements</p>
            <strong className={styles.statValue}>{equipmentCount}</strong>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Documents</p>
            <strong className={styles.statValue}>{documentCount}</strong>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Éléments planning</p>
            <strong className={styles.statValue}>{planningCount + relatedMissions.length}</strong>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === "synthese" ? (
          <div className={styles.sectionStack}>
            <p className={styles.sectionTitle}>Tableau de bord du logement</p>
            <div className={styles.heroStats}>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Statut</p>
                <strong className={styles.statValue}>{draft.statut || "À préciser"}</strong>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Documents</p>
                <strong className={styles.statValue}>{documentCount}</strong>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Équipements</p>
                <strong className={styles.statValue}>{equipmentCount}</strong>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Planning</p>
                <strong className={styles.statValue}>{planningCount + relatedMissions.length}</strong>
              </div>
            </div>
            <div className={styles.panel}>
              <p>
                <strong>Adresse :</strong> {draft.locationInfo.addressLine1}, {draft.locationInfo.city}
              </p>
              <p>
                <strong>Propriétaire :</strong> {draft.owner.fullName || "Non renseigné"}
              </p>
              <p>
                <strong>Plateforme :</strong> {draft.plateforme || "Non renseignée"}
              </p>
              <p>
                <strong>Capacité :</strong> {draft.characteristics.guestCapacity || "À préciser"}
              </p>
            </div>
            <div className={styles.panel}>
              <p className={styles.sectionTitle}>Galerie rapide</p>
              {housingPhotos.length === 0 ? (
                <p>Aucune photo du logement pour le moment.</p>
              ) : (
                <div className={styles.housingGallery}>
                  {housingPhotos.map((photo, index) => (
                    <div className={styles.housingGalleryItem} key={`${photo}-${index}`}>
                      <img src={photo} alt={`Photo ${index + 1} du logement`} className={styles.housingGalleryImage} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "infos" ? (
          <div className={styles.sectionStack}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIntro}>
                <p className={styles.sectionTitle}>Informations du logement</p>
                <strong className={styles.inspectionStatus}>
                  {editing
                    ? "Modification en cours sur cet onglet."
                    : "Rassemblez ici les repères utiles pour les concierges: accès, logistique, préparation et contact."}
                </strong>
              </div>
              {!editing ? (
                <button className={styles.tabEditButton} type="button" onClick={() => setEditing(true)}>
                  <FiEdit2 /> Modifier cet onglet
                </button>
              ) : (
                <span className={styles.tabEditBadge}>
                  <FiEdit2 /> {"\u00c9dition active"}
                </span>
              )}
            </div>

            <div className={styles.formGrid}>
              <div className={styles.fullField}>
                <div className={styles.subsectionDivider}>
                  <p className={styles.subsectionTitle}>Vue d&apos;ensemble</p>
                  <p className={styles.subsectionText}>
                    Les informations essentielles pour comprendre rapidement le bien et son niveau de service.
                  </p>
                </div>
              </div>
              <div className={styles.fullField}>
                <div className={styles.subsectionDivider}>
                  <p className={styles.subsectionTitle}>Galerie et repères terrain</p>
                  <p className={styles.subsectionText}>
                    Gardez ici une galerie discrète et les premiers éléments utiles pour identifier rapidement le logement.
                  </p>
                </div>
              </div>
              <label className={styles.field}>
                <span>Nom du logement</span>
                <input
                  value={draft.nom_logement ?? ""}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({ ...current, nom_logement: event.target.value }))
                  }
                />
              </label>
              <div className={styles.fullField}>
                <HousingPhotoManager
                  editing={editing}
                  photos={housingPhotos}
                  primaryPhoto={draft.photo_principale}
                  uploading={photoUploading}
                  title="Galerie du logement"
                  helperText={
                    "L'avatar reste la photo ronde du logement. Ici, ajoutez de petites vues utiles pour les missions, les rep\u00e8res et les \u00e9changes avec les concierges."
                  }
                  onUpload={uploadHousingPhotos}
                  onSetPrimary={setPrimaryHousingPhoto}
                  onRemove={removeHousingPhoto}
                />
              </div>
              <label className={styles.field}>
                <span>Type de bien</span>
                <select
                  value={draft.characteristics.propertyType}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      characteristics: {
                        ...current.characteristics,
                        propertyType: event.target.value,
                        categorie: event.target.value,
                      },
                    }))
                  }
                >
                  <option value="">Sélectionner</option>
                  {HOUSING_PROPERTY_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Plateforme principale</span>
                <select
                  value={draft.plateforme ?? ""}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      plateforme: event.target.value,
                      characteristics: {
                        ...current.characteristics,
                        platforms: event.target.value ? [event.target.value] : [],
                      },
                    }))
                  }
                >
                  <option value="">Aucune</option>
                  {HOUSING_PLATFORM_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Étage à monter</span>
                <input
                  value={draft.locationInfo.floor}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      locationInfo: {
                        ...current.locationInfo,
                        floor: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Surface (m²)</span>
                <input
                  type="number"
                  min="0"
                  value={draft.characteristics.surfaceSqm ?? ""}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      characteristics: {
                        ...current.characteristics,
                        surfaceSqm: toNullableNumber(event.target.value),
                        superficie: toNullableNumber(event.target.value),
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Nombre de couchages</span>
                <input
                  type="number"
                  min="0"
                  value={draft.characteristics.guestCapacity ?? ""}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      characteristics: {
                        ...current.characteristics,
                        guestCapacity: toNullableNumber(event.target.value),
                        capacite: toNullableNumber(event.target.value),
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Nombre de doubles de clés</span>
                <input
                  type="number"
                  min="0"
                  value={draft.characteristics.keyCount ?? ""}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      characteristics: {
                        ...current.characteristics,
                        keyCount: toNullableNumber(event.target.value),
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Nombre de chambres</span>
                <input
                  type="number"
                  min="0"
                  value={draft.characteristics.bedroomCount ?? ""}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      characteristics: {
                        ...current.characteristics,
                        bedroomCount: toNullableNumber(event.target.value),
                        nb_chambres: toNullableNumber(event.target.value),
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Salles de bain</span>
                <input
                  type="number"
                  min="0"
                  value={draft.characteristics.bathroomCount ?? ""}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      characteristics: {
                        ...current.characteristics,
                        bathroomCount: toNullableNumber(event.target.value),
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Nombre de lits</span>
                <input
                  type="number"
                  min="0"
                  value={draft.characteristics.bedCount ?? ""}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      characteristics: {
                        ...current.characteristics,
                        bedCount: toNullableNumber(event.target.value),
                      },
                    }))
                  }
                />
              </label>
              <div className={styles.fullField}>
                <div className={styles.subsectionDivider}>
                  <p className={styles.subsectionTitle}>Accès et logistique terrain</p>
                  <p className={styles.subsectionText}>
                    Donnez aux concierges de quoi arriver, entrer, circuler et gérer les clés sans friction.
                  </p>
                </div>
              </div>
              <label className={styles.fullField}>
                <span>Adresse du logement</span>
                <input
                  value={draft.locationInfo.addressLine1}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      adresse: event.target.value,
                      locationInfo: {
                        ...current.locationInfo,
                        addressLine1: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Complément d&apos;adresse</span>
                <input
                  value={draft.locationInfo.addressLine2}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      locationInfo: {
                        ...current.locationInfo,
                        addressLine2: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.fullField}>
                <span>Wi‑Fi / box / mot de passe</span>
                <input
                  value={draft.characteristics.wifiInfo}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      characteristics: {
                        ...current.characteristics,
                        wifiInfo: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Code postal</span>
                <input
                  value={draft.locationInfo.postalCode}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      locationInfo: {
                        ...current.locationInfo,
                        postalCode: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Ville</span>
                <input
                  value={draft.locationInfo.city}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      ville: event.target.value,
                      locationInfo: {
                        ...current.locationInfo,
                        city: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Caution</span>
                <input
                  type="number"
                  min="0"
                  value={draft.pricing.securityDeposit ?? ""}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      pricing: {
                        ...current.pricing,
                        securityDeposit: toNullableNumber(event.target.value),
                        caution: toNullableNumber(event.target.value),
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Code d&apos;accès</span>
                <input
                  value={draft.locationInfo.accessCode}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      locationInfo: {
                        ...current.locationInfo,
                        accessCode: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.fullField}>
                <span>Instructions d&apos;entrée</span>
                <textarea
                  value={draft.locationInfo.entryInstructions}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      locationInfo: {
                        ...current.locationInfo,
                        entryInstructions: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <div className={styles.fullField}>
                <div className={styles.subsectionDivider}>
                  <p className={styles.subsectionTitle}>Préparation et exploitation</p>
                  <p className={styles.subsectionText}>
                    Les routines ménage, les points de contrôle et ce que le propriétaire souhaite suivre au fil des missions.
                  </p>
                </div>
              </div>
              <label className={styles.field}>
                <span>Temps de ménage estimé</span>
                <input
                  value={draft.services.temps ?? ""}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      services: {
                        ...current.services,
                        temps: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.fullField}>
                <span>Checklist ménage / remise en place</span>
                <textarea
                  value={draft.services.checklist ?? ""}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      services: {
                        ...current.services,
                        checklist: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.fullField}>
                <span>Consignes pour la conciergerie</span>
                <textarea
                  value={draft.services.instructions ?? ""}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      services: {
                        ...current.services,
                        instructions: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.fullField}>
                <span>Points de vigilance ménage et préparation</span>
                <textarea
                  value={draft.services.housekeepingNotes}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      services: {
                        ...current.services,
                        housekeepingNotes: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={draft.characteristics.terrace}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      characteristics: {
                        ...current.characteristics,
                        terrace: event.target.checked,
                      },
                    }))
                  }
                />
                <span>Terrasse</span>
              </label>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={draft.characteristics.stairs}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      characteristics: {
                        ...current.characteristics,
                        stairs: event.target.checked,
                      },
                    }))
                  }
                />
                <span>Escaliers</span>
              </label>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={draft.characteristics.pool}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      characteristics: {
                        ...current.characteristics,
                        pool: event.target.checked,
                      },
                    }))
                  }
                />
                <span>Piscine</span>
              </label>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={draft.characteristics.petsAllowed}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      characteristics: {
                        ...current.characteristics,
                        petsAllowed: event.target.checked,
                      },
                    }))
                  }
                />
                <span>Animaux acceptés</span>
              </label>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={draft.characteristics.nonSmoking}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      characteristics: {
                        ...current.characteristics,
                        nonSmoking: event.target.checked,
                      },
                    }))
                  }
                />
                <span>Non fumeur</span>
              </label>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={draft.characteristics.barbecue}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      characteristics: {
                        ...current.characteristics,
                        barbecue: event.target.checked,
                      },
                    }))
                  }
                />
                <span>Barbecue</span>
              </label>
              <div className={styles.fullField}>
                <span>Chèque à demander aux locataires</span>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={draft.characteristics.chequeRequired}
                    disabled={!editing}
                    onChange={(event) =>
                      applyDraftUpdate((current) => ({
                        ...current,
                        characteristics: {
                          ...current.characteristics,
                          chequeRequired: event.target.checked,
                        },
                      }))
                    }
                  />
                  <span>Demander un chèque de caution aux locataires</span>
                </label>
              </div>
              <div className={styles.fullField}>
                <div className={styles.subsectionDivider}>
                  <p className={styles.subsectionTitle}>Contact et pilotage propriétaire</p>
                  <p className={styles.subsectionText}>
                    Les coordonnées utiles et les consignes de suivi à conserver sur la fiche du bien.
                  </p>
                </div>
              </div>
              <label className={styles.fullField}>
                <span>Description</span>
                <textarea
                  value={draft.characteristics.description ?? ""}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      characteristics: {
                        ...current.characteristics,
                        description: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Propriétaire</span>
                <input
                  value={draft.owner.fullName}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      owner: {
                        ...current.owner,
                        fullName: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Email propriétaire</span>
                <input
                  type="email"
                  value={draft.owner.email}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      owner: {
                        ...current.owner,
                        email: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Téléphone propriétaire</span>
                <input
                  value={draft.owner.phone}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      owner: {
                        ...current.owner,
                        phone: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Téléphone 2</span>
                <input
                  value={draft.owner.secondaryPhone}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      owner: {
                        ...current.owner,
                        secondaryPhone: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.fullField}>
                <span>Adresse propriétaire</span>
                <input
                  value={draft.owner.address}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      owner: {
                        ...current.owner,
                        address: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Contact principal</span>
                <input
                  value={draft.owner.primaryContactName}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      owner: {
                        ...current.owner,
                        primaryContactName: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Email principal</span>
                <input
                  type="email"
                  value={draft.owner.primaryContactEmail}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      owner: {
                        ...current.owner,
                        primaryContactEmail: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Tél. principal</span>
                <input
                  value={draft.owner.primaryContactPhone}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      owner: {
                        ...current.owner,
                        primaryContactPhone: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.fullField}>
                <span>Notes internes</span>
                <textarea
                  value={draft.services.internalNotes}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      services: {
                        ...current.services,
                        internalNotes: event.target.value,
                      },
                    }))
                  }
                />
              </label>
            </div>
          </div>
        ) : null}

        {activeTab === "documents" ? (
          <div className={styles.sectionStack}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIntro}>
                <p className={styles.sectionTitle}>Documents du logement</p>
                <strong className={styles.inspectionStatus}>
                  Contrats, guides d&apos;accueil, notices et documents utiles transmis aux intervenants.
                </strong>
              </div>
              {!editing ? (
                <button className={styles.tabEditButton} type="button" onClick={() => setEditing(true)}>
                  <FiEdit2 /> Modifier cet onglet
                </button>
              ) : (
                <span className={styles.tabEditBadge}>
                  <FiEdit2 /> {"\u00c9dition active"}
                </span>
              )}
            </div>
            {editing ? (
              <button className={styles.editBtn} type="button" onClick={addDraftDocument}>
                Ajouter un document
              </button>
            ) : null}
            {!documents.length ? (
              <div className={styles.panel}>
                <p>Aucun document rattaché à ce logement pour le moment.</p>
              </div>
            ) : (
              <div className={styles.formGrid}>
                {documents.map((doc, index) => (
                  <div className={styles.panel} key={doc.id}>
                    <label className={styles.field}>
                      <span>Nom</span>
                      <input
                        value={doc.name}
                        disabled={!editing}
                        onChange={(event) => updateDraftDocument(index, "name", event.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Type</span>
                      <input
                        value={doc.type}
                        disabled={!editing}
                        onChange={(event) => updateDraftDocument(index, "type", event.target.value)}
                      />
                    </label>
                    <label className={styles.fullField}>
                      <span>URL</span>
                      <input
                        value={doc.url}
                        disabled={!editing}
                        onChange={(event) => updateDraftDocument(index, "url", event.target.value)}
                      />
                    </label>
                    {editing ? (
                      <button className={styles.cancelBtn} type="button" onClick={() => removeDraftDocument(index)}>
                        Supprimer
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "stocks" ? (
          <div className={styles.sectionStack}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIntro}>
                <p className={styles.sectionTitle}>Stocks et équipements</p>
                <strong className={styles.inspectionStatus}>
                  Regroupez ici les éléments matériels à connaître avant une arrivée, un ménage ou une intervention.
                </strong>
              </div>
              {!editing ? (
                <button className={styles.tabEditButton} type="button" onClick={() => setEditing(true)}>
                  <FiEdit2 /> Modifier cet onglet
                </button>
              ) : (
                <span className={styles.tabEditBadge}>
                  <FiEdit2 /> {"\u00c9dition active"}
                </span>
              )}
            </div>
            <div className={styles.panel}>
              <label className={styles.fullField}>
                <span>Équipements et repères utiles</span>
                <input
                  value={draft.characteristics.amenities.join(", ")}
                  disabled={!editing}
                  onChange={(event) =>
                    applyDraftUpdate((current) => {
                      const amenities = parseCommaSeparatedList(event.target.value);
                      return {
                        ...current,
                        characteristics: {
                          ...current.characteristics,
                          amenities,
                          equipements: amenities,
                        },
                      };
                    })
                  }
                  placeholder="Wi-Fi, climatisation, parking, coffre, aspirateur..."
                />
              </label>
              {equipments.length ? (
                <ul className={styles.list}>
                  {equipments.map((item) => (
                    <li className={styles.listItem} key={item}>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Aucun équipement n&apos;est renseigné pour ce logement.</p>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "planning" ? (
          <div className={styles.sectionStack}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIntro}>
                <p className={styles.sectionTitle}>Planning du logement</p>
                <strong className={styles.inspectionStatus}>
                  Arrivées, départs, interventions et événements liés à ce logement.
                </strong>
              </div>
              <div className={styles.inspectionActions}>
                {!editing ? (
                  <button className={styles.tabEditButton} type="button" onClick={() => setEditing(true)}>
                    <FiEdit2 /> Modifier cet onglet
                  </button>
                ) : (
                  <>
                    <span className={styles.tabEditBadge}>
                      <FiEdit2 /> {"\u00c9dition active"}
                    </span>
                    <button className={styles.editBtn} type="button" onClick={addPlanningEvent}>
                      Ajouter un élément
                    </button>
                  </>
                )}
              </div>
            </div>
            {!planningEvents.length ? (
              <div className={styles.panel}>
                <p>Aucun événement embarqué sur ce logement.</p>
              </div>
            ) : (
              <div className={styles.formGrid}>
                {planningEvents.map((event, index) => (
                  <div className={styles.panel} key={event.id}>
                    <label className={styles.field}>
                      <span>Titre</span>
                      <input
                        value={event.title}
                        disabled={!editing}
                        onChange={(item) => updatePlanningEvent(index, "title", item.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Date</span>
                      <input
                        type="datetime-local"
                        value={event.date ? event.date.slice(0, 16) : ""}
                        disabled={!editing}
                        onChange={(item) => updatePlanningEvent(index, "date", item.target.value)}
                      />
                    </label>
                    <label className={styles.fullField}>
                      <span>Description</span>
                      <textarea
                        value={event.description}
                        disabled={!editing}
                        onChange={(item) => updatePlanningEvent(index, "description", item.target.value)}
                      />
                    </label>
                    {editing ? (
                      <button className={styles.cancelBtn} type="button" onClick={() => removePlanningEvent(index)}>
                        Supprimer
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            <p className={styles.sectionTitle}>Missions liées</p>
            {relatedMissions.length ? (
              <div className={styles.list}>
                {relatedMissions.map((mission) => (
                  <div className={styles.listItem} key={mission.id}>
                    <strong>{mission.title}</strong>
                    <p>
                      {mission.status || "Statut inconnu"} | {formatDate(mission.scheduled_start)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.panel}>
                <p>Aucune mission n&apos;est encore liée à ce logement.</p>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "litiges" ? (
          <div className={styles.sectionStack}>
            <div className={styles.inspectionPanel}>
              <div className={styles.inspectionHeader}>
                <p className={styles.statLabel}>Litige voyageur</p>
                <strong className={styles.inspectionStatus}>
                  {inspectionStatus ? `Inspection: ${inspectionStatus}` : "Aucune inspection disponible"}
                </strong>
              </div>

              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>Type de litige</span>
                  <select
                    value={disputeType}
                    onChange={(event) =>
                      setDisputeType(event.target.value as "damage" | "missing_item" | "cleaning" | "other")
                    }
                    disabled={disputeBusy || !inspectionId}
                  >
                    <option value="damage">Dégât</option>
                    <option value="missing_item">Objet manquant</option>
                    <option value="cleaning">Ménage non conforme</option>
                    <option value="other">Autre</option>
                  </select>
                </label>

                <label className={styles.field}>
                  <span>Montant estimé (EUR)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={estimatedAmount}
                    onChange={(event) => setEstimatedAmount(event.target.value)}
                    placeholder="280.00"
                    disabled={disputeBusy || !inspectionId}
                  />
                </label>

                <label className={styles.fullField}>
                  <span>Description</span>
                  <textarea
                    value={disputeDescription}
                    onChange={(event) => setDisputeDescription(event.target.value)}
                    placeholder="Précisez les dégâts et le contexte."
                    disabled={disputeBusy || !inspectionId}
                  />
                </label>
              </div>

              <div className={styles.sectionStack}>
                <p className={styles.sectionTitle}>Preuves sélectionnées</p>

                <div className={styles.panel}>
                  <strong>Checklist anomalies</strong>
                  {issueChecklistItems.length === 0 ? (
                    <p>Aucune anomalie checklist sur l&apos;inspection.</p>
                  ) : (
                    <div className={styles.list}>
                      {issueChecklistItems.map((item) => (
                        <label key={item.id} className={styles.checkboxRow}>
                          <input
                            type="checkbox"
                            checked={selectedChecklistItemIds.includes(item.id)}
                            onChange={() =>
                              setSelectedChecklistItemIds((prev) => toggleStringInList(prev, item.id))
                            }
                            disabled={disputeBusy}
                          />
                          <span>{item.item_label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.panel}>
                  <strong>Médias de preuve</strong>
                  {inspectionMedia.length === 0 ? (
                    <p>Aucun média lié à l&apos;inspection.</p>
                  ) : (
                    <div className={styles.mediaList}>
                      {inspectionMedia.map((media) => (
                        <label key={media.id} className={styles.mediaRow}>
                          <div className={styles.mediaPreviewWrap}>
                            {media.media_type === "photo" && buildMediaPreviewUrl(media.storage_path) ? (
                              <img
                                src={buildMediaPreviewUrl(media.storage_path) ?? ""}
                                alt={`Preuve ${media.id}`}
                                className={styles.mediaThumb}
                              />
                            ) : null}
                            {media.media_type === "video" && buildMediaPreviewUrl(media.storage_path) ? (
                              <video
                                className={styles.mediaThumb}
                                src={buildMediaPreviewUrl(media.storage_path) ?? ""}
                                controls
                                preload="metadata"
                              />
                            ) : null}
                            <span>
                              {media.media_type.toUpperCase()} - {formatDate(media.created_at)}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedMediaIds.includes(media.id)}
                            onChange={() => setSelectedMediaIds((prev) => toggleStringInList(prev, media.id))}
                            disabled={disputeBusy}
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.inspectionActions}>
                <button
                  className={styles.saveBtn}
                  type="button"
                  onClick={openDisputeFromInspection}
                  disabled={disputeBusy || !inspectionId}
                >
                  Ouvrir un litige
                </button>
              </div>

              {disputeError ? <p className={styles.feedbackError}>{disputeError}</p> : null}
              {disputeSuccess ? <p className={styles.feedbackSuccess}>{disputeSuccess}</p> : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
