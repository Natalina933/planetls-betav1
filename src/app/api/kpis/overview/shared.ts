export type KpiRolePayload = {
  activation_j7: number | null;
  activation_j7_eligible: number;
  activation_j7_activated: number;
  activation_definition: string;
  median_signup_to_first_request_minutes?: number | null;
  median_signup_to_first_response_minutes?: number | null;
  request_to_quote_rate?: number | null;
  quote_to_mission_rate?: number | null;
  missions_completed_rate?: number | null;
};

export type ActivationSeriesPoint = {
  period_start: string;
  period_end: string;
  eligible: number;
  activated: number;
  rate: number | null;
};

export type ActivationZonePoint = {
  zone: string;
  eligible: number;
  activated: number;
  rate: number | null;
};

export type ActivationAlert = {
  id: string;
  role: "owner" | "concierge" | "provider";
  severity: "info" | "warning" | "danger";
  kind: "insufficient_data" | "below_target" | "declining";
  title: string;
  detail: string;
  next_action: string;
};

export const ACTIVATION_ALERT_POLICY = {
  minimum_eligible: 5,
  decline_points: 10,
  roles: {
    owner: { target_rate: 30, critical_rate: 15 },
    concierge: { target_rate: 25, critical_rate: 12 },
    provider: { target_rate: 35, critical_rate: 18 },
  },
} as const;

const ROLE_LABELS = { owner: "Propriétaires", concierge: "Conciergeries", provider: "Artisans" } as const;

export function buildActivationAlerts(
  metrics: Record<"owner" | "concierge" | "provider", KpiRolePayload>,
  series: Record<"owner" | "concierge" | "provider", ActivationSeriesPoint[]>,
): ActivationAlert[] {
  return (["owner", "concierge", "provider"] as const).flatMap((role) => {
    const alerts: ActivationAlert[] = [];
    const metric = metrics[role];
    const policy = ACTIVATION_ALERT_POLICY.roles[role];

    if (metric.activation_j7_eligible < ACTIVATION_ALERT_POLICY.minimum_eligible) {
      alerts.push({
        id: `${role}-sample`,
        role,
        severity: "info",
        kind: "insufficient_data",
        title: `${ROLE_LABELS[role]} : groupe insuffisant`,
        detail: `${metric.activation_j7_eligible}/${ACTIVATION_ALERT_POLICY.minimum_eligible} profils éligibles minimum.`,
        next_action: "Attendre un groupe mature avant toute décision d’acquisition.",
      });
      return alerts;
    }

    if (metric.activation_j7 !== null && metric.activation_j7 < policy.target_rate) {
      alerts.push({
        id: `${role}-target`,
        role,
        severity: metric.activation_j7 < policy.critical_rate ? "danger" : "warning",
        kind: "below_target",
        title: `${ROLE_LABELS[role]} : activation sous le seuil`,
        detail: `${metric.activation_j7}% observé ; cible ${policy.target_rate}% et seuil critique ${policy.critical_rate}%.`,
        next_action:
          role === "owner"
            ? "Auditer la création de la première demande."
            : role === "concierge"
              ? "Auditer l’envoi du premier devis."
              : "Auditer l’accès et l’acceptation de la première mission.",
      });
    }

    const maturePoints = series[role]
      .filter((point) => point.eligible >= ACTIVATION_ALERT_POLICY.minimum_eligible && point.rate !== null)
      .slice(-2);

    if (maturePoints.length === 2) {
      const decline = (maturePoints[0].rate ?? 0) - (maturePoints[1].rate ?? 0);
      if (decline >= ACTIVATION_ALERT_POLICY.decline_points) {
        alerts.push({
          id: `${role}-decline`,
          role,
          severity: "warning",
          kind: "declining",
          title: `${ROLE_LABELS[role]} : tendance en baisse`,
          detail: `Recul de ${Math.round(decline * 100) / 100} points entre les deux derniers groupes matures.`,
          next_action: "Comparer les sources d’acquisition, zones et étapes d’onboarding des deux groupes.",
        });
      }
    }

    return alerts;
  });
}

export type KpiOverviewPayload = {
  window_days: number;
  generated_at: string;
  owner: KpiRolePayload;
  concierge: KpiRolePayload;
  provider: KpiRolePayload;
  activation_series: Record<"owner" | "concierge" | "provider", ActivationSeriesPoint[]>;
  activation_by_zone: Record<"owner" | "concierge" | "provider", ActivationZonePoint[]>;
  activation_alert_policy: typeof ACTIVATION_ALERT_POLICY;
  activation_alerts: ActivationAlert[];
  shared: {
    mission_to_paid_invoice_rate: number | null;
    median_first_message_response_minutes: number | null;
  };
};

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function hasKpiRoleShape(value: unknown): value is KpiRolePayload {
  if (!isObject(value)) return false;
  return (
    isNullableNumber(value.activation_j7) &&
    typeof value.activation_j7_eligible === "number" &&
    typeof value.activation_j7_activated === "number" &&
    typeof value.activation_definition === "string"
  );
}

function hasActivationSeriesShape(value: unknown): value is ActivationSeriesPoint[] {
  return Array.isArray(value) && value.every((point) =>
    isObject(point) &&
    typeof point.period_start === "string" &&
    typeof point.period_end === "string" &&
    typeof point.eligible === "number" &&
    typeof point.activated === "number" &&
    isNullableNumber(point.rate),
  );
}

function hasActivationZoneShape(value: unknown): value is ActivationZonePoint[] {
  return Array.isArray(value) && value.every((point) =>
    isObject(point) &&
    typeof point.zone === "string" &&
    typeof point.eligible === "number" &&
    typeof point.activated === "number" &&
    isNullableNumber(point.rate),
  );
}

function hasActivationAlertPolicyShape(value: unknown): value is typeof ACTIVATION_ALERT_POLICY {
  if (!isObject(value) || typeof value.minimum_eligible !== "number" || typeof value.decline_points !== "number" || !isObject(value.roles)) return false;
  const roles = value.roles;
  return (["owner", "concierge", "provider"] as const).every((role) => {
    const policy = roles[role];
    return isObject(policy) && typeof policy.target_rate === "number" && typeof policy.critical_rate === "number";
  });
}

function hasActivationAlertsShape(value: unknown): value is ActivationAlert[] {
  return Array.isArray(value) && value.every((alert) => isObject(alert) &&
    typeof alert.id === "string" &&
    (alert.role === "owner" || alert.role === "concierge" || alert.role === "provider") &&
    (alert.severity === "info" || alert.severity === "warning" || alert.severity === "danger") &&
    typeof alert.title === "string" && typeof alert.detail === "string" && typeof alert.next_action === "string");
}

export function isKpiOverviewPayload(value: unknown): value is KpiOverviewPayload {
  if (!isObject(value)) return false;
  if (typeof value.window_days !== "number") return false;
  if (typeof value.generated_at !== "string") return false;
  if (!hasKpiRoleShape(value.owner)) return false;
  if (!hasKpiRoleShape(value.concierge)) return false;
  if (!hasKpiRoleShape(value.provider)) return false;
  if (!isObject(value.activation_series)) return false;
  if (!hasActivationSeriesShape(value.activation_series.owner)) return false;
  if (!hasActivationSeriesShape(value.activation_series.concierge)) return false;
  if (!hasActivationSeriesShape(value.activation_series.provider)) return false;
  if (!isObject(value.activation_by_zone)) return false;
  if (!hasActivationZoneShape(value.activation_by_zone.owner)) return false;
  if (!hasActivationZoneShape(value.activation_by_zone.concierge)) return false;
  if (!hasActivationZoneShape(value.activation_by_zone.provider)) return false;
  if (!hasActivationAlertPolicyShape(value.activation_alert_policy)) return false;
  if (!hasActivationAlertsShape(value.activation_alerts)) return false;
  if (!isObject(value.shared)) return false;
  if (!isNullableNumber(value.shared.mission_to_paid_invoice_rate)) return false;
  if (!isNullableNumber(value.shared.median_first_message_response_minutes)) return false;
  return true;
}
