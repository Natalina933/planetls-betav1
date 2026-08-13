"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CircleDashed, LayoutGrid, ListTree, Link2, Radar } from "lucide-react";
import {
  BUSINESS_PLAN_STATUS_LABELS,
  PLANETLS_BUSINESS_MODEL_CANVAS,
  type BusinessModelCanvasBlock,
} from "./business-plan-reference";
import styles from "./BusinessModelCanvas.module.scss";

type BusinessModelCanvasProps = {
  onNavigateToSection: (sectionId: string) => void;
};

type CanvasViewMode = "summary" | "detailed";

function getBlockCompleteness(block: BusinessModelCanvasBlock) {
  const weightedItems = [
    block.shortSummary.trim().length > 0,
    block.details.some((item) => item.trim().length > 0),
    block.hypotheses.length > 0,
    block.validationGaps.length > 0,
    block.relatedSections.length > 0,
  ];
  const completed = weightedItems.filter(Boolean).length;
  return Math.round((completed / weightedItems.length) * 100);
}

function getValidatedCount(block: BusinessModelCanvasBlock) {
  return block.hypotheses.filter((item) => item.status === "validated").length;
}

function getPendingCount(block: BusinessModelCanvasBlock) {
  return block.hypotheses.filter((item) => item.status !== "validated").length;
}

export function BusinessModelCanvas({ onNavigateToSection }: BusinessModelCanvasProps) {
  const [viewMode, setViewMode] = useState<CanvasViewMode>("summary");
  const [openBlockIds, setOpenBlockIds] = useState<string[]>([]);

  const canvasStats = useMemo(() => {
    const scores = PLANETLS_BUSINESS_MODEL_CANVAS.map(getBlockCompleteness);
    const averageCompleteness =
      scores.length > 0
        ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
        : 0;
    const validatedHypotheses = PLANETLS_BUSINESS_MODEL_CANVAS.reduce(
      (total, block) => total + getValidatedCount(block),
      0,
    );
    const pendingHypotheses = PLANETLS_BUSINESS_MODEL_CANVAS.reduce(
      (total, block) => total + getPendingCount(block),
      0,
    );

    return {
      averageCompleteness,
      validatedHypotheses,
      pendingHypotheses,
    };
  }, []);

  const allExpanded = viewMode === "detailed";

  function toggleBlock(blockId: string) {
    setOpenBlockIds((current) =>
      current.includes(blockId) ? current.filter((item) => item !== blockId) : [...current, blockId],
    );
  }

  return (
    <div className={styles.canvasShell}>
      <section className={styles.topPanel}>
        <div className={styles.topCopy}>
          <span className={styles.eyebrow}>Business Model Canvas PlanetLS</span>
          <h3>Comprendre le modele economique en moins de 2 minutes</h3>
          <p>
            Le canvas condense les 9 blocs du modele economique, met en evidence ce qui est deja
            exploitable, ce qui reste hypothese, et renvoie vers les sections du Business Plan a creuser.
          </p>
        </div>

        <div className={styles.modeSwitch} role="tablist" aria-label="Vue du Business Model Canvas">
          <button
            type="button"
            className={styles.modeButton}
            data-active={viewMode === "summary"}
            onClick={() => setViewMode("summary")}
          >
            <LayoutGrid size={16} />
            Vue synthetique
          </button>
          <button
            type="button"
            className={styles.modeButton}
            data-active={viewMode === "detailed"}
            onClick={() => setViewMode("detailed")}
          >
            <ListTree size={16} />
            Vue detaillee
          </button>
        </div>
      </section>

      <section className={styles.statsGrid}>
        <article className={styles.statCard}>
          <Radar size={18} />
          <span>Completude moyenne</span>
          <strong>{canvasStats.averageCompleteness}%</strong>
          <p>Score calcule selon la presence d'une synthese, details, hypotheses, validations et liens.</p>
        </article>
        <article className={styles.statCard}>
          <CheckCircle2 size={18} />
          <span>Hypotheses validees</span>
          <strong>{canvasStats.validatedHypotheses}</strong>
          <p>Hypotheses deja soutenues par une preuve de production, de gouvernance ou d'execution.</p>
        </article>
        <article className={styles.statCard}>
          <CircleDashed size={18} />
          <span>Hypotheses a valider</span>
          <strong>{canvasStats.pendingHypotheses}</strong>
          <p>Points encore a verifier avant de traiter le modele comme stabilise.</p>
        </article>
      </section>

      <section className={styles.blocksGrid}>
        {PLANETLS_BUSINESS_MODEL_CANVAS.map((block) => {
          const completeness = getBlockCompleteness(block);
          const validatedCount = getValidatedCount(block);
          const pendingCount = getPendingCount(block);
          const isOpen = allExpanded || openBlockIds.includes(block.id);

          return (
            <article key={block.id} className={styles.blockCard}>
              <div className={styles.blockHeader}>
                <div className={styles.blockHeading}>
                  <span className={styles.blockLabel}>{block.title}</span>
                  <strong>{block.shortSummary || "A definir"}</strong>
                </div>
                <div className={styles.blockMeta}>
                  <span className={styles.statusBadge}>
                    {BUSINESS_PLAN_STATUS_LABELS[block.status]}
                  </span>
                  <span className={styles.scoreBadge}>{completeness}% complet</span>
                </div>
              </div>

              <div className={styles.metricsRow}>
                <span>{validatedCount} hypothese(s) validee(s)</span>
                <span>{pendingCount} hypothese(s) a valider</span>
              </div>

              <div className={styles.summaryList}>
                <p>{block.details[0] ?? "A definir"}</p>
              </div>

              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.toggleButton}
                  onClick={() => toggleBlock(block.id)}
                  aria-expanded={isOpen}
                >
                  {isOpen ? "Masquer les details" : "Voir les details"}
                </button>
              </div>

              {isOpen ? (
                <div className={styles.expandedContent}>
                  <section className={styles.detailBlock}>
                    <span className={styles.detailTitle}>Details</span>
                    <ul className={styles.list}>
                      {block.details.length > 0 ? (
                        block.details.map((item) => <li key={item}>{item}</li>)
                      ) : (
                        <li>A definir</li>
                      )}
                    </ul>
                  </section>

                  <section className={styles.detailBlock}>
                    <span className={styles.detailTitle}>Hypotheses associees</span>
                    <ul className={styles.list}>
                      {block.hypotheses.length > 0 ? (
                        block.hypotheses.map((item) => (
                          <li key={item.label}>
                            <strong>{item.status === "validated" ? "Validee" : "Hypothese a valider"}</strong>
                            {" - "}
                            {item.label}
                          </li>
                        ))
                      ) : (
                        <li>Hypothese a valider</li>
                      )}
                    </ul>
                  </section>

                  <section className={styles.detailBlock}>
                    <span className={styles.detailTitle}>Ce qui reste a valider</span>
                    <ul className={styles.list}>
                      {block.validationGaps.length > 0 ? (
                        block.validationGaps.map((item) => <li key={item}>{item}</li>)
                      ) : (
                        <li>Hypothese a valider</li>
                      )}
                    </ul>
                  </section>

                  <section className={styles.detailBlock}>
                    <span className={styles.detailTitle}>Source et gouvernance</span>
                    <div className={styles.metaStack}>
                      <p>
                        <strong>Source :</strong> {block.source.label}
                      </p>
                      <p>
                        <strong>Propriétaire :</strong> {block.owner ?? "À définir"}
                      </p>
                    </div>
                  </section>

                  <section className={styles.detailBlock}>
                    <span className={styles.detailTitle}>Relier ce bloc au Business Plan</span>
                    <div className={styles.linkChips}>
                      {block.relatedSections.length > 0 ? (
                        block.relatedSections.map((item) => (
                          <button
                            key={`${block.id}-${item.id}`}
                            type="button"
                            className={styles.linkChip}
                            onClick={() => onNavigateToSection(item.id)}
                          >
                            <Link2 size={14} />
                            {item.label}
                          </button>
                        ))
                      ) : (
                        <span className={styles.emptyNote}>A definir</span>
                      )}
                    </div>
                  </section>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      <section className={styles.connectionPanel}>
        <div className={styles.connectionHeader}>
          <span className={styles.eyebrow}>Connexions</span>
          <strong>Relier le Canvas aux autres sections du Business Plan</strong>
          <p>
            Chaque bloc du Canvas n'est qu'une vue rapide. Les liens ci-dessous servent a ouvrir la
            section du cockpit ou la meme information est detaillee.
          </p>
        </div>

        <div className={styles.connectionGrid}>
          {PLANETLS_BUSINESS_MODEL_CANVAS.map((block) => (
            <article key={`connection-${block.id}`} className={styles.connectionCard}>
              <span>{block.title}</span>
              <div className={styles.linkChips}>
                {block.relatedSections.length > 0 ? (
                  block.relatedSections.map((item) => (
                    <button
                      key={`connection-${block.id}-${item.id}`}
                      type="button"
                      className={styles.linkChip}
                      onClick={() => onNavigateToSection(item.id)}
                    >
                      <Link2 size={14} />
                      {item.label}
                    </button>
                  ))
                ) : (
                  <span className={styles.emptyNote}>A definir</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
