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
const scenarioId = "concierge-mission-recipe-v1";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Variables Supabase manquantes: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.");
}

const parsedUrl = new URL(supabaseUrl);
if (!["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
  throw new Error(`Seed refuse: environnement non local (${parsedUrl.origin}).`);
}

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function assertNoError(result, context) {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`);
  }
  return result.data;
}

function buildWorkspaceInfo(email, role) {
  return `workspace_parent_email:${email.toLowerCase()};workspace_role:${role}`;
}

async function workspaceProfile(role) {
  const marker = buildWorkspaceInfo(targetEmail, role);
  const data = assertNoError(
    await db
      .from("profiles")
      .select("id,email,role,category,first_name,last_name,company_name")
      .ilike("additional_info", `%${marker}%`)
      .eq("role", role)
      .limit(1)
      .maybeSingle(),
    `profil workspace ${role}`,
  );
  if (!data?.id) {
    throw new Error(`Profil workspace ${role} introuvable. Lancez d'abord scripts/ensure-workspace-profiles.mjs.`);
  }
  return data;
}

async function upsertHousing(owner, concierge) {
  const existingRows = assertNoError(
    await db
      .from("housing")
      .select("*")
      .eq("nom_logement", "Appartement Test PlanetLS")
      .eq("ville", "Paris")
      .limit(5),
    "housing lookup",
  );
  const existing = (existingRows ?? []).find((row) => row?.infos?.scenario_id === scenarioId) ?? null;
  const payload = {
    nom_logement: "Appartement Test PlanetLS",
    ville: "Paris",
    adresse: "1 rue de la Recette, 75001 Paris",
    plateforme: "Recette PlanetLS",
    statut: "active",
    photo_principale: "/images/default-logement.png",
    infos: {
      scenario_id: scenarioId,
      usage: "recette_creation_mission_concierge",
      property_type: "Appartement",
    },
    proprietaire: {
      id: owner.id,
      owner_profile_id: owner.id,
      manager_profile_id: concierge.id,
      full_name: "Owner Test PlanetLS",
      email: owner.email,
      source: "recipe_seed",
      scenario_id: scenarioId,
    },
    location: {
      city: "Paris",
      country: "France",
    },
    notes: {
      scenario_id: scenarioId,
      note: "Logement de recette minimal pour POST /api/missions.",
    },
  };

  if (existing?.id) {
    return assertNoError(
      await db.from("housing").update(payload).eq("id", existing.id).select("*").single(),
      "housing update",
    );
  }

  return assertNoError(
    await db.from("housing").insert(payload).select("*").single(),
    "housing creation",
  );
}

async function upsertCollaboration(owner, concierge, housing) {
  const existing = assertNoError(
    await db
      .from("housing_collaborations")
      .select("*")
      .eq("housing_id", housing.id)
      .eq("owner_profile_id", owner.id)
      .eq("concierge_profile_id", concierge.id)
      .limit(1)
      .maybeSingle(),
    "collaboration lookup",
  );

  const payload = {
    housing_id: housing.id,
    owner_profile_id: owner.id,
    concierge_profile_id: concierge.id,
    status: "active",
    collaboration_type: "one_off",
    frequency: "once",
    responsibility_level: "shared",
    handover_status: "ready",
    scope: {
      scenario_id: scenarioId,
      usage: "recette_creation_mission_concierge",
      services: ["controle_logement"],
    },
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    return assertNoError(
      await db.from("housing_collaborations").update(payload).eq("id", existing.id).select("*").single(),
      "collaboration update",
    );
  }

  return assertNoError(
    await db.from("housing_collaborations").insert(payload).select("*").single(),
    "collaboration creation",
  );
}

async function main() {
  const owner = await workspaceProfile("owner");
  const concierge = await workspaceProfile("concierge");
  const housing = await upsertHousing(owner, concierge);
  const collaboration = await upsertCollaboration(owner, concierge, housing);

  console.log(JSON.stringify({
    scenarioId,
    owner: { id: owner.id, email: owner.email, label: "Owner Test PlanetLS" },
    concierge: { id: concierge.id, email: concierge.email, label: "Concierge Test PlanetLS" },
    housing: { id: housing.id, name: housing.nom_logement, city: housing.ville },
    collaboration: { id: collaboration.id, status: collaboration.status },
  }, null, 2));
}

main().catch((error) => {
  console.error("Erreur seed recette mission concierge:", error);
  process.exit(1);
});
