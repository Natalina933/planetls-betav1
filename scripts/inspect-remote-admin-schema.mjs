import fs from "node:fs";
import path from "node:path";

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

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Variables Supabase manquantes: SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.");
}

async function restProbe({ table, select }) {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  url.searchParams.set("select", select);
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
    },
  });

  const raw = await response.text();
  let body = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = raw;
  }

  return {
    status: response.status,
    ok: response.ok,
    select,
    body,
  };
}

async function main() {
  const probes = {
    missions: [
      "id",
      "id,title",
      "id,owner_profile_id,concierge_profile_id,status,created_at",
      "id,request_id",
      "id,provider_profile_id",
      "id,title,owner_profile_id,concierge_profile_id,provider_profile_id,status,created_at",
    ],
    quotes: [
      "id",
      "id,owner_profile_id,concierge_profile_id,created_at",
      "id,service_request_id,service_request_recipient_id",
      "id,provider_profile_id",
    ],
    invoices: [
      "id",
      "id,owner_profile_id,concierge_profile_id,status,created_at",
      "id,mission_id,quote_id",
      "id,provider_profile_id",
    ],
    provider_interventions: [
      "id",
      "id,title,provider_profile_id,owner_profile_id,status,created_at",
      "id,client_id,service_label,budget_amount,location_label",
    ],
  };

  const result = {};

  for (const [table, selects] of Object.entries(probes)) {
    result[table] = [];
    for (const select of selects) {
      try {
        const probe = await restProbe({ table, select });
        result[table].push(probe);
      } catch (error) {
        result[table].push({
          status: 0,
          ok: false,
          select,
          body: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  console.log(JSON.stringify({
    inspectedAt: new Date().toISOString(),
    supabaseUrl,
    result,
  }, null, 2));
}

main().catch((error) => {
  console.error("Erreur inspection schema admin distant:", error);
  process.exit(1);
});
