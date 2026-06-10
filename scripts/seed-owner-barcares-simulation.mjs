import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const scenarioId = "owner-barcares-2026-06-12";
const ownerEmail = "Proprio123@fee.fr";
const desiredStart = "2026-06-12T10:00:00+02:00";
const desiredEnd = "2026-06-12T16:00:00+02:00";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

function assertNoError(result, context) {
  if (result.error) {
    console.error(context, result.error);
    throw new Error(`${context}: ${result.error.message}`);
  }
  return result.data;
}

function profileLabel(profile) {
  return (
    profile.company_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    profile.username ||
    profile.email
  );
}

function money(value) {
  return Math.round(value * 100) / 100;
}

async function deleteConversationsBySource(source, references) {
  if (!references.length) return;
  const conversations = assertNoError(
    await db
      .from("contact_conversations")
      .select("id")
      .eq("source", source)
      .in("source_reference", references),
    `${source} conversations lookup`,
  );
  const conversationIds = (conversations ?? []).map((row) => row.id);
  if (conversationIds.length > 0) {
    await db.from("contact_messages").delete().in("conversation_id", conversationIds);
    await db.from("contact_conversations").delete().in("id", conversationIds);
  }
}

async function findOwner() {
  const data = assertNoError(
    await db
      .from("profiles")
      .select("id, email, first_name, last_name, username, role, company_name")
      .ilike("email", ownerEmail)
      .limit(1)
      .maybeSingle(),
    "owner lookup",
  );

  if (!data?.id) {
    throw new Error(`Profil propriétaire introuvable pour ${ownerEmail}.`);
  }

  return data;
}

async function cleanupScenario() {
  const missionRows = assertNoError(
    await db.from("missions").select("id").contains("metadata", { scenario_id: scenarioId }),
    "scenario missions lookup",
  );
  const missionIds = (missionRows ?? []).map((row) => row.id);
  if (missionIds.length > 0) {
    await deleteConversationsBySource("mission", missionIds);
    await db.from("mission_events").delete().in("mission_id", missionIds);
    await db.from("workflow_events").delete().in("mission_id", missionIds);
    assertNoError(await db.from("missions").delete().in("id", missionIds), "scenario missions cleanup");
  }

  const quoteRows = assertNoError(
    await db.from("quotes").select("id").contains("metadata", { scenario_id: scenarioId }),
    "scenario quotes lookup",
  );
  const quoteIds = (quoteRows ?? []).map((row) => row.id);
  if (quoteIds.length > 0) {
    await deleteConversationsBySource("quote", quoteIds);
    const invoiceRows = assertNoError(
      await db.from("invoices").select("id").in("quote_id", quoteIds),
      "scenario invoices lookup",
    );
    const invoiceIds = (invoiceRows ?? []).map((row) => row.id);
    if (invoiceIds.length > 0) {
      await db.from("invoice_items").delete().in("invoice_id", invoiceIds);
    }
    await db.from("quote_items").delete().in("quote_id", quoteIds);
    await db.from("invoices").delete().in("quote_id", quoteIds);
    await db.from("workflow_events").delete().in("quote_id", quoteIds);
    assertNoError(await db.from("quotes").delete().in("id", quoteIds), "scenario quotes cleanup");
  }

  const requestRows = assertNoError(
    await db.from("service_requests").select("id").contains("metadata", { scenario_id: scenarioId }),
    "scenario service requests lookup",
  );
  const requestIds = (requestRows ?? []).map((row) => row.id);
  if (requestIds.length > 0) {
    await db.from("workflow_events").delete().in("service_request_id", requestIds);
    assertNoError(await db.from("service_requests").delete().in("id", requestIds), "scenario service requests cleanup");
  }
}

async function findOrCreateConcierge() {
  const existing = assertNoError(
    await db
      .from("profiles")
      .select("id, email, first_name, last_name, username, role, category, company_name, city")
      .or("role.eq.concierge,role.eq.concierge_pro,category.ilike.concierge%")
      .ilike("service_area", "%Barcar%")
      .limit(1)
      .maybeSingle(),
    "concierge lookup by area",
  );

  if (existing?.id) return existing;

  const fallback = assertNoError(
    await db
      .from("profiles")
      .select("id, email, first_name, last_name, username, role, category, company_name, city")
      .or("role.eq.concierge,role.eq.concierge_pro,category.ilike.concierge%")
      .limit(1)
      .maybeSingle(),
    "concierge fallback lookup",
  );

  if (fallback?.id) return fallback;

  return assertNoError(
    await db
      .from("profiles")
      .insert({
        id: crypto.randomUUID(),
        email: "concierge.barcares.demo@planetls.test",
        username: "Concierge Barcarès Démo",
        first_name: "Claire",
        last_name: "Martin",
        company_name: "Rivage Conciergerie",
        role: "concierge",
        category: "concierge",
        city: "Le Barcarès",
        location: "Le Barcarès",
        service_area: "Le Barcarès, Port-Barcarès, Sainte-Marie-la-Mer",
        service_radius_km: 35,
        hourly_rate: 38,
        monthly_rate: 690,
        emergency_service: true,
        onboarding_complete: true,
      })
      .select("id, email, first_name, last_name, username, role, category, company_name, city")
      .single(),
    "concierge creation",
  );
}

async function upsertProperty(owner) {
  const existing = assertNoError(
    await db
      .from("properties")
      .select("id")
      .eq("owner_id", owner.id)
      .eq("name", "Villa Le Barcarès")
      .limit(1)
      .maybeSingle(),
    "property lookup",
  );

  if (existing?.id) {
    return assertNoError(
      await db
        .from("properties")
        .update({ city: "Le Barcarès", status: "active" })
        .eq("id", existing.id)
        .select("*")
        .single(),
      "property update",
    );
  }

  return assertNoError(
    await db
      .from("properties")
      .insert({
        name: "Villa Le Barcarès",
        city: "Le Barcarès",
        owner_id: owner.id,
        status: "active",
      })
      .select("*")
      .single(),
    "property creation",
  );
}

async function upsertHousing(owner, concierge) {
  const existingRows = assertNoError(
    await db
      .from("housing")
      .select("id")
      .eq("nom_logement", "Villa Le Barcarès")
      .eq("ville", "Le Barcarès")
      .limit(20),
    "housing lookup",
  );

  const existing = (existingRows ?? [])[0] ?? null;
  const payload = {
    nom_logement: "Villa Le Barcarès",
    ville: "Le Barcarès",
    adresse: "Avenue de la Grande Plage, 66420 Le Barcarès",
    plateforme: "Airbnb, Abritel",
    statut: "active",
    photo_principale: "/images/default-logement.png",
    infos: {
      scenario_id: scenarioId,
      property_type: "Villa",
      surface_sqm: 70,
      platforms: ["Airbnb", "Abritel"],
      terrace: true,
      terrace_surface_sqm: 24,
      terrace_notes: "Terrasse exposée, mobilier extérieur à vérifier avant chaque arrivée.",
      room_count: 3,
      bedroom_count: 2,
      bathroom_count: 1,
      bed_count: 3,
      guest_capacity: 6,
      equipements: [
        "Terrasse",
        "Mobilier extérieur",
        "Climatisation",
        "Wi-Fi",
        "Lave-linge",
        "Serrure connectée",
        "Détecteur de fumée",
      ],
      description:
        "Villa de 70 m² à Le Barcarès, louée sur Airbnb et Abritel, avec terrasse et besoin de coordination annuelle.",
    },
    proprietaire: {
      id: owner.id,
      owner_profile_id: owner.id,
      manager_profile_id: concierge.id,
      full_name: profileLabel(owner),
      email: owner.email,
      source: "simulation",
      scenario_id: scenarioId,
    },
    location: {
      address_line_1: "Avenue de la Grande Plage",
      postal_code: "66420",
      city: "Le Barcarès",
      country: "France",
      entry_instructions:
        "Accès par portail côté terrasse. Prévoir remise des clés et vérification mobilier extérieur.",
    },
    menage: {
      services: ["Check-in/out", "Gestion du linge", "Entretien terrasse"],
      instructions:
        "Contrôler la terrasse, préparer le linge, vérifier les consommables et coordonner les arrivées/départs.",
    },
    planning: [
      {
        type: "service_request",
        date: "2026-06-12",
        label: "Démarrage souhaité de la gestion annuelle",
      },
    ],
    documents: [
      {
        type: "simulation",
        label: "Brief propriétaire",
        status: "ready",
      },
    ],
    tarifs: {
      currency: "EUR",
      estimated_monthly_budget: 690,
      setup_fee: 180,
    },
    contrat: {
      auto_renew: true,
      quote_number: null,
      signed_at: null,
    },
    notes: {
      scenario_id: scenarioId,
      owner_request:
        "Cherche conciergerie pour check-in/out, gestion du linge et entretien de la terrasse, à l'année.",
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

async function createWorkflow(owner, concierge, property, housing) {
  const now = new Date().toISOString();
  const requestedServices = ["Check-in/out", "Gestion du linge", "Entretien de la terrasse", "Suivi annuel"];
  const requestMetadata = {
    scenario_id: scenarioId,
    origin: "simulation_owner_to_concierge",
    property_label: housing.nom_logement,
    property_housing_id: String(housing.id),
    property_address: housing.adresse,
    property_type: "Villa",
    sleeping_capacity: "6",
    property_constraints:
      "Terrasse à contrôler à chaque rotation, gestion du linge à prévoir, annonces Airbnb et Abritel.",
    owner_goal: "annual_management",
    owner_goal_label: "Gestion annuelle",
    collaboration_type: "annual",
    collaboration_type_label: "À l'année",
    collaboration_frequency: "year_round",
    collaboration_frequency_label: "Toute l'année",
    estimated_duration: "Contrat annuel renouvelable",
    responsibility_level: "full_coordination",
    responsibility_level_label: "Coordination complète",
    request_summary:
      "Recherche conciergerie à l'année pour check-in/out, linge et terrasse de la Villa Le Barcarès.",
    requested_services: requestedServices,
  };

  const request = assertNoError(
    await db
      .from("service_requests")
      .insert({
        owner_profile_id: owner.id,
        property_id: property.id,
        selected_concierge_profile_id: concierge.id,
        request_type: "durable",
        status: "quote_accepted",
        title: "Gestion annuelle Villa Le Barcarès",
        description:
          "Demande de conciergerie à l'année pour une villa de 70 m² louée sur Airbnb et Abritel : check-in/out, gestion du linge et entretien de la terrasse.",
        requested_services: requestedServices,
        city: "Le Barcarès",
        postal_code: "66420",
        desired_date: desiredStart,
        urgency: false,
        budget_max: 900,
        currency: "EUR",
        metadata: requestMetadata,
      })
      .select("*")
      .single(),
    "service request creation",
  );

  const recipient = assertNoError(
    await db
      .from("service_request_recipients")
      .insert({
        service_request_id: request.id,
        concierge_profile_id: concierge.id,
        status: "selected",
        response_message:
          "Bonjour, nous pouvons prendre en charge le check-in/out, le linge et le suivi terrasse à l'année. Proposition jointe.",
        proposed_date: desiredStart,
        viewed_at: now,
        responded_at: now,
        metadata: {
          scenario_id: scenarioId,
          response_type: "quote_sent",
        },
      })
      .select("*")
      .single(),
    "service request recipient creation",
  );

  const subtotal = money(180 + 690 + 95 + 75);
  const quote = assertNoError(
    await db
      .from("quotes")
      .insert({
        quote_number: `DEV-BARCARES-${Date.now()}`,
        concierge_profile_id: concierge.id,
        owner_profile_id: owner.id,
        service_request_id: request.id,
        service_request_recipient_id: recipient.id,
        status: "accepted",
        currency: "EUR",
        subtotal,
        discount_amount: 0,
        tax_rate: 0,
        tax_amount: 0,
        total_amount: subtotal,
        valid_until: "2026-06-30",
        notes:
          "Proposition acceptée pour gestion annuelle : check-in/out, linge, terrasse et suivi des plateformes Airbnb/Abritel.",
        metadata: {
          scenario_id: scenarioId,
          service_request_id: request.id,
          service_request_recipient_id: recipient.id,
          property_label: housing.nom_logement,
          property_housing_id: String(housing.id),
          requested_services: requestedServices,
          payment_plan: "monthly",
          deposit_required: true,
          deposit_amount: 180,
        },
        sent_at: now,
        accepted_at: now,
      })
      .select("*")
      .single(),
    "quote creation",
  );

  const quoteItems = [
    {
      quote_id: quote.id,
      label: "Mise en route du logement",
      description: "Création du protocole check-in/out, repères linge, contrôle terrasse.",
      quantity: 1,
      unit_price: 180,
      line_total: 180,
      sort_order: 0,
      metadata: { scenario_id: scenarioId },
    },
    {
      quote_id: quote.id,
      label: "Forfait mensuel de conciergerie",
      description: "Coordination annuelle Airbnb/Abritel, voyageurs, linge et suivi opérationnel.",
      quantity: 1,
      unit_price: 690,
      line_total: 690,
      sort_order: 1,
      metadata: { scenario_id: scenarioId },
    },
    {
      quote_id: quote.id,
      label: "Gestion du linge",
      description: "Organisation des rotations, contrôle et préparation.",
      quantity: 1,
      unit_price: 95,
      line_total: 95,
      sort_order: 2,
      metadata: { scenario_id: scenarioId },
    },
    {
      quote_id: quote.id,
      label: "Contrôle terrasse",
      description: "Vérification mobilier extérieur et remise en ordre.",
      quantity: 1,
      unit_price: 75,
      line_total: 75,
      sort_order: 3,
      metadata: { scenario_id: scenarioId },
    },
  ];
  assertNoError(await db.from("quote_items").insert(quoteItems), "quote items creation");

  const mission = assertNoError(
    await db
      .from("missions")
      .insert({
        concierge_profile_id: concierge.id,
        owner_profile_id: owner.id,
        property_id: property.id,
        service_id: 2,
        service_label: "Gestion conciergerie annuelle",
        description:
          "Check-in/out, gestion du linge et contrôle de la terrasse pour démarrer le contrat annuel.",
        status: "awaiting_owner_validation",
        priority: "normal",
        amount: subtotal,
        currency: "EUR",
        scheduled_start: desiredStart,
        scheduled_end: desiredEnd,
        metadata: {
          scenario_id: scenarioId,
          mission_title: "Démarrage gestion annuelle Villa Le Barcarès",
          source: "quote_acceptance",
          quote_id: quote.id,
          quote_number: quote.quote_number,
          service_request_id: request.id,
          service_request_recipient_id: recipient.id,
          property_label: housing.nom_logement,
          property_housing_id: String(housing.id),
          housing_name: housing.nom_logement,
          requested_services: requestedServices,
          accepted_quote_amount: subtotal,
          planning_origin: "service_request_desired_date",
          checklist: [
            {
              id: "checkin_protocol",
              label: "Protocole check-in/out validé",
              done: true,
              checked_by: concierge.id,
              checked_by_label: profileLabel(concierge),
              checked_at: "2026-06-12T09:15:00+02:00",
            },
            {
              id: "linen_ready",
              label: "Linge préparé pour la prochaine arrivée",
              done: true,
              checked_by: concierge.id,
              checked_by_label: profileLabel(concierge),
              checked_at: "2026-06-12T10:05:00+02:00",
            },
            {
              id: "terrace_checked",
              label: "Terrasse contrôlée et mobilier remis en place",
              done: true,
              checked_by: concierge.id,
              checked_by_label: profileLabel(concierge),
              checked_at: "2026-06-12T11:20:00+02:00",
            },
            {
              id: "owner_report_sent",
              label: "Compte rendu envoyé au propriétaire",
              done: true,
              checked_by: concierge.id,
              checked_by_label: profileLabel(concierge),
              checked_at: "2026-06-12T11:45:00+02:00",
            },
          ],
          proof_links: [
            {
              id: crypto.randomUUID(),
              label: "Photo terrasse après contrôle",
              url: "https://example.com/demo/preuve-terrasse-villa-barcares.jpg",
              kind: "photo",
              created_at: "2026-06-12T11:25:00+02:00",
              created_by: concierge.id,
            },
            {
              id: crypto.randomUUID(),
              label: "Compte rendu de démarrage",
              url: "https://example.com/demo/rapport-demarrage-villa-barcares.pdf",
              kind: "document",
              created_at: "2026-06-12T11:50:00+02:00",
              created_by: concierge.id,
            },
          ],
          concierge_report:
            "Mission réalisée : protocole check-in/out cadré, linge prêt, terrasse contrôlée. En attente de validation propriétaire.",
        },
      })
      .select("*")
      .single(),
    "mission creation",
  );

  const conversation = assertNoError(
    await db
      .from("contact_conversations")
      .insert({
        owner_profile_id: owner.id,
        concierge_profile_id: concierge.id,
        source: "mission",
        source_reference: mission.id,
        subject: "Mission Villa Le Barcarès - devis signé",
        status: "open",
        last_message_preview:
          "La checklist terrain est cochée. La mission attend votre validation.",
        last_message_at: "2026-06-12T11:55:00+02:00",
        metadata: {
          scenario_id: scenarioId,
          mission_id: mission.id,
          quote_id: quote.id,
        },
      })
      .select("id")
      .single(),
    "mission conversation creation",
  );

  assertNoError(
    await db.from("contact_messages").insert([
      {
        conversation_id: conversation.id,
        sender_profile_id: owner.id,
        message_type: "text",
        body:
          "Bonjour, le devis est signé. Pouvez-vous lancer la mission pour la Villa Le Barcarès le 12 juin : check-in/out, linge et terrasse ?",
        metadata: {
          scenario_id: scenarioId,
          mission_id: mission.id,
          quote_id: quote.id,
          system_context: "owner_request_after_quote",
        },
      },
      {
        conversation_id: conversation.id,
        sender_profile_id: concierge.id,
        message_type: "text",
        body:
          "Bonjour Nathalie, bien reçu. La mission est prise en charge. Je vérifie le protocole d'arrivée, le linge et la terrasse.",
        metadata: {
          scenario_id: scenarioId,
          mission_id: mission.id,
          system_context: "concierge_acknowledgement",
        },
      },
      {
        conversation_id: conversation.id,
        sender_profile_id: concierge.id,
        message_type: "text",
        body:
          "Mission terminée : checklist cochée, terrasse contrôlée, linge préparé. Vous pouvez vérifier et valider la mission.",
        metadata: {
          scenario_id: scenarioId,
          mission_id: mission.id,
          system_context: "concierge_completion_report",
        },
      },
    ]),
    "mission messages creation",
  );

  assertNoError(
    await db.from("mission_events").insert([
      {
        mission_id: mission.id,
        actor_profile_id: owner.id,
        event_type: "created",
        payload: {
          scenario_id: scenarioId,
          source: "quote_acceptance",
          quote_id: quote.id,
          message: "Mission créée suite au devis signé.",
        },
      },
      {
        mission_id: mission.id,
        actor_profile_id: concierge.id,
        event_type: "started",
        payload: {
          scenario_id: scenarioId,
          message: "La concierge a démarré la mission terrain.",
        },
      },
      {
        mission_id: mission.id,
        actor_profile_id: concierge.id,
        event_type: "started",
        payload: {
          scenario_id: scenarioId,
          checklist_updated: true,
          message: "Checklist cochée par la concierge.",
        },
      },
      {
        mission_id: mission.id,
        actor_profile_id: concierge.id,
        event_type: "completed",
        payload: {
          scenario_id: scenarioId,
          next_status: "awaiting_owner_validation",
          message: "La mission attend la validation du propriétaire.",
        },
      },
    ]),
    "mission events creation",
  );

  assertNoError(
    await db.from("quotes").update({ mission_id: mission.id }).eq("id", quote.id),
    "quote mission link",
  );
  assertNoError(
    await db
      .from("service_requests")
      .update({
        mission_id: mission.id,
        status: "accepted",
        metadata: {
          ...requestMetadata,
          selected_quote_id: quote.id,
          selected_recipient_id: recipient.id,
          selected_mission_id: mission.id,
          selected_at: now,
        },
      })
      .eq("id", request.id),
    "service request mission link",
  );
  assertNoError(
    await db
      .from("housing")
      .update({
        contrat: {
          auto_renew: true,
          quote_id: quote.id,
          quote_number: quote.quote_number,
          signed_at: now,
        },
      })
      .eq("id", housing.id),
    "housing contract link",
  );

  const workflowRows = [
    {
      actor_profile_id: owner.id,
      owner_profile_id: owner.id,
      concierge_profile_id: concierge.id,
      service_request_id: request.id,
      service_request_recipient_id: recipient.id,
      event_type: "service_request_sent",
      request_workflow_status: "sent",
      title: "Demande envoyée",
      body: "Le propriétaire a envoyé une demande de gestion annuelle à la conciergerie.",
      action_href: `/dashboard/owner/demandes?request=${request.id}`,
      metadata: { scenario_id: scenarioId },
    },
    {
      actor_profile_id: concierge.id,
      owner_profile_id: owner.id,
      concierge_profile_id: concierge.id,
      service_request_id: request.id,
      service_request_recipient_id: recipient.id,
      event_type: "service_request_quoted",
      request_workflow_status: "quoted",
      title: "Devis envoyé",
      body: "La conciergerie a répondu avec un devis.",
      action_href: `/dashboard/owner/devis?quote=${quote.id}`,
      metadata: { scenario_id: scenarioId },
    },
    {
      actor_profile_id: owner.id,
      owner_profile_id: owner.id,
      concierge_profile_id: concierge.id,
      service_request_id: request.id,
      service_request_recipient_id: recipient.id,
      quote_id: quote.id,
      mission_id: mission.id,
      event_type: "quote_accepted",
      request_workflow_status: "accepted",
      quote_workflow_status: "accepted",
      mission_workflow_status: "awaiting_owner_validation",
      title: "Devis accepté",
      body: "Le propriétaire a accepté le devis et la mission a été créée dans le planning.",
      action_href: `/dashboard/owner/missions/${mission.id}`,
      metadata: { scenario_id: scenarioId },
    },
  ];
  assertNoError(await db.from("workflow_events").insert(workflowRows), "workflow events creation");

  return { request, recipient, quote, mission };
}

async function main() {
  const owner = await findOwner();
  await cleanupScenario();
  const concierge = await findOrCreateConcierge();
  const property = await upsertProperty(owner);
  const housing = await upsertHousing(owner, concierge);
  const workflow = await createWorkflow(owner, concierge, property, housing);

  console.log(JSON.stringify({
    scenarioId,
    owner: { id: owner.id, email: owner.email, label: profileLabel(owner) },
    concierge: { id: concierge.id, email: concierge.email, label: profileLabel(concierge) },
    property: { id: property.id, name: property.name },
    housing: { id: housing.id, name: housing.nom_logement },
    serviceRequest: { id: workflow.request.id, status: workflow.request.status },
    recipient: { id: workflow.recipient.id, status: workflow.recipient.status },
    quote: { id: workflow.quote.id, number: workflow.quote.quote_number, status: workflow.quote.status },
    mission: {
      id: workflow.mission.id,
      status: workflow.mission.status,
      scheduled_start: workflow.mission.scheduled_start,
      scheduled_end: workflow.mission.scheduled_end,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
