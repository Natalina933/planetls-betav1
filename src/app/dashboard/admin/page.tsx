"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  BellRing,
  Clock3,
  Compass,
  LifeBuoy,
  ShieldAlert,
  Sparkles,
  UserRoundPlus,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard";
import {
  getElapsedLabel,
  getMissionNextAction,
  getMissionStatus,
  getMissionUrgency,
  getRequestAssignee,
  getRequestNextAction,
  getRequestStatus,
  getRequestUrgency,
  normalizeAdminText,
  type AdminMissionRow,
  type AdminRequestRow,
} from "./AdminOperations";
import type { KpiOverviewPayload } from "@/app/api/kpis/overview/shared";
import styles from "./AdminDashboard.module.scss";

type TimeWindow = 7 | 30 | 90;
type ActivationRole = "owner" | "concierge" | "provider";

type AdminUserSummary = {
  id: string;
  email: string | null;
  displayName: string;
  role: string;
  roleBucket: "admin" | "owner" | "concierge" | "provider";
  city: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  onboardingComplete: boolean;
  onboardingCompletedAt: string | null;
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
  health?: {
    available: boolean;
    availableSources: number;
    totalSources: number;
    reasons: string[];
    updatedAt: string;
  };
  summary: {
    totalUsers: number;
    active24h: number;
    active7d: number;
    onboardingComplete: number;
    emailConfirmed: number;
    owners: number;
    concierges: number;
    providers: number;
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
    onboardingAlerts: Array<{
      id: string;
      displayName: string;
      roleBucket: AdminUserSummary["roleBucket"];
      healthFlags: string[];
      lastSignInAt: string | null;
    }>;
  };
  users: AdminUserSummary[];
};

type AdminControlPayload = {
  health?: {
    tone?: "positive" | "warning" | "danger";
    updatedAt?: string | null;
    unavailableSources?: number;
  } | null;
  summary: {
    onboarding: { total: number; healthy: number; warning: number; danger: number };
    missions: { total: number; healthy: number; warning: number; danger: number };
    messages: { total: number; healthy: number; warning: number; danger: number };
    totalProblems: number;
  };
};

type AdminOperationsPayload = {
  health?: {
    available: boolean;
    availableSources: number;
    totalSources: number;
    reasons: string[];
    updatedAt: string;
  };
  requests: AdminRequestRow[];
  missions: AdminMissionRow[];
  invoiceCount: number;
};

type MetricTone = "neutral" | "positive" | "warning" | "danger";

type PriorityItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: MetricTone;
};

type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  timestamp: string | null;
  kind: "user" | "request" | "mission";
};

type ControlSummaryBlock = {
  total: number;
  healthy: number;
  warning: number;
  danger: number;
};

type HeroStoryCard = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: MetricTone;
};

const PERIOD_OPTIONS: Array<{ value: TimeWindow; label: string }> = [
  { value: 7, label: "7 jours" },
  { value: 30, label: "30 jours" },
  { value: 90, label: "90 jours" },
];

const ROLE_OPTIONS: Array<{ value: ActivationRole; label: string }> = [
  { value: "owner", label: "Propriétaires" },
  { value: "concierge", label: "Conciergeries" },
  { value: "provider", label: "Artisans" },
];

function getDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function countWithinDays(values: Array<string | null | undefined>, days: number) {
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  return values.reduce((count, value) => {
    const date = getDate(value);
    return date && date.getTime() >= threshold ? count + 1 : count;
  }, 0);
}

function formatDateTime(value: string | null | undefined) {
  const date = getDate(value);
  if (!date) return "Date indisponible";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(value: string | null | undefined) {
  const date = getDate(value);
  if (!date) return "Date indisponible";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function resolveRoleLabel(roleBucket: AdminUserSummary["roleBucket"]) {
  if (roleBucket === "owner") return "Propriétaire";
  if (roleBucket === "concierge") return "Conciergerie";
  if (roleBucket === "provider") return "Artisan";
  return "Admin";
}

function resolveAdminSegment(roleBucket: AdminUserSummary["roleBucket"]) {
  if (roleBucket === "owner") return "/dashboard/admin/proprietaires";
  if (roleBucket === "concierge") return "/dashboard/admin/conciergeries";
  if (roleBucket === "provider") return "/dashboard/admin/artisans";
  return "/dashboard/admin/utilisateurs";
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0 %";
  return `${Math.round(value)} %`;
}

function formatNullablePercent(value: number | null, fallback = "Donnée insuffisante") {
  return typeof value === "number" ? `${value}%` : fallback;
}

function buildLinePath(points: number[], width: number, height: number) {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const y = height - (Math.max(points[0], 0) / 100) * (height - 16) - 8;
    return `M 8 ${y.toFixed(2)} L ${(width - 8).toFixed(2)} ${y.toFixed(2)}`;
  }

  const stepX = (width - 16) / (points.length - 1);

  return points
    .map((point, index) => {
      const x = 8 + index * stepX;
      const y = height - (Math.max(point, 0) / 100) * (height - 16) - 8;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function StatusChip({ tone, children }: { tone: MetricTone; children: string }) {
  return (
    <span className={styles.statusChip} data-tone={tone}>
      {children}
    </span>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: MetricTone;
}) {
  return (
    <article className={styles.metricCard} data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{helper}</p>
    </article>
  );
}

function resolveBlockTone(block: ControlSummaryBlock): MetricTone {
  if (block.danger > 0) return "danger";
  if (block.warning > 0) return "warning";
  if (block.healthy > 0) return "positive";
  return "neutral";
}

function DonutCard({
  title,
  subtitle,
  totalLabel,
  segments,
}: {
  title: string;
  subtitle: string;
  totalLabel: string;
  segments: Array<{ label: string; value: number; color: string; helper?: string }>;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const background =
    total === 0
      ? "conic-gradient(rgba(18, 92, 91, 0.12) 0deg 360deg)"
      : (() => {
          let cursor = 0;
          const stops = segments.map((segment) => {
            const angle = (segment.value / total) * 360;
            const start = cursor;
            cursor += angle;
            return `${segment.color} ${start}deg ${cursor}deg`;
          });
          return `conic-gradient(${stops.join(", ")})`;
        })();

  return (
    <div className={styles.donutCard}>
      <div className={styles.donutHeader}>
        <span>{title}</span>
        <small>{subtitle}</small>
      </div>
      <div className={styles.donutRow}>
        <div className={styles.donutChart} style={{ "--donut-background": background } as CSSProperties}>
          <div className={styles.donutCenter}>
            <strong>{total}</strong>
            <small>{totalLabel}</small>
          </div>
        </div>
        <div className={styles.donutLegend} role="list" aria-label={title}>
          {segments.map((segment) => (
            <div key={segment.label} className={styles.donutLegendItem} role="listitem">
              <span className={styles.donutDot} style={{ background: segment.color }} aria-hidden="true" />
              <div>
                <div className={styles.donutLegendTop}>
                  <strong>{segment.label}</strong>
                  <small>{total > 0 ? `${Math.round((segment.value / total) * 100)}%` : "0%"}</small>
                </div>
                <div className={styles.donutLegendBar} aria-hidden="true">
                  <span
                    className={styles.donutLegendFill}
                    style={{
                      width: `${total > 0 ? Math.max(segment.value > 0 ? 8 : 0, (segment.value / total) * 100) : 0}%`,
                      background: segment.color,
                    }}
                  />
                </div>
                <small>
                  {segment.value}
                  {segment.helper ? ` · ${segment.helper}` : ""}
                </small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HealthSectionCard({
  title,
  href,
  description,
  block,
}: {
  title: string;
  href: string;
  description: string;
  block: ControlSummaryBlock;
}) {
  const total = Math.max(block.total, block.healthy + block.warning + block.danger, 1);
  const tone = resolveBlockTone(block);
  const segments = [
    { label: "Sains", value: block.healthy, color: "#1f9d55" },
    { label: "À suivre", value: block.warning, color: "#f59e0b" },
    { label: "Critiques", value: block.danger, color: "#ef4444" },
  ];

  return (
    <Link href={href} className={styles.healthSectionCard} data-tone={tone}>
      <div className={styles.healthSectionHeader}>
        <div>
          <strong>{title}</strong>
          <p>{description}</p>
        </div>
        <ArrowRight size={16} />
      </div>

      <div className={styles.healthSectionStack} aria-hidden="true">
        {segments.map((segment) => (
          <span
            key={segment.label}
            className={styles.healthSectionSegment}
            style={{
              width: `${Math.max(segment.value > 0 ? 8 : 0, (segment.value / total) * 100)}%`,
              background: segment.color,
            }}
          />
        ))}
      </div>

      <div className={styles.healthSectionLegend} role="list" aria-label={title}>
        {segments.map((segment) => (
          <div key={segment.label} role="listitem">
            <span className={styles.healthSectionDot} style={{ background: segment.color }} aria-hidden="true" />
            <small>
              {segment.label} · {segment.value}
            </small>
          </div>
        ))}
      </div>
    </Link>
  );
}

function TrendChart({
  label,
  points,
}: {
  label: string;
  points: Array<{ shortLabel: string; rate: number | null; eligible: number }>;
}) {
  if (points.length === 0) {
    return <p className={styles.chartEmpty}>Aucune cohorte mature disponible pour ce segment.</p>;
  }

  const normalizedRates = points.map((point) => point.rate ?? 0);
  const width = 420;
  const height = 180;
  const path = buildLinePath(normalizedRates, width, height);

  return (
    <div className={styles.trendCard}>
      <div className={styles.chartMeta}>
        <span>{label}</span>
        <strong>{formatNullablePercent(points[points.length - 1]?.rate ?? null)}</strong>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Tendance d'activation ${label}`}>
        <defs>
          <linearGradient id="activationTrendLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#125c5b" />
            <stop offset="100%" stopColor="#d4a74a" />
          </linearGradient>
        </defs>

        {[25, 50, 75, 100].map((marker) => {
          const y = height - (marker / 100) * (height - 16) - 8;
          return <line key={marker} x1="8" x2={width - 8} y1={y} y2={y} className={styles.chartGridLine} />;
        })}

        <path d={path} className={styles.chartPath} stroke="url(#activationTrendLine)" />

        {points.map((point, index) => {
          const x = points.length === 1 ? width / 2 : 8 + ((width - 16) / (points.length - 1)) * index;
          const y = height - ((point.rate ?? 0) / 100) * (height - 16) - 8;
          return (
            <circle
              key={`${point.shortLabel}-${index}`}
              cx={x}
              cy={y}
              r="4.5"
              className={point.rate === null ? styles.chartPointMuted : styles.chartPoint}
            />
          );
        })}
      </svg>
      <div className={styles.chartLegend}>
        {points.map((point) => (
          <div key={`${point.shortLabel}-${point.eligible}`}>
            <strong>{point.shortLabel}</strong>
            <span>{formatNullablePercent(point.rate)} · {point.eligible} éligibles</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ZoneBarChart({
  points,
}: {
  points: Array<{ zone: string; eligible: number; activated: number; rate: number | null }>;
}) {
  if (points.length === 0) {
    return <p className={styles.chartEmpty}>Aucune zone exploitable n'est remontée pour le moment.</p>;
  }

  return (
    <div className={styles.zoneList} role="list" aria-label="Classement des zones">
      {points.map((point) => (
        <div key={`${point.zone}-${point.eligible}`} className={styles.zoneRow} role="listitem">
          <div className={styles.zoneHeader}>
            <strong>{point.zone}</strong>
            <span>{formatNullablePercent(point.rate, "Non disponible")}</span>
          </div>
          <div className={styles.zoneTrack} aria-hidden="true">
            <div
              className={styles.zoneFill}
              style={{ width: `${Math.max(6, Math.min(point.rate ?? 0, 100))}%` }}
            />
          </div>
          <small>{point.activated} activés sur {point.eligible} éligibles</small>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState<TimeWindow>(30);
  const [roleFilter, setRoleFilter] = useState<ActivationRole>("owner");
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [requests, setRequests] = useState<AdminRequestRow[]>([]);
  const [missions, setMissions] = useState<AdminMissionRow[]>([]);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [adminOverview, setAdminOverview] = useState<AdminOverviewPayload | null>(null);
  const [adminControl, setAdminControl] = useState<AdminControlPayload | null>(null);
  const [kpiOverview, setKpiOverview] = useState<KpiOverviewPayload | null>(null);
  const [sourceWarnings, setSourceWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchAdminData() {
      setLoading(true);
      setError(null);
      setSourceWarnings([]);

      try {
        const [operationsRes, overviewRes, controlRes, kpiRes] = await Promise.allSettled([
          fetch("/api/admin/operations?limit=200", { cache: "no-store" }),
          fetch("/api/admin/overview", { cache: "no-store" }),
          fetch("/api/admin/control-tower", { cache: "no-store" }),
          fetch(`/api/kpis/overview?window_days=${period}`, { cache: "no-store" }),
        ]);

        const warnings: string[] = [];
        let operationsData: AdminOperationsPayload | null = null;
        let overviewData: AdminOverviewPayload | null = null;
        let controlData: AdminControlPayload | null = null;
        let kpiData: KpiOverviewPayload | null = null;

        if (operationsRes.status === "fulfilled" && operationsRes.value.ok) {
          operationsData = (await operationsRes.value.json().catch(() => null)) as AdminOperationsPayload | null;
        } else {
          warnings.push("Demandes, missions et factures indisponibles.");
        }

        if (overviewRes.status === "fulfilled" && overviewRes.value.ok) {
          overviewData = (await overviewRes.value.json().catch(() => null)) as AdminOverviewPayload | null;
        } else {
          warnings.push("Vue utilisateurs et onboarding indisponible.");
        }

        if (controlRes.status === "fulfilled" && controlRes.value.ok) {
          controlData = (await controlRes.value.json().catch(() => null)) as AdminControlPayload | null;
        } else {
          warnings.push("Tour de contrôle indisponible.");
        }

        if (kpiRes.status === "fulfilled" && kpiRes.value.ok) {
          kpiData = (await kpiRes.value.json().catch(() => null)) as KpiOverviewPayload | null;
          if (kpiData?.health?.available === false) {
            warnings.push(...kpiData.health.reasons);
          }
        } else {
          warnings.push("Indicateurs d'activation indisponibles.");
        }

        if (!active) return;

        setRequests(operationsData?.requests ?? []);
        setMissions(operationsData?.missions ?? []);
        setInvoiceCount(operationsData?.invoiceCount ?? 0);
        setAdminOverview(overviewData);
        setAdminControl(controlData);
        setKpiOverview(kpiData);
        setSourceWarnings(
          Array.from(
            new Set([
              ...warnings,
              ...(operationsData?.health?.reasons ?? []),
              ...(overviewData?.health?.reasons ?? []),
            ]),
          ),
        );
      } catch (fetchError) {
        if (!active) return;
        console.error("Erreur chargement cockpit admin :", fetchError);
        setError("Le cockpit admin a rencontré une erreur inattendue.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchAdminData();

    return () => {
      active = false;
    };
  }, [period, refreshNonce]);

  const recentUsers = useMemo(
    () => countWithinDays(adminOverview?.users.map((user) => user.createdAt) ?? [], period),
    [adminOverview, period],
  );

  const recentRequests = useMemo(
    () => countWithinDays(requests.map((request) => request.created_at), period),
    [requests, period],
  );

  const recentCompletedOnboarding = useMemo(
    () => countWithinDays(adminOverview?.users.map((user) => user.onboardingCompletedAt) ?? [], period),
    [adminOverview, period],
  );

  const blockedRequests = useMemo(
    () =>
      requests.filter((request) => {
        const status = getRequestStatus(request);
        return status === "Bloquée" || getRequestUrgency(request) === "danger";
      }),
    [requests],
  );

  const acceptedQuotesWithoutMission = useMemo(
    () =>
      requests.filter((request) => {
        const quoteAccepted = getRequestStatus(request) === "Devis accepté";
        return quoteAccepted && !normalizeAdminText(request.mission_workflow_status);
      }),
    [requests],
  );

  const lateMissions = useMemo(
    () => missions.filter((mission) => getMissionUrgency(mission) === "danger"),
    [missions],
  );

  const missionWarnings = useMemo(
    () =>
      missions.filter((mission) => {
        const urgency = getMissionUrgency(mission);
        return urgency === "warning" || urgency === "danger";
      }),
    [missions],
  );

  const onboardingCompletionRate = useMemo(() => {
    const totalUsers = adminOverview?.summary.totalUsers ?? 0;
    if (totalUsers === 0) return 0;
    return ((adminOverview?.summary.onboardingComplete ?? 0) / totalUsers) * 100;
  }, [adminOverview]);

  const emailConfirmationRate = useMemo(() => {
    const totalUsers = adminOverview?.summary.totalUsers ?? 0;
    if (totalUsers === 0) return 0;
    return ((adminOverview?.summary.emailConfirmed ?? 0) / totalUsers) * 100;
  }, [adminOverview]);

  const priorities = useMemo<PriorityItem[]>(() => {
    const items: PriorityItem[] = [];

    blockedRequests.slice(0, 3).forEach((request) => {
      items.push({
        id: `request-${request.id}`,
        title: `${getRequestStatus(request)} · ${request.property_name || "Logement non renseigné"}`,
        description: `${getRequestNextAction(request)} · ${getRequestAssignee(request)} · ${getElapsedLabel(
          request.updated_at ?? request.created_at,
        )}`,
        href: "/dashboard/admin/demandes",
        tone: getRequestUrgency(request),
      });
    });

    acceptedQuotesWithoutMission.slice(0, 2).forEach((request) => {
      items.push({
        id: `quote-${request.id}`,
        title: `Devis accepté sans mission · ${request.property_name || request.title || "Demande"}`,
        description: "Vérifier la création de mission et le relais côté conciergerie.",
        href: "/dashboard/admin/demandes",
        tone: "warning",
      });
    });

    lateMissions.slice(0, 3).forEach((mission) => {
      items.push({
        id: `mission-${mission.id}`,
        title: `${getMissionStatus(mission)} · ${mission.property_name || mission.title || "Mission"}`,
        description: `${getMissionNextAction(mission)} · ${getElapsedLabel(
          mission.updated_at ?? mission.scheduled_start,
        )}`,
        href: "/dashboard/admin/missions",
        tone: getMissionUrgency(mission),
      });
    });

    (adminOverview?.spotlights.onboardingAlerts ?? []).slice(0, 3).forEach((user) => {
      items.push({
        id: `user-${user.id}`,
        title: `Inscription à vérifier · ${user.displayName}`,
        description: user.healthFlags[0] ?? "Contrôle de complétude recommandé.",
        href: resolveAdminSegment(user.roleBucket),
        tone: user.lastSignInAt ? "warning" : "danger",
      });
    });

    return items.slice(0, 8);
  }, [acceptedQuotesWithoutMission, adminOverview, blockedRequests, lateMissions]);

  const recentActivity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    (adminOverview?.spotlights.recentlySignedIn ?? []).slice(0, 4).forEach((user) => {
      items.push({
        id: `signin-${user.id}`,
        title: `${user.displayName} s'est reconnecté`,
        detail: `${resolveRoleLabel(user.roleBucket)} · ${user.city || "Ville non renseignée"}`,
        href: resolveAdminSegment(user.roleBucket),
        timestamp: user.lastSignInAt,
        kind: "user",
      });
    });

    requests.slice(0, 4).forEach((request) => {
      items.push({
        id: `request-activity-${request.id}`,
        title: request.property_name || request.title || "Nouvelle demande",
        detail: `${getRequestStatus(request)} · ${getRequestAssignee(request)}`,
        href: "/dashboard/admin/demandes",
        timestamp: request.updated_at ?? request.created_at ?? null,
        kind: "request",
      });
    });

    missions.slice(0, 4).forEach((mission) => {
      items.push({
        id: `mission-activity-${mission.id}`,
        title: mission.property_name || mission.title || "Mission",
        detail: `${getMissionStatus(mission)} · ${getMissionNextAction(mission)}`,
        href: "/dashboard/admin/missions",
        timestamp: mission.updated_at ?? mission.created_at ?? null,
        kind: "mission",
      });
    });

    return items
      .sort((left, right) => {
        const leftTime = getDate(left.timestamp)?.getTime() ?? 0;
        const rightTime = getDate(right.timestamp)?.getTime() ?? 0;
        return rightTime - leftTime;
      })
      .slice(0, 8);
  }, [adminOverview, missions, requests]);

  const activationSummary = useMemo(() => {
    if (!kpiOverview) return null;

    return [
      {
        label: "Propriétaires",
        value:
          formatNullablePercent(kpiOverview.owner.activation_j7),
      },
      {
        label: "Conciergeries",
        value: formatNullablePercent(kpiOverview.concierge.activation_j7),
      },
      {
        label: "Artisans",
        value: formatNullablePercent(kpiOverview.provider.activation_j7),
      },
    ];
  }, [kpiOverview]);

  const activationTrendPoints = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" });
    return (kpiOverview?.activation_series[roleFilter] ?? []).map((point) => ({
      shortLabel: formatter.format(new Date(point.period_end)),
      rate: point.rate,
      eligible: point.eligible,
    }));
  }, [kpiOverview, roleFilter]);

  const activationZonePoints = useMemo(
    () =>
      [...(kpiOverview?.activation_by_zone[roleFilter] ?? [])]
        .sort((left, right) => {
          const leftRate = left.rate ?? -1;
          const rightRate = right.rate ?? -1;
          if (rightRate !== leftRate) return rightRate - leftRate;
          return right.eligible - left.eligible;
        })
        .slice(0, 5),
    [kpiOverview, roleFilter],
  );

  const selectedRoleActivation = kpiOverview?.[roleFilter] ?? null;
  const selectedRoleLabel = ROLE_OPTIONS.find((option) => option.value === roleFilter)?.label ?? "Segment";
  const roleDistributionSegments = useMemo(
    () => [
      { label: "Propriétaires", value: adminOverview?.summary.owners ?? 0, color: "#125c5b" },
      { label: "Conciergeries", value: adminOverview?.summary.concierges ?? 0, color: "#d4a74a" },
      { label: "Artisans", value: adminOverview?.summary.providers ?? 0, color: "#6f8a91" },
      { label: "Admins", value: Math.max(0, (adminOverview?.summary.totalUsers ?? 0) - ((adminOverview?.summary.owners ?? 0) + (adminOverview?.summary.concierges ?? 0) + (adminOverview?.summary.providers ?? 0))), color: "#d46f5d" },
    ],
    [adminOverview],
  );
  const controlHealthSegments = useMemo(
    () => [
      {
        label: "Sains",
        value:
          (adminControl?.summary.onboarding.healthy ?? 0) +
          (adminControl?.summary.missions.healthy ?? 0) +
          (adminControl?.summary.messages.healthy ?? 0),
        color: "#1f9d55",
      },
      {
        label: "À suivre",
        value:
          (adminControl?.summary.onboarding.warning ?? 0) +
          (adminControl?.summary.missions.warning ?? 0) +
          (adminControl?.summary.messages.warning ?? 0),
        color: "#f59e0b",
      },
      {
        label: "Critiques",
        value:
          (adminControl?.summary.onboarding.danger ?? 0) +
          (adminControl?.summary.missions.danger ?? 0) +
          (adminControl?.summary.messages.danger ?? 0),
        color: "#ef4444",
      },
    ],
    [adminControl],
  );

  const latestUsers = (adminOverview?.users ?? []).slice(0, 6);
  const latestRequestRows = requests.slice(0, 6);
  const latestMissionRows = missions.slice(0, 6);
  const hasAnyData =
    (adminOverview?.summary.totalUsers ?? 0) > 0 ||
    requests.length > 0 ||
    missions.length > 0 ||
    invoiceCount > 0 ||
    (adminControl?.summary.totalProblems ?? 0) > 0;

  const summarySentence = adminControl
    ? `${adminControl.summary.totalProblems} point(s) de contrôle à traiter, ${blockedRequests.length} demande(s) bloquée(s) et ${lateMissions.length} mission(s) critiques.`
    : "Le cockpit admin centralise les anomalies, l'activité et les conversions récentes.";
  const selectedRoleActivationTone: MetricTone =
    selectedRoleActivation?.activation_j7 === null
      ? "neutral"
      : selectedRoleActivation && selectedRoleActivation.activation_j7 < 20
        ? "danger"
        : selectedRoleActivation && selectedRoleActivation.activation_j7 < 40
          ? "warning"
          : selectedRoleActivation
            ? "positive"
            : "neutral";
  const heroTone: MetricTone =
    lateMissions.length > 0 || (adminControl?.summary.totalProblems ?? 0) >= 8
      ? "danger"
      : blockedRequests.length > 0 || sourceWarnings.length > 0 || (adminControl?.summary.totalProblems ?? 0) > 0
        ? "warning"
        : "positive";
  const heroStatusLabel =
    heroTone === "danger"
      ? "Tension opérationnelle forte"
      : heroTone === "warning"
        ? "Journée sous surveillance"
        : "Exploitation fluide";
  const heroStoryCards: HeroStoryCard[] = [
    {
      id: "problems",
      label: "Points à traiter",
      value: String(adminControl?.summary.totalProblems ?? 0),
      detail:
        heroTone === "danger"
          ? "Le cockpit remonte plusieurs anomalies à escalader."
          : heroTone === "warning"
            ? "Des points existent, mais restent encore absorbables."
            : "Aucune dérive majeure visible sur le périmètre suivi.",
      tone: heroTone,
    },
    {
      id: "flow",
      label: "Flux entrant",
      value: `${recentRequests}`,
      detail: `${blockedRequests.length} demande(s) bloquée(s) et ${missions.length} mission(s) suivies.`,
      tone: blockedRequests.length > 0 ? "warning" : "positive",
    },
    {
      id: "activation",
      label: `Activation ${selectedRoleLabel}`,
      value: selectedRoleActivation ? formatNullablePercent(selectedRoleActivation.activation_j7) : "Non disponible",
      detail: selectedRoleActivation
        ? `${selectedRoleActivation.activation_j7_activated}/${selectedRoleActivation.activation_j7_eligible} activés à J+7.`
        : "Les données connectées de ce segment ne sont pas encore exploitables.",
      tone: selectedRoleActivationTone,
    },
  ];
  const heroActionCards = [
    {
      id: "control",
      label: "Escalade prioritaire",
      title: blockedRequests.length > 0 ? "Débloquer les demandes coincées" : "Ouvrir la tour de contrôle",
      detail:
        blockedRequests.length > 0
          ? `${blockedRequests.length} demande(s) bloquée(s) attendent une reprise manuelle.`
          : "Balayer les anomalies inscriptions, missions et messages en un seul passage.",
      href: "/dashboard/admin/controle",
    },
    {
      id: "missions",
      label: "Point chaud du jour",
      title: lateMissions.length > 0 ? "Missions critiques à reprendre" : "Missions globalement sous contrôle",
      detail:
        lateMissions.length > 0
          ? `${lateMissions.length} mission(s) en criticité élevée côté planning ou exécution.`
          : `${missionWarnings.length} mission(s) seulement restent à surveiller.`,
      href: "/dashboard/admin/missions",
    },
  ];

  if (loading) {
    return (
      <div className={styles.state}>
        <div className={styles.loadingStack} aria-hidden="true">
          <div className={styles.loadingBlock} data-width="title" />
          <div className={styles.loadingBlock} data-width="text" />
          <div className={styles.loadingGrid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={styles.loadingCard} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.state}>
        <article className={styles.feedbackCard} data-tone="danger">
          <strong>Lecture du cockpit indisponible</strong>
          <p>{error}</p>
          <button type="button" className={styles.retryButton} onClick={() => setRefreshNonce((value) => value + 1)}>
            Relancer le chargement
          </button>
        </article>
      </div>
    );
  }

  return (
    <DashboardLayout
      persona="admin"
      title="Mission Control"
      subtitle="Vue de pilotage des inscriptions, demandes, missions et signaux d'activité."
      navTitle="Pilotage admin"
      navItems={[
        { label: "Mission Control", href: "/dashboard/admin" },
        { label: "Contrôle détaillé", href: "/dashboard/admin/controle" },
        { label: "Utilisateurs", href: "/dashboard/admin/utilisateurs" },
        { label: "Propriétaires", href: "/dashboard/admin/proprietaires" },
        { label: "Conciergeries", href: "/dashboard/admin/conciergeries" },
        { label: "Artisans", href: "/dashboard/admin/artisans" },
        { label: "Demandes", href: "/dashboard/admin/demandes" },
        { label: "Missions", href: "/dashboard/admin/missions" },
        { label: "Développement", href: "/dashboard/admin/developpement" },
      ]}
      stats={[]}
      actions={[]}
      activity={[]}
      notifications={priorities.slice(0, 3).map((item) => ({
        id: item.id,
        title: item.title,
        href: item.href,
        level: item.tone === "danger" ? "danger" : item.tone === "warning" ? "warning" : "info",
      }))}
      shortcuts={[
        { label: "Contrôle détaillé", href: "/dashboard/admin/controle" },
        { label: "Utilisateurs", href: "/dashboard/admin/utilisateurs" },
        { label: "Demandes", href: "/dashboard/admin/demandes" },
        { label: "Missions", href: "/dashboard/admin/missions" },
      ]}
      profile={{
        name: "PlanetLS",
        subtitle: "Administration",
        badge: "Admin",
      }}
      hideTodaySection
      hideQuickActions
      hideProfileSummary
      hideActivityFeed
      hideShortcuts
    >
      <section className={styles.hero} data-tone={heroTone}>
        <div className={styles.heroTop}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Cockpit administrateur</span>
            <StatusChip tone={heroTone}>{heroStatusLabel}</StatusChip>
            <h2>Voir la tension du jour, les conversions qui accélèrent et les points où l'équipe doit intervenir maintenant.</h2>
            <p>{summarySentence}</p>
          </div>

          <div className={styles.heroActionRail}>
            {heroActionCards.map((card) => (
              <Link key={card.id} href={card.href} className={styles.heroActionCard}>
                <span>{card.label}</span>
                <strong>{card.title}</strong>
                <p>{card.detail}</p>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.heroStoryGrid}>
          {heroStoryCards.map((card) => (
            <article key={card.id} className={styles.heroStoryCard} data-tone={card.tone}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.detail}</p>
            </article>
          ))}
        </div>

        <div className={styles.heroMeta}>
          <div className={styles.periodSwitch} role="group" aria-label="Période d'analyse">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={styles.periodButton}
                data-active={option.value === period}
                aria-pressed={option.value === period}
                onClick={() => setPeriod(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className={styles.heroSignals}>
            <StatusChip tone={adminControl?.health?.tone ?? "neutral"}>
              {adminControl?.health?.tone === "danger"
                ? "Santé dégradée"
                : adminControl?.health?.tone === "warning"
                  ? "Santé à surveiller"
                  : "Santé stable"}
            </StatusChip>
            <span>
              {adminControl?.health?.updatedAt
                ? `Contrôle mis à jour le ${formatDateTime(adminControl.health.updatedAt)}`
                : "Dernière mise à jour indisponible"}
            </span>
          </div>

          {sourceWarnings.length ? (
            <div className={styles.warningBanner} role="status" aria-live="polite">
              <strong>Mode dégradé :</strong>
              <span>{sourceWarnings.join(" ")}</span>
            </div>
          ) : null}

          {!hasAnyData ? (
            <div className={styles.feedbackCard} data-tone="neutral">
              <strong>Aucune donnée exploitable pour l'instant</strong>
              <p>Le cockpit est prêt, mais aucune inscription, mission, demande ou facture n'a encore été remontée sur cette fenêtre.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className={styles.metricsGrid}>
        <MetricCard
          label={`Nouveaux comptes (${period} j)`}
          value={String(recentUsers)}
          helper={`${adminOverview?.summary.totalUsers ?? 0} profils au total`}
          tone={recentUsers > 0 ? "positive" : "neutral"}
        />
        <MetricCard
          label="Complétude onboarding"
          value={formatPercent(onboardingCompletionRate)}
          helper={`${recentCompletedOnboarding} onboarding(s) finalisé(s) sur ${period} jours`}
          tone={onboardingCompletionRate >= 70 ? "positive" : onboardingCompletionRate >= 40 ? "warning" : "danger"}
        />
        <MetricCard
          label="Confirmation e-mail"
          value={formatPercent(emailConfirmationRate)}
          helper={`${adminOverview?.summary.emailConfirmed ?? 0} compte(s) confirmés`}
          tone={emailConfirmationRate >= 80 ? "positive" : emailConfirmationRate >= 50 ? "warning" : "danger"}
        />
        <MetricCard
          label={`Demandes entrantes (${period} j)`}
          value={String(recentRequests)}
          helper={`${requests.length} demande(s) actuellement en suivi`}
          tone={blockedRequests.length > 0 ? "warning" : "neutral"}
        />
        <MetricCard
          label="Missions à surveiller"
          value={String(missionWarnings.length)}
          helper={`${lateMissions.length} mission(s) critique(s)`}
          tone={lateMissions.length > 0 ? "danger" : missionWarnings.length > 0 ? "warning" : "positive"}
        />
        <MetricCard
          label="Facturation"
          value={String(invoiceCount)}
          helper={`${adminOverview?.summary.invoices ?? invoiceCount} facture(s) suivie(s)`}
          tone={invoiceCount > 0 ? "neutral" : "positive"}
        />
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.primaryColumn}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>
                  <ShieldAlert size={16} />
                  Priorités immédiates
                </span>
                <h3>Ce qui mérite une action admin maintenant</h3>
              </div>
              <Link href="/dashboard/admin/controle" className={styles.panelLink}>
                Ouvrir le contrôle détaillé
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className={styles.priorityList}>
              {priorities.length === 0 ? (
                <div className={styles.feedbackCard} data-tone="positive">
                  <strong>Aucune priorité critique en ce moment</strong>
                  <p>Toutes les demandes, missions et inscriptions visibles sont actuellement sous contrôle.</p>
                </div>
              ) : (
                priorities.map((item) => (
                  <Link key={item.id} href={item.href} className={styles.priorityItem} data-tone={item.tone}>
                    <div>
                      <StatusChip tone={item.tone}>
                        {item.tone === "danger"
                          ? "Urgent"
                          : item.tone === "warning"
                            ? "À vérifier"
                            : "Info"}
                      </StatusChip>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                    </div>
                    <ArrowRight size={16} />
                  </Link>
                ))
              )}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>
                  <Sparkles size={16} />
                  Vue business
                </span>
                <h3>Activation, flux opérationnel et qualité de parcours</h3>
              </div>
              <div className={styles.roleSwitch} role="group" aria-label="Segment analysé">
                {ROLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={styles.roleButton}
                    data-active={option.value === roleFilter}
                    aria-pressed={option.value === roleFilter}
                    onClick={() => setRoleFilter(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.insightGrid}>
              <div className={styles.insightCard}>
                <DonutCard
                  title="Répartition des rôles"
                  subtitle="Vue instantanée des comptes suivis"
                  totalLabel="comptes"
                  segments={roleDistributionSegments}
                />
              </div>
              <div className={styles.insightCard}>
                <span>Activation J+7</span>
                <div className={styles.inlineMetrics}>
                  {(activationSummary ?? []).map((item) => (
                    <div key={item.label}>
                      <strong>{item.value}</strong>
                      <small>{item.label}</small>
                    </div>
                  ))}
                  {!activationSummary ? <p className={styles.inlineNote}>Indicateurs d'activation indisponibles.</p> : null}
                </div>
              </div>

              <div className={styles.insightCard}>
                <DonutCard
                  title="Feux de contrôle"
                  subtitle="Synthèse visuelle onboarding, missions, messages"
                  totalLabel="signaux"
                  segments={controlHealthSegments}
                />
              </div>

              <div className={styles.insightCard}>
                <span>Volume réseau</span>
                <div className={styles.inlineMetrics}>
                  <div>
                    <strong>{adminOverview?.summary.properties ?? 0}</strong>
                    <small>Logements</small>
                  </div>
                  <div>
                    <strong>{adminOverview?.summary.planningEntries ?? 0}</strong>
                    <small>Entrées planning</small>
                  </div>
                  <div>
                    <strong>{adminOverview?.summary.workflowEvents ?? 0}</strong>
                    <small>Événements workflow</small>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.visualGrid}>
              <div className={styles.visualCard}>
                <div className={styles.visualCardHeader}>
                  <div>
                    <span>Tendance d'activation</span>
                    <strong>{selectedRoleLabel}</strong>
                  </div>
                  <small>
                    {selectedRoleActivation
                      ? `${selectedRoleActivation.activation_j7_activated}/${selectedRoleActivation.activation_j7_eligible} activés à J+7`
                      : "Donnée indisponible"}
                  </small>
                </div>
                <TrendChart label={selectedRoleLabel} points={activationTrendPoints} />
              </div>

              <div className={styles.visualCard}>
                <div className={styles.visualCardHeader}>
                  <div>
                    <span>Zones les plus mûres</span>
                    <strong>{selectedRoleLabel}</strong>
                  </div>
                  <small>Classement par taux d'activation puis volume éligible</small>
                </div>
                <ZoneBarChart points={activationZonePoints} />
              </div>
            </div>
          </article>

          <div className={styles.tablesGrid}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>
                    <UserRoundPlus size={16} />
                    Utilisateurs récents
                  </span>
                  <h3>Nouveaux profils à relire</h3>
                </div>
                <Link href="/dashboard/admin/utilisateurs" className={styles.panelLink}>
                  Voir tout
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className={styles.tableWrap}>
                {latestUsers.length === 0 ? (
                  <p className={styles.emptyState}>Aucun nouveau profil à relire sur la période en cours.</p>
                ) : (
                  <table className={styles.table}>
                    <caption className={styles.srOnly}>Derniers profils à relire par l'administration</caption>
                    <thead>
                      <tr>
                        <th scope="col">Profil</th>
                        <th scope="col">Rôle</th>
                        <th scope="col">État</th>
                        <th scope="col">Créé le</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestUsers.map((user) => (
                        <tr key={user.id}>
                          <td data-label="Profil">
                            <strong>{user.displayName}</strong>
                            <span>{user.email || "E-mail indisponible"}</span>
                          </td>
                          <td data-label="Rôle">{resolveRoleLabel(user.roleBucket)}</td>
                          <td data-label="État">
                            <StatusChip
                              tone={
                                user.onboardingComplete && user.emailConfirmedAt
                                  ? "positive"
                                  : user.lastSignInAt
                                    ? "warning"
                                    : "danger"
                              }
                            >
                              {user.onboardingComplete ? "Complet" : "À finir"}
                            </StatusChip>
                          </td>
                          <td data-label="Créé le">{formatShortDate(user.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>
                    <BellRing size={16} />
                    Demandes
                  </span>
                  <h3>Demandes nécessitant un suivi</h3>
                </div>
                <Link href="/dashboard/admin/demandes" className={styles.panelLink}>
                  Ouvrir
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className={styles.tableWrap}>
                {latestRequestRows.length === 0 ? (
                  <p className={styles.emptyState}>Aucune demande nécessitant un suivi n'est remontée actuellement.</p>
                ) : (
                  <table className={styles.table}>
                    <caption className={styles.srOnly}>Demandes nécessitant un suivi administratif</caption>
                    <thead>
                      <tr>
                        <th scope="col">Demande</th>
                        <th scope="col">Statut</th>
                        <th scope="col">Responsable</th>
                        <th scope="col">Dernier signal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestRequestRows.map((request) => (
                        <tr key={request.id}>
                          <td data-label="Demande">
                            <strong>{request.property_name || request.title || "Demande"}</strong>
                            <span>{request.city || "Ville indisponible"}</span>
                          </td>
                          <td data-label="Statut">
                            <StatusChip tone={getRequestUrgency(request)}>{getRequestStatus(request)}</StatusChip>
                          </td>
                          <td data-label="Responsable">{getRequestAssignee(request)}</td>
                          <td data-label="Dernier signal">{getElapsedLabel(request.updated_at ?? request.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>
                    <LifeBuoy size={16} />
                    Missions
                  </span>
                  <h3>Missions opérationnelles à contrôler</h3>
                </div>
                <Link href="/dashboard/admin/missions" className={styles.panelLink}>
                  Ouvrir
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className={styles.tableWrap}>
                {latestMissionRows.length === 0 ? (
                  <p className={styles.emptyState}>Aucune mission opérationnelle à contrôler n'est remontée actuellement.</p>
                ) : (
                  <table className={styles.table}>
                    <caption className={styles.srOnly}>Missions opérationnelles à contrôler</caption>
                    <thead>
                      <tr>
                        <th scope="col">Mission</th>
                        <th scope="col">Statut</th>
                        <th scope="col">Action suivante</th>
                        <th scope="col">Échéance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestMissionRows.map((mission) => (
                        <tr key={mission.id}>
                          <td data-label="Mission">
                            <strong>{mission.property_name || mission.title || "Mission"}</strong>
                            <span>{mission.city || "Ville indisponible"}</span>
                          </td>
                          <td data-label="Statut">
                            <StatusChip tone={getMissionUrgency(mission)}>{getMissionStatus(mission)}</StatusChip>
                          </td>
                          <td data-label="Action suivante">{getMissionNextAction(mission)}</td>
                          <td data-label="Échéance">{formatShortDate(mission.scheduled_start ?? mission.updated_at ?? mission.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </article>
          </div>
        </div>

        <div className={styles.secondaryColumn}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>
                  <Clock3 size={16} />
                  Activité récente
                </span>
                <h3>Les derniers mouvements utiles à relire</h3>
              </div>
            </div>

            <div className={styles.activityList}>
              {recentActivity.length === 0 ? (
                <p className={styles.emptyState}>Aucun mouvement récent utile à relire pour l'instant.</p>
              ) : (
                recentActivity.map((item) => (
                  <Link key={item.id} href={item.href} className={styles.activityItem}>
                    <div className={styles.activityTime}>
                      <span>{item.kind === "user" ? "Compte" : item.kind === "request" ? "Demande" : "Mission"}</span>
                      <strong>{formatDateTime(item.timestamp)}</strong>
                    </div>
                    <div className={styles.activityCopy}>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>
                  <Compass size={16} />
                  Raccourcis métier
                </span>
                <h3>Les portes d'entrée utiles pour agir vite</h3>
              </div>
            </div>

            <div className={styles.shortcutList}>
              <HealthSectionCard
                title="Inscriptions"
                href="/dashboard/admin/controle?tab=inscriptions"
                description="Onboarding, e-mail confirmé, première connexion"
                block={
                  adminControl?.summary.onboarding ?? {
                    total: 0,
                    healthy: 0,
                    warning: 0,
                    danger: 0,
                  }
                }
              />
              <HealthSectionCard
                title="Parcours missions"
                href="/dashboard/admin/controle?tab=missions"
                description="Devis, planning, mission et facturation"
                block={
                  adminControl?.summary.missions ?? {
                    total: 0,
                    healthy: 0,
                    warning: 0,
                    danger: 0,
                  }
                }
              />
              <HealthSectionCard
                title="Messages"
                href="/dashboard/admin/controle?tab=messages"
                description="Conversations actives, attentes et relances"
                block={
                  adminControl?.summary.messages ?? {
                    total: 0,
                    healthy: 0,
                    warning: 0,
                    danger: 0,
                  }
                }
              />
              <Link href="/dashboard/admin/developpement" className={styles.shortcutCard}>
                <strong>Mission Control dev</strong>
                <p>Suivre la roadmap, la dette et les décisions techniques.</p>
              </Link>
            </div>
          </article>
        </div>
      </section>
    </DashboardLayout>
  );
}
