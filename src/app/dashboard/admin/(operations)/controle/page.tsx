"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DashboardLayout, DashboardPanel } from "@/components/dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { buildAdminNavItems, buildAdminShortcuts } from "../../adminNavigation";
import {
  AdminEmptyState,
  AdminStatusBadge,
  formatAdminDate,
  formatControlStepLabel,
  getControlToneLabel,
  normalizeAdminText,
  type AdminControlStep,
  type AdminTone,
} from "../../AdminOperations";
import styles from "./page.module.scss";

type OnboardingItem = {
  id: string;
  displayName: string;
  email: string | null;
  role: string;
  roleBucket: string;
  createdAt: string | null;
  lastSignInAt: string | null;
  onboardingCompletedAt: string | null;
  steps: AdminControlStep[];
  issueCount: number;
  tone: AdminTone;
  controlAction: ControlAction | null;
};

type MissionItem = {
  id: string;
  title: string;
  status: string;
  priority: string;
  ownerName: string;
  conciergeName: string;
  createdAt: string;
  updatedAt: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  completedAt: string | null;
  quoteCount: number;
  invoiceCount: number;
  assignmentCount: number;
  openMaintenanceCount: number;
  hasOverdueInvoice: boolean;
  steps: AdminControlStep[];
  issueCount: number;
  tone: AdminTone;
  controlAction: ControlAction | null;
};

type MessageItem = {
  id: string;
  subject: string;
  source: string;
  status: string;
  ownerName: string;
  conciergeName: string;
  createdAt: string;
  lastMessageAt: string | null;
  messageCount: number;
  waitingHours: number;
  steps: AdminControlStep[];
  issueCount: number;
  tone: AdminTone;
  controlAction: ControlAction | null;
};

type ControlAction = {
  status: "acknowledged" | "escalated" | "closed";
  note: string | null;
  actorProfileId: string | null;
  createdAt: string;
};

type ControlPayload = {
  health: {
    status: "healthy" | "warning" | "danger" | "unverifiable";
    label: string;
    checkedAt: string;
    fullyVerifiable: boolean;
    checkedSourceCount: number;
    totalSourceCount: number;
    dangerCount: number;
    warningCount: number;
    unavailableSources: Array<{ key: string; label: string; reason: string | null }>;
  };
  summary: {
    onboarding: { total: number; healthy: number; warning: number; danger: number };
    missions: { total: number; healthy: number; warning: number; danger: number };
    messages: { total: number; healthy: number; warning: number; danger: number };
    totalProblems: number;
  };
  onboarding: OnboardingItem[];
  missions: MissionItem[];
  messages: MessageItem[];
  problemRegistry: {
    available: boolean;
    reason: string | null;
    openCount: number;
    items: Array<{
      id: string;
      severity: "information" | "vigilance" | "prioritaire" | "critique";
      status: string;
      title: string;
      summary: string;
      functional_owner: string;
      occurrence_count: number;
      last_detected_at: string;
    }>;
  };
};

type TabKey = "inscriptions" | "missions" | "messages";
type ControlWorkspaceTab = "health" | TabKey;
type PanelKey = "health" | "filters" | "details";

const TAB_LABELS: Record<TabKey, string> = {
  inscriptions: "Inscriptions",
  missions: "Missions",
  messages: "Messages",
};

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
        <span>{isOpen ? "Replier" : "Deplier"}</span>
        <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`} aria-hidden="true" />
      </span>
    </button>
  );
}

function StepRow({ steps }: { steps: AdminControlStep[] }) {
  return (
    <div className={styles.stepRow}>
      {steps.map((step) => (
        <span
          key={step.id}
          className={`${styles.stepPill} ${step.ok ? styles.stepOk : styles.stepProblem}`}
        >
          {formatControlStepLabel(step)}
        </span>
      ))}
    </div>
  );
}

function ControlActionPanel({
  targetType,
  targetId,
  tone,
  action,
  onSaved,
}: {
  targetType: "onboarding" | "mission" | "message";
  targetId: string;
  tone: AdminTone;
  action: ControlAction | null;
  onSaved: () => void;
}) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState<"acknowledged" | "escalated" | "closed" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(status: "acknowledged" | "escalated" | "closed") {
    setSaving(status);
    setError(null);
    try {
      const response = await fetch("/api/admin/control-tower", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, status, note }),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(result?.error || "Action non enregistree.");
        return;
      }
      setNote("");
      onSaved();
    } catch {
      setError("Action non enregistrée.");
    } finally {
      setSaving(null);
    }
  }

  if (tone === "positive" && !action) return null;

  return (
    <div className={styles.controlAction}>
      {action ? (
        <p>
          <strong>
            {action.status === "closed"
              ? "Suivi cloture"
              : action.status === "escalated"
                ? "Transmis au responsable"
                : "Pris en charge"}
          </strong>
          {" | "}
          {formatAdminDate(action.createdAt)}
          {action.note ? <span>{action.note}</span> : null}
        </p>
      ) : (
        <p>Aucune prise en charge enregistrée.</p>
      )}
      {tone !== "positive" ? (
        <>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            placeholder="Motif, consigne ou compte rendu"
            aria-label="Motif de l'action administrateur"
          />
          <div>
            <button
              type="button"
              disabled={saving !== null}
              onClick={() => void save("acknowledged")}
            >
              {saving === "acknowledged" ? "Enregistrement..." : "Prendre en charge"}
            </button>
            <button
              type="button"
              disabled={saving !== null || note.trim().length < 3}
              onClick={() => void save("escalated")}
            >
              {saving === "escalated" ? "Transmission..." : "Transmettre au responsable"}
            </button>
            {action && action.status !== "closed" ? (
              <button
                type="button"
                disabled={saving !== null || note.trim().length < 3}
                onClick={() => void save("closed")}
              >
                {saving === "closed" ? "Cloture..." : "Cloturer le suivi"}
              </button>
            ) : null}
          </div>
        </>
      ) : null}
      {error ? <small role="alert">{error}</small> : null}
    </div>
  );
}

function renderHealthSummary(payload: ControlPayload | null) {
  if (!payload) {
    return "Contrôle indisponible, relance manuelle nécessaire.";
  }

  return `${payload.health.dangerCount} critique(s), ${payload.health.warningCount} à surveiller, ${payload.health.unavailableSources.length} source(s) non vérifiable(s).`;
}

function resolveHealthTone(status: ControlPayload["health"]["status"] | undefined): AdminTone {
  if (status === "danger") return "danger";
  if (status === "warning" || status === "unverifiable") return "warning";
  return "positive";
}

function AdminControlPageContent() {
  const searchParams = useSearchParams();
  const workspaceAnchorRef = useRef<HTMLElement | null>(null);
  const [payload, setPayload] = useState<ControlPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("inscriptions");
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<ControlWorkspaceTab>("health");
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<"all" | AdminTone>("all");
  const [reloadKey, setReloadKey] = useState(0);
  const [panelOpen, setPanelOpen] = useState<Record<PanelKey, boolean>>({
    health: true,
    filters: true,
    details: true,
  });

  useEffect(() => {
    const nextTab = searchParams.get("tab");
    const nextSeverity = searchParams.get("severity");

    if (nextTab === "inscriptions" || nextTab === "missions" || nextTab === "messages") {
      setTab(nextTab);
      setActiveWorkspaceTab(nextTab);
    }

    if (
      nextSeverity === "all" ||
      nextSeverity === "positive" ||
      nextSeverity === "warning" ||
      nextSeverity === "danger"
    ) {
      setSeverity(nextSeverity);
    }
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/control-tower", { cache: "no-store" });
        if (!response.ok) {
          setPayload(null);
          return;
        }
        setPayload((await response.json()) as ControlPayload);
      } catch {
        setPayload(null);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [reloadKey]);

  const currentItems = useMemo(() => {
    if (!payload) return [];
    if (tab === "inscriptions") return payload.onboarding;
    if (tab === "missions") return payload.missions;
    return payload.messages;
  }, [payload, tab]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = normalizeAdminText(search);

    return currentItems.filter((item) => {
      const haystack =
        tab === "inscriptions"
          ? normalizeAdminText(
              [
                (item as OnboardingItem).displayName,
                (item as OnboardingItem).email,
                (item as OnboardingItem).role,
              ].join(" "),
            )
          : tab === "missions"
            ? normalizeAdminText(
                [
                  (item as MissionItem).title,
                  (item as MissionItem).ownerName,
                  (item as MissionItem).conciergeName,
                  (item as MissionItem).status,
                  (item as MissionItem).priority,
                ].join(" "),
              )
            : normalizeAdminText(
                [
                  (item as MessageItem).subject,
                  (item as MessageItem).ownerName,
                  (item as MessageItem).conciergeName,
                  (item as MessageItem).source,
                ].join(" "),
              );

      const matchesSeverity = severity === "all" || item.tone === severity;
      return matchesSeverity && (!normalizedSearch || haystack.includes(normalizedSearch));
    });
  }, [currentItems, search, severity, tab]);

  const filterSummary = useMemo(
    () =>
      `${TAB_LABELS[tab]} : ${filteredItems.length} résultat(s) affiché(s) sur ${currentItems.length} avant filtres.`,
    [currentItems.length, filteredItems.length, tab],
  );

  const detailSummary = useMemo(() => {
    if (filteredItems.length === 0) {
      return `Aucun élément visible dans ${TAB_LABELS[tab].toLowerCase()}.`;
    }

    const withProblems = filteredItems.filter((item) => item.tone !== "positive").length;
    return `${filteredItems.length} élément(s) visible(s), ${withProblems} à surveiller dans ${TAB_LABELS[tab].toLowerCase()}.`;
  }, [filteredItems, tab]);

  const heroTone = resolveHealthTone(payload?.health.status);
  const heroStory = payload
    ? [
        {
          id: "critical",
          label: "Critiques",
          value: String(payload.health.dangerCount),
          detail: "Points qui demandent une intervention immédiate.",
          tone: payload.health.dangerCount > 0 ? "danger" : "positive",
        },
        {
          id: "watch",
          label: "Sous surveillance",
          value: String(payload.health.warningCount),
          detail: "Étapes qui dérivent mais restent encore récupérables.",
          tone: payload.health.warningCount > 0 ? "warning" : "positive",
        },
        {
          id: "coverage",
          label: "Sources contrôlées",
          value: `${payload.health.checkedSourceCount}/${payload.health.totalSourceCount}`,
          detail: payload.health.fullyVerifiable
            ? "Couverture complete du diagnostic disponible."
            : "Une partie du diagnostic reste non confirmable à distance.",
          tone: payload.health.fullyVerifiable ? "positive" : "warning",
        },
      ]
    : [];

  const tabCards = payload
    ? {
        inscriptions: payload.summary.onboarding,
        missions: payload.summary.missions,
        messages: payload.summary.messages,
      }
    : null;

  function togglePanel(panel: PanelKey) {
    setPanelOpen((current) => ({ ...current, [panel]: !current[panel] }));
  }

  function openWorkspaceTab(value: ControlWorkspaceTab) {
    setActiveWorkspaceTab(value);
    if (value !== "health") {
      setTab(value);
    }
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        workspaceAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  if (loading) {
    return <div className="center">Chargement du contrôle détaillé...</div>;
  }

  return (
    <DashboardLayout
      persona="admin"
      title="Contrôle détaillé"
      subtitle="Vérifier et colorer les étapes d'inscription, les missions et les messages pour repérer vite ce qui bloque."
      navTitle="Admin / Operations"
      navItems={buildAdminNavItems("operations", "business")}
      stats={[
        { label: "Problemes", value: String(payload?.summary.totalProblems ?? 0), hint: "Rouge + orange" },
        {
          label: "Inscriptions",
          value: String(payload?.summary.onboarding.total ?? 0),
          hint: `${payload?.summary.onboarding.danger ?? 0} critique(s)`,
        },
        {
          label: "Missions",
          value: String(payload?.summary.missions.total ?? 0),
          hint: `${payload?.summary.missions.danger ?? 0} critique(s)`,
        },
        {
          label: "Messages",
          value: String(payload?.summary.messages.total ?? 0),
          hint: `${payload?.summary.messages.danger ?? 0} critique(s)`,
        },
      ]}
      actions={[
        { label: "Retour cockpit", href: "/dashboard/admin" },
        { label: "Voir utilisateurs", href: "/dashboard/admin/utilisateurs" },
        { label: "Voir missions", href: "/dashboard/admin/missions" },
      ]}
      activity={[
        {
          id: "onboarding",
          title: "Parcours d'inscription",
          description: "Création, confirmation e-mail, première connexion et complétion",
          href: "/dashboard/admin/controle",
        },
        {
          id: "missions",
          title: "Parcours mission",
          description: "Demande, devis, planning, exécution et facture",
          href: "/dashboard/admin/controle",
        },
        {
          id: "messages",
          title: "Parcours messages",
          description: "Conversation, premier message, réponse et activité récente",
          href: "/dashboard/admin/controle",
        },
      ]}
      notifications={[
        {
          id: "control-problems",
          title: `${payload?.summary.totalProblems ?? 0} point(s) a corriger sur le parcours plateforme.`,
          level: (payload?.summary.totalProblems ?? 0) > 0 ? "warning" : "info",
          href: "/dashboard/admin/controle",
        },
      ]}
      shortcuts={buildAdminShortcuts("operations", "business")}
      profile={{ name: "PlanetLS", subtitle: "Contrôle des étapes", badge: "Administration" }}
    >
      <section className={styles.hero} data-tone={heroTone}>
        <div className={styles.heroTop}>
          <div className={styles.heroCopy}>
            <span className={styles.heroEyebrow}>Centre de santé opérationnelle</span>
            <AdminStatusBadge label={payload?.health.label ?? "Controle indisponible"} tone={heroTone} />
            <h2>Voir en quelques secondes où le parcours se tend, ce qui reste récupérable et quelle file doit être reprise maintenant.</h2>
            <p>{renderHealthSummary(payload)}</p>
          </div>

          <div className={styles.heroActions}>
            <Link href="/dashboard/admin" className={styles.heroActionCard}>
              <span>Retour cockpit</span>
              <strong>Revenir au Mission Control</strong>
              <p>Retrouver la vue globale, les tendances et les priorités du jour.</p>
            </Link>
            <button
              type="button"
              className={styles.heroRefresh}
              onClick={() => setReloadKey((value) => value + 1)}
            >
              Relancer le contrôle complet
            </button>
          </div>
        </div>

        {heroStory.length > 0 ? (
          <div className={styles.heroStoryGrid}>
            {heroStory.map((item) => (
              <article key={item.id} className={styles.heroStoryCard} data-tone={item.tone}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <Tabs value={activeWorkspaceTab} onValueChange={(value) => openWorkspaceTab(value as ControlWorkspaceTab)}>
        <section ref={workspaceAnchorRef} className={styles.workspaceTabsBlock} aria-label="Navigation par onglets du contrôle détaillé">
          <TabsList className={styles.workspaceTabsList}>
            <TabsTrigger value="health" className={styles.workspaceTabTrigger}>
              <span>Santé globale</span>
              <small>{payload?.health.label ?? "Vue synthese"}</small>
            </TabsTrigger>
            {(["inscriptions", "missions", "messages"] as TabKey[]).map((item) => (
              <TabsTrigger key={item} value={item} className={styles.workspaceTabTrigger}>
                <span>{TAB_LABELS[item]}</span>
                <small>
                  {item === "inscriptions"
                    ? `${tabCards?.inscriptions.danger ?? 0} critique(s)`
                    : item === "missions"
                      ? `${tabCards?.missions.danger ?? 0} critique(s)`
                      : `${tabCards?.messages.warning ?? 0} a suivre`}
                </small>
              </TabsTrigger>
            ))}
          </TabsList>
        </section>

        <TabsContent value="health" className={styles.workspaceTabContent}>
          <section className={styles.foldablePanel}>
            <FoldableSectionHeader
              title="État général"
              summary={renderHealthSummary(payload)}
              isOpen={panelOpen.health}
              onToggle={() => togglePanel("health")}
              controlsId="admin-control-health"
            />
            {panelOpen.health ? (
              <div id="admin-control-health" className={styles.foldableContent}>
                {payload ? (
                  <>
                  <section className={`${styles.healthBanner} ${styles[`health_${payload.health.status}`]}`}>
                    <div className={styles.healthSummary}>
                      <span className={styles.healthEyebrow}>État général</span>
                      <h2>{payload.health.label}</h2>
                      <p>
                        {payload.health.fullyVerifiable
                          ? `${payload.health.checkedSourceCount} sources sur ${payload.health.totalSourceCount} ont ete controlees.`
                          : `${payload.health.checkedSourceCount} sources sur ${payload.health.totalSourceCount} seulement sont vérifiables.`}
                      </p>
                      <small>Dernier contrôle : {formatAdminDate(payload.health.checkedAt)}</small>
                    </div>
                    <div className={styles.healthCounters} aria-label="Résultat du contrôle global">
                      <div>
                        <strong>{payload.health.dangerCount}</strong>
                        <span>critiques</span>
                      </div>
                      <div>
                        <strong>{payload.health.warningCount}</strong>
                        <span>à surveiller</span>
                      </div>
                      <div>
                        <strong>{payload.health.unavailableSources.length}</strong>
                        <span>non vérifiables</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.refreshButton}
                      onClick={() => setReloadKey((value) => value + 1)}
                    >
                      Relancer le contrôle
                    </button>
                    {payload.health.unavailableSources.length > 0 ? (
                      <div className={styles.unavailableSources} role="alert">
                        <strong>Contrôles impossibles à confirmer</strong>
                        <ul>
                          {payload.health.unavailableSources.map((source) => (
                            <li key={source.key}>
                              <span>{source.label}</span>
                              <small>{source.reason}</small>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </section>
                  <DashboardPanel title={`Registre À traiter (${payload.problemRegistry.openCount})`}>
                    {payload.problemRegistry.available ? (
                      payload.problemRegistry.items.length > 0 ? (
                        <div className={styles.cardList}>
                          {payload.problemRegistry.items.map((problem) => (
                            <article key={problem.id} className={styles.card} data-problem-id={problem.id}>
                              <div className={styles.cardHeader}>
                                <div>
                                  <h3>{problem.title}</h3>
                                  <p>{problem.summary}</p>
                                </div>
                                <AdminStatusBadge
                                  label={problem.severity}
                                  tone={problem.severity === "critique" ? "danger" : problem.severity === "prioritaire" ? "warning" : "positive"}
                                />
                              </div>
                              <div className={styles.inlineFacts}>
                                <div><span>Statut</span><strong>{problem.status}</strong></div>
                                <div><span>Responsable</span><strong>{problem.functional_owner}</strong></div>
                                <div><span>Détections</span><strong>{problem.occurrence_count}</strong></div>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <AdminEmptyState title="Aucun problème persistant ouvert" description="Les prochaines détections dédupliquées apparaîtront ici." />
                      )
                    ) : (
                      <AdminEmptyState title="Registre indisponible" description={payload.problemRegistry.reason ?? "La source ne peut pas être vérifiée."} />
                    )}
                  </DashboardPanel>
                  </>
                ) : (
                  <section className={`${styles.healthBanner} ${styles.health_unverifiable}`} role="alert">
                    <div className={styles.healthSummary}>
                      <span className={styles.healthEyebrow}>État général</span>
                      <h2>Contrôle indisponible</h2>
                      <p>L'état de la plateforme ne peut pas être confirmé pour le moment.</p>
                    </div>
                    <button
                      type="button"
                      className={styles.refreshButton}
                      onClick={() => setReloadKey((value) => value + 1)}
                    >
                      Réessayer
                    </button>
                  </section>
                )}
              </div>
            ) : null}
          </section>
        </TabsContent>

        {(["inscriptions", "missions", "messages"] as TabKey[]).map((item) => (
          <TabsContent key={item} value={item} className={styles.workspaceTabContent}>
            <section className={styles.foldablePanel}>
              <FoldableSectionHeader
                title={`Filtres ${TAB_LABELS[item].toLowerCase()}`}
                summary={filterSummary}
                isOpen={panelOpen.filters}
                onToggle={() => togglePanel("filters")}
                controlsId={`admin-control-filters-${item}`}
              />
              {panelOpen.filters ? (
                <div id={`admin-control-filters-${item}`} className={styles.foldableContent}>
                  <DashboardPanel title={`Filtres ${TAB_LABELS[item].toLowerCase()}`}>
                    <div className={styles.filterRow}>
                      <label className={styles.field}>
                        <span>Recherche</span>
                        <input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Nom, sujet, mission..."
                        />
                      </label>
                      <label className={styles.field}>
                        <span>Couleur</span>
                        <select
                          value={severity}
                          onChange={(event) => setSeverity(event.target.value as "all" | AdminTone)}
                        >
                          <option value="all">Toutes</option>
                          <option value="danger">Rouge</option>
                          <option value="warning">Orange</option>
                          <option value="positive">Vert</option>
                        </select>
                      </label>
                      <div className={styles.filterSummary} aria-live="polite">
                        <span>{TAB_LABELS[tab]}</span>
                        <strong>{filteredItems.length} résultat(s)</strong>
                        <p>{currentItems.length} élément(s) dans cet onglet avant filtres.</p>
                      </div>
                    </div>
                  </DashboardPanel>
                </div>
              ) : null}
            </section>

            <section className={styles.foldablePanel}>
              <FoldableSectionHeader
                title={`Détail ${TAB_LABELS[item].toLowerCase()}`}
                summary={detailSummary}
                isOpen={panelOpen.details}
                onToggle={() => togglePanel("details")}
                controlsId={`admin-control-details-${item}`}
              />
              {panelOpen.details ? (
                <div id={`admin-control-details-${item}`} className={styles.foldableContent}>
                  <DashboardPanel title={`Détail ${TAB_LABELS[item].toLowerCase()}`}>
                    {filteredItems.length === 0 ? (
                      <AdminEmptyState
                        title="Aucun élément pour ce filtre"
                        description="Ajustez la recherche ou la couleur pour afficher les étapes à contrôler."
                      />
                    ) : (
                      <div className={styles.cardList}>
                  {tab === "inscriptions" &&
                    (filteredItems as OnboardingItem[]).map((item) => (
                      <article key={item.id} className={styles.card} data-control-target={`onboarding:${item.id}`}>
                        <div className={styles.cardHeader}>
                          <div>
                            <h3>{item.displayName}</h3>
                            <p>{item.email || "E-mail manquant"}</p>
                          </div>
                          <AdminStatusBadge label={getControlToneLabel(item.tone)} tone={item.tone} />
                        </div>
                        <div className={styles.inlineFacts}>
                          <div>
                            <span>Rôle</span>
                            <strong>{item.role}</strong>
                          </div>
                          <div>
                            <span>Alertes</span>
                            <strong>{item.issueCount}</strong>
                          </div>
                          <div>
                            <span>Dernière activité</span>
                            <strong>{formatAdminDate(item.lastSignInAt)}</strong>
                          </div>
                        </div>
                        <div className={styles.metaGrid}>
                          <div>
                            <span>Création</span>
                            <strong>{formatAdminDate(item.createdAt)}</strong>
                          </div>
                          <div>
                            <span>Fin d'inscription</span>
                            <strong>{formatAdminDate(item.onboardingCompletedAt)}</strong>
                          </div>
                        </div>
                        <StepRow steps={item.steps} />
                        <ControlActionPanel
                          targetType="onboarding"
                          targetId={item.id}
                          tone={item.tone}
                          action={item.controlAction}
                          onSaved={() => setReloadKey((value) => value + 1)}
                        />
                        <div className={styles.actions}>
                          <Link href="/dashboard/admin/utilisateurs">Ouvrir la base utilisateurs</Link>
                        </div>
                      </article>
                    ))}

                  {tab === "missions" &&
                    (filteredItems as MissionItem[]).map((item) => (
                      <article key={item.id} className={styles.card} data-control-target={`mission:${item.id}`}>
                        <div className={styles.cardHeader}>
                          <div>
                            <h3>{item.title || "Mission"}</h3>
                            <p>
                              {item.ownerName} | {item.conciergeName}
                            </p>
                          </div>
                          <AdminStatusBadge label={getControlToneLabel(item.tone)} tone={item.tone} />
                        </div>
                        <div className={styles.inlineFacts}>
                          <div>
                            <span>Statut</span>
                            <strong>{item.status || "Non renseigné"}</strong>
                          </div>
                          <div>
                            <span>Priorité</span>
                            <strong>{item.priority || "Non renseignée"}</strong>
                          </div>
                          <div>
                            <span>Alertes</span>
                            <strong>{item.issueCount}</strong>
                          </div>
                        </div>
                        <div className={styles.metaGrid}>
                          <div>
                            <span>Affectation</span>
                            <strong>{item.assignmentCount} intervenant(s)</strong>
                          </div>
                          <div>
                            <span>Facturation</span>
                            <strong>{item.invoiceCount} facture(s){item.hasOverdueInvoice ? " | en retard" : ""}</strong>
                          </div>
                          <div>
                            <span>Maintenance ouverte</span>
                            <strong>{item.openMaintenanceCount} incident(s)</strong>
                          </div>
                        </div>
                        <StepRow steps={item.steps} />
                        <ControlActionPanel
                          targetType="mission"
                          targetId={item.id}
                          tone={item.tone}
                          action={item.controlAction}
                          onSaved={() => setReloadKey((value) => value + 1)}
                        />
                        <div className={styles.actions}>
                          <Link href="/dashboard/admin/missions">Ouvrir le suivi missions</Link>
                        </div>
                      </article>
                    ))}

                  {tab === "messages" &&
                    (filteredItems as MessageItem[]).map((item) => (
                      <article key={item.id} className={styles.card} data-control-target={`message:${item.id}`}>
                        <div className={styles.cardHeader}>
                          <div>
                            <h3>{item.subject}</h3>
                            <p>
                              {item.ownerName} | {item.conciergeName}
                            </p>
                          </div>
                          <AdminStatusBadge label={getControlToneLabel(item.tone)} tone={item.tone} />
                        </div>
                        <div className={styles.inlineFacts}>
                          <div>
                            <span>Source</span>
                            <strong>{item.source || "manual"}</strong>
                          </div>
                          <div>
                            <span>Alertes</span>
                            <strong>{item.issueCount}</strong>
                          </div>
                          <div>
                            <span>Messages</span>
                            <strong>{item.messageCount}</strong>
                          </div>
                        </div>
                        <div className={styles.metaGrid}>
                          <div>
                            <span>Dernier message</span>
                            <strong>{formatAdminDate(item.lastMessageAt)}</strong>
                          </div>
                          <div>
                            <span>Attente</span>
                            <strong>{item.waitingHours} h</strong>
                          </div>
                        </div>
                        <StepRow steps={item.steps} />
                        <ControlActionPanel
                          targetType="message"
                          targetId={item.id}
                          tone={item.tone}
                          action={item.controlAction}
                          onSaved={() => setReloadKey((value) => value + 1)}
                        />
                        <div className={styles.actions}>
                          <Link href="/dashboard/admin/demandes">Ouvrir les demandes liées</Link>
                        </div>
                      </article>
                    ))}
                      </div>
                    )}
                  </DashboardPanel>
                </div>
              ) : null}
            </section>
          </TabsContent>
        ))}
      </Tabs>
    </DashboardLayout>
  );
}

export default function AdminControlPage() {
  return (
    <Suspense fallback={<div className="center">Chargement du contrôle détaillé...</div>}>
      <AdminControlPageContent />
    </Suspense>
  );
}
