"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

const tabs: Array<{ id: OwnerHousingTab; label: string; icon: React.ComponentType }> = [
  { id: "infos", label: "Informations", icon: FiHome },
  { id: "documents", label: "Documents", icon: FiFileText },
  { id: "stocks", label: "Stocks & équipements", icon: FiBox },
  { id: "planning", label: "Planning", icon: FiCalendar },
];

function formatDate(value: string | null | undefined) {
  if (!value) return "Non planifié";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("fr-FR");
}

export default function OwnerHousingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [logement, setLogement] = useState<LogementTyped | null>(null);
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<OwnerHousingTab>("infos");

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

        setLogement(parseHousingRow(housingPayload as HousingRow));
        setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [id]);

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
              <span className={styles.metaPill}>
                {logement.infos?.capacite || "Capacité à préciser"}
              </span>
              <span className={styles.metaPill}>
                {logement.infos?.nb_chambres || "Chambres à préciser"}
              </span>
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
                <span>Capacité</span>
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
                <p>Aucun document rattaché à ce logement pour le moment.</p>
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
                Pour compléter les pièces globales, vous pouvez aussi consulter{" "}
                <Link href="/dashboard/owner/documents">Documents</Link>.
              </p>
            </div>
          </div>
        ) : null}

        {activeTab === "stocks" ? (
          <div className={styles.sectionStack}>
            <p className={styles.sectionTitle}>Stocks et équipements</p>
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
                <p>Aucun équipement n’est renseigné pour ce logement.</p>
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
                <p>Aucun événement embarqué sur ce logement.</p>
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
                <p>Aucune mission n’est encore liée à ce logement.</p>
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
