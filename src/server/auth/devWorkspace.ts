import { resolveUserRole } from "@/app/utils/roles";
import type { UserRole } from "@/types/supabase";

export type WorkspaceKey = "owner" | "concierge" | "provider" | "admin";

type WorkspaceDefinition = {
  key: WorkspaceKey;
  role: UserRole;
  label: string;
  href: string;
};

const WORKSPACES: WorkspaceDefinition[] = [
  { key: "owner", role: "owner", label: "Proprietaire", href: "/dashboard/owner" },
  { key: "concierge", role: "concierge", label: "Conciergerie", href: "/dashboard/concierge" },
  { key: "provider", role: "provider", label: "Artisan", href: "/dashboard/provider" },
  { key: "admin", role: "admin", label: "Administrateur", href: "/dashboard/admin" },
];

export function isDevWorkspaceAuthEnabled() {
  return (
    process.env.WORKSPACE_QUICK_LOGIN_ENABLED === "true" &&
    process.env.NODE_ENV !== "production"
  );
}

export function getTargetWorkspaceEmail() {
  return process.env.TARGET_EMAIL || process.env.ADMIN_EMAIL || "admin@planetls.fr";
}

export function getWorkspacePassword() {
  return process.env.WORKSPACE_PASSWORD || process.env.ADMIN_PASSWORD || "Admin123!";
}

export function buildWorkspaceEmail(email: string, key: WorkspaceKey) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return `${key}.${email}`;
  return `${local}+${key}@${domain}`.toLowerCase();
}

export function buildWorkspaceAccount(workspaceKey: WorkspaceKey) {
  const workspace = WORKSPACES.find((entry) => entry.key === workspaceKey);
  if (!workspace) return null;

  const targetEmail = getTargetWorkspaceEmail();
  return {
    workspace: workspaceKey,
    email:
      workspaceKey === "admin"
        ? targetEmail
        : buildWorkspaceEmail(targetEmail, workspaceKey),
    password: getWorkspacePassword(),
    href: workspace.href,
    label: workspace.label,
  };
}

export function resolveDevWorkspaceAccount(
  email: string | null | undefined,
  password: string | null | undefined,
) {
  if (!isDevWorkspaceAuthEnabled() || !email || !password) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const workspacePassword = getWorkspacePassword();
  if (password !== workspacePassword) {
    return null;
  }

  const targetEmail = getTargetWorkspaceEmail().toLowerCase();

  for (const workspace of WORKSPACES) {
    const candidateEmail =
      workspace.key === "admin"
        ? targetEmail
        : buildWorkspaceEmail(targetEmail, workspace.key);

    if (normalizedEmail !== candidateEmail) {
      continue;
    }

    return {
      id: `dev-workspace:${workspace.key}:${candidateEmail}`,
      email: candidateEmail,
      emailVerified: new Date(),
      username: `dev-${workspace.key}`,
      name: `Profil ${workspace.label}`,
      firstName: "Profil",
      lastName: workspace.label,
      phone: null,
      role: resolveUserRole(workspace.role, null) ?? workspace.role,
      avatar_url: null,
      location: "Local workspace",
      option: null,
      search_target: null,
      company_name: `Workspace ${workspace.label}`,
      status: "active",
    };
  }

  return null;
}
