"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Banknote, Calculator, Coins, Gauge, TrendingUp } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard";
import styles from "../page.module.scss";
import {
  computeFinancialScenario,
  DEFAULT_FINANCIAL_SCENARIOS,
  type FinancialAssumptions,
  type FinancialScenarioDefinition,
  type FinancialScenarioId,
} from "./financialModel";

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value * 10) / 10} %`;
}

function formatRatio(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "A definir";
  return `${Math.round(value * 10) / 10}x`;
}

function formatMonths(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Non calcule";
  if (value >= 12) return `${Math.round((value / 12) * 10) / 10} ans`;
  return `${Math.round(value * 10) / 10} mois`;
}

function getScenarioTone(id: FinancialScenarioId) {
  if (id === "central") return "strong";
  if (id === "prudent") return "mid";
  return "good";
}

function getFormulaRows() {
  return [
    {
      label: "MRR",
      formula: "Abonnes payants x prix mensuel moyen effectif + revenus mensuels annexes",
      note: "Le prix moyen tient compte du mix Essential / Pro / Business et de la part annuelle.",
    },
    {
      label: "ARR",
      formula: "MRR de fin de periode x 12",
      note: "Utilise le revenu mensuel recurrent equivalent a la fin de chaque annee.",
    },
    {
      label: "CAC",
      formula: "Depenses marketing / nouveaux clients payants",
      note: "Calcule ici avec le marketing mensuel ou annuel du scenario de simulation.",
    },
    {
      label: "LTV",
      formula: "ARPU x marge brute / churn mensuel",
      note: "Reste une estimation sensible au churn et a la marge reelle.",
    },
    {
      label: "LTV/CAC",
      formula: "LTV / CAC",
      note: "Permet de juger si l'acquisition semble soutenable.",
    },
    {
      label: "Runway",
      formula: "Tresorerie restante / burn rate moyen",
      note: "Affiche uniquement si la tresorerie et le burn sont calculables.",
    },
  ];
}

type EditableField = {
  key: keyof FinancialAssumptions;
  label: string;
  helper: string;
  suffix?: string;
};

const ASSUMPTION_GROUPS: Array<{ title: string; icon: typeof TrendingUp; fields: EditableField[] }> = [
  {
    title: "Clients",
    icon: TrendingUp,
    fields: [
      {
        key: "newFreeClientsYear1",
        label: "Nouveaux clients gratuits an 1",
        helper: "Volume d'entree annuel avant conversion vers le payant.",
      },
      {
        key: "annualAcquisitionGrowthPct",
        label: "Croissance acquisition annuelle",
        helper: "Acceleration du volume de nouveaux utilisateurs d'une annee a l'autre.",
        suffix: "%",
      },
      {
        key: "freeToPaidConversionPct",
        label: "Conversion gratuit -> payant",
        helper: "Part du stock gratuit qui bascule chaque mois vers une offre payante.",
        suffix: "%",
      },
      {
        key: "monthlyPaidChurnPct",
        label: "Churn payant mensuel",
        helper: "Part des abonnes payants perdus chaque mois.",
        suffix: "%",
      },
      {
        key: "annualPlanMixPct",
        label: "Mix annuel",
        helper: "Part des abonnements payes en annuel dans le portefeuille.",
        suffix: "%",
      },
    ],
  },
  {
    title: "Revenus",
    icon: Banknote,
    fields: [
      {
        key: "marketplaceActivePaidPct",
        label: "Clients payants actifs marketplace",
        helper: "Part des clients payants qui generent du GMV marketplace.",
        suffix: "%",
      },
      {
        key: "marketplaceGmvPerActiveClientMonthly",
        label: "GMV mensuel par client actif",
        helper: "Volume d'affaires marketplace moyen par client actif.",
        suffix: "EUR",
      },
      {
        key: "marketplaceCommissionPct",
        label: "Commission marketplace",
        helper: "Taux de commission retenu sur le GMV.",
        suffix: "%",
      },
      {
        key: "servicesAttachRatePct",
        label: "Attach rate services complementaires",
        helper: "Part des clients payants qui achetent un service additionnel.",
        suffix: "%",
      },
      {
        key: "servicesRevenuePerClientMonthly",
        label: "Revenu services par client",
        helper: "Montant mensuel moyen de services additionnels par client concerne.",
        suffix: "EUR",
      },
      {
        key: "otherRevenueMonthly",
        label: "Autres revenus mensuels",
        helper: "Bloc reserve a d'autres revenus potentiels non encore structures.",
        suffix: "EUR",
      },
    ],
  },
  {
    title: "Couts",
    icon: Coins,
    fields: [
      { key: "developmentMonthly", label: "Developpement", helper: "Charge mensuelle de build produit.", suffix: "EUR" },
      { key: "hostingMonthly", label: "Hebergement", helper: "Infra hors base et hors Vercel.", suffix: "EUR" },
      { key: "supabaseMonthly", label: "Supabase", helper: "Base de donnees et backend.", suffix: "EUR" },
      { key: "vercelMonthly", label: "Vercel", helper: "Hosting frontend et fonctions associees.", suffix: "EUR" },
      { key: "aiFixedMonthly", label: "API IA fixe", helper: "Socle mensuel IA independant du volume.", suffix: "EUR" },
      {
        key: "aiVariablePerPaidClientMonthly",
        label: "API IA variable / client payant",
        helper: "Cout IA incremental lie a l'usage client.",
        suffix: "EUR",
      },
      { key: "marketingMonthly", label: "Marketing", helper: "Budget d'acquisition mensuel.", suffix: "EUR" },
      { key: "freelancersMonthly", label: "Freelances", helper: "Renforts externes et missions ponctuelles.", suffix: "EUR" },
      { key: "supportFixedMonthly", label: "Support fixe", helper: "Socle mensuel support / ops.", suffix: "EUR" },
      {
        key: "supportVariablePerPaidClientMonthly",
        label: "Support variable / client payant",
        helper: "Charge support incremental par client payant.",
        suffix: "EUR",
      },
      { key: "legalMonthly", label: "Juridique", helper: "Accompagnement legal mensuel estime.", suffix: "EUR" },
      { key: "accountingMonthly", label: "Comptabilite", helper: "Charges comptables et pilotage financier.", suffix: "EUR" },
      { key: "otherSaasMonthly", label: "Autres SaaS", helper: "Outils business et ops complementaires.", suffix: "EUR" },
      { key: "paymentFeePct", label: "Frais de paiement", helper: "Pourcentage preleve sur le chiffre d'affaires.", suffix: "%" },
      { key: "startingCash", label: "Tresorerie de depart", helper: "Tresorerie initiale injectee dans la simulation.", suffix: "EUR" },
    ],
  },
];

export function FinancialForecastModel() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<FinancialScenarioId>("central");
  const [scenarioDefinitions, setScenarioDefinitions] =
    useState<FinancialScenarioDefinition[]>(DEFAULT_FINANCIAL_SCENARIOS);

  const selectedScenario =
    scenarioDefinitions.find((scenario) => scenario.id === selectedScenarioId) ?? scenarioDefinitions[1];

  const scenarioResults = useMemo(
    () => scenarioDefinitions.map((scenario) => computeFinancialScenario(scenario)),
    [scenarioDefinitions],
  );
  const selectedResult =
    scenarioResults.find((scenario) => scenario.scenario.id === selectedScenarioId) ?? scenarioResults[1];

  const maxRevenue = Math.max(...selectedResult.years.map((year) => year.annualRevenue), 1);
  const maxCost = Math.max(...selectedResult.years.map((year) => year.annualCosts), 1);
  const formulas = useMemo(() => getFormulaRows(), []);

  function updateAssumption(key: keyof FinancialAssumptions, value: number) {
    setScenarioDefinitions((current) =>
      current.map((scenario) =>
        scenario.id === selectedScenarioId
          ? {
              ...scenario,
              assumptions: {
                ...scenario.assumptions,
                [key]: value,
              },
            }
          : scenario,
      ),
    );
  }

  return (
    <div className={styles.sectionStack}>
      <DashboardPanel title="Modele financier SaaS 5 ans">
        <div className={styles.sectionStack}>
          <div className={styles.sectionNav}>
            {scenarioResults.map((scenario) => (
              <button
                key={scenario.scenario.id}
                type="button"
                className={styles.sectionNavButton}
                onClick={() => setSelectedScenarioId(scenario.scenario.id)}
                aria-pressed={selectedScenarioId === scenario.scenario.id}
              >
                <span>{scenario.scenario.label}</span>
                <small>
                  MRR fin annee 5 {formatMoney(scenario.latest.endMrr)} | {scenario.latest.endingPaidClients.toFixed(0)} payants
                </small>
              </button>
            ))}
          </div>

          <div className={styles.simulationExecutiveGrid}>
            {scenarioResults.map((scenario) => (
              <article
                key={scenario.scenario.id}
                className={styles.simulationExecutiveCard}
                data-featured={scenario.scenario.id === selectedScenarioId}
              >
                <div className={styles.simulationExecutiveHeader}>
                  <div>
                    <span className={styles.eyebrow}>Scenario {scenario.scenario.label}</span>
                    <h4>Lecture investisseur en 30 secondes</h4>
                  </div>
                  <span className={styles.scorePill} data-tone={getScenarioTone(scenario.scenario.id)}>
                    {scenario.breakEvenMonth ? `Break-even M${scenario.breakEvenMonth}` : "Break-even non atteint"}
                  </span>
                </div>
                <p>
                  {scenario.scenario.id === "prudent"
                    ? "Projection defensive avec conversion et revenus annexes limites."
                    : scenario.scenario.id === "central"
                      ? "Scenario de travail recommande pour piloter les hypotheses a court terme."
                      : "Scenario offensif qui suppose une traction plus rapide et une meilleure retention."}
                </p>
                <div className={styles.simulationExecutiveMetrics}>
                  <article className={styles.simulationExecutiveMetric}>
                    <span>ARR fin annee 5</span>
                    <strong>{formatMoney(scenario.latest.arr)}</strong>
                  </article>
                  <article className={styles.simulationExecutiveMetric}>
                    <span>ARPU fin annee 5</span>
                    <strong>{formatMoney(scenario.latest.arpu)}</strong>
                  </article>
                  <article className={styles.simulationExecutiveMetric}>
                    <span>LTV/CAC</span>
                    <strong>{formatRatio(scenario.latest.ltvToCac)}</strong>
                  </article>
                  <article className={styles.simulationExecutiveMetric}>
                    <span>Runway</span>
                    <strong>{formatMonths(scenario.latest.runwayMonths)}</strong>
                  </article>
                </div>
              </article>
            ))}
          </div>
        </div>
      </DashboardPanel>

      <div className={styles.sectionPanelGrid}>
        <DashboardPanel title="Hypotheses">
          <div className={styles.sectionStack}>
            <p className={styles.sectionNote}>
              Chaque valeur ci-dessous reste une hypothese editable de simulation. Rien ici ne doit etre considere
              comme une donnee commerciale definitive sans validation terrain.
            </p>
            {ASSUMPTION_GROUPS.map((group) => (
              <div key={group.title} className={styles.sectionStack}>
                <div className={styles.marketHeader}>
                  <div>
                    <span className={styles.eyebrow}>{group.title}</span>
                    <strong>{group.title} du scenario {selectedScenario.label}</strong>
                  </div>
                  <group.icon size={18} />
                </div>
                <div className={styles.offerMiniEditorGrid}>
                  {group.fields.map((field) => (
                    <label key={field.key} className={styles.offerMiniEditorCard}>
                      <span>{field.label}</span>
                      <strong>{field.helper}</strong>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={selectedScenario.assumptions[field.key]}
                        onChange={(event) => updateAssumption(field.key, Number(event.target.value))}
                        aria-label={field.label}
                      />
                      {field.suffix ? <small className={styles.sourceLine}>Unite: {field.suffix}</small> : null}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Calculs">
          <div className={styles.sectionStack}>
            <div className={styles.highlightGrid}>
              <article className={styles.highlightCard}>
                <Calculator size={18} />
                <span>Horizon</span>
                <strong>5 ans</strong>
                <p>Simulation mensuelle consolidee en lecture annuelle pour garder une vue exploitable.</p>
              </article>
              <article className={styles.highlightCard}>
                <Gauge size={18} />
                <span>Churn utilise</span>
                <strong>{formatPercent(selectedScenario.assumptions.monthlyPaidChurnPct)}</strong>
                <p>Le churn payant mensuel pilote directement la retention, la LTV et la vitesse de croissance nette.</p>
              </article>
              <article className={styles.highlightCard}>
                <Coins size={18} />
                <span>Mix revenu</span>
                <strong>Abonnement + marketplace + services</strong>
                <p>Les revenus annexes sont visibles a part pour eviter de surevaluer le SaaS recurrent pur.</p>
              </article>
              <article className={styles.highlightCard}>
                <AlertTriangle size={18} />
                <span>Interpretation</span>
                <strong>Hypothese a valider</strong>
                <p>Le CAC, la LTV et le seuil de rentabilite sont des estimations internes sensibles aux hypothèses.</p>
              </article>
            </div>

            <div className={styles.decisionList}>
              {formulas.map((item) => (
                <article key={item.label} className={styles.decisionCard}>
                  <strong>{item.label}</strong>
                  <p>{item.formula}</p>
                  <p>{item.note}</p>
                </article>
              ))}
            </div>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel title="Resultats">
        <div className={styles.sectionStack}>
          <div className={styles.metricGrid}>
            <article className={styles.metricCard}>
              <span>MRR fin annee 5</span>
              <strong>{formatMoney(selectedResult.latest.endMrr)}</strong>
              <p>Inclut l'abonnement et les revenus mensuels annexes du scenario selectionne.</p>
            </article>
            <article className={styles.metricCard}>
              <span>ARR fin annee 5</span>
              <strong>{formatMoney(selectedResult.latest.arr)}</strong>
              <p>Projection de run-rate annuelle a partir du revenu mensuel de fin de periode.</p>
            </article>
            <article className={styles.metricCard}>
              <span>ARPU fin annee 5</span>
              <strong>{formatMoney(selectedResult.latest.arpu)}</strong>
              <p>Revenu mensuel moyen par client payant sur la derniere periode.</p>
            </article>
            <article className={styles.metricCard}>
              <span>CAC moyen annee 5</span>
              <strong>{formatMoney(selectedResult.latest.cac)}</strong>
              <p>Budget marketing annualise rapporte aux nouveaux clients payants de l'annee.</p>
            </article>
            <article className={styles.metricCard}>
              <span>LTV estimee</span>
              <strong>{formatMoney(selectedResult.latest.ltv)}</strong>
              <p>Estimation basee sur l'ARPU, la marge brute et le churn mensuel.</p>
            </article>
            <article className={styles.metricCard}>
              <span>LTV / CAC</span>
              <strong>{formatRatio(selectedResult.latest.ltvToCac)}</strong>
              <p>Doit etre lu comme un indicateur de soutenabilite, pas comme une certitude.</p>
            </article>
            <article className={styles.metricCard}>
              <span>Marge brute</span>
              <strong>{formatPercent(selectedResult.latest.grossMarginPct)}</strong>
              <p>Calculee hors couts operatoires de structure et marketing.</p>
            </article>
            <article className={styles.metricCard}>
              <span>Burn / runway / break-even</span>
              <strong>
                {formatMoney(selectedResult.latest.burnRate)} / {formatMonths(selectedResult.latest.runwayMonths)}
              </strong>
              <p>{selectedResult.breakEvenMonth ? `Seuil de rentabilite atteint au mois ${selectedResult.breakEvenMonth}.` : "Seuil de rentabilite non atteint dans l'horizon simule."}</p>
            </article>
          </div>

          <div className={styles.sectionPanelGrid}>
            <div className={styles.simulationProjectionPanel}>
              <div className={styles.simulationProjectionIntro}>
                <span className={styles.eyebrow}>Graphique simple</span>
                <h4>Revenus versus couts sur 5 ans</h4>
                <p>Lecture rapide pour identifier si la courbe de revenus rattrape durablement la structure de couts.</p>
              </div>
              <div className={styles.comparisonChart}>
                {selectedResult.years.map((year) => (
                  <article key={year.year} className={styles.comparisonRow}>
                    <div className={styles.comparisonMeta}>
                      <strong>Annee {year.year}</strong>
                      <span>{formatMoney(year.annualRevenue)} / {formatMoney(year.annualCosts)}</span>
                    </div>
                    <div className={styles.comparisonTrack}>
                      <div
                        className={styles.comparisonFill}
                        data-tone="planetls"
                        style={{ width: `${Math.max(8, Math.round((year.annualRevenue / maxRevenue) * 100))}%` }}
                      />
                    </div>
                    <div className={styles.comparisonTrack}>
                      <div
                        className={styles.comparisonFill}
                        data-tone="direct"
                        style={{ width: `${Math.max(8, Math.round((year.annualCosts / maxCost) * 100))}%` }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className={styles.simulationProjectionPanel}>
              <div className={styles.simulationProjectionIntro}>
                <span className={styles.eyebrow}>Tresorerie</span>
                <h4>Lecture cash et rentabilite</h4>
                <p>Cette vue aide a voir si la croissance absorbe les couts et a quel rythme la tresorerie evolue.</p>
              </div>
              <div className={styles.simulationInvestorStrip}>
                <article className={styles.simulationInvestorChip}>
                  <span>Clients payants fin annee 5</span>
                  <strong>{selectedResult.latest.endingPaidClients.toFixed(0)}</strong>
                </article>
                <article className={styles.simulationInvestorChip}>
                  <span>Tresorerie fin annee 5</span>
                  <strong>{formatMoney(selectedResult.latest.endingCashBalance)}</strong>
                </article>
                <article className={styles.simulationInvestorChip}>
                  <span>Nouveaux clients payants annee 5</span>
                  <strong>{selectedResult.latest.annualNewPaidClients.toFixed(0)}</strong>
                </article>
              </div>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Annee</th>
                  <th>Clients payants fin periode</th>
                  <th>Nouveaux payants</th>
                  <th>Churn</th>
                  <th>Abonnement</th>
                  <th>Marketplace</th>
                  <th>Services</th>
                  <th>Autres revenus</th>
                  <th>CA annuel</th>
                  <th>Couts annuels</th>
                  <th>Marge brute</th>
                  <th>Burn moyen</th>
                  <th>Tresorerie fin periode</th>
                </tr>
              </thead>
              <tbody>
                {selectedResult.years.map((year) => (
                  <tr key={year.year}>
                    <td>Annee {year.year}</td>
                    <td>{year.endingPaidClients.toFixed(0)}</td>
                    <td>{year.annualNewPaidClients.toFixed(0)}</td>
                    <td>{year.annualChurnedClients.toFixed(0)}</td>
                    <td>{formatMoney(year.annualSubscriptionRevenue)}</td>
                    <td>{formatMoney(year.annualMarketplaceRevenue)}</td>
                    <td>{formatMoney(year.annualServicesRevenue)}</td>
                    <td>{formatMoney(year.annualOtherRevenue)}</td>
                    <td>{formatMoney(year.annualRevenue)}</td>
                    <td>{formatMoney(year.annualCosts)}</td>
                    <td>{formatPercent(year.grossMarginPct)}</td>
                    <td>{formatMoney(year.burnRate)}</td>
                    <td>{formatMoney(year.endingCashBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className={styles.sectionNote}>
            Les calculs sont centralises dans <code>economic-model/financialModel.ts</code> et documentes dans{" "}
            <code>docs/business-plan-financial-model.md</code>. Les projections affichent des estimations internes et
            doivent etre relues a chaque evolution d'offre, de cout ou de traction reelle.
          </p>
        </div>
      </DashboardPanel>
    </div>
  );
}
