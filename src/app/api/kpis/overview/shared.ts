export type KpiRolePayload = {
  activation_j7: number | null;
  median_signup_to_first_request_minutes?: number | null;
  median_signup_to_first_response_minutes?: number | null;
  request_to_quote_rate?: number | null;
  quote_to_mission_rate?: number | null;
  missions_completed_rate?: number | null;
};

export type KpiOverviewPayload = {
  window_days: number;
  generated_at: string;
  owner: KpiRolePayload;
  concierge: KpiRolePayload;
  provider: KpiRolePayload;
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
  return isNullableNumber(value.activation_j7);
}

export function isKpiOverviewPayload(value: unknown): value is KpiOverviewPayload {
  if (!isObject(value)) return false;
  if (typeof value.window_days !== "number") return false;
  if (typeof value.generated_at !== "string") return false;
  if (!hasKpiRoleShape(value.owner)) return false;
  if (!hasKpiRoleShape(value.concierge)) return false;
  if (!hasKpiRoleShape(value.provider)) return false;
  if (!isObject(value.shared)) return false;
  if (!isNullableNumber(value.shared.mission_to_paid_invoice_rate)) return false;
  if (!isNullableNumber(value.shared.median_first_message_response_minutes)) return false;
  return true;
}
