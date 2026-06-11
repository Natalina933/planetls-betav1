import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type WorkspaceKey = "owner" | "concierge" | "provider" | "admin";

const WORKSPACES: Record<
  WorkspaceKey,
  {
    key: WorkspaceKey;
    role: string;
    label: string;
    href: string;
    username: string;
    first_name: string;
    last_name: string;
    company_name: string;
    categoryHints: string[];
  }
> = {
  owner: {
    key: "owner",
    role: "owner",
    label: "Proprietaire",
    href: "/dashboard/owner",
    username: "profil-proprietaire",
    first_name: "Profil",
    last_name: "Proprietaire",
    company_name: "Espace Proprietaire",
    categoryHints: ["proprietaire", "owner"],
  },
  concierge: {
    key: "concierge",
    role: "concierge",
    label: "Conciergerie",
    href: "/dashboard/concierge",
    username: "profil-conciergerie",
    first_name: "Profil",
    last_name: "Conciergerie",
    company_name: "Espace Conciergerie",
    categoryHints: ["concierge"],
  },
  provider: {
    key: "provider",
    role: "provider",
    label: "Artisan",
    href: "/dashboard/provider",
    username: "profil-artisan",
    first_name: "Profil",
    last_name: "Artisan",
    company_name: "Espace Artisan",
    categoryHints: ["artisan", "provider", "service"],
  },
  admin: {
    key: "admin",
    role: "admin",
    label: "Administrateur",
    href: "/dashboard/admin",
    username: "profil-admin",
    first_name: "Profil",
    last_name: "Administrateur",
    company_name: "Administration PlanetLS",
    categoryHints: ["admin", "proprietaire", "owner"],
  },
};

const quickLoginEnabled = process.env.WORKSPACE_QUICK_LOGIN_ENABLED === "true";
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetEmail = process.env.TARGET_EMAIL || process.env.ADMIN_EMAIL || "admin@planetls.fr";
const workspacePassword = process.env.WORKSPACE_PASSWORD || process.env.ADMIN_PASSWORD || "Admin123!";

function buildWorkspaceEmail(email: string, key: WorkspaceKey) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return `${key}.${email}`;
  return `${local}+${key}@${domain}`.toLowerCase();
}

function buildWorkspaceInfo(email: string, role: string) {
  return `workspace_parent_email:${email.toLowerCase()};workspace_role:${role}`;
}

function createAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Variables Supabase manquantes pour la connexion rapide.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function getValidCategories(supabase: ReturnType<typeof createAdminClient>) {
  const { data, error } = await supabase.from("categories").select("key").limit(1000);
  if (error) throw error;
  return (data ?? []).map((category) => category.key).filter(Boolean);
}

function pickCategory(validCategories: string[], hints: string[]) {
  for (const hint of hints) {
    const exact = validCategories.find((category) => category.toLowerCase() === hint.toLowerCase());
    if (exact) return exact;
  }

  for (const hint of hints) {
    const partial = validCategories.find((category) => category.toLowerCase().includes(hint.toLowerCase()));
    if (partial) return partial;
  }

  return validCategories[0] ?? null;
}

async function findExistingProfile(
  supabase: ReturnType<typeof createAdminClient>,
  email: string,
  role: string,
) {
  const marker = buildWorkspaceInfo(targetEmail, role);
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,role,category,username,additional_info")
    .or(`email.eq.${email},additional_info.ilike.%${marker}%`)
    .eq("role", role)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function findAuthUser(supabase: ReturnType<typeof createAdminClient>, email: string) {
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function findOrCreateAuthUser(
  supabase: ReturnType<typeof createAdminClient>,
  email: string,
  role: string,
) {
  const existing = await findAuthUser(supabase, email);

  if (existing?.id) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: workspacePassword,
      email_confirm: true,
      user_metadata: { role, linked_workspace: true, parent_email: targetEmail },
    });

    if (error) throw error;
    if (!data.user?.id) throw new Error(`Utilisateur auth introuvable apres mise a jour pour ${email}.`);
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: workspacePassword,
    email_confirm: true,
    user_metadata: { role, linked_workspace: true, parent_email: targetEmail },
  });

  if (error) throw error;
  if (!data.user?.id) throw new Error(`Utilisateur auth introuvable apres creation pour ${email}.`);
  return data.user;
}

async function ensureWorkspaceProfiles() {
  const supabase = createAdminClient();
  const validCategories = await getValidCategories(supabase);

  if (!validCategories.length) {
    throw new Error("Aucune categorie disponible dans Supabase.");
  }

  const result = new Map<WorkspaceKey, { email: string; password: string; href: string; label: string }>();

  for (const workspace of Object.values(WORKSPACES)) {
    const category = pickCategory(validCategories, workspace.categoryHints);
    if (!category) {
      throw new Error(`Aucune categorie compatible pour ${workspace.role}.`);
    }

    const workspaceEmail =
      workspace.key === "admin" ? targetEmail : buildWorkspaceEmail(targetEmail, workspace.key);
    const existingProfile = await findExistingProfile(supabase, workspaceEmail, workspace.role);
    const authUser = await findOrCreateAuthUser(supabase, workspaceEmail, workspace.role);
    const profileId = existingProfile?.id || authUser.id;

    const payload = {
      id: profileId,
      email: existingProfile?.email || workspaceEmail,
      username: existingProfile?.username || `${workspace.username}-${targetEmail.split("@")[0].toLowerCase()}`,
      first_name: workspace.first_name,
      last_name: workspace.last_name,
      company_name: workspace.company_name,
      role: workspace.role,
      category,
      additional_info: buildWorkspaceInfo(targetEmail, workspace.role),
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) throw error;

    result.set(workspace.key, {
      email: workspaceEmail,
      password: workspacePassword,
      href: workspace.href,
      label: workspace.label,
    });
  }

  return result;
}

export async function POST(req: NextRequest) {
  if (!quickLoginEnabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as { workspace?: WorkspaceKey };
  const workspaceKey = body.workspace;

  if (!workspaceKey || !(workspaceKey in WORKSPACES)) {
    return NextResponse.json({ error: "workspace is required" }, { status: 400 });
  }

  try {
    const accounts = await ensureWorkspaceProfiles();
    const account = accounts.get(workspaceKey);

    if (!account) {
      return NextResponse.json({ error: "Workspace account not available" }, { status: 404 });
    }

    return NextResponse.json(
      {
        workspace: workspaceKey,
        email: account.email,
        password: account.password,
        href: account.href,
        label: account.label,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("[dev-workspace-login] failed", error);
    return NextResponse.json({ error: "Unable to prepare test workspace account" }, { status: 500 });
  }
}
