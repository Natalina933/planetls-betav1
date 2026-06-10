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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL || "admin@planetls.fr";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Variables Supabase manquantes: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findUserByEmail(email) {
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

async function main() {
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("key")
    .limit(20);

  if (categoriesError) throw categoriesError;

  const fallbackCategory =
    categories?.find((category) => category.key === "proprietaire")?.key ||
    categories?.find((category) => category.key?.includes("proprietaire"))?.key ||
    categories?.[0]?.key ||
    null;

  if (!fallbackCategory) {
    throw new Error("Aucune catégorie valide disponible dans la table categories.");
  }

  const existingUser = await findUserByEmail(adminEmail);
  const authUser = existingUser
    ? (
        await supabase.auth.admin.updateUserById(existingUser.id, {
          password: adminPassword,
          email_confirm: true,
          user_metadata: { role: "admin" },
        })
      ).data.user
    : (
        await supabase.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: { role: "admin" },
        })
      ).data.user;

  if (!authUser?.id) {
    throw new Error("Impossible de créer ou mettre à jour l’utilisateur admin.");
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: authUser.id,
      email: adminEmail,
      username: "admin",
      first_name: "Admin",
      last_name: "PlanetLS",
      role: "admin",
      category: fallbackCategory,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profileError) throw profileError;

  console.log(`Compte administrateur prêt: ${adminEmail}`);
  console.log("Mot de passe: utilisez ADMIN_PASSWORD si vous l'avez défini, sinon Admin123! en local.");
}

main().catch((error) => {
  console.error("Erreur création admin:", error);
  process.exit(1);
});
