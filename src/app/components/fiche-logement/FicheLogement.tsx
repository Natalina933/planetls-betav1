"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  FiCalendar,
  FiClipboard,
  FiFileText,
  FiHome,
  FiMessageSquare,
} from "react-icons/fi";
import { Avatar } from "@/components/ui/Avatar";
import styles from "./FicheLogement.module.scss";

export type FicheLogementPlanningEvent = {
  date: string;
  type: string;
  guest?: string;
  agent?: string;
  status: string;
};

export type FicheLogementDocumentItem = {
  name: string;
  file: string;
};

export type FicheLogementData = {
  id: number;
  name: string;
  address: string;
  city: string;
  category: string;
  digicode: string;
  photos: string[];
  notes: string[];
  planning: FicheLogementPlanningEvent[];
  documents: FicheLogementDocumentItem[];
  housekeeping: {
    estimatedTime: string;
    checklist: string[];
    instructions: string;
  };
};

type TabId = "infos" | "menage" | "planning" | "docs" | "notes";

const TABS: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "infos", label: "Infos générales", icon: FiHome },
  { id: "menage", label: "Ménage & préparation", icon: FiClipboard },
  { id: "planning", label: "Planning", icon: FiCalendar },
  { id: "docs", label: "Documents", icon: FiFileText },
  { id: "notes", label: "Notes internes", icon: FiMessageSquare },
];

function formatDisplayDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function FicheLogement({ logement }: { logement: FicheLogementData }) {
  const [activeTab, setActiveTab] = useState<TabId>("infos");

  const safePhotos = useMemo(
    () => (Array.isArray(logement.photos) ? logement.photos.filter(Boolean) : []),
    [logement.photos],
  );

  return (
    <section className={styles.ficheLogement} aria-labelledby="logement-title">
      <header className={styles.header}>
        <div className={styles.headerIdentity}>
          <Avatar
            src={safePhotos[0] ?? null}
            name={logement.name}
            alt={`Avatar du logement ${logement.name}`}
            size="lg"
            className={styles.housingAvatar}
          />
          <div>
            <h1 id="logement-title">{logement.name}</h1>
            <p className={styles.address}>
              {logement.address} · {logement.city}
            </p>
            <p className={styles.category}>{logement.category}</p>
          </div>
        </div>

        <div className={styles.headerMeta}>
          <span className={styles.logementId}>ID #{logement.id}</span>
          <span className={styles.digicode}>
            <strong>Accès :</strong> {logement.digicode || "Non renseigné"}
          </span>
        </div>
      </header>

      <div
        className={styles.tabs}
        role="tablist"
        aria-label="Sections de la fiche logement"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              className={`${styles.tab} ${isActive ? styles.active : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className={styles.tabIcon} />
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.content}>
        <div
          role="tabpanel"
          id="panel-infos"
          aria-labelledby="tab-infos"
          hidden={activeTab !== "infos"}
          className={styles.section}
        >
          <h2>Informations générales</h2>

          <div className={styles.infoGrid}>
            <p>
              <strong>Nom :</strong> {logement.name}
            </p>
            <p>
              <strong>Adresse :</strong> {logement.address}
            </p>
            <p>
              <strong>Ville :</strong> {logement.city}
            </p>
            <p>
              <strong>Catégorie :</strong> {logement.category}
            </p>
            <p>
              <strong>Code d&apos;accès :</strong> {logement.digicode || "Non renseigné"}
            </p>
          </div>

          <h3>Photos</h3>
          <div className={styles.photos}>
            {safePhotos.length === 0 ? (
              <p className={styles.emptyState}>Aucune photo pour le moment.</p>
            ) : null}

            {safePhotos.map((src, index) => (
              <figure key={`${src}-${index}`} className={styles.photoItem}>
                <Image
                  src={src}
                  width={260}
                  height={180}
                  alt={`Photo du logement ${logement.name}`}
                  className={styles.photo}
                />
              </figure>
            ))}
          </div>
        </div>

        <div
          role="tabpanel"
          id="panel-menage"
          aria-labelledby="tab-menage"
          hidden={activeTab !== "menage"}
          className={styles.section}
        >
          <h2>Ménage & préparation</h2>
          <ul className={styles.checklist}>
            <li>
              <strong>Temps estimé :</strong> {logement.housekeeping.estimatedTime || "Non renseigné"}
            </li>
            <li>
              <strong>Check-list :</strong>{" "}
              {logement.housekeeping.checklist.length > 0
                ? logement.housekeeping.checklist.join(", ")
                : "Aucune check-list renseignée"}
            </li>
            <li>
              <strong>Instructions spéciales :</strong>{" "}
              {logement.housekeeping.instructions || "Aucune instruction particulière"}
            </li>
          </ul>
        </div>

        <div
          role="tabpanel"
          id="panel-planning"
          aria-labelledby="tab-planning"
          hidden={activeTab !== "planning"}
          className={styles.section}
        >
          <h2>Planning du logement</h2>
          {logement.planning.length === 0 ? (
            <p className={styles.emptyState}>Aucun événement planifié pour ce logement.</p>
          ) : null}

          {logement.planning.map((event, index) => (
            <article key={`${event.date}-${event.type}-${index}`} className={styles.event}>
              <header className={styles.eventHeader}>
                <strong className={styles.eventDate}>{formatDisplayDate(event.date)}</strong>
                <span className={styles.eventType}>{event.type}</span>
              </header>
              <div className={styles.eventMeta}>
                {event.guest ? <span>Client : {event.guest}</span> : null}
                {event.agent ? <span>Agent : {event.agent}</span> : null}
                <span className={styles.eventStatus}>{event.status}</span>
              </div>
            </article>
          ))}
        </div>

        <div
          role="tabpanel"
          id="panel-docs"
          aria-labelledby="tab-docs"
          hidden={activeTab !== "docs"}
          className={styles.section}
        >
          <h2>Documents</h2>
          {logement.documents.length === 0 ? (
            <p className={styles.emptyState}>Aucun document associé à ce logement.</p>
          ) : null}
          <ul className={styles.docsList}>
            {logement.documents.map((doc) => (
              <li key={doc.file || doc.name} className={styles.docItem}>
                <span>{doc.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          role="tabpanel"
          id="panel-notes"
          aria-labelledby="tab-notes"
          hidden={activeTab !== "notes"}
          className={styles.section}
        >
          <h2>Notes internes</h2>
          {logement.notes.length === 0 ? (
            <p className={styles.emptyState}>Aucune note interne pour ce logement.</p>
          ) : null}
          <ul className={styles.notesList}>
            {logement.notes.map((note, index) => (
              <li key={`${note}-${index}`} className={styles.noteItem}>
                {note}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
