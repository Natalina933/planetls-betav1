"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FiHome, FiClipboard, FiCalendar, FiFileText, FiMessageSquare } from "react-icons/fi";
import Image from "next/image";
import styles from "./FicheLogement.module.scss";
import { Database } from "@/types/supabase";

// Types pour les colonnes JSONB
type HousingRow = Database["public"]["Tables"]["housing"]["Row"];

interface InfosJSON {
  digicode?: string;
  categorie?: string;
  superficie?: string;
  nb_chambres?: number;
  [key: string]: unknown;
}

interface ProprietaireJSON {
  nom?: string;
  telephone?: string;
  email?: string;
  [key: string]: unknown;
}

interface LocationJSON {
  prix_nuit?: number;
  caution?: number;
  frais_menage?: number;
  [key: string]: unknown;
}

interface MenageJSON {
  temps?: string;
  checklist?: string;
  instructions?: string;
  [key: string]: unknown;
}

interface PlanningEvent {
  date: string;
  type: string;
  guest?: string;
  agent?: string;
  status?: string;
}

interface DocumentItem {
  name: string;
  file?: string;
  url?: string;
}

// Type étendu avec typage fort des JSONB
interface LogementTyped extends Omit<HousingRow, 'infos' | 'proprietaire' | 'location' | 'menage' | 'planning' | 'documents' | 'notes'> {
  infos?: InfosJSON;
  proprietaire?: ProprietaireJSON;
  location?: LocationJSON;
  menage?: MenageJSON;
  planning?: PlanningEvent[];
  documents?: DocumentItem[];
  notes?: string[];
}

export default function FicheLogementPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [logement, setLogement] = useState<LogementTyped | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("infos");

  useEffect(() => {
    async function fetchLogement() {
      try {
        const res = await fetch(`/api/housing/${id}`);
        if (!res.ok) {
          throw new Error("Logement introuvable");
        }
        const data: HousingRow = await res.json();
        
        // Cast des JSONB vers nos types (via unknown pour éviter les erreurs TypeScript)
        const typedData: LogementTyped = {
          ...data,
          infos: data.infos as unknown as InfosJSON | undefined,
          proprietaire: data.proprietaire as unknown as ProprietaireJSON | undefined,
          location: data.location as unknown as LocationJSON | undefined,
          menage: data.menage as unknown as MenageJSON | undefined,
          planning: data.planning as unknown as PlanningEvent[] | undefined,
          documents: data.documents as unknown as DocumentItem[] | undefined,
          notes: data.notes as unknown as string[] | undefined,
        };
        
        setLogement(typedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchLogement();
    }
  }, [id]);

  const tabs = [
    { id: "infos", label: "Infos générales", icon: FiHome },
    { id: "menage", label: "Ménage & préparation", icon: FiClipboard },
    { id: "planning", label: "Planning", icon: FiCalendar },
    { id: "docs", label: "Documents", icon: FiFileText },
    { id: "notes", label: "Notes internes", icon: FiMessageSquare }
  ];

  if (loading) {
    return (
      <div className={styles.ficheLogement}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  if (error || !logement) {
    return (
      <div className={styles.ficheLogement}>
        <div className={styles.error}>
          {error || "Logement introuvable"}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.ficheLogement}>

      {/* HEADER */}
      <div className={styles.header}>
        <h1>{logement.nom_logement}</h1>
        <p>{logement.adresse}, {logement.ville}</p>
      </div>

      {/* TABS NAVIGATION */}
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

      {/* TAB CONTENT */}
      <div className={styles.content}>
        {activeTab === "infos" && (
          <div className={styles.section}>
            <h2>Informations générales</h2>
            <div className={styles.infoGrid}>
              <p><strong>Nom :</strong> {logement.nom_logement}</p>
              <p><strong>Adresse :</strong> {logement.adresse}</p>
              <p><strong>Ville :</strong> {logement.ville}</p>
              <p><strong>Plateforme :</strong> {logement.plateforme || "Non renseignée"}</p>
              <p><strong>Statut :</strong> {logement.statut || "Non défini"}</p>
              {logement.infos?.digicode && (
                <p><strong>Digicode :</strong> {logement.infos.digicode}</p>
              )}
              {logement.infos?.categorie && (
                <p><strong>Catégorie :</strong> {logement.infos.categorie}</p>
              )}
            </div>

            <h3>Photos</h3>
            <div className={styles.photos}>
              {logement.photo_principale ? (
                <Image 
                  src={logement.photo_principale} 
                  width={200} 
                  height={140} 
                  alt="Photo logement" 
                />
              ) : (
                <Image 
                  src="/images/default-logement.png" 
                  width={200} 
                  height={140} 
                  alt="Photo par défaut" 
                />
              )}
            </div>
          </div>
        )}

        {activeTab === "menage" && (
          <div className={styles.section}>
            <h2>Ménage & Préparation</h2>
            {logement.menage ? (
              <ul>
                {logement.menage.temps && <li>Temps estimé : {logement.menage.temps}</li>}
                {logement.menage.checklist && <li>Check-list : {logement.menage.checklist}</li>}
                {logement.menage.instructions && <li>Instructions spéciales : {logement.menage.instructions}</li>}
              </ul>
            ) : (
              <p>Aucune information de ménage renseignée.</p>
            )}
          </div>
        )}

        {activeTab === "planning" && (
          <div className={styles.section}>
            <h2>Planning du logement</h2>
            {logement.planning && logement.planning.length > 0 ? (
              logement.planning.map((event, i) => (
                <div key={i} className={styles.event}>
                  <strong>{event.date}</strong> — {event.type}
                  {event.guest && <span> · {event.guest}</span>}
                  {event.agent && <span> · Agent : {event.agent}</span>}
                  {event.status && <em> ({event.status})</em>}
                </div>
              ))
            ) : (
              <p>Aucun événement planifié.</p>
            )}
          </div>
        )}

        {activeTab === "docs" && (
          <div className={styles.section}>
            <h2>Documents</h2>
            {logement.documents && logement.documents.length > 0 ? (
              <ul>
                {logement.documents.map((doc, i) => (
                  <li key={i}>
                    {doc.url ? (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        {doc.name}
                      </a>
                    ) : (
                      doc.name
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucun document disponible.</p>
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <div className={styles.section}>
            <h2>Notes internes</h2>
            {logement.notes && logement.notes.length > 0 ? (
              <ul>
                {logement.notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            ) : (
              <p>Aucune note interne.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}