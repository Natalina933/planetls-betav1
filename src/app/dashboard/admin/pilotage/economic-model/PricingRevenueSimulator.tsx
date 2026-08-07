"use client";

import { useMemo, useState } from "react";
import { Calculator, CircleDollarSign, SlidersHorizontal, TrendingUp, Users } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard";
import {
  PRICING_REVENUE_SCENARIOS,
  PRICING_REVENUE_TIERS,
} from "./data";
import type {
  CandidatePricingTierId,
  PricingRevenueScenario,
  PricingRevenueTier,
} from "./types";
import styles from "../page.module.scss";

type ScenarioState = Record<PricingRevenueScenario["id"], PricingRevenueScenario>;
type TierState = Record<PricingRevenueTier["id"], PricingRevenueTier>;

function toCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function toPercent(value: number) {
  return `${Math.round(value * 10) / 10} %`;
}

function toAnnualPrice(monthlyPrice: number, annualDiscountRate: number) {
  return monthlyPrice * 12 * (1 - annualDiscountRate / 100);
}

function buildTierState() {
  return Object.fromEntries(PRICING_REVENUE_TIERS.map((tier) => [tier.id, { ...tier }])) as TierState;
}

function buildScenarioState() {
  return Object.fromEntries(PRICING_REVENUE_SCENARIOS.map((scenario) => [scenario.id, { ...scenario }])) as ScenarioState;
}

export function PricingRevenueSimulator() {
  const [tiers, setTiers] = useState<TierState>(buildTierState);
  const [scenarios, setScenarios] = useState<ScenarioState>(buildScenarioState);
  const [selectedScenarioId, setSelectedScenarioId] =
    useState<PricingRevenueScenario["id"]>("realistic");

  const tierList = useMemo(() => Object.values(tiers), [tiers]);
  const scenarioList = useMemo(() => Object.values(scenarios), [scenarios]);
  const selectedScenario = scenarios[selectedScenarioId];

  const scenarioMetrics = useMemo(() => {
    return scenarioList.map((scenario) => {
      const annualMix = scenario.annualPlanMixPct / 100;
      const paidTiers = tierList.filter((tier) => tier.monthlyPrice > 0);

      const tierRows = tierList.map((tier) => {
        const clients = scenario.subscribersByTier[tier.id];
        const annualPrice = toAnnualPrice(tier.monthlyPrice, tier.annualDiscountRate);
        const annualClients = tier.monthlyPrice > 0 ? clients * annualMix : 0;
        const monthlyClients = tier.monthlyPrice > 0 ? clients - annualClients : clients;
        const subscriptionMrr =
          tier.monthlyPrice > 0
            ? monthlyClients * tier.monthlyPrice + annualClients * (annualPrice / 12)
            : 0;
        const subscriptionArr = subscriptionMrr * 12;
        const commissionRevenue = (scenario.marketplaceGmvMonthly * tier.commissionRate) / 100;
        const monthlyCosts = clients * tier.estimatedMonthlyCost;
        const grossRevenue = subscriptionMrr + commissionRevenue;
        const grossMarginPct =
          grossRevenue > 0 ? ((grossRevenue - monthlyCosts) / grossRevenue) * 100 : 0;

        return {
          ...tier,
          clients,
          annualPrice,
          subscriptionMrr,
          subscriptionArr,
          commissionRevenue,
          monthlyCosts,
          grossMarginPct,
        };
      });

      const paidClients = paidTiers.reduce(
        (total, tier) => total + scenario.subscribersByTier[tier.id],
        0,
      );
      const subscribers = tierRows.reduce((total, tier) => total + tier.clients, 0);
      const mrr = tierRows.reduce((total, tier) => total + tier.subscriptionMrr, 0);
      const arr = mrr * 12;
      const commissions = tierRows.reduce((total, tier) => total + tier.commissionRevenue, 0);
      const totalRevenue = mrr + commissions;
      const totalCosts = tierRows.reduce((total, tier) => total + tier.monthlyCosts, 0);
      const arpu = paidClients > 0 ? totalRevenue / paidClients : 0;
      const grossMarginPct =
        totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;

      return {
        ...scenario,
        tierRows,
        subscribers,
        paidClients,
        mrr,
        arr,
        commissions,
        totalRevenue,
        totalCosts,
        arpu,
        grossMarginPct,
      };
    });
  }, [scenarioList, tierList]);

  const selectedMetrics =
    scenarioMetrics.find((scenario) => scenario.id === selectedScenarioId) ?? scenarioMetrics[0];

  function updateTierValue<K extends keyof PricingRevenueTier>(
    tierId: CandidatePricingTierId,
    field: K,
    value: PricingRevenueTier[K],
  ) {
    setTiers((current) => ({
      ...current,
      [tierId]: {
        ...current[tierId],
        [field]: value,
      },
    }));
  }

  function updateScenarioValue<K extends keyof PricingRevenueScenario>(
    scenarioId: PricingRevenueScenario["id"],
    field: K,
    value: PricingRevenueScenario[K],
  ) {
    setScenarios((current) => ({
      ...current,
      [scenarioId]: {
        ...current[scenarioId],
        [field]: value,
      },
    }));
  }

  function updateScenarioSubscribers(
    scenarioId: PricingRevenueScenario["id"],
    tierId: CandidatePricingTierId,
    value: number,
  ) {
    setScenarios((current) => ({
      ...current,
      [scenarioId]: {
        ...current[scenarioId],
        subscribersByTier: {
          ...current[scenarioId].subscribersByTier,
          [tierId]: value,
        },
      },
    }));
  }

  return (
    <div className={styles.sectionStack}>
      <DashboardPanel title="Tarification & revenus - simulateur de travail">
        <div className={styles.highlightGrid}>
          <article className={styles.highlightCard}>
            <SlidersHorizontal size={18} />
            <span>Statut</span>
            <strong>Hypotheses modifiables</strong>
            <p>Les valeurs ci-dessous servent a tester des strategies sans toucher aux offres commerciales en production.</p>
          </article>
          <article className={styles.highlightCard}>
            <CircleDollarSign size={18} />
            <span>Offre reelle protegee</span>
            <strong>Conciergerie Pro</strong>
            <p>Le simulateur n'edite pas Stripe ni le parcours d'abonnement actif.</p>
          </article>
          <article className={styles.highlightCard}>
            <TrendingUp size={18} />
            <span>Scenarios compares</span>
            <strong>3 lectures</strong>
            <p>Prudent, Central et Ambitieux servent a cadrer le potentiel sans figer de promesse commerciale.</p>
          </article>
          <article className={styles.highlightCard}>
            <Calculator size={18} />
            <span>Calculs automatiques</span>
            <strong>MRR / ARR / ARPU</strong>
            <p>Les revenus abonnement et commissions se recalculent en direct selon les hypotheses editees.</p>
          </article>
        </div>
        <p className={styles.sectionNote}>
          Les noms `FREE`, `ESSENTIAL`, `PRO`, `BUSINESS` sont des labels de travail dans ce simulateur.
          Ils ne remplacent pas les noms commerciaux de production et peuvent etre renommes plus tard.
        </p>
      </DashboardPanel>

      <DashboardPanel title="Comparaison des scenarios">
        <div className={styles.executiveComparisonGrid}>
          {scenarioMetrics.map((scenario) => (
            <article
              key={scenario.id}
              className={styles.executiveComparisonCard}
              data-rank={scenario.id === "realistic" ? "top" : "low"}
            >
              <div className={styles.executiveComparisonHeader}>
                <div>
                  <span className={styles.eyebrow}>Scenario</span>
                  <h4>{scenario.label}</h4>
                </div>
                <button
                  type="button"
                  className={styles.inlineLink}
                  onClick={() => setSelectedScenarioId(scenario.id)}
                >
                  Voir / editer
                </button>
              </div>
              <div className={styles.executiveMetricRow}>
                <article className={styles.executiveMetricCard}>
                  <span>MRR</span>
                  <strong>{toCurrency(scenario.mrr)}</strong>
                </article>
                <article className={styles.executiveMetricCard}>
                  <span>ARR</span>
                  <strong>{toCurrency(scenario.arr)}</strong>
                </article>
                <article className={styles.executiveMetricCard}>
                  <span>Abonnes</span>
                  <strong>{scenario.subscribers}</strong>
                </article>
                <article className={styles.executiveMetricCard}>
                  <span>ARPU</span>
                  <strong>{toCurrency(scenario.arpu)}</strong>
                </article>
                <article className={styles.executiveMetricCard}>
                  <span>Commissions</span>
                  <strong>{toCurrency(scenario.commissions)}</strong>
                </article>
                <article className={styles.executiveMetricCard}>
                  <span>Revenu total</span>
                  <strong>{toCurrency(scenario.totalRevenue)}</strong>
                </article>
              </div>
              <p>{scenario.notes}</p>
            </article>
          ))}
        </div>
      </DashboardPanel>

      <div className={styles.sectionPanelGrid}>
        <DashboardPanel title={`Hypotheses du scenario ${selectedScenario.label}`}>
          <div className={styles.offerMiniEditorGrid}>
            <article className={styles.offerMiniEditorCard}>
              <span>Mix annuel</span>
              <input
                type="number"
                min={0}
                max={100}
                value={selectedScenario.annualPlanMixPct}
                onChange={(event) =>
                  updateScenarioValue(
                    selectedScenarioId,
                    "annualPlanMixPct",
                    Number(event.target.value),
                  )
                }
              />
            </article>
            <article className={styles.offerMiniEditorCard}>
              <span>GMV marketplace / mois</span>
              <input
                type="number"
                min={0}
                step={100}
                value={selectedScenario.marketplaceGmvMonthly}
                onChange={(event) =>
                  updateScenarioValue(
                    selectedScenarioId,
                    "marketplaceGmvMonthly",
                    Number(event.target.value),
                  )
                }
              />
            </article>
            <article className={styles.offerMiniEditorCard}>
              <span>Nature</span>
              <strong>{selectedScenario.source}</strong>
            </article>
          </div>
          <p className={styles.sectionNote}>{selectedScenario.notes}</p>
        </DashboardPanel>

        <DashboardPanel title="Synthese automatique du scenario selectionne">
          <div className={styles.metricGrid}>
            <article className={styles.metricCard}>
              <span>MRR abonnement</span>
              <strong>{toCurrency(selectedMetrics.mrr)}</strong>
              <p>Inclut l'effet du mix mensuel / annuel sur les clients payants.</p>
            </article>
            <article className={styles.metricCard}>
              <span>ARR</span>
              <strong>{toCurrency(selectedMetrics.arr)}</strong>
              <p>Run rate annuel calcule a partir du MRR abonnement courant.</p>
            </article>
            <article className={styles.metricCard}>
              <span>Revenu marketplace</span>
              <strong>{toCurrency(selectedScenario.marketplaceGmvMonthly)}</strong>
              <p>Volume d'affaires intermedie estime, distinct du revenu PlanetLS.</p>
            </article>
            <article className={styles.metricCard}>
              <span>Commissions</span>
              <strong>{toCurrency(selectedMetrics.commissions)}</strong>
              <p>Revenu PlanetLS calcule a partir du GMV et des taux de commission des offres.</p>
            </article>
            <article className={styles.metricCard}>
              <span>ARPU</span>
              <strong>{toCurrency(selectedMetrics.arpu)}</strong>
              <p>Revenu moyen par client payant estime sur le scenario selectionne.</p>
            </article>
            <article className={styles.metricCard}>
              <span>Marge brute estimee</span>
              <strong>{toPercent(selectedMetrics.grossMarginPct)}</strong>
              <p>Calculee a partir des couts mensuels estimes renseignes dans les hypotheses d'offre.</p>
            </article>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel title="Offres de travail et unite economique par offre">
        <section className={styles.offerExecutiveGrid}>
          {selectedMetrics.tierRows.map((tier) => (
            <article key={tier.id} className={styles.offerExecutiveCard}>
              <div className={styles.offerExecutiveHeader}>
                <div>
                  <span className={styles.eyebrow}>{tier.nameStatus === "working" ? "Nom de travail" : "Reference existante"}</span>
                  <h4>{tier.workingName}</h4>
                </div>
                <div className={styles.offerExecutivePrice}>
                  <strong>{toCurrency(tier.monthlyPrice)}</strong>
                  <span>{tier.currentReferenceName ?? "Nom a confirmer"}</span>
                </div>
              </div>

              <div className={styles.offerBadgeRow}>
                <span className={styles.scorePill} data-tone="mid">{tier.source}</span>
                <span className={styles.scorePill} data-tone="good">{tier.targetProfiles.join(", ")}</span>
                <span className={styles.scorePill} data-tone="strong">{tier.clients} clients</span>
              </div>

              <div className={styles.offerMiniEditorGrid}>
                <article className={styles.offerMiniEditorCard}>
                  <span>Prix mensuel</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={tier.monthlyPrice}
                    onChange={(event) =>
                      updateTierValue(tier.id, "monthlyPrice", Number(event.target.value))
                    }
                  />
                </article>
                <article className={styles.offerMiniEditorCard}>
                  <span>Remise annuelle %</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={tier.annualDiscountRate}
                    onChange={(event) =>
                      updateTierValue(tier.id, "annualDiscountRate", Number(event.target.value))
                    }
                  />
                </article>
                <article className={styles.offerMiniEditorCard}>
                  <span>Commission %</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={tier.commissionRate}
                    onChange={(event) =>
                      updateTierValue(tier.id, "commissionRate", Number(event.target.value))
                    }
                  />
                </article>
                <article className={styles.offerMiniEditorCard}>
                  <span>Cout estime / mois</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={tier.estimatedMonthlyCost}
                    onChange={(event) =>
                      updateTierValue(tier.id, "estimatedMonthlyCost", Number(event.target.value))
                    }
                  />
                </article>
                <article className={styles.offerMiniEditorCard}>
                  <span>Conversion estimee %</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={tier.estimatedConversionRatePct}
                    onChange={(event) =>
                      updateTierValue(
                        tier.id,
                        "estimatedConversionRatePct",
                        Number(event.target.value),
                      )
                    }
                  />
                </article>
                <article className={styles.offerMiniEditorCard}>
                  <span>Clients ({selectedScenario.label})</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={tier.clients}
                    onChange={(event) =>
                      updateScenarioSubscribers(
                        selectedScenarioId,
                        tier.id,
                        Number(event.target.value),
                      )
                    }
                  />
                </article>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                  <tbody>
                    <tr>
                      <td>Cible</td>
                      <td>{tier.targetProfiles.join(", ")}</td>
                    </tr>
                    <tr>
                      <td>Prix annuel calcule</td>
                      <td>{toCurrency(tier.annualPrice)}</td>
                    </tr>
                    <tr>
                      <td>MRR</td>
                      <td>{toCurrency(tier.subscriptionMrr)}</td>
                    </tr>
                    <tr>
                      <td>ARR</td>
                      <td>{toCurrency(tier.subscriptionArr)}</td>
                    </tr>
                    <tr>
                      <td>Commissions eventuelles</td>
                      <td>{toCurrency(tier.commissionRevenue)}</td>
                    </tr>
                    <tr>
                      <td>Couts estimes</td>
                      <td>{toCurrency(tier.monthlyCosts)}</td>
                    </tr>
                    <tr>
                      <td>Marge brute estimee</td>
                      <td>{toPercent(tier.grossMarginPct)}</td>
                    </tr>
                    <tr>
                      <td>Taux de conversion estime</td>
                      <td>{toPercent(tier.estimatedConversionRatePct)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={styles.offerExecutiveColumns}>
                <div>
                  <span className={styles.eyebrow}>Fonctionnalites</span>
                  <ul className={styles.plainList}>
                    {tier.features.map((feature) => (
                      <li key={`${tier.id}-${feature}`}>{feature}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className={styles.eyebrow}>Limites</span>
                  <ul className={styles.plainList}>
                    {tier.limits.map((item) => (
                      <li key={`${tier.id}-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <p>{tier.notes ?? "Hypothese a valider"}</p>
            </article>
          ))}
        </section>
      </DashboardPanel>

      <DashboardPanel title="Tableau comparatif des revenus par scenario">
        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Abonnes</th>
                <th>Clients payants</th>
                <th>MRR</th>
                <th>ARR</th>
                <th>ARPU</th>
                <th>Revenu marketplace</th>
                <th>Commissions</th>
                <th>Revenu total</th>
              </tr>
            </thead>
            <tbody>
              {scenarioMetrics.map((scenario) => (
                <tr key={`summary-${scenario.id}`}>
                  <td>{scenario.label}</td>
                  <td>{scenario.subscribers}</td>
                  <td>{scenario.paidClients}</td>
                  <td>{toCurrency(scenario.mrr)}</td>
                  <td>{toCurrency(scenario.arr)}</td>
                  <td>{toCurrency(scenario.arpu)}</td>
                  <td>{toCurrency(scenario.marketplaceGmvMonthly)}</td>
                  <td>{toCurrency(scenario.commissions)}</td>
                  <td>{toCurrency(scenario.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.sectionNote}>
          Lecture des calculs : `MRR` et `ARR` correspondent ici au revenu abonnement estime. Le
          `revenu marketplace` represente le GMV mensuel intermedie, tandis que `commissions`
          represente le revenu PlanetLS calcule a partir de ce volume.
        </p>
      </DashboardPanel>

      <DashboardPanel title="Hypotheses modifiables et garde-fous">
        <div className={styles.decisionList}>
          <article className={styles.decisionCard}>
            <Users size={18} />
            <div>
              <strong>Les volumes clients sont des hypotheses de simulation</strong>
              <p>Aucun nombre d'abonnes n'est une donnee definitive tant qu'il n'est pas observe sur des pilotes ou cohortes reelles.</p>
            </div>
          </article>
          <article className={styles.decisionCard}>
            <CircleDollarSign size={18} />
            <div>
              <strong>Les prix de travail n'activent aucune offre commerciale</strong>
              <p>Le simulateur permet de tester une gamme free / payante sans toucher a l'offre Stripe de production.</p>
            </div>
          </article>
          <article className={styles.decisionCard}>
            <Calculator size={18} />
            <div>
              <strong>La marge brute depend des couts renseignes</strong>
              <p>Les couts estimes sont modifiables et ne doivent pas etre interpretes comme comptabilite definitive.</p>
            </div>
          </article>
        </div>
      </DashboardPanel>
    </div>
  );
}
