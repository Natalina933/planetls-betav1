"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Network, Layers3, ShieldCheck, Workflow, GitBranchPlus, CalendarClock } from "lucide-react";
import { DashboardLayout, DashboardPanel } from "@/components/dashboard";
import { Card, CardBody, CardHeader, Input, SectionIntro, Select, StatsCard, Tag } from "@/components/ui";
import type { ArchitectureDecision, ArchitectureDecisionCenter } from "./architectureDecisions";
import styles from "./page.module.scss";

type DecisionCenterPageProps = {
  center: ArchitectureDecisionCenter;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value));
}

function iconForCategory(category: ArchitectureDecision["category"]) {
  if (category === "Stack") return <Layers3 size={18} aria-hidden="true" />;
  if (category === "Architecture") return <Network size={18} aria-hidden="true" />;
  if (category === "Workflow") return <Workflow size={18} aria-hidden="true" />;
  if (category === "UI") return <GitBranchPlus size={18} aria-hidden="true" />;
  return <ShieldCheck size={18} aria-hidden="true" />;
}

function getDecisionMap(decisions: ArchitectureDecision[]) {
  return new Map(decisions.map((decision) => [decision.id, decision] as const));
}

export default function DecisionCenterPage({ center }: DecisionCenterPageProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const decisionMap = useMemo(() => getDecisionMap(center.decisions), [center.decisions]);

  const filteredDecisions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");

    return center.decisions.filter((decision) => {
      const haystack = [
        decision.title,
        decision.context,
        decision.problem,
        decision.options.join(" "),
        decision.advantages.join(" "),
        decision.disadvantages.join(" "),
        decision.choice,
        decision.justification,
        decision.consequences.join(" "),
        decision.author,
        decision.tags.join(" "),
      ].join(" ").toLocaleLowerCase("fr");

      return (!normalizedQuery || haystack.includes(normalizedQuery))
        && (!category || decision.category === category)
        && (!tag || decision.tags.includes(tag));
    });
  }, [category, center.decisions, query, tag]);

  const linkedPairsCount = useMemo(
    () => center.decisions.reduce((total, decision) => total + decision.linkedDecisionIds.length, 0),
    [center.decisions],
  );

  return (
    <DashboardLayout
      persona="admin"
      title="Décisions Architecture"
      subtitle="Le centre de décisions conserve les arbitrages structurants de PlanetLS et permet de les retrouver en quelques secondes."
      navTitle="Pilotage admin"
      navItems={[
        { label: "Vue d'ensemble", href: "/dashboard/admin" },
        { label: "Contrôle détaillé", href: "/dashboard/admin/controle" },
        { label: "Développement", href: "/dashboard/admin/developpement" },
        { label: "Décisions Architecture", href: "/dashboard/admin/decisions-architecture" },
        { label: "Utilisateurs", href: "/dashboard/admin/utilisateurs" },
      ]}
      stats={[
        { label: "Décisions", value: String(center.decisions.length), hint: "Arbitrages indexés" },
        { label: "Catégories", value: String(center.categories.length), hint: "Stack, architecture, workflow..." },
        { label: "Tags", value: String(center.tags.length), hint: "Repères de recherche" },
        { label: "Liens", value: String(linkedPairsCount), hint: "Décisions reliées entre elles" },
      ]}
      actions={[
        { label: "Retour cockpit", href: "/dashboard/admin" },
        { label: "Voir Développement", href: "/dashboard/admin/developpement" },
      ]}
      activity={[
        {
          id: "stack",
          title: "Choix de stack",
          description: "Pourquoi Supabase, Next.js et Vercel restent le socle du projet.",
          href: "/dashboard/admin/decisions-architecture",
        },
        {
          id: "architecture",
          title: "Arbitrages d'architecture",
          description: "Relier les décisions de structure, de composants et de workflow.",
          href: "/dashboard/admin/decisions-architecture",
        },
      ]}
      notifications={[
        {
          id: "decision-center",
          title: `${filteredDecisions.length} décision(s) trouvée(s) avec les filtres actifs.`,
          level: "info",
          href: "/dashboard/admin/decisions-architecture",
        },
      ]}
      shortcuts={[
        { label: "Cockpit", href: "/dashboard/admin" },
        { label: "Développement", href: "/dashboard/admin/developpement" },
        { label: "Contrôle", href: "/dashboard/admin/controle" },
      ]}
      profile={{ name: "PlanetLS", subtitle: "Centre de décisions", badge: "Architecture" }}
    >
      <DashboardPanel title="Vue rapide">
        <SectionIntro
          title="Centre de décisions"
          titleId="architecture-decisions-title"
          align="left"
          eyebrow={<><CalendarClock size={16} /> Architecture et gouvernance</>}
          subtitle="Chaque décision importante conserve son contexte, les options étudiées, le choix retenu et ses conséquences."
          description="Le moteur relie les décisions entre elles pour éviter de rouvrir les mêmes arbitrages sans contexte."
        />
        <div className={styles.metricsGrid}>
          <StatsCard label="Décisions canoniques" value={String(center.decisions.filter((decision) => decision.source === "canonique").length)} hint="Socle structurel du projet" visual={<ShieldCheck size={18} />} visualLabel="Canonique" />
          <StatsCard label="Décisions dérivées" value={String(center.decisions.filter((decision) => decision.source === "master-plan").length)} hint="Issues du Master Plan" visual={<Workflow size={18} />} visualLabel="Master Plan" />
          <StatsCard label="Décisions reliées" value={String(center.decisions.filter((decision) => decision.linkedDecisionIds.length > 0).length)} hint="Contexte partagé ou impacts communs" visual={<Network size={18} />} visualLabel="Liens" />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Recherche">
        <div className={styles.searchGrid}>
          <Input
            label="Recherche instantanée"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Supabase, workflow, architecture, Vercel, composants..."
          />
          <Select label="Catégorie" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Toutes les catégories</option>
            {center.categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Select label="Tag" value={tag} onChange={(event) => setTag(event.target.value)}>
            <option value="">Tous les tags</option>
            {center.tags.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
        </div>
      </DashboardPanel>

      <DashboardPanel title="Décisions liées">
        <div className={styles.relationshipStrip}>
          {center.decisions.slice(0, 6).map((decision) => (
            <article key={decision.id} className={styles.relationshipCard}>
              <div>
                <span>{decision.category}</span>
                <strong>{decision.title}</strong>
              </div>
              <p>{decision.linkedDecisionIds.length} décision(s) liée(s)</p>
            </article>
          ))}
        </div>
      </DashboardPanel>

      <DashboardPanel title="Registre détaillé">
        {filteredDecisions.length ? (
          <div className={styles.decisionGrid}>
            {filteredDecisions.map((decision) => {
              const linkedDecisions = decision.linkedDecisionIds
                .map((decisionId) => decisionMap.get(decisionId))
                .filter((item): item is ArchitectureDecision => Boolean(item));

              return (
                <Card key={decision.id} id={decision.id} className={styles.decisionCard} tone="soft">
                  <CardHeader className={styles.decisionHeader}>
                    <div className={styles.decisionTitleBlock}>
                      <span className={styles.decisionCategory}>{iconForCategory(decision.category)} {decision.category}</span>
                      <h3>{decision.title}</h3>
                      <p>{decision.problem}</p>
                    </div>
                    <div className={styles.decisionMeta}>
                      <Tag tone="neutral">{formatDate(decision.date)}</Tag>
                      <Tag tone="status">{decision.author}</Tag>
                    </div>
                  </CardHeader>
                  <CardBody className={styles.decisionBody}>
                    <div className={styles.decisionPanels}>
                      <article>
                        <strong>Contexte</strong>
                        <p>{decision.context}</p>
                      </article>
                      <article>
                        <strong>Choix retenu</strong>
                        <p>{decision.choice}</p>
                      </article>
                      <article>
                        <strong>Justification</strong>
                        <p>{decision.justification}</p>
                      </article>
                      <article>
                        <strong>Options étudiées</strong>
                        <ul>{decision.options.map((item) => <li key={item}>{item}</li>)}</ul>
                      </article>
                      <article>
                        <strong>Avantages</strong>
                        <ul>{decision.advantages.map((item) => <li key={item}>{item}</li>)}</ul>
                      </article>
                      <article>
                        <strong>Inconvénients</strong>
                        <ul>{decision.disadvantages.map((item) => <li key={item}>{item}</li>)}</ul>
                      </article>
                      <article>
                        <strong>Conséquences</strong>
                        <ul>{decision.consequences.map((item) => <li key={item}>{item}</li>)}</ul>
                      </article>
                      <article>
                        <strong>Preuves</strong>
                        <ul>{decision.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
                      </article>
                    </div>

                    <div className={styles.tagRow}>
                      {decision.tags.map((item) => <Tag key={`${decision.id}-${item}`} tone="category">{item}</Tag>)}
                    </div>

                    <div className={styles.linkedBlock}>
                      <strong>Décisions liées</strong>
                      {linkedDecisions.length ? (
                        <div className={styles.linkedGrid}>
                          {linkedDecisions.map((linked) => (
                            <Link key={linked.id} href={`#${linked.id}`} className={styles.linkedDecision}>
                              <span>{linked.category}</span>
                              <strong>{linked.title}</strong>
                              <p>{linked.choice}</p>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.emptyText}>Aucune décision liée détectée pour le moment.</p>
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Search size={28} />
            <h2>Aucune décision trouvée</h2>
            <p>Ajustez la recherche ou les filtres pour retrouver un arbitrage précis.</p>
          </div>
        )}
      </DashboardPanel>
    </DashboardLayout>
  );
}
