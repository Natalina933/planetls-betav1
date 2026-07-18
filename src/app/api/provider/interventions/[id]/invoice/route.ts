import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { requireProviderAuth } from "../../../shared";

const dbAny = asLooseSupabaseClient(db);
const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authResult = await requireProviderAuth(req);
  if (!authResult.ok) return authResult.response;
  const providerProfileId = authResult.auth.userId;
  const { id } = await context.params;
  if (!providerProfileId || !isUuidLike(id)) {
    return NextResponse.json({ error: "Intervention invalide" }, { status: 400 });
  }

  const { data: intervention, error: interventionError } = await dbAny
    .from("provider_interventions")
    .select("*")
    .eq("id", id)
    .eq("provider_profile_id", providerProfileId)
    .maybeSingle();
  if (interventionError) return NextResponse.json({ error: "Erreur lecture intervention" }, { status: 500 });
  if (!intervention) return NextResponse.json({ error: "Intervention introuvable" }, { status: 404 });
  if (intervention.status !== "completed") {
    return NextResponse.json({ error: "L'intervention doit être terminée avant facturation" }, { status: 409 });
  }

  const { data: existingInvoices } = await dbAny
    .from("invoices")
    .select("*")
    .eq("concierge_profile_id", providerProfileId)
    .contains("metadata", { provider_intervention_id: id })
    .limit(1);
  if (existingInvoices?.[0]) return NextResponse.json(existingInvoices[0]);

  const metadata = intervention.metadata && typeof intervention.metadata === "object" && !Array.isArray(intervention.metadata)
    ? intervention.metadata as Record<string, unknown>
    : {};
  const missionId = typeof metadata.mission_id === "string" && isUuidLike(metadata.mission_id)
    ? metadata.mission_id
    : null;
  const amount = Math.max(Number(intervention.budget_amount ?? 0), 0);
  if (amount <= 0) return NextResponse.json({ error: "Montant d'intervention invalide" }, { status: 400 });

  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(now.getDate() + 14);
  const { data: invoice, error: invoiceError } = await dbAny
    .from("invoices")
    .insert({
      quote_id: null,
      concierge_profile_id: providerProfileId,
      owner_profile_id: intervention.owner_profile_id ?? null,
      mission_id: missionId,
      status: "issued",
      issue_date: now.toISOString().slice(0, 10),
      due_date: dueDate.toISOString().slice(0, 10),
      currency: intervention.currency ?? "EUR",
      discount_amount: 0,
      tax_rate: 0,
      paid_amount: 0,
      notes: `Facture liée à l'intervention ${intervention.title ?? id}`,
      metadata: { ...metadata, source: "provider_intervention", provider_intervention_id: id },
      issued_at: now.toISOString(),
    })
    .select("*")
    .single();
  if (invoiceError || !invoice) return NextResponse.json({ error: "Erreur création facture" }, { status: 500 });

  const { error: itemError } = await dbAny.from("invoice_items").insert({
    invoice_id: invoice.id,
    service_id: null,
    pricing_id: null,
    label: intervention.service_label ?? intervention.title ?? "Intervention provider",
    description: intervention.description ?? null,
    quantity: 1,
    unit_price: amount,
    line_total: amount,
    sort_order: 0,
    metadata: { provider_intervention_id: id },
  });
  if (itemError) {
    await dbAny.from("invoices").delete().eq("id", invoice.id).eq("concierge_profile_id", providerProfileId);
    return NextResponse.json({ error: "Erreur création ligne de facture" }, { status: 500 });
  }

  await dbAny.from("invoice_events").insert({
    invoice_id: invoice.id,
    actor_profile_id: providerProfileId,
    event_type: "issued",
    payload: { source: "provider_intervention", provider_intervention_id: id },
  });
  const { data: hydratedInvoice } = await dbAny
    .from("invoices")
    .select("*")
    .eq("id", invoice.id)
    .eq("concierge_profile_id", providerProfileId)
    .single();
  return NextResponse.json(hydratedInvoice ?? invoice, { status: 201 });
}