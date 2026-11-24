"use client";

import { LayoutList, AlertTriangle } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui";
import type { SpaceProgressItem } from "./spaceProgressData";
import styles from "./page.module.scss";
import { spaceInventory, SPACE_INVENTORY_LABELS } from "./spaceInventory";

type SpaceProgressProps = {
  spaces: SpaceProgressItem[];
  covered: number;
  excluded: number;
  totalRegistryItems: number;
  selectedSpace?: string;
  onSpaceSelect?: (space: string) => void;
};

const COUNTERS = [
  ["completed", "Terminées"],
  ["inProgress", "En cours"],
  ["toVerify", "À vérifier"],
  ["blocked", "Bloquées"],
  ["remaining", "Restantes"],
] as const;

function statusLabel(space: SpaceProgressItem) {
  if (space.percentage === null) return "Non évalué";
  return `${space.percentage} %`;
}

function inventoryLabel(name: string) {
  const inventory = spaceInventory.find(inventory => inventory.name === name);
  return inventory ? SPACE_INVENTORY_LABELS[inventory.state] : "Inventaire non renseigné";
}

function progressBar(percentage: number | null) {
  if (percentage === null) return null;
  const width = percentage;
  return (
    <div className={styles.spaceProgressTrack} role="progressbar" aria-label="Progression déclarée"
      aria-valuenow={width} aria-valuemin={0} aria-valuemax={100}>
      <span
        className={styles.spaceProgressFill}
        style={{ width: `${width}%` }}
        aria-hidden="true"
      />
    </div>
  );
}

export function SpaceProgress({ spaces, covered, excluded, totalRegistryItems, selectedSpace = "", onSpaceSelect }: SpaceProgressProps) {
  const ordered = [...spaces].sort((left, right) => {
    const li = SPACE_INDEX[left.name] ?? 99;
    const ri = SPACE_INDEX[right.name] ?? 99;
    return li - ri;
  });

  const totalCompleted = ordered.reduce((sum, s) => sum + s.completed, 0);
  const totalItems = ordered.reduce((sum, s) => sum + s.total, 0);
  const totalToVerify = ordered.reduce((sum, s) => sum + s.toVerify, 0);
  const totalBlocked = ordered.reduce((sum, s) => sum + s.blocked, 0);
  const totals = {
    completed: totalCompleted,
    inProgress: ordered.reduce((sum, space) => sum + space.inProgress, 0),
    toVerify: totalToVerify,
    blocked: totalBlocked,
    remaining: ordered.reduce((sum, space) => sum + space.remaining, 0),
  };
  const globalPercentage = totalItems === 0 ? null : Math.round((totalCompleted / totalItems) * 100);


  return (
    <section className={styles.spaceProgressSection} aria-label="Progression par espace métier">
      <section className={styles.spaceRegistrySummary} aria-labelledby="registry-summary-title">
        <h2 id="registry-summary-title">Chantiers documentaires clôturés</h2>
        <p>Cet indicateur mesure les chantiers déclarés terminés dans le Master Plan. Il ne représente pas le pourcentage de fonctionnalités développées.</p>
        <p>{covered} / {totalRegistryItems} entrées couvertes · {excluded} entrées P4 exclues</p>
        <dl className={styles.spaceRegistryStats}>
          {COUNTERS.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{totals[key]}</dd></div>)}
        </dl>
      </section>
      <div className={styles.spaceProgressHeader}>
        <h2 className={styles.spaceProgressTitle}>
          <LayoutList size={16} className={styles.spaceProgressIcon} aria-hidden="true" />
          Chantiers documentaires par espace — hors P4
        </h2>
        <p className={styles.spaceProgressMeta}>
          {covered} / {totalRegistryItems} entrées du registre couvertes
          {excluded > 0 ? ` · ${excluded} entr${excluded === 1 ? "ée" : "ées"} P4 exclue${excluded > 1 ? "s" : ""}` : ""}
        </p>
        {globalPercentage !== null ? <p className={styles.spaceProgressMeta}>
          {totalCompleted} / {totalItems} entrées déclarées terminées ({globalPercentage} %), hors P4
        </p> : null}
      </div>

      <div className={styles.spaceProgressGrid}>
        {ordered.map((space) => (
          <Card key={space.name} className={`${styles.spaceProgressCard} ${selectedSpace === space.name ? styles.spaceProgressCardSelected : ""}`}>
            <CardHeader className={styles.spaceProgressCardHeader}>
              <button type="button" className={styles.spaceProgressCardHeaderRow}
                aria-pressed={selectedSpace === space.name} aria-controls="subfeature-explorer-title"
                aria-label={`Explorer l’espace : ${space.name}`} onClick={() => onSpaceSelect?.(space.name)}>
                <strong className={styles.spaceProgressCardName}>{space.name}</strong>
                <span>Explorer cet espace</span>
                <span className={styles.spaceProgressCardPct}>
                  {statusLabel(space)}
                </span>
              </button>
            </CardHeader>
            <CardBody className={styles.spaceProgressCardBody}>
              {progressBar(space.percentage)}
              <p>{inventoryLabel(space.name)}</p>
              <p>État d’inventaire du catalogue technique, distinct de la progression documentaire et de la validation des fonctionnalités.</p>
              <details className={styles.subfeatureDisclosure}>
              <summary>Voir la répartition — {space.name}</summary>
              <dl className={styles.spaceProgressCounts}>
                {COUNTERS.map(([key, label]) => (
                  <div key={key} className={styles.spaceProgressCount}><dt>{label}</dt><dd>{space[key]}</dd></div>
                ))}
              </dl>
              <p className={styles.spaceProgressDomains}>
                <strong>Domaines inclus : </strong>{space.domains.length > 0 ? space.domains.join(", ") : "Aucun domaine retenu"}
              </p>
              </details>
            </CardBody>
          </Card>
        ))}
      </div>

      <p className={styles.spaceProgressNote}>
        <AlertTriangle size={14} className={styles.spaceProgressNoteIcon} aria-hidden="true" />
        Ces barres reflètent les statuts documentaires du Master Plan (registre
        structuré du développement), et non une validation fonctionnelle complète
        du site. Les entrées P4 sont exclues du calcul. « En cours » correspond au statut
        IN_PROGRESS ; « À vérifier » à TO_VERIFY et « Bloquées » à BLOCKED.
        « Restantes » regroupe les autres statuts, sans les assimiler à du retard. Chaque entrée est comptée une seule fois, dans la catégorie de
        son espace responsable défini dans le Master Plan. Les espaces concernés sont
        informatifs et ne contribuent pas à leurs pourcentages. Ces pourcentages ne mesurent pas le développement réel.
      </p>
      {ordered.some(space => space.compatibilityEntryIds.length > 0) ? <p role="status">
        Compatibilité par domaine (métadonnées absentes ; consulter les diagnostics du registre en cas de métadonnées rejetées) : {ordered.flatMap(space => space.compatibilityEntryIds).join(", ")}.
      </p> : null}

    </section>
  );
}

const SPACE_INDEX: Record<string, number> = {
  "Conciergerie": 0,
  "Propriétaires": 1,
  "Artisans / Prestataires": 2,
  "Administration": 3,
  "Sécurité et infrastructure": 4,
  "Transversal": 5,
};
