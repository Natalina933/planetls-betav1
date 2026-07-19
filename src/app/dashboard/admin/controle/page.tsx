"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DashboardLayout, DashboardPanel } from "@/components/dashboard";
import {
  AdminEmptyState,
  AdminKpiGrid,
  AdminStatusBadge,
  formatAdminDate,
  formatControlStepLabel,
  getControlToneLabel,
  normalizeAdminText,
  type AdminControlStep,
  type AdminKpi,
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

const TAB_LABELS: Record<TabKey, string> = {
  inscriptions: "Inscriptions",
  missions: "Missions",
  messages: "Messages",
};

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

function AdminControlPageContent() {
  const searchParams = useSearchParams();
  const [payload, setPayload] = useState<ControlPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("inscriptions");
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<"all" | AdminTone>("all");
  const [reloadKey, setReloadKey] = useState(0);

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

  const kpis = useMemo<AdminKpi[]>(() => {
    if (!payload) return [];

    return [
      {
        id: "problems",
        label: "Problèmes détectés",
        value: payload.summary.totalProblems,
        helper: "Points à corriger sur les parcours contrôlés",
        tone: payload.summary.totalProblems > 0 ? "danger" : "positive",
      },
      {
        id: "onboarding",
        label: "Inscriptions à surveiller",
        value: payload.summary.onboarding.warning + payload.summary.onboarding.danger,
        helper: `${payload.summary.onboarding.healthy} parcours sains`,
        tone:
          payload.summary.onboarding.danger > 0
            ? "danger"
            : payload.summary.onboarding.warning > 0
              ? "warning"
              : "positive",
      },
      {
        id: "missions",
        label: "Missions à surveiller",
        value: payload.summary.missions.warning + payload.summary.missions.danger,
        helper: `${payload.summary.missions.healthy} missions saines`,
        tone:
          payload.summary.missions.danger > 0
            ? "danger"
            : payload.summary.missions.warning > 0
              ? "warning"
              : "positive",
      },
      {
        id: "messages",
        label: "Conversations à surveiller",
        value: payload.summary.messages.warning + payload.summary.messages.danger,
        helper: `${payload.summary.messages.healthy} conversations saines`,
        tone:
          payload.summary.messages.danger > 0
            ? "danger"
            : payload.summary.messages.warning > 0
              ? "warning"
              : "positive",
      },
    ];
  }, [payload]);

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
              [(item as OnboardingItem).displayName, (item as OnboardingItem).email, (item as OnboardingItem).role].join(
                " ",
              ),
            )
          : tab === "missions"
            ? normalizeAdminText(
                [
                  (item as MissionItem).title,
                  (item as MissionItem).ownerName,
                  (item as MissionItem).conciergeName,
                  (item as MissionItem).status,
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

  if (loading) {
    return <div className="center">Chargement du contrôle détaillé...</div>;
  }

  return (
    <DashboardLayout
      persona="admin"
      title="Contrôle détaillé"
      subtitle="Vérifier et colorer les étapes d'inscription, les missions et les messages pour repérer vite ce qui bloque."
      navTitle="Pilotage admin"
      navItems={[
        { label: "Vue d'ensemble", href: "/dashboard/admin" },
        { label: "Contrôle détaillé", href: "/dashboard/admin/controle" },
        { label: "Utilisateurs", href: "/dashboard/admin/utilisateurs" },
        { label: "Demandes", href: "/dashboard/admin/demandes" },
        { label: "Missions", href: "/dashboard/admin/missions" },
      ]}
      stats={[
        { label: "Problèmes", value: String(payload?.summary.totalProblems ?? 0), hint: "Rouge + orange" },
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
          title: `${payload?.summary.totalProblems ?? 0} point(s) à corriger sur le parcours plateforme.`,
          level: (payload?.summary.totalProblems ?? 0) > 0 ? "warning" : "info",
          href: "/dashboard/admin/controle",
        },
      ]}
      shortcuts={[
        { label: "Cockpit", href: "/dashboard/admin" },
        { label: "Demandes", href: "/dashboard/admin/demandes" },
        { label: "Missions", href: "/dashboard/admin/missions" },
      ]}
      profile={{ name: "PlanetLS", subtitle: "Contrôle des étapes", badge: "Administration" }}
    >
      {payload ? (
        <section className={`${styles.healthBanner} ${styles[`health_${payload.health.status}`]}`}>
          <div className={styles.healthSummary}>
            <span className={styles.healthEyebrow}>État général</span>
            <h2>{payload.health.label}</h2>
            <p>
              {payload.health.fullyVerifiable
                ? `${payload.health.checkedSourceCount} sources sur ${payload.health.totalSourceCount} ont été contrôlées.`
                : `${payload.health.checkedSourceCount} sources sur ${payload.health.totalSourceCount} seulement sont vérifiables.`}
            </p>
            <small>Dernier contrôle : {formatAdminDate(payload.health.checkedAt)}</small>
          </div>
          <div className={styles.healthCounters} aria-label="Résultat du contrôle global">
            <div><strong>{payload.health.dangerCount}</strong><span>critiques</span></div>
            <div><strong>{payload.health.warningCount}</strong><span>à surveiller</span></div>
            <div><strong>{payload.health.unavailableSources.length}</strong><span>non vérifiables</span></div>
          </div>
          <button type="button" className={styles.refreshButton} onClick={() => setReloadKey((value) => value + 1)}>
            Relancer le contrôle
          </button>
          {payload.health.unavailableSources.length > 0 ? (
            <div className={styles.unavailableSources} role="alert">
              <strong>Contrôles impossibles à confirmer</strong>
              <ul>
                {payload.health.unavailableSources.map((source) => (
                  <li key={source.key}><span>{source.label}</span><small>{source.reason}</small></li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : (
        <section className={`${styles.healthBanner} ${styles.health_unverifiable}`} role="alert">
          <div className={styles.healthSummary}>
            <span className={styles.healthEyebrow}>État général</span>
            <h2>Contrôle indisponible</h2>
            <p>L’état de la plateforme ne peut pas être confirmé pour le moment.</p>
          </div>
          <button type="button" className={styles.refreshButton} onClick={() => setReloadKey((value) => value + 1)}>
            Réessayer
          </button>
        </section>
      )}

      <DashboardPanel title="Vue rapide">
        <AdminKpiGrid kpis={kpis} />
      </DashboardPanel>

      <DashboardPanel title="Onglets de contrôle">
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
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, sujet, mission..." />
          </label>
          <label className={styles.field}>
            <span>Couleur</span>
            <select value={severity} onChange={(event) => setSeverity(event.target.value as "all" | AdminTone)}>
              <option value="all">Toutes</option>
              <option value="danger">Rouge</option>
              <option value="warning">Orange</option>
              <option value="positive">Vert</option>
            </select>
          </label>
        </div>
      </DashboardPanel>

      <DashboardPanel title={`Détail ${TAB_LABELS[tab].toLowerCase()}`}>
        {filteredItems.length === 0 ? (
          <AdminEmptyState
            title="Aucun élément pour ce filtre"
            description="Ajustez la recherche ou la couleur pour afficher les étapes à contrôler."
          />
        ) : (
          <div className={styles.cardList}>
            {tab === "inscriptions" &&
              (filteredItems as OnboardingItem[]).map((item) => (
                <article key={item.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h3>{item.displayName}</h3>
                      <p>
                        {item.email || "E-mail manquant"} · {item.role}
                      </p>
                    </div>
                    <AdminStatusBadge label={getControlToneLabel(item.tone)} tone={item.tone} />
                  </div>
                  <div className={styles.metaGrid}>
                    <div>
                      <span>Création</span>
                      <strong>{formatAdminDate(item.createdAt)}</strong>
                    </div>
                    <div>
                      <span>Dernière connexion</span>
                      <strong>{formatAdminDate(item.lastSignInAt)}</strong>
                    </div>
                    <div>
                      <span>Fin inscription</span>
                      <strong>{formatAdminDate(item.onboardingCompletedAt)}</strong>
                    </div>
                  </div>
                  <StepRow steps={item.steps} />
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
                        {item.ownerName} · {item.conciergeName}
                      </p>
                    </div>
                    <AdminStatusBadge label={getControlToneLabel(item.tone)} tone={item.tone} />
                  </div>
                  <div className={styles.metaGrid}>
                    <div>
                      <span>Statut</span>
                      <strong>{item.status || "Non renseigné"}</strong>
                    </div>
                    <div>
                      <span>Affectation</span>
                      <strong>{item.assignmentCount} intervenant(s)</strong>
                    </div>
                    <div>
                      <span>Facturation</span>
                      <strong>{item.invoiceCount} facture(s){item.hasOverdueInvoice ? " · en retard" : ""}</strong>
                    </div>
                    <div>
                      <span>Maintenance ouverte</span>
                      <strong>{item.openMaintenanceCount} incident(s)</strong>
                    </div>
                  </div>
                  <StepRow steps={item.steps} />
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
                        {item.ownerName} · {item.conciergeName}
                      </p>
                    </div>
                    <AdminStatusBadge label={getControlToneLabel(item.tone)} tone={item.tone} />
                  </div>
                  <div className={styles.metaGrid}>
                    <div>
                      <span>Source</span>
                      <strong>{item.source || "manual"}</strong>
                    </div>
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
                  <div className={styles.actions}>
                    <Link href="/dashboard/admin/demandes">Ouvrir les demandes liées</Link>
                  </div>
                </article>
              ))}
          </div>
        )}
      </DashboardPanel>
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
