"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { FiBox, FiCalendar, FiFileText, FiHome } from "react-icons/fi";
import styles from "../../../concierge/logements/[id]/FicheLogement.module.scss";
import {
  type DocumentItem,
  type HousingRow,
  type LogementTyped,
  type PlanningEvent,
  parseHousingRow,
} from "../../../concierge/logements/[id]/logementHelpers";

type OwnerHousingTab = "infos" | "documents" | "stocks" | "planning";

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
  { id: "infos", label: "Informations", icon: FiHome },
  { id: "documents", label: "Documents", icon: FiFileText },
  { id: "stocks", label: "Stocks et equipements", icon: FiBox },
  { id: "planning", label: "Planning", icon: FiCalendar },
];

function formatDate(value: string | null | undefined) {
  if (!value) return "Non planifie";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("fr-FR");
}

function toggleStringInList(values: string[], nextValue: string) {
  return values.includes(nextValue)
    ? values.filter((value) => value !== nextValue)
    : [...values, nextValue];
}

export default function OwnerHousingDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [logement, setLogement] = useState<LogementTyped | null>(null);
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<OwnerHousingTab>("infos");

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
          throw new Error(missionsPayload?.error || "Impossible de charger le planning lie");
        }

        setLogement(parseHousingRow(housingPayload as HousingRow));
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
      "Litige ouvert suite a l'inspection de depart voyageur.",
      issueItems.length > 0 ? `Anomalies constatees: ${issueItems.map((item) => item.item_label).join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
    if (details) {
      setDisputeDescription(details);
    }
  }, [inspectionChecklist, disputeDescription]);

  useEffect(() => {
    if (!disputeError && !disputeSuccess) return;
    const timeout = window.setTimeout(() => {
      setDisputeError(null);
      setDisputeSuccess(null);
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [disputeError, disputeSuccess]);

  const relatedMissions = useMemo(
    () => missions.filter((mission) => String(mission.property_id ?? "") === String(id)),
    [id, missions],
  );

  const planningEvents = useMemo(
    () => (Array.isArray(logement?.planning) ? (logement.planning as PlanningEvent[]) : []),
    [logement],
  );

  const documents = useMemo(
    () => (Array.isArray(logement?.documents) ? (logement.documents as DocumentItem[]) : []),
    [logement],
  );

  const equipments = useMemo(
    () => (Array.isArray(logement?.infos?.equipements) ? logement.infos?.equipements ?? [] : []),
    [logement],
  );

  const issueChecklistItems = useMemo(
    () => inspectionChecklist.filter((item) => item.item_status === "issue"),
    [inspectionChecklist],
  );

  const buildMediaPreviewUrl = (storagePath: string) => {
    if (!supabasePublicUrl || !storagePath) return null;
    return `${supabasePublicUrl}/storage/v1/object/public/inspection-evidence/${storagePath}`;
  };

  async function openDisputeFromInspection() {
    if (!inspectionId) {
      setDisputeError("Aucune inspection disponible pour ce logement.");
      return;
    }

    if (selectedMediaIds.length === 0 && selectedChecklistItemIds.length === 0) {
      setDisputeError("Selectionnez au moins une preuve (media ou checklist).");
      return;
    }

    try {
      setDisputeBusy(true);
      setDisputeError(null);
      setDisputeSuccess(null);

      const amountValue = estimatedAmount.trim().length > 0 ? Number(estimatedAmount) : null;
      if (amountValue !== null && (!Number.isFinite(amountValue) || amountValue < 0)) {
        throw new Error("Montant estime invalide.");
      }

      const response = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspectionId,
          disputeType,
          title: `Litige - ${logement?.nom_logement || "Logement"}`,
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
      setDisputeSuccess("Litige ouvert avec succes.");
    } catch (err) {
      setDisputeError(err instanceof Error ? err.message : "Erreur ouverture litige.");
    } finally {
      setDisputeBusy(false);
    }
  }

  if (loading) return <div className={styles.loading}>Chargement...</div>;
  if (error || !logement) return <div className={styles.error}>{error || "Erreur"}</div>;

  const planningCount = planningEvents.length;
  const documentCount = documents.length;
  const equipmentCount = equipments.length;

  return (
    <div className={styles.ficheLogement}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Parc immobilier</p>
            <h1>{logement.nom_logement}</h1>
            <p>
              {logement.adresse}, {logement.ville}
            </p>
            <div className={styles.heroMeta}>
              <span className={styles.metaPill}>{logement.infos?.categorie || "Bien"}</span>
              <span className={styles.metaPill}>{logement.infos?.capacite || "Capacite a preciser"}</span>
              <span className={styles.metaPill}>{logement.infos?.nb_chambres || "Chambres a preciser"}</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Link className={styles.cancelBtn} href="/dashboard/owner/logements">
              Retour aux logements
            </Link>
            <Link className={styles.editBtn} href="/dashboard/owner/documents">
              Voir mes documents
            </Link>
          </div>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Equipements</p>
            <strong className={styles.statValue}>{equipmentCount}</strong>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Documents</p>
            <strong className={styles.statValue}>{documentCount}</strong>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Elements planning</p>
            <strong className={styles.statValue}>{planningCount + relatedMissions.length}</strong>
          </div>
        </div>

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
                <option value="damage">Degat</option>
                <option value="missing_item">Manquant</option>
                <option value="cleaning">Menage non conforme</option>
                <option value="other">Autre</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>Montant estime (EUR)</span>
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
                placeholder="Precisez les degats et le contexte."
                disabled={disputeBusy || !inspectionId}
              />
            </label>
          </div>

          <div className={styles.sectionStack}>
            <p className={styles.sectionTitle}>Preuves selectionnees (prefill)</p>

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
              <strong>Medias de preuve</strong>
              {inspectionMedia.length === 0 ? (
                <p>Aucun media lie a l&apos;inspection.</p>
              ) : (
                <div className={styles.mediaList}>
                  {inspectionMedia.map((media) => (
                    <label key={media.id} className={styles.mediaRow}>
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

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === "infos" ? (
          <div className={styles.sectionStack}>
            <p className={styles.sectionTitle}>Informations du logement</p>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Type de bien</span>
                <input value={logement.infos?.categorie ?? ""} disabled />
              </label>
              <label className={styles.field}>
                <span>Capacite</span>
                <input value={logement.infos?.capacite ?? ""} disabled />
              </label>
              <label className={styles.field}>
                <span>Nombre de chambres</span>
                <input value={logement.infos?.nb_chambres ?? ""} disabled />
              </label>
              <label className={styles.fullField}>
                <span>Description</span>
                <textarea value={logement.infos?.description ?? ""} disabled />
              </label>
            </div>
          </div>
        ) : null}

        {activeTab === "documents" ? (
          <div className={styles.sectionStack}>
            <p className={styles.sectionTitle}>Documents du logement</p>
            {!documents.length ? (
              <div className={styles.panel}>
                <p>Aucun document rattache a ce logement pour le moment.</p>
              </div>
            ) : (
              <ul className={styles.list}>
                {documents.map((doc, index) => (
                  <li className={styles.listItem} key={`${doc.name}-${index}`}>
                    {doc.url ? (
                      <a href={doc.url} target="_blank" rel="noreferrer">
                        {doc.name}
                      </a>
                    ) : (
                      doc.name
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className={styles.panel}>
              <p>
                Pour completer les pieces globales, vous pouvez aussi consulter{" "}
                <Link href="/dashboard/owner/documents">Documents</Link>.
              </p>
            </div>
          </div>
        ) : null}

        {activeTab === "stocks" ? (
          <div className={styles.sectionStack}>
            <p className={styles.sectionTitle}>Stocks et equipements</p>
            {equipments.length ? (
              <ul className={styles.list}>
                {equipments.map((item) => (
                  <li className={styles.listItem} key={item}>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.panel}>
                <p>Aucun equipement n&apos;est renseigne pour ce logement.</p>
              </div>
            )}
            <div className={styles.panel}>
              <p>
                Retrouvez la vue transversale dans <Link href="/dashboard/owner/stocks">Stocks</Link>.
              </p>
            </div>
          </div>
        ) : null}

        {activeTab === "planning" ? (
          <div className={styles.sectionStack}>
            <p className={styles.sectionTitle}>Planning du logement</p>
            {planningEvents.length ? (
              <div className={styles.list}>
                {planningEvents.map((event, index) => (
                  <div className={styles.listItem} key={`${event.date}-${event.type}-${index}`}>
                    <strong>{event.type}</strong>
                    <p>{formatDate(event.date)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.panel}>
                <p>Aucun evenement embarque sur ce logement.</p>
              </div>
            )}

            <p className={styles.sectionTitle}>Missions liees</p>
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
                <p>Aucune mission n&apos;est encore liee a ce logement.</p>
              </div>
            )}

            <div className={styles.panel}>
              <p>
                Pour la vue globale, consultez aussi <Link href="/dashboard/owner/planning">Planning</Link>.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
