"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { businessRisks } from "./riskData";
import type { BusinessRisk, RiskCategory, RiskPriority, RiskProfile } from "./riskTypes";
import styles from "./RiskRegister.module.scss";

const PRIORITY_OPTIONS: Array<{ value: "all" | RiskPriority; label: string }> = [
  { value: "all", label: "Toutes les priorités" },
  { value: "critique", label: "Critiques" },
  { value: "prioritaire", label: "Prioritaires" },
  { value: "surveiller", label: "À surveiller" },
  { value: "acceptable", label: "Acceptables" },
];

const CATEGORY_OPTIONS: Array<{ value: "all" | RiskCategory; label: string }> = [
  { value: "all", label: "Toutes les catégories" },
  { value: "marche", label: "Marché" },
  { value: "commercial", label: "Commercial" },
  { value: "marketplace", label: "Marketplace" },
  { value: "operationnel", label: "Opérationnel" },
  { value: "financier", label: "Financier" },
  { value: "juridique", label: "Juridique" },
  { value: "technologique", label: "Technologique" },
  { value: "ia", label: "IA" },
];

const PROFILE_OPTIONS: Array<{ value: "all" | RiskProfile; label: string }> = [
  { value: "all", label: "Tous les profils" },
  { value: "proprietaires", label: "Propriétaires" },
  { value: "concierges", label: "Concierges" },
  { value: "conciergeries", label: "Conciergeries" },
  { value: "artisans", label: "Artisans" },
  { value: "prestataires", label: "Prestataires" },
  { value: "administrateurs", label: "Administrateurs" },
  { value: "equipe", label: "Équipe terrain" },
];

function countByPriority(risks: BusinessRisk[], priority: RiskPriority) {
  return risks.filter((risk) => risk.priority === priority).length;
}

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

export function RiskRegister() {
  const [priority, setPriority] = useState<"all" | RiskPriority>("all");
  const [category, setCategory] = useState<"all" | RiskCategory>("all");
  const [profile, setProfile] = useState<"all" | RiskProfile>("all");

  const filteredRisks = useMemo(() => {
    return businessRisks.filter((risk) => {
      if (priority !== "all" && risk.priority !== priority) return false;
      if (category !== "all" && risk.category !== category) return false;
      if (profile !== "all" && !risk.affectedProfiles.includes(profile)) return false;
      return true;
    });
  }, [category, priority, profile]);

  return (
    <section className={styles.section} aria-labelledby="risk-register-title">
      <header className={styles.hero}>
        <span className={styles.eyebrow}>
          <ShieldAlert size={16} /> Registre des risques
        </span>
        <h2 id="risk-register-title">Première cartographie des risques PlanetLS</h2>
        <p>
          Version statique et exploitable sans migration. Elle sert de base de travail pour prioriser
          les risques les plus critiques avant lancement et avant toute levée.
        </p>
      </header>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total risques</span>
          <strong className={styles.summaryValue}>{businessRisks.length}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Critiques</span>
          <strong className={styles.summaryValue}>{countByPriority(businessRisks, "critique")}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Prioritaires</span>
          <strong className={styles.summaryValue}>
            {countByPriority(businessRisks, "prioritaire")}
          </strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>À surveiller</span>
          <strong className={styles.summaryValue}>
            {countByPriority(businessRisks, "surveiller")}
          </strong>
        </article>
      </div>

      <section className={styles.filters} aria-label="Filtres du registre des risques">
        <h3>Filtres rapides</h3>

        <div className={styles.filterRow}>
          {PRIORITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.chip}
              data-active={priority === option.value}
              onClick={() => setPriority(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className={styles.filterRow}>
          {CATEGORY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.chip}
              data-active={category === option.value}
              onClick={() => setCategory(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className={styles.filterRow}>
          {PROFILE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.chip}
              data-active={profile === option.value}
              onClick={() => setProfile(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {filteredRisks.length === 0 ? (
        <div className={styles.emptyState}>
          <strong>Aucun risque ne correspond aux filtres actuels.</strong>
          <p>Élargissez les filtres pour retrouver l'ensemble de la cartographie.</p>
        </div>
      ) : (
        <div className={styles.riskGrid}>
          {filteredRisks.map((risk) => (
            <article key={risk.id} className={styles.riskCard}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.badgeRow}>
                    <span className={styles.priorityBadge} data-priority={risk.priority}>
                      {risk.priority}
                    </span>
                    <span className={styles.badge}>{risk.id}</span>
                    <span className={styles.badge}>{risk.category}</span>
                  </div>
                  <h3>{risk.title}</h3>
                </div>
                <AlertTriangle size={18} aria-hidden="true" />
              </div>

              <p>{risk.description}</p>

              <div className={styles.metaWrap}>
                <p className={styles.metaRow}>
                  <span className={styles.metaLabel}>Cause :</span> {risk.cause}
                </p>
                <p className={styles.metaRow}>
                  <span className={styles.metaLabel}>Profils :</span>{" "}
                  {risk.affectedProfiles.map(labelize).join(", ")}
                </p>
                <p className={styles.metaRow}>
                  <span className={styles.metaLabel}>Probabilité / impact :</span> {risk.probability} /{" "}
                  {risk.impact}
                </p>
                <p className={styles.metaRow}>
                  <span className={styles.metaLabel}>Horizon :</span> {labelize(risk.horizon)}
                </p>
                <p className={styles.metaRow}>
                  <span className={styles.metaLabel}>Mitigation :</span> {risk.mitigation}
                </p>
                <p className={styles.metaRow}>
                  <span className={styles.metaLabel}>Responsable :</span> {risk.owner}
                </p>
                <p className={styles.metaRow}>
                  <span className={styles.metaLabel}>Échéance :</span> {risk.deadline}
                </p>
                <p className={styles.metaRow}>
                  <span className={styles.metaLabel}>Statut :</span> {labelize(risk.status)}
                </p>
              </div>

              <div className={styles.signalWrap}>
                <strong>Signaux d'alerte</strong>
                <ul className={styles.signalList}>
                  {risk.warningSignals.map((signal) => (
                    <li key={signal}>{signal}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
