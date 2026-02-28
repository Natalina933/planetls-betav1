"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
  buildLogementPatchPayload,
  buildEditableLogement,
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
  { id: "infos", label: "Infos generales", icon: FiHome },
  { id: "menage", label: "Ménage & préparation", icon: FiClipboard },
  { id: "planning", label: "Planning", icon: FiCalendar },
  { id: "docs", label: "Documents", icon: FiFileText },
  { id: "notes", label: "Notes internes", icon: FiMessageSquare },
  { id: "tarifs", label: "Tarifs & contrat", icon: FiFileText },
];

export default function FicheLogementPage() {
  const params = useParams();
  const id = params.id as string;

  const [logement, setLogement] = useState<LogementTyped | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<Partial<LogementTyped>>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>("infos");

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

    fetchLogement();
  }, [id]);

  useEffect(() => {
    if (!saveError && !saveSuccess) return;

    const timeout = window.setTimeout(() => {
      setSaveError(null);
      setSaveSuccess(null);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [saveError, saveSuccess]);

  const editableLogement = useMemo(() => {
    return buildEditableLogement(logement, editedData);
  }, [logement, editedData]);
  const hasPendingChanges = useMemo(() => {
    return hasPendingLogementChanges(editedData);
  }, [editedData]);

  function beginEdit() {
    setSaveError(null);
    setSaveSuccess(null);
    setEditedData({});
    setEditMode(true);
  }

  function cancelEdit() {
    if (hasPendingChanges && !window.confirm("Annuler les modifications non sauvegardees ?")) {
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

  return (
    <div className={styles.ficheLogement}>
      <div className={styles.header}>
        <h1>{editableLogement.nom_logement}</h1>
        <p>
          {editableLogement.adresse}, {editableLogement.ville}
        </p>

        {saveError ? <p className={styles.feedbackError}>{saveError}</p> : null}
        {saveSuccess ? <p className={styles.feedbackSuccess}>{saveSuccess}</p> : null}

        {!editMode ? (
          <button
            className={styles.editBtn}
            onClick={beginEdit}
          >
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
        {activeTab === "infos" && (
          <InfosTabSection
            editMode={editMode}
            logement={editableLogement}
            setEditedData={setEditedData}
          />
        )}

        {activeTab === "menage" && (
          <MenageTabSection
            editMode={editMode}
            logement={editableLogement}
            setEditedData={setEditedData}
          />
        )}

        {activeTab === "planning" && (
          <PlanningTabSection editMode={editMode} logement={editableLogement} />
        )}

        {activeTab === "docs" && (
          <DocumentsTabSection editMode={editMode} documents={editableLogement.documents} />
        )}

        {activeTab === "notes" && (
          <NotesTabSection
            editMode={editMode}
            logement={editableLogement}
            setEditedData={setEditedData}
          />
        )}

        {activeTab === "tarifs" && (
          <TarifsTabSection
            editMode={editMode}
            logement={editableLogement}
            setEditedData={setEditedData}
          />
        )}
      </div>
    </div>
  );
}
