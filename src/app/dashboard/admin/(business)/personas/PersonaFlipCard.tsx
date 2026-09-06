import Image from "next/image";
import {
  COLLABORATION_MODES, COVERAGE_LEVELS, DIGITAL_LEVELS, SCOPES, VALIDATION_LEVELS,
  getPersonaPlsIds, getValidationEvidence, type ProductPersona,
} from "../../(product-tech)/developpement/personas/personas";
import styles from "./page.module.scss";

/** Nom de fichier conservé ; fiche native dépliable, sans jauge de « maturité ». */
export function PersonaFlipCard({ persona }: { persona: ProductPersona }) {
  const lots = getPersonaPlsIds(persona);
  return (
    <article className={styles.persona} id={`persona-${persona.id}`}>
      <header className={styles.personaHeader}>
        {persona.image && <div className={styles.portrait}>
          <Image src={persona.image} alt={`Portrait illustratif de ${persona.name}`} fill sizes="(max-width: 480px) 96px, 128px" />
        </div>}
        <div>
        <p className={styles.eyebrow}>{SCOPES[persona.scope]} · {persona.role}</p>
        <h3>{persona.name}</h3>
        <p>{persona.segment}</p>
        <p>{VALIDATION_LEVELS[persona.validationLevel]}</p>
        </div>
      </header>
      <p><strong>Première valeur attendue</strong><br />{persona.firstValue}</p>
      <p className={styles.break}><strong>Rupture actuelle</strong><br />{persona.currentBreak}</p>
      <details>
        <summary>Voir la fiche de {persona.name}</summary>
        <dl className={styles.facts}>
          <dt>Situation réelle visée</dt><dd>{persona.context}</dd>
          <dt>Modes de collaboration envisagés</dt><dd>{persona.collaborationModes.map((mode) => COLLABORATION_MODES[mode]).join(" · ")}</dd>
          <dt>Niveau numérique estimé</dt><dd>{DIGITAL_LEVELS[persona.digitalLevel].label} — catégorie descriptive</dd>
          <dt>Fréquence d’usage estimée</dt><dd>{persona.estimatedFrequency}</dd>
          <dt>Besoins critiques</dt><dd><ul>{persona.needs.map((need) => <li key={need.id}><a href={`#need-${persona.id}-${need.id}`}>{need.label}</a> · {SCOPES[need.scope]}</li>)}</ul></dd>
          <dt>Parcours minimal cible</dt><dd><ol>{persona.mainJourney.map((step) => <li key={step}>{step}</li>)}</ol></dd>
          <dt>Lots PLS associés</dt><dd>{lots.length ? lots.map((id) => <a className={styles.lotLink} href={`#lot-${id}`} key={id}>{id}</a>) : "Aucun lot dédié identifié"}</dd>
          <dt>Couverture déclarée</dt><dd>{COVERAGE_LEVELS[persona.coverage]}</dd>
          <dt>Source / date de validation</dt><dd>{getValidationEvidence(persona)}</dd>
          <dt>Volontairement hors périmètre de lancement</dt><dd><ul>{persona.excludedFeatures.map((feature) => <li key={feature}>{feature}</li>)}</ul></dd>
        </dl>
      </details>
    </article>
  );
}
