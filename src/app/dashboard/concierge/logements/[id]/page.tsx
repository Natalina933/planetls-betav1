"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  FiCalendar,
  FiClipboard,
  FiFileText,
  FiHome,
  FiMessageSquare,
} from "react-icons/fi";
import styles from "./FicheLogement.module.scss";
import {
  type ActiveTab,
  type HousingRow,
  type LogementTyped,
  buildEditableLogement,
  buildLogementPatchPayload,
  hasPendingLogementChanges,
  parseHousingRow,
  validateLogementChanges,
} from "./logementHelpers";
import {
  DocumentsTabSection,
  InfosTabSection,
  MenageTabSection,
  NotesTabSection,
  PlanningTabSection,
  TarifsTabSection,
} from "./logementSections";

const tabs: Array<{ id: ActiveTab; label: string; icon: React.ComponentType }> = [
  { id: "infos", label: "Informations", icon: FiHome },
  { id: "menage", label: "Ménage & préparation", icon: FiClipboard },
  { id: "planning", label: "Planning", icon: FiCalendar },
  { id: "docs", label: "Documents", icon: FiFileText },
  { id: "notes", label: "Notes internes", icon: FiMessageSquare },
  { id: "tarifs", label: "Tarifs & contrat", icon: FiFileText },
];

interface InspectionSummary {
  id: string;
  status: string;
}

interface InspectionChecklistItem {
  id: string;
  item_key: string;
  item_label: string;
}

interface InspectionMediaItem {
  id: string;
  media_type: "photo" | "video";
  mime_type?: string | null;
  storage_path: string;
  created_at: string;
  checklist_item_id: string | null;
}

export default function FicheLogementPage() {
  const params = useParams();
  const { data: session } = useSession();
  const id = params.id as string;

  const [logement, setLogement] = useState<LogementTyped | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<Partial<LogementTyped>>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>("infos");
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [inspectionStatus, setInspectionStatus] = useState<string | null>(null);
  const [inspectionChecklist, setInspectionChecklist] = useState<InspectionChecklistItem[]>([]);
  const [inspectionMedia, setInspectionMedia] = useState<InspectionMediaItem[]>([]);
  const [inspectionBusy, setInspectionBusy] = useState(false);
  const [inspectionError, setInspectionError] = useState<string | null>(null);
  const [inspectionSuccess, setInspectionSuccess] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaChecklistItemId, setMediaChecklistItemId] = useState("");
  const [signatureName, setSignatureName] = useState("");

  const currentProfileId = typeof session?.user?.id === "string" ? session.user.id : null;
  const supabasePublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  useEffect(() => {
    async function fetchLogement() {
      try {
        const res = await fetch(`/api/housing/${id}`);
        if (!res.ok) throw new Error("Logement introuvable");

        const data: HousingRow = await res.json();
        setLogement(parseHousingRow(data));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    void fetchLogement();
  }, [id]);

  useEffect(() => {
    if (!saveError && !saveSuccess) return;

    const timeout = window.setTimeout(() => {
      setSaveError(null);
      setSaveSuccess(null);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [saveError, saveSuccess]);

  useEffect(() => {
    if (!inspectionError && !inspectionSuccess) return;

    const timeout = window.setTimeout(() => {
      setInspectionError(null);
      setInspectionSuccess(null);
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [inspectionError, inspectionSuccess]);

  useEffect(() => {
    const fullName = [session?.user?.firstName, session?.user?.lastName]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
      .join(" ")
      .trim();
    const fallback = typeof session?.user?.name === "string" ? session.user.name.trim() : "";
    setSignatureName(fullName || fallback);
  }, [session?.user?.firstName, session?.user?.lastName, session?.user?.name]);

  async function loadInspectionDetails(nextInspectionId: string) {
    const detailRes = await fetch(`/api/inspections/${nextInspectionId}`);
    if (!detailRes.ok) {
      throw new Error("Impossible de charger le detail inspection.");
    }

    const detailData = (await detailRes.json()) as {
      inspection?: { status?: string };
      checklist?: InspectionChecklistItem[];
      media?: InspectionMediaItem[];
    };

    setInspectionId(nextInspectionId);
    setInspectionStatus(detailData.inspection?.status ?? null);
    setInspectionChecklist(detailData.checklist ?? []);
    setInspectionMedia(detailData.media ?? []);
  }

  async function loadLatestInspection() {
    const res = await fetch(`/api/inspections?housingId=${id}&limit=1`);
    if (!res.ok) return;

    const inspections = (await res.json()) as InspectionSummary[];
    const latest = Array.isArray(inspections) && inspections.length > 0 ? inspections[0] : null;

    if (!latest?.id) {
      setInspectionId(null);
      setInspectionStatus(null);
      setInspectionChecklist([]);
      setInspectionMedia([]);
      return;
    }

    await loadInspectionDetails(latest.id);
  }

  const editableLogement = useMemo(() => buildEditableLogement(logement, editedData), [logement, editedData]);
  const hasPendingChanges = useMemo(() => hasPendingLogementChanges(editedData), [editedData]);

  useEffect(() => {
    void loadLatestInspection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function beginEdit() {
    setSaveError(null);
    setSaveSuccess(null);
    setEditedData({});
    setEditMode(true);
  }

  function cancelEdit() {
    if (hasPendingChanges && !window.confirm("Annuler les modifications non sauvegardées ?")) {
      return;
    }

    setEditedData({});
    setEditMode(false);
    setSaveError(null);
  }

  function handleTabChange(nextTab: ActiveTab) {
    if (
      nextTab !== activeTab &&
      editMode &&
      hasPendingChanges &&
      !window.confirm("Changer d'onglet sans sauvegarder les modifications ?")
    ) {
      return;
    }

    setActiveTab(nextTab);
  }

  async function createInspectionDraft() {
    if (!currentProfileId) {
      setInspectionError("Session introuvable, reconnectez-vous.");
      return;
    }

    const housingId = Number(id);
    if (!Number.isFinite(housingId) || housingId <= 0) {
      setInspectionError("Identifiant logement invalide.");
      return;
    }

    try {
      setInspectionBusy(true);
      setInspectionError(null);
      setInspectionSuccess(null);

      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          housingId,
          conciergeProfileId: currentProfileId,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "Creation inspection impossible.");
      }

      if (!payload?.id || typeof payload.id !== "string") {
        throw new Error("Inspection creee, mais reponse invalide.");
      }

      await loadInspectionDetails(payload.id);
      setInspectionSuccess("Inspection brouillon creee.");
    } catch (err) {
      setInspectionError(err instanceof Error ? err.message : "Erreur creation inspection.");
    } finally {
      setInspectionBusy(false);
    }
  }

  async function pushDefaultChecklist() {
    if (!inspectionId) {
      setInspectionError("Creez d'abord une inspection.");
      return;
    }

    try {
      setInspectionBusy(true);
      setInspectionError(null);
      setInspectionSuccess(null);

      const defaultItems = [
        { zoneKey: "entree", itemKey: "entree-sol", itemLabel: "Sol entree", itemStatus: "ok" },
        { zoneKey: "salon", itemKey: "salon-mobilier", itemLabel: "Mobilier salon", itemStatus: "ok" },
        { zoneKey: "cuisine", itemKey: "cuisine-vaisselle", itemLabel: "Vaisselle complete", itemStatus: "ok" },
        { zoneKey: "sdb", itemKey: "sdb-proprete", itemLabel: "Proprete salle de bain", itemStatus: "ok" },
        { zoneKey: "chambre", itemKey: "chambre-linge", itemLabel: "Linge et literie", itemStatus: "ok" },
      ];

      const res = await fetch(`/api/inspections/${inspectionId}/checklist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: defaultItems, replace: false }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "Maj checklist impossible.");
      }

      await loadInspectionDetails(inspectionId);
      setInspectionSuccess("Checklist standard enregistree.");
    } catch (err) {
      setInspectionError(err instanceof Error ? err.message : "Erreur checklist.");
    } finally {
      setInspectionBusy(false);
    }
  }

  async function uploadInspectionMedia() {
    if (!inspectionId) {
      setInspectionError("Creez d'abord une inspection.");
      return;
    }

    if (!mediaFile) {
      setInspectionError("Selectionnez un fichier image/video.");
      return;
    }

    try {
      setInspectionBusy(true);
      setInspectionError(null);
      setInspectionSuccess(null);

      const formData = new FormData();
      formData.append("file", mediaFile);
      if (mediaChecklistItemId.trim()) {
        formData.append("checklistItemId", mediaChecklistItemId.trim());
      }
      formData.append("capturedAtDevice", new Date().toISOString());

      const res = await fetch(`/api/inspections/${inspectionId}/media`, {
        method: "POST",
        body: formData,
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "Upload impossible.");
      }

      await loadInspectionDetails(inspectionId);
      setMediaFile(null);
      setInspectionSuccess("Media ajoute a l'inspection.");
    } catch (err) {
      setInspectionError(err instanceof Error ? err.message : "Erreur upload media.");
    } finally {
      setInspectionBusy(false);
    }
  }

  async function submitInspection() {
    if (!inspectionId) {
      setInspectionError("Creez d'abord une inspection.");
      return;
    }

    if (!signatureName.trim()) {
      setInspectionError("Renseignez la signature avant soumission.");
      return;
    }

    try {
      setInspectionBusy(true);
      setInspectionError(null);
      setInspectionSuccess(null);

      const res = await fetch(`/api/inspections/${inspectionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureName: signatureName.trim(),
          signatureAccepted: true,
          clientTimestamp: new Date().toISOString(),
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "Soumission impossible.");
      }

      await loadInspectionDetails(inspectionId);
      setInspectionSuccess("Inspection soumise.");
    } catch (err) {
      setInspectionError(err instanceof Error ? err.message : "Erreur soumission inspection.");
    } finally {
      setInspectionBusy(false);
    }
  }

  async function deleteInspectionMedia(mediaId: string) {
    if (!inspectionId) return;

    try {
      setInspectionBusy(true);
      setInspectionError(null);
      setInspectionSuccess(null);

      const res = await fetch(`/api/inspections/${inspectionId}/media/${mediaId}`, {
        method: "DELETE",
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "Suppression media impossible.");
      }

      await loadInspectionDetails(inspectionId);
      setInspectionSuccess("Media supprime.");
    } catch (err) {
      setInspectionError(err instanceof Error ? err.message : "Erreur suppression media.");
    } finally {
      setInspectionBusy(false);
    }
  }

  async function saveChanges() {
    try {
      setSaveError(null);
      setSaveSuccess(null);

      const validation = validateLogementChanges(editableLogement);
      if (!validation.isValid) {
        setSaveError(validation.message);
        return;
      }

      const res = await fetch(`/api/housing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildLogementPatchPayload(editedData)),
      });

      if (!res.ok) {
        throw new Error("Erreur en sauvegardant");
      }

      if (editableLogement) {
        setLogement(editableLogement);
      }
      setSaveSuccess("Modifications enregistrées.");
      setEditMode(false);
      setEditedData({});
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erreur en sauvegardant");
    }
  }

  if (loading) return <div className={styles.loading}>Chargement...</div>;
  if (error || !logement || !editableLogement) {
    return <div className={styles.error}>{error || "Erreur"}</div>;
  }

  const planningCount = Array.isArray(editableLogement.planning) ? editableLogement.planning.length : 0;
  const documentCount = Array.isArray(editableLogement.documents) ? editableLogement.documents.length : 0;
  const notesCount = Array.isArray(editableLogement.notes) ? editableLogement.notes.length : 0;
  const canSubmitInspection = Boolean(inspectionId && inspectionStatus === "draft");

  const buildMediaPreviewUrl = (storagePath: string) => {
    if (!supabasePublicUrl || !storagePath) return null;
    return `${supabasePublicUrl}/storage/v1/object/public/inspection-evidence/${storagePath}`;
  };

  return (
    <div className={styles.ficheLogement}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Fiche logement</p>
            <h1>{editableLogement.nom_logement}</h1>
            <p>
              {editableLogement.adresse}, {editableLogement.ville}
            </p>
            <div className={styles.heroMeta}>
              <span className={styles.metaPill}>{editableLogement.infos?.categorie || "Bien"}</span>
              <span className={styles.metaPill}>
                {editableLogement.infos?.capacite || "Capacité non précisée"}
              </span>
              <span className={styles.metaPill}>
                {editableLogement.infos?.nb_chambres || "Chambres à compléter"}
              </span>
            </div>
          </div>

          {!editMode ? (
            <button className={styles.editBtn} onClick={beginEdit}>
              Modifier
            </button>
          ) : (
            <div className={styles.headerActions}>
              <button className={styles.cancelBtn} onClick={cancelEdit}>
                Annuler
              </button>
              <button className={styles.saveBtn} onClick={saveChanges} disabled={!hasPendingChanges}>
                Sauvegarder
              </button>
            </div>
          )}
        </div>

        {saveError ? <p className={styles.feedbackError}>{saveError}</p> : null}
        {saveSuccess ? <p className={styles.feedbackSuccess}>{saveSuccess}</p> : null}

        <div className={styles.heroStats}>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Événements planning</p>
            <strong className={styles.statValue}>{planningCount}</strong>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Documents</p>
            <strong className={styles.statValue}>{documentCount}</strong>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Notes internes</p>
            <strong className={styles.statValue}>{notesCount}</strong>
          </div>
        </div>

        <div className={styles.inspectionPanel}>
          <div className={styles.inspectionHeader}>
            <p className={styles.statLabel}>Inspection depart voyageur</p>
            <strong className={styles.inspectionStatus}>
              {inspectionStatus ? `Statut: ${inspectionStatus}` : "Aucune inspection"}
            </strong>
          </div>

          <div className={styles.inspectionActions}>
            <button
              className={styles.editBtn}
              type="button"
              onClick={createInspectionDraft}
              disabled={inspectionBusy}
            >
              Creer inspection brouillon
            </button>
            <button
              className={styles.cancelBtn}
              type="button"
              onClick={pushDefaultChecklist}
              disabled={inspectionBusy || !inspectionId}
            >
              Envoyer checklist standard
            </button>
          </div>

          <div className={styles.inspectionInputs}>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(event) => setMediaFile(event.target.files?.[0] ?? null)}
              disabled={inspectionBusy || !inspectionId}
            />
            <select
              value={mediaChecklistItemId}
              onChange={(event) => setMediaChecklistItemId(event.target.value)}
              disabled={inspectionBusy || !inspectionId}
            >
              <option value="">Associer a un item (optionnel)</option>
              {inspectionChecklist.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.item_label}
                </option>
              ))}
            </select>
            <button
              className={styles.saveBtn}
              type="button"
              onClick={uploadInspectionMedia}
              disabled={inspectionBusy || !inspectionId}
            >
              Uploader media
            </button>
          </div>

          <div className={styles.submitInspectionRow}>
            <input
              type="text"
              value={signatureName}
              onChange={(event) => setSignatureName(event.target.value)}
              placeholder="Signature concierge"
              disabled={inspectionBusy || !canSubmitInspection}
            />
            <button
              className={styles.saveBtn}
              type="button"
              onClick={submitInspection}
              disabled={inspectionBusy || !canSubmitInspection}
            >
              Soumettre inspection
            </button>
          </div>

          {inspectionError ? <p className={styles.feedbackError}>{inspectionError}</p> : null}
          {inspectionSuccess ? <p className={styles.feedbackSuccess}>{inspectionSuccess}</p> : null}

          <div className={styles.mediaList}>
            {inspectionMedia.length === 0 ? (
              <p className={styles.inspectionHint}>Aucun media sur l&apos;inspection active.</p>
            ) : (
              inspectionMedia.map((media) => (
                <div key={media.id} className={styles.mediaRow}>
                  <div className={styles.mediaPreviewWrap}>
                    {media.media_type === "photo" && buildMediaPreviewUrl(media.storage_path) ? (
                      <Image
                        src={buildMediaPreviewUrl(media.storage_path) ?? ""}
                        alt={`Preuve ${media.id}`}
                        className={styles.mediaThumb}
                        width={320}
                        height={220}
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
                      {media.media_type.toUpperCase()} - {new Date(media.created_at).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.deleteMediaBtn}
                    onClick={() => void deleteInspectionMedia(media.id)}
                    disabled={inspectionBusy}
                  >
                    Supprimer
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ""}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === "infos" ? (
          <InfosTabSection
            editMode={editMode}
            logement={editableLogement}
            setEditedData={setEditedData}
          />
        ) : null}

        {activeTab === "menage" ? (
          <MenageTabSection
            editMode={editMode}
            logement={editableLogement}
            setEditedData={setEditedData}
          />
        ) : null}

        {activeTab === "planning" ? (
          <PlanningTabSection editMode={editMode} logement={editableLogement} />
        ) : null}

        {activeTab === "docs" ? (
          <DocumentsTabSection editMode={editMode} documents={editableLogement.documents} />
        ) : null}

        {activeTab === "notes" ? (
          <NotesTabSection
            editMode={editMode}
            logement={editableLogement}
            setEditedData={setEditedData}
          />
        ) : null}

        {activeTab === "tarifs" ? (
          <TarifsTabSection
            editMode={editMode}
            logement={editableLogement}
            setEditedData={setEditedData}
          />
        ) : null}
      </div>
    </div>
  );
}
