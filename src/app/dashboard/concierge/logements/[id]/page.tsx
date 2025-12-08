"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    FiHome,
    FiClipboard,
    FiCalendar,
    FiFileText,
    FiMessageSquare,
} from "react-icons/fi";
import Image from "next/image";
import styles from "./FicheLogement.module.scss";
import { Database } from "@/types/supabase";

// Types JSONB
interface InfosJSON {
    digicode?: string;
    categorie?: string;
    superficie?: string;
    nb_chambres?: number;
}

interface ProprietaireJSON {
    nom?: string;
    telephone?: string;
    email?: string;
}

interface LocationJSON {
    prix_nuit?: number;
    caution?: number;
    frais_menage?: number;
}

interface MenageJSON {
    temps?: string;
    checklist?: string;
    instructions?: string;
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

interface TarifsJSON {
    prix_base?: number;
    prix_par_nuit?: number;
    caution?: number;
    frais_menage?: number;
}

interface ContratJSON {
    date_signature?: string;
    renouvellement_auto?: boolean;
    fichier_pdf?: string;
}

// Type principal
type HousingRow = Database["public"]["Tables"]["housing"]["Row"];

interface LogementTyped
    extends Omit<
        HousingRow,
        | "infos"
        | "proprietaire"
        | "location"
        | "menage"
        | "planning"
        | "documents"
        | "notes"
        | "tarifs"
        | "contrat"
    > {
    infos?: InfosJSON;
    proprietaire?: ProprietaireJSON;
    location?: LocationJSON;
    menage?: MenageJSON;
    planning?: PlanningEvent[];
    documents?: DocumentItem[];
    notes?: string[];
    tarifs?: TarifsJSON;
    contrat?: ContratJSON;
}

// -------------------------------------------------------------

export default function FicheLogementPage() {
    const params = useParams();
    const id = params.id as string;

    const [logement, setLogement] = useState<LogementTyped | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Mode édition global
    const [editMode, setEditMode] = useState(false);
    const [editedData, setEditedData] = useState<Partial<LogementTyped>>({});

    // Onglet actif
    const [activeTab, setActiveTab] = useState("infos");

    const tabs = [
        { id: "infos", label: "Infos générales", icon: FiHome },
        { id: "menage", label: "Ménage & préparation", icon: FiClipboard },
        { id: "planning", label: "Planning", icon: FiCalendar },
        { id: "docs", label: "Documents", icon: FiFileText },
        { id: "notes", label: "Notes internes", icon: FiMessageSquare },
        { id: "tarifs", label: "Tarifs & Contrat", icon: FiFileText },
    ];

    // -------------------------------------------------------------
    // Charger le logement
    // -------------------------------------------------------------

    useEffect(() => {
        async function fetchLogement() {
            try {
                const res = await fetch(`/api/housing/${id}`);
                if (!res.ok) throw new Error("Logement introuvable");

                const data: HousingRow = await res.json();

                const typedData: LogementTyped = {
                    ...data,
                    infos: data.infos as unknown as InfosJSON,
                    proprietaire: data.proprietaire as unknown as ProprietaireJSON,
                    location: data.location as unknown as LocationJSON,
                    menage: data.menage as unknown as MenageJSON,
                    planning: data.planning as unknown as PlanningEvent[],
                    documents: data.documents as unknown as DocumentItem[],
                    notes: data.notes as unknown as string[],
                    tarifs: data.tarifs as unknown as TarifsJSON,
                    contrat: data.contrat as unknown as ContratJSON,
                };


                setLogement(typedData);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erreur inconnue");
            } finally {
                setLoading(false);
            }
        }

        fetchLogement();
    }, [id]);

    // -------------------------------------------------------------
    // Sauvegarde API
    // -------------------------------------------------------------

    async function saveChanges() {
        const res = await fetch(`/api/housing/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editedData),
        });

        if (!res.ok) {
            alert("Erreur en sauvegardant");
            return;
        }

        setEditMode(false);
        window.location.reload();
    }

    // -------------------------------------------------------------

    if (loading) return <div className={styles.loading}>Chargement...</div>;
    if (error || !logement)
        return <div className={styles.error}>{error || "Erreur"}</div>;

    return (
        <div className={styles.ficheLogement}>
            {/* Header */}
            <div className={styles.header}>
                <h1>{logement.nom_logement}</h1>
                <p>
                    {logement.adresse}, {logement.ville}
                </p>

                {!editMode ? (
                    <button
                        className={styles.editBtn}
                        onClick={() => {
                            setEditedData(logement);
                            setEditMode(true);
                        }}
                    >
                        Modifier
                    </button>
                ) : (
                    <button className={styles.saveBtn} onClick={saveChanges}>
                        Sauvegarder
                    </button>
                )}
            </div>

            {/* Onglets */}
            <div className={styles.tabs}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`${styles.tab} ${activeTab === tab.id ? styles.active : ""
                            }`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Contenu */}
            <div className={styles.content}>
                {/* ---------------- INFOS ---------------- */}
                {activeTab === "infos" && (
                    <div>
                        <h2>Informations générales</h2>

                        {!editMode ? (
                            <ul>
                                <li>Nom : {logement.nom_logement}</li>
                                <li>Adresse : {logement.adresse}</li>
                                <li>Ville : {logement.ville}</li>
                                <li>
                                    Plateforme : {logement.plateforme || "—"}
                                </li>
                                <li>Statut : {logement.statut}</li>
                            </ul>
                        ) : (
                            <div className={styles.formGrid}>
                                <input
                                    value={logement.ville ?? ""}
                                    onChange={(e) => setLogement({ ...logement, ville: e.target.value })}
                                />


                                <input
                                    value={logement.ville ?? ""}
                                    onChange={(e) => setLogement({ ...logement, ville: e.target.value })}
                                />


                                <input
                                    value={logement.ville ?? ""}
                                    onChange={(e) => setLogement({ ...logement, ville: e.target.value })}
                                />

                            </div>
                        )}

                        <h3>Photo principale</h3>

                        {logement.photo_principale ? (
                            <Image
                                src={logement.photo_principale}
                                width={240}
                                height={160}
                                alt="Photo logement"
                            />
                        ) : (
                            <Image
                                src="/images/default-logement.png"
                                width={240}
                                height={160}
                                alt="Défaut"
                            />
                        )}

                        {editMode && (
                            <input
                                value={logement.ville ?? ""}
                                onChange={(e) => setLogement({ ...logement, ville: e.target.value })}
                            />

                        )}
                    </div>
                )}

                {/* ---------------- MENAGE ---------------- */}
                {activeTab === "menage" && (
                    <div>
                        <h2>Ménage</h2>

                        {!editMode ? (
                            <ul>
                                <li>
                                    Temps :{" "}
                                    {logement.menage?.temps || "Non défini"}
                                </li>
                                <li>
                                    Checklist :{" "}
                                    {logement.menage?.checklist || "—"}
                                </li>
                                <li>
                                    Instructions :{" "}
                                    {logement.menage?.instructions || "—"}
                                </li>
                            </ul>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    defaultValue={logement.menage?.temps}
                                    onChange={(e) =>
                                        setEditedData((p) => ({
                                            ...p,
                                            menage: {
                                                ...p.menage,
                                                temps: e.target.value,
                                            },
                                        }))
                                    }
                                />

                                <textarea
                                    defaultValue={logement.menage?.checklist}
                                    onChange={(e) =>
                                        setEditedData((p) => ({
                                            ...p,
                                            menage: {
                                                ...p.menage,
                                                checklist: e.target.value,
                                            },
                                        }))
                                    }
                                />

                                <textarea
                                    defaultValue={
                                        logement.menage?.instructions
                                    }
                                    onChange={(e) =>
                                        setEditedData((p) => ({
                                            ...p,
                                            menage: {
                                                ...p.menage,
                                                instructions: e.target.value,
                                            },
                                        }))
                                    }
                                />
                            </>
                        )}
                    </div>
                )}

                {/* ---------------- PLANNING ---------------- */}
                {activeTab === "planning" && (
                    <div>
                        <h2>Planning</h2>

                        {logement.planning?.length ? (
                            logement.planning.map((ev, i) => (
                                <div key={i}>
                                    <strong>{ev.date}</strong> — {ev.type}
                                </div>
                            ))
                        ) : (
                            <p>Aucun événement</p>
                        )}

                        {editMode && (
                            <p>
                                ➜ L’édition du planning nécessite un module
                                dédié (je peux te le créer).
                            </p>
                        )}
                    </div>
                )}

                {/* ---------------- DOCUMENTS ---------------- */}
                {activeTab === "docs" && (
                    <div>
                        <h2>Documents</h2>

                        {!logement.documents?.length ? (
                            <p>Aucun document</p>
                        ) : (
                            logement.documents.map((doc, i) => (
                                <li key={i}>
                                    {doc.url ? (
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {doc.name}
                                        </a>
                                    ) : (
                                        doc.name
                                    )}
                                </li>
                            ))
                        )}

                        {editMode && (
                            <p>
                                ➜ L’upload de documents nécessite un module
                                (je peux te le coder également).
                            </p>
                        )}
                    </div>
                )}

                {/* ---------------- NOTES ---------------- */}
                {activeTab === "notes" && (
                    <div>
                        <h2>Notes internes</h2>

                        {!editMode ? (
                            logement.notes?.length ? (
                                logement.notes.map((n, i) => (
                                    <li key={i}>{n}</li>
                                ))
                            ) : (
                                <p>Aucune note</p>
                            )
                        ) : (
                            <textarea
                                defaultValue={logement.notes?.join("\n")}
                                onChange={(e) =>
                                    setEditedData((p) => ({
                                        ...p,
                                        notes: e.target.value.split("\n"),
                                    }))
                                }
                            />
                        )}
                    </div>
                )}

                {/* ---------------- TARIFS & CONTRAT ---------------- */}
                {activeTab === "tarifs" && (
                    <div>
                        <h2>Tarifs & Contrat</h2>

                        {/* TARIFS */}
                        <h3>Tarifs</h3>

                        {!editMode ? (
                            <ul>
                                <li>
                                    Prix de base :{" "}
                                    {logement.tarifs?.prix_base || "—"} €
                                </li>
                                <li>
                                    Prix / nuit :{" "}
                                    {logement.tarifs?.prix_par_nuit || "—"} €
                                </li>
                                <li>
                                    Caution : {logement.tarifs?.caution || "—"} €
                                </li>
                                <li>
                                    Frais ménage :{" "}
                                    {logement.tarifs?.frais_menage || "—"} €
                                </li>
                            </ul>
                        ) : (
                            <div className={styles.formGrid}>
                                <input
                                    type="number"
                                    defaultValue={logement.tarifs?.prix_base}
                                    onChange={(e) =>
                                        setEditedData((p) => ({
                                            ...p,
                                            tarifs: {
                                                ...p.tarifs,
                                                prix_base: Number(
                                                    e.target.value
                                                ),
                                            },
                                        }))
                                    }
                                />

                                <input
                                    type="number"
                                    defaultValue={
                                        logement.tarifs?.prix_par_nuit
                                    }
                                    onChange={(e) =>
                                        setEditedData((p) => ({
                                            ...p,
                                            tarifs: {
                                                ...p.tarifs,
                                                prix_par_nuit: Number(
                                                    e.target.value
                                                ),
                                            },
                                        }))
                                    }
                                />

                                <input
                                    type="number"
                                    defaultValue={logement.tarifs?.caution}
                                    onChange={(e) =>
                                        setEditedData((p) => ({
                                            ...p,
                                            tarifs: {
                                                ...p.tarifs,
                                                caution: Number(
                                                    e.target.value
                                                ),
                                            },
                                        }))
                                    }
                                />

                                <input
                                    type="number"
                                    defaultValue={
                                        logement.tarifs?.frais_menage
                                    }
                                    onChange={(e) =>
                                        setEditedData((p) => ({
                                            ...p,
                                            tarifs: {
                                                ...p.tarifs,
                                                frais_menage: Number(
                                                    e.target.value
                                                ),
                                            },
                                        }))
                                    }
                                />
                            </div>
                        )}

                        {/* CONTRAT */}
                        <h3>Contrat</h3>

                        {!editMode ? (
                            <ul>
                                <li>
                                    Date signature :{" "}
                                    {logement.contrat?.date_signature ||
                                        "—"}
                                </li>
                                <li>
                                    Renouvellement automatique :{" "}
                                    {logement.contrat?.renouvellement_auto
                                        ? "Oui"
                                        : "Non"}
                                </li>
                                {logement.contrat?.fichier_pdf && (
                                    <li>
                                        <a
                                            href={
                                                logement.contrat.fichier_pdf
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Télécharger le contrat
                                        </a>
                                    </li>
                                )}
                            </ul>
                        ) : (
                            <>
                                <input
                                    type="date"
                                    defaultValue={
                                        logement.contrat?.date_signature
                                    }
                                    onChange={(e) =>
                                        setEditedData((p) => ({
                                            ...p,
                                            contrat: {
                                                ...p.contrat,
                                                date_signature:
                                                    e.target.value,
                                            },
                                        }))
                                    }
                                />

                                <label>
                                    <input
                                        type="checkbox"
                                        defaultChecked={
                                            logement.contrat
                                                ?.renouvellement_auto
                                        }
                                        onChange={(e) =>
                                            setEditedData((p) => ({
                                                ...p,
                                                contrat: {
                                                    ...p.contrat,
                                                    renouvellement_auto:
                                                        e.target.checked,
                                                },
                                            }))
                                        }
                                    />
                                    Renouvellement automatique
                                </label>

                                <input
                                    type="text"
                                    placeholder="URL fichier PDF"
                                    defaultValue={
                                        logement.contrat?.fichier_pdf
                                    }
                                    onChange={(e) =>
                                        setEditedData((p) => ({
                                            ...p,
                                            contrat: {
                                                ...p.contrat,
                                                fichier_pdf:
                                                    e.target.value,
                                            },
                                        }))
                                    }
                                />
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
