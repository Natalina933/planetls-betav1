import { COHORTS, COVERAGE_LEVELS, SCOPES, VALIDATION_LEVELS, productPersonas } from "../../(product-tech)/developpement/personas/personas";
import { PersonaFlipCard } from "./PersonaFlipCard";
import { buildCoverageRows, type PersonaLot } from "./personaCoverage";
import styles from "./page.module.scss";

export function PersonasView({ lots, sourceAvailable }: { lots: PersonaLot[]; sourceAvailable: boolean }) {
  const rows = buildCoverageRows(productPersonas, lots);
  const linkedIds = new Set(rows.flatMap((row) => row.lots.map((lot) => lot.id)));
  const groups = Object.entries(COHORTS) as [keyof typeof COHORTS, string][];
  return (
    <div className={styles.page}>
      <section className={styles.intro} aria-labelledby="personas-summary">
        <p className={styles.eyebrow}>Revue du 5 septembre 2026</p>
        <h2 id="personas-summary">Qui servir, quelle valeur apporter, où agir</h2>
        <p>Un pilote proposé, des besoins à confirmer sur le terrain. Ouvrez une fiche pour consulter son parcours et ses lots PLS.</p>
        <div className={styles.stats}>{groups.map(([cohort, label]) => <p key={cohort}><strong>{productPersonas.filter((p) => p.cohort === cohort).length}</strong>{label}{cohort === "pilot" ? " (dont 1 interne)" : ""}</p>)}</div>
        <nav className={styles.links} aria-label="Sections Personas">{groups.map(([id, label]) => <a href={`#${id}`} key={id}>{label}</a>)}<a href="#coverage">Couverture produit</a><a href="#hypotheses">Hypothèses à valider</a></nav>
      </section>
      {groups.map(([cohort, label]) => <section id={cohort} key={cohort} aria-labelledby={`${cohort}-heading`}>
        <details className={styles.group} open={cohort === "pilot"}>
        <summary><h2 id={`${cohort}-heading`}>{label}</h2></summary>
        <div className={styles.grid}>{productPersonas.filter((p) => p.cohort === cohort).map((persona) => <PersonaFlipCard key={persona.id} persona={persona} />)}</div>
        </details>
      </section>)}
      <section id="coverage" aria-labelledby="coverage-heading">
        <h2 id="coverage-heading">Couverture produit</h2>
        {!sourceAvailable && <p role="status" className={styles.break}>Master Plan indisponible ou invalide : statuts des lots inconnus. Les appréciations documentaires restent affichées avec leur date.</p>}
        <details className={styles.fold}>
        <summary>Comparer les {rows.length} besoins et consulter leurs preuves</summary>
        <p>Chaque besoin est relié à une étape du parcours. La couverture déclarée ne change pas lorsqu’un lot change de statut. Un lot terminé peut ne couvrir qu’une partie du besoin.</p>
        <p><strong>Cœur produit cible :</strong> logement → besoin/séjour → responsable → mission → exécution → preuve → validation → paiement → historique.</p>
        <p>{Object.values(COVERAGE_LEVELS).join(" · ")}</p>
        <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="Couverture produit, tableau défilant">
          <table><caption>Persona → besoin → parcours → lot PLS → statut réel</caption><thead><tr><th scope="col">Persona</th><th scope="col">Besoin critique / parcours</th><th scope="col">Lot PLS</th><th scope="col">Statut du lot</th><th scope="col">Couverture du besoin</th></tr></thead>
            <tbody>{rows.map((row) => <tr id={`need-${row.personaId}-${row.need.id}`} key={`${row.personaId}-${row.need.id}`}>
              <th scope="row"><a href={`#persona-${row.personaId}`}>{row.personaName}</a></th>
              <td><strong>{row.need.label}</strong><p>{SCOPES[row.need.scope]} · {row.need.journeyStep}</p></td>
              <td>{row.lots.length ? row.lots.map(({ id, lot }) => <p key={id}><a href={`#lot-${id}`}>{id}</a>{!lot && " — référence indisponible"}</p>) : "Aucun lot dédié identifié"}</td>
              <td>{row.lots.length ? row.lots.map(({ id, lot }) => <p key={id}>{id} : {lot?.status ?? "⚪ Inconnu"}</p>) : "⚪ Inconnu"}</td>
              <td><strong>{COVERAGE_LEVELS[row.coverage]}</strong><details><summary>Justification documentaire</summary><p>{row.need.assessment?.note ?? "Aucune évaluation documentée."}</p>{row.need.assessment && <p>Source : {row.need.assessment.source}<br />Revue : {row.need.assessment.reviewedAt}</p>}</details></td>
            </tr>)}</tbody>
          </table>
        </div>
        <details className={styles.lots}><summary>Consulter les lots associés et leurs priorités actuelles</summary>
          <p>Les capacités CAP sont issues de la cartographie du Master Plan ; leur statut brut est conservé. Les autres lots proviennent du registre structuré.</p>
          {[...linkedIds].map((id) => { const lot = lots.find((item) => item.id === id); return <p id={`lot-${id}`} key={id}><strong>{id}</strong> — {lot ? `${lot.title} · ${lot.status} · ${lot.priority}` : "⚪ Inconnu — référence indisponible"}</p>; })}
          <a href="/dashboard/admin/developpement">Ouvrir le Master Plan dans Développement</a>
        </details>
        </details>
      </section>
      <section id="hypotheses" aria-labelledby="hypotheses-heading"><h2 id="hypotheses-heading">Hypothèses à valider</h2>
        <details className={styles.fold}><summary>Validation terrain et hypothèses commerciales</summary>
        <p>Documenter des entretiens et observations datés : contexte, fréquence, première valeur, parcours réellement exécuté et blocages. L’usage interne déclaré de Nathalie reste distinct d’une preuve terrain externe.</p>
        <p>Fréquences et niveaux numériques sont estimés. Aucun persona externe n’est validé terrain.</p>
        <div className={styles.grid}>{productPersonas.filter((p) => p.commercialHypothesis).map((p) => <div className={styles.panel} key={p.id}><h3>{p.name}</h3><p><strong>Hypothèse commerciale</strong> : {p.commercialHypothesis?.offer}</p><p>{p.commercialHypothesis?.potential}</p><p>Source : {p.commercialHypothesis?.source}<br />Date de validation : {p.commercialHypothesis?.date ?? "Non documentée"}<br />Statut : {VALIDATION_LEVELS.hypothesis}</p></div>)}</div>
        <p>Assistant éditorial, images déco, marketplace fournisseurs et PWA complète restent hors MVP. Les tournées et le vocal ne sont pas des prérequis de lancement ; leurs lots historiques sont encore en P2, sans changement de priorité dans cette revue.</p>
        </details>
      </section>
    </div>
  );
}
