"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FiAlertTriangle, FiCheckCircle, FiClock, FiHome, FiShield, FiTool, FiUsers } from "react-icons/fi";
import { DashboardLayout, DashboardPanel } from "@/components/dashboard";
import {
  AdminEmptyState,
  AdminKpiGrid,
  AdminStatusBadge,
  formatAdminDate,
  normalizeAdminText,
  type AdminKpi,
} from "./AdminOperations";
import { AdminBubblePanel, AdminDonutCard, AdminGaugeCard, AdminToneLegend } from "./AdminVisuals";
import styles from "./AdminPeopleWorkspace.module.scss";

type RoleBucket = "admin" | "owner" | "concierge" | "provider";
type ActivityFilter = "all" | "active24h" | "active7d" | "neverSignedIn" | "stale";
type OnboardingFilter = "all" | "complete" | "incomplete" | "emailPending";

type AdminUserSummary = {
  id: string;
  email: string | null;
  displayName: string;
  role: string;
  roleBucket: RoleBucket;
  companyName: string | null;
  city: string | null;
  phone: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  onboardingComplete: boolean;
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
  isActive24h: boolean;
  isActive7d: boolean;
  propertyCount: number;
  requestCount: number;
  recipientCount: number;
  ownerMissionCount: number;
  conciergeMissionCount: number;
  clientCount: number;
  pricingCount: number;
  healthFlags: string[];
};

type AdminOverviewPayload = {
  summary: {
    totalUsers: number;
    active24h: number;
    active7d: number;
    onboardingComplete: number;
    emailConfirmed: number;
    neverSignedIn: number;
    owners: number;
    concierges: number;
    providers: number;
    admins: number;
    properties: number;
    missions: number;
    serviceRequests: number;
    invoices: number;
    planningEntries: number;
    workflowEvents: number;
    onboardingEvents: number;
  };
  spotlights: {
    recentlySignedIn: AdminUserSummary[];
    onboardingAlerts: AdminUserSummary[];
  };
  users: AdminUserSummary[];
};

type AdminUserDetailPayload = {
  user: {
    id: string;
    email: string | null;
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    role: string;
    roleBucket: RoleBucket;
    companyName: string | null;
    city: string | null;
    phone: string | null;
    location: string | null;
    status: string | null;
    onboardingComplete: boolean;
    onboardingCompletedAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    emailConfirmedAt: string | null;
    lastSignInAt: string | null;
    authCreatedAt: string | null;
    legalForm: string | null;
    website: string | null;
    serviceArea: string | null;
    serviceRadiusKm: number | null;
    hourlyRate: number | null;
    monthlyRate: number | null;
    yearsExperience: number | null;
    experienceLevel: string | null;
  };
  metrics: Record<string, number>;
  collections: {
    properties: Array<{ id: string; name: string | null; city: string | null; status: string | null }>;
    ownerRequests: Array<{
      id: string;
      title: string | null;
      status: string | null;
      workflow_status: string | null;
      city: string | null;
      created_at: string | null;
    }>;
    conciergeRequests: Array<{
      id: string;
      title: string | null;
      status: string | null;
      workflow_status: string | null;
      city: string | null;
      created_at: string | null;
    }>;
    recipients: Array<{
      id: string;
      service_request_id: string;
      status: string | null;
      responded_at: string | null;
      viewed_at: string | null;
      created_at: string | null;
    }>;
    ownerMissions: Array<{ id: string; title: string; status: string; priority: string; created_at: string }>;
    conciergeMissions: Array<{ id: string; title: string; status: string; priority: string; created_at: string }>;
    pricing: Array<{ id: string; label: string; amount: number; unit: string | null; created_at: string | null }>;
    profileServices: Array<{ id: number; service_id: number; selected: boolean | null; created_at: string | null }>;
    providerClients: Array<{
      id: string;
      client_name: string | null;
      company_name: string | null;
      city: string | null;
      client_type: string | null;
      status: string | null;
      created_at: string | null;
    }>;
    ownerQuotes: Array<{ id: string; status: string; total_amount: number; created_at: string }>;
    conciergeQuotes: Array<{ id: string; status: string; total_amount: number; created_at: string }>;
    ownerInvoices: Array<{ id: string; status: string; total_amount: number; created_at: string }>;
    conciergeInvoices: Array<{ id: string; status: string; total_amount: number; created_at: string }>;
  };
};

const ROLE_LABELS: Record<RoleBucket, string> = {
  admin: "Administrateurs",
  owner: "Propriétaires",
  concierge: "Conciergeries",
  provider: "Artisans",
};

const DASHBOARD_LABELS: Record<RoleBucket, string> = {
  admin: "/dashboard/admin",
  owner: "/dashboard/owner",
  concierge: "/dashboard/concierge",
  provider: "/dashboard/provider",
};

const ROLE_OPTIONS = [
  { value: "all", label: "Tous les roles" },
  { value: "owner", label: "Propriétaires" },
  { value: "concierge", label: "Conciergeries" },
  { value: "provider", label: "Artisans" },
  { value: "admin", label: "Administrateurs" },
];

const ACTIVITY_OPTIONS: Array<{ value: ActivityFilter; label: string }> = [
  { value: "all", label: "Toute activite" },
  { value: "active24h", label: "Actifs 24 h" },
  { value: "active7d", label: "Actifs 7 j" },
  { value: "neverSignedIn", label: "Jamais connectes" },
  { value: "stale", label: "A relancer" },
];

const ONBOARDING_OPTIONS: Array<{ value: OnboardingFilter; label: string }> = [
  { value: "all", label: "Tous les parcours" },
  { value: "complete", label: "Parcours d'inscription terminé" },
  { value: "incomplete", label: "Parcours d'inscription incomplet" },
  { value: "emailPending", label: "Email non confirme" },
];

const ROLE_UPDATE_OPTIONS = [
  { value: "owner", label: "Propriétaire" },
  { value: "owner_pro", label: "Propriétaire Pro" },
  { value: "concierge", label: "Conciergerie" },
  { value: "concierge_pro", label: "Conciergerie Pro" },
  { value: "provider", label: "Artisan" },
  { value: "provider_pro", label: "Artisan Pro" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super admin" },
];

function formatRole(role: string) {
  if (role === "owner") return "Propriétaire";
  if (role === "owner_pro") return "Propriétaire Pro";
  if (role === "concierge") return "Conciergerie";
  if (role === "concierge_pro") return "Conciergerie Pro";
  if (role === "provider" || role === "artisan") return "Artisan";
  if (role === "provider_pro" || role === "artisan_pro") return "Artisan Pro";
  if (role === "super_admin") return "Super admin";
  return "Admin";
}

function formatLastSignIn(user: Pick<AdminUserSummary, "lastSignInAt" | "isActive24h" | "isActive7d">) {
  if (!user.lastSignInAt) return "Jamais connecte";
  if (user.isActive24h) return "Actif sur 24 h";
  if (user.isActive7d) return "Actif sur 7 j";
  return formatAdminDate(user.lastSignInAt);
}

function getPrimaryMetric(user: AdminUserSummary) {
  if (user.roleBucket === "owner") {
    return {
      label: "Logements",
      value: String(user.propertyCount),
      helper: `${user.requestCount} demande(s) · ${user.ownerMissionCount} mission(s)`,
    };
  }

  if (user.roleBucket === "concierge") {
    return {
      label: "Demandes reçues",
      value: String(user.recipientCount),
      helper: `${user.conciergeMissionCount} mission(s) concierge`,
    };
  }

  if (user.roleBucket === "provider") {
    return {
      label: "Tarifs",
      value: String(user.pricingCount),
      helper: `${user.clientCount} client(s) relies`,
    };
  }

  return {
    label: "Pilotage",
    value: user.isActive24h ? "Actif" : "Veille",
    helper: user.emailConfirmedAt ? "Compte confirme" : "Confirmation requise",
  };
}

function getStatusLabel(user: Pick<AdminUserSummary, "status" | "emailConfirmedAt" | "onboardingComplete" | "isActive24h" | "isActive7d" | "lastSignInAt">) {
  if (user.status === "suspended") return "Suspendu";
  if (user.status === "deleted") return "Supprime";
  if (!user.emailConfirmedAt) return "A confirmer";
  if (!user.onboardingComplete) return "À compléter";
  if (user.isActive24h) return "Actif";
  if (user.isActive7d) return "Recent";
  if (!user.lastSignInAt) return "Jamais connecte";
  return "A relancer";
}

function getStatusTone(user: Pick<AdminUserSummary, "status" | "emailConfirmedAt" | "onboardingComplete" | "isActive24h" | "isActive7d" | "lastSignInAt">) {
  if (user.status === "suspended" || user.status === "deleted") return "danger" as const;
  if (!user.emailConfirmedAt || !user.onboardingComplete) return "warning" as const;
  if (user.isActive24h || user.isActive7d) return "positive" as const;
  if (!user.lastSignInAt) return "danger" as const;
  return "neutral" as const;
}

function isStale(user: AdminUserSummary) {
  return !user.lastSignInAt || (!user.isActive7d && user.status !== "suspended" && user.status !== "deleted");
}

function formatCurrency(amount: number | null | undefined) {
  if (typeof amount !== "number") return "-";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getScopeHref(bucket: RoleBucket) {
  if (bucket === "owner") return "/dashboard/admin/proprietaires";
  if (bucket === "concierge") return "/dashboard/admin/conciergeries";
  if (bucket === "provider") return "/dashboard/admin/artisans";
  return "/dashboard/admin/utilisateurs";
}

function matchesActivity(user: AdminUserSummary, filter: ActivityFilter) {
  if (filter === "all") return true;
  if (filter === "active24h") return user.isActive24h;
  if (filter === "active7d") return user.isActive7d;
  if (filter === "neverSignedIn") return !user.lastSignInAt;
  return isStale(user);
}

function matchesOnboarding(user: AdminUserSummary, filter: OnboardingFilter) {
  if (filter === "all") return true;
  if (filter === "complete") return user.onboardingComplete;
  if (filter === "incomplete") return !user.onboardingComplete;
  return !user.emailConfirmedAt;
}

function DetailList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div className={styles.detailBlock}>
      <h4>{title}</h4>
      <div className={styles.tagList}>
        {items.map((item) => (
          <span key={item} className={styles.tag}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function getOnboardingDiagnostics(detail: AdminUserDetailPayload) {
  const user = detail.user;
  const missingProfileFields = [
    user.email ? "" : "e-mail",
    user.phone ? "" : "telephone",
    user.city || user.location ? "" : "ville ou zone",
    user.roleBucket !== "owner" && !user.companyName ? "societe" : "",
  ].filter(Boolean);

  const businessReady =
    user.roleBucket === "owner"
      ? (detail.metrics.properties ?? 0) > 0 || (detail.metrics.ownerRequests ?? 0) > 0
      : user.roleBucket === "concierge"
        ? (detail.metrics.serviceSelections ?? 0) > 0 || (detail.metrics.pricingItems ?? 0) > 0
        : user.roleBucket === "provider"
          ? (detail.metrics.pricingItems ?? 0) > 0 || (detail.metrics.providerClients ?? 0) > 0
          : true;

  return [
    {
      id: "email",
      label: "E-mail confirme",
      ok: Boolean(user.emailConfirmedAt),
      detail: user.emailConfirmedAt
        ? `Confirme le ${formatAdminDate(user.emailConfirmedAt)}`
        : "L'utilisateur n'a pas encore confirme son adresse e-mail.",
      action: "Faire confirmer l'e-mail ou verifier l'adresse du compte.",
    },
    {
      id: "signin",
      label: "Premiere connexion",
      ok: Boolean(user.lastSignInAt),
      detail: user.lastSignInAt
        ? `Derniere connexion ${formatAdminDate(user.lastSignInAt)}`
        : "Aucune connexion n'est visible cote Supabase Auth.",
      action: "Tester l'acces ou renvoyer les identifiants de connexion.",
    },
    {
      id: "profile",
      label: "Profil exploitable",
      ok: missingProfileFields.length === 0,
      detail: missingProfileFields.length
        ? `Informations manquantes : ${missingProfileFields.join(", ")}.`
        : "Les coordonnees minimales du profil sont presentes.",
      action: "Completer les champs manquants dans la fiche utilisateur.",
    },
    {
      id: "business",
      label: "Base metier initialisee",
      ok: businessReady,
      detail: businessReady
        ? "Le compte a deja des donnees metier rattachees."
        : "Aucun logement, service, tarif ou client n'est encore rattache selon le role.",
      action: "Verifier le bon espace metier et ajouter les premieres donnees utiles.",
    },
    {
      id: "complete",
      label: "Parcours finalise",
      ok: user.onboardingComplete,
      detail: user.onboardingComplete
        ? user.onboardingCompletedAt
          ? `Termine le ${formatAdminDate(user.onboardingCompletedAt)}`
          : "Le parcours est marque termine, sans date de fin."
        : "Le parcours d'inscription du profil est encore marque incomplet.",
      action: "Reprendre le parcours d'inscription ou le marquer termine apres verification.",
    },
  ];
}

function OnboardingDiagnosticList({ detail }: { detail: AdminUserDetailPayload }) {
  const diagnostics = getOnboardingDiagnostics(detail);
  const problems = diagnostics.filter((item) => !item.ok);

  return (
    <div className={styles.diagnosticPanel}>
      <div className={styles.diagnosticHeader}>
        <div>
          <h4>Diagnostic inscription</h4>
          <p>
            {problems.length
              ? `${problems.length} point(s) expliquent le parcours d'inscription incomplet.`
              : "Aucun probleme d'inscription detecte sur cette fiche."}
          </p>
        </div>
        <AdminStatusBadge label={problems.length ? "A corriger" : "OK"} tone={problems.length ? "warning" : "positive"} />
      </div>
      <div className={styles.diagnosticGrid}>
        {diagnostics.map((item) => (
          <div key={item.id} className={`${styles.diagnosticItem} ${item.ok ? styles.diagnosticOk : styles.diagnosticProblem}`}>
            <strong>{item.label}</strong>
            <span>{item.detail}</span>
            {!item.ok ? <small>{item.action}</small> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminPeopleWorkspace({
  scope = "all",
}: {
  scope?: RoleBucket | "all";
}) {
  const [payload, setPayload] = useState<AdminOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [roleFilter, setRoleFilter] = useState(scope === "all" ? "all" : scope);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [onboardingFilter, setOnboardingFilter] = useState<OnboardingFilter>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUserDetailPayload | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const detailPanelRef = useRef<HTMLDivElement | null>(null);

  async function loadPayload(keepCurrentSelection = true) {
    const response = await fetch("/api/admin/overview", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Impossible de charger la vue admin.");
    }

    const nextPayload = (await response.json()) as AdminOverviewPayload;
    setPayload(nextPayload);

    if (!keepCurrentSelection && nextPayload.users.length) {
      setSelectedUserId((current) => current ?? nextPayload.users[0]?.id ?? null);
    }
  }

  async function loadDetail(userId: string) {
    setDetailLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, { cache: "no-store" });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Impossible de charger ce compte.");
      }

      setDetail((await response.json()) as AdminUserDetailPayload);
    } catch (error) {
      setDetail(null);
      setErrorMessage(error instanceof Error ? error.message : "Erreur admin");
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        await loadPayload(false);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Erreur admin");
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    void loadDetail(selectedUserId);
  }, [selectedUserId]);

  const scopedUsers = useMemo(() => {
    const users = payload?.users ?? [];
    return scope === "all" ? users : users.filter((user) => user.roleBucket === scope);
  }, [payload, scope]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = normalizeAdminText(search);

    return scopedUsers.filter((user) => {
      const statusLabel = getStatusLabel(user);
      const matchesStatus = statusFilter === "Tous" || statusLabel === statusFilter;
      const matchesRole = roleFilter === "all" || user.roleBucket === roleFilter;
      const haystack = normalizeAdminText(
        [
          user.displayName,
          user.email,
          user.companyName,
          user.city,
          formatRole(user.role),
          user.healthFlags.join(" "),
        ].join(" "),
      );

      return (
        matchesStatus &&
        matchesRole &&
        matchesActivity(user, activityFilter) &&
        matchesOnboarding(user, onboardingFilter) &&
        (!normalizedSearch || haystack.includes(normalizedSearch))
      );
    });
  }, [activityFilter, onboardingFilter, roleFilter, scopedUsers, search, statusFilter]);

  const statusOptions = useMemo(() => {
    const base = ["Tous"];
    const dynamic = Array.from(new Set(scopedUsers.map((user) => getStatusLabel(user))));
    return [...base, ...dynamic];
  }, [scopedUsers]);

  useEffect(() => {
    if (!filteredUsers.length) {
      setSelectedUserId(null);
      return;
    }

    if (!selectedUserId || !filteredUsers.some((user) => user.id === selectedUserId)) {
      setSelectedUserId(filteredUsers[0]?.id ?? null);
    }
  }, [filteredUsers, selectedUserId]);

  const kpis = useMemo<AdminKpi[]>(() => {
    const users = filteredUsers;
    const active24h = users.filter((user) => user.isActive24h).length;
    const onboarded = users.filter((user) => user.onboardingComplete).length;
    const toRelaunch = users.filter((user) => isStale(user) || !user.emailConfirmedAt).length;

    return [
      {
        id: "count",
        label: scope === "all" ? "Utilisateurs" : ROLE_LABELS[scope],
        value: users.length,
        helper: "Profils visibles avec les filtres actifs",
        tone: "neutral",
      },
      {
        id: "active24h",
        label: "Connexions 24 h",
        value: active24h,
        helper: "Dernière connexion connue via Supabase Auth",
        tone: active24h > 0 ? "positive" : "warning",
      },
      {
        id: "onboarded",
        label: "Parcours terminé",
        value: onboarded,
        helper: "Profils prets a etre exploites",
        tone: onboarded === users.length ? "positive" : "warning",
      },
      {
        id: "relaunch",
        label: "A relancer",
        value: toRelaunch,
        helper: "Comptes inactifs, non confirmés ou bloqués",
        tone: toRelaunch > 0 ? "danger" : "positive",
      },
    ];
  }, [filteredUsers, scope]);

  const visualSegments = useMemo(() => {
    const users = filteredUsers;
    return {
      health: [
        { label: "OK", value: users.filter((user) => getStatusTone(user) === "positive").length, color: "#1f9d55" },
        { label: "À suivre", value: users.filter((user) => getStatusTone(user) === "warning").length, color: "#f59e0b" },
        { label: "À relancer", value: users.filter((user) => getStatusTone(user) === "danger").length, color: "#ef4444" },
      ],
      activity: [
        { label: "Actifs 24 h", value: users.filter((user) => user.isActive24h).length, color: "#1f9d55" },
        { label: "Actifs 7 j", value: users.filter((user) => !user.isActive24h && user.isActive7d).length, color: "#0ea5e9" },
        { label: "Inactifs", value: users.filter((user) => !user.isActive7d).length, color: "#ef4444" },
      ],
      onboarding: [
        { label: "Terminés", value: users.filter((user) => user.onboardingComplete).length, color: "#1f9d55" },
        { label: "E-mail en attente", value: users.filter((user) => !user.emailConfirmedAt).length, color: "#f59e0b" },
        { label: "Incomplets", value: users.filter((user) => !user.onboardingComplete).length, color: "#ef4444" },
      ],
    };
  }, [filteredUsers]);

  const bubbleItems = useMemo(() => {
    const users = filteredUsers;
    return [
      {
        id: "count",
        label: "Profils suivis",
        value: users.length,
        tone: "neutral" as const,
        icon: scope === "owner" ? FiHome : scope === "provider" ? FiTool : scope === "concierge" ? FiUsers : FiUsers,
      },
      {
        id: "alerts",
        label: "Alertes actives",
        value: users.filter((user) => user.healthFlags.length > 0).length,
        tone: users.some((user) => user.healthFlags.length > 0) ? ("warning" as const) : ("positive" as const),
        icon: FiAlertTriangle,
        href: `${getScopeHref(scope === "all" ? "admin" : scope)}?status=A%20compl%C3%A9ter`,
      },
      {
        id: "never",
        label: "Jamais connectés",
        value: users.filter((user) => !user.lastSignInAt).length,
        tone: users.some((user) => !user.lastSignInAt) ? ("danger" as const) : ("positive" as const),
        icon: FiClock,
        href: "/dashboard/admin/controle?tab=inscriptions&severity=danger",
      },
      {
        id: "ok",
        label: "Comptes prêts",
        value: users.filter((user) => user.onboardingComplete && user.emailConfirmedAt).length,
        tone: "positive" as const,
        icon: FiCheckCircle,
        href: "/dashboard/admin/controle?tab=inscriptions&severity=positive",
      },
    ];
  }, [filteredUsers, scope]);

  async function runAction(action: "suspend" | "reactivate" | "toggleOnboarding" | "changeRole", role?: string) {
    if (!selectedUserId) return;

    const body =
      action === "suspend"
        ? { status: "suspended" }
        : action === "reactivate"
          ? { status: "active" }
          : action === "toggleOnboarding"
            ? { onboardingComplete: !detail?.user.onboardingComplete }
            : { role };

    setActionLoading(action);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${selectedUserId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Action admin impossible");
      }

      await Promise.all([loadPayload(true), loadDetail(selectedUserId)]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erreur admin");
    } finally {
      setActionLoading(null);
    }
  }

  function openUserDiagnostic(userId: string) {
    setSelectedUserId(userId);
    window.setTimeout(() => {
      detailPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  const title =
    scope === "all" ? "Centre utilisateurs" : `Contrôle ${ROLE_LABELS[scope].toLowerCase()}`;
  const subtitle =
    scope === "all"
      ? "Suivre les connexions, le parcours d'inscription, les coordonnées et la préparation métier par profil."
      : `Contrôler les comptes ${ROLE_LABELS[scope].toLowerCase()}, leur activité et leur niveau de préparation.`;

  if (loading) {
    return <div className="center">Chargement du pilotage utilisateurs...</div>;
  }

  return (
    <DashboardLayout
      persona="admin"
      title={title}
      subtitle={subtitle}
      navTitle="Pilotage admin"
      navItems={[
        { label: "Vue d'ensemble", href: "/dashboard/admin" },
        { label: "Utilisateurs", href: "/dashboard/admin/utilisateurs" },
        { label: "Propriétaires", href: "/dashboard/admin/proprietaires" },
        { label: "Conciergeries", href: "/dashboard/admin/conciergeries" },
        { label: "Artisans", href: "/dashboard/admin/artisans" },
        { label: "Demandes", href: "/dashboard/admin/demandes" },
        { label: "Missions", href: "/dashboard/admin/missions" },
      ]}
      stats={[
        { label: "Utilisateurs", value: String(payload?.summary.totalUsers ?? 0), hint: "Base globale" },
        { label: "Actifs 24 h", value: String(payload?.summary.active24h ?? 0), hint: "Connexions récentes" },
        { label: "Actifs 7 j", value: String(payload?.summary.active7d ?? 0), hint: "Activite hebdo" },
        {
          label: "Inscription",
          value: String(payload?.summary.onboardingComplete ?? 0),
          hint: `${payload?.summary.onboardingEvents ?? 0} evenement(s)`,
        },
      ]}
      actions={[
        { label: "Voir toute la base", href: "/dashboard/admin/utilisateurs" },
        { label: "Contrôler les propriétaires", href: "/dashboard/admin/proprietaires" },
        { label: "Contrôler les conciergeries", href: "/dashboard/admin/conciergeries" },
        { label: "Contrôler les artisans", href: "/dashboard/admin/artisans" },
      ]}
      activity={[
        {
          id: "recent-signins",
          title: "Connexions récentes",
          description: `${payload?.spotlights.recentlySignedIn.length ?? 0} profils visibles côté auth`,
          href: "/dashboard/admin/utilisateurs",
        },
        {
          id: "onboarding-alerts",
          title: "Comptes à débloquer",
          description: `${payload?.spotlights.onboardingAlerts.length ?? 0} profils demandent une action`,
          href: "/dashboard/admin/utilisateurs",
        },
      ]}
      notifications={(payload?.spotlights.onboardingAlerts ?? []).slice(0, 3).map((user) => ({
        id: user.id,
        title: `${user.displayName} · ${user.healthFlags[0] ?? "Verification requise"}`,
        level: !user.lastSignInAt ? "danger" : "warning",
        href: getScopeHref(user.roleBucket),
      }))}
      shortcuts={[
        { label: "Vue admin", href: "/dashboard/admin" },
        { label: "Utilisateurs", href: "/dashboard/admin/utilisateurs" },
        { label: "Propriétaires", href: "/dashboard/admin/proprietaires" },
        { label: "Conciergeries", href: "/dashboard/admin/conciergeries" },
        { label: "Artisans", href: "/dashboard/admin/artisans" },
      ]}
      profile={{
        name: "PlanetLS",
        subtitle: "Contrôle comptes et activité",
        badge: "Administration",
      }}
    >
      <DashboardPanel title="Vue rapide">
        <AdminKpiGrid kpis={kpis} />
      </DashboardPanel>

      <DashboardPanel title="Vue visuelle">
        <div className={styles.visualSection}>
          <div className={styles.visualDonuts}>
            <AdminDonutCard
              title="État des comptes"
              subtitle="Les badges passent du tableau à une vue camembert."
              icon={FiUsers}
              totalLabel="profils"
              segments={visualSegments.health}
            />
            <AdminDonutCard
              title="Activité"
              subtitle="Qui s'est connecté récemment et qui doit être relancé."
              icon={FiClock}
              totalLabel="activité"
              segments={visualSegments.activity}
            />
            <AdminDonutCard
              title="Inscription"
              subtitle="Parcours terminés, incomplets et e-mails en attente."
              icon={FiCheckCircle}
              totalLabel="parcours"
              segments={visualSegments.onboarding}
            />
          </div>

          <AdminBubblePanel
            title="Bulles d'alerte"
            subtitle="Des signaux rapides pour les problèmes récurrents dans cette section."
            items={bubbleItems}
          />
          <div className={styles.visualDonuts}>
            <AdminGaugeCard
              title="Fiabilité des comptes"
              subtitle="Part des profils exploitables sans blocage immédiat."
              icon={FiShield}
              value={filteredUsers.filter((user) => getStatusTone(user) === "positive").length}
              total={Math.max(filteredUsers.length, 1)}
              tone={
                filteredUsers.filter((user) => getStatusTone(user) === "positive").length === filteredUsers.length &&
                filteredUsers.length > 0
                  ? "positive"
                  : filteredUsers.some((user) => getStatusTone(user) === "danger")
                    ? "danger"
                    : "warning"
              }
            />
            <AdminGaugeCard
              title="Fiabilité activité"
              subtitle="Profils vus sur les 7 derniers jours."
              icon={FiClock}
              value={filteredUsers.filter((user) => user.isActive7d).length}
              total={Math.max(filteredUsers.length, 1)}
              tone={
                filteredUsers.filter((user) => user.isActive7d).length >= Math.ceil(filteredUsers.length * 0.7)
                  ? "positive"
                  : filteredUsers.filter((user) => user.isActive7d).length >= Math.ceil(filteredUsers.length * 0.4)
                    ? "warning"
                    : "danger"
              }
            />
            <AdminGaugeCard
              title="Fiabilité inscription"
              subtitle="Comptes confirmés et parcours terminés."
              icon={FiCheckCircle}
              value={
                filteredUsers.filter((user) => user.onboardingComplete && Boolean(user.emailConfirmedAt)).length
              }
              total={Math.max(filteredUsers.length, 1)}
              tone={
                filteredUsers.filter((user) => user.onboardingComplete && Boolean(user.emailConfirmedAt)).length >=
                Math.ceil(filteredUsers.length * 0.75)
                  ? "positive"
                  : filteredUsers.filter((user) => user.onboardingComplete && Boolean(user.emailConfirmedAt)).length >=
                      Math.ceil(filteredUsers.length * 0.45)
                    ? "warning"
                    : "danger"
              }
            />
          </div>
          <AdminToneLegend />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Filtres avances">
        <div className={styles.filterBar}>
          <label className={styles.field}>
            <span>Recherche</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom, email, societe, ville..."
            />
          </label>
          <label className={styles.field}>
            <span>Etat</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Role</span>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Activite</span>
            <select
              value={activityFilter}
              onChange={(event) => setActivityFilter(event.target.value as ActivityFilter)}
            >
              {ACTIVITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Inscription</span>
            <select
              value={onboardingFilter}
              onChange={(event) => setOnboardingFilter(event.target.value as OnboardingFilter)}
            >
              {ONBOARDING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.filterHint}>
            <strong>Connexions</strong>
            <span>Le compteur repose sur la dernière connexion connue via Supabase Auth.</span>
          </div>
        </div>
      </DashboardPanel>

      <DashboardPanel title="Repartition metier">
        <div className={styles.roleGrid}>
          {(["owner", "concierge", "provider", "admin"] as RoleBucket[]).map((bucket) => {
            const users = payload?.users.filter((user) => user.roleBucket === bucket) ?? [];
            const active = users.filter((user) => user.isActive7d).length;
            const onboarded = users.filter((user) => user.onboardingComplete).length;

            return (
              <Link key={bucket} href={getScopeHref(bucket)} className={styles.roleCard}>
                <div className={styles.roleCardHeader}>
                  <h3>{ROLE_LABELS[bucket]}</h3>
                  <span>{users.length}</span>
                </div>
                <p>{active} actif(s) sur 7 jours · {onboarded} parcours terminé(s)</p>
              </Link>
            );
          })}
        </div>
      </DashboardPanel>

      <div ref={detailPanelRef}>
      <DashboardPanel title="Fiche de contrôle">
        {errorMessage ? <p className={styles.errorBox}>{errorMessage}</p> : null}

        {selectedUserId && detailLoading ? <p>Chargement de la fiche utilisateur...</p> : null}

        {detail ? (
          <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <div>
                <span className={styles.userEyebrow}>{formatRole(detail.user.role)}</span>
                <h3>{detail.user.displayName}</h3>
                <p>
                  {detail.user.email || "Email manquant"}
                  {detail.user.companyName ? ` · ${detail.user.companyName}` : ""}
                  {detail.user.city ? ` · ${detail.user.city}` : ""}
                </p>
              </div>
              <AdminStatusBadge
                label={getStatusLabel({
                  ...detail.user,
                  isActive24h: false,
                  isActive7d: false,
                })}
                tone={
                  detail.user.status === "suspended" || detail.user.status === "deleted"
                    ? "danger"
                    : detail.user.onboardingComplete && detail.user.emailConfirmedAt
                      ? "positive"
                      : "warning"
                }
              />
            </div>

            <div className={styles.metricGrid}>
              <div className={styles.metricItem}>
                <span>Statut compte</span>
                <strong>{detail.user.status || "active"}</strong>
                      <small>{detail.user.emailConfirmedAt ? "E-mail confirmé" : "E-mail non confirmé"}</small>
              </div>
              <div className={styles.metricItem}>
                <span>Dernière connexion</span>
                <strong>{detail.user.lastSignInAt ? formatAdminDate(detail.user.lastSignInAt) : "Jamais"}</strong>
                <small>{detail.user.authCreatedAt ? `Création auth ${formatAdminDate(detail.user.authCreatedAt)}` : "Auth inconnue"}</small>
              </div>
              <div className={styles.metricItem}>
                <span>Inscription</span>
                <strong>{detail.user.onboardingComplete ? "Terminé" : "À terminer"}</strong>
                <small>{detail.user.onboardingCompletedAt ? formatAdminDate(detail.user.onboardingCompletedAt) : "Pas de date de fin"}</small>
              </div>
            </div>

            <div className={styles.detailGrid}>
              <div className={styles.detailBlock}>
                <h4>Coordonnées</h4>
                <p>E-mail : {detail.user.email || "Non renseigné"}</p>
                <p>Téléphone : {detail.user.phone || "Non renseigné"}</p>
                <p>Ville : {detail.user.city || "Non renseignée"}</p>
                <p>Localisation : {detail.user.location || "Non renseignée"}</p>
                <p>Username : {detail.user.username || "Non renseigné"}</p>
              </div>

              <div className={styles.detailBlock}>
                <h4>Infos entreprise</h4>
                <p>Société : {detail.user.companyName || "Non renseignée"}</p>
                <p>Forme légale : {detail.user.legalForm || "Non renseignée"}</p>
                <p>Site web : {detail.user.website || "Non renseigné"}</p>
                <p>Zone de service : {detail.user.serviceArea || "Non renseignée"}</p>
                <p>Rayon : {detail.user.serviceRadiusKm ? `${detail.user.serviceRadiusKm} km` : "Non renseigné"}</p>
              </div>

              <div className={styles.detailBlock}>
                <h4>Indicateurs métier</h4>
                <p>Logements: {detail.metrics.properties ?? 0}</p>
                <p>Demandes propriétaire : {detail.metrics.ownerRequests ?? 0}</p>
                <p>Demandes concierge: {detail.metrics.conciergeRequests ?? 0}</p>
                <p>Missions propriétaire : {detail.metrics.ownerMissions ?? 0}</p>
                <p>Missions concierge: {detail.metrics.conciergeMissions ?? 0}</p>
              </div>

              <div className={styles.detailBlock}>
                <h4>Commerce</h4>
                <p>Tarifs: {detail.metrics.pricingItems ?? 0}</p>
                <p>Services sélectionnés : {detail.metrics.serviceSelections ?? 0}</p>
                <p>Clients artisan: {detail.metrics.providerClients ?? 0}</p>
                <p>Devis: {(detail.metrics.ownerQuotes ?? 0) + (detail.metrics.conciergeQuotes ?? 0)}</p>
                <p>Factures: {(detail.metrics.ownerInvoices ?? 0) + (detail.metrics.conciergeInvoices ?? 0)}</p>
              </div>
            </div>

            <div className={styles.adminActions}>
              <button
                type="button"
                onClick={() => void runAction("suspend")}
                disabled={actionLoading !== null || detail.user.status === "suspended"}
              >
                {actionLoading === "suspend" ? "Suspension..." : "Suspendre le compte"}
              </button>
              <button
                type="button"
                onClick={() => void runAction("reactivate")}
                disabled={actionLoading !== null || detail.user.status === "active"}
              >
                {actionLoading === "reactivate" ? "Réactivation..." : "Réactiver le compte"}
              </button>
              <button
                type="button"
                onClick={() => void runAction("toggleOnboarding")}
                disabled={actionLoading !== null}
              >
                {actionLoading === "toggleOnboarding"
                  ? "Mise à jour..."
                  : detail.user.onboardingComplete
                    ? "Réouvrir le parcours"
                    : "Marquer le parcours terminé"}
              </button>
              <label className={styles.roleAction}>
                <span>Changer le rôle</span>
                <select
                  defaultValue={detail.user.role}
                  disabled={actionLoading !== null}
                  onChange={(event) => void runAction("changeRole", event.target.value)}
                >
                  {ROLE_UPDATE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <DetailList
              title="Alertes compte"
              items={[
                !detail.user.emailConfirmedAt ? "E-mail non confirmé" : "",
                !detail.user.onboardingComplete ? "Parcours d'inscription incomplet" : "",
                detail.user.status === "suspended" ? "Compte suspendu" : "",
                detail.user.status === "deleted" ? "Compte supprimé" : "",
              ].filter(Boolean)}
            />

            <OnboardingDiagnosticList detail={detail} />

            <div className={styles.detailGrid}>
              <DetailList
                title="Logements"
                items={detail.collections.properties.slice(0, 6).map((item) => {
                  const parts = [item.name || "Sans nom", item.city, item.status].filter(Boolean);
                  return parts.join(" · ");
                })}
              />
              <DetailList
                title="Demandes propriétaire"
                items={detail.collections.ownerRequests.slice(0, 6).map((item) => {
                  const parts = [item.title || "Demande", item.status, item.workflow_status, item.city].filter(Boolean);
                  return parts.join(" · ");
                })}
              />
              <DetailList
                title="Demandes concierge"
                items={detail.collections.conciergeRequests.slice(0, 6).map((item) => {
                  const parts = [item.title || "Demande", item.status, item.workflow_status, item.city].filter(Boolean);
                  return parts.join(" · ");
                })}
              />
              <DetailList
                title="Missions"
                items={[...detail.collections.ownerMissions, ...detail.collections.conciergeMissions]
                  .slice(0, 6)
                  .map((item) => [item.title, item.status, item.priority].filter(Boolean).join(" · "))}
              />
              <DetailList
                title="Tarification"
                items={detail.collections.pricing.slice(0, 6).map((item) => {
                  const price = `${formatCurrency(item.amount)}${item.unit ? ` / ${item.unit}` : ""}`;
                  return [item.label, price].filter(Boolean).join(" · ");
                })}
              />
              <DetailList
                title="Clients artisan"
                items={detail.collections.providerClients.slice(0, 6).map((item) => {
                  const title = item.client_name || item.company_name || "Client";
                  return [title, item.city, item.status].filter(Boolean).join(" · ");
                })}
              />
            </div>
          </div>
        ) : (
          <AdminEmptyState
            title="Sélectionnez un compte"
            description="Choisissez un utilisateur dans la liste pour afficher sa fiche détaillée et piloter son accès."
          />
        )}
      </DashboardPanel>

      </div>

      <DashboardPanel title="Base contrôlée">
        {filteredUsers.length ? (
          <div className={styles.userList}>
            {filteredUsers.map((user) => {
              const metric = getPrimaryMetric(user);
              const selected = selectedUserId === user.id;

              return (
                <article
                  key={user.id}
                  className={`${styles.userCard} ${selected ? styles.userCardSelected : ""}`}
                >
                  <div className={styles.userHeader}>
                    <div>
                      <span className={styles.userEyebrow}>{formatRole(user.role)}</span>
                      <h3>{user.displayName}</h3>
                      <p>
                        {user.email || "Email manquant"}
                        {user.companyName ? ` · ${user.companyName}` : ""}
                        {user.city ? ` · ${user.city}` : ""}
                      </p>
                    </div>
                    <AdminStatusBadge label={getStatusLabel(user)} tone={getStatusTone(user)} />
                  </div>

                  <div className={styles.metricGrid}>
                    <div className={styles.metricItem}>
                      <span>{metric.label}</span>
                      <strong>{metric.value}</strong>
                      <small>{metric.helper}</small>
                    </div>
                    <div className={styles.metricItem}>
                      <span>Dernière connexion</span>
                      <strong>{formatLastSignIn(user)}</strong>
                      <small>{user.emailConfirmedAt ? "E-mail confirmé" : "E-mail à confirmer"}</small>
                    </div>
                    <div className={styles.metricItem}>
                      <span>Création</span>
                      <strong>{formatAdminDate(user.createdAt)}</strong>
                      <small>{user.phone || "Téléphone non renseigné"}</small>
                    </div>
                  </div>

                  {user.healthFlags.length ? (
                    <div className={styles.flagRow}>
                      {user.healthFlags.map((flag) => (
                        <button
                          key={flag}
                          type="button"
                          className={styles.flag}
                          onClick={() => openUserDiagnostic(user.id)}
                          title="Voir le diagnostic de ce probleme"
                        >
                          {flag}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <div className={styles.cardActions}>
                    <button type="button" onClick={() => openUserDiagnostic(user.id)}>
                      Voir la fiche
                    </button>
                    <Link href={getScopeHref(user.roleBucket)}>Voir dans l'espace admin</Link>
                    <Link href={DASHBOARD_LABELS[user.roleBucket]}>Ouvrir l'espace métier</Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <AdminEmptyState
            title="Aucun profil ne correspond aux filtres"
            description="Ajustez la recherche, le rôle ou l'activité pour retrouver un compte à contrôler."
          />
        )}
      </DashboardPanel>
    </DashboardLayout>
  );
}
