"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DashboardLayout, DashboardPanel } from "@/components/dashboard";
import {
  AdminEmptyState,
  AdminStatusBadge,
  formatAdminDate,
  formatControlStepLabel,
  getControlToneLabel,
  normalizeAdminText,
  type AdminControlStep,
  type AdminTone,
} from "../AdminOperations";
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
};

type TabKey = "inscriptions" | "missions" | "messages";
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
      setError("Action non enregistree.");
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
        <p>Aucune prise en charge enregistree.</p>
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
    return "Controle indisponible, relance manuelle necessaire.";
  }

  return `${payload.health.dangerCount} critique(s), ${payload.health.warningCount} a surveiller, ${payload.health.unavailableSources.length} source(s) non verifiable(s).`;
}

function AdminControlPageContent() {
  const searchParams = useSearchParams();
  const [payload, setPayload] = useState<ControlPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("inscriptions");
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
      `${TAB_LABELS[tab]} : ${filteredItems.length} resultat(s) affiches sur ${currentItems.length} avant filtres.`,
    [currentItems.length, filteredItems.length, tab],
  );

  const detailSummary = useMemo(() => {
    if (filteredItems.length === 0) {
      return `Aucun element visible dans ${TAB_LABELS[tab].toLowerCase()}.`;
    }

    const withProblems = filteredItems.filter((item) => item.tone !== "positive").length;
    return `${filteredItems.length} element(s) visible(s), ${withProblems} a surveiller dans ${TAB_LABELS[tab].toLowerCase()}.`;
  }, [filteredItems, tab]);

  function togglePanel(panel: PanelKey) {
    setPanelOpen((current) => ({ ...current, [panel]: !current[panel] }));
  }

  if (loading) {
    return <div className="center">Chargement du controle detaille...</div>;
  }

  return (
    <DashboardLayout
      persona="admin"
      title="Controle detaille"
      subtitle="Verifier et colorer les etapes d'inscription, les missions et les messages pour reperer vite ce qui bloque."
      navTitle="Pilotage admin"
      navItems={[
        { label: "Vue d'ensemble", href: "/dashboard/admin" },
        { label: "Controle detaille", href: "/dashboard/admin/controle" },
        { label: "Utilisateurs", href: "/dashboard/admin/utilisateurs" },
        { label: "Demandes", href: "/dashboard/admin/demandes" },
        { label: "Missions", href: "/dashboard/admin/missions" },
      ]}
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
          description: "Creation, confirmation e-mail, premiere connexion et completion",
          href: "/dashboard/admin/controle",
        },
        {
          id: "missions",
          title: "Parcours mission",
          description: "Demande, devis, planning, execution et facture",
          href: "/dashboard/admin/controle",
        },
        {
          id: "messages",
          title: "Parcours messages",
          description: "Conversation, premier message, reponse et activite recente",
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
      shortcuts={[
        { label: "Cockpit", href: "/dashboard/admin" },
        { label: "Demandes", href: "/dashboard/admin/demandes" },
        { label: "Missions", href: "/dashboard/admin/missions" },
      ]}
      profile={{ name: "PlanetLS", subtitle: "Controle des etapes", badge: "Administration" }}
    >
      <section className={styles.foldablePanel}>
        <FoldableSectionHeader
          title="Etat general"
          summary={renderHealthSummary(payload)}
          isOpen={panelOpen.health}
          onToggle={() => togglePanel("health")}
          controlsId="admin-control-health"
        />
        {panelOpen.health ? (
          <div id="admin-control-health" className={styles.foldableContent}>
            {payload ? (
              <section className={`${styles.healthBanner} ${styles[`health_${payload.health.status}`]}`}>
                <div className={styles.healthSummary}>
                  <span className={styles.healthEyebrow}>Etat general</span>
                  <h2>{payload.health.label}</h2>
                  <p>
                    {payload.health.fullyVerifiable
                      ? `${payload.health.checkedSourceCount} sources sur ${payload.health.totalSourceCount} ont ete controlees.`
                      : `${payload.health.checkedSourceCount} sources sur ${payload.health.totalSourceCount} seulement sont verifiables.`}
                  </p>
                  <small>Dernier controle : {formatAdminDate(payload.health.checkedAt)}</small>
                </div>
                <div className={styles.healthCounters} aria-label="Resultat du controle global">
                  <div>
                    <strong>{payload.health.dangerCount}</strong>
                    <span>critiques</span>
                  </div>
                  <div>
                    <strong>{payload.health.warningCount}</strong>
                    <span>a surveiller</span>
                  </div>
                  <div>
                    <strong>{payload.health.unavailableSources.length}</strong>
                    <span>non verifiables</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.refreshButton}
                  onClick={() => setReloadKey((value) => value + 1)}
                >
                  Relancer le controle
                </button>
                {payload.health.unavailableSources.length > 0 ? (
                  <div className={styles.unavailableSources} role="alert">
                    <strong>Controles impossibles a confirmer</strong>
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
            ) : (
              <section className={`${styles.healthBanner} ${styles.health_unverifiable}`} role="alert">
                <div className={styles.healthSummary}>
                  <span className={styles.healthEyebrow}>Etat general</span>
                  <h2>Controle indisponible</h2>
                  <p>L'etat de la plateforme ne peut pas etre confirme pour le moment.</p>
                </div>
                <button
                  type="button"
                  className={styles.refreshButton}
                  onClick={() => setReloadKey((value) => value + 1)}
                >
                  Reessayer
                </button>
              </section>
            )}
          </div>
        ) : null}
      </section>

      <section className={styles.foldablePanel}>
        <FoldableSectionHeader
          title="Onglets de controle"
          summary={filterSummary}
          isOpen={panelOpen.filters}
          onToggle={() => togglePanel("filters")}
          controlsId="admin-control-filters"
        />
        {panelOpen.filters ? (
          <div id="admin-control-filters" className={styles.foldableContent}>
            <DashboardPanel title="Onglets de controle">
              <div className={styles.tabRow}>
                {(["inscriptions", "missions", "messages"] as TabKey[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTab(item)}
                    className={`${styles.tabButton} ${tab === item ? styles.tabButtonActive : ""}`}
                  >
                    {TAB_LABELS[item]}
                  </button>
                ))}
              </div>

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
                  <strong>{filteredItems.length} resultat(s)</strong>
                  <p>{currentItems.length} element(s) dans cet onglet avant filtres.</p>
                </div>
              </div>
            </DashboardPanel>
          </div>
        ) : null}
      </section>

      <section className={styles.foldablePanel}>
        <FoldableSectionHeader
          title={`Detail ${TAB_LABELS[tab].toLowerCase()}`}
          summary={detailSummary}
          isOpen={panelOpen.details}
          onToggle={() => togglePanel("details")}
          controlsId="admin-control-details"
        />
        {panelOpen.details ? (
          <div id="admin-control-details" className={styles.foldableContent}>
            <DashboardPanel title={`Detail ${TAB_LABELS[tab].toLowerCase()}`}>
              {filteredItems.length === 0 ? (
                <AdminEmptyState
                  title="Aucun element pour ce filtre"
                  description="Ajustez la recherche ou la couleur pour afficher les etapes a controler."
                />
              ) : (
                <div className={styles.cardList}>
                  {tab === "inscriptions" &&
                    (filteredItems as OnboardingItem[]).map((item) => (
                      <article key={item.id} className={styles.card}>
                        <div className={styles.cardHeader}>
                          <div>
                            <h3>{item.displayName}</h3>
                            <p>{item.email || "E-mail manquant"}</p>
                          </div>
                          <AdminStatusBadge label={getControlToneLabel(item.tone)} tone={item.tone} />
                        </div>
                        <div className={styles.inlineFacts}>
                          <div>
                            <span>Role</span>
                            <strong>{item.role}</strong>
                          </div>
                          <div>
                            <span>Alertes</span>
                            <strong>{item.issueCount}</strong>
                          </div>
                          <div>
                            <span>Derniere activite</span>
                            <strong>{formatAdminDate(item.lastSignInAt)}</strong>
                          </div>
                        </div>
                        <div className={styles.metaGrid}>
                          <div>
                            <span>Creation</span>
                            <strong>{formatAdminDate(item.createdAt)}</strong>
                          </div>
                          <div>
                            <span>Fin inscription</span>
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
                      <article key={item.id} className={styles.card}>
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
                            <strong>{item.status || "Non renseigne"}</strong>
                          </div>
                          <div>
                            <span>Priorite</span>
                            <strong>{item.priority || "Non renseignee"}</strong>
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
                      <article key={item.id} className={styles.card}>
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
                          <Link href="/dashboard/admin/demandes">Ouvrir les demandes liees</Link>
                        </div>
                      </article>
                    ))}
                </div>
              )}
            </DashboardPanel>
          </div>
        ) : null}
      </section>
    </DashboardLayout>
  );
}

export default function AdminControlPage() {
  return (
    <Suspense fallback={<div className="center">Chargement du controle detaille...</div>}>
      <AdminControlPageContent />
    </Suspense>
  );
}
