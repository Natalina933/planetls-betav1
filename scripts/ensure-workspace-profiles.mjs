import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [rawKey, ...rawValue] = trimmed.split("=");
    const key = rawKey.trim();
    const value = rawValue.join("=").trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetEmail = process.env.TARGET_EMAIL || process.env.ADMIN_EMAIL || "admin@planetls.fr";
const workspacePassword = process.env.WORKSPACE_PASSWORD || process.env.ADMIN_PASSWORD || "Admin123!";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Variables Supabase manquantes: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const workspaceProfiles = [
  {
    key: "owner",
    role: "owner",
    username: "profil-proprietaire",
    first_name: "Profil",
    last_name: "Propriétaire",
    company_name: "Espace Propriétaire",
    categoryHints: ["proprietaire", "owner"],
  },
  {
    key: "concierge",
    role: "concierge",
    username: "profil-conciergerie",
    first_name: "Profil",
    last_name: "Conciergerie",
    company_name: "Espace Conciergerie",
    categoryHints: ["concierge"],
  },
  {
    key: "provider",
    role: "provider",
    username: "profil-artisan",
    first_name: "Profil",
    last_name: "Artisan",
    company_name: "Espace Artisan",
    categoryHints: ["artisan", "provider", "service"],
  },
  {
    key: "admin",
    role: "admin",
    username: "profil-admin",
    first_name: "Profil",
    last_name: "Administrateur",
    company_name: "Administration PlanetLS",
    categoryHints: ["admin", "proprietaire", "owner"],
  },
];

function buildWorkspaceEmail(email, key) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return `${key}.${email}`;
  return `${local}+${key}@${domain}`.toLowerCase();
}

function buildWorkspaceInfo(email, role) {
  return `workspace_parent_email:${email.toLowerCase()};workspace_role:${role}`;
}

async function getValidCategories() {
  const { data, error } = await supabase.from("categories").select("key").limit(1000);
  if (error) throw error;
  return (data ?? []).map((category) => category.key).filter(Boolean);
}

function pickCategory(validCategories, hints) {
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

async function findExistingProfile(email, role) {
  const marker = buildWorkspaceInfo(email, role);
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

async function findAuthUser(email) {
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

async function findOrCreateAuthUser(email, role) {
  const existing = await findAuthUser(email);
  if (existing?.id) return existing;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: workspacePassword,
    email_confirm: true,
    user_metadata: { role, linked_workspace: true, parent_email: targetEmail },
  });

  if (error) throw error;
  if (!data.user?.id) throw new Error(`Utilisateur auth introuvable après création pour ${email}.`);
  return data.user;
}

async function main() {
  const validCategories = await getValidCategories();
  if (!validCategories.length) throw new Error("Aucune catégorie disponible dans Supabase.");

  const authUser = await findAuthUser(targetEmail);
  const created = [];

  for (const workspace of workspaceProfiles) {
    const existing = await findExistingProfile(targetEmail, workspace.role);
    const category = pickCategory(validCategories, workspace.categoryHints);
    if (!category) throw new Error(`Aucune catégorie compatible pour ${workspace.role}.`);

    const workspaceEmail = workspace.role === "admin" ? targetEmail : buildWorkspaceEmail(targetEmail, workspace.key);
    const workspaceAuthUser =
      workspace.role === "admin" && authUser?.id
        ? authUser
        : await findOrCreateAuthUser(workspaceEmail, workspace.role);
    const profileId = existing?.id || workspaceAuthUser.id;

    const payload = {
      id: profileId,
      email: existing?.email || workspaceEmail,
      username: existing?.username || `${workspace.username}-${targetEmail.split("@")[0].toLowerCase()}`,
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

    created.push({
      role: workspace.role,
      id: profileId,
      category,
      status: existing ? "mis à jour" : "créé",
    });
  }

  console.log(`Profils rattachés à ${targetEmail}`);
  for (const profile of created) {
    console.log(`- ${profile.role}: ${profile.status} (${profile.id}) catégorie=${profile.category}`);
  }
}

main().catch((error) => {
  console.error("Erreur rattachement profils:", error);
  process.exit(1);
});
