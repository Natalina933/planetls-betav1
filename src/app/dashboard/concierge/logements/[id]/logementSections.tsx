"use client";

import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import styles from "./FicheLogement.module.scss";
import type {
  DocumentItem,
  LogementTyped,
  PlanningEvent,
} from "./logementHelpers";

type EditedData = Partial<LogementTyped>;

type TabSectionProps = {
  editMode: boolean;
  logement: LogementTyped;
  setEditedData: Dispatch<SetStateAction<EditedData>>;
};

type DocumentsTabSectionProps = {
  editMode: boolean;
  documents?: DocumentItem[];
};

function updateField(
  setEditedData: Dispatch<SetStateAction<EditedData>>,
  field: keyof LogementTyped,
  value: LogementTyped[keyof LogementTyped],
) {
  setEditedData((prev) => ({ ...prev, [field]: value }));
}

export function InfosTabSection({ editMode, logement, setEditedData }: TabSectionProps) {
  const infos = logement.infos ?? {};

  const handleInfosChange =
    (field: keyof typeof infos) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setEditedData((prev) => ({
        ...prev,
        infos: {
          ...(prev.infos ?? logement.infos ?? {}),
          [field]: event.target.value,
        },
      }));
    };

  return (
    <div className={styles.sectionStack}>
      <label>
        <span>Type de bien</span>
        <input
          value={infos.categorie ?? ""}
          onChange={handleInfosChange("categorie")}
          disabled={!editMode}
          placeholder="Type de bien"
        />
      </label>
      <label>
        <span>Capacite</span>
        <input
          value={infos.capacite ?? ""}
          onChange={handleInfosChange("capacite")}
          disabled={!editMode}
          placeholder="Capacite"
        />
      </label>
      <label>
        <span>Nombre de chambres</span>
        <input
          value={infos.nb_chambres ?? ""}
          onChange={handleInfosChange("nb_chambres")}
          disabled={!editMode}
          placeholder="Nombre de chambres"
        />
      </label>
      <label>
        <span>Description</span>
        <textarea
          value={infos.description ?? ""}
          onChange={handleInfosChange("description")}
          disabled={!editMode}
          placeholder="Description du logement"
        />
      </label>
    </div>
  );
}

export function MenageTabSection({ editMode, logement, setEditedData }: TabSectionProps) {
  const menage = logement.menage ?? {};

  const handleMenageChange =
    (field: keyof typeof menage) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setEditedData((prev) => ({
        ...prev,
        menage: {
          ...(prev.menage ?? logement.menage ?? {}),
          [field]: event.target.value,
        },
      }));
    };

  return (
    <div className={styles.sectionStack}>
      <label>
        <span>Temps estime</span>
        <input
          value={menage.temps ?? ""}
          onChange={handleMenageChange("temps")}
          disabled={!editMode}
          placeholder="Temps de ménage"
        />
      </label>
      <label>
        <span>Checklist</span>
        <textarea
          value={menage.checklist ?? ""}
          onChange={handleMenageChange("checklist")}
          disabled={!editMode}
          placeholder="Checklist"
        />
      </label>
      <label>
        <span>Instructions</span>
        <textarea
          value={menage.instructions ?? ""}
          onChange={handleMenageChange("instructions")}
          disabled={!editMode}
          placeholder="Instructions de ménage"
        />
      </label>
    </div>
  );
}

export function PlanningTabSection({
  editMode,
  logement,
}: Omit<TabSectionProps, "setEditedData">) {
  const planning = (logement.planning ?? []) as PlanningEvent[];

  return (
    <div>
      <h2>Planning</h2>

      {planning.length ? (
        planning.map((event, index) => (
          <div key={`${event.date}-${index}`}>
            <strong>{event.date}</strong> - {event.type}
          </div>
        ))
      ) : (
        <p>Aucun evenement</p>
      )}

      {editMode && <p>L&apos;edition du planning necessite un module dedie.</p>}
    </div>
  );
}

export function DocumentsTabSection({ editMode, documents }: DocumentsTabSectionProps) {
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

      {editMode && <p>L&apos;upload de documents necessite un module dedie.</p>}
    </div>
  );
}

export function NotesTabSection({ editMode, logement, setEditedData }: TabSectionProps) {
  return (
    <div>
      <h2>Notes internes</h2>
      <textarea
        value={Array.isArray(logement.notes) ? logement.notes.join("\n") : ""}
        onChange={(event) =>
          updateField(
            setEditedData,
            "notes",
            event.target.value
              .split("\n")
              .map((note) => note.trim())
              .filter(Boolean),
          )
        }
        disabled={!editMode}
        placeholder="Notes internes"
      />
    </div>
  );
}

export function TarifsTabSection({ editMode, logement, setEditedData }: TabSectionProps) {
  const tarifs = logement.tarifs ?? {};
  const contrat = logement.contrat ?? {};

  const handleTarifChange =
    (field: keyof typeof tarifs) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value.trim();
      setEditedData((prev) => ({
        ...prev,
        tarifs: {
          ...(prev.tarifs ?? logement.tarifs ?? {}),
          [field]: value === "" ? undefined : Number(value),
        },
      }));
    };

  const handleContratChange =
    (field: keyof typeof contrat) => (event: ChangeEvent<HTMLInputElement>) => {
      const value =
        event.target.type === "checkbox" ? event.target.checked : event.target.value;

      setEditedData((prev) => ({
        ...prev,
        contrat: {
          ...(prev.contrat ?? logement.contrat ?? {}),
          [field]: value,
        },
      }));
    };

  return (
    <div className={styles.sectionStack}>
      <label>
        <span>Prix de base</span>
        <input
          type="number"
          value={tarifs.prix_base ?? ""}
          onChange={handleTarifChange("prix_base")}
          disabled={!editMode}
          placeholder="Prix de base"
        />
      </label>
      <label>
        <span>Prix par nuit</span>
        <input
          type="number"
          value={tarifs.prix_par_nuit ?? ""}
          onChange={handleTarifChange("prix_par_nuit")}
          disabled={!editMode}
          placeholder="Prix par nuit"
        />
      </label>
      <label>
        <span>Caution</span>
        <input
          type="number"
          value={tarifs.caution ?? ""}
          onChange={handleTarifChange("caution")}
          disabled={!editMode}
          placeholder="Caution"
        />
      </label>
      <label>
        <span>Frais de ménage</span>
        <input
          type="number"
          value={tarifs.frais_menage ?? ""}
          onChange={handleTarifChange("frais_menage")}
          disabled={!editMode}
          placeholder="Frais de ménage"
        />
      </label>
      <label>
        <span>Fichier contrat</span>
        <input
          value={contrat.fichier_pdf ?? ""}
          onChange={handleContratChange("fichier_pdf")}
          disabled={!editMode}
          placeholder="URL fichier PDF"
        />
      </label>
      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={Boolean(contrat.renouvellement_auto)}
          onChange={handleContratChange("renouvellement_auto")}
          disabled={!editMode}
        />
        <span>Renouvellement automatique</span>
      </label>
    </div>
  );
}
