"use client";

import { useMemo } from "react";
import {
  CircleDollarSign,
  LockKeyhole,
  TestTube2,
  Users,
} from "lucide-react";
import { DashboardPanel } from "@/components/dashboard";
import {
  EXISTING_PRODUCTION_OFFERS,
  PRICING_DECISION_LOG,
  PRICING_PROFILES,
  PRICING_STRATEGIES,
} from "./data";
import {
  FINANCIAL_NEXT_ACTIONS,
  FINANCIAL_REFERENCE_NOTE,
  LOCKED_PRODUCTION_OFFER,
  PRIMARY_PRICING_STRATEGY,
  SCENARIO_DIRECTOR,
  TARGET_PRICING_PLANS,
} from "./sharedFinancialReference";
import type { PricingStrategyStatus, PricingStrategyType } from "./types";
import styles from "../page.module.scss";

type SimulationRow = {
  strategyId: string;
  scenario: "Prudent" | "Réaliste" | "Ambitieux";
  clients: number;
  averagePrice: number;
  mrr: number;
  arr: number;
  margin: string;
  treasury: string;
};

type PricingTestRow = {
  id: string;
  label: string;
  segment: string;
  offer: string;
  testedPrice: string;
  participants: string;
  result: string;
  nextAction: string;
};

type SimulationProjectionRow = {
  label: string;
  prudent: string;
  realistic: string;
  ambitious: string;
};

type SimulatedOfferCard = {
  id: string;
  name: string;
  profile: string;
  monthlyPrice: string;
  positioning: string;
  includes: string[];
  limits: string[];
  status: string;
  badge: string;
  properties: string;
  users: string;
  support: string;
  modules: string[];
};

type FeatureMatrixRow = {
  feature: string;
  essential: "Inclus" | "Limité" | "Option" | "Futur";
  pro: "Inclus" | "Limité" | "Option" | "Futur";
  portfolio: "Inclus" | "Limité" | "Option" | "Futur";
  note: string;
};

const PRICING_STRATEGY_STATUS_LABELS: Record<PricingStrategyStatus, string> = {
  idea: "Idée",
  under_review: "À analyser",
  simulating: "En simulation",
  ready_to_test: "À tester",
  testing: "Test en cours",
  validated: "Validée",
  rejected: "Rejetée",
  archived: "Archivée",
};

const EXECUTIVE_COMPARISON_MODELS = [
  {
    id: "profile",
    label: "Par profil",
    shortLabel: "Profil",
    velocity: 6,
    mrr: 8,
    clarity: 6,
    maintenance: 4,
    recommendation: "Bon fit métier, mais plus lourd à opérer dès le départ.",
  },
  {
    id: "tier",
    label: "Par niveau",
    shortLabel: "Niveau",
    velocity: 8,
    mrr: 7,
    clarity: 9,
    maintenance: 8,
    recommendation: "Le plus simple à lancer et à expliquer au marché.",
  },
  {
    id: "hybrid",
    label: "Hybride",
    shortLabel: "Hybride",
    velocity: 7,
    mrr: 9,
    clarity: 7,
    maintenance: 5,
    recommendation: "Le meilleur potentiel stratégique si l'exécution suit.",
  },
  {
    id: "commission",
    label: "Abonnement + commission",
    shortLabel: "Commission",
    velocity: 5,
    mrr: 8,
    clarity: 5,
    maintenance: 3,
    recommendation: "Attractif sur le papier, plus risqué en réalité d'exploitation.",
  },
] as const;

const SIMULATION_ROWS: SimulationRow[] = [
  {
    strategyId: "strategy-b",
    scenario: "Prudent",
    clients: 18,
    averagePrice: 29,
    mrr: 522,
    arr: 6264,
    margin: "56 %",
    treasury: "Entrée très accessible, besoin d'onboarding contenu",
  },
  {
    strategyId: "strategy-b",
    scenario: "Réaliste",
    clients: 32,
    averagePrice: 49,
    mrr: 1568,
    arr: 18816,
    margin: "64 %",
    treasury: "Bon équilibre entre lisibilité commerciale et valeur perçue",
  },
  {
    strategyId: "strategy-j",
    scenario: "Ambitieux",
    clients: 14,
    averagePrice: 95,
    mrr: 1330,
    arr: 15960,
    margin: "62 %",
    treasury: "Moins de volume, mais davantage d'accompagnement et de vente consultative",
  },
];

const SIMULATION_PROJECTION_ROWS: SimulationProjectionRow[] = [
  {
    label: "12 mois",
    prudent: "Traction locale stabilisée, offre simple à défendre.",
    realistic: "Base récurrente crédible avec premiers signaux de rétention.",
    ambitious: "MRR plus fort, mais besoin d'une machine support plus structurée.",
  },
  {
    label: "24 mois",
    prudent: "Rentabilité lente mais lisibilité commerciale conservée.",
    realistic: "Capacité à industrialiser un segment avant extension multi-zones.",
    ambitious: "Besoin d'orchestration produit, finance et opérations bien plus solide.",
  },
  {
    label: "36 mois",
    prudent: "SaaS de niche discipliné, croissance mesurée.",
    realistic: "Plateforme spécialisée avec base de revenu défendable et options d'upsell.",
    ambitious: "Trajectoire plus large, mais seulement si l'exécution reste nette et rentable.",
  },
];

const SIMULATED_OFFER_CARDS: SimulatedOfferCard[] = [
  {
    id: "offer-1",
    name: "Owner Pro",
    profile: "Proprietaires structures",
    monthlyPrice: "19,90 € HT",
    positioning: "Premier palier payant pour centraliser plusieurs logements sans friction equipe.",
    includes: ["Suivi portefeuille", "Automatisations simples", "Historique illimité"],
    limits: ["Pas de logique équipe avancée", "IA sous quota", "Périmètre propriétaire d'abord"],
    status: "Hypothèse prioritaire",
    badge: "Entrée payante",
    properties: "2 à 5 biens",
    users: "1 utilisateur",
    support: "Standard",
    modules: ["Portefeuille", "Automatisations", "Historique"],
  },
  {
    id: "offer-2",
    name: "Concierge Pro",
    profile: "Concierges et conciergeries",
    monthlyPrice: "49 € HT",
    positioning: "Palier cible pour un cockpit métier plus central dans l'exploitation quotidienne.",
    includes: ["Coordination multi-acteurs", "Suivi propriétaire", "Base de reporting renforcée"],
    limits: ["Modules premium séparés", "Pas de commission intégrée par défaut", "Périmètre encore simulé"],
    status: "Palier cible",
    badge: "Palier cible",
    properties: "5 à 20 biens",
    users: "3 à 8 utilisateurs",
    support: "Priorisé",
    modules: ["Reporting", "Coordination", "Suivi propriétaire"],
  },
  {
    id: "offer-3",
    name: "Business",
    profile: "Conciergeries multi-biens",
    monthlyPrice: "149 € HT",
    positioning: "Palier structure pour les equipes multi-logements qui ont besoin de volume, de reporting et d'appui prioritaire.",
    includes: ["Multi-utilisateurs", "Reporting avancé", "Support prioritaire"],
    limits: ["Vente plus exigeante", "Périmètre à clarifier avant industrialisation", "Toujours distinct de l'offre Stripe actuelle"],
    status: "Évolution structurée",
    badge: "Scale",
    properties: "15 à 40 biens",
    users: "Équipe étendue",
    support: "Prioritaire",
    modules: ["Coordination", "Reporting", "Support"],
  },
];

const FEATURE_MATRIX_ROWS: FeatureMatrixRow[] = [
  {
    feature: "Demandes et missions",
    essential: "Inclus",
    pro: "Inclus",
    portfolio: "Inclus",
    note: "Socle non négociable pour la promesse métier.",
  },
  {
    feature: "Planning opérationnel",
    essential: "Inclus",
    pro: "Inclus",
    portfolio: "Inclus",
    note: "Visible dès l'entrée pour soutenir l'usage hebdomadaire.",
  },
  {
    feature: "Coordination multi-acteurs",
    essential: "Limité",
    pro: "Inclus",
    portfolio: "Inclus",
    note: "Différenciation naturelle du palier Pro.",
  },
  {
    feature: "Reporting propriétaire",
    essential: "Limité",
    pro: "Inclus",
    portfolio: "Inclus",
    note: "À rendre lisible sans noyer l'offre d'entrée.",
  },
  {
    feature: "Automatisations",
    essential: "Futur",
    pro: "Option",
    portfolio: "Option",
    note: "Bonne logique de module complémentaire ensuite.",
  },
  {
    feature: "IA et suggestions",
    essential: "Futur",
    pro: "Option",
    portfolio: "Option",
    note: "À monétiser à part si coût variable confirmé.",
  },
  {
    feature: "Tarification par parc",
    essential: "Futur",
    pro: "Futur",
    portfolio: "Inclus",
    note: "Spécifique à la logique multi-biens.",
  },
];

const PRICING_TEST_ROWS: PricingTestRow[] = [
  {
    id: "test-1",
    label: "Entretien tarifaire conciergerie",
    segment: "Petites conciergeries structurées",
    offer: "Owner Pro / Concierge Pro / Business",
    testedPrice: "19,90 € / 49 € / 149 €",
    participants: "8 à 12",
    result: "À préparer",
    nextAction: "Valider les objections au prix d'entrée et à la valeur perçue.",
  },
  {
    id: "test-2",
    label: "Test abonnement vs commission",
    segment: "Concierges avec flux récurrents",
    offer: "SaaS pur vs SaaS + commission",
    testedPrice: "29 € + 0 % / 19 € + 6 %",
    participants: "5 à 8",
    result: "À cadrer",
    nextAction: "Mesurer la préférence de compréhension avant de mesurer l'acceptation.",
  },
  {
    id: "test-3",
    label: "Test par logement",
    segment: "Conciergeries multi-biens",
    offer: "Tarif portefeuille",
    testedPrice: "3 paliers de logements",
    participants: "5 à 10",
    result: "À simuler",
    nextAction: "Vérifier si la logique de seuil est perçue comme juste ou punitive.",
  },
];

const STRATEGY_SCORE_BY_TYPE: Record<PricingStrategyType, { velocity: number; mrr: number; clarity: number; maintenance: number }> = {
  profile_based: { velocity: 6, mrr: 8, clarity: 6, maintenance: 4 },
  tier_based: { velocity: 8, mrr: 7, clarity: 9, maintenance: 8 },
  hybrid: { velocity: 7, mrr: 9, clarity: 7, maintenance: 5 },
  subscription_commission: { velocity: 5, mrr: 8, clarity: 5, maintenance: 3 },
  per_property: { velocity: 7, mrr: 8, clarity: 8, maintenance: 6 },
  per_user: { velocity: 6, mrr: 7, clarity: 7, maintenance: 6 },
  freemium: { velocity: 4, mrr: 7, clarity: 8, maintenance: 3 },
  addons: { velocity: 5, mrr: 8, clarity: 6, maintenance: 4 },
  usage_based: { velocity: 4, mrr: 7, clarity: 5, maintenance: 3 },
  enterprise: { velocity: 5, mrr: 8, clarity: 6, maintenance: 5 },
} as const;

function formatNullableMoney(value: number | null | undefined) {
  if (typeof value !== "number") return "Non défini";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getFeatureTone(value: FeatureMatrixRow["essential"]) {
  if (value === "Inclus") return "strong";
  if (value === "Limité") return "good";
  if (value === "Option") return "mid";
  return "weak";
}

export function EconomicModelTab() {
  const pricingProfileMap = useMemo(
    () => new Map(PRICING_PROFILES.map((profile) => [profile.id, profile])),
    [],
  );

  const economicSummary = [
    {
      label: "Stratégies suivies",
      value: String(PRICING_STRATEGIES.length),
      hint: "Inventaire initial du module de pricing",
    },
    {
      label: "Hypothèse prioritaire",
      value: PRIMARY_PRICING_STRATEGY.name,
      hint: PRIMARY_PRICING_STRATEGY.priorityLabel,
    },
    {
      label: "Offres de production",
      value: String(EXISTING_PRODUCTION_OFFERS.length),
      hint: "Références réelles séparées des simulations",
    },
    {
      label: "Décisions consignées",
      value: String(PRICING_DECISION_LOG.length),
      hint: "Journal initial des arbitrages tarifaires",
    },
  ];

  const executiveComparisonCards = useMemo(
    () =>
      EXECUTIVE_COMPARISON_MODELS.map((model) => {
        const total = model.velocity + model.mrr + model.clarity + model.maintenance;
        const average = Math.round((total / 4) * 10) / 10;
        return {
          ...model,
          total,
          average,
        };
      }).sort((left, right) => right.total - left.total),
    [],
  );

  const strategyCards = useMemo(
    () =>
      PRICING_STRATEGIES.map((strategy) => {
        const scoreSet = STRATEGY_SCORE_BY_TYPE[strategy.type];
        const scoreAverage = Math.round((((scoreSet.velocity + scoreSet.mrr + scoreSet.clarity + scoreSet.maintenance) / 4) * 10)) / 10;

        return {
          ...strategy,
          scoreAverage,
        };
      }),
    [],
  );

  const simulationKpis = useMemo(() => {
    const bestMrr = Math.max(...SIMULATION_ROWS.map((row) => row.mrr));
    const bestArr = Math.max(...SIMULATION_ROWS.map((row) => row.arr));
    const bestAveragePrice = Math.max(...SIMULATION_ROWS.map((row) => row.averagePrice));

    return [
      {
        label: "MRR simulé max",
        value: formatNullableMoney(bestMrr),
        hint: "Lecture haute actuelle des scénarios comparés",
      },
      {
        label: "ARR simulé max",
        value: formatNullableMoney(bestArr),
        hint: "Projection annuelle théorique la plus élevée",
      },
      {
        label: "Prix moyen max",
        value: formatNullableMoney(bestAveragePrice),
        hint: "Repère de pricing moyen dans les hypothèses visibles",
      },
      {
        label: "Scénario directeur",
        value: "Réaliste",
        hint: "Le meilleur point d'équilibre actuel pour la lecture board",
      },
    ];
  }, []);

  const simulationExecutiveCards = useMemo(
    () =>
      SIMULATION_ROWS.map((row) => {
        const strategy = PRICING_STRATEGIES.find((item) => item.id === row.strategyId);
        const runRate = Math.round(row.arr / 12);
        const efficiency = Math.round((row.mrr / Math.max(row.clients, 1)) * 10) / 10;

        return {
          ...row,
          strategyName: strategy?.name ?? row.strategyId,
          runRate,
          efficiency,
        };
      }),
    [],
  );

  const profileHighlights = useMemo(
    () => [
      {
        label: "Propriétaires",
        value: "Lecture simple",
        note: "Une offre trop dense serait peu lisible sans bénéfice très concret immédiatement perçu.",
      },
      {
        label: "Concierges",
        value: "Cœur de cible",
        note: "Le pricing doit d'abord résoudre un problème d'exploitation quotidien avant de se sophistiquer.",
      },
      {
        label: "Prestataires",
        value: "Monétisation plus fine",
        note: "Leur valeur peut venir plus tard via options, leads qualifiés ou usages ciblés.",
      },
    ],
    [],
  );

  const protectedOffer = LOCKED_PRODUCTION_OFFER;

  return (
    <section className={styles.economicModelPage}>
      <DashboardPanel title="Synthèse du module">
        <div className={styles.highlightGrid}>
          {economicSummary.map((item) => (
            <article key={item.label} className={styles.highlightCard}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.hint}</p>
            </article>
          ))}
        </div>
        <p className={styles.sectionNote}>
          Ce module sert d&apos;atelier de décision. Il sépare clairement les hypothèses de pricing,
          les offres réelles et les tests à préparer.
        </p>
      </DashboardPanel>

      <section className={styles.economicHero}>
        <div className={styles.economicHeroContent}>
          <span className={styles.eyebrow}>Modèle économique</span>
          <h3>Un cadrage business continu, sans sous-onglets ni rupture de lecture</h3>
          <p>
            La page suit désormais l&apos;ordre naturel d&apos;une décision business :
            gouvernance, stratégies, architecture des offres, simulations, comparaison, tests puis décisions.
          </p>
          <p className={styles.sectionNote}>{FINANCIAL_REFERENCE_NOTE}</p>
        </div>
        <div className={styles.economicHeroAside}>
          <article className={styles.economicHeroNote}>
            <strong>Décision tarifaire à préparer</strong>
            <p>
              Confirmer la lecture {TARGET_PRICING_PLANS.map((plan) => plan.price).join(" / ")}
              , puis complexifier l&apos;offre seulement après preuve terrain.
            </p>
          </article>
          <article className={styles.economicHeroNote}>
            <strong>Règle non négociable</strong>
            <p>Aucune simulation ne modifie l&apos;offre réelle Stripe ni le parcours de production actuel.</p>
          </article>
          <article className={styles.economicHeroNote}>
            <strong>Scénario directeur</strong>
            <p>
              {SCENARIO_DIRECTOR.label} · mix annuel {SCENARIO_DIRECTOR.annualPlanMixPct}% · GMV
              {" "}{SCENARIO_DIRECTOR.marketplaceGmvMonthly} € / mois.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.economicSectionStack}>
        <div className={styles.economicSectionBlock}>
          <div className={styles.economicSectionHeading}>
            <span className={styles.sectionIndex}>01</span>
            <div>
              <h3>Vue d&apos;ensemble</h3>
              <p>Le cadre de décision, les garde-fous et l&apos;offre de production à protéger.</p>
            </div>
          </div>

          <section className={styles.economicWideGrid}>
            <DashboardPanel title="Règles de gouvernance">
              <div className={styles.decisionList}>
                <article className={styles.decisionCard}>
                  <strong>1. Aucun lien direct simulation vers production</strong>
                  <p>Une hypothèse tarifaire ne peut pas devenir une offre active sans action explicite future.</p>
                </article>
                <article className={styles.decisionCard}>
                  <strong>2. Stripe reste hors périmètre</strong>
                  <p>Aucun produit, prix ou abonnement Stripe n&apos;est modifié dans cette phase.</p>
                </article>
                <article className={styles.decisionCard}>
                  <strong>3. Les données réelles sont identifiées</strong>
                  <p>Les offres existantes portent une source réelle et un verrou de production.</p>
                </article>
                {FINANCIAL_NEXT_ACTIONS.slice(0, 1).map((action) => (
                  <article key={action} className={styles.decisionCard}>
                    <strong>4. Lecture direction</strong>
                    <p>{action}</p>
                  </article>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Bloc protégé - Conciergerie Pro existante">
              <div className={styles.protectedOfferCard}>
                <div className={styles.protectedOfferHeader}>
                  <div className={styles.strategyHeading}>
                    <span className={styles.eyebrow}>Production verrouillée</span>
                    <h3>{protectedOffer.name}</h3>
                  </div>
                  <span className={styles.scorePill} data-tone="strong">
                    {protectedOffer.badge}
                  </span>
                </div>
                <p>
                  Cette offre est déjà reliée au checkout réel et doit rester visible comme référence de production,
                  sans être altérée par le futur atelier de simulation.
                </p>
                <div className={styles.protectedOfferMeta}>
                  <article className={styles.summaryCard}>
                    <LockKeyhole size={18} />
                    <div>
                      <strong>Plan Stripe</strong>
                      <p>{protectedOffer.stripePlanCode}</p>
                    </div>
                  </article>
                  <article className={styles.summaryCard}>
                    <CircleDollarSign size={18} />
                    <div>
                      <strong>Prix mensuel affiché</strong>
                      <p>{formatNullableMoney(protectedOffer.monthlyPrice)}</p>
                    </div>
                  </article>
                  <article className={styles.summaryCard}>
                    <Users size={18} />
                    <div>
                      <strong>Profil cible</strong>
                      <p>
                        {protectedOffer.targetProfileIds
                          .map((profileId) => pricingProfileMap.get(profileId)?.label ?? profileId)
                          .join(", ")}
                      </p>
                    </div>
                  </article>
                </div>
                <div className={styles.tableWrap}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Champ</th>
                        <th>Valeur</th>
                        <th>Nature</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Source</td>
                        <td>Réelle</td>
                        <td>Vérité de production</td>
                      </tr>
                      <tr>
                        <td>Statut</td>
                        <td>{protectedOffer.status}</td>
                        <td>Offre existante</td>
                      </tr>
                      <tr>
                        <td>Prix mensuel</td>
                        <td>{formatNullableMoney(protectedOffer.monthlyPrice)}</td>
                        <td>Référence visible côté abonnement</td>
                      </tr>
                      <tr>
                        <td>Modification depuis ce module</td>
                        <td>Interdite</td>
                        <td>Bloc protégé</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </DashboardPanel>
          </section>
        </div>

        <div className={styles.economicSectionBlock}>
          <div className={styles.economicSectionHeading}>
            <span className={styles.sectionIndex}>02</span>
            <div>
              <h3>Stratégies</h3>
              <p>Les modèles de revenus sont visibles d&apos;un coup d&apos;œil, sans changer d&apos;état d&apos;écran.</p>
            </div>
          </div>

          <section className={styles.strategyCardGrid}>
            {strategyCards.map((strategy) => (
              <article key={strategy.id} className={styles.strategyCard}>
                <div className={styles.strategyCardHeader}>
                  <div>
                    <span className={styles.eyebrow}>{strategy.priorityLabel}</span>
                    <h3>{strategy.name}</h3>
                  </div>
                  <div className={styles.strategyScoreStack}>
                    <span className={styles.strategyScoreBadge}>
                      <span>Score moyen</span>
                      <strong>{strategy.scoreAverage}/10</strong>
                    </span>
                    <span className={styles.scorePill} data-tone={strategy.status === "simulating" ? "good" : "mid"}>
                      {PRICING_STRATEGY_STATUS_LABELS[strategy.status]}
                    </span>
                  </div>
                </div>
                <p>{strategy.description}</p>
                <div className={styles.strategyMetaGrid}>
                  <div className={styles.strategyMetaItem}>
                    <span>Profils :</span>
                    <strong>
                      {strategy.targetProfileIds
                        .map((profileId) => pricingProfileMap.get(profileId)?.label ?? profileId)
                        .join(", ")}
                    </strong>
                  </div>
                  <div className={styles.strategyMetaItem}>
                    <span>Revenu visé :</span>
                    <strong>{strategy.targetRevenue}</strong>
                  </div>
                  <div className={styles.strategyMetaItem}>
                    <span>Complexité :</span>
                    <strong>{strategy.complexityLabel}</strong>
                  </div>
                  <div className={styles.strategyMetaItem}>
                    <span>Délai :</span>
                    <strong>{strategy.implementationDelay}</strong>
                  </div>
                </div>
                <div className={styles.strategyColumnGrid}>
                  <div>
                    <span className={styles.strategyListTitle}>Avantages</span>
                    <ul className={styles.plainList}>
                      {strategy.advantages.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className={styles.strategyListTitle}>Risques</span>
                    <ul className={styles.plainList}>
                      {strategy.risks.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </div>

        <div className={styles.economicSectionBlock}>
          <div className={styles.economicSectionHeading}>
            <span className={styles.sectionIndex}>03</span>
            <div>
              <h3>Offres & profils</h3>
              <p>Les hypothèses d&apos;offres, les profils cibles et la structure commerciale future.</p>
            </div>
          </div>

          <section className={styles.offerExecutiveGrid}>
            {SIMULATED_OFFER_CARDS.map((offer) => (
              <article key={offer.id} className={styles.offerExecutiveCard}>
                <div className={styles.offerExecutiveHeader}>
                  <div>
                    <span className={styles.eyebrow}>{offer.status}</span>
                    <h4>{offer.name}</h4>
                  </div>
                  <div className={styles.offerExecutivePrice}>
                    <strong>{offer.monthlyPrice}</strong>
                    <span>{offer.profile}</span>
                  </div>
                </div>

                <div className={styles.offerBadgeRow}>
                  <span className={styles.scorePill} data-tone="strong">{offer.badge}</span>
                  <span className={styles.scorePill} data-tone="mid">{offer.properties}</span>
                  <span className={styles.scorePill} data-tone="good">{offer.users}</span>
                </div>

                <p>{offer.positioning}</p>

                <div className={styles.offerMiniEditorGrid}>
                  <article className={styles.offerMiniEditorCard}>
                    <span>Support</span>
                    <strong>{offer.support}</strong>
                  </article>
                  <article className={styles.offerMiniEditorCard}>
                    <span>Modules visibles</span>
                    <strong>{offer.modules.length}</strong>
                  </article>
                  <article className={styles.offerMiniEditorCard}>
                    <span>Limites clés</span>
                    <strong>{offer.limits.length}</strong>
                  </article>
                </div>

                <div className={styles.offerModuleRow}>
                  {offer.modules.map((module) => (
                    <span key={module} className={styles.scorePill} data-tone="good">
                      {module}
                    </span>
                  ))}
                </div>

                <div className={styles.offerExecutiveColumns}>
                  <div>
                    <span className={styles.strategyListTitle}>Inclut</span>
                    <ul className={styles.plainList}>
                      {offer.includes.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className={styles.strategyListTitle}>À cadrer</span>
                    <ul className={styles.plainList}>
                      {offer.limits.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className={styles.economicWideGrid}>
            <DashboardPanel title="Profils tarifaires de référence">
              <div className={styles.profileInsightGrid}>
                {profileHighlights.map((profile) => (
                  <article key={profile.label} className={styles.profileInsightCard}>
                    <span>{profile.label}</span>
                    <strong>{profile.value}</strong>
                    <p>{profile.note}</p>
                  </article>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Profils disponibles dans le socle">
              <div className={styles.decisionList}>
                {PRICING_PROFILES.map((profile) => (
                  <article key={profile.id} className={styles.decisionCard}>
                    <strong>{profile.label}</strong>
                    <p>{profile.description}</p>
                  </article>
                ))}
              </div>
            </DashboardPanel>
          </section>

          <section className={styles.economicWideGrid}>
            <DashboardPanel title="Cadre produit de la future offre">
              <div className={styles.offerBuilderGrid}>
                <article className={styles.offerBuilderCard}>
                  <strong>Socle visible</strong>
                  <p>Abonnement principal lisible, promesse courte et bénéfice d'exploitation immédiat.</p>
                </article>
                <article className={styles.offerBuilderCard}>
                  <strong>Modules séparés</strong>
                  <p>IA, automatisations, reporting avancé et API restent des briques à monétiser ensuite.</p>
                </article>
                <article className={styles.offerBuilderCard}>
                  <strong>Limites explicites</strong>
                  <p>Biens, utilisateurs, profondeur de reporting ou services premium doivent être rendus visibles sans confusion.</p>
                </article>
              </div>
            </DashboardPanel>

            <DashboardPanel title="Périmètre de la prochaine étape">
              <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Bloc</th>
                      <th>Prévu ensuite</th>
                      <th>Contraintes actuelles</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Éditeur d&apos;offres simulées</td>
                      <td>Créer des hypothèses par profil, niveau et modules</td>
                      <td>Aucune écriture Stripe, aucune activation automatique</td>
                    </tr>
                    <tr>
                      <td>Matrice des fonctionnalités</td>
                      <td>Comparer inclus, limité, option, usage, indisponible</td>
                      <td>Doit rester lisible sur mobile</td>
                    </tr>
                    <tr>
                      <td>Scénarios financiers</td>
                      <td>Prudent, réaliste, ambitieux par stratégie</td>
                      <td>Toutes les valeurs doivent être taguées comme hypothèses</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </DashboardPanel>
          </section>

          <DashboardPanel title="Matrice de fonctionnalités">
            <div className={styles.featureLegend}>
              <span className={styles.scorePill} data-tone="strong">Inclus</span>
              <span className={styles.scorePill} data-tone="good">Limité</span>
              <span className={styles.scorePill} data-tone="mid">Option</span>
              <span className={styles.scorePill} data-tone="weak">Futur</span>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Fonctionnalité</th>
                    <th>Essentiel</th>
                    <th>Pro</th>
                    <th>Portefeuille</th>
                    <th>Lecture</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_MATRIX_ROWS.map((row) => (
                    <tr key={row.feature}>
                      <td>{row.feature}</td>
                      <td><span className={styles.scorePill} data-tone={getFeatureTone(row.essential)}>{row.essential}</span></td>
                      <td><span className={styles.scorePill} data-tone={getFeatureTone(row.pro)}>{row.pro}</span></td>
                      <td><span className={styles.scorePill} data-tone={getFeatureTone(row.portfolio)}>{row.portfolio}</span></td>
                      <td>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className={styles.sectionNote}>
              Cette matrice montre où se situe la valeur visible, où commencent les limites et quelles briques
              doivent rester optionnelles ou futures.
            </p>
          </DashboardPanel>
        </div>

        <div className={styles.economicSectionBlock}>
          <div className={styles.economicSectionHeading}>
            <span className={styles.sectionIndex}>04</span>
            <div>
              <h3>Simulations</h3>
              <p>Les hypothèses clés prennent ici une forme KPI, projection et lecture investisseur.</p>
            </div>
          </div>

          <section className={styles.simulationKpiGrid}>
            {simulationKpis.map((item) => (
              <article key={item.label} className={styles.simulationKpiCard}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.hint}</p>
              </article>
            ))}
          </section>

          <section className={styles.simulationExecutiveGrid}>
            {simulationExecutiveCards.map((row, index) => (
              <article
                key={`${row.strategyId}-${row.scenario}`}
                className={styles.simulationExecutiveCard}
                data-featured={row.scenario === "Réaliste" ? "true" : "false"}
              >
                <div className={styles.simulationExecutiveHeader}>
                  <div>
                    <span className={styles.eyebrow}>
                      {row.scenario === "Réaliste" ? "Scénario directeur" : index === 0 ? "Lecture prudente" : "Lecture haute"}
                    </span>
                    <h4>{row.scenario}</h4>
                  </div>
                  <span className={styles.scorePill} data-tone={row.scenario === "Réaliste" ? "strong" : "mid"}>
                    {row.strategyName}
                  </span>
                </div>

                <div className={styles.simulationExecutiveMetrics}>
                  <article className={styles.simulationExecutiveMetric}>
                    <span>MRR</span>
                    <strong>{formatNullableMoney(row.mrr)}</strong>
                  </article>
                  <article className={styles.simulationExecutiveMetric}>
                    <span>ARR</span>
                    <strong>{formatNullableMoney(row.arr)}</strong>
                  </article>
                  <article className={styles.simulationExecutiveMetric}>
                    <span>Clients</span>
                    <strong>{row.clients}</strong>
                  </article>
                  <article className={styles.simulationExecutiveMetric}>
                    <span>Prix moyen</span>
                    <strong>{formatNullableMoney(row.averagePrice)}</strong>
                  </article>
                </div>

                <div className={styles.simulationInvestorStrip}>
                  <article className={styles.simulationInvestorChip}>
                    <span>Run rate mensuel</span>
                    <strong>{formatNullableMoney(row.runRate)}</strong>
                  </article>
                  <article className={styles.simulationInvestorChip}>
                    <span>MRR / client</span>
                    <strong>{formatNullableMoney(row.efficiency)}</strong>
                  </article>
                  <article className={styles.simulationInvestorChip}>
                    <span>Marge</span>
                    <strong>{row.margin}</strong>
                  </article>
                </div>

                <p>{row.treasury}</p>
              </article>
            ))}
          </section>

          <section className={styles.simulationProjectionPanel}>
            <div className={styles.simulationProjectionIntro}>
              <span className={styles.eyebrow}>Projection investisseur</span>
              <h4>Ce que racontent les scénarios dans le temps</h4>
              <p>
                L&apos;objectif n&apos;est pas de figer une vérité financière, mais de visualiser le récit que chaque scénario
                permet de défendre devant un board, une banque ou un partenaire.
              </p>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Horizon</th>
                    <th>Prudent</th>
                    <th>Réaliste</th>
                    <th>Ambitieux</th>
                  </tr>
                </thead>
                <tbody>
                  {SIMULATION_PROJECTION_ROWS.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td>{row.prudent}</td>
                      <td>{row.realistic}</td>
                      <td>{row.ambitious}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className={styles.economicSectionBlock}>
          <div className={styles.economicSectionHeading}>
            <span className={styles.sectionIndex}>05</span>
            <div>
              <h3>Comparaison</h3>
              <p>Un cadre d&apos;arbitrage plus lisible qu&apos;un changement d&apos;onglet répété.</p>
            </div>
          </div>

          <section className={styles.executiveComparisonGrid}>
            {executiveComparisonCards.map((model, index) => (
              <article
                key={model.id}
                className={styles.executiveComparisonCard}
                data-rank={index === 0 ? "top" : index === executiveComparisonCards.length - 1 ? "low" : "mid"}
              >
                <div className={styles.executiveComparisonHeader}>
                  <div>
                    <span className={styles.eyebrow}>
                      {index === 0 ? "Leader actuel" : index === 1 ? "Très solide" : "À surveiller"}
                    </span>
                    <h4>{model.label}</h4>
                  </div>
                  <div className={styles.executiveScoreBadge}>
                    <strong>{model.average}/10</strong>
                    <span>score moyen</span>
                  </div>
                </div>

                <div className={styles.executiveBars}>
                  <div className={styles.executiveBarRow}>
                    <span>Vitesse</span>
                    <div className={styles.executiveBarTrack}>
                      <div className={styles.executiveBarFill} style={{ width: `${model.velocity * 10}%` }} />
                    </div>
                    <strong>{model.velocity}/10</strong>
                  </div>
                  <div className={styles.executiveBarRow}>
                    <span>MRR</span>
                    <div className={styles.executiveBarTrack}>
                      <div className={styles.executiveBarFill} style={{ width: `${model.mrr * 10}%` }} />
                    </div>
                    <strong>{model.mrr}/10</strong>
                  </div>
                  <div className={styles.executiveBarRow}>
                    <span>Clarté</span>
                    <div className={styles.executiveBarTrack}>
                      <div className={styles.executiveBarFill} style={{ width: `${model.clarity * 10}%` }} />
                    </div>
                    <strong>{model.clarity}/10</strong>
                  </div>
                  <div className={styles.executiveBarRow}>
                    <span>Maintenance</span>
                    <div className={styles.executiveBarTrack}>
                      <div className={styles.executiveBarFill} style={{ width: `${model.maintenance * 10}%` }} />
                    </div>
                    <strong>{model.maintenance}/10</strong>
                  </div>
                </div>

                <p>{model.recommendation}</p>
              </article>
            ))}
          </section>

          <p className={styles.sectionNote}>
            Lecture simplifiée : le modèle par niveau est désormais la direction la plus lisible pour tester
            `0 / 19,90 / 49 / 149`, tandis que l&apos;hybride et l&apos;abonnement + commission restent plus exigeants à exécuter.
          </p>
        </div>

        <div className={styles.economicSectionBlock}>
          <div className={styles.economicSectionHeading}>
            <span className={styles.sectionIndex}>06</span>
            <div>
              <h3>Tests tarifaires</h3>
              <p>Un espace de préparation, pas un outil de mise en production directe.</p>
            </div>
          </div>

          <section className={styles.economicWideGrid}>
            <DashboardPanel title="Backlog des tests tarifaires">
              <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Segment</th>
                      <th>Offre</th>
                      <th>Prix testé</th>
                      <th>Participants</th>
                      <th>Résultat</th>
                      <th>Prochaine action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRICING_TEST_ROWS.map((row) => (
                      <tr key={row.id}>
                        <td>{row.label}</td>
                        <td>{row.segment}</td>
                        <td>{row.offer}</td>
                        <td>{row.testedPrice}</td>
                        <td>{row.participants}</td>
                        <td>{row.result}</td>
                        <td>{row.nextAction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DashboardPanel>

            <DashboardPanel title="Cadre d'exécution recommandé">
              <div className={styles.decisionList}>
                <article className={styles.decisionCard}>
                  <TestTube2 size={18} />
                  <div>
                    <strong>Commencer par les entretiens tarifaires</strong>
                    <p>Ils permettent de comprendre la perception de valeur avant de multiplier les variantes d&apos;offre.</p>
                  </div>
                </article>
                <article className={styles.decisionCard}>
                  <TestTube2 size={18} />
                  <div>
                    <strong>Comparer peu de scénarios à la fois</strong>
                    <p>Deux ou trois formats suffisent pour éviter de brouiller la lecture commerciale.</p>
                  </div>
                </article>
              </div>
            </DashboardPanel>
          </section>
        </div>

        <div className={styles.economicSectionBlock}>
          <div className={styles.economicSectionHeading}>
            <span className={styles.sectionIndex}>07</span>
            <div>
              <h3>Décisions</h3>
              <p>La mémoire de pilotage et les prochaines briques à raccorder.</p>
            </div>
          </div>

          <section className={styles.grid}>
            <DashboardPanel title="Journal initial des décisions">
              <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Décision</th>
                      <th>Raison</th>
                      <th>Conséquence</th>
                      <th>Prochaine revue</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRICING_DECISION_LOG.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.date}</td>
                        <td>{entry.decision}</td>
                        <td>{entry.rationale}</td>
                        <td>{entry.consequence}</td>
                        <td>{entry.nextReview}</td>
                        <td>{entry.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DashboardPanel>

            <DashboardPanel title="Ligne directrice">
              <div className={styles.decisionList}>
                <article className={styles.decisionCard}>
                  <strong>Décider plus tard, documenter maintenant</strong>
                  <p>Le module sert d&apos;outil d&apos;aide à la décision, pas de moteur de publication commerciale.</p>
                </article>
                <article className={styles.decisionCard}>
                  <strong>Prochaine évolution prévue</strong>
                  <p>Brancher l&apos;éditeur d&apos;offres simulées et les pondérations modifiables sur ce socle.</p>
                </article>
              </div>
            </DashboardPanel>
          </section>
        </div>
      </section>
    </section>
  );
}
