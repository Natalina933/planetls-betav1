"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  BellRing,
  CalendarRange,
  CircleDollarSign,
  LifeBuoy,
  ShieldAlert,
  Sparkles,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { DashboardEmptyState } from "@/app/components/dashboard/saas";
import {
  UnifiedRoleDashboard,
  UnifiedSpotlightList,
  UnifiedStatStack,
  type UnifiedSpotlightItem,
} from "@/app/components/dashboard/unified";
import { Badge } from "@/components/ui";
import type { KpiOverviewPayload } from "@/app/api/kpis/overview/shared";
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
import styles from "./AdminDashboard.module.scss";

type TimeWindow = 7 | 30 | 90;
type ActivationRole = "owner" | "concierge" | "provider";
type MetricTone = "neutral" | "positive" | "warning" | "danger";

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
  const variant = tone === "positive" ? "success" : tone === "warning" ? "warning" : tone === "danger" ? "danger" : "neutral";

  return (
    <Badge variant={variant} className={styles.statusChip}>
      {children}
    </Badge>
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
    { label: "A suivre", value: block.warning, color: "#f59e0b" },
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
    return <p className={styles.chartEmpty}>Aucune zone exploitable n'est remontee pour le moment.</p>;
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
            <div className={styles.zoneFill} style={{ width: `${Math.max(6, Math.min(point.rate ?? 0, 100))}%` }} />
          </div>
          <small>{point.activated} actives sur {point.eligible} éligibles</small>
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
          warnings.push("Tour de controle indisponible.");
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
        setError("Le cockpit admin a rencontre une erreur inattendue.");
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
        const status = normalizeAdminText(getRequestStatus(request));
        return status === "bloquee" || getRequestUrgency(request) === "danger";
      }),
    [requests],
  );

  const acceptedQuotesWithoutMission = useMemo(
    () =>
      requests.filter((request) => {
        const quoteAccepted = normalizeAdminText(getRequestStatus(request)) === "devis accepte";
        return quoteAccepted && !normalizeAdminText(request.mission_workflow_status);
      }),
    [requests],
  );

  const lateMissions = useMemo(() => missions.filter((mission) => getMissionUrgency(mission) === "danger"), [missions]);

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
        title: `${getRequestStatus(request)} · ${request.property_name || "Logement non renseigne"}`,
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
        title: `Devis accepte sans mission · ${request.property_name || request.title || "Demande"}`,
        description: "Verifier la creation de mission et le relais cote conciergerie.",
        href: "/dashboard/admin/demandes",
        tone: "warning",
      });
    });

    lateMissions.slice(0, 3).forEach((mission) => {
      items.push({
        id: `mission-${mission.id}`,
        title: `${getMissionStatus(mission)} · ${mission.property_name || mission.title || "Mission"}`,
        description: `${getMissionNextAction(mission)} · ${getElapsedLabel(mission.updated_at ?? mission.scheduled_start)}`,
        href: "/dashboard/admin/missions",
        tone: getMissionUrgency(mission),
      });
    });

    (adminOverview?.spotlights.onboardingAlerts ?? []).slice(0, 3).forEach((user) => {
      items.push({
        id: `user-${user.id}`,
        title: `Inscription a verifier · ${user.displayName}`,
        description: user.healthFlags[0] ?? "Controle de completude recommande.",
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
        title: `${user.displayName} s'est reconnecte`,
        detail: `${resolveRoleLabel(user.roleBucket)} · ${user.city || "Ville non renseignee"}`,
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
      { label: "Propriétaires", value: formatNullablePercent(kpiOverview.owner.activation_j7) },
      { label: "Conciergeries", value: formatNullablePercent(kpiOverview.concierge.activation_j7) },
      { label: "Artisans", value: formatNullablePercent(kpiOverview.provider.activation_j7) },
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
      {
        label: "Admins",
        value: Math.max(
          0,
          (adminOverview?.summary.totalUsers ?? 0) -
            ((adminOverview?.summary.owners ?? 0) +
              (adminOverview?.summary.concierges ?? 0) +
              (adminOverview?.summary.providers ?? 0)),
        ),
        color: "#d46f5d",
      },
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
        label: "A suivre",
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
    ? `${adminControl.summary.totalProblems} point(s) de controle a traiter, ${blockedRequests.length} demande(s) bloquee(s) et ${lateMissions.length} mission(s) critiques.`
    : "Le cockpit admin centralise les anomalies, l'activite et les conversions recentes.";

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
    heroTone === "danger" ? "Tension operationnelle forte" : heroTone === "warning" ? "Journee sous surveillance" : "Exploitation fluide";

  const heroStoryCards: HeroStoryCard[] = [
    {
      id: "problems",
      label: "Points a traiter",
      value: String(adminControl?.summary.totalProblems ?? 0),
      detail:
        heroTone === "danger"
          ? "Le cockpit remonte plusieurs anomalies a escalader."
          : heroTone === "warning"
            ? "Des points existent, mais restent encore absorbables."
            : "Aucune derive majeure visible sur le perimetre suivi.",
      tone: heroTone,
    },
    {
      id: "flow",
      label: "Flux entrant",
      value: `${recentRequests}`,
      detail: `${blockedRequests.length} demande(s) bloquee(s) et ${missions.length} mission(s) suivies.`,
      tone: blockedRequests.length > 0 ? "warning" : "positive",
    },
    {
      id: "activation",
      label: `Activation ${selectedRoleLabel}`,
      value: selectedRoleActivation ? formatNullablePercent(selectedRoleActivation.activation_j7) : "Non disponible",
      detail: selectedRoleActivation
        ? `${selectedRoleActivation.activation_j7_activated}/${selectedRoleActivation.activation_j7_eligible} actives a J+7.`
        : "Les donnees connectees de ce segment ne sont pas encore exploitables.",
      tone: selectedRoleActivationTone,
    },
  ];

  const prioritySpotlights = useMemo<UnifiedSpotlightItem[]>(
    () =>
      priorities.map((item) => ({
        id: item.id,
        label: item.tone === "danger" ? "Urgent" : item.tone === "warning" ? "A verifier" : "Info",
        title: item.title,
        detail: item.description,
        href: item.href,
        tone: item.tone === "danger" ? "warning" : item.tone === "warning" ? "accent" : "neutral",
        icon:
          item.tone === "danger" ? <ShieldAlert size={16} /> : item.tone === "warning" ? <BellRing size={16} /> : <Sparkles size={16} />,
      })),
    [priorities],
  );

  const activitySpotlights = useMemo<UnifiedSpotlightItem[]>(
    () =>
      recentActivity.map((item) => ({
        id: item.id,
        label: item.kind === "user" ? "Compte" : item.kind === "request" ? "Demande" : "Mission",
        title: item.title,
        detail: item.detail,
        meta: formatDateTime(item.timestamp),
        href: item.href,
        tone: item.kind === "mission" ? "accent" : item.kind === "request" ? "warning" : "neutral",
        icon: item.kind === "user" ? <UserRoundPlus size={16} /> : item.kind === "request" ? <BellRing size={16} /> : <LifeBuoy size={16} />,
      })),
    [recentActivity],
  );

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
    <div className="theme-admin">
      <UnifiedRoleDashboard
        role="admin"
        visualVariant="admin-prototype"
        title="Aujourd'hui sur PlanetLS"
        subtitle="Les signaux a traiter, l'activite du reseau et les operations qui demandent votre attention."
        experienceBadge={`Vue des ${period} derniers jours`}
        experienceBadgeTone="info"
        statusLabel={heroStatusLabel}
        statusTone={heroTone === "danger" ? "danger" : heroTone === "warning" ? "warning" : "success"}
        actions={[
          {
            id: "control",
            label: blockedRequests.length > 0 ? "Debloquer les demandes coincees" : "Ouvrir la tour de controle",
            href: "/dashboard/admin/controle",
            tone: "primary",
          },
          {
            id: "missions",
            label: lateMissions.length > 0 ? "Missions critiques a reprendre" : "Suivre les missions",
            href: "/dashboard/admin/missions",
            tone: "secondary",
          },
          {
            id: "development",
            label: "Mission Control dev",
            href: "/dashboard/admin/developpement",
            tone: "ghost",
          },
        ]}
        heroSupplement={
          <>
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
              <p>{summarySentence}</p>

              <div className={styles.periodSwitch} role="group" aria-label="Periode d'analyse">
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
          </>
        }
        kpis={[
          {
            id: "users",
            label: `Nouveaux comptes (${period} j)`,
            value: String(recentUsers),
            detail: `${adminOverview?.summary.totalUsers ?? 0} profils au total`,
            icon: <Users size={18} />,
            statusLabel: recentUsers > 0 ? "Actif" : "Stable",
            statusTone: recentUsers > 0 ? "success" : "info",
            href: "/dashboard/admin/utilisateurs",
          },
          {
            id: "onboarding",
            label: "Completude onboarding",
            value: formatPercent(onboardingCompletionRate),
            detail: `${recentCompletedOnboarding} onboarding(s) finalise(s) sur ${period} jours`,
            icon: <Sparkles size={18} />,
            statusLabel: onboardingCompletionRate >= 70 ? "Bon niveau" : onboardingCompletionRate >= 40 ? "A suivre" : "A corriger",
            statusTone: onboardingCompletionRate >= 70 ? "success" : onboardingCompletionRate >= 40 ? "warning" : "danger",
            href: "/dashboard/admin/controle?tab=inscriptions",
          },
          {
            id: "email",
            label: "Confirmation e-mail",
            value: formatPercent(emailConfirmationRate),
            detail: `${adminOverview?.summary.emailConfirmed ?? 0} compte(s) confirmes`,
            icon: <UserRoundPlus size={18} />,
            statusLabel: emailConfirmationRate >= 80 ? "Fiable" : emailConfirmationRate >= 50 ? "Inegal" : "Fragile",
            statusTone: emailConfirmationRate >= 80 ? "success" : emailConfirmationRate >= 50 ? "warning" : "danger",
            href: "/dashboard/admin/controle?tab=inscriptions",
          },
          {
            id: "requests",
            label: `Demandes entrantes (${period} j)`,
            value: String(recentRequests),
            detail: `${requests.length} demande(s) actuellement en suivi`,
            icon: <BellRing size={18} />,
            statusLabel: blockedRequests.length > 0 ? "Blocages" : "Flux net",
            statusTone: blockedRequests.length > 0 ? "warning" : "success",
            href: "/dashboard/admin/demandes",
          },
          {
            id: "missions",
            label: "Missions a surveiller",
            value: String(missionWarnings.length),
            detail: `${lateMissions.length} mission(s) critiques`,
            icon: <CalendarRange size={18} />,
            statusLabel: lateMissions.length > 0 ? "Urgent" : missionWarnings.length > 0 ? "Surveillance" : "Sous controle",
            statusTone: lateMissions.length > 0 ? "danger" : missionWarnings.length > 0 ? "warning" : "success",
            href: "/dashboard/admin/missions",
          },
          {
            id: "billing",
            label: "Facturation",
            value: String(invoiceCount),
            detail: `${adminOverview?.summary.invoices ?? invoiceCount} facture(s) suivie(s)`,
            icon: <CircleDollarSign size={18} />,
            statusLabel: invoiceCount > 0 ? "En suivi" : "Calme",
            statusTone: invoiceCount > 0 ? "info" : "success",
            href: "/dashboard/admin/pilotage",
          },
        ]}
        leftPrimary={
          <>
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>
                    <ShieldAlert size={16} />
                    Priorités immédiates
                  </span>
                  <h3>Ce qui merite une action admin maintenant</h3>
                </div>
                <Link href="/dashboard/admin/controle" className={styles.panelLink}>
                  Ouvrir le contrôle détaillé
                  <ArrowRight size={16} />
                </Link>
              </div>

              {prioritySpotlights.length > 0 ? (
                <UnifiedSpotlightList items={prioritySpotlights} />
              ) : (
                <DashboardEmptyState
                  title="Aucune priorite critique en ce moment"
                  copy="Toutes les demandes, missions et inscriptions visibles sont actuellement sous controle."
                />
              )}
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>
                    <Sparkles size={16} />
                    Vue business
                  </span>
                  <h3>Activation, flux operationnel et qualite de parcours</h3>
                </div>
                <div className={styles.roleSwitch} role="group" aria-label="Segment analyse">
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
                    title="Repartition des roles"
                    subtitle="Vue instantanee des comptes suivis"
                    totalLabel="comptes"
                    segments={roleDistributionSegments}
                  />
                </div>

                <div className={styles.insightCard}>
                  <span>Activation J+7</span>
                  {activationSummary ? (
                    <UnifiedStatStack
                      items={activationSummary.map((item) => ({
                        label: item.label,
                        value: item.value,
                        detail: "Conversion des cohortes matures",
                      }))}
                    />
                  ) : (
                    <p className={styles.inlineNote}>Indicateurs d'activation indisponibles.</p>
                  )}
                </div>

                <div className={styles.insightCard}>
                  <DonutCard
                    title="Feux de controle"
                    subtitle="Synthese visuelle onboarding, missions, messages"
                    totalLabel="signaux"
                    segments={controlHealthSegments}
                  />
                </div>

                <div className={styles.insightCard}>
                  <span>Volume reseau</span>
                  <UnifiedStatStack
                    items={[
                      {
                        label: "Logements",
                        value: String(adminOverview?.summary.properties ?? 0),
                        detail: "Parc actuellement relie au reseau",
                      },
                      {
                        label: "Entrees planning",
                        value: String(adminOverview?.summary.planningEntries ?? 0),
                        detail: "Charge terrain visible cote exploitation",
                      },
                      {
                        label: "Evenements workflow",
                        value: String(adminOverview?.summary.workflowEvents ?? 0),
                        detail: "Historique operationnel suivi",
                      },
                    ]}
                  />
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
                        ? `${selectedRoleActivation.activation_j7_activated}/${selectedRoleActivation.activation_j7_eligible} actives a J+7`
                        : "Donnee indisponible"}
                    </small>
                  </div>
                  <TrendChart label={selectedRoleLabel} points={activationTrendPoints} />
                </div>

                <div className={styles.visualCard}>
                  <div className={styles.visualCardHeader}>
                    <div>
                      <span>Zones les plus mures</span>
                      <strong>{selectedRoleLabel}</strong>
                    </div>
                    <small>Classement par taux d'activation puis volume eligible</small>
                  </div>
                  <ZoneBarChart points={activationZonePoints} />
                </div>
              </div>
            </article>
          </>
        }
        leftSecondary={
          <div className={styles.tablesGrid}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>
                    <UserRoundPlus size={16} />
                    Utilisateurs recents
                  </span>
                  <h3>Nouveaux profils a relire</h3>
                </div>
                <Link href="/dashboard/admin/utilisateurs" className={styles.panelLink}>
                  Voir tout
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className={styles.tableWrap}>
                {latestUsers.length === 0 ? (
                  <p className={styles.emptyState}>Aucun nouveau profil a relire sur la periode en cours.</p>
                ) : (
                  <table className={styles.table}>
                    <caption className={styles.srOnly}>Derniers profils a relire par l'administration</caption>
                    <thead>
                      <tr>
                        <th scope="col">Profil</th>
                        <th scope="col">Role</th>
                        <th scope="col">Etat</th>
                        <th scope="col">Cree le</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestUsers.map((user) => (
                        <tr key={user.id}>
                          <td data-label="Profil">
                            <strong>{user.displayName}</strong>
                            <span>{user.email || "E-mail indisponible"}</span>
                          </td>
                          <td data-label="Role">{resolveRoleLabel(user.roleBucket)}</td>
                          <td data-label="Etat">
                            <StatusChip
                              tone={
                                user.onboardingComplete && user.emailConfirmedAt
                                  ? "positive"
                                  : user.lastSignInAt
                                    ? "warning"
                                    : "danger"
                              }
                            >
                              {user.onboardingComplete ? "Complet" : "A finir"}
                            </StatusChip>
                          </td>
                          <td data-label="Cree le">{formatShortDate(user.createdAt)}</td>
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
                  <h3>Demandes necessitant un suivi</h3>
                </div>
                <Link href="/dashboard/admin/demandes" className={styles.panelLink}>
                  Ouvrir
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className={styles.tableWrap}>
                {latestRequestRows.length === 0 ? (
                  <p className={styles.emptyState}>Aucune demande necessitant un suivi n'est remontee actuellement.</p>
                ) : (
                  <table className={styles.table}>
                    <caption className={styles.srOnly}>Demandes necessitant un suivi administratif</caption>
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
                  <h3>Missions operationnelles a controler</h3>
                </div>
                <Link href="/dashboard/admin/missions" className={styles.panelLink}>
                  Ouvrir
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className={styles.tableWrap}>
                {latestMissionRows.length === 0 ? (
                  <p className={styles.emptyState}>Aucune mission operationnelle a controler n'est remontee actuellement.</p>
                ) : (
                  <table className={styles.table}>
                    <caption className={styles.srOnly}>Missions operationnelles a controler</caption>
                    <thead>
                      <tr>
                        <th scope="col">Mission</th>
                        <th scope="col">Statut</th>
                        <th scope="col">Action suivante</th>
                        <th scope="col">Echeance</th>
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
                          <td data-label="Echeance">{formatShortDate(mission.scheduled_start ?? mission.updated_at ?? mission.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </article>
          </div>
        }
        sidebarSections={[
          {
            id: "activity",
            title: "Activite recente",
            subtitle: "Les derniers mouvements utiles a relire",
            content:
              activitySpotlights.length > 0 ? (
                <UnifiedSpotlightList items={activitySpotlights} />
              ) : (
                <DashboardEmptyState
                  title="Aucun mouvement recent utile a relire"
                  copy="Les signaux recents utilisateurs, demandes et missions apparaitront ici."
                />
              ),
          },
          {
            id: "shortcuts",
            title: "Raccourcis metier",
            subtitle: "Les portes d'entree utiles pour agir vite",
            content: (
              <div className={styles.shortcutList}>
                <HealthSectionCard
                  title="Inscriptions"
                  href="/dashboard/admin/controle?tab=inscriptions"
                  description="Onboarding, e-mail confirme, premiere connexion"
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
                  <p>Suivre la roadmap, la dette et les decisions techniques.</p>
                </Link>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
