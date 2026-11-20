export type WorkspaceKey = "owner" | "concierge" | "provider" | "admin";

export function isDevWorkspaceAuthEnabled() {
  return (
    process.env.WORKSPACE_QUICK_LOGIN_ENABLED === "true" &&
    process.env.NODE_ENV !== "production"
  );
}

export function getTargetWorkspaceEmail() {
  return process.env.TARGET_EMAIL || process.env.ADMIN_EMAIL || "admin@planetls.fr";
}

export function buildWorkspaceEmail(email: string, key: WorkspaceKey) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return `${key}.${email}`;
  return `${local}+${key}@${domain}`.toLowerCase();
}
