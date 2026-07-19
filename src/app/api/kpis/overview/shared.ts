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

export type KpiOverviewPayload = {
  window_days: number;
  generated_at: string;
  owner: KpiRolePayload;
  concierge: KpiRolePayload;
  provider: KpiRolePayload;
  activation_series: Record<"owner" | "concierge" | "provider", ActivationSeriesPoint[]>;
  activation_by_zone: Record<"owner" | "concierge" | "provider", ActivationZonePoint[]>;
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
  if (!isObject(value.shared)) return false;
  if (!isNullableNumber(value.shared.mission_to_paid_invoice_rate)) return false;
  if (!isNullableNumber(value.shared.median_first_message_response_minutes)) return false;
  return true;
}
