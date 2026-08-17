"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui";
import { BusinessCollapsibleSection } from "../BusinessCollapsibleSection";
import { PERFORMANCE_RENTABILITY_PILOT } from "./data";
import type { PerformanceDataSource, PerformanceMonthlyStatus } from "./types";
import styles from "./PerformanceRentabilitySection.module.scss";

function sourceLabel(source: PerformanceDataSource) {
  if (source === "real") return "Donnée réelle";
  if (source === "estimated") return "Estimé";
  if (source === "future") return "Externe future";
  return "Démo";
}

function statusLabel(status: PerformanceMonthlyStatus) {
  if (status === "excellent") return "Excellent";
  if (status === "good") return "Bon";
  if (status === "watch") return "À surveiller";
  if (status === "opportunity") return "Opportunité";
  return "À améliorer";
}

function formatAmount(amount: number) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount)} EUR`;
}

export function PerformanceRentabilitySection() {
  const [openSections, setOpenSections] = useState({
    overview: true,
    monthly: true,
    profitability: false,
    simulator: false,
    calendar: false,
    recommendations: true,
  });

  const pilotModule = PERFORMANCE_RENTABILITY_PILOT;

  return (
    <div className={styles.panelStack}>
      <Card tone="soft" className={styles.introCard}>
        <CardBody className={styles.introCard}>
          <span className={styles.eyebrow}>Prototype owner prioritaire</span>
          <h3>{pilotModule.title}</h3>
          <p>
            Première brique de pilotage pour transformer PlanetLS en cockpit économique du logement.
            Cette version structure le sujet, clarifie les données et prépare la suite sans faire croire
            que le moteur final est déjà branché.
          </p>

          <div className={styles.metaGrid}>
            <article className={styles.metaCard}>
              <span className={styles.metaLabel}>Statut</span>
              <strong>{pilotModule.status.status}</strong>
              <p>{pilotModule.status.priority}</p>
            </article>
            <article className={styles.metaCard}>
              <span className={styles.metaLabel}>Persona principal</span>
              <strong>Propriétaire</strong>
              <p>Secondaires : {pilotModule.status.personas.slice(1).join(", ")}</p>
            </article>
            <article className={styles.metaCard}>
              <span className={styles.metaLabel}>Valeur business</span>
              <strong>{pilotModule.status.businessValue}</strong>
              <p>{pilotModule.status.monetizationHypothesis}</p>
            </article>
            <article className={styles.metaCard}>
              <span className={styles.metaLabel}>Données actuelles</span>
              <strong>Réel, estimé et démonstration séparés</strong>
              <p>Le pilote Barcarès est explicitement étiqueté comme démonstration UX.</p>
            </article>
          </div>

          <ul className={styles.valueChain}>
            {pilotModule.valueChain.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <BusinessCollapsibleSection
        id="performance-overview"
        eyebrow="Vue d'ensemble"
        title="KPI, objectif et potentiel annuel"
        summary="Lecture rapide du pilote avec séparation claire entre démo et estimé."
        badge={pilotModule.status.status}
        secondaryBadge={pilotModule.status.priority}
        isOpen={openSections.overview}
        onToggle={() => setOpenSections((current) => ({ ...current, overview: !current.overview }))}
      >
        <div className={styles.kpiGrid}>
          {pilotModule.kpis.map((item) => (
            <article key={item.label} className={styles.kpiCard}>
              <span className={styles.kpiSource}>{sourceLabel(item.source)}</span>
              <strong>{item.label}</strong>
              <span className={styles.kpiValue}>{item.value}</span>
              <p>{item.hint}</p>
            </article>
          ))}
        </div>
      </BusinessCollapsibleSection>

      <BusinessCollapsibleSection
        id="performance-monthly"
        eyebrow="Performance mensuelle"
        title="Lecture mois par mois"
        summary="Structure cible pour distinguer bon, opportunité, sous-performance et mois à protéger."
        badge="Table cible"
        secondaryBadge="Source mixte"
        isOpen={openSections.monthly}
        onToggle={() => setOpenSections((current) => ({ ...current, monthly: !current.monthly }))}
      >
        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Mois</th>
                <th>Occupation</th>
                <th>ADR</th>
                <th>CA brut</th>
                <th>Rentabilité</th>
                <th>Statut</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {pilotModule.monthlyRows.map((row) => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  <td>{row.occupancyRate} %</td>
                  <td>{formatAmount(row.adr)}</td>
                  <td>{formatAmount(row.grossRevenue)}</td>
                  <td>{formatAmount(row.netRevenue)}</td>
                  <td>
                    <span className={styles.tone} data-tone={row.status}>
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td>{sourceLabel(row.source)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BusinessCollapsibleSection>

      <BusinessCollapsibleSection
        id="performance-profitability"
        eyebrow="Rentabilité"
        title="Décomposition de la marge"
        summary="Le cockpit doit montrer ce qui reste après commissions et exploitation."
        badge="Net estimé"
        secondaryBadge={`${pilotModule.overview.marginRate} % marge`}
        isOpen={openSections.profitability}
        onToggle={() => setOpenSections((current) => ({ ...current, profitability: !current.profitability }))}
      >
        <div className={styles.sectionGrid}>
          <article className={styles.noteCard}>
            <span className={styles.tableHeading}>Lecture financière</span>
            <ul className={styles.list}>
              {pilotModule.profitabilityRows.map((row) => (
                <li key={row.label}>
                  {row.label} : {formatAmount(row.amount)} ({sourceLabel(row.source)})
                </li>
              ))}
            </ul>
          </article>
          <article className={styles.noteCard}>
            <span className={styles.tableHeading}>Dépendances avant données réelles</span>
            <ul className={styles.list}>
              {pilotModule.status.requiredData.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </BusinessCollapsibleSection>

      <BusinessCollapsibleSection
        id="performance-simulator"
        eyebrow="Simulateur Et si..."
        title="Scénarios comparés"
        summary="Le plus haut taux d'occupation n'est pas automatiquement le plus rentable."
        badge="Calcul pur"
        secondaryBadge="Démo pilotée"
        isOpen={openSections.simulator}
        onToggle={() => setOpenSections((current) => ({ ...current, simulator: !current.simulator }))}
      >
        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Scénario</th>
                <th>Occupation cible</th>
                <th>ADR</th>
                <th>Nuits</th>
                <th>CA brut</th>
                <th>Coûts variables</th>
                <th>Net estimé</th>
                <th>Marge</th>
              </tr>
            </thead>
            <tbody>
              {pilotModule.scenarios.map((scenario) => (
                <tr key={scenario.label}>
                  <td>{scenario.label}</td>
                  <td>{scenario.targetOccupancyRate} %</td>
                  <td>{formatAmount(scenario.adr)}</td>
                  <td>{scenario.bookedNights}</td>
                  <td>{formatAmount(scenario.grossRevenue)}</td>
                  <td>
                    {formatAmount(
                      scenario.platformFees +
                        scenario.cleaningCost +
                        scenario.conciergeCost +
                        scenario.consumablesCost +
                        scenario.otherVariableCosts,
                    )}
                  </td>
                  <td>{formatAmount(scenario.netRevenue)}</td>
                  <td>{scenario.marginRate} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BusinessCollapsibleSection>

      <BusinessCollapsibleSection
        id="performance-calendar"
        eyebrow="Calendrier d'opportunités"
        title="Lecture saisonnière future"
        summary="Base UX pour distinguer périodes à protéger, à surveiller ou à activer."
        badge="Saisonnalité"
        secondaryBadge="Démo"
        isOpen={openSections.calendar}
        onToggle={() => setOpenSections((current) => ({ ...current, calendar: !current.calendar }))}
      >
        <div className={styles.calendarGrid}>
          {pilotModule.opportunityCalendar.map((item) => (
            <article key={item.month} className={styles.calendarItem}>
              <span className={styles.calendarMonth}>{item.month}</span>
              <span className={styles.tone} data-tone={item.tone}>
                {statusLabel(item.tone)}
              </span>
              <p className={styles.calendarText}>{item.message}</p>
              <span className={styles.calendarSource}>{sourceLabel(item.source)}</span>
            </article>
          ))}
        </div>
      </BusinessCollapsibleSection>

      <BusinessCollapsibleSection
        id="performance-recommendations"
        eyebrow="Recommandations & pilotage"
        title="Ce qu'il faut suivre avant de construire le moteur final"
        summary="Hypothèses, données manquantes, roadmap cible, risques et prochaines actions."
        badge="Pilotage produit"
        secondaryBadge="Owner d'abord"
        isOpen={openSections.recommendations}
        onToggle={() => setOpenSections((current) => ({ ...current, recommendations: !current.recommendations }))}
      >
        <div className={styles.sectionGrid}>
          <article className={styles.noteCard}>
            <span className={styles.statusChip}>Hypothèses</span>
            <ul className={styles.list}>
              {pilotModule.openQuestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className={styles.noteCard}>
            <span className={styles.statusChip}>Risques</span>
            <ul className={styles.list}>
              {pilotModule.risks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>

        <div className={styles.sectionGrid}>
          <article className={styles.noteCard}>
            <span className={styles.statusChip}>Décisions prises</span>
            <ul className={styles.list}>
              {pilotModule.decisions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className={styles.noteCard}>
            <span className={styles.statusChip}>Tests à mener</span>
            <ul className={styles.list}>
              {pilotModule.testsToRun.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>

        <div className={styles.roadmapGrid}>
          {pilotModule.featureBuckets.map((bucket) => (
            <article key={bucket.label} className={styles.roadmapCard}>
              <strong>{bucket.label}</strong>
              <ul className={styles.list}>
                {bucket.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className={styles.dataAuditGrid}>
          {pilotModule.dataAudit.map((section) => (
            <article key={section.title} className={styles.dataAuditCard}>
              <strong>{section.title}</strong>
              <ul className={styles.list}>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className={styles.sectionGrid}>
          <article className={styles.noteCard}>
            <span className={styles.statusChip}>Prochaines actions</span>
            <ul className={styles.list}>
              {pilotModule.nextActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <div className={styles.panelStack}>
            {pilotModule.recommendations.map((item) => (
              <article key={item.id} className={styles.recommendationCard}>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
                <span className={styles.kpiSource}>{sourceLabel(item.source)}</span>
              </article>
            ))}
          </div>
        </div>
      </BusinessCollapsibleSection>
    </div>
  );
}
