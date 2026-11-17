"use client";

import { useEffect, useRef, useState } from "react";
import { subfeatureCatalog } from "./subfeatureCatalog";
import { normalizeSubfeatureSearch, resetSubfeatureSearch, searchSubfeatures } from "./subfeatureSearch";
import type { SubfeatureSearchCriteria } from "./subfeatureSearch";
import { spaceInventory, SPACE_INVENTORY_LABELS } from "./spaceInventory";
import { SUBFEATURE_SPACES } from "./subfeatureTypes";
import type { Subfeature } from "./subfeatureTypes";
import type { DevelopmentRegistryItem } from "./masterPlan";
import { SubfeatureDetail, IMPLEMENTATION_LABELS, VALIDATION_LABELS } from "./SubfeatureDetail";
import styles from "./page.module.scss";
import { SpaceProgress } from "./SpaceProgress";
import type { SpaceProgressResult } from "./spaceProgressData";

const HASH_PREFIX = "#subfeature-";

function SelectFilter({ label, value, onChange, options, disabled = false, allowAll = true }: {
  label: string; value: string; onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  disabled?: boolean;
  allowAll?: boolean;
}) {
  return <label>{label}<select value={value} disabled={disabled} onChange={event => onChange(event.target.value)}>
    {allowAll ? <option value="">Tous</option> : null}
    {options.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}
  </select></label>;
}

export function SubfeatureExplorer({ parents, items = subfeatureCatalog, progress, active = true, spaceRequest = null, onOpenFeature }: {
  parents: readonly DevelopmentRegistryItem[]; items?: readonly Subfeature[]; progress?: SpaceProgressResult;
  active?: boolean; spaceRequest?: { name: string } | null; onOpenFeature?: () => void;
}) {
  const [filters, setFilters] = useState(resetSubfeatureSearch);
  const [selectedId, setSelectedId] = useState("");
  const [category, setCategory] = useState("technical");
  const [page, setPage] = useState(1);
  const detailRef = useRef<HTMLDivElement>(null);
  const explorerTitleRef = useRef<HTMLHeadingElement>(null);
  const lastFocusedSpaceRequest = useRef<{ name: string } | null>(null);
  const activeInventory = spaceInventory.find(inventory => inventory.name === filters.primarySpace);
  const selected = items.find(item => item.id === selectedId);
  const technical = searchSubfeatures(items, filters);
  const query = normalizeSubfeatureSearch(filters.query);
  const documentary = parents.filter(parent =>
    (!query || normalizeSubfeatureSearch(`${parent.id} ${parent.title} ${parent.summary}`).includes(query)) &&
    (!filters.parent || parent.id === filters.parent) &&
    (!filters.primarySpace || parent.spaceTracking?.primarySpace === filters.primarySpace) &&
    (!filters.relatedSpace || parent.spaceTracking?.relatedSpaces.includes(filters.relatedSpace))
  ).sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
  const total = category === "technical" ? technical.length : documentary.length;
  const lastPage = Math.max(1, Math.ceil(total / 10));
  const currentPage = Math.min(page, lastPage);
  const start = (currentPage - 1) * 10;
  const visibleTechnical = technical.slice(start, start + 10);
  const visibleDocumentary = documentary.slice(start, start + 10);
  const changeCategory = (value: string) => { setCategory(value); setPage(1); };
  const update = <K extends keyof SubfeatureSearchCriteria>(key: K, value: SubfeatureSearchCriteria[K]) => {
    setFilters(previous => ({ ...previous, [key]: value })); setPage(1);
  };
  const spaces = SUBFEATURE_SPACES.map(space => ({ value: space, label: space }));
  const selectSpace = (space: string) => {
    update("primarySpace", space as SubfeatureSearchCriteria["primarySpace"]);
    explorerTitleRef.current?.focus();
  };

  useEffect(() => {
    const readHash = () => {
      if (!window.location.hash.startsWith(HASH_PREFIX)) { setSelectedId(""); return; }
      try { setSelectedId(decodeURIComponent(window.location.hash.slice(HASH_PREFIX.length))); }
      catch { setSelectedId("Identifiant mal encodé"); }
      changeCategory("technical");
      onOpenFeature?.();
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, [onOpenFeature]);

  useEffect(() => {
    if (!active || !selectedId || category !== "technical") return;
    const panel = detailRef.current;
    const disclosure = panel?.querySelector("details");
    if (disclosure) disclosure.open = true;
    panel?.focus();
  }, [selectedId, category, active]);

  useEffect(() => {
    if (!spaceRequest) return;
    setFilters(previous => ({ ...previous, primarySpace: spaceRequest.name as SubfeatureSearchCriteria["primarySpace"] }));
    setPage(1);
  }, [spaceRequest]);

  useEffect(() => {
    if (!active || !spaceRequest || lastFocusedSpaceRequest.current === spaceRequest) return;
    explorerTitleRef.current?.focus();
    lastFocusedSpaceRequest.current = spaceRequest;
  }, [active, spaceRequest]);

  return <>
    {progress ? <SpaceProgress spaces={progress.items} covered={progress.covered} excluded={progress.excluded}
      totalRegistryItems={progress.totalRegistryItems} selectedSpace={filters.primarySpace} onSpaceSelect={selectSpace} /> : null}
    <section className={`${styles.spaceProgressDetail} ${styles.subfeatureSection} ${styles.subfeatureExplorer}`} aria-labelledby="subfeature-explorer-title">
    <h2 id="subfeature-explorer-title" ref={explorerTitleRef} tabIndex={-1}>Explorateur global des fonctionnalités</h2>
    <p role="status">Espace responsable : {filters.primarySpace || "Tous les espaces"}</p>
    <button type="button" onClick={() => update("primarySpace", "")}>Tous les espaces</button>
    <p>Deux référentiels distincts : les fiches techniques inventoriées et les entrées documentaires du Master Plan. Une entrée documentaire n’est pas une fonctionnalité technique validée.</p>
    <p id="explorer-filter-scope">La recherche porte sur le nom ou titre, l’identifiant et la description des deux catégories. Espace responsable, autres espaces concernés et parent filtrent les deux catégories. Pour une entrée documentaire, le parent sélectionné correspond à son propre identifiant. Implémentation, validation et présence de preuves filtrent uniquement les fiches techniques.</p>
    <p>Les preuves peuvent être historiques ou à résultat inconnu : leur présence ne signifie pas une validation actuelle. Aucun nouveau pourcentage n’est calculé.</p>
    <fieldset className={styles.subfeatureFilters} aria-describedby="explorer-filter-scope">
      <legend>Rechercher dans les deux référentiels</legend>
      <SelectFilter label="Catégorie de résultats" value={category} allowAll={false} options={[{ value: "technical", label: "Fiches techniques inventoriées" }, { value: "documentary", label: "Entrées documentaires du Master Plan" }]} onChange={changeCategory} />
      <label>Recherche globale par nom, identifiant ou description
        <input type="search" value={filters.query} onChange={event => update("query", event.target.value)} />
      </label>
      <SelectFilter label="Espace responsable" value={filters.primarySpace} options={spaces} onChange={value => update("primarySpace", value as SubfeatureSearchCriteria["primarySpace"])} />
      <SelectFilter label="Autres espaces concernés" value={filters.relatedSpace} options={spaces} onChange={value => update("relatedSpace", value as SubfeatureSearchCriteria["relatedSpace"])} />
      <SelectFilter label="Parent canonique" value={filters.parent} options={parents.map(parent => ({ value: parent.id, label: `${parent.id} — ${parent.title}` }))} onChange={value => update("parent", value)} />
      <SelectFilter label="Implémentation — fiches techniques" value={filters.implementation} disabled={category !== "technical"} options={Object.entries(IMPLEMENTATION_LABELS).map(([value, label]) => ({ value, label }))} onChange={value => update("implementation", value as SubfeatureSearchCriteria["implementation"])} />
      <SelectFilter label="Validation — fiches techniques" value={filters.validation} disabled={category !== "technical"} options={Object.entries(VALIDATION_LABELS).map(([value, label]) => ({ value, label }))} onChange={value => update("validation", value as SubfeatureSearchCriteria["validation"])} />
      <SelectFilter label="Présence de preuves — fiches techniques" value={filters.evidence} disabled={category !== "technical"} options={[{ value: "with", label: "Avec preuves renseignées" }, { value: "without", label: "Sans preuve renseignée" }]} onChange={value => update("evidence", value as SubfeatureSearchCriteria["evidence"])} />
      <button type="button" onClick={() => { setFilters(resetSubfeatureSearch()); setPage(1); }}>Réinitialiser les filtres</button>
    </fieldset>

    <section aria-labelledby="explorer-inventory-title">
      <h3 id="explorer-inventory-title">État d’inventaire des six espaces</h3>
      <ul className={styles.spaceProgressDetailList}>
        {spaceInventory.map(inventory => <li key={inventory.id} data-inventory-space={inventory.id}>
          <details className={styles.subfeatureDisclosure}>
            <summary>{inventory.name} — {SPACE_INVENTORY_LABELS[inventory.state]}</summary>
            <p>{inventory.scope}</p>
            <p>{inventory.source} · {inventory.assessedAt ? <time dateTime={inventory.assessedAt}>{inventory.assessedAt}</time> : "Date inconnue"}</p>
            <ul>{[...inventory.limitations, ...inventory.unknowns].map((text, index) => <li key={index}>{text}</li>)}</ul>
          </details>
        </li>)}
      </ul>
    </section>

    <nav className={styles.explorerPagination} aria-label="Pagination des résultats">
      <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Précédent</button>
      <p role="status" aria-live="polite" aria-atomic="true">{total ? start + 1 : 0}–{Math.min(start + 10, total)} sur {total}</p>
      <button type="button" disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>Suivant</button>
    </nav>
    {category === "technical" ? <section aria-labelledby="explorer-technical-title">
      <h3 id="explorer-technical-title">A. Sous-fonctionnalités techniques inventoriées</h3>
      <p role="status" aria-live="polite" aria-atomic="true">{technical.length} fiche(s) technique(s) trouvée(s) sur {items.length} disponibles dans le catalogue.</p>
      <p>Ce nombre décrit les fiches inventoriées, pas le nombre total de fonctionnalités de PlanetLS.</p>
      {activeInventory?.state === "absent" ? <p>Inventaire détaillé non réalisé pour {activeInventory.name}. <button type="button" onClick={() => changeCategory("documentary")}>Consulter les entrées documentaires de cet espace</button></p> : null}
      {technical.length ? <ul className={styles.spaceProgressDetailList} aria-label="Résultats techniques">
        {visibleTechnical.map(item => <li key={item.id} data-technical-result={item.id}>
          <h4>{item.id} — {item.name}</h4>
          <p>Responsable : {item.primarySpace}</p>
          <p>Implémentation : {IMPLEMENTATION_LABELS[item.implementation.state]} · Validation : {VALIDATION_LABELS[item.validation.state]}</p>
          <a href={`${HASH_PREFIX}${encodeURIComponent(item.id)}`} onClick={() => setSelectedId(item.id)}>Voir la fiche {item.id}</a>
        </li>)}
      </ul> : <p>Aucune fiche technique inventoriée ne correspond aux critères. Cela ne signifie pas qu’aucune fonctionnalité n’existe dans cet espace.</p>}
    </section> : null}

    {category === "technical" && selectedId ? <div id={`subfeature-${selectedId}`} ref={detailRef} tabIndex={-1} className={styles.explorerDetail} aria-labelledby="explorer-detail-title">
      <h3 id="explorer-detail-title">{selected ? `Fiche technique — ${selected.id}` : "Fiche technique inconnue"}</h3>
      {selected ? <>
        {!technical.some(item => item.id === selected.id) ? <p>Cette fiche est ouverte par son identifiant stable et se trouve hors des résultats filtrés.</p> : null}
        <ul className={styles.spaceProgressDetailList}><SubfeatureDetail item={selected} parent={parents.find(parent => parent.id === selected.parentMasterPlanId)} /></ul>
      </> : <p role="status">Aucune fiche technique ne correspond à l’identifiant « {selectedId} ». Utilisez les résultats de recherche pour ouvrir une fiche connue.</p>}
    </div> : null}

    {category === "documentary" ? <section aria-labelledby="explorer-documentary-title">
      <h3 id="explorer-documentary-title">B. Entrées documentaires du Master Plan</h3>
      <p role="status" aria-live="polite" aria-atomic="true">{documentary.length} entrée(s) documentaire(s) trouvée(s) sur {parents.length}.</p>
      <p>Les filtres techniques n’affectent pas cette liste. Les statuts et priorités ci-dessous restent exclusivement documentaires, y compris les idées P4.</p>
      {documentary.length ? <ul className={styles.spaceProgressDetailList} aria-label="Résultats documentaires">
        {visibleDocumentary.map(parent => <li key={parent.id} data-documentary-result={parent.id}>
          <h4>{parent.id} — {parent.title}</h4>
          <p>Espace responsable : {parent.spaceTracking?.primarySpace ?? "Non renseigné"}</p>
          <p>Statut documentaire : {parent.statusLabel}</p>
          <details className={styles.subfeatureDisclosure}>
            <summary>Consulter les informations documentaires de {parent.id}</summary>
            <p>{parent.summary}</p>
            <p>Priorité documentaire : {parent.priorityLabel}</p>
            <p>Prochaine action : {parent.nextAction || "Non renseignée dans le registre."}</p>
            <p>Autres espaces concernés : {parent.spaceTracking?.relatedSpaces.join(", ") || "Non renseignés"}</p>
            <h5>Preuves documentaires</h5>
            <ul>{parent.evidence.map((value, index) => <li key={index}>{value}</li>)}</ul>
            <h5>Critères documentaires</h5>
            <ul>{parent.validationCriteria.map((value, index) => <li key={index}>{value}</li>)}</ul>
            <h5>Routes et fichiers</h5>
            <ul>{[...parent.routes, ...parent.files].map((value, index) => <li key={index}>{value}</li>)}</ul>
            <h5>Travaux restants</h5>
            {parent.missingWork.length ? <ul>{parent.missingWork.map((value, index) => <li key={index}>{value}</li>)}</ul> : <p>Non renseignés dans cette entrée ; aucune complétude déduite.</p>}
          </details>
        </li>)}
      </ul> : <p>Aucune entrée documentaire ne correspond à la recherche et aux filtres d’espace ou de parent.</p>}
    </section> : null}
  </section>
  </>;
}
