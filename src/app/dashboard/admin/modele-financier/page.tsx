import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CircleDollarSign,
  Coins,
  Cpu,
  CreditCard,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { auth } from "@/server/auth/authOptions";
import { DashboardLayout, DashboardPanel } from "@/components/dashboard";
import { Card, CardBody, CardHeader } from "@/components/ui";
import {
  ACTIVE_PRICING_DECISIONS,
  FINANCIAL_BENCHMARK_TIERS,
  FINANCIAL_NEXT_ACTIONS,
  FINANCIAL_PERSONA_PRICING_ROWS,
  FINANCIAL_REFERENCE_NOTE,
  LOCKED_PRODUCTION_OFFER,
  PRIMARY_PRICING_STRATEGY,
  SCENARIO_DIRECTOR,
  TARGET_PRICING_PLANS,
  TARGET_SIMULATION_TIERS,
  UPGRADE_TRIGGER_ROWS,
  VARIABLE_COST_ROWS,
} from "../pilotage/economic-model/sharedFinancialReference";
import styles from "./page.module.scss";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Modèle financier | PlanetLS",
  description:
    "Page admin dédiée au benchmark tarifaire, à la grille cible PlanetLS et aux hypothèses de unit economics.",
};

export default async function AdminFinancialModelPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "admin" && role !== "super_admin") {
    redirect("/login");
  }

  return (
    <DashboardLayout
      persona="admin"
      title="Modèle financier"
      subtitle="Benchmark 2026, grille cible PlanetLS et hypothèses de conversion à piloter."
      navTitle="Pilotage admin"
      navItems={[
        { label: "Vue d'ensemble", href: "/dashboard/admin" },
        { label: "Pilotage business", href: "/dashboard/admin/pilotage" },
        { label: "Modèle financier", href: "/dashboard/admin/modele-financier" },
        { label: "Personas", href: "/dashboard/admin/personas" },
        { label: "Contrôle détaillé", href: "/dashboard/admin/controle" },
        { label: "Développement", href: "/dashboard/admin/developpement" },
      ]}
      stats={[
        { label: "Paliers marché", value: "3", hint: "Entrée, milieu, haut de gamme" },
        { label: "Grille cible", value: "4 plans", hint: "Free à Business" },
        { label: "Coûts variables", value: "4 postes", hint: "Infra, IA, paiement, SMS" },
        { label: "Focus court terme", value: "Concierge Pro", hint: "Cœur de cible" },
      ]}
      actions={[]}
      hideQuickActions
      activity={[
        {
          id: "financial-pricing",
          title: "Grille cible PlanetLS",
          description: "Une lecture simple de l'offre 0 € / 19,90 € / 49 € / 149 €.",
          href: "/dashboard/admin/modele-financier",
        },
        {
          id: "financial-benchmark",
          title: "Benchmark marché 2026",
          description: "Le marché facture déjà par niveau, par bien ou sur devis.",
          href: "/dashboard/admin/modele-financier",
        },
        {
          id: "financial-unit-economics",
          title: "Unit economics",
          description: "Les coûts variables critiques sont identifiés avant simulation avancée.",
          href: "/dashboard/admin/modele-financier",
        },
      ]}
      notifications={[
        {
          id: "financial-note",
          title: "Cette page consolide un benchmark et des hypothèses : rien n'est branché en production Stripe ici.",
          level: "info",
          href: "/dashboard/admin/modele-financier",
        },
      ]}
      shortcuts={[
        { label: "Cockpit", href: "/dashboard/admin" },
        { label: "Pilotage", href: "/dashboard/admin/pilotage" },
        { label: "Modèle financier", href: "/dashboard/admin/modele-financier" },
        { label: "Développement", href: "/dashboard/admin/developpement" },
      ]}
      profile={{ name: "Direction PlanetLS", subtitle: "Pricing & rentabilité", badge: "Finance" }}
    >
      <section className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Admin → Modèle financier</span>
            <h2>Une lecture claire du pricing PlanetLS avant d'industrialiser les simulations</h2>
            <p>
              Le benchmark 2026 montre un marché déjà structuré par niveau de service, par volume de biens
              ou par vente sur devis. L'opportunité PlanetLS est de garder un SaaS lisible tout en captant
              de la valeur sur la transaction, la coordination et l'usage avancé.
            </p>
          </div>

          <div className={styles.heroStats}>
            <article>
              <TrendingUp size={18} />
              <strong>Positionnement</strong>
              <span>SaaS + ops + marketplace</span>
            </article>
            <article>
              <CircleDollarSign size={18} />
              <strong>Plan cible</strong>
              <span>49 € / mois pour Concierge Pro</span>
            </article>
            <article>
              <Target size={18} />
              <strong>North star</strong>
              <span>Valeur perçue par logement et par équipe</span>
            </article>
            <article>
              <Sparkles size={18} />
              <strong>Risque à cadrer</strong>
              <span>Coûts variables IA et notifications</span>
            </article>
          </div>
        </section>

        <section className={styles.sectionStack}>
          <DashboardPanel title="Benchmark marché 2026">
            <div className={styles.sectionHeader}>
              <h3>Trois étages de marché clairement visibles</h3>
              <p>
                Le marché se découpe déjà entre solutions volume d'entrée, outils plus riches pour structures
                intermédiaires et plateformes haut de gamme vendues sur devis.
              </p>
            </div>

            <div className={styles.grid}>
              {FINANCIAL_BENCHMARK_TIERS.map((tier) => (
                <Card key={tier.title} tone="soft" className={styles.card}>
                  <CardHeader className={styles.cardHeader}>
                    <span className={styles.cardIcon}>
                      <Coins size={18} />
                    </span>
                    <div>
                      <span>{tier.audience}</span>
                      <strong>{tier.title}</strong>
                    </div>
                  </CardHeader>
                  <CardBody className={styles.cardBody}>
                    <p className={styles.priceRange}>{tier.range}</p>
                    <p>{tier.positioning}</p>
                    <ul className={styles.bulletList}>
                      {tier.examples.map((example) => (
                        <li key={example}>{example}</li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel title="Lecture stratégique PlanetLS">
            <div className={styles.callout}>
              <div className={styles.calloutIcon}>
                <Target size={20} />
              </div>
              <div>
                <strong>Opportunité centrale</strong>
                <p>{FINANCIAL_REFERENCE_NOTE}</p>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Socle economic-model déjà connecté">
            <div className={styles.sectionHeader}>
              <h3>La page s'appuie désormais sur les mêmes repères que l'atelier économique</h3>
              <p>
                On ne duplique plus seulement un discours financier : cette page relit maintenant les décisions,
                l'offre protégée et le scénario directeur déjà présents dans le socle `economic-model`.
              </p>
            </div>

            <div className={styles.grid}>
              <Card tone="outlined" className={styles.card}>
                <CardHeader className={styles.cardHeader}>
                  <span className={styles.cardIcon}>
                    <Target size={18} />
                  </span>
                  <div>
                    <span>Stratégie prioritaire</span>
                    <strong>{PRIMARY_PRICING_STRATEGY.name}</strong>
                  </div>
                </CardHeader>
                <CardBody className={styles.cardBody}>
                  <p className={styles.metricReason}>{PRIMARY_PRICING_STRATEGY.priorityLabel}</p>
                  <p>{PRIMARY_PRICING_STRATEGY.description}</p>
                </CardBody>
              </Card>

              <Card tone="outlined" className={styles.card}>
                <CardHeader className={styles.cardHeader}>
                  <span className={styles.cardIcon}>
                    <CircleDollarSign size={18} />
                  </span>
                  <div>
                    <span>Offre protégée</span>
                    <strong>{LOCKED_PRODUCTION_OFFER.name}</strong>
                  </div>
                </CardHeader>
                <CardBody className={styles.cardBody}>
                  <p className={styles.metricReason}>
                    {LOCKED_PRODUCTION_OFFER.monthlyPrice} € / mois · {LOCKED_PRODUCTION_OFFER.stripePlanCode}
                  </p>
                  <p>{LOCKED_PRODUCTION_OFFER.description}</p>
                </CardBody>
              </Card>

              <Card tone="outlined" className={styles.card}>
                <CardHeader className={styles.cardHeader}>
                  <span className={styles.cardIcon}>
                    <TrendingUp size={18} />
                  </span>
                  <div>
                    <span>Scénario directeur</span>
                    <strong>{SCENARIO_DIRECTOR.label}</strong>
                  </div>
                </CardHeader>
                <CardBody className={styles.cardBody}>
                  <p className={styles.metricReason}>
                    Mix annuel {SCENARIO_DIRECTOR.annualPlanMixPct}% · GMV {SCENARIO_DIRECTOR.marketplaceGmvMonthly} € / mois
                  </p>
                  <p>{SCENARIO_DIRECTOR.notes}</p>
                </CardBody>
              </Card>

              <Card tone="outlined" className={styles.card}>
                <CardHeader className={styles.cardHeader}>
                  <span className={styles.cardIcon}>
                    <Sparkles size={18} />
                  </span>
                  <div>
                    <span>Prochaine revue</span>
                    <strong>{ACTIVE_PRICING_DECISIONS[0]?.nextReview ?? "À planifier"}</strong>
                  </div>
                </CardHeader>
                <CardBody className={styles.cardBody}>
                  <p className={styles.metricReason}>
                    {ACTIVE_PRICING_DECISIONS[0]?.decision ?? "Aucune décision ouverte détectée"}
                  </p>
                  <p>
                    {ACTIVE_PRICING_DECISIONS[0]?.rationale ??
                      "Le journal de décisions tarifaires n'a pas encore de prochaine revue ouverte."}
                  </p>
                </CardBody>
              </Card>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Willingness to pay">
            <div className={styles.sectionHeader}>
              <h3>Ce que chaque persona peut réellement accepter</h3>
              <p>
                La sensibilité au prix change fortement selon le portefeuille, la dépendance à l'outil et le coût
                d'une erreur opérationnelle évitée.
              </p>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>Sensibilité prix</th>
                    <th>Indicateur de valeur</th>
                    <th>Modèle d'acceptabilité</th>
                  </tr>
                </thead>
                <tbody>
                  {FINANCIAL_PERSONA_PRICING_ROWS.map((row) => (
                    <tr key={row.persona}>
                      <td>{row.persona}</td>
                      <td>{row.sensitivity}</td>
                      <td>{row.valueMetric}</td>
                      <td>{row.acceptableRange}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Grille tarifaire cible">
            <div className={styles.sectionHeader}>
              <h3>Pricing V1 recommandé pour PlanetLS</h3>
              <p>
                Le nombre de logements reste le meilleur driver de valeur lisible, avec un cœur de gamme centré sur
                les conciergeries en croissance.
              </p>
            </div>

            <div className={styles.planGrid}>
              {TARGET_PRICING_PLANS.map((plan) => (
                <Card key={plan.name} tone="outlined" className={styles.planCard}>
                  <CardHeader className={styles.planHeader}>
                    <span>{plan.target}</span>
                    <strong>{plan.name}</strong>
                  </CardHeader>
                  <CardBody className={styles.planBody}>
                    <p className={styles.planPrice}>{plan.price}</p>
                    <p className={styles.planScope}>{plan.scope}</p>
                    <ul className={styles.bulletList}>
                      {plan.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              ))}
            </div>
          </DashboardPanel>

          <div className={styles.twoColumn}>
            <DashboardPanel title="Coûts variables par utilisateur">
              <div className={styles.metricList}>
                {VARIABLE_COST_ROWS.map((row) => (
                  <article key={row.label} className={styles.metricCard}>
                    <div className={styles.metricTitle}>
                      {row.label === "IA" ? <Cpu size={18} /> : row.label === "Paiement" ? <CreditCard size={18} /> : <CircleDollarSign size={18} />}
                      <strong>{row.label}</strong>
                    </div>
                    <p className={styles.metricValue}>{row.cost}</p>
                    <p>{row.note}</p>
                  </article>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Déclencheurs de passage au payant">
              <div className={styles.metricList}>
                {UPGRADE_TRIGGER_ROWS.map((row) => (
                  <article key={row.trigger} className={styles.metricCard}>
                    <div className={styles.metricTitle}>
                      <Users size={18} />
                      <strong>{row.trigger}</strong>
                    </div>
                    <p className={styles.metricReason}>{row.reason}</p>
                    <p>{row.outcome}</p>
                  </article>
                ))}
              </div>
            </DashboardPanel>
          </div>

          <DashboardPanel title="Pont avec les tiers de simulation">
            <div className={styles.sectionHeader}>
              <h3>La grille cible et les tiers de simulation ne sont plus isolés</h3>
              <p>
                La page stratégique conserve les noms commerciaux voulus, tandis que le socle `economic-model`
                garde ses tiers de travail `Essential / Pro / Business` pour les scénarios et calculs.
              </p>
            </div>

            <div className={styles.grid}>
              {TARGET_SIMULATION_TIERS.map((tier) => (
                <Card key={tier.id} tone="soft" className={styles.card}>
                  <CardHeader className={styles.cardHeader}>
                    <span className={styles.cardIcon}>
                      <Coins size={18} />
                    </span>
                    <div>
                      <span>{tier.id}</span>
                      <strong>{tier.workingName}</strong>
                    </div>
                  </CardHeader>
                  <CardBody className={styles.cardBody}>
                    <p className={styles.priceRange}>{tier.monthlyPrice} € / mois</p>
                    <p>{tier.notes ?? "Tier de simulation sans note complémentaire."}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel title="Prochaine lecture recommandée">
            <div className={styles.nextActions}>
              {FINANCIAL_NEXT_ACTIONS.map((action) => (
                <article key={action} className={styles.nextActionCard}>
                  <span className={styles.stepPill}>À faire</span>
                  <p>{action}</p>
                </article>
              ))}
            </div>
          </DashboardPanel>
        </section>

        <div className={styles.inlineLinks}>
          <Link href="/dashboard/admin/pilotage" className={styles.inlineLink}>
            Revenir au pilotage business <ArrowRight size={15} />
          </Link>
          <Link href="/dashboard/admin/personas" className={styles.inlineLink}>
            Relire les personas cibles <ArrowRight size={15} />
          </Link>
          <Link href="/dashboard/admin/developpement" className={styles.inlineLink}>
            Voir le Master Plan <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </DashboardLayout>
  );
}
