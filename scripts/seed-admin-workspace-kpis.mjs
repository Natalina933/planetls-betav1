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

const scenarioId = "admin-workspace-kpis-v1";
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetEmail = (process.env.TARGET_EMAIL || process.env.ADMIN_EMAIL || "admin@planetls.fr").toLowerCase();
const workspacePassword = process.env.WORKSPACE_PASSWORD || process.env.ADMIN_PASSWORD || "Admin123!";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Variables Supabase manquantes: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.");
}

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const roleConfigs = {
  owner: {
    key: "owner",
    role: "owner",
    username: "profil-proprietaire",
    firstName: "Profil",
    lastName: "Proprietaire",
    companyName: "Espace Proprietaire",
    categoryHints: ["proprietaire", "owner"],
    city: "Nice",
    supportCities: ["Cannes", "Antibes"],
    serviceArea: "Nice, Cannes, Antibes",
    hourlyRate: null,
    monthlyRate: null,
  },
  concierge: {
    key: "concierge",
    role: "concierge",
    username: "profil-conciergerie",
    firstName: "Profil",
    lastName: "Conciergerie",
    companyName: "Espace Conciergerie",
    categoryHints: ["concierge"],
    city: "Paris",
    supportCities: ["Lyon", "Bordeaux"],
    serviceArea: "Paris, Lyon, Bordeaux",
    hourlyRate: 42,
    monthlyRate: 790,
  },
  provider: {
    key: "provider",
    role: "provider",
    username: "profil-artisan",
    firstName: "Profil",
    lastName: "Artisan",
    companyName: "Espace Artisan",
    categoryHints: ["artisan", "provider", "service"],
    city: "Marseille",
    supportCities: ["Toulouse", "Montpellier"],
    serviceArea: "Marseille, Toulouse, Montpellier",
    hourlyRate: 58,
    monthlyRate: null,
  },
  admin: {
    key: "admin",
    role: "admin",
    username: "profil-admin",
    firstName: "Profil",
    lastName: "Administrateur",
    companyName: "Administration PlanetLS",
    categoryHints: ["admin", "proprietaire", "owner"],
    city: "Paris",
    supportCities: ["Paris"],
    serviceArea: "France",
    hourlyRate: null,
    monthlyRate: null,
  },
};

const cohortSlots = [
  { slot: 1, ageDays: 26, activated: { owner: true, concierge: true, provider: true }, invoicePaid: true, responseMinutes: 18 },
  { slot: 2, ageDays: 24, activated: { owner: true, concierge: false, provider: true }, invoicePaid: true, responseMinutes: 22 },
  { slot: 3, ageDays: 18, activated: { owner: true, concierge: true, provider: true }, invoicePaid: true, responseMinutes: 27 },
  { slot: 4, ageDays: 16, activated: { owner: false, concierge: false, provider: true }, invoicePaid: false, responseMinutes: 34 },
  { slot: 5, ageDays: 12, activated: { owner: true, concierge: true, provider: false }, invoicePaid: false, responseMinutes: 41 },
  { slot: 6, ageDays: 10, activated: { owner: false, concierge: false, provider: true }, invoicePaid: false, responseMinutes: 52 },
];

function assertNoError(result, context) {
  if (result.error) {
    console.error(`[${context}]`, result.error);
    throw new Error(`${context}: ${result.error.message}`);
  }
  return result.data;
}

function isSchemaCacheError(error) {
  return error?.code === "PGRST204";
}

function buildWorkspaceEmail(email, key) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return `${key}.${email}`;
  return `${local}+${key}@${domain}`.toLowerCase();
}

function buildSeedEmail(email, role, slot) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return `${role}.kpi.${slot}.${email}`;
  return `${local}+${role}-kpi-${String(slot).padStart(2, "0")}@${domain}`.toLowerCase();
}

function buildWorkspaceInfo(email, role, slot, scenario) {
  return [
    `workspace_parent_email:${email.toLowerCase()}`,
    `workspace_role:${role}`,
    `workspace_seed:admin_kpis`,
    `workspace_slot:${String(slot).padStart(2, "0")}`,
    `workspace_scenario:${scenario}`,
  ].join(";");
}

function plusMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function plusDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function getValidCategories() {
  const { data, error } = await db.from("categories").select("key").limit(1000);
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

async function findAuthUser(email) {
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function findOrCreateAuthUser(email, role) {
  const existing = await findAuthUser(email);

  if (existing?.id) {
    const { data, error } = await db.auth.admin.updateUserById(existing.id, {
      password: workspacePassword,
      email_confirm: true,
      user_metadata: { role, linked_workspace: true, parent_email: targetEmail, scenario_id: scenarioId },
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await db.auth.admin.createUser({
    email,
    password: workspacePassword,
    email_confirm: true,
    user_metadata: { role, linked_workspace: true, parent_email: targetEmail, scenario_id: scenarioId },
  });
  if (error) throw error;
  return data.user;
}

async function findProfileByEmail(email, role) {
  const { data, error } = await db
    .from("profiles")
    .select("id, email, role, username")
    .eq("email", email)
    .eq("role", role)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function ensureSeedProfile({
  email,
  role,
  slot,
  createdAt,
  category,
  city,
  serviceArea,
  hourlyRate,
  monthlyRate,
}) {
  const config = roleConfigs[role];
  const existing = await findProfileByEmail(email, role);
  const authUser = await findOrCreateAuthUser(email, role);
  if (!authUser?.id) throw new Error(`Utilisateur auth introuvable pour ${email}.`);
  const profileId = authUser.id || existing?.id || crypto.randomUUID();

  const payload = {
    id: profileId,
    email,
    username: `${config.username}-${String(slot).padStart(2, "0")}-${targetEmail.split("@")[0].toLowerCase()}`,
    first_name: config.firstName,
    last_name: config.lastName,
    company_name: `${config.companyName} ${String(slot).padStart(2, "0")}`,
    role,
    category,
    city,
    location: city,
    service_area: serviceArea,
    hourly_rate: hourlyRate,
    monthly_rate: monthlyRate,
    onboarding_complete: true,
    onboarding_completed_at: plusMinutes(createdAt, 90).toISOString(),
    status: "active",
    additional_info: buildWorkspaceInfo(targetEmail, role, slot, scenarioId),
    created_at: createdAt.toISOString(),
    updated_at: new Date().toISOString(),
  };

  assertNoError(await db.from("profiles").upsert(payload, { onConflict: "id" }), `profile upsert ${email}`);
  return { id: profileId, email, role, city };
}

async function upsertProperty(ownerProfile, slot) {
  const propertyName = `Workspace KPI ${String(slot).padStart(2, "0")} - ${ownerProfile.city}`;
  const { data, error } = await db
    .from("properties")
    .select("id")
    .eq("owner_id", ownerProfile.id)
    .eq("name", propertyName)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  const payload = {
    name: propertyName,
    owner_id: ownerProfile.id,
    city: ownerProfile.city,
    status: "active",
  };

  if (data?.id) {
    const updated = assertNoError(
      await db.from("properties").update(payload).eq("id", data.id).select("id, name").single(),
      `property update ${propertyName}`,
    );
    return updated;
  }

  return assertNoError(
    await db.from("properties").insert(payload).select("id, name").single(),
    `property create ${propertyName}`,
  );
}

async function cleanupScenario() {
  const onboardingRows = assertNoError(
    await db.from("onboarding_events").select("id").contains("metadata", { scenario_id: scenarioId }),
    "onboarding cleanup lookup",
  );
  const onboardingIds = (onboardingRows ?? []).map((row) => row.id);
  if (onboardingIds.length > 0) {
    assertNoError(await db.from("onboarding_events").delete().in("id", onboardingIds), "onboarding cleanup");
  }

  const conversationRows = assertNoError(
    await db.from("contact_conversations").select("id").contains("metadata", { scenario_id: scenarioId }),
    "conversation cleanup lookup",
  );
  const conversationIds = (conversationRows ?? []).map((row) => row.id);
  if (conversationIds.length > 0) {
    await db.from("contact_messages").delete().in("conversation_id", conversationIds);
    assertNoError(await db.from("contact_conversations").delete().in("id", conversationIds), "conversation cleanup");
  }

  const missionRows = assertNoError(
    await db.from("missions").select("id, property_id").contains("metadata", { scenario_id: scenarioId }),
    "mission cleanup lookup",
  );
  const missionIds = (missionRows ?? []).map((row) => row.id);
  if (missionIds.length > 0) {
    await db.from("mission_events").delete().in("mission_id", missionIds);
    await db.from("workflow_events").delete().in("mission_id", missionIds);
  }

  const invoiceRows = assertNoError(
    await db.from("invoices").select("id, quote_id").contains("metadata", { scenario_id: scenarioId }),
    "invoice cleanup lookup",
  );
  const invoiceIds = (invoiceRows ?? []).map((row) => row.id);
  if (invoiceIds.length > 0) {
    await db.from("invoice_items").delete().in("invoice_id", invoiceIds);
    assertNoError(await db.from("invoices").delete().in("id", invoiceIds), "invoice cleanup");
  }

  const quoteRows = assertNoError(
    await db.from("quotes").select("id").contains("metadata", { scenario_id: scenarioId }),
    "quote cleanup lookup",
  );
  const quoteIds = (quoteRows ?? []).map((row) => row.id);
  if (quoteIds.length > 0) {
    await db.from("quote_items").delete().in("quote_id", quoteIds);
    await db.from("workflow_events").delete().in("quote_id", quoteIds);
    assertNoError(await db.from("quotes").delete().in("id", quoteIds), "quote cleanup");
  }

  const requestRows = assertNoError(
    await db.from("service_requests").select("id, property_id").contains("metadata", { scenario_id: scenarioId }),
    "request cleanup lookup",
  );
  const requestIds = (requestRows ?? []).map((row) => row.id);
  if (requestIds.length > 0) {
    await db.from("workflow_events").delete().in("service_request_id", requestIds);
    assertNoError(await db.from("service_requests").delete().in("id", requestIds), "request cleanup");
  }

  const providerInterventionRows = assertNoError(
    await db.from("provider_interventions").select("id, client_id").contains("metadata", { scenario_id: scenarioId }),
    "provider intervention cleanup lookup",
  );
  const providerInterventionIds = (providerInterventionRows ?? []).map((row) => row.id);
  if (providerInterventionIds.length > 0) {
    assertNoError(await db.from("provider_interventions").delete().in("id", providerInterventionIds), "provider intervention cleanup");
  }

  const providerClientIds = [...new Set((providerInterventionRows ?? []).map((row) => row.client_id).filter(Boolean))];
  if (providerClientIds.length > 0) {
    assertNoError(await db.from("provider_clients").delete().in("id", providerClientIds), "provider client cleanup");
  }

  if (missionIds.length > 0) {
    assertNoError(await db.from("missions").delete().in("id", missionIds), "mission cleanup");
  }

  const propertyIds = [...new Set([
    ...(missionRows ?? []).map((row) => row.property_id).filter(Boolean),
    ...(requestRows ?? []).map((row) => row.property_id).filter(Boolean),
  ])];
  if (propertyIds.length > 0) {
    assertNoError(await db.from("properties").delete().in("id", propertyIds), "property cleanup");
  }
}

async function seedOnboardingEvents(profilesByRole) {
  const rows = [];

  for (const [role, profiles] of Object.entries(profilesByRole)) {
    for (const profile of profiles) {
      const createdAt = new Date(profile.created_at);
      rows.push(
        {
          event_name: "onboarding_started",
          step_index: 1,
          category: role,
          persona_hint: role,
          path: `/onboarding/${role}`,
          metadata: {
            scenario_id: scenarioId,
            parent_email: targetEmail,
            profile_id: profile.id,
            profile_email: profile.email,
            workspace_role: role,
          },
          occurred_at: plusMinutes(createdAt, 5).toISOString(),
          user_agent: "seed-admin-workspace-kpis",
        },
        {
          event_name: "onboarding_account_created",
          step_index: 5,
          category: role,
          persona_hint: role,
          path: `/dashboard/${role}`,
          metadata: {
            scenario_id: scenarioId,
            parent_email: targetEmail,
            profile_id: profile.id,
            profile_email: profile.email,
            workspace_role: role,
          },
          occurred_at: plusMinutes(createdAt, 65).toISOString(),
          user_agent: "seed-admin-workspace-kpis",
        },
      );
    }
  }

  assertNoError(await db.from("onboarding_events").insert(rows), "onboarding seed");
}

async function seedOperationalData(seedRows) {
  const summary = [];

  for (const row of seedRows) {
    const requestCreatedAt = plusMinutes(row.owner.createdAt, row.slot * 14 + 30);
    const quoteCreatedAt = plusDays(row.concierge.createdAt, row.slot % 2 === 0 ? 8 : 2);
    const missionCreatedAt = plusDays(row.provider.createdAt, row.slot % 2 === 0 ? 5 : 3);
    const invoiceCreatedAt = plusMinutes(missionCreatedAt, 120);
    const responseAt = plusMinutes(requestCreatedAt, row.responseMinutes);

    const property = await upsertProperty(row.owner.profile, row.slot);

    const request = assertNoError(
      await db
        .from("service_requests")
        .insert({
          owner_profile_id: row.owner.profile.id,
          property_id: property.id,
          selected_concierge_profile_id: row.concierge.profile.id,
          request_type: row.slot % 2 === 0 ? "durable" : "ponctuel",
          status: row.conciergeActivated || row.providerActivated ? "accepted" : "quoted",
          title: `Demande workspace KPI ${String(row.slot).padStart(2, "0")}`,
          description: `Demande rattachee au seed ${scenarioId} pour ${row.owner.profile.city}.`,
          requested_services: ["check-in/out", "linge", "maintenance legere"],
          city: row.owner.profile.city,
          postal_code: `06${String(row.slot).padStart(3, "0")}`,
          desired_date: plusDays(requestCreatedAt, 10).toISOString(),
          urgency: row.slot === 1 || row.slot === 4,
          budget_max: 900 + row.slot * 50,
          currency: "EUR",
          metadata: {
            scenario_id: scenarioId,
            parent_email: targetEmail,
            slot: row.slot,
            owner_seed_email: row.owner.profile.email,
            concierge_seed_email: row.concierge.profile.email,
            provider_seed_email: row.provider.profile.email,
          },
          created_at: requestCreatedAt.toISOString(),
          updated_at: requestCreatedAt.toISOString(),
        })
        .select("id, status")
        .single(),
      `service request create slot ${row.slot}`,
    );

    const recipient = assertNoError(
      await db
        .from("service_request_recipients")
        .insert({
          service_request_id: request.id,
          concierge_profile_id: row.concierge.profile.id,
          status: row.conciergeActivated || row.providerActivated ? "selected" : "quoted",
          response_message: "Proposition seedee pour alimenter le cockpit admin.",
          viewed_at: plusMinutes(requestCreatedAt, 12).toISOString(),
          responded_at: row.conciergeActivated ? quoteCreatedAt.toISOString() : plusDays(requestCreatedAt, 9).toISOString(),
          metadata: {
            scenario_id: scenarioId,
            parent_email: targetEmail,
            slot: row.slot,
          },
          created_at: plusMinutes(requestCreatedAt, 3).toISOString(),
          updated_at: plusMinutes(requestCreatedAt, 3).toISOString(),
        })
        .select("id")
        .single(),
      `recipient create slot ${row.slot}`,
    );

    const quote = assertNoError(
      await db
        .from("quotes")
        .insert({
          quote_number: `DEV-KPI-${String(row.slot).padStart(2, "0")}-${Date.now()}`,
          concierge_profile_id: row.concierge.profile.id,
          owner_profile_id: row.owner.profile.id,
          service_request_id: request.id,
          service_request_recipient_id: recipient.id,
          status: row.conciergeActivated ? "accepted" : "sent",
          currency: "EUR",
          subtotal: 420 + row.slot * 35,
          discount_amount: 0,
          tax_rate: 0,
          tax_amount: 0,
          total_amount: 420 + row.slot * 35,
          valid_until: plusDays(quoteCreatedAt, 21).toISOString().slice(0, 10),
          notes: `Devis seed KPI slot ${row.slot}`,
          metadata: {
            scenario_id: scenarioId,
            parent_email: targetEmail,
            slot: row.slot,
            provider_profile_id: row.provider.profile.id,
          },
          sent_at: plusMinutes(quoteCreatedAt, -10).toISOString(),
          accepted_at: row.conciergeActivated ? plusMinutes(quoteCreatedAt, 35).toISOString() : null,
          created_at: quoteCreatedAt.toISOString(),
          updated_at: quoteCreatedAt.toISOString(),
        })
        .select("id, status, quote_number")
        .single(),
      `quote create slot ${row.slot}`,
    );

    assertNoError(
      await db.from("quote_items").insert([
        {
          quote_id: quote.id,
          label: "Check-in/out",
          description: `Lot seed ${row.slot}`,
          quantity: 1,
          unit_price: 180,
          line_total: 180,
          sort_order: 0,
          metadata: { scenario_id: scenarioId, slot: row.slot },
          created_at: quoteCreatedAt.toISOString(),
        },
        {
          quote_id: quote.id,
          label: "Linge",
          description: `Lot seed ${row.slot}`,
          quantity: 1,
          unit_price: 120 + row.slot * 10,
          line_total: 120 + row.slot * 10,
          sort_order: 1,
          metadata: { scenario_id: scenarioId, slot: row.slot },
          created_at: quoteCreatedAt.toISOString(),
        },
      ]),
      `quote items slot ${row.slot}`,
    );

    let mission = null;
    const missionInsertResult = await db
      .from("missions")
      .insert({
        concierge_profile_id: row.concierge.profile.id,
        owner_profile_id: row.owner.profile.id,
        property_id: property.id,
        title: `Mission workspace KPI ${String(row.slot).padStart(2, "0")}`,
        description: `Mission seedee pour le cockpit admin (${scenarioId}).`,
        status: row.providerActivated ? (row.invoicePaid ? "completed" : "accepted") : "assigned",
        priority: row.slot === 1 ? "urgent" : row.slot === 4 ? "high" : "normal",
        amount: 380 + row.slot * 40,
        currency: "EUR",
        scheduled_start: plusDays(missionCreatedAt, 1).toISOString(),
        scheduled_end: plusDays(missionCreatedAt, 1).toISOString(),
        started_at: row.providerActivated ? plusMinutes(missionCreatedAt, 45).toISOString() : null,
        completed_at: row.providerActivated && row.invoicePaid ? plusMinutes(missionCreatedAt, 180).toISOString() : null,
        metadata: {
          scenario_id: scenarioId,
          parent_email: targetEmail,
          slot: row.slot,
          quote_id: quote.id,
          service_request_id: request.id,
        },
        created_at: missionCreatedAt.toISOString(),
        updated_at: missionCreatedAt.toISOString(),
      })
      .select("id, status")
      .single();
    if (missionInsertResult.error) {
      if (!isSchemaCacheError(missionInsertResult.error)) {
        assertNoError(missionInsertResult, `mission create slot ${row.slot}`);
      }
    } else {
      mission = missionInsertResult.data;
    }

    const providerClient = assertNoError(
      await db
        .from("provider_clients")
        .insert({
          provider_profile_id: row.provider.profile.id,
          owner_profile_id: row.owner.profile.id,
          client_name: `Client workspace KPI ${String(row.slot).padStart(2, "0")}`,
          company_name: row.owner.profile.city,
          email: row.owner.profile.email,
          city: row.owner.profile.city,
          client_type: "owner",
          status: "active",
          notes: `Client seed pour ${scenarioId}`,
          metadata: {
            scenario_id: scenarioId,
            parent_email: targetEmail,
            slot: row.slot,
            mission_id: mission?.id ?? null,
          },
          created_at: missionCreatedAt.toISOString(),
          updated_at: missionCreatedAt.toISOString(),
        })
        .select("id")
        .single(),
      `provider client create slot ${row.slot}`,
    );

    const providerIntervention = assertNoError(
      await db
        .from("provider_interventions")
        .insert({
          provider_profile_id: row.provider.profile.id,
          client_id: providerClient.id,
          owner_profile_id: row.owner.profile.id,
          title: `Intervention workspace KPI ${String(row.slot).padStart(2, "0")}`,
          description: `Intervention seedee pour alimenter l'activation provider (${scenarioId}).`,
          service_label: "Maintenance legere",
          status: row.providerActivated ? (row.invoicePaid ? "completed" : "accepted") : "pending",
          priority: row.slot === 1 ? "urgent" : row.slot === 4 ? "high" : "normal",
          scheduled_start: plusDays(missionCreatedAt, 1).toISOString(),
          scheduled_end: plusDays(missionCreatedAt, 1).toISOString(),
          budget_amount: 210 + row.slot * 20,
          currency: "EUR",
          location_label: property.name,
          metadata: {
            scenario_id: scenarioId,
            parent_email: targetEmail,
            slot: row.slot,
            mission_id: mission?.id ?? null,
            quote_id: quote.id,
          },
          created_at: missionCreatedAt.toISOString(),
          updated_at: missionCreatedAt.toISOString(),
        })
        .select("id, status")
        .single(),
      `provider intervention create slot ${row.slot}`,
    );

    if (mission?.id) {
      assertNoError(
        await db.from("quotes").update({ mission_id: mission.id }).eq("id", quote.id),
        `quote mission link slot ${row.slot}`,
      );
    }

    const invoiceStatus = row.invoicePaid ? "paid" : row.providerActivated ? "issued" : "draft";
    const paidAmount = row.invoicePaid ? 380 + row.slot * 40 : 0;
    const invoice = assertNoError(
      await db
        .from("invoices")
        .insert({
          quote_id: quote.id,
          concierge_profile_id: row.concierge.profile.id,
          owner_profile_id: row.owner.profile.id,
          mission_id: mission?.id ?? null,
          status: invoiceStatus,
          issue_date: invoiceCreatedAt.toISOString().slice(0, 10),
          due_date: plusDays(invoiceCreatedAt, 15).toISOString().slice(0, 10),
          currency: "EUR",
          subtotal: 380 + row.slot * 40,
          discount_amount: 0,
          tax_rate: 0,
          tax_amount: 0,
          total_amount: 380 + row.slot * 40,
          paid_amount: paidAmount,
          balance_amount: Math.max(0, 380 + row.slot * 40 - paidAmount),
          notes: `Facture seed KPI slot ${row.slot}`,
          metadata: {
            scenario_id: scenarioId,
            parent_email: targetEmail,
            slot: row.slot,
          },
          issued_at: invoiceCreatedAt.toISOString(),
          paid_at: row.invoicePaid ? plusMinutes(invoiceCreatedAt, 90).toISOString() : null,
          created_at: invoiceCreatedAt.toISOString(),
          updated_at: invoiceCreatedAt.toISOString(),
        })
        .select("id, status")
        .single(),
      `invoice create slot ${row.slot}`,
    );

    assertNoError(
      await db.from("invoice_items").insert([
        {
          invoice_id: invoice.id,
          label: "Execution mission",
          description: `Facturation seed ${row.slot}`,
          quantity: 1,
          unit_price: 380 + row.slot * 40,
          line_total: 380 + row.slot * 40,
          sort_order: 0,
          metadata: { scenario_id: scenarioId, slot: row.slot },
          created_at: invoiceCreatedAt.toISOString(),
        },
      ]),
      `invoice items slot ${row.slot}`,
    );

    const conversation = assertNoError(
      await db
        .from("contact_conversations")
        .insert({
          owner_profile_id: row.owner.profile.id,
          concierge_profile_id: row.concierge.profile.id,
          source: mission?.id ? "mission" : "quote",
          source_reference: mission?.id ?? quote.id,
          subject: `Suivi workspace KPI ${String(row.slot).padStart(2, "0")}`,
          status: "open",
          last_message_preview: "Seed KPI admin",
          last_message_at: responseAt.toISOString(),
          metadata: {
            scenario_id: scenarioId,
            parent_email: targetEmail,
            slot: row.slot,
            mission_id: mission?.id ?? null,
          },
          created_at: requestCreatedAt.toISOString(),
          updated_at: responseAt.toISOString(),
        })
        .select("id")
        .single(),
      `conversation create slot ${row.slot}`,
    );

    assertNoError(
      await db.from("contact_messages").insert([
        {
          conversation_id: conversation.id,
          sender_profile_id: row.owner.profile.id,
          message_type: "text",
          body: `Bonjour, voici le besoin seed KPI ${row.slot}.`,
          metadata: { scenario_id: scenarioId, slot: row.slot },
          created_at: requestCreatedAt.toISOString(),
        },
        {
          conversation_id: conversation.id,
          sender_profile_id: row.concierge.profile.id,
          message_type: "text",
          body: `Nous prenons en charge le dossier ${row.slot}.`,
          metadata: { scenario_id: scenarioId, slot: row.slot },
          created_at: responseAt.toISOString(),
        },
        {
          conversation_id: conversation.id,
          sender_profile_id: row.concierge.profile.id,
          message_type: "text",
          body: `Compte rendu seed pour le lot ${row.slot}.`,
          metadata: { scenario_id: scenarioId, slot: row.slot },
          created_at: plusMinutes(responseAt, 48).toISOString(),
        },
      ]),
      `messages slot ${row.slot}`,
    );

    if (mission?.id) {
      assertNoError(
        await db.from("mission_events").insert([
          {
            mission_id: mission.id,
            actor_profile_id: row.concierge.profile.id,
            event_type: "created",
            payload: { scenario_id: scenarioId, slot: row.slot, stage: "seed_created" },
            created_at: missionCreatedAt.toISOString(),
          },
          {
            mission_id: mission.id,
            actor_profile_id: row.provider.profile.id,
            event_type: row.providerActivated ? "started" : "assigned",
            payload: { scenario_id: scenarioId, slot: row.slot, stage: "seed_progress" },
            created_at: plusMinutes(missionCreatedAt, 55).toISOString(),
          },
        ]),
        `mission events slot ${row.slot}`,
      );
    }

    assertNoError(
      await db.from("workflow_events").insert([
        {
          actor_profile_id: row.owner.profile.id,
          owner_profile_id: row.owner.profile.id,
          concierge_profile_id: row.concierge.profile.id,
          service_request_id: request.id,
          service_request_recipient_id: recipient.id,
          event_type: "service_request_sent",
          request_workflow_status: "sent",
          title: "Demande envoyee",
          body: `Le lot ${row.slot} a ete envoye.`,
          action_href: `/dashboard/admin/demandes?search=${request.id}`,
          metadata: { scenario_id: scenarioId, slot: row.slot },
          created_at: requestCreatedAt.toISOString(),
        },
        {
          actor_profile_id: row.concierge.profile.id,
          owner_profile_id: row.owner.profile.id,
          concierge_profile_id: row.concierge.profile.id,
          service_request_id: request.id,
          service_request_recipient_id: recipient.id,
          quote_id: quote.id,
          event_type: "service_request_quoted",
          request_workflow_status: "quoted",
          quote_workflow_status: row.conciergeActivated ? "accepted" : "sent",
          title: "Devis emis",
          body: `Le devis du lot ${row.slot} alimente les KPI admin.`,
          action_href: `/dashboard/admin/demandes?search=${quote.id}`,
          metadata: { scenario_id: scenarioId, slot: row.slot },
          created_at: quoteCreatedAt.toISOString(),
        },
        {
          actor_profile_id: row.provider.profile.id,
          owner_profile_id: row.owner.profile.id,
          concierge_profile_id: row.concierge.profile.id,
          service_request_id: request.id,
          service_request_recipient_id: recipient.id,
          quote_id: quote.id,
          mission_id: mission?.id ?? null,
          event_type: "mission_seeded",
          request_workflow_status: "accepted",
          quote_workflow_status: row.conciergeActivated ? "accepted" : "sent",
          mission_workflow_status: mission?.status ?? providerIntervention.status,
          title: mission?.id ? "Mission rattachee" : "Intervention rattachee",
          body: mission?.id
            ? `Mission et facture creees pour le lot ${row.slot}.`
            : `Intervention provider et facture creees pour le lot ${row.slot}.`,
          action_href: mission?.id
            ? `/dashboard/admin/missions?search=${mission.id}`
            : `/dashboard/admin/artisans?search=${row.provider.profile.id}`,
          metadata: { scenario_id: scenarioId, slot: row.slot, invoice_id: invoice.id, mission_id: mission?.id ?? null },
          created_at: missionCreatedAt.toISOString(),
        },
      ]),
      `workflow events slot ${row.slot}`,
    );

    summary.push({
      slot: row.slot,
      owner: row.owner.profile.email,
      concierge: row.concierge.profile.email,
      provider: row.provider.profile.email,
      requestId: request.id,
      quoteId: quote.id,
      missionId: mission?.id ?? null,
      providerInterventionId: providerIntervention.id,
      invoiceId: invoice.id,
      statuses: {
        request: request.status,
        quote: quote.status,
        mission: mission?.status ?? "not_seeded",
        invoice: invoice.status,
      },
    });
  }

  return summary;
}

async function main() {
  const validCategories = await getValidCategories();
  if (!validCategories.length) {
    throw new Error("Aucune categorie disponible dans Supabase.");
  }

  await cleanupScenario();

  const now = new Date();
  const primaryWorkspaceProfiles = {};
  const profilesByRole = { owner: [], concierge: [], provider: [] };

  for (const role of ["owner", "concierge", "provider", "admin"]) {
    const config = roleConfigs[role];
    const category = pickCategory(validCategories, config.categoryHints);
    if (!category) {
      throw new Error(`Aucune categorie compatible pour ${role}.`);
    }

    if (role === "admin") {
      await ensureSeedProfile({
        email: targetEmail,
        role,
        slot: 1,
        createdAt: plusDays(now, -2),
        category,
        city: config.city,
        serviceArea: config.serviceArea,
        hourlyRate: config.hourlyRate,
        monthlyRate: config.monthlyRate,
      });
      continue;
    }

    for (const slotConfig of cohortSlots) {
      const city =
        slotConfig.slot <= 3
          ? config.city
          : config.supportCities[(slotConfig.slot - 4) % config.supportCities.length] ?? config.city;
      const createdAt = plusDays(now, -slotConfig.ageDays);
      const email =
        slotConfig.slot === 1
          ? buildWorkspaceEmail(targetEmail, config.key)
          : buildSeedEmail(targetEmail, role, slotConfig.slot);
      const profile = await ensureSeedProfile({
        email,
        role,
        slot: slotConfig.slot,
        createdAt,
        category,
        city,
        serviceArea: config.serviceArea,
        hourlyRate: config.hourlyRate,
        monthlyRate: config.monthlyRate,
      });

      const enrichedProfile = {
        ...profile,
        created_at: createdAt.toISOString(),
        slot: slotConfig.slot,
      };

      profilesByRole[role].push(enrichedProfile);
      if (slotConfig.slot === 1) primaryWorkspaceProfiles[role] = enrichedProfile;
    }
  }

  await seedOnboardingEvents(profilesByRole);

  const seedRows = cohortSlots.map((slotConfig) => ({
    slot: slotConfig.slot,
    responseMinutes: slotConfig.responseMinutes,
    invoicePaid: slotConfig.invoicePaid,
    ownerActivated: slotConfig.activated.owner,
    conciergeActivated: slotConfig.activated.concierge,
    providerActivated: slotConfig.activated.provider,
    owner: {
      profile: profilesByRole.owner.find((profile) => profile.slot === slotConfig.slot),
      createdAt: new Date(profilesByRole.owner.find((profile) => profile.slot === slotConfig.slot).created_at),
    },
    concierge: {
      profile: profilesByRole.concierge.find((profile) => profile.slot === slotConfig.slot),
      createdAt: new Date(profilesByRole.concierge.find((profile) => profile.slot === slotConfig.slot).created_at),
    },
    provider: {
      profile: profilesByRole.provider.find((profile) => profile.slot === slotConfig.slot),
      createdAt: new Date(profilesByRole.provider.find((profile) => profile.slot === slotConfig.slot).created_at),
    },
  }));

  const operationalSummary = await seedOperationalData(seedRows);

  console.log(JSON.stringify({
    scenarioId,
    parentEmail: targetEmail,
    workspaceProfiles: {
      owner: primaryWorkspaceProfiles.owner?.email ?? null,
      concierge: primaryWorkspaceProfiles.concierge?.email ?? null,
      provider: primaryWorkspaceProfiles.provider?.email ?? null,
    },
    seededProfiles: {
      owner: profilesByRole.owner.length,
      concierge: profilesByRole.concierge.length,
      provider: profilesByRole.provider.length,
    },
    operationalSummary,
  }, null, 2));
}

main().catch((error) => {
  console.error("Erreur seed admin workspace KPI:", error);
  process.exit(1);
});
