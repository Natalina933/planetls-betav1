import type { Subfeature } from "./subfeatureTypes";
import type { DevelopmentRegistryItem } from "./masterPlan";
import styles from "./page.module.scss";

export const IMPLEMENTATION_LABELS = {
  not_assessed: "Non évalué", not_started: "Non commencé",
  partial: "Partiellement implémenté", implemented: "Implémenté",
} as const;
export const VALIDATION_LABELS = {
  not_assessed: "Non évaluée", not_validated: "Non validée",
  partially_validated: "Partiellement validée", validated: "Validée avec preuves",
} as const;
const RESULT_LABELS = {
  unknown: "Résultat inconnu", not_run: "Non exécuté", passed: "Réussi",
  failed: "Échec", mixed: "Résultat mixte",
} as const;
const CRITERION_LABELS = {
  not_assessed: "Non évalué", unverified: "Non vérifié", passed: "Satisfait", failed: "Non satisfait",
} as const;

function DateValue({ value }: { value: string | null }) {
  return value ? <time dateTime={value}>{value}</time> : <>Date inconnue</>;
}

function TextList({ values, empty }: { values: readonly string[]; empty: string }) {
  return values.length ? <ul>{values.map((value, index) => <li key={index}>{value}</li>)}</ul> : <p>{empty}</p>;
}

/** Rendu commun sans registre, filtre, mutation ni calcul de progression. */
export function SubfeatureDetail({ item, parent }: {
  item: Subfeature;
  parent?: Pick<DevelopmentRegistryItem, "title" | "priority">;
}) {
  return (
    <li data-subfeature-id={item.id}>
      <h4>{item.id} — {item.name}</h4>
      <p><strong>Parent du Master Plan : </strong>{item.parentMasterPlanId}{parent ? ` — ${parent.title}` : " — Libellé inconnu"}</p>
      <div className={styles.subfeatureStates}>
        <span>Implémentation : {IMPLEMENTATION_LABELS[item.implementation.state]}</span>
        <span>Validation : {VALIDATION_LABELS[item.validation.state]}</span>
        {item.recordType === "scope_to_qualify" ? <span>Périmètre à qualifier</span> : null}
        {parent?.priority === "P4" ? <span>P4 — exclue de la progression documentaire</span> : null}
      </div>
      {!parent ? <p>Priorité documentaire inconnue : parent non fourni.</p> : null}
      <p><strong>Prochaine action : </strong>{item.nextAction}</p>
      <details className={styles.subfeatureDisclosure}>
        <summary>Consulter les détails de {item.id}</summary>
        <p>{item.description}</p>
        <p><strong>Espace responsable : </strong>{item.primarySpace}</p>
        <p><strong>Espaces concernés (hors comptage) : </strong>{item.relatedSpaces.join(", ") || "Aucun espace renseigné"}</p>
        <p><strong>Évaluation : </strong>{item.assessment.source} · <DateValue value={item.assessment.assessedAt} /> · {item.assessment.assessedCommit ?? "Commit inconnu"}</p>
        <p><strong>Justification de l’implémentation : </strong>{item.implementation.rationale}</p>
        <h5>Routes associées</h5>
        <TextList values={item.routes} empty="Aucune route renseignée." />
        <h5>Fichiers associés</h5>
        <TextList values={item.files} empty="Aucun fichier renseigné." />
        <h5>Périmètre de validation</h5>
        <TextList values={item.validation.targetScope} empty="Périmètre non renseigné." />
        <h5>Critères de validation</h5>
        {item.validation.criteria.length ? <ul>{item.validation.criteria.map(criterion => <li key={criterion.id}>
          {criterion.id} — {criterion.description} · {CRITERION_LABELS[criterion.state]}
          <p>Références de preuves : {criterion.evidenceIds.join(", ") || "Aucune preuve référencée"}</p>
        </li>)}</ul> : <p>Aucun critère défini ; aucune validation complète établie.</p>}
        <h5>Preuves disponibles</h5>
        {item.evidence.length ? item.evidence.map(proof => <div className={styles.subfeatureEvidence} key={proof.id}>
          <p><strong>{proof.id} — {proof.description}</strong></p>
          <p>Provenance : {proof.provenance === "historical_report" ? "Rapport historique — ne vaut pas validation actuelle" : "Observation directe — portée limitée au périmètre indiqué"}</p>
          <p>Source : {proof.source}</p>
          <p>Résultat : {RESULT_LABELS[proof.result]}</p>
          <p>Date d’observation : <DateValue value={proof.observedAt} /> · Date d’exécution : <DateValue value={proof.executedAt} /></p>
          <p>Commit : {proof.commit ?? "Commit inconnu"} · Environnement : {proof.environment ?? "Environnement inconnu"}</p>
          <p><strong>Portée de la preuve</strong></p>
          <TextList values={proof.scope} empty="Portée non renseignée." />
          <p><strong>Limites de la preuve</strong></p>
          <TextList values={proof.limitations} empty="Aucune limite renseignée ; cela ne prouve pas une couverture complète." />
        </div>) : <p>Aucune preuve renseignée.</p>}
        <h5>Limites de validation</h5>
        <TextList values={item.validation.limitations} empty="Aucune limite renseignée." />
        <h5>Travaux restants</h5>
        <TextList values={item.remainingWork} empty="Travaux restants non renseignés." />
        <h5>Inconnues identifiées</h5>
        <TextList values={item.unknowns} empty="Aucune inconnue renseignée ; aucune complétude présumée." />
        <h5>Dépendances — références uniquement</h5>
        <TextList values={item.dependencies} empty="Aucune dépendance référencée." />
      </details>
    </li>
  );
}
