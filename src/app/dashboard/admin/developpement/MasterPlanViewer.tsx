"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { BookOpen, CalendarClock, ChevronDown, FileText, ListChecks, Search, X } from "lucide-react";
import {
  MASTER_PLAN_PRIORITIES,
  MASTER_PLAN_STATUSES,
  type MasterPlanSection,
  type MasterPlanView,
} from "./masterPlan";
import styles from "./page.module.scss";

function stripMarkdown(value: string) {
  return value.replace(/[`*_]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: ReactNode[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trim() === "---") continue;
    if (line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) tableLines.push(lines[index++]);
      index -= 1;
      const rows = tableLines
        .filter((entry) => !/^\|?[\s|:-]+\|?$/.test(entry))
        .map((entry) => entry.split("|").slice(1, -1).map((cell) => stripMarkdown(cell.trim())));
      if (rows.length) {
        nodes.push(
          <div className={styles.tableScroll} key={`table-${index}`}>
            <table>
              <thead><tr>{rows[0].map((cell, cellIndex) => <th key={cellIndex}>{cell}</th>)}</tr></thead>
              <tbody>{rows.slice(1).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>,
        );
      }
      continue;
    }
    const listMatch = /^\s*(?:[-*]|\d+\.)\s+(.+)$/.exec(line);
    nodes.push(listMatch
      ? <p className={styles.listItem} key={index}>• {stripMarkdown(listMatch[1])}</p>
      : <p key={index}>{stripMarkdown(line)}</p>);
  }
  return nodes;
}

function SectionCard({ section, childSections, isOpen, onToggle }: {
  section: MasterPlanSection;
  childSections: MasterPlanSection[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const contentId = `${section.id}-content`;
  return <article id={section.id} className={styles.sectionCard}>
    <button type="button" className={styles.sectionToggle} onClick={onToggle} aria-expanded={isOpen} aria-controls={contentId}>
      <span className={styles.headingLevel}>H{section.level}</span>
      <span className={styles.sectionTitle}>{section.title}</span>
      <ChevronDown className={styles.chevron} size={20} aria-hidden="true" />
    </button>
    <div className={styles.tags}>
      {section.statuses.map((status) => <span key={status}>{status}</span>)}
      {section.priorities.map((priority) => <span key={priority}>{priority}</span>)}
    </div>
    {isOpen ? <div id={contentId} className={styles.markdown}>
      {section.content ? <MarkdownContent content={section.content} /> : childSections.length ? <div className={styles.childSectionIndex}>
        <p>Cette partie est organisée en {childSections.length} sous-section{childSections.length > 1 ? "s" : ""} :</p>
        <nav aria-label={`Sous-sections de ${section.title}`}>{childSections.map((child) => <a href={`#${child.id}`} key={child.id}>{child.title}</a>)}</nav>
      </div> : <p className={styles.emptySection}>Aucun contenu n’est encore renseigné pour cette section.</p>}
    </div> : null}
  </article>;
}

export function MasterPlanViewer({ plan }: { plan: MasterPlanView }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(plan.sections.map((section) => section.id)),
  );
  const visibleSections = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    return plan.sections.filter((section) => {
      const matchesQuery = !normalizedQuery || `${section.title} ${section.content}`.toLocaleLowerCase("fr").includes(normalizedQuery);
      return matchesQuery && (!status || section.statuses.includes(status)) && (!priority || section.priorities.includes(priority));
    });
  }, [plan.sections, priority, query, status]);
  const remainingP0 = plan.remainingPriorityCounts["P0 Critique"] ?? 0;
  const totalP0 = plan.registryPriorityCounts["P0 Critique"] ?? 0;
  const planningGroups = useMemo(() => {
    return ["Maintenant", "Ensuite", "Après stabilisation", "Plus tard"].map((horizon) => ({
      horizon,
      items: plan.planning.filter((item) => item.horizon === horizon),
    })).filter((group) => group.items.length > 0);
  }, [plan.planning]);
  const childrenBySection = useMemo(() => {
    return new Map(plan.sections.map((section, index) => {
      const children: MasterPlanSection[] = [];
      for (let childIndex = index + 1; childIndex < plan.sections.length; childIndex += 1) {
        const candidate = plan.sections[childIndex];
        if (candidate.level <= section.level) break;
        if (candidate.level === section.level + 1) children.push(candidate);
      }
      return [section.id, children] as const;
    }));
  }, [plan.sections]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  return <div className={styles.page}>
    <header className={styles.hero}><div>
      <span className={styles.eyebrow}><BookOpen size={16} /> Centre de développement</span>
      <h1>{plan.title}</h1>
      <p>Vue synchronisée avec le document officiel. Le fichier Markdown reste l’unique source de vérité.</p>
    </div><Link href="/dashboard/admin" className={styles.backLink}>Retour au cockpit admin</Link></header>

    <section className={styles.metrics} aria-label="Synthèse du Master Plan">
      <article><FileText /><strong>{plan.sections.length}</strong><span>sections indexées</span></article>
      <article><CalendarClock /><strong>{remainingP0}</strong><span>P0 restant{remainingP0 > 1 ? "s" : ""} sur {totalP0}</span></article>
      <article><BookOpen /><strong>{plan.lineCount}</strong><span>lignes dans la source</span></article>
      <article><CalendarClock /><strong>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(plan.updatedAt))}</strong><span>dernière modification</span></article>
    </section>

    <section className={styles.planning} aria-labelledby="planning-title">
      <div className={styles.planningHeader}>
        <div><span className={styles.eyebrow}><ListChecks size={16} /> Feuille de route à suivre</span><h2 id="planning-title">Planning opérationnel</h2></div>
        <p>{plan.planning.length} chantier{plan.planning.length > 1 ? "s" : ""} non terminé{plan.planning.length > 1 ? "s" : ""}, ordonné{plan.planning.length > 1 ? "s" : ""} par priorité officielle.</p>
      </div>
      <div className={styles.planningGroups}>
        {planningGroups.map((group) => <div className={styles.planningGroup} key={group.horizon}>
          <div className={styles.planningGroupTitle}><h3>{group.horizon}</h3><span>{group.items.length}</span></div>
          <ol>{group.items.map((item) => <li key={item.id}>
            <div className={styles.planningItemHeader}><div><span>{item.domain}</span><strong>{item.feature}</strong></div><div className={styles.planningTags}><span>{item.status}</span><span>{item.priority}</span></div></div>
            <p><strong>Prochaine action :</strong> {item.nextAction || "À préciser dans le Master Plan"}</p>
            <details><summary>Voir la preuve et le périmètre</summary><p>{item.evidence || "Aucune preuve renseignée."}</p><small>Profils : {item.audience || "Tous"}</small></details>
          </li>)}</ol>
        </div>)}
      </div>
    </section>

    <section className={styles.breakdown} aria-label="Raccourcis de pilotage">
      <div><h2>Statuts</h2><div className={styles.breakdownGrid}>
        {MASTER_PLAN_STATUSES.map((item) => <button type="button" key={item} aria-pressed={status === item} onClick={() => setStatus((current) => current === item ? "" : item)}><strong>{plan.statusCounts[item] ?? 0}</strong><span>{item}</span></button>)}
      </div></div>
      <div><h2>Priorités</h2><div className={styles.breakdownGrid}>
        {MASTER_PLAN_PRIORITIES.map((item) => <button type="button" key={item} aria-pressed={priority === item} onClick={() => setPriority((current) => current === item ? "" : item)}><strong>{plan.remainingPriorityCounts[item] ?? 0} / {plan.registryPriorityCounts[item] ?? 0}</strong><span>{item} restant / total</span></button>)}
      </div></div>
    </section>

    <section className={styles.filters} aria-label="Filtres du Master Plan">
      <label className={styles.search}><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une fonctionnalité, une décision, une limite…" /></label>
      <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrer par statut"><option value="">Tous les statuts</option>{MASTER_PLAN_STATUSES.map((item) => <option value={item} key={item}>{item} ({plan.statusCounts[item] ?? 0})</option>)}</select>
      <select value={priority} onChange={(event) => setPriority(event.target.value)} aria-label="Filtrer par priorité"><option value="">Toutes les priorités</option>{MASTER_PLAN_PRIORITIES.map((item) => <option value={item} key={item}>{item} ({plan.remainingPriorityCounts[item] ?? 0} restant)</option>)}</select>
      {(query || status || priority) && <button type="button" onClick={() => { setQuery(""); setStatus(""); setPriority(""); }}><X size={16} /> Effacer</button>}
    </section>

    <div className={styles.readingControls} aria-label="Contrôles de lecture">
      <span>{expandedSections.size} section{expandedSections.size > 1 ? "s" : ""} dépliée{expandedSections.size > 1 ? "s" : ""}</span>
      <button type="button" onClick={() => setExpandedSections(new Set())}>Tout replier</button>
      <button type="button" onClick={() => setExpandedSections(new Set(visibleSections.map((section) => section.id)))}>Tout déplier</button>
    </div>

    <div className={styles.workspace}><aside className={styles.toc}><strong>Sommaire</strong><span>{visibleSections.length} résultat{visibleSections.length > 1 ? "s" : ""}</span>
      <nav aria-label="Sommaire du Master Plan">{visibleSections.map((section) => <a key={section.id} href={`#${section.id}`} className={section.level > 2 ? styles.nested : undefined}>{section.title}</a>)}</nav>
    </aside><section className={styles.content} aria-label="Contenu du Master Plan">{visibleSections.length
      ? visibleSections.map((section) => <SectionCard section={section} childSections={childrenBySection.get(section.id) ?? []} isOpen={expandedSections.has(section.id)} onToggle={() => toggleSection(section.id)} key={section.id} />)
      : <div className={styles.empty}><Search size={28} /><h2>Aucun résultat</h2><p>Essayez un autre terme ou retirez un filtre.</p></div>}
    </section></div>
  </div>;
}
