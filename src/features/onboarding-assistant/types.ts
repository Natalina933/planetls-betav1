export type OnboardingPath = "simple" | "rapide" | "business+";

export type OnboardingActionStatus = "todo" | "done";

export interface OnboardingActionItem {
  id: string;
  label: string;
  href: string;
}

export interface OnboardingDisplayContext {
  firstLogin: boolean;
  completionState: "not_started" | "in_progress" | "completed";
  actionStatus: Record<string, OnboardingActionStatus>;
}
