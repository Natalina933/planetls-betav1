"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCheck,
  ChevronDown,
  CircleDashed,
  Cloud,
  GitBranch,
  Github,
  Filter,
  FolderKanban,
  GitPullRequest,
  Heart,
  ListChecks,
  MessageSquareText,
  LockKeyhole,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TimerReset,
  UserRound,
  X,
} from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  SearchBar,
  SectionIntro,
  Select,
  StatsCard,
  Tag,
  Textarea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { focusFirstModalElement, trapFocusInModal } from "@/app/dashboard/owner/modalAccessibility";
import { FilterChipGroup } from "@/features/shared/components/FilterChipGroup";
import { DevelopmentSectionNav } from "@/components/development/DevelopmentSectionNav";
import {
  createManualLogEntrySeed,
  DEVELOPER_LOG_PRIORITIES,
  DEVELOPER_LOG_STATUSES,
  type DeveloperLogComment,
  type DeveloperLogDailySummary,
  type DeveloperLogEntry,
  type DeveloperLogPriority,
  type DeveloperLogView,
} from "./developerLog";
import {
  type MissionControlHealthStatus,
  type MissionControlView,
} from "./missionControl";
import {
  MASTER_PLAN_PRIORITIES,
  MASTER_PLAN_STATUSES,
  type MasterPlanSection,
  type MasterPlanView,
} from "./masterPlan";
import { projectRoadmap, type RoadmapProjectedItem, type RoadmapView } from "./roadmap";
import { type TechnicalMemoryEntry, type TechnicalMemoryView } from "./technicalMemory";
import styles from "./page.module.scss";

type MasterPlanViewerProps = {
  plan: MasterPlanView;
  journal: DeveloperLogView;
  missionControl: MissionControlView;
  roadmap: RoadmapView;
  technicalMemory: TechnicalMemoryView;
  defaultAuthor: string;
  projectVersion: string;
};

type JournalTimeframe = "all" | "today" | "week" | "month";
type DevelopmentWorkspaceTab =
  | "masterPlan"
  | "missionControl"
  | "roadmap"
  | "technicalMemory"
  | "journal";

type MasterPlanDisplayMode = "focus" | "all";
type MasterPlanPreset = "blocked" | "p1" | "recent-decisions" | "roadmap-ready" | "critical-bugs";

type ManualEntryDraft = Omit<DeveloperLogEntry, "features" | "links"> & {
  featuresText: string;
  linksText: string;
};

type ExecutivePriorityAction = {
  id: string;
  title: string;
  detail: string;
  tone: string;
  badge: string;
};

type ExecutiveAlertItem = {
  id: string;
  title: string;
  detail: string;
  tone: "danger" | "warning" | "healthy";
  cta?: "blocked-master-plan";
};

const FAVORITES_STORAGE_KEY = "planetls:developer-log:favorites";
const COMMENTS_STORAGE_KEY = "planetls:developer-log:comments";
const MANUAL_ENTRIES_STORAGE_KEY = "planetls:developer-log:manual-entries";
const ROADMAP_COMPLETIONS_STORAGE_KEY = "planetls:developer-roadmap:completions";
const REFERENCE_NOW = new Date("2026-07-27T12:00:00+02:00");

function stripMarkdown(value: string) {
  return value.replace(/[`*_]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function _LegacyMarkdownContent({ content }: { content: string }) {
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
      ? <p className={styles.listItem} key={index}>- {stripMarkdown(listMatch[1])}</p>
      : <p key={index}>{stripMarkdown(line)}</p>);
  }
  return nodes;
}

function formatEntryDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(date));
}

function formatDateOnly(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(new Date(date));
}

function formatTimeOnly(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" }).format(new Date(date));
}

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(date));
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function getWeekStart(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + delta);
  next.setHours(0, 0, 0, 0);
  return next;
}

function inTimeframe(date: string, timeframe: JournalTimeframe) {
  if (timeframe === "all") return true;
  const entryDate = new Date(date);
  if (timeframe === "today") return isSameDay(entryDate, REFERENCE_NOW);
  if (timeframe === "week") {
    const start = getWeekStart(REFERENCE_NOW);
    return entryDate >= start && entryDate <= REFERENCE_NOW;
  }
  if (timeframe === "month") {
    return entryDate.getFullYear() === REFERENCE_NOW.getFullYear()
      && entryDate.getMonth() === REFERENCE_NOW.getMonth();
  }
  return true;
}

function linkIcon(kind: DeveloperLogEntry["links"][number]["kind"]) {
  if (kind === "pull-request") return <GitPullRequest size={14} aria-hidden="true" />;
  if (kind === "document") return <FolderKanban size={14} aria-hidden="true" />;
  return <BookOpen size={14} aria-hidden="true" />;
}

function priorityChipClass(priority: DeveloperLogPriority) {
  if (priority === "P0 Critique") return styles.priorityCritical;
  if (priority === "P1 Prioritaire") return styles.priorityHigh;
  if (priority === "P2 Important") return styles.priorityMedium;
  return styles.priorityLow;
}

function _legacyCategoryDotClass(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("admin")) return styles.categoryAdmin;
  if (normalized.includes("pilot")) return styles.categoryPilotage;
  if (normalized.includes("profil")) return styles.categoryProfile;
  if (normalized.includes("équipe") || normalized.includes("equipe")) return styles.categoryTeam;
  if (normalized.includes("ux")) return styles.categoryUx;
  if (normalized.includes("qualit")) return styles.categoryQuality;
  return styles.categoryProduct;
}

function categoryDotClass(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("admin")) return styles.categoryAdmin;
  if (normalized.includes("pilot")) return styles.categoryPilotage;
  if (normalized.includes("profil")) return styles.categoryProfile;
  if (normalized.includes("équipe") || normalized.includes("equipe")) return styles.categoryTeam;
  if (normalized.includes("ux")) return styles.categoryUx;
  if (normalized.includes("qualit")) return styles.categoryQuality;
  return styles.categoryProduct;
}

function parseLinks(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [labelPart, hrefPart] = line.includes("|") ? line.split("|") : [`Lien ${index + 1}`, line];
      const href = hrefPart?.trim() || "";
      const label = labelPart.trim() || `Lien ${index + 1}`;
      const kind = href.includes("/pull/") ? "pull-request" : href.includes("/commit/") ? "commit" : "document";
      return { label, href, kind } as DeveloperLogEntry["links"][number];
    })
    .filter((item) => item.href);
}

function parseFeatures(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function healthToneClass(status: MissionControlHealthStatus) {
  if (status === "healthy") return styles.healthHealthy;
  if (status === "warning") return styles.healthWarning;
  if (status === "danger") return styles.healthDanger;
  return styles.healthUnknown;
}

function healthIcon(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("supabase")) return <ShieldCheck size={16} aria-hidden="true" />;
  if (normalized.includes("vercel")) return <Cloud size={16} aria-hidden="true" />;
  if (normalized.includes("github")) return <Github size={16} aria-hidden="true" />;
  return <CircleDashed size={16} aria-hidden="true" />;
}

function roadmapStatusClass(item: RoadmapProjectedItem) {
  if (item.isCompleted) return styles.roadmapCompleted;
  if (item.isReady) return styles.roadmapReady;
  return styles.roadmapBlocked;
}

function formatRoadmapDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(date));
}

function renderAuditList(items: string[] | undefined, emptyLabel: string) {
  if (!items?.length) {
    return <p>{emptyLabel}</p>;
  }

  return (
    <ul className={styles.auditList}>
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

function summarizeHealthStatus(healthCards: MissionControlView["healthCards"]) {
  const dangerCount = healthCards.filter((card) => card.status === "danger").length;
  const warningCount = healthCards.filter((card) => card.status === "warning").length;
  const unverifiableCount = healthCards.filter((card) => card.status === "unverifiable").length;

  if (dangerCount > 0) {
    return {
      label: "Risque eleve",
      detail: `${dangerCount} signal(aux) critique(s) à traiter immédiatement.`,
      className: styles.executiveDanger,
    };
  }
  if (warningCount > 0 || unverifiableCount > 0) {
    return {
      label: "Sous surveillance",
      detail: `${warningCount + unverifiableCount} zone(s) à confirmer avant passage de release.`,
      className: styles.executiveWarning,
    };
  }
  return {
    label: "Pret pour stabilisation",
    detail: "Les signaux techniques principaux sont au vert pour poursuivre sereinement.",
    className: styles.executiveHealthy,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hoursSince(date: string | null) {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.max(0, Math.round((REFERENCE_NOW.getTime() - parsed.getTime()) / (1000 * 60 * 60)));
}

function formatBlockedByLabels(item: RoadmapProjectedItem, roadmap: RoadmapView) {
  return item.blockedBy.map((dependencyId) => roadmap.items.find((candidate) => candidate.id === dependencyId)?.title ?? dependencyId);
}

function CollapsibleCardHeader({
  title,
  meta,
  isOpen,
  onToggle,
  eyebrow,
  className,
}: {
  title: string;
  meta?: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  eyebrow?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={[styles.cardToggle, className].filter(Boolean).join(" ")}
      onClick={onToggle}
      aria-expanded={isOpen}
    >
      <div className={styles.cardToggleText}>
        {eyebrow ? <p className={styles.categoryLabel}>{eyebrow}</p> : null}
        <strong>{title}</strong>
      </div>
      <span className={styles.cardToggleMeta}>
        {meta}
        <ChevronDown size={18} className={styles.chevron} aria-hidden="true" />
      </span>
    </button>
  );
}

function DailySummaryCard({
  summary,
  isOpen,
  onToggle,
}: {
  summary: DeveloperLogDailySummary;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className={styles.dailySummaryCard} tone="soft">
      <CardHeader className={styles.dailySummaryHeader}>
        <CollapsibleCardHeader
          title={summary.title}
          eyebrow="Résumé quotidien"
          meta={<Tag tone="neutral">{formatDateLabel(summary.date)}</Tag>}
          isOpen={isOpen}
          onToggle={onToggle}
        />
      </CardHeader>
      <CardBody className={styles.dailySummaryBody}>
        <p>{summary.summary}</p>
        <div className={styles.dailySummaryFacts}>
          <div><strong>Entrees</strong><span>{summary.entryCount}</span></div>
          <div><strong>Fichiers</strong><span>{summary.modifiedFilesCount}</span></div>
          <div><strong>Focus</strong><span>{summary.features.length}</span></div>
        </div>
        {isOpen ? <div className={styles.dailySummaryPanels}>
          <article>
            <strong>Fonctionnalites couvertes</strong>
            {renderAuditList(summary.features, "Aucune fonctionnalité déduite.")}
          </article>
          <article>
            <strong>Roadmap mise à jour</strong>
            {renderAuditList(summary.roadmapUpdates, "Aucune mise à jour de roadmap détectée.")}
          </article>
          <article>
            <strong>Tâches restantes</strong>
            {renderAuditList(summary.remainingTasks, "Aucune tâche restante déduite.")}
          </article>
          <article>
            <strong>Regressions a surveiller</strong>
            {renderAuditList(summary.potentialRegressions, "Aucune régression potentielle remontée.")}
          </article>
        </div> : null}
      </CardBody>
    </Card>
  );
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
      {section.content ? <MarkdownContent content={section.content} /> : childSections.length ? <p className={styles.emptySection}>
        Cette section sert surtout de regroupement. Ouvrez les sous-sections concernées pour lire les tableaux et le détail utile.
      </p> : <p className={styles.emptySection}>Aucun contenu n’est encore renseigné pour cette section.</p>}
    </div> : null}
  </article>;
}

function _LegacyFoldableSectionHeader({
  title,
  summary,
  isOpen,
  onToggle,
  controlsId,
}: {
  title: string;
  summary: string;
  isOpen: boolean;
  onToggle: () => void;
  controlsId: string;
}) {
  return (
    <button
      type="button"
      className={styles.foldableToggle}
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={controlsId}
    >
      <div className={styles.foldableHeading}>
        <span className={styles.foldableLabel}>{title}</span>
        <p>{summary}</p>
      </div>
      <span className={styles.foldableMeta}>
        <span>{isOpen ? "Replier" : "Déplier"}</span>
        <ChevronDown className={isOpen ? styles.foldableChevronOpen : styles.foldableChevron} size={20} aria-hidden="true" />
      </span>
    </button>
  );
}

function FoldableSectionHeader({
  title,
  summary,
  isOpen,
  onToggle,
  controlsId,
}: {
  title: string;
  summary: string;
  isOpen: boolean;
  onToggle: () => void;
  controlsId: string;
}) {
  const TitleTag = isOpen ? "span" : "h2";

  return (
    <button
      type="button"
      className={styles.foldableToggle}
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={controlsId}
    >
      <div className={styles.foldableHeading}>
        <TitleTag className={styles.foldableLabel}>{title}</TitleTag>
        <p>{summary}</p>
      </div>
      <span className={styles.foldableMeta}>
        <span>{isOpen ? "Replier" : "Déplier"}</span>
        <ChevronDown className={isOpen ? styles.foldableChevronOpen : styles.foldableChevron} size={20} aria-hidden="true" />
      </span>
    </button>
  );
}

export function MasterPlanViewer({ plan, journal, missionControl, roadmap, technicalMemory, defaultAuthor, projectVersion }: MasterPlanViewerProps) {
  const blockedMasterPlanStatus = "⚠️ Bloqué";
  const workspaceAnchorRef = useRef<HTMLDivElement | null>(null);
  const [masterPlanQuery, setMasterPlanQuery] = useState("");
  const [masterPlanStatus, setMasterPlanStatus] = useState("");
  const [masterPlanPriority, setMasterPlanPriority] = useState("");
  const [masterPlanDisplayMode, setMasterPlanDisplayMode] = useState<MasterPlanDisplayMode>("focus");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(),
  );

  const [journalQuery, setJournalQuery] = useState("");
  const [journalTimeframe, setJournalTimeframe] = useState<JournalTimeframe>("all");
  const [journalFeature, setJournalFeature] = useState("");
  const [journalPriority, setJournalPriority] = useState("");
  const [journalAuthor, setJournalAuthor] = useState("");
  const [memoryQuery, setMemoryQuery] = useState("");
  const [memoryCategory, setMemoryCategory] = useState("");
  const [memoryTag, setMemoryTag] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [commentsByEntry, setCommentsByEntry] = useState<Record<string, DeveloperLogComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [manualEntries, setManualEntries] = useState<DeveloperLogEntry[]>([]);
  const [roadmapCompletedIds, setRoadmapCompletedIds] = useState<string[]>([]);
  const [expandedTimelineEntryIds, setExpandedTimelineEntryIds] = useState<string[]>([]);
  const [expandedDailySummaryIds, setExpandedDailySummaryIds] = useState<string[]>(() => journal.dailySummaries.slice(0, 1).map((summary) => summary.id));
  const [expandedMemoryEntryIds, setExpandedMemoryEntryIds] = useState<string[]>(() => technicalMemory.entries.slice(0, 2).map((entry) => entry.id));
  const [expandedExecutivePanels, setExpandedExecutivePanels] = useState<string[]>(["priorities", "dependencies", "alerts"]);
  const [expandedRoadmapLanes, setExpandedRoadmapLanes] = useState<string[]>(["ready", "blocked"]);
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState({
    missionControl: true,
    technicalMemory: false,
    roadmap: true,
    journal: false,
    masterPlan: true,
  });
  const [manualDraft, setManualDraft] = useState<ManualEntryDraft>(() => {
    const seed = createManualLogEntrySeed(projectVersion, defaultAuthor);
    return { ...seed, featuresText: "", linksText: "" };
  });
  const [pendingMasterPlanAnchor, setPendingMasterPlanAnchor] = useState<string | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<DevelopmentWorkspaceTab>("masterPlan");

  useEffect(() => {
    setFavoriteIds(readStorage<string[]>(FAVORITES_STORAGE_KEY, []));
    setCommentsByEntry(readStorage<Record<string, DeveloperLogComment[]>>(COMMENTS_STORAGE_KEY, {}));
    setManualEntries(readStorage<DeveloperLogEntry[]>(MANUAL_ENTRIES_STORAGE_KEY, []));
    setRoadmapCompletedIds(readStorage<string[]>(ROADMAP_COMPLETIONS_STORAGE_KEY, []));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
    }
  }, [favoriteIds]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(commentsByEntry));
    }
  }, [commentsByEntry]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MANUAL_ENTRIES_STORAGE_KEY, JSON.stringify(manualEntries));
    }
  }, [manualEntries]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ROADMAP_COMPLETIONS_STORAGE_KEY, JSON.stringify(roadmapCompletedIds));
    }
  }, [roadmapCompletedIds]);

  useEffect(() => {
    if (!pendingMasterPlanAnchor || !panelOpen.masterPlan) return;
    const timer = window.setTimeout(() => {
      const target = document.getElementById(pendingMasterPlanAnchor);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (target instanceof HTMLElement) {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
      setPendingMasterPlanAnchor(null);
    }, 80);

    return () => window.clearTimeout(timer);
  }, [panelOpen.masterPlan, pendingMasterPlanAnchor]);

  useEffect(() => {
    if (!isManualEntryModalOpen) return;

    const modal = document.getElementById("developer-log-manual-entry-modal");
    if (modal instanceof HTMLElement) {
      window.requestAnimationFrame(() => focusFirstModalElement(modal));
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsManualEntryModalOpen(false);
        return;
      }

      const dialog = document.getElementById("developer-log-manual-entry-modal");
      if (dialog instanceof HTMLElement) {
        trapFocusInModal(event, dialog);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isManualEntryModalOpen]);

  const combinedEntries = useMemo(
    () => [...manualEntries, ...journal.entries].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [journal.entries, manualEntries],
  );

  const filteredMasterPlanSections = useMemo(() => {
    const normalizedQuery = masterPlanQuery.trim().toLocaleLowerCase("fr");
    return plan.sections.filter((section) => {
      const matchesQuery = !normalizedQuery || `${section.title} ${section.content}`.toLocaleLowerCase("fr").includes(normalizedQuery);
      return matchesQuery
        && (!masterPlanStatus || section.statuses.includes(masterPlanStatus))
        && (!masterPlanPriority || section.priorities.includes(masterPlanPriority));
    });
  }, [masterPlanPriority, masterPlanQuery, masterPlanStatus, plan.sections]);

  const hasMasterPlanFilters = Boolean(masterPlanQuery || masterPlanStatus || masterPlanPriority);

  const focusedMasterPlanSections = useMemo(() => {
    const seen = new Set<string>();
    const prioritized = filteredMasterPlanSections.filter((section) => (
      section.priorities.includes("P0 Critique")
      || section.priorities.includes("P1 Prioritaire")
      || section.statuses.includes("⚠️ Bloqué")
      || section.statuses.includes("🟡 En cours")
      || section.statuses.includes("🟠 Partiel")
    ));
    const structural = filteredMasterPlanSections.filter((section) => section.level <= 2).slice(0, 10);

    return [...prioritized, ...structural].filter((section) => {
      if (seen.has(section.id)) return false;
      seen.add(section.id);
      return true;
    });
  }, [filteredMasterPlanSections]);

  const visibleSections = useMemo(() => {
    if (hasMasterPlanFilters || masterPlanDisplayMode === "all") return filteredMasterPlanSections;
    return focusedMasterPlanSections;
  }, [filteredMasterPlanSections, focusedMasterPlanSections, hasMasterPlanFilters, masterPlanDisplayMode]);

  const roadmapProjection = useMemo(
    () => projectRoadmap(roadmap, roadmapCompletedIds),
    [roadmap, roadmapCompletedIds],
  );

  const filteredMemoryEntries = useMemo(() => {
    const normalizedQuery = memoryQuery.trim().toLocaleLowerCase("fr");
    return technicalMemory.entries.filter((entry) => {
      const haystack = [
        entry.title,
        entry.question,
        entry.answer,
        entry.rationale,
        entry.impact,
        entry.category,
        entry.tags.join(" "),
        entry.evidence.join(" "),
      ].join(" ").toLocaleLowerCase("fr");
      return (!normalizedQuery || haystack.includes(normalizedQuery))
        && (!memoryCategory || entry.category === memoryCategory)
        && (!memoryTag || entry.tags.includes(memoryTag));
    });
  }, [memoryCategory, memoryQuery, memoryTag, technicalMemory.entries]);

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

  const journalAuthors = useMemo(
    () => Array.from(new Set([...journal.authors, ...manualEntries.map((entry) => entry.author)])).sort((a, b) => a.localeCompare(b, "fr")),
    [journal.authors, manualEntries],
  );
  const journalCategories = useMemo(
    () => Array.from(new Set([...journal.categories, ...manualEntries.map((entry) => entry.category)])).sort((a, b) => a.localeCompare(b, "fr")),
    [journal.categories, manualEntries],
  );
  const journalFeatures = useMemo(
    () => Array.from(new Set([...journal.features, ...manualEntries.flatMap((entry) => entry.features)])).sort((a, b) => a.localeCompare(b, "fr")),
    [journal.features, manualEntries],
  );

  const filteredEntries = useMemo(() => {
    const normalizedQuery = journalQuery.trim().toLocaleLowerCase("fr");
    return combinedEntries.filter((entry) => {
      const haystack = [
        entry.title,
        entry.description,
        entry.decisions,
        entry.reasons,
        entry.difficulties,
        entry.solution,
        entry.author,
        entry.category,
        entry.features.join(" "),
      ].join(" ").toLocaleLowerCase("fr");
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesTimeframe = inTimeframe(entry.createdAt, journalTimeframe);
      const matchesFeature = !journalFeature || entry.features.includes(journalFeature);
      const matchesPriority = !journalPriority || entry.priority === journalPriority;
      const matchesAuthor = !journalAuthor || entry.author === journalAuthor;
      const matchesFavorite = !favoritesOnly || favoriteIds.includes(entry.id);
      return matchesQuery && matchesTimeframe && matchesFeature && matchesPriority && matchesAuthor && matchesFavorite;
    });
  }, [combinedEntries, favoriteIds, favoritesOnly, journalAuthor, journalFeature, journalPriority, journalQuery, journalTimeframe]);

  const favoriteCount = favoriteIds.length;
  const commentCount = useMemo(
    () => Object.values(commentsByEntry).reduce((total, comments) => total + comments.length, 0),
    [commentsByEntry],
  );
  const manualCount = manualEntries.length;
  const todayCount = useMemo(
    () => combinedEntries.filter((entry) => inTimeframe(entry.createdAt, "today")).length,
    [combinedEntries],
  );
  const roadmapCompletedCount = roadmapProjection.completedItems.length;
  const roadmapReadyCount = roadmapProjection.readyItems.length;
  const roadmapBlockedCount = roadmapProjection.blockedItems.length;
  const roadmapCoverage = roadmap.items.length ? Math.round((roadmapCompletedCount / roadmap.items.length) * 100) : 0;
  const canonicalMemoryCount = technicalMemory.entries.filter((entry) => entry.source === "canonique").length;
  const missionControlSummary = `${missionControl.progressionPct}% d'avancement, ${missionControl.inProgressFeatures} actif(s), ${missionControl.blockedFeatures} bloqué(s)`;
  const memorySummary = `${technicalMemory.entries.length} décisions indexées, filtres et recherche instantanée`;
  const roadmapSummary = `${roadmapReadyCount} prête(s), ${roadmapBlockedCount} dépendance(s), recalcul automatique`;
  const journalSummary = `${filteredEntries.length} entrée(s), ${favoriteCount} favori(s), ${commentCount} commentaire(s)`;
  const hiddenMasterPlanCount = Math.max(filteredMasterPlanSections.length - visibleSections.length, 0);
  const masterPlanSummary = hasMasterPlanFilters
    ? `${visibleSections.length} section(s) correspondent aux filtres actifs`
    : masterPlanDisplayMode === "focus"
      ? `${visibleSections.length} section(s) utiles en lecture guidée${hiddenMasterPlanCount > 0 ? `, ${hiddenMasterPlanCount} masquée(s)` : ""}`
      : `${visibleSections.length} section(s) et tableaux visibles`;
  const masterPlanPriorityReads = plan.planning
    .filter((item) => item.priority === "P0 Critique" || item.priority === "P1 Prioritaire")
    .slice(0, 4);
  const executiveHealth = summarizeHealthStatus(missionControl.healthCards);
  const healthDangerCount = missionControl.healthCards.filter((card) => card.status === "danger").length;
  const healthWarningCount = missionControl.healthCards.filter((card) => card.status === "warning").length;
  const healthUnverifiableCount = missionControl.healthCards.filter((card) => card.status === "unverifiable").length;
  const hoursSinceLastBackup = hoursSince(missionControl.lastBackupAt);
  const nextSuggestion = roadmapProjection.nextSuggestion;
  const topReadyItems = roadmapProjection.readyItems.slice(0, 3);
  const topBlockedItems = roadmapProjection.blockedItems.slice(0, 3);
  const topDependencies = Array.from(
    new Set(
      roadmapProjection.blockedItems
        .slice(0, 5)
        .flatMap((item) => formatBlockedByLabels(item, roadmap)),
    ),
  ).slice(0, 4);
  const recentSignals = [
    ...missionControl.lastDecisions.slice(0, 2).map((decision) => ({
      id: `decision-${decision.date}-${decision.title}`,
      label: decision.category,
      title: decision.title,
      meta: decision.date,
    })),
    ...missionControl.lastCommits.slice(0, 2).map((commit) => ({
      id: `commit-${commit.sha}`,
      label: commit.shortSha,
      title: commit.subject,
      meta: commit.author,
    })),
  ].slice(0, 4);
  const priorityActions: ExecutivePriorityAction[] = [
    nextSuggestion
      ? {
          id: `next-${nextSuggestion.id}`,
          title: nextSuggestion.title,
          detail: nextSuggestion.nextAction || "Action à préciser",
          tone: nextSuggestion.isReady ? styles.priorityActionReady : styles.priorityActionBlocked,
          badge: nextSuggestion.isReady ? "Maintenant" : "Dépendances",
        }
      : null,
    ...topBlockedItems.map((item) => ({
      id: `blocked-${item.id}`,
      title: item.title,
      detail: `Débloquer via ${formatBlockedByLabels(item, roadmap).join(", ") || "dépendance à préciser"}.`,
      tone: styles.priorityActionBlocked,
      badge: `${item.blockedBy.length} blocage(s)`,
    })),
    ...topReadyItems.slice(0, 2).map((item) => ({
      id: `ready-${item.id}`,
      title: item.title,
      detail: item.nextAction || "Prêt à lancer.",
      tone: styles.priorityActionReady,
      badge: item.priority,
    })),
  ].filter((item): item is ExecutivePriorityAction => Boolean(item));
  const operationalTensionScore = clamp(
    missionControl.blockedFeatures * 18
      + missionControl.criticalBugs * 22
      + roadmapBlockedCount * 8
      + healthDangerCount * 12
      + healthWarningCount * 5
      + healthUnverifiableCount * 4,
    0,
    100,
  );
  const operationalTension = operationalTensionScore >= 70
    ? {
        label: "Tension élevée",
        detail: "Des arbitrages produit, technique ou opérationnels sont requis pour éviter un ralentissement global.",
        className: styles.tensionHigh,
      }
    : operationalTensionScore >= 40
      ? {
          label: "Tension modérée",
          detail: "Le cockpit tient la trajectoire, mais plusieurs dépendances doivent être levées rapidement.",
          className: styles.tensionMedium,
        }
      : {
          label: "Tension maîtrisée",
          detail: "Le flux reste pilotable. Les risques présents sont visibles et peuvent être absorbés par l'exécution courante.",
          className: styles.tensionLow,
        };
  const alertRailItems: ExecutiveAlertItem[] = [
    missionControl.blockedFeatures > 0
      ? {
          id: "blocked-features",
          title: `${missionControl.blockedFeatures} blocage(s) actif(s)`,
          detail: "Des fonctionnalités attendent un déblocage explicite dans le Master Plan.",
          tone: "danger",
          cta: "blocked-master-plan",
        }
      : {
          id: "blocked-features",
          title: "Aucun blocage ouvert",
          detail: "La roadmap ne remonte pas de fonctionnalité gelée à cet instant.",
          tone: "healthy",
        },
    missionControl.criticalBugs > 0
      ? {
          id: "critical-bugs",
          title: `${missionControl.criticalBugs} bug(s) critique(s)`,
          detail: `${missionControl.minorBugs} point(s) secondaire(s) restent également à surveiller.`,
          tone: "danger",
        }
      : {
          id: "critical-bugs",
          title: "Aucun bug critique remonté",
          detail: `${missionControl.minorBugs} point(s) secondaire(s) seulement dans le radar courant.`,
          tone: missionControl.minorBugs > 0 ? "warning" : "healthy",
        },
    roadmapBlockedCount > 0
      ? {
          id: "roadmap-dependencies",
          title: `${roadmapBlockedCount} dépendance(s) active(s)`,
          detail: topDependencies.length
            ? `Les verrous les plus exposés sont ${topDependencies.join(", ")}.`
            : "Des enchaînements restent dépendants d'étapes amont.",
          tone: roadmapBlockedCount >= 3 ? "warning" : "healthy",
        }
      : {
          id: "roadmap-dependencies",
          title: "Roadmap fluide",
          detail: "Aucune dépendance critique ne remonte dans la projection actuelle.",
          tone: "healthy",
        },
    healthDangerCount > 0 || healthWarningCount > 0 || healthUnverifiableCount > 0
      ? {
          id: "health-checks",
          title: `${healthDangerCount} alerte(s), ${healthWarningCount} vigilance(s)`,
          detail: healthUnverifiableCount > 0
            ? `${healthUnverifiableCount} contrôle(s) restent non vérifiables et demandent une validation humaine.`
            : "Les contrôles sensibles sont identifiés dans la santé projet.",
          tone: healthDangerCount > 0 ? "danger" : "warning",
        }
      : {
          id: "health-checks",
          title: "Santé projet stable",
          detail: "Les contrôles principaux restent au vert dans le cockpit actuel.",
          tone: "healthy",
        },
    hoursSinceLastBackup === null
      ? {
          id: "execution-rhythm",
          title: "Aucun repère d'exécution récent",
          detail: "Le cockpit ne trouve pas encore de dernier commit exploitable pour qualifier le rythme courant.",
          tone: "warning",
        }
      : hoursSinceLastBackup > 72
        ? {
            id: "execution-rhythm",
            title: `Rythme à relancer · ${hoursSinceLastBackup} h sans commit détecté`,
            detail: `Le volume estimé de la semaine reste à ${missionControl.weeklyDevelopmentLabel}. Un check de reprise est recommandé.`,
            tone: "warning",
          }
        : {
            id: "execution-rhythm",
            title: `Rythme actif · dernier repère il y a ${hoursSinceLastBackup} h`,
            detail: `${missionControl.weeklyDevelopmentLabel} d'exécution estimée cette semaine avec un flux encore vivant.`,
            tone: "healthy",
          },
  ];
  const releaseReadiness = operationalTensionScore >= 70
    ? "Release à protéger avant toute extension de périmètre."
    : operationalTensionScore >= 40
      ? "Release envisageable avec séquencement serré et surveillance active."
      : "Release compatible avec la trajectoire actuelle du projet.";
  const escalationHeadline = priorityActions[0]?.title || topBlockedItems[0]?.title || missionControl.weeklyGoal;

  const toggleSection = (sectionId: string) => {
    setExpandedSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const toggleFavorite = (entryId: string) => {
    setFavoriteIds((current) => (
      current.includes(entryId) ? current.filter((item) => item !== entryId) : [...current, entryId]
    ));
  };

  const toggleRoadmapCompletion = (itemId: string) => {
    setRoadmapCompletedIds((current) => (
      current.includes(itemId) ? current.filter((value) => value !== itemId) : [...current, itemId]
    ));
  };

  const toggleExpandedTimelineEntry = (entryId: string) => {
    setExpandedTimelineEntryIds((current) => (
      current.includes(entryId) ? current.filter((value) => value !== entryId) : [...current, entryId]
    ));
  };

  const toggleExpandedDailySummary = (summaryId: string) => {
    setExpandedDailySummaryIds((current) => (
      current.includes(summaryId) ? current.filter((value) => value !== summaryId) : [...current, summaryId]
    ));
  };

  const toggleExpandedMemoryEntry = (entryId: string) => {
    setExpandedMemoryEntryIds((current) => (
      current.includes(entryId) ? current.filter((value) => value !== entryId) : [...current, entryId]
    ));
  };

  const toggleExpandedExecutivePanel = (panelId: string) => {
    setExpandedExecutivePanels((current) => (
      current.includes(panelId) ? current.filter((value) => value !== panelId) : [...current, panelId]
    ));
  };

  const toggleExpandedRoadmapLane = (laneId: string) => {
    setExpandedRoadmapLanes((current) => (
      current.includes(laneId) ? current.filter((value) => value !== laneId) : [...current, laneId]
    ));
  };

  const togglePanel = (panel: keyof typeof panelOpen) => {
    setPanelOpen((current) => ({ ...current, [panel]: !current[panel] }));
  };

  const resetManualDraft = () => {
    const seed = createManualLogEntrySeed(projectVersion, defaultAuthor);
    setManualDraft({ ...seed, featuresText: "", linksText: "" });
  };

  const updateManualDraft = (field: keyof ManualEntryDraft, value: string | number) => {
    setManualDraft((current) => ({ ...current, [field]: value }));
  };

  const submitManualEntry = () => {
    if (!manualDraft.title.trim() || !manualDraft.description.trim()) return;
    const nextEntry: DeveloperLogEntry = {
      ...manualDraft,
      title: manualDraft.title.trim(),
      description: manualDraft.description.trim(),
      decisions: manualDraft.decisions.trim(),
      reasons: manualDraft.reasons.trim(),
      difficulties: manualDraft.difficulties.trim(),
      solution: manualDraft.solution.trim(),
      author: manualDraft.author.trim() || defaultAuthor,
      category: manualDraft.category.trim() || "Produit",
      version: manualDraft.version.trim() || projectVersion,
      features: parseFeatures(manualDraft.featuresText),
      links: parseLinks(manualDraft.linksText),
      timeSpentMinutes: Number(manualDraft.timeSpentMinutes) || 0,
    };
    setManualEntries((current) => [nextEntry, ...current]);
    resetManualDraft();
  };

  const submitComment = (entryId: string) => {
    const content = (commentDrafts[entryId] ?? "").trim();
    if (!content) return;
    const comment: DeveloperLogComment = {
      id: `${entryId}-${Date.now()}`,
      author: defaultAuthor,
      content,
      createdAt: new Date().toISOString(),
    };
    setCommentsByEntry((current) => ({
      ...current,
      [entryId]: [...(current[entryId] ?? []), comment],
    }));
    setCommentDrafts((current) => ({ ...current, [entryId]: "" }));
  };

  const openBlockedMasterPlanItems = () => {
    const blockedSections = plan.sections.filter((section) => section.statuses.includes(blockedMasterPlanStatus));
    setActiveWorkspaceTab("masterPlan");
    setMasterPlanDisplayMode("focus");
    setMasterPlanQuery("");
    setMasterPlanPriority("");
    setMasterPlanStatus(blockedMasterPlanStatus);
    setExpandedSections(new Set(blockedSections.map((section) => section.id)));
    setPanelOpen((current) => ({ ...current, masterPlan: true }));
    setPendingMasterPlanAnchor(blockedSections[0]?.id ?? "master-plan-detail-panel");
  };

  const applyMasterPlanPreset = (preset: MasterPlanPreset) => {
    if (preset === "roadmap-ready") {
      setActiveWorkspaceTab("roadmap");
      setPanelOpen((current) => ({ ...current, roadmap: true }));
      setExpandedRoadmapLanes((current) => (
        current.includes("ready") ? current : [...current, "ready"]
      ));
      setPendingMasterPlanAnchor(null);
      return;
    }

    if (preset === "critical-bugs") {
      setActiveWorkspaceTab("missionControl");
      setPanelOpen((current) => ({ ...current, missionControl: true }));
      setPendingMasterPlanAnchor(null);
      return;
    }

    setActiveWorkspaceTab("masterPlan");
    setPanelOpen((current) => ({ ...current, masterPlan: true }));
    setMasterPlanDisplayMode("focus");
    setExpandedSections(new Set());

    if (preset === "blocked") {
      const blockedSections = plan.sections.filter((section) => section.statuses.includes(blockedMasterPlanStatus));
      setMasterPlanQuery("");
      setMasterPlanPriority("");
      setMasterPlanStatus(blockedMasterPlanStatus);
      setExpandedSections(new Set(blockedSections.map((section) => section.id)));
      setPendingMasterPlanAnchor(blockedSections[0]?.id ?? "master-plan-detail-panel");
      return;
    }

    if (preset === "p1") {
      const p1Sections = plan.sections.filter((section) => section.priorities.includes("P1 Prioritaire"));
      setMasterPlanQuery("");
      setMasterPlanStatus("");
      setMasterPlanPriority("P1 Prioritaire");
      setExpandedSections(new Set(p1Sections.slice(0, 6).map((section) => section.id)));
      setPendingMasterPlanAnchor(p1Sections[0]?.id ?? "master-plan-detail-panel");
      return;
    }

    const recentDecisionSections = plan.sections.filter((section) => (
      section.title.includes("Mise à jour ciblée") || section.content.includes("Ajout du")
    ));
    setMasterPlanQuery("Mise à jour ciblée");
    setMasterPlanStatus("");
    setMasterPlanPriority("");
    setExpandedSections(new Set(recentDecisionSections.slice(0, 6).map((section) => section.id)));
    setPendingMasterPlanAnchor(recentDecisionSections[0]?.id ?? "master-plan-detail-panel");
  };

  const handleWorkspaceTabChange = (value: string) => {
    setActiveWorkspaceTab(value as DevelopmentWorkspaceTab);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        workspaceAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  return <div className={styles.page}>
    <Tabs value={activeWorkspaceTab} onValueChange={handleWorkspaceTabChange}>
    <header className={styles.executiveHero}>
      <div className={styles.executiveHeroMain}>
        <div className={styles.executiveHeroTopline}>
          <span className={styles.eyebrow}><Radar size={16} /> Pilotage développement</span>
          <DevelopmentSectionNav active="pilotage" />
          <Tag tone="neutral" className={executiveHealth.className}>{executiveHealth.label}</Tag>
        </div>
        <div className={styles.executiveHeroHeading}>
          <div>
            <h1>{plan.title}</h1>
            <p>
              Vue de pilotage premium pour suivre l'état global du produit, les dépendances actives,
              le rythme réel d'exécution et la meilleure prochaine action à lancer.
            </p>
          </div>
          <Link href="/dashboard/admin" className={styles.backLink}>Retour au cockpit admin</Link>
        </div>
        <div className={styles.pageSummary} aria-label="Navigation principale de la page Développement">
          <div className={styles.pageSummaryIntro}>
            <span>Navigation</span>
            <strong>Ouvrir une vue claire plutôt qu’une longue page continue</strong>
            <p>Le tableau fonctionnel du Master Plan passe d’abord, puis les vues d’exécution, de feuille de route, de mémoire technique et de journal.</p>
          </div>
          <TabsList className={styles.workspaceTabsList}>
            <TabsTrigger value="masterPlan" className={styles.workspaceTabTrigger}>
              <span>Tableau fonctionnel</span>
              <small>Master Plan au début</small>
            </TabsTrigger>
            <TabsTrigger value="missionControl" className={styles.workspaceTabTrigger}>
              <span>Mission Control</span>
              <small>État, alertes, priorités</small>
            </TabsTrigger>
            <TabsTrigger value="roadmap" className={styles.workspaceTabTrigger}>
              <span>Roadmap</span>
              <small>Prochaine action logique</small>
            </TabsTrigger>
            <TabsTrigger value="technicalMemory" className={styles.workspaceTabTrigger}>
              <span>Mémoire</span>
              <small>Décisions de référence</small>
            </TabsTrigger>
            <TabsTrigger value="journal" className={styles.workspaceTabTrigger}>
              <span>Journal</span>
              <small>Activité et suivi</small>
            </TabsTrigger>
          </TabsList>
        </div>
        <div className={styles.executiveSignalGrid}>
          <Card className={styles.executiveLeadCard}>
            <CardBody className={styles.executiveLeadBody}>
              <div>
                <p className={styles.progressEyebrow}>Résumé exécutif</p>
                <strong>{missionControl.progressionPct}%</strong>
                <p>
                  {missionControl.completedFeatures} fonctionnalité(s) clôturées, {missionControl.inProgressFeatures} chantier(s) en exécution
                  et {missionControl.blockedFeatures} blocage(s) nécessitant un arbitrage.
                </p>
              </div>
              <div className={styles.progressRing} aria-label={`Progression globale ${missionControl.progressionPct}%`}>
                <svg viewBox="0 0 120 120" aria-hidden="true">
                  <circle cx="60" cy="60" r="48" />
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    pathLength="100"
                    style={{ strokeDasharray: `${missionControl.progressionPct} 100` }}
                  />
                </svg>
                <span>{missionControl.progressionPct}%</span>
              </div>
            </CardBody>
          </Card>
          <Card className={styles.executiveSummaryCard}>
            <CardHeader className={styles.executiveSectionHeader}>
              <strong>Prochaine meilleure action</strong>
              <Tag tone="gold">{nextSuggestion?.isReady ? "Maintenant" : "Sous dépendances"}</Tag>
            </CardHeader>
            <CardBody className={styles.executiveSummaryBody}>
              {nextSuggestion ? (
                <>
                  <h2>{nextSuggestion.title}</h2>
                  <p>{nextSuggestion.nextAction || "Aucune prochaine action détaillée pour ce chantier."}</p>
                  <div className={styles.executiveMetaRow}>
                    <span><Target size={14} /> {nextSuggestion.priority}</span>
                    <span><TimerReset size={14} /> {nextSuggestion.estimation}</span>
                    <span><LockKeyhole size={14} /> {nextSuggestion.isReady ? "Sans dépendance active" : `${nextSuggestion.blockedBy.length} dépendance(s)`}</span>
                  </div>
                </>
              ) : (
                <p>Aucun chantier prioritaire n'est actuellement remonté.</p>
              )}
            </CardBody>
          </Card>
          <Card className={styles.executiveSidebarCard}>
            <CardHeader className={styles.executiveSectionHeader}>
              <strong>Tension opérationnelle</strong>
              <Tag tone="neutral" className={operationalTension.className}>{operationalTension.label}</Tag>
            </CardHeader>
            <CardBody className={styles.executiveSidebarBody}>
              <div className={styles.tensionGauge}>
                <div className={styles.tensionGaugeTrack} aria-hidden="true">
                  <span style={{ width: `${operationalTensionScore}%` }} />
                </div>
                <div className={styles.tensionGaugeMeta}>
                  <strong>{operationalTensionScore}/100</strong>
                  <span>{operationalTension.detail}</span>
                </div>
              </div>
              <div className={styles.executiveSidebarList}>
                <span><AlertTriangle size={14} /> {missionControl.blockedFeatures} blocage(s) et {missionControl.criticalBugs} bug(s) critique(s)</span>
                <span><CalendarClock size={14} /> {missionControl.lastBackupAt ? formatEntryDate(missionControl.lastBackupAt) : "Aucune sauvegarde détectée"}</span>
                <span><Activity size={14} /> {missionControl.weeklyDevelopmentLabel} de rythme estimé cette semaine</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className={styles.executiveMetrics}>
        <StatsCard label="Terminées" value={String(missionControl.completedFeatures)} hint="Chantiers clôturés" visual={<CheckCheck size={18} />} visualLabel="Terminées" />
        <StatsCard label="En exécution" value={String(missionControl.inProgressFeatures)} hint="Lots actifs maintenant" visual={<Activity size={18} />} visualLabel="En exécution" />
        <button
          type="button"
          className={styles.statsShortcut}
          onClick={openBlockedMasterPlanItems}
          aria-label={`Ouvrir ${missionControl.blockedFeatures} fonctionnalité(s) bloquée(s) dans le Master Plan`}
        >
          <StatsCard label="Blocages" value={String(missionControl.blockedFeatures)} hint="À arbitrer" visual={<TimerReset size={18} />} visualLabel="Blocages" />
        </button>
        <StatsCard label="Bugs critiques" value={String(missionControl.criticalBugs)} hint={`${missionControl.minorBugs} point(s) secondaire(s)`} visual={<ShieldCheck size={18} />} visualLabel="Bugs" />
        <StatsCard label="Roadmap couverte" value={`${roadmapCoverage}%`} hint={`${roadmapCompletedCount} chantier(s) terminés ici`} visual={<Sparkles size={18} />} visualLabel="Couverture" />
        <StatsCard label="Dépendances actives" value={String(roadmapBlockedCount)} hint="Chaînes à débloquer" visual={<LockKeyhole size={18} />} visualLabel="Dépendances" />
      </div>

      <div className={styles.executiveBoard}>
        <Card className={styles.executivePanel}>
          <CardHeader className={styles.executiveSectionHeader}>
            <CollapsibleCardHeader
              title="Priorités immédiates"
              meta={<Tag tone="gold">{priorityActions.length}</Tag>}
              isOpen={expandedExecutivePanels.includes("priorities")}
              onToggle={() => toggleExpandedExecutivePanel("priorities")}
            />
          </CardHeader>
          {expandedExecutivePanels.includes("priorities") ? <CardBody className={styles.priorityActionList}>
            {priorityActions.map((item) => (
              <article key={item.id} className={`${styles.priorityActionCard} ${item.tone}`}>
                <div className={styles.priorityActionHeader}>
                  <strong>{item.title}</strong>
                  <Tag tone="neutral">{item.badge}</Tag>
                </div>
                <p>{item.detail}</p>
              </article>
            ))}
          </CardBody> : null}
        </Card>

        <Card className={styles.executivePanel}>
          <CardHeader className={styles.executiveSectionHeader}>
            <CollapsibleCardHeader
              title="Dépendances et blocages"
              meta={<Tag tone="gold">{topBlockedItems.length}</Tag>}
              isOpen={expandedExecutivePanels.includes("dependencies")}
              onToggle={() => toggleExpandedExecutivePanel("dependencies")}
            />
          </CardHeader>
          {expandedExecutivePanels.includes("dependencies") ? <CardBody className={styles.executiveDependencyBody}>
            {topBlockedItems.length ? topBlockedItems.map((item) => (
              <article key={item.id} className={styles.dependencyCard}>
                <div className={styles.dependencyHeader}>
                  <strong>{item.title}</strong>
                  <Tag tone="status">{item.blockedBy.length} dépendance(s)</Tag>
                </div>
                <p>{item.nextAction || "Aucune action suivante décrite."}</p>
                <div className={styles.dependencyLinks}>
                  {formatBlockedByLabels(item, roadmap).map((dependency) => (
                    <span key={`${item.id}-${dependency}`}>{dependency}</span>
                  ))}
                </div>
              </article>
            )) : <p className={styles.executiveEmpty}>Aucun blocage actif : la feuille de route est debloquee.</p>}
          </CardBody> : null}
        </Card>

        <Card className={styles.executivePanel}>
          <CardHeader className={styles.executiveSectionHeader}>
            <CollapsibleCardHeader
              title="Signaux récents"
              meta={<Tag tone="gold">{recentSignals.length}</Tag>}
              isOpen={expandedExecutivePanels.includes("signals")}
              onToggle={() => toggleExpandedExecutivePanel("signals")}
            />
          </CardHeader>
          {expandedExecutivePanels.includes("signals") ? <CardBody className={styles.executiveSignalList}>
            {recentSignals.map((signal) => (
              <article key={signal.id} className={styles.executiveSignalItem}>
                <span>{signal.label}</span>
                <strong>{signal.title}</strong>
                <p>{signal.meta}</p>
              </article>
            ))}
          </CardBody> : null}
        </Card>

        <Card className={`${styles.executivePanel} ${styles.alertRailPanel}`}>
          <CardHeader className={styles.executiveSectionHeader}>
            <CollapsibleCardHeader
              title="Colonne de tension"
              meta={<Tag tone="neutral" className={operationalTension.className}>{operationalTension.label}</Tag>}
              isOpen={expandedExecutivePanels.includes("alerts")}
              onToggle={() => toggleExpandedExecutivePanel("alerts")}
            />
          </CardHeader>
          {expandedExecutivePanels.includes("alerts") ? <CardBody className={styles.alertRailBody}>
            <article className={styles.alertRailSummary}>
              <span className={styles.alertRailEyebrow}>Santé projet</span>
              <strong>{executiveHealth.label}</strong>
              <p>{executiveHealth.detail}</p>
            </article>

            <div className={styles.alertRailList}>
              {alertRailItems.map((item) => (
                <article
                  key={item.id}
                  className={`${styles.alertRailItem} ${item.tone === "danger" ? styles.alertRailItemDanger : item.tone === "warning" ? styles.alertRailItemWarning : styles.alertRailItemHealthy}`}
                >
                  <div className={styles.alertRailItemHeader}>
                    <strong>{item.title}</strong>
                    <span>{item.tone === "danger" ? "Alerte" : item.tone === "warning" ? "Vigilance" : "Stable"}</span>
                  </div>
                  <p>{item.detail}</p>
                  {item.cta === "blocked-master-plan" ? (
                    <button
                      type="button"
                      className={styles.alertRailLink}
                      onClick={openBlockedMasterPlanItems}
                    >
                      Aller au blocage prioritaire <ArrowRight size={14} />
                    </button>
                  ) : null}
                </article>
              ))}
            </div>

            <article className={styles.releaseReadinessCard}>
              <span className={styles.alertRailEyebrow}>État de release</span>
              <strong>{releaseReadiness}</strong>
              <p>Point d'escalade actuel : {escalationHeadline}.</p>
            </article>
          </CardBody> : null}
        </Card>
      </div>

      <div className={styles.executiveFooter}>
        <article className={styles.executiveFootCard}>
          <span>Objectif en cours</span>
          <strong>{missionControl.weeklyGoal}</strong>
        </article>
        <article className={styles.executiveFootCard}>
          <span>Ensuite</span>
          <strong>{missionControl.nextGoal}</strong>
        </article>
        <article className={styles.executiveFootCard}>
          <span>Dépendances dominantes</span>
          <strong>{topDependencies.length ? topDependencies.join(" · ") : "Aucune dépendance critique remontée"}</strong>
        </article>
      </div>
    </header>

      <div ref={workspaceAnchorRef} />
      <TabsContent value="masterPlan" className={styles.workspaceTabContent}>
    <section id="master-plan" className={`${styles.journalShell} ${styles.sectionMasterPlan}`} aria-labelledby="master-plan-detail-title">
      <FoldableSectionHeader
        title="Tableaux du Master Plan"
        summary={masterPlanSummary}
        isOpen={panelOpen.masterPlan}
        onToggle={() => togglePanel("masterPlan")}
        controlsId="master-plan-detail-panel"
      />
      {panelOpen.masterPlan ? <div id="master-plan-detail-panel" className={styles.foldableContent}>
    <section className={styles.masterPlanGuide} aria-label="Lecture guidée du Master Plan">
      <div className={styles.masterPlanGuideHeader}>
        <div>
          <span>Lecture recommandée</span>
          <strong>Commencer par les zones actives, puis élargir seulement si nécessaire</strong>
          <p>
            La lecture guidée réduit la masse initiale et met en avant les sections encore vivantes du plan.
          </p>
        </div>
        <div className={styles.masterPlanGuideActions}>
          <button
            type="button"
            className={masterPlanDisplayMode === "focus" ? styles.masterPlanGuideButtonActive : styles.masterPlanGuideButton}
            onClick={() => setMasterPlanDisplayMode("focus")}
            disabled={hasMasterPlanFilters}
          >
            Lecture guidée
          </button>
          <button
            type="button"
            className={masterPlanDisplayMode === "all" ? styles.masterPlanGuideButtonActive : styles.masterPlanGuideButton}
            onClick={() => setMasterPlanDisplayMode("all")}
            disabled={hasMasterPlanFilters}
          >
            Tout afficher
          </button>
        </div>
      </div>
      <div className={styles.masterPlanGuideBody}>
        <article className={styles.masterPlanGuideCard}>
          <span>Mode actuel</span>
          <strong>{hasMasterPlanFilters ? "Filtres actifs" : masterPlanDisplayMode === "focus" ? "Lecture guidée" : "Vue complète"}</strong>
          <p>
            {hasMasterPlanFilters
              ? "Les filtres prennent la main pour montrer uniquement les sections qui correspondent."
              : masterPlanDisplayMode === "focus"
                ? `${hiddenMasterPlanCount} section(s) secondaires restent masquées tant que tu ne demandes pas la vue complète.`
                : "La totalité du Master Plan est affichée, y compris les zones moins actives."}
          </p>
        </article>
        <article className={styles.masterPlanGuideCard}>
          <span>À lire d’abord</span>
          <strong>{masterPlanPriorityReads.length} priorité(s) remontée(s)</strong>
          <ul className={styles.masterPlanGuideList}>
            {masterPlanPriorityReads.length ? masterPlanPriorityReads.map((item) => (
              <li key={item.id}>
                <strong>{item.feature}</strong>
                <span>{item.nextAction || item.domain}</span>
              </li>
            )) : (
              <li>
                <strong>Aucune priorité P0/P1</strong>
                <span>Le registre ne remonte pas de priorité critique immédiate.</span>
              </li>
            )}
          </ul>
        </article>
      </div>
      <div className={styles.masterPlanPresetRow}>
        <button type="button" className={styles.masterPlanPresetButton} onClick={() => applyMasterPlanPreset("blocked")}>
          Blocages
        </button>
        <button type="button" className={styles.masterPlanPresetButton} onClick={() => applyMasterPlanPreset("p1")}>
          P1
        </button>
        <button type="button" className={styles.masterPlanPresetButton} onClick={() => applyMasterPlanPreset("recent-decisions")}>
          Décisions récentes
        </button>
        <button type="button" className={styles.masterPlanPresetButton} onClick={() => applyMasterPlanPreset("roadmap-ready")}>
          Roadmap prête
        </button>
        <button type="button" className={styles.masterPlanPresetButton} onClick={() => applyMasterPlanPreset("critical-bugs")}>
          Bugs critiques
        </button>
      </div>
    </section>
    <section className={styles.filters} aria-label="Filtres du Master Plan">
      <label className={styles.search}><Search size={18} /><input value={masterPlanQuery} onChange={(event) => setMasterPlanQuery(event.target.value)} placeholder="Rechercher une fonctionnalité, une décision, une limite…" /></label>
      <select value={masterPlanStatus} onChange={(event) => setMasterPlanStatus(event.target.value)} aria-label="Filtrer par statut"><option value="">Tous les statuts</option>{MASTER_PLAN_STATUSES.map((item) => <option value={item} key={item}>{item} ({plan.statusCounts[item] ?? 0})</option>)}</select>
      <select value={masterPlanPriority} onChange={(event) => setMasterPlanPriority(event.target.value)} aria-label="Filtrer par priorité"><option value="">Toutes les priorités</option>{MASTER_PLAN_PRIORITIES.map((item) => <option value={item} key={item}>{item} ({plan.remainingPriorityCounts[item] ?? 0} restant)</option>)}</select>
      {(masterPlanQuery || masterPlanStatus || masterPlanPriority) && <button type="button" onClick={() => { setMasterPlanQuery(""); setMasterPlanStatus(""); setMasterPlanPriority(""); }}><X size={16} /> Effacer</button>}
    </section>

    <section className={styles.content} aria-label="Contenu du Master Plan">
        {visibleSections.length
          ? visibleSections.map((section) => <SectionCard section={section} childSections={childrenBySection.get(section.id) ?? []} isOpen={expandedSections.has(section.id)} onToggle={() => toggleSection(section.id)} key={section.id} />)
          : <div className={styles.empty}><Search size={28} /><h2>Aucun résultat</h2><p>Essayez un autre terme ou retirez un filtre.</p></div>}
      </section>
      </div> : null}
    </section>
      </TabsContent>

      <TabsContent value="missionControl" className={styles.workspaceTabContent}>
    <section id="mission-control" className={`${styles.missionControlShell} ${styles.sectionMissionControl}`} aria-labelledby="mission-control-title">
      <FoldableSectionHeader
        title="Mission Control"
        summary={missionControlSummary}
        isOpen={panelOpen.missionControl}
        onToggle={() => togglePanel("missionControl")}
        controlsId="mission-control-panel"
      />
      {panelOpen.missionControl ? <div id="mission-control-panel" className={styles.foldableContent}>
      <SectionIntro
        title="Surveillance détaillée"
        titleId="mission-control-title"
        align="left"
        eyebrow={<><Radar size={16} /> Poste de contrôle</>}
        subtitle="Le niveau exécution regroupe l'avancement, la santé technique et les décisions qui influencent la suite."
        description="Cette zone sert à lire rapidement ce qui est sous contrôle, ce qui dérive et ce qui nécessite un arbitrage technique ou opérationnel."
      />

      <div className={styles.missionGrid}>
        <div className={styles.missionPrimary}>
          <Card className={styles.progressHero}>
            <CardBody className={styles.progressHeroBody}>
              <div>
                <p className={styles.progressEyebrow}>Progression globale</p>
                <strong>{missionControl.progressionPct}%</strong>
                <p>{missionControl.completedFeatures} fonctionnalités terminées sur {missionControl.completedFeatures + plan.planning.length} suivies dans le registre officiel.</p>
              </div>
              <div className={styles.progressRing} aria-label={`Progression globale ${missionControl.progressionPct}%`}>
                <svg viewBox="0 0 120 120" aria-hidden="true">
                  <circle cx="60" cy="60" r="48" />
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    pathLength="100"
                    style={{ strokeDasharray: `${missionControl.progressionPct} 100` }}
                  />
                </svg>
                <span>{missionControl.progressionPct}%</span>
              </div>
            </CardBody>
          </Card>

          <div className={styles.missionMetrics}>
            <StatsCard label="Terminées" value={String(missionControl.completedFeatures)} hint="Fonctionnalités clôturées" visual={<BookOpen size={18} />} visualLabel="Terminées" />
            <StatsCard label="En cours" value={String(missionControl.inProgressFeatures)} hint="Lots actifs" visual={<Activity size={18} />} visualLabel="En cours" />
            <button
              type="button"
              className={styles.statsShortcut}
              onClick={openBlockedMasterPlanItems}
              aria-label={`Ouvrir ${missionControl.blockedFeatures} fonctionnalité(s) bloquée(s) dans le Master Plan`}
            >
              <StatsCard label="Bloquées" value={String(missionControl.blockedFeatures)} hint="À débloquer" visual={<TimerReset size={18} />} visualLabel="Bloquées" />
            </button>
            <StatsCard label="Bugs critiques" value={String(missionControl.criticalBugs)} hint={`${missionControl.minorBugs} mineur(s)`} visual={<ShieldCheck size={18} />} visualLabel="Bugs" />
          </div>

          <div className={styles.objectiveCards}>
            <Card tone="soft">
              <CardHeader><strong>Objectif de la semaine</strong></CardHeader>
              <CardBody><p>{missionControl.weeklyGoal}</p></CardBody>
            </Card>
            <Card tone="soft">
              <CardHeader><strong>Prochain objectif</strong></CardHeader>
              <CardBody><p>{missionControl.nextGoal}</p></CardBody>
            </Card>
          </div>
        </div>

        <aside className={styles.missionSidebar}>
          <Card tone="dark" className={styles.environmentCard}>
            <CardHeader><strong>Environnement actuel</strong></CardHeader>
            <CardBody className={styles.environmentBody}>
              <p>{missionControl.currentEnvironment}</p>
              <div className={styles.environmentMeta}>
                <span><GitBranch size={14} /> v{missionControl.projectVersion}</span>
                <span><CalendarClock size={14} /> {missionControl.lastBackupAt ? formatEntryDate(missionControl.lastBackupAt) : "Aucune sauvegarde détectée"}</span>
                <span><TimerReset size={14} /> {missionControl.weeklyDevelopmentLabel} cette semaine</span>
              </div>
            </CardBody>
          </Card>

          <div className={styles.healthGrid}>
            {missionControl.healthCards.map((card) => (
              <Card key={card.label} className={styles.healthCard}>
                <CardHeader className={styles.healthHeader}>
                  <div className={styles.healthTitle}>
                    {healthIcon(card.label)}
                    <strong>{card.label}</strong>
                  </div>
                  <Tag tone="neutral" className={healthToneClass(card.status)}>{card.status}</Tag>
                </CardHeader>
                <CardBody>
                  <p>{card.detail}</p>
                  <small>Vérifié le {formatEntryDate(card.checkedAt)}</small>
                </CardBody>
              </Card>
            ))}
          </div>
        </aside>
      </div>

      <div className={styles.missionPanels}>
        <Card className={styles.panelCard}>
          <CardHeader className={styles.panelHeader}>
            <strong>Dernières décisions</strong>
            <Tag tone="gold">{missionControl.lastDecisions.length}</Tag>
          </CardHeader>
          <CardBody className={styles.panelList}>
            {missionControl.lastDecisions.map((decision) => (
              <article key={`${decision.date}-${decision.title}`} className={styles.panelItem}>
                <div>
                  <span>{decision.date}</span>
                  <h3>{decision.title}</h3>
                </div>
                <Tag tone="category">{decision.category}</Tag>
                <p>{decision.summary}</p>
              </article>
            ))}
          </CardBody>
        </Card>

        <Card className={styles.panelCard}>
          <CardHeader className={styles.panelHeader}>
            <strong>Derniers commits</strong>
            <Tag tone="gold">{missionControl.lastCommits.length}</Tag>
          </CardHeader>
          <CardBody className={styles.panelList}>
            {missionControl.lastCommits.map((commit) => (
              <article key={commit.sha} className={styles.panelItem}>
                <div>
                  <span>{formatEntryDate(commit.date)}</span>
                  <h3>{commit.subject}</h3>
                </div>
                <Tag tone="status">{commit.shortSha}</Tag>
                <p>{commit.author}</p>
              </article>
            ))}
          </CardBody>
        </Card>
      </div>
      </div> : null}
    </section>
      </TabsContent>

      <TabsContent value="technicalMemory" className={styles.workspaceTabContent}>
    <section id="memoire-technique" className={`${styles.memoryShell} ${styles.sectionMemory}`} aria-labelledby="memory-title">
      <FoldableSectionHeader
        title="Mémoire technique"
        summary={memorySummary}
        isOpen={panelOpen.technicalMemory}
        onToggle={() => togglePanel("technicalMemory")}
        controlsId="technical-memory-panel"
      />
      {panelOpen.technicalMemory ? <div id="technical-memory-panel" className={styles.foldableContent}>
      <SectionIntro
        title="Décisions canoniques"
        titleId="memory-title"
        align="left"
        eyebrow={<><BookOpen size={16} /> Référentiel interne</>}
        subtitle="Les décisions qui structurent le produit, la stack et les workflows restent consultables en lecture rapide."
        description="Cette base concentre les choix de référence afin d'éviter les re-débats inutiles et de raccourcir les arbitrages de design, d'architecture et de workflow."
      />

      <div className={styles.memoryMetrics}>
        <StatsCard label="Décisions indexées" value={String(technicalMemory.entries.length)} hint={`${filteredMemoryEntries.length} visible(s)`} visual={<BookOpen size={18} />} visualLabel="Décisions" />
        <StatsCard label="Décisions canoniques" value={String(canonicalMemoryCount)} hint="Stack, architecture, workflow, UI" visual={<Target size={18} />} visualLabel="Canonique" />
        <StatsCard label="Catégories" value={String(technicalMemory.categories.length)} hint={`${technicalMemory.tags.length} tag(s)`} visual={<FolderKanban size={18} />} visualLabel="Catégories" />
      </div>

      <div className={styles.memoryControls}>
        <div className={styles.memorySearch}>
          <SearchBar
            value={memoryQuery}
            onSearch={setMemoryQuery}
            buttonLabel="Chercher"
            placeholder="Pourquoi Supabase, Next.js, Vercel, cette architecture, ce workflow..."
            inputProps={{
              onChange: (event: ChangeEvent<HTMLInputElement>) => setMemoryQuery(event.target.value),
            }}
          />
        </div>
        <div className={styles.memoryFilterGrid}>
          <Select value={memoryCategory} onChange={(event) => setMemoryCategory(event.target.value)} aria-label="Filtrer la mémoire par catégorie">
            <option value="">Toutes les catégories</option>
            {technicalMemory.categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Select value={memoryTag} onChange={(event) => setMemoryTag(event.target.value)} aria-label="Filtrer la mémoire par tag">
            <option value="">Tous les tags</option>
            {technicalMemory.tags.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
        </div>
      </div>

      <div className={styles.memoryGrid}>
        {filteredMemoryEntries.length ? filteredMemoryEntries.map((entry: TechnicalMemoryEntry) => (
          <Card key={entry.id} className={styles.memoryCard}>
            <CardHeader className={styles.memoryHeader}>
              <CollapsibleCardHeader
                title={entry.title}
                eyebrow={entry.category}
                meta={<Tag tone={entry.source === "canonique" ? "gold" : "status"}>{entry.source === "canonique" ? "Décision canonique" : entry.date}</Tag>}
                isOpen={expandedMemoryEntryIds.includes(entry.id)}
                onToggle={() => toggleExpandedMemoryEntry(entry.id)}
              />
            </CardHeader>
            {expandedMemoryEntryIds.includes(entry.id) ? <CardBody className={styles.memoryBody}>
              <article className={styles.memoryPanel}>
                <strong>{entry.question}</strong>
                <p>{entry.answer}</p>
              </article>
              <div className={styles.memoryPanels}>
                <article className={styles.memoryPanel}>
                  <strong>Pourquoi</strong>
                  <p>{entry.rationale}</p>
                </article>
                <article className={styles.memoryPanel}>
                  <strong>Impact</strong>
                  <p>{entry.impact}</p>
                </article>
              </div>
              <div className={styles.featureRow}>
                {entry.tags.map((tag) => <Tag key={`${entry.id}-${tag}`} tone="category">{tag}</Tag>)}
              </div>
              <div className={styles.memoryEvidence}>
                <strong>Preuves et points d'entrée</strong>
                <div className={styles.linkList}>
                  {entry.evidence.map((evidence) => <Tag key={`${entry.id}-${evidence}`} tone="neutral">{evidence}</Tag>)}
                </div>
              </div>
            </CardBody> : null}
          </Card>
        )) : <div className={styles.empty}>
          <Search size={28} />
          <h2>Aucune décision retrouvée</h2>
          <p>Essaie un autre mot-clé ou enlève un filtre de la mémoire technique.</p>
        </div>}
      </div>
      </div> : null}
    </section>
      </TabsContent>

      <TabsContent value="roadmap" className={styles.workspaceTabContent}>
    <section id="roadmap-intelligente" className={`${styles.roadmapShell} ${styles.sectionRoadmap}`} aria-labelledby="roadmap-title">
      <FoldableSectionHeader
        title="Roadmap intelligente"
        summary={roadmapSummary}
        isOpen={panelOpen.roadmap}
        onToggle={() => togglePanel("roadmap")}
        controlsId="smart-roadmap-panel"
      />
      {panelOpen.roadmap ? <div id="smart-roadmap-panel" className={styles.foldableContent}>
      <SectionIntro
        title="Roadmap dynamique"
        titleId="roadmap-title"
        align="left"
        eyebrow={<><Sparkles size={16} /> Orchestration technique</>}
        subtitle="Chaque chantier conserve son contexte métier, ses dépendances actives et la meilleure action suivante."
        description="Quand une fonctionnalité passe en terminé, la feuille de route recalcule automatiquement ce qui se débloque, ce qui remonte en priorité et ce qu'il faut lancer ensuite."
      />

      <div className={styles.roadmapSummaryGrid}>
        <Card className={styles.roadmapSpotlight}>
          <CardHeader className={styles.roadmapSpotlightHeader}>
            <div>
              <strong>Prochaine fonctionnalité logique</strong>
              <p>Suggestion recalculée depuis les dépendances, la priorité, la dette technique et la valeur attendue.</p>
            </div>
            <Tag tone="gold">{roadmapCoverage}% couvert</Tag>
          </CardHeader>
          <CardBody className={styles.roadmapSpotlightBody}>
            {roadmapProjection.nextSuggestion ? <>
              <div className={styles.roadmapSpotlightTitle}>
                <span>{roadmapProjection.nextSuggestion.domain}</span>
                <h3 data-testid="roadmap-next-title">{roadmapProjection.nextSuggestion.title}</h3>
              </div>
              <p>{roadmapProjection.nextSuggestion.nextAction || "Aucune prochaine action détaillée dans le registre."}</p>
              <div className={styles.roadmapSpotlightMeta}>
                <span><Target size={14} /> {roadmapProjection.nextSuggestion.priority}</span>
                <span><TimerReset size={14} /> {roadmapProjection.nextSuggestion.estimation}</span>
                <span><ArrowRight size={14} /> {roadmapProjection.nextSuggestion.isReady ? "Prête à lancer" : `${roadmapProjection.nextSuggestion.blockedBy.length} dépendance(s) à lever`}</span>
              </div>
            </> : <p>Aucune fonctionnalité ouverte n'est actuellement suivie dans la roadmap.</p>}
          </CardBody>
        </Card>

        <div className={styles.roadmapStats}>
          <StatsCard label="Prêtes maintenant" value={String(roadmapReadyCount)} hint="Sans dépendance bloquante" visual={<Sparkles size={18} />} visualLabel="Prêtes" />
          <StatsCard label="Sous dépendances" value={String(roadmapBlockedCount)} hint="À débloquer en chaîne" visual={<LockKeyhole size={18} />} visualLabel="Bloquées" />
          <StatsCard label="Terminées ici" value={String(roadmapCompletedCount)} hint={`${roadmap.items.length} chantiers suivis`} visual={<CheckCheck size={18} />} visualLabel="Terminées" />
        </div>
      </div>

      <div className={styles.roadmapLanes}>
        <Card className={styles.roadmapLane}>
          <CardHeader className={styles.roadmapLaneHeader}>
            <CollapsibleCardHeader
              title="Prêtes maintenant"
              meta={<Tag tone="gold">{roadmapReadyCount}</Tag>}
              isOpen={expandedRoadmapLanes.includes("ready")}
              onToggle={() => toggleExpandedRoadmapLane("ready")}
            />
          </CardHeader>
          {expandedRoadmapLanes.includes("ready") ? <CardBody className={styles.roadmapCards}>
            {roadmapProjection.readyItems.length ? roadmapProjection.readyItems.map((item) => (
              <article key={item.id} className={`${styles.roadmapCard} ${roadmapStatusClass(item)}`} data-testid={`roadmap-item-${item.id}`}>
                <div className={styles.roadmapCardHeader}>
                  <div>
                    <p className={styles.categoryLabel}>{item.domain}</p>
                    <h3>{item.title}</h3>
                  </div>
                  <Tag tone="neutral" className={priorityChipClass(item.priority as DeveloperLogPriority)}>{item.priority}</Tag>
                </div>
                <div className={styles.roadmapPills}>
                  <Tag tone="status">{item.status}</Tag>
                  <Tag tone="category">Difficulté {item.difficulty}</Tag>
                  <Tag tone="category">Responsable {item.owner}</Tag>
                </div>
                <p className={styles.roadmapDescription}>{item.nextAction || "Aucune prochaine action décrite."}</p>
                <div className={styles.roadmapFacts}>
                  <div><strong>Estimation</strong><span>{item.estimation}</span></div>
                  <div><strong>Gain utilisateur</strong><span>{item.userGain}</span></div>
                  <div><strong>Dette technique</strong><span>{item.technicalDebt}</span></div>
                  <div><strong>Date prévue</strong><span>{formatRoadmapDate(item.targetDate)}</span></div>
                  <div><strong>Audience</strong><span>{item.audience || "Tous"}</span></div>
                </div>
                <div className={styles.roadmapDependencies}>
                  <strong>Dépendances</strong>
                  <p>{item.dependencyLabels.length ? item.dependencyLabels.join(", ") : "Aucune, ce chantier peut démarrer maintenant."}</p>
                </div>
                <div className={styles.roadmapCardFooter}>
                  <span>{item.effectivePriorityScore} pts de priorité recalculée</span>
                  <Button variant="primary" onClick={() => toggleRoadmapCompletion(item.id)} data-testid={`roadmap-toggle-${item.id}`}>
                    Marquer comme terminée
                  </Button>
                </div>
              </article>
            )) : <div className={styles.roadmapEmpty}>
              <CheckCheck size={22} />
              <p>Toutes les fonctionnalités prêtes sont déjà traitées.</p>
            </div>}
          </CardBody> : null}
        </Card>

        <Card className={styles.roadmapLane}>
          <CardHeader className={styles.roadmapLaneHeader}>
            <CollapsibleCardHeader
              title="Sous dépendances"
              meta={<Tag tone="gold">{roadmapBlockedCount}</Tag>}
              isOpen={expandedRoadmapLanes.includes("blocked")}
              onToggle={() => toggleExpandedRoadmapLane("blocked")}
            />
          </CardHeader>
          {expandedRoadmapLanes.includes("blocked") ? <CardBody className={styles.roadmapCards}>
            {roadmapProjection.blockedItems.length ? roadmapProjection.blockedItems.map((item) => (
              <article key={item.id} className={`${styles.roadmapCard} ${roadmapStatusClass(item)}`}>
                <div className={styles.roadmapCardHeader}>
                  <div>
                    <p className={styles.categoryLabel}>{item.domain}</p>
                    <h3>{item.title}</h3>
                  </div>
                  <Tag tone="neutral" className={priorityChipClass(item.priority as DeveloperLogPriority)}>{item.priority}</Tag>
                </div>
                <div className={styles.roadmapPills}>
                  <Tag tone="status">{item.status}</Tag>
                  <Tag tone="category">Difficulté {item.difficulty}</Tag>
                  <Tag tone="category">Responsable {item.owner}</Tag>
                </div>
                <p className={styles.roadmapDescription}>{item.nextAction || "Aucune prochaine action décrite."}</p>
                <div className={styles.roadmapFacts}>
                  <div><strong>Estimation</strong><span>{item.estimation}</span></div>
                  <div><strong>Gain utilisateur</strong><span>{item.userGain}</span></div>
                  <div><strong>Dette technique</strong><span>{item.technicalDebt}</span></div>
                  <div><strong>Date prévue</strong><span>{formatRoadmapDate(item.targetDate)}</span></div>
                  <div><strong>Statut</strong><span>{item.blockedBy.length} dépendance(s)</span></div>
                </div>
                <div className={styles.roadmapDependencies}>
                  <strong>Débloquer via</strong>
                  <p>{item.blockedBy.map((dependencyId) => roadmap.items.find((candidate) => candidate.id === dependencyId)?.title ?? dependencyId).join(", ")}</p>
                </div>
                <div className={styles.roadmapCardFooter}>
                  <span>{item.effectivePriorityScore} pts de priorité recalculée</span>
                  <Button variant="outline" onClick={() => toggleRoadmapCompletion(item.id)} data-testid={`roadmap-toggle-${item.id}`}>
                    Forcer comme terminée
                  </Button>
                </div>
              </article>
            )) : <div className={styles.roadmapEmpty}>
              <Sparkles size={22} />
              <p>Aucune dépendance active, toute la roadmap est débloquée.</p>
            </div>}
          </CardBody> : null}
        </Card>

        <Card className={styles.roadmapLane}>
          <CardHeader className={styles.roadmapLaneHeader}>
            <CollapsibleCardHeader
              title="Terminées localement"
              meta={<Tag tone="gold">{roadmapCompletedCount}</Tag>}
              isOpen={expandedRoadmapLanes.includes("completed")}
              onToggle={() => toggleExpandedRoadmapLane("completed")}
            />
          </CardHeader>
          {expandedRoadmapLanes.includes("completed") ? <CardBody className={styles.roadmapCards}>
            {roadmapProjection.completedItems.length ? roadmapProjection.completedItems.map((item) => (
              <article key={item.id} className={`${styles.roadmapCard} ${roadmapStatusClass(item)}`}>
                <div className={styles.roadmapCardHeader}>
                  <div>
                    <p className={styles.categoryLabel}>{item.domain}</p>
                    <h3>{item.title}</h3>
                  </div>
                  <Tag tone="status">Terminée</Tag>
                </div>
                <div className={styles.roadmapFacts}>
                  <div><strong>Priorité initiale</strong><span>{item.priority}</span></div>
                  <div><strong>Responsable</strong><span>{item.owner}</span></div>
                  <div><strong>Date prévue</strong><span>{formatRoadmapDate(item.targetDate)}</span></div>
                  <div><strong>Impact utilisateur</strong><span>{item.userGain}</span></div>
                </div>
                <div className={styles.roadmapCardFooter}>
                  <span>Cette clôture est mémorisée dans le navigateur pour le pilotage quotidien.</span>
                  <Button variant="ghost" onClick={() => toggleRoadmapCompletion(item.id)} data-testid={`roadmap-toggle-${item.id}`}>
                    Réouvrir
                  </Button>
                </div>
              </article>
            )) : <div className={styles.roadmapEmpty}>
              <ListChecks size={22} />
              <p>Aucune fonctionnalité cochée localement pour l'instant.</p>
            </div>}
          </CardBody> : null}
        </Card>
      </div>
      </div> : null}
    </section>
      </TabsContent>

      <TabsContent value="journal" className={styles.workspaceTabContent}>
    <section id="journal-de-bord" className={`${styles.journalShell} ${styles.sectionJournal}`} aria-labelledby="journal-title">
      <FoldableSectionHeader
        title="Journal de bord"
        summary={journalSummary}
        isOpen={panelOpen.journal}
        onToggle={() => togglePanel("journal")}
        controlsId="developer-log-panel"
      />
      {panelOpen.journal ? <div id="developer-log-panel" className={styles.foldableContent}>
      <SectionIntro
        title="Décisions et activité"
        titleId="journal-title"
        align="left"
        eyebrow={<><CalendarClock size={16} /> Exécution récente</>}
        subtitle="Le flux de travail réunit les décisions, les changements récents et la mémoire quotidienne du projet."
        description="Chaque entrée relie auteur, version, arbitrages, difficultés, solution retenue, fichiers touchés, risques, prochaines tâches et commentaires pour garder un contexte exploitable."
      />

      <div className={styles.journalMetrics}>
        <StatsCard label="Événements visibles" value={String(filteredEntries.length)} hint={`${combinedEntries.length} entrée(s) au total`} visual={<ListChecks size={18} />} visualLabel="Entrées" />
        <StatsCard label="Entrées du jour" value={String(todayCount)} hint="Référence au 27 juillet 2026" visual={<TimerReset size={18} />} visualLabel="Aujourd'hui" />
        <StatsCard label="Favoris" value={String(favoriteCount)} hint="Repères de travail épinglés" visual={<Star size={18} />} visualLabel="Favoris" />
        <StatsCard label="Commentaires" value={String(commentCount)} hint={`${manualCount} entrée(s) manuelle(s)`} visual={<MessageSquareText size={18} />} visualLabel="Commentaires" />
      </div>

      <div className={styles.journalLayout}>
        <div className={styles.timelineColumn}>
          {filteredEntries.length ? <ol className={styles.timeline}>
            {filteredEntries.map((entry) => {
              const comments = commentsByEntry[entry.id] ?? [];
              const isFavorite = favoriteIds.includes(entry.id);
              const isExpanded = expandedTimelineEntryIds.includes(entry.id);
              return (
                <li key={entry.id} className={styles.timelineItem}>
                  <span className={`${styles.timelineMarker} ${categoryDotClass(entry.category)}`} aria-hidden="true" />
                  <Card className={styles.timelineCard} tone={entry.source === "manual" ? "elevated" : "soft"}>
                    <CardHeader className={styles.timelineHeader}>
                      <button
                        type="button"
                        className={styles.timelineHeaderButton}
                        onClick={() => toggleExpandedTimelineEntry(entry.id)}
                        aria-expanded={isExpanded}
                      >
                        <div className={styles.timelineMeta}>
                          <span>{formatDateOnly(entry.createdAt)}</span>
                          <span>{formatTimeOnly(entry.createdAt)}</span>
                          <span>v{entry.version}</span>
                          <span>{entry.author}</span>
                        </div>
                        <span className={styles.timelineHeaderToggle}>
                          <span>{isExpanded ? "Replier" : "Déplier"}</span>
                          <ChevronDown size={18} className={styles.chevron} aria-hidden="true" />
                        </span>
                      </button>
                      <div className={styles.timelineActions}>
                        <Button
                          variant="ghost"
                          className={styles.iconButton}
                          aria-pressed={isFavorite}
                          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                          onClick={() => toggleFavorite(entry.id)}
                        >
                          <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
                        </Button>
                        <Tag tone="neutral" className={priorityChipClass(entry.priority)}>{entry.priority}</Tag>
                      </div>
                    </CardHeader>
                    <CardBody className={styles.timelineBody}>
                      <div className={styles.timelineTitleRow}>
                        <div>
                          <p className={styles.categoryLabel}>{entry.category}</p>
                          <h3>{entry.title}</h3>
                        </div>
                        <Tag tone="status">{entry.status}</Tag>
                      </div>
                      <p className={styles.timelineDescription}>{entry.description}</p>
                      <InlineDisclosureButton
                        isOpen={isExpanded}
                        onToggle={() => toggleExpandedTimelineEntry(entry.id)}
                        label={isExpanded ? "Replier l'entrée" : "Voir l'entrée complète"}
                      />
                      {isExpanded ? <>
                      <div className={styles.timelineFacts}>
                        <div><strong>Date</strong><span>{formatEntryDate(entry.createdAt)}</span></div>
                        <div><strong>Auteur</strong><span>{entry.author}</span></div>
                        <div><strong>Temps passé</strong><span>{entry.timeSpentMinutes} min</span></div>
                        <div><strong>Source</strong><span>{entry.source === "manual" ? "Manuelle" : "Automatique"}</span></div>
                      </div>
                      <div className={styles.timelinePanels}>
                        <article><strong>Décisions prises</strong><p>{entry.decisions || "Aucune décision renseignée."}</p></article>
                        <article><strong>Raisons</strong><p>{entry.reasons || "Aucune raison renseignée."}</p></article>
                        <article><strong>Difficultés</strong><p>{entry.difficulties || "Aucune difficulté signalée."}</p></article>
                        <article><strong>Solution retenue</strong><p>{entry.solution || "Aucune solution renseignée."}</p></article>
                      </div>
                      <div className={styles.featureRow}>
                        {entry.features.length ? entry.features.map((feature) => <Tag key={`${entry.id}-${feature}`} tone="category">{feature}</Tag>) : <Tag tone="neutral">Fonctionnalités non renseignées</Tag>}
                      </div>
                      {entry.impactSummary ? <article className={styles.impactCard}>
                        <strong>Impact sur le reste du projet</strong>
                        <p>{entry.impactSummary}</p>
                      </article> : null}
                      {(entry.modifiedFiles?.length || entry.roadmapUpdates?.length || entry.dependencyUpdates?.length || entry.remainingTasks?.length || entry.potentialRegressions?.length) ? <div className={styles.auditGrid}>
                        <article className={styles.auditCard}>
                          <strong>Fichiers modifiés</strong>
                          {renderAuditList(entry.modifiedFiles, "Aucun fichier listé.")}
                        </article>
                        <article className={styles.auditCard}>
                          <strong>Roadmap mise à jour</strong>
                          {renderAuditList(entry.roadmapUpdates, "Aucune mise à jour de roadmap détectée.")}
                        </article>
                        <article className={styles.auditCard}>
                          <strong>Dépendances</strong>
                          {renderAuditList(entry.dependencyUpdates, "Aucune dépendance complémentaire détectée.")}
                        </article>
                        <article className={styles.auditCard}>
                          <strong>Tâches restantes</strong>
                          {renderAuditList(entry.remainingTasks, "Aucune tâche restante déduite.")}
                        </article>
                        <article className={styles.auditCard}>
                          <strong>Régressions potentielles</strong>
                          {renderAuditList(entry.potentialRegressions, "Aucune régression potentielle remontée.")}
                        </article>
                      </div> : null}
                      {entry.links.length ? <div className={styles.linkList}>
                        {entry.links.map((link) => (
                          <a key={`${entry.id}-${link.href}`} href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noreferrer" : undefined}>
                            {linkIcon(link.kind)}
                            <span>{link.label}</span>
                          </a>
                        ))}
                      </div> : null}
                      {entry.screenshotUrl ? <a className={styles.screenshotLink} href={entry.screenshotUrl} target="_blank" rel="noreferrer">Voir la capture d'écran</a> : null}
                      <div className={styles.commentsBlock}>
                        <div className={styles.commentsHeader}>
                          <strong>Commentaires</strong>
                          <span>{comments.length}</span>
                        </div>
                        {comments.length ? <div className={styles.commentList}>
                          {comments.map((comment) => (
                            <article key={comment.id} className={styles.commentCard}>
                              <div>
                                <span><UserRound size={14} /> {comment.author}</span>
                                <time dateTime={comment.createdAt}>{formatEntryDate(comment.createdAt)}</time>
                              </div>
                              <p>{comment.content}</p>
                            </article>
                          ))}
                        </div> : <p className={styles.commentEmpty}>Aucun commentaire pour le moment.</p>}
                        <div className={styles.commentComposer}>
                          <Textarea
                            rows={2}
                            label="Ajouter un commentaire"
                            value={commentDrafts[entry.id] ?? ""}
                            onChange={(event) => setCommentDrafts((current) => ({ ...current, [entry.id]: event.target.value }))}
                          />
                          <Button variant="secondary" onClick={() => submitComment(entry.id)}>Commenter</Button>
                        </div>
                      </div>
                      </> : null}
                    </CardBody>
                  </Card>
                </li>
              );
            })}
          </ol> : <div className={styles.empty}>
            <Search size={28} />
            <h2>Aucun événement</h2>
            <p>Ajustez les filtres du journal ou ajoutez une entrée manuelle.</p>
          </div>}
        </div>

        <aside className={styles.journalSidebar}>
          {journal.dailySummaries.length ? <Card className={styles.dailySummaryRail} tone="soft">
            <CardHeader className={styles.panelHeader}>
              <div>
                <strong>Résumés quotidiens</strong>
                <p className={styles.sidebarIntro}>Un rail de contexte plus discret pour garder la timeline comme lecture principale.</p>
              </div>
            </CardHeader>
            <CardBody className={styles.dailySummaryStack}>
              {journal.dailySummaries.map((summary) => <DailySummaryCard
                key={summary.id}
                summary={summary}
                isOpen={expandedDailySummaryIds.includes(summary.id)}
                onToggle={() => toggleExpandedDailySummary(summary.id)}
              />)}
            </CardBody>
          </Card> : null}

          <Card className={styles.journalControlsCard} tone="soft">
            <CardHeader className={styles.panelHeader}>
              <div>
                <strong>Recherche et filtres</strong>
                <p className={styles.sidebarIntro}>Affiner la lecture des décisions, incidents et validations sans surcharger la colonne principale.</p>
              </div>
            </CardHeader>
            <CardBody className={styles.journalControls}>
              <div className={styles.journalSearch}>
                <SearchBar
                  value={journalQuery}
                  onSearch={setJournalQuery}
                  buttonLabel="Filtrer"
                  placeholder="Rechercher une décision, une difficulté, une fonctionnalité..."
                  inputProps={{
                    onChange: (event: ChangeEvent<HTMLInputElement>) => setJournalQuery(event.target.value),
                  }}
                />
              </div>
              <div className={styles.journalFilterGrid}>
                <Select value={journalTimeframe} onChange={(event) => setJournalTimeframe(event.target.value as JournalTimeframe)} aria-label="Filtrer par période">
                  <option value="all">Toutes les périodes</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                </Select>
                <Select value={journalFeature} onChange={(event) => setJournalFeature(event.target.value)} aria-label="Filtrer par fonctionnalité">
                  <option value="">Toutes les fonctionnalités</option>
                  {journalFeatures.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
                <Select value={journalPriority} onChange={(event) => setJournalPriority(event.target.value)} aria-label="Filtrer par priorité">
                  <option value="">Toutes les priorités</option>
                  {DEVELOPER_LOG_PRIORITIES.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
                <Select value={journalAuthor} onChange={(event) => setJournalAuthor(event.target.value)} aria-label="Filtrer par auteur">
                  <option value="">Tous les auteurs</option>
                  {journalAuthors.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
                <Button
                  variant={favoritesOnly ? "primary" : "outline"}
                  className={styles.favoriteToggle}
                  onClick={() => setFavoritesOnly((current) => !current)}
                  aria-pressed={favoritesOnly}
                >
                  <Heart size={16} />
                  Favoris
                </Button>
              </div>
              <div className={styles.filterChipsRow}>
                <div>
                  <span className={styles.filterGroupLabel}><Filter size={14} /> Périodes rapides</span>
                  <FilterChipGroup
                    items={["Aujourd'hui", "Cette semaine", "Ce mois"]}
                    selectedItems={journalTimeframe === "all" ? [] : [journalTimeframe === "today" ? "Aujourd'hui" : journalTimeframe === "week" ? "Cette semaine" : "Ce mois"]}
                    onToggle={(value) => {
                      const next = value === "Aujourd'hui" ? "today" : value === "Cette semaine" ? "week" : "month";
                      setJournalTimeframe((current) => current === next ? "all" : next);
                    }}
                    getClassName={(selected) => [styles.filterChip, selected ? styles.filterChipSelected : ""].filter(Boolean).join(" ")}
                  />
                </div>
                <div>
                  <span className={styles.filterGroupLabel}><FolderKanban size={14} /> Catégories</span>
                  <FilterChipGroup
                    items={journalCategories}
                    selectedItems={journalCategories.filter((item) => item === journalQuery)}
                    onToggle={(value) => setJournalQuery((current) => current === value ? "" : value)}
                    getClassName={(selected) => [styles.filterChip, selected ? styles.filterChipSelected : ""].filter(Boolean).join(" ")}
                    emptyLabel="Aucune catégorie"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className={styles.manualEntryLauncherCard} tone="soft">
            <CardHeader className={styles.manualEntryHeader}>
              <div>
                <strong>Entrée manuelle</strong>
                <p>Ouvrir le formulaire seulement quand il faut documenter un arbitrage, un incident ou une validation.</p>
              </div>
            </CardHeader>
            <CardBody className={styles.manualEntryLauncherBody}>
              <Button variant="primary" onClick={() => setIsManualEntryModalOpen(true)}>
                Ajouter une entrée manuelle
              </Button>
              <Button variant="ghost" onClick={resetManualDraft}>
                Réinitialiser le brouillon
              </Button>
            </CardBody>
          </Card>
        </aside>
      </div>

      {isManualEntryModalOpen ? <div className={styles.modalOverlay} role="presentation" onClick={() => setIsManualEntryModalOpen(false)}>
        <section
          id="developer-log-manual-entry-modal"
          className={styles.manualEntryModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="manual-entry-modal-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className={styles.manualEntryModalHeader}>
            <div>
              <p className={styles.categoryLabel}>Journal de bord</p>
              <h3 id="manual-entry-modal-title">Nouvelle entrée manuelle</h3>
              <p>Documenter un arbitrage, un incident, une validation ou une note de progression sans alourdir la page principale.</p>
            </div>
            <Button variant="ghost" className={styles.modalCloseButton} onClick={() => setIsManualEntryModalOpen(false)} aria-label="Fermer la fenêtre">
              <X size={18} />
            </Button>
          </div>
          <div className={styles.manualEntryBody}>
            <div className={styles.manualGrid}>
              <Input label="Titre" value={manualDraft.title} onChange={(event) => updateManualDraft("title", event.target.value)} />
              <Input label="Version du projet" value={manualDraft.version} onChange={(event) => updateManualDraft("version", event.target.value)} />
              <Input label="Auteur" value={manualDraft.author} onChange={(event) => updateManualDraft("author", event.target.value)} />
              <Input label="Catégorie" value={manualDraft.category} onChange={(event) => updateManualDraft("category", event.target.value)} />
              <Select label="Priorité" value={manualDraft.priority} onChange={(event) => updateManualDraft("priority", event.target.value)}>
                {DEVELOPER_LOG_PRIORITIES.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
              <Select label="Statut" value={manualDraft.status} onChange={(event) => updateManualDraft("status", event.target.value)}>
                {DEVELOPER_LOG_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
              <Input type="datetime-local" label="Date et heure" value={manualDraft.createdAt.slice(0, 16)} onChange={(event) => updateManualDraft("createdAt", new Date(event.target.value).toISOString())} />
              <Input type="number" min="0" step="15" label="Temps passé (min)" value={String(manualDraft.timeSpentMinutes)} onChange={(event) => updateManualDraft("timeSpentMinutes", Number(event.target.value))} />
              <Input className={styles.spanTwo} label="Fonctionnalités concernées" placeholder="Ex : Dashboard admin, Journal de bord" value={manualDraft.featuresText} onChange={(event) => updateManualDraft("featuresText", event.target.value)} />
              <Input className={styles.spanTwo} label="Capture d'écran (URL optionnelle)" placeholder="https://..." value={manualDraft.screenshotUrl ?? ""} onChange={(event) => updateManualDraft("screenshotUrl", event.target.value)} />
            </div>
            <Textarea label="Description détaillée" rows={4} value={manualDraft.description} onChange={(event) => updateManualDraft("description", event.target.value)} />
            <Textarea label="Décisions prises" rows={3} value={manualDraft.decisions} onChange={(event) => updateManualDraft("decisions", event.target.value)} />
            <Textarea label="Raisons des décisions" rows={3} value={manualDraft.reasons} onChange={(event) => updateManualDraft("reasons", event.target.value)} />
            <Textarea label="Difficultés rencontrées" rows={3} value={manualDraft.difficulties} onChange={(event) => updateManualDraft("difficulties", event.target.value)} />
            <Textarea label="Solution retenue" rows={3} value={manualDraft.solution} onChange={(event) => updateManualDraft("solution", event.target.value)} />
            <Textarea
              label="Liens GitHub ou documents"
              rows={3}
              placeholder={"Format : libellé | URL\nEx : PR journal | https://github.com/.../pull/123"}
              value={manualDraft.linksText}
              onChange={(event) => updateManualDraft("linksText", event.target.value)}
            />
            <div className={styles.manualActions}>
              <span>Les entrées manuelles, favoris et commentaires sont conservés dans ce navigateur pour le pilotage quotidien.</span>
              <div className={styles.modalActionRow}>
                <Button variant="ghost" onClick={() => setIsManualEntryModalOpen(false)}>
                  Fermer
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    submitManualEntry();
                    setIsManualEntryModalOpen(false);
                  }}
                  disabled={!manualDraft.title.trim() || !manualDraft.description.trim()}
                >
                  Ajouter l'entrée
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div> : null}
      </div> : null}
    </section>
      </TabsContent>
    </Tabs>
  </div>;
}

function InlineDisclosureButton({
  isOpen,
  onToggle,
  label,
}: {
  isOpen: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={styles.inlineDisclosure}
      onClick={onToggle}
      aria-expanded={isOpen}
    >
      <span>{label}</span>
      <ChevronDown size={16} className={styles.chevron} aria-hidden="true" />
    </button>
  );
}

