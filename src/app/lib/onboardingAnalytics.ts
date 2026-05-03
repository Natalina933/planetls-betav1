"use client";

export type OnboardingEventName =
  | "concierge_onboarding_started"
  | "concierge_onboarding_step_viewed"
  | "concierge_onboarding_step_completed"
  | "concierge_onboarding_accessibility_enabled"
  | "concierge_onboarding_radius_set"
  | "concierge_onboarding_express_selected"
  | "concierge_post_signup_cta_clicked"
  | "concierge_first_asset_created"
  | "onboarding_started"
  | "onboarding_step_viewed"
  | "onboarding_step_completed"
  | "onboarding_account_created"
  | "onboarding_account_creation_failed"
  | "onboarding_auto_login_failed";

type OnboardingEventPayload = {
  step: number;
  category?: string;
  action: OnboardingEventName | string;
  metadata?: Record<string, unknown>;
};

const EXPERIMENT_KEY = "planetls-onboarding-experiments";

const getStoredExperimentVariant = (experiment: string) => {
  try {
    const variants = JSON.parse(window.localStorage.getItem(EXPERIMENT_KEY) ?? "{}") as Record<string, string>;
    return variants[experiment];
  } catch {
    return undefined;
  }
};

export function getOnboardingExperimentVariant(experiment: string, variants: string[] = ["control", "variant"]) {
  if (typeof window === "undefined") return variants[0] ?? "control";

  const stored = getStoredExperimentVariant(experiment);
  if (stored && variants.includes(stored)) return stored;

  const nextVariant = variants[Math.floor(Math.random() * variants.length)] ?? "control";

  try {
    const current = JSON.parse(window.localStorage.getItem(EXPERIMENT_KEY) ?? "{}") as Record<string, string>;
    window.localStorage.setItem(EXPERIMENT_KEY, JSON.stringify({ ...current, [experiment]: nextVariant }));
  } catch {
    // Experiment assignment should never block onboarding.
  }

  return nextVariant;
}

const inferPersonaHint = (payload: OnboardingEventPayload) => {
  const level = payload.metadata?.experienceLevel ?? payload.metadata?.level;
  const signupMode = payload.metadata?.signupMode;

  if (signupMode === "express" || signupMode === "business" || level === "experimente") {
    return "expert_like";
  }

  if (level === "debutant" || payload.metadata?.supportNeed === "guidage_simple") {
    return "simplicity_like";
  }

  return undefined;
};

export function trackOnboardingEvent(payload: OnboardingEventPayload) {
  if (typeof window === "undefined") return;

  const event = {
    ...payload,
    personaHint: inferPersonaHint(payload),
    experiments: {
      stepper: getOnboardingExperimentVariant("concierge_stepper_visible"),
      readability: getOnboardingExperimentVariant("concierge_readability_mode"),
      express: getOnboardingExperimentVariant("concierge_express_entry"),
    },
    path: window.location.pathname,
    occurredAt: new Date().toISOString(),
  };

  try {
    const history = JSON.parse(window.localStorage.getItem("planetls-onboarding-events") ?? "[]") as unknown[];
    window.localStorage.setItem("planetls-onboarding-events", JSON.stringify([...history.slice(-49), event]));
  } catch {
    // Local analytics should never block onboarding.
  }

  const body = JSON.stringify(event);
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/onboarding-events", new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch("/api/onboarding-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
