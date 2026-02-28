"use client";

import Image from "next/image";
import React from "react";
import styles from "./FicheLogement.module.scss";
import {
  DocumentItem,
  LogementTyped,
  formatMoney,
  toOptionalNumber,
} from "./logementHelpers";

interface TabSectionProps {
  editMode: boolean;
  logement: LogementTyped;
  setEditedData: React.Dispatch<React.SetStateAction<Partial<LogementTyped>>>;
}

interface DocumentsTabSectionProps {
  editMode: boolean;
  documents?: DocumentItem[];
}

export function InfosTabSection({
  editMode,
  logement,
  setEditedData,
}: TabSectionProps) {
  return (
    <div>
      <h2>Informations generales</h2>

      {!editMode ? (
        <ul>
          <li>Nom : {logement.nom_logement}</li>
          <li>Adresse : {logement.adresse}</li>
          <li>Ville : {logement.ville}</li>
          <li>Type : {logement.infos?.categorie || "-"}</li>
          <li>Capacite : {logement.infos?.capacite ?? "-"}</li>
          <li>Chambres : {logement.infos?.nb_chambres ?? "-"}</li>
          <li>Plateforme : {logement.plateforme || "-"}</li>
          <li>Statut : {logement.statut}</li>
          <li>Description : {logement.infos?.description || "-"}</li>
          <li>
            Equipements :{" "}
            {Array.isArray(logement.infos?.equipements) && logement.infos.equipements.length > 0
              ? logement.infos.equipements.join(", ")
              : "-"}
          </li>
        </ul>
      ) : (
        <div className={styles.formGrid}>
          <input
            value={logement.nom_logement ?? ""}
            onChange={(e) =>
              setEditedData((prev) => ({ ...prev, nom_logement: e.target.value }))
            }
            placeholder="Nom du logement"
          />
          <input
            value={logement.adresse ?? ""}
            onChange={(e) => setEditedData((prev) => ({ ...prev, adresse: e.target.value }))}
            placeholder="Adresse"
          />
          <input
            value={logement.ville ?? ""}
            onChange={(e) => setEditedData((prev) => ({ ...prev, ville: e.target.value }))}
            placeholder="Ville"
          />
          <input
            value={logement.infos?.categorie ?? ""}
            onChange={(e) =>
              setEditedData((prev) => ({
                ...prev,
                infos: { ...prev.infos, categorie: e.target.value },
              }))
            }
            placeholder="Type de bien"
          />
          <input
            type="number"
            value={logement.infos?.capacite ?? ""}
            onChange={(e) =>
              setEditedData((prev) => ({
                ...prev,
                infos: { ...prev.infos, capacite: toOptionalNumber(e.target.value) },
              }))
            }
            placeholder="Capacite"
          />
          <input
            type="number"
            value={logement.infos?.nb_chambres ?? ""}
            onChange={(e) =>
              setEditedData((prev) => ({
                ...prev,
                infos: { ...prev.infos, nb_chambres: toOptionalNumber(e.target.value) },
              }))
            }
            placeholder="Nombre de chambres"
          />
          <input
            value={logement.plateforme ?? ""}
            onChange={(e) => setEditedData((prev) => ({ ...prev, plateforme: e.target.value }))}
            placeholder="Plateforme"
          />
          <textarea
            value={logement.infos?.description ?? ""}
            onChange={(e) =>
              setEditedData((prev) => ({
                ...prev,
                infos: { ...prev.infos, description: e.target.value },
              }))
            }
            placeholder="Description du logement"
          />
          <input
            value={Array.isArray(logement.infos?.equipements) ? logement.infos.equipements.join(", ") : ""}
            onChange={(e) =>
              setEditedData((prev) => ({
                ...prev,
                infos: {
                  ...prev.infos,
                  equipements: e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                },
              }))
            }
            placeholder="Wifi, Climatisation, Parking"
          />
        </div>
      )}

      <h3>Photo principale</h3>
      <Image
        src={logement.photo_principale || "/images/default-logement.png"}
        width={240}
        height={160}
        alt="Photo logement"
      />

      {editMode && (
        <input
          value={logement.photo_principale ?? ""}
          onChange={(e) =>
            setEditedData((prev) => ({ ...prev, photo_principale: e.target.value }))
          }
          placeholder="URL photo principale"
        />
      )}
    </div>
  );
}

export function MenageTabSection({
  editMode,
  logement,
  setEditedData,
}: TabSectionProps) {
  return (
    <div>
      <h2>Menage</h2>

      {!editMode ? (
        <ul>
          <li>Temps : {logement.menage?.temps || "Non defini"}</li>
          <li>Checklist : {logement.menage?.checklist || "-"}</li>
          <li>Instructions : {logement.menage?.instructions || "-"}</li>
        </ul>
      ) : (
        <>
          <input
            type="text"
            value={logement.menage?.temps ?? ""}
            onChange={(e) =>
              setEditedData((prev) => ({
                ...prev,
                menage: { ...prev.menage, temps: e.target.value },
              }))
            }
          />
          <textarea
            value={logement.menage?.checklist ?? ""}
            onChange={(e) =>
              setEditedData((prev) => ({
                ...prev,
                menage: { ...prev.menage, checklist: e.target.value },
              }))
            }
          />
          <textarea
            value={logement.menage?.instructions ?? ""}
            onChange={(e) =>
              setEditedData((prev) => ({
                ...prev,
                menage: { ...prev.menage, instructions: e.target.value },
              }))
            }
          />
        </>
      )}
    </div>
  );
}

export function PlanningTabSection({
  editMode,
  logement,
}: Omit<TabSectionProps, "setEditedData">) {
  return (
    <div>
      <h2>Planning</h2>

      {logement.planning?.length ? (
        logement.planning.map((event, index) => (
          <div key={`${event.date}-${index}`}>
            <strong>{event.date}</strong> - {event.type}
          </div>
        ))
      ) : (
        <p>Aucun evenement</p>
      )}

      {editMode && <p>L'edition du planning necessite un module dedie.</p>}
    </div>
  );
}

export function DocumentsTabSection({
  editMode,
  documents,
}: DocumentsTabSectionProps) {
  return (
    <div>
      <h2>Documents</h2>

      {!documents?.length ? (
        <p>Aucun document</p>
      ) : (
        <ul>
          {documents.map((doc, index) => (
            <li key={`${doc.name}-${index}`}>
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

      {editMode && <p>L'upload de documents necessite un module dedie.</p>}
    </div>
  );
}

export function NotesTabSection({
  editMode,
  logement,
  setEditedData,
}: TabSectionProps) {
  return (
    <div>
      <h2>Notes internes</h2>

      {!editMode ? (
        logement.notes?.length ? (
          <ul>
            {logement.notes.map((note, index) => (
              <li key={`${note}-${index}`}>{note}</li>
            ))}
          </ul>
        ) : (
          <p>Aucune note</p>
        )
      ) : (
        <textarea
          value={logement.notes?.join("\n") ?? ""}
          onChange={(e) =>
            setEditedData((prev) => ({
              ...prev,
              notes: e.target.value.split("\n"),
            }))
          }
        />
      )}
    </div>
  );
}

export function TarifsTabSection({
  editMode,
  logement,
  setEditedData,
}: TabSectionProps) {
  return (
    <div>
      <h2>Tarifs & Contrat</h2>

      <h3>Tarifs</h3>
      {!editMode ? (
        <ul>
          <li>Prix de base : {formatMoney(logement.tarifs?.prix_base)}</li>
          <li>Prix / nuit : {formatMoney(logement.tarifs?.prix_par_nuit)}</li>
          <li>Caution : {formatMoney(logement.tarifs?.caution)}</li>
          <li>Frais menage : {formatMoney(logement.tarifs?.frais_menage)}</li>
        </ul>
      ) : (
        <div className={styles.formGrid}>
          <input
            type="number"
            value={logement.tarifs?.prix_base ?? ""}
            onChange={(e) =>
              setEditedData((prev) => ({
                ...prev,
                tarifs: { ...prev.tarifs, prix_base: toOptionalNumber(e.target.value) },
              }))
            }
          />
          <input
            type="number"
            value={logement.tarifs?.prix_par_nuit ?? ""}
            onChange={(e) =>
              setEditedData((prev) => ({
                ...prev,
                tarifs: { ...prev.tarifs, prix_par_nuit: toOptionalNumber(e.target.value) },
              }))
            }
          />
          <input
            type="number"
            value={logement.tarifs?.caution ?? ""}
            onChange={(e) =>
              setEditedData((prev) => ({
                ...prev,
                tarifs: { ...prev.tarifs, caution: toOptionalNumber(e.target.value) },
              }))
            }
          />
          <input
            type="number"
            value={logement.tarifs?.frais_menage ?? ""}
            onChange={(e) =>
              setEditedData((prev) => ({
                ...prev,
                tarifs: { ...prev.tarifs, frais_menage: toOptionalNumber(e.target.value) },
              }))
            }
          />
        </div>
      )}

      <h3>Contrat</h3>
      {!editMode ? (
        <ul>
          <li>Date signature : {logement.contrat?.date_signature || "-"}</li>
          <li>
            Renouvellement automatique : {logement.contrat?.renouvellement_auto ? "Oui" : "Non"}
          </li>
          {logement.contrat?.fichier_pdf && (
            <li>
              <a href={logement.contrat.fichier_pdf} target="_blank" rel="noreferrer">
                Telecharger le contrat
              </a>
            </li>
          )}
        </ul>
      ) : (
        <>
          <input
            type="date"
            value={logement.contrat?.date_signature ?? ""}
            onChange={(e) =>
              setEditedData((prev) => ({
                ...prev,
                contrat: { ...prev.contrat, date_signature: e.target.value },
              }))
            }
          />
          <label>
            <input
              type="checkbox"
              checked={Boolean(logement.contrat?.renouvellement_auto)}
              onChange={(e) =>
                setEditedData((prev) => ({
                  ...prev,
                  contrat: {
                    ...prev.contrat,
                    renouvellement_auto: e.target.checked,
                  },
                }))
              }
            />
            Renouvellement automatique
          </label>
          <input
            type="text"
            value={logement.contrat?.fichier_pdf ?? ""}
            placeholder="URL fichier PDF"
            onChange={(e) =>
              setEditedData((prev) => ({
                ...prev,
                contrat: { ...prev.contrat, fichier_pdf: e.target.value },
              }))
            }
          />
        </>
      )}
    </div>
  );
}
