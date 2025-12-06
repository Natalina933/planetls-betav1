"use client";

import React, { useState } from "react";
import { FiHome, FiClipboard, FiCalendar, FiFileText, FiMessageSquare } from "react-icons/fi";
import Image from "next/image";
import styles from "./FicheLogement.module.scss";

export default function FicheLogement() {
  const [activeTab, setActiveTab] = useState("infos");

  const logement = {
    id: 1,
    name: "Appartement Haussmannien – Etoile",
    address: "42 Avenue Carnot, 75017 Paris",
    city: "Paris",
    category: "Appartement Luxe",
    digicode: "A472B - Porte 3B",
    photos: ["/images/default-logement.jpg"],
    notes: ["Attention parquet fragile dans le salon.", "Ne pas fermer la fenêtre de la cuisine (verrou cassé)."],
    planning: [
      { date: "2025-02-15", type: "Arrivée", guest: "Famille Dupont", status: "check-in 16h" },
      { date: "2025-02-16", type: "Ménage", agent: "Sophie", status: "à faire" }
    ],
    documents: [
      { name: "Mode d’emploi Lave-linge", file: "mode_emploi_lavelinge.pdf" },
      { name: "Plan de l’appartement", file: "plan_appartement.pdf" }
    ]
  };

  const tabs = [
    { id: "infos", label: "Infos générales", icon: FiHome },
    { id: "menage", label: "Ménage & préparation", icon: FiClipboard },
    { id: "planning", label: "Planning", icon: FiCalendar },
    { id: "docs", label: "Documents", icon: FiFileText },
    { id: "notes", label: "Notes internes", icon: FiMessageSquare }
  ];

  return (
    <div className={styles.ficheLogement}>

      {/* HEADER */}
      <div className={styles.header}>
        <h1>{logement.name}</h1>
        <p>{logement.address}</p>
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
              <p><strong>Nom :</strong> {logement.name}</p>
              <p><strong>Adresse :</strong> {logement.address}</p>
              <p><strong>Catégorie :</strong> {logement.category}</p>
              <p><strong>Digicode :</strong> {logement.digicode}</p>
            </div>

            <h3>Photos</h3>
            <div className={styles.photos}>
              {logement.photos.map((src, i) => (
                <Image key={i} src={src} width={200} height={140} alt="Photo logement" />
              ))}
            </div>
          </div>
        )}

        {activeTab === "menage" && (
          <div className={styles.section}>
            <h2>Ménage & Préparation</h2>
            <ul>
              <li>Temps estimé : 1h30</li>
              <li>Check-list : Draps, Serviettes, Sols, Salle de bain, Cuisine</li>
              <li>Instructions spéciales : Parquet fragile + Vérifier stores salon</li>
            </ul>
          </div>
        )}

        {activeTab === "planning" && (
          <div className={styles.section}>
            <h2>Planning du logement</h2>
            {logement.planning.map((event, i) => (
              <div key={i} className={styles.event}>
                <strong>{event.date}</strong> — {event.type}
                {event.guest && <span> · {event.guest}</span>}
                {event.agent && <span> · Agent : {event.agent}</span>}
                <em> ({event.status})</em>
              </div>
            ))}
          </div>
        )}

        {activeTab === "docs" && (
          <div className={styles.section}>
            <h2>Documents</h2>
            <ul>
              {logement.documents.map((doc, i) => (
                <li key={i}>{doc.name}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "notes" && (
          <div className={styles.section}>
            <h2>Notes internes</h2>
            <ul>
              {logement.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
