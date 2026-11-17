"use client";

import { useState } from "react";
import { conciergeSubfeatures } from "./conciergeSubfeatures";
import type { ConciergeSubfeature } from "./conciergeSubfeatureTypes";
import type { DevelopmentRegistryItem } from "./masterPlan";
import styles from "./page.module.scss";
import { SubfeatureDetail, IMPLEMENTATION_LABELS, VALIDATION_LABELS } from "./SubfeatureDetail";

// Nom de fichier distinct du registre, y compris sur les systèmes insensibles à la casse.
export function ConciergeSubfeatures({ parents, items = conciergeSubfeatures }: {
  parents: readonly DevelopmentRegistryItem[];
  items?: readonly ConciergeSubfeature[];
}) {
  const [filters, setFilters] = useState({ query: "", parent: "", implementation: "", validation: "", space: "", evidence: "" });
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim();
  const query = normalize(filters.query);
  const visibleItems = items.filter(item =>
    (!query || normalize(`${item.id} ${item.name} ${item.description}`).includes(query)) &&
    (!filters.parent || item.parentMasterPlanId === filters.parent) &&
    (!filters.implementation || item.implementation.state === filters.implementation) &&
    (!filters.validation || item.validation.state === filters.validation) &&
    (!filters.space || item.relatedSpaces.some(space => space === filters.space)) &&
    (!filters.evidence || (filters.evidence === "with" ? item.evidence.length > 0 : item.evidence.length === 0))
  );
  const parentIds = [...new Set(items.map(item => item.parentMasterPlanId))].sort();
  const relatedSpaces = [...new Set(items.flatMap(item => item.relatedSpaces))].sort((a, b) => a.localeCompare(b, "fr"));
  const updateFilter = (key: keyof typeof filters, value: string) => setFilters(previous => ({ ...previous, [key]: value }));
  return (
    <section className={styles.subfeatureSection} aria-labelledby="concierge-subfeatures-title">
      <h3 id="concierge-subfeatures-title">Fonctionnalités — implémentation et validation</h3>
      <p>Les états ci-dessous qualifient un périmètre et ses preuves ; ils ne modifient pas la progression documentaire.</p>
      <p>Les évaluations issues de 05D sont historiques. Une preuve historique ne constitue pas une validation actuelle. « Non évalué » ne signifie pas un échec.</p>
      <fieldset className={styles.subfeatureFilters}>
        <legend>Rechercher et filtrer les sous-fonctionnalités</legend>
        <label>Recherche par nom, identifiant ou description
          <input type="search" value={filters.query} onChange={event => updateFilter("query", event.target.value)} />
        </label>
        <label>Parent du Master Plan
          <select value={filters.parent} onChange={event => updateFilter("parent", event.target.value)}>
            <option value="">Tous les parents</option>
            {parentIds.map(id => <option key={id} value={id}>{id}{parents.find(parent => parent.id === id)?.title ? ` — ${parents.find(parent => parent.id === id)!.title}` : ""}</option>)}
          </select>
        </label>
        <label>État d’implémentation
          <select value={filters.implementation} onChange={event => updateFilter("implementation", event.target.value)}>
            <option value="">Tous les états d’implémentation</option>
            {Object.entries(IMPLEMENTATION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>État de validation
          <select value={filters.validation} onChange={event => updateFilter("validation", event.target.value)}>
            <option value="">Tous les états de validation</option>
            {Object.entries(VALIDATION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>Espace concerné
          <select value={filters.space} onChange={event => updateFilter("space", event.target.value)}>
            <option value="">Tous les espaces concernés</option>
            {relatedSpaces.map(space => <option key={space} value={space}>{space}</option>)}
          </select>
        </label>
        <label>Présence de preuves
          <select value={filters.evidence} aria-describedby="subfeature-evidence-help" onChange={event => updateFilter("evidence", event.target.value)}>
            <option value="">Avec ou sans preuves</option>
            <option value="with">Avec preuves renseignées</option>
            <option value="without">Sans preuve renseignée</option>
          </select>
        </label>
        <button type="button" onClick={() => setFilters({ query: "", parent: "", implementation: "", validation: "", space: "", evidence: "" })}>Réinitialiser les filtres</button>
      </fieldset>
      <p id="subfeature-evidence-help">La présence de preuves inclut les rapports historiques, même si leur résultat est inconnu ; elle ne signifie pas une validation.</p>
      <p role="status" aria-live="polite" aria-atomic="true">{visibleItems.length} résultat(s) trouvé(s) sur {items.length} sous-fonctionnalités.</p>
      {visibleItems.length === 0 ? <p>Aucune sous-fonctionnalité ne correspond à votre recherche et aux filtres sélectionnés. Modifiez-les ou utilisez « Réinitialiser les filtres ».</p> : null}
      <ul className={styles.spaceProgressDetailList} aria-label="Sous-fonctionnalités Conciergerie">
        {visibleItems.map(item => <SubfeatureDetail key={item.id} item={item}
          parent={parents.find(parent => parent.id === item.parentMasterPlanId)} />)}
      </ul>
    </section>
  );
}
