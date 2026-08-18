"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  Compass,
  Layers3,
  LineChart,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { DashboardLayout, DashboardPanel } from "@/components/dashboard";
import { Card, CardBody, CardHeader } from "@/components/ui";
import type { KpiOverviewPayload } from "@/app/api/kpis/overview/shared";
import { buildAdminNavItems, buildAdminShortcuts } from "../../adminNavigation";
import type { AdminMissionRow, AdminRequestRow } from "../../AdminOperations";
import { PRICING_DECISION_LOG } from "./economic-model/data";
import { nextDecisions, prioritizedHypotheses } from "./market-validation/validationData";
import { businessRisks } from "./risk-register/riskData";
import styles from "./page.module.scss";

type AdminOverviewPayload = {
  health?: {
    reasons: string[];
  };
  summary: {
    totalUsers: number;
  };
};

type AdminOperationsPayload = {
  health?: {
    reasons: string[];
  };
  requests: AdminRequestRow[];
  missions: AdminMissionRow[];
};

type BenchmarkCardItem = {
  title: string;
  points: string[];
  tone: "blue" | "red" | "orange" | "green" | "purple" | "brown";
  icon: typeof Building2;
  label: string;
};

const POSITIONING_PLANETLS_POINTS = [
  "Plateforme SaaS multi-acteurs",
  "Workflow complet de prestation",
  "Marketplace locale intégrée",
  "Automations + IA",
  "UX hybride : simple + pro",
];

const DIRECT_COMPETITOR_POINTS = [
  "Airbnb - UX grand public, séjours, mais pas d'opérations.",
  "Lodgify - PMS propriétaire, peu orienté conciergerie.",
  "Hostaway - PMS + automations, mais pas de marketplace.",
  "Smoobu - PMS + conciergerie simple, pas d'artisans.",
];

const INDIRECT_COMPETITOR_POINTS = [
  "Stootie / Yoojo / NeedHelp - marketplace de services, mais pas de PMS.",
  "Twimm / Organilog - interventions et maintenance, mais trop techniques.",
];

const PLANETLS_DIFFERENTIATORS = [
  "PMS + conciergerie + artisans + interventions",
  "Multi-acteurs natif",
  "Automations conditionnelles",
  "IA intégrée",
  "Workflow complet de la demande au paiement",
];

const VISUAL_COMPARISON_ROWS = [
  { criterion: "PMS", airbnb: "✔️", lodgify: "✔️", hostaway: "✔️", smoobu: "✔️", stootie: "❌", twimm: "❌", planetls: "✔️" },
  { criterion: "Conciergerie", airbnb: "❌", lodgify: "⚠️", hostaway: "✔️", smoobu: "✔️", stootie: "❌", twimm: "❌", planetls: "✔️" },
  { criterion: "Marketplace", airbnb: "❌", lodgify: "❌", hostaway: "❌", smoobu: "❌", stootie: "✔️", twimm: "❌", planetls: "✔️" },
  { criterion: "Interventions", airbnb: "❌", lodgify: "❌", hostaway: "❌", smoobu: "❌", stootie: "✔️", twimm: "✔️", planetls: "✔️" },
  { criterion: "Multi‑acteurs", airbnb: "❌", lodgify: "❌", hostaway: "✔️", smoobu: "❌", stootie: "❌", twimm: "❌", planetls: "✔️" },
  { criterion: "Automations", airbnb: "⚠️", lodgify: "⚠️", hostaway: "✔️", smoobu: "⚠️", stootie: "❌", twimm: "✔️", planetls: "✔️" },
  { criterion: "IA", airbnb: "❌", lodgify: "❌", hostaway: "❌", smoobu: "❌", stootie: "❌", twimm: "❌", planetls: "✔️" },
  { criterion: "Workflow complet", airbnb: "❌", lodgify: "❌", hostaway: "⚠️", smoobu: "❌", stootie: "⚠️", twimm: "✔️", planetls: "✔️" },
];

const ARCHITECTURE_GLOBAL_POINTS = [
  "Next.js App Router",
  "Supabase (DB + Auth + RLS + Storage)",
  "Edge Functions pour la logique métier",
  "Event-driven pour les automations",
  "Stripe pour les paiements marketplace",
  "Resend / Twilio pour les notifications",
  "IA via Azure OpenAI",
];

const MVP_MODULES = [
  "Demandes → devis → missions",
  "Planning interventions",
  "Preuves de réalisation",
  "Séjours + voyageurs",
  "Incidents",
  "Marketplace basique",
  "Notifications simples",
];

const V1_MODULES = [
  "Automations conditionnelles",
  "Stocks / équipements",
  "Permissions avancées (RBAC)",
  "IA légère (suggestions)",
];

const V2_MODULES = [
  "IA avancée (analyse preuves, anomalies)",
  "Automations complexes",
  "Gestion financière complète",
  "Intégrations PMS externes",
  "Multi-langues / multi-devises",
];

const ROADMAP_TIMELINE = [
  { label: "MVP", value: "3-4 mois" },
  { label: "V1", value: "6-9 mois" },
  { label: "V2", value: "12+ mois" },
];

const VALUE_PROPOSITION_POINTS = [
  "La plateforme qui connecte propriétaires, conciergeries et artisans.",
  "Le workflow complet des prestations.",
  "La marketplace locale intégrée.",
  "Les automations qui réduisent les urgences.",
  "L'IA qui sécurise les opérations.",
];

const MARKETING_MESSAGES = [
  "Automatisez vos opérations, pas votre relation client.",
  "Votre conciergerie, vos artisans, vos séjours - enfin réunis.",
  "Le SaaS qui gère vos missions pendant que vous gérez votre business.",
  "La marketplace locale qui parle PMS, conciergerie et interventions.",
];

const USER_SEGMENTS = [
  "Propriétaires - simplicité, transparence, preuves.",
  "Conciergeries - centralisation, automatisation, réseau artisans.",
  "Artisans - missions qualifiées, paiement rapide, visibilité locale.",
];

const NARRATIVE_IDENTITY_POINTS = [
  "Ton : professionnel, rassurant, moderne.",
  "Style : visuel, simple, orienté solution.",
  "Angle : collaboration, fiabilité, gain de temps.",
];

function formatDate(value: string | null | undefined) {
  if (!value) return "Non disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number") return "À mesurer";
  return `${Math.round(value * 100) / 100} %`;
}

function SectionHeader({ title, subtitle, hideTitle = false }: { title: string; subtitle?: string; hideTitle?: boolean }) {
  return (
    <div className={styles.sectionHeader}>
      {!hideTitle ? <h3>{title}</h3> : null}
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}

function BenchmarkCardGrid({ items }: { items: BenchmarkCardItem[] }) {
  return (
    <div className={styles.businessCardGrid}>
      {items.map((item) => (
        <Card key={item.title} tone="soft" className={styles.businessCard} data-tone={item.tone}>
          <CardHeader className={styles.businessCardHeader}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon} aria-hidden="true">
                <item.icon size={18} />
              </span>
              <div>
                <span>{item.label}</span>
                <strong>{item.title}</strong>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <ul className={styles.businessBulletList}>
              {item.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function BenchmarkComparisonTable() {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Critère</th>
            <th>Airbnb</th>
            <th>Lodgify</th>
            <th>Hostaway</th>
            <th>Smoobu</th>
            <th>Stootie</th>
            <th>Twimm</th>
            <th>PlanetLS</th>
          </tr>
        </thead>
        <tbody>
          {VISUAL_COMPARISON_ROWS.map((row) => (
            <tr key={row.criterion}>
              <td>{row.criterion}</td>
              <td>{row.airbnb}</td>
              <td>{row.lodgify}</td>
              <td>{row.hostaway}</td>
              <td>{row.smoobu}</td>
              <td>{row.stootie}</td>
              <td>{row.twimm}</td>
              <td>{row.planetls}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminBusinessPage() {
  const [overview, setOverview] = useState<AdminOverviewPayload | null>(null);
  const [operations, setOperations] = useState<AdminOperationsPayload | null>(null);
  const [kpis, setKpis] = useState<KpiOverviewPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setError(null);

      try {
        const [overviewRes, operationsRes, kpiRes] = await Promise.allSettled([
          fetch("/api/admin/overview", { cache: "no-store" }),
          fetch("/api/admin/operations?limit=200", { cache: "no-store" }),
          fetch("/api/kpis/overview?window_days=30", { cache: "no-store" }),
        ]);

        if (!active) return;

        setOverview(
          overviewRes.status === "fulfilled" && overviewRes.value.ok
            ? ((await overviewRes.value.json()) as AdminOverviewPayload)
            : null,
        );
        setOperations(
          operationsRes.status === "fulfilled" && operationsRes.value.ok
            ? ((await operationsRes.value.json()) as AdminOperationsPayload)
            : null,
        );
        setKpis(
          kpiRes.status === "fulfilled" && kpiRes.value.ok
            ? ((await kpiRes.value.json()) as KpiOverviewPayload)
            : null,
        );
      } catch (loadError) {
        if (!active) return;
        console.error("Erreur chargement centre de pilotage business :", loadError);
        setError("Le centre de pilotage business n'a pas pu être chargé.");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const requests = useMemo(() => operations?.requests ?? [], [operations?.requests]);
  const missions = useMemo(() => operations?.missions ?? [], [operations?.missions]);

  const acceptedWithoutMission = useMemo(
    () =>
      requests.filter((request) => {
        const quoteStatus = String(request.quote_workflow_status ?? "").toLowerCase();
        return quoteStatus.includes("accept") && !request.mission_id;
      }).length,
    [requests],
  );

  const lateUnbilledMissions = useMemo(
    () =>
      missions.filter((mission) => {
        if (mission.invoice_id || !mission.scheduled_start) return false;
        const scheduled = new Date(mission.scheduled_start).getTime();
        return Number.isFinite(scheduled) && scheduled < Date.now();
      }).length,
    [missions],
  );

  const sourceWarnings = Array.from(
    new Set([
      ...(overview?.health?.reasons ?? []),
      ...(operations?.health?.reasons ?? []),
      ...(kpis?.health?.reasons ?? []),
    ]),
  );

  const criticalHypothesesCount = prioritizedHypotheses.filter((item) => item.priority === "critique").length;
  const criticalRisksCount = businessRisks.filter((item) => item.priority === "critique").length;

  const attentionItems = useMemo(() => {
    const items = [
      {
        title: "Hypothèses critiques encore ouvertes",
        detail: `${criticalHypothesesCount} hypothèses critiques restent à confronter au terrain.`,
        action: "Valider la promesse achetable avant d'élargir encore le discours produit.",
      },
      {
        title: "Risques business majeurs",
        detail: `${criticalRisksCount} risques critiques restent formellement identifiés dans le registre.`,
        action: "Traiter les risques qui bloquent vente, rétention ou lisibilité du positionnement.",
      },
      {
        title: "Devis acceptés sans mission",
        detail: `${acceptedWithoutMission} demandes ont un devis accepté sans mission rattachée.`,
        action: "Vérifier si la rupture est produit, opérationnelle ou commerciale.",
      },
      {
        title: "Missions sans facture visible",
        detail: `${lateUnbilledMissions} missions démarrées restent sans facture visible.`,
        action: "Sécuriser la boucle mission → facture → paiement.",
      },
    ];

    if (typeof kpis?.concierge.activation_j7 === "number") {
      items.unshift({
        title: "Activation J+7 conciergeries",
        detail: `Activation observée : ${formatPercent(kpis.concierge.activation_j7)}.`,
        action: "Vérifier si la promesse de valeur immédiate est assez claire dès les premiers jours.",
      });
    }

    return items.slice(0, 3);
  }, [acceptedWithoutMission, criticalHypothesesCount, criticalRisksCount, kpis?.concierge.activation_j7, lateUnbilledMissions]);

  const upcomingDecisions = useMemo(
    () =>
      [
        ...nextDecisions.slice(0, 2).map((item) => ({
          title: item,
          detail: "Décision issue du module de validation marché.",
          meta: "Validation marché",
        })),
        ...PRICING_DECISION_LOG.filter((entry) => entry.status !== "done")
          .slice(0, 2)
          .map((entry) => ({
            title: entry.decision,
            detail: entry.rationale,
            meta: `Revue prévue le ${formatDate(entry.nextReview)}`,
          })),
      ].slice(0, 3),
    [],
  );

  const positioningCards: BenchmarkCardItem[] = [
    {
      title: "Plateforme SaaS multi-acteurs",
      points: POSITIONING_PLANETLS_POINTS,
      tone: "blue",
      icon: Building2,
      label: "Positionnement PlanetLS",
    },
    {
      title: "Des outils connus, mais incomplets",
      points: DIRECT_COMPETITOR_POINTS,
      tone: "red",
      icon: ShieldAlert,
      label: "Concurrents directs",
    },
    {
      title: "Des briques utiles, mais pas la chaîne complète",
      points: INDIRECT_COMPETITOR_POINTS,
      tone: "orange",
      icon: Compass,
      label: "Concurrents indirects",
    },
    {
      title: "Le workflow complet comme avantage lisible",
      points: PLANETLS_DIFFERENTIATORS,
      tone: "green",
      icon: BadgeCheck,
      label: "Différenciation PlanetLS",
    },
  ];

  const roadmapCards: BenchmarkCardItem[] = [
    {
      title: "Next.js + Supabase comme socle opérable",
      points: ARCHITECTURE_GLOBAL_POINTS,
      tone: "blue",
      icon: Layers3,
      label: "Architecture globale",
    },
    {
      title: "Le noyau qui doit vivre en premier",
      points: MVP_MODULES,
      tone: "orange",
      icon: Target,
      label: "Modules MVP",
    },
    {
      title: "La couche qui densifie la valeur",
      points: V1_MODULES,
      tone: "green",
      icon: RefreshCw,
      label: "Modules V1",
    },
    {
      title: "Le différenciateur avancé",
      points: V2_MODULES,
      tone: "purple",
      icon: Sparkles,
      label: "Modules V2",
    },
  ];

  const marketingCards: BenchmarkCardItem[] = [
    {
      title: "Ce que PlanetLS doit faire comprendre tout de suite",
      points: VALUE_PROPOSITION_POINTS,
      tone: "blue",
      icon: Target,
      label: "Proposition de valeur",
    },
    {
      title: "Les formulations à reprendre partout",
      points: MARKETING_MESSAGES,
      tone: "orange",
      icon: Sparkles,
      label: "Messages clés",
    },
    {
      title: "Les 3 cibles à rendre immédiatement actionnables",
      points: USER_SEGMENTS,
      tone: "green",
      icon: Users,
      label: "Segments utilisateurs",
    },
    {
      title: "La manière juste de raconter la marque",
      points: NARRATIVE_IDENTITY_POINTS,
      tone: "purple",
      icon: Compass,
      label: "Identité narrative",
    },
  ];

  return (
    <DashboardLayout
      persona="admin"
      title="Pilotage business"
      subtitle="Version courte du benchmark, du positionnement et de la roadmap PlanetLS."
      navTitle="Admin / Pilotage business"
      navItems={buildAdminNavItems("business", "productTech")}
      stats={[]}
      actions={[]}
      hideQuickActions
      activity={[
        {
          id: "business-positioning",
          title: "Positionnement central",
          description: "PlanetLS se défend comme workflow complet multi-acteurs, pas comme simple PMS.",
          href: "/dashboard/admin/pilotage",
        },
        {
          id: "business-competition",
          title: "Lecture concurrence",
          description: "Le benchmark montre des outils forts, mais rarement reliés au workflow complet.",
          href: "/dashboard/admin/pilotage",
        },
        {
          id: "business-roadmap",
          title: "Roadmap cible",
          description: "MVP 3-4 mois, V1 6-9 mois, V2 12+ mois sur un socle Next.js + Supabase.",
          href: "/dashboard/admin/pilotage",
        },
      ]}
      notifications={[
        {
          id: "business-warning",
          title: sourceWarnings[0] ?? "Lecture business compacte active sur la page de pilotage.",
          level: sourceWarnings.length > 0 ? "warning" : "info",
          href: "/dashboard/admin/pilotage",
        },
      ]}
      shortcuts={buildAdminShortcuts("business", "productTech")}
      profile={{ name: "Direction PlanetLS", subtitle: "Benchmark business", badge: "Compact" }}
    >
      <section className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>Benchmark Pack Codex</span>
            <h2>Une page courte pour pitcher PlanetLS sans perdre l'essentiel</h2>
            <p>
              Cette page sert à expliquer vite ce qu'est PlanetLS, contre qui le produit se positionne,
              pourquoi il est différent, quoi livrer en premier et comment raconter sa valeur.
            </p>

            <div className={styles.progressShell}>
              <div className={styles.progressHeader}>
                <strong>Ce que la page doit faire comprendre en moins de 2 minutes</strong>
                <span className={styles.scorePill} data-tone="strong">
                  Version compacte
                </span>
              </div>
              <div className={styles.progressMeta}>
                <span>Ce qu'est PlanetLS</span>
                <span>Contre qui il se positionne</span>
                <span>Pourquoi il est différent</span>
                <span>Quoi livrer en premier</span>
              </div>
            </div>
          </div>

          <div className={styles.heroAside}>
            <article className={styles.heroCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon} aria-hidden="true">
                  <Target size={18} />
                </span>
                <span>Promesse</span>
              </div>
              <strong>Le workflow complet des prestations</strong>
              <p>PlanetLS relie propriétaires, conciergeries et artisans dans une seule chaîne exploitable.</p>
            </article>
            <article className={styles.heroCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon} aria-hidden="true">
                  <BadgeCheck size={18} />
                </span>
                <span>Différenciation</span>
              </div>
              <strong>Multi-acteurs natif + automations + IA</strong>
              <p>Le produit se défend comme une coordination métier augmentée, pas comme un simple PMS.</p>
            </article>
            <article className={styles.heroCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon} aria-hidden="true">
                  <LineChart size={18} />
                </span>
                <span>À prouver</span>
              </div>
              <strong>Que la promesse reste simple à acheter</strong>
              <p>Le vrai enjeu n'est pas la richesse, mais la lisibilité commerciale de cette richesse.</p>
            </article>
          </div>
        </section>

        {error ? (
          <section className={styles.warningBanner}>
            <AlertTriangle size={18} />
            <div>
              <strong>Chargement partiel</strong>
              <p>{error}</p>
            </div>
          </section>
        ) : null}

        {sourceWarnings.length > 0 ? (
          <section className={styles.warningBanner}>
            <AlertTriangle size={18} />
            <div>
              <strong>Sources à surveiller</strong>
              <p>{sourceWarnings.join(" · ")}</p>
            </div>
          </section>
        ) : null}

        <section className={styles.sectionStack}>
          <DashboardPanel title="Positionnement & concurrence">
            <SectionHeader
              title="Positionnement & concurrence"
              subtitle="Une lecture directe des forces de PlanetLS face aux outils spécialisés ou fragmentés."
              hideTitle
            />
            <BenchmarkCardGrid items={positioningCards} />
          </DashboardPanel>

          <DashboardPanel title="Tableau comparatif détaillé">
            <SectionHeader
              title="Tableau comparatif détaillé"
              subtitle="La lecture multi-dimensions montre immédiatement ce que PlanetLS cumule réellement."
            />
            <BenchmarkComparisonTable />
          </DashboardPanel>

          <DashboardPanel title="Synthèse visuelle des écarts">
            <div className={styles.businessCardGrid}>
              <article className={styles.businessCard} data-tone="purple">
                <div className={styles.businessCardHeader}>
                  <span className={styles.cardIcon} aria-hidden="true">
                    <Layers3 size={18} />
                  </span>
                  <div>
                    <span>Avantage structurel</span>
                    <strong>PlanetLS est le seul à combiner toutes les briques clés</strong>
                  </div>
                </div>
                <ul className={styles.businessBulletList}>
                  <li>PMS</li>
                  <li>Conciergerie</li>
                  <li>Marketplace</li>
                  <li>Interventions</li>
                  <li>Multi-acteurs</li>
                  <li>Automations avancées</li>
                  <li>IA</li>
                </ul>
              </article>

              <article className={styles.businessCard} data-tone="blue">
                <div className={styles.businessCardHeader}>
                  <span className={styles.cardIcon} aria-hidden="true">
                    <LineChart size={18} />
                  </span>
                  <div>
                    <span>Lecture business</span>
                    <strong>100% du cycle opérationnel visé</strong>
                  </div>
                </div>
                <p>
                  PlanetLS couvre la chaîne entre besoin, coordination, exécution, preuve et lecture business,
                  là où les autres outils restent spécialisés sur une seule partie du travail.
                </p>
                <p>
                  Aucun concurrent de cette grille ne dépasse vraiment 40% du cycle combiné sans compromis fort
                  sur le multi-acteurs, la marketplace locale ou l'intelligence opérationnelle.
                </p>
              </article>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Roadmap technique">
            <SectionHeader
              title="Roadmap technique"
              subtitle="Un socle clair, puis une montée en valeur par étapes plutôt qu'une complexité lancée d'un bloc."
              hideTitle
            />
            <BenchmarkCardGrid items={roadmapCards} />
            <div className={styles.timelineMiniGrid}>
              {ROADMAP_TIMELINE.map((item) => (
                <Card key={item.label} tone="outlined" className={styles.timelineMiniCard}>
                  <CardBody>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </CardBody>
                </Card>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel title="Positionnement marketing">
            <SectionHeader
              title="Positionnement marketing"
              subtitle="Messages et segments à garder cohérents entre landing, vente et démo produit."
              hideTitle
            />
            <BenchmarkCardGrid items={marketingCards} />
          </DashboardPanel>

          <div className={styles.sectionPanelGrid}>
            <DashboardPanel title="À prouver maintenant">
              <div className={styles.decisionList}>
                {attentionItems.map((item) => (
                  <article key={item.title} className={styles.decisionCard}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    <p>{item.action}</p>
                  </article>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Prochaines décisions">
              <div className={styles.decisionList}>
                {upcomingDecisions.map((item) => (
                  <article key={item.title} className={styles.decisionCard}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    <p>{item.meta}</p>
                  </article>
                ))}
              </div>
            </DashboardPanel>
          </div>
        </section>

        <div className={styles.inlineLinks}>
          <Link href="/dashboard/admin/modele-financier" className={styles.inlineLink}>
            Voir le modèle financier <ArrowRight size={15} />
          </Link>
          <Link href="/dashboard/admin/personas" className={styles.inlineLink}>
            Voir les personas & segments <ArrowRight size={15} />
          </Link>
          <Link href="/dashboard/admin/controle" className={styles.inlineLink}>
            Voir le contrôle opérationnel <ArrowRight size={15} />
          </Link>
          <Link href="/dashboard/admin/developpement" className={styles.inlineLink}>
            Voir le Master Plan <ArrowRight size={15} />
          </Link>
          <Link href="/abonnement/concierge-pro" className={styles.inlineLink}>
            Voir l'offre Concierge Pro <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </DashboardLayout>
  );
}
