import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import {
  isProviderSchemaMissing,
  providerSchemaMissingResponse,
  requireProviderAuth,
} from "../../shared";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireProviderAuth(req);
  if (!authResult.ok) return authResult.response;

  const { auth } = authResult;
  const { id } = await context.params;
  const body = await req.json();

  const updatePayload = {
    alert_type: typeof body?.alert_type === "string" ? body.alert_type : undefined,
    severity: typeof body?.severity === "string" ? body.severity : undefined,
    title: typeof body?.title === "string" ? body.title : undefined,
    body: typeof body?.body === "string" ? body.body : undefined,
    status: typeof body?.status === "string" ? body.status : undefined,
  };

  const { data, error } = await (db as any)
    .from("provider_alerts")
    .update(updatePayload)
    .eq("id", id)
    .eq("provider_profile_id", auth.userId)
    .select("*")
    .maybeSingle();

  if (error) {
    if (isProviderSchemaMissing(error)) {
      return providerSchemaMissingResponse("provider_alerts");
    }
    return NextResponse.json({ error: "Erreur mise a jour alerte" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Alerte introuvable" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireProviderAuth(req);
  if (!authResult.ok) return authResult.response;

  const { auth } = authResult;
  const { id } = await context.params;

  const { error } = await (db as any)
    .from("provider_alerts")
    .delete()
    .eq("id", id)
    .eq("provider_profile_id", auth.userId);

  if (error) {
    if (isProviderSchemaMissing(error)) {
      return providerSchemaMissingResponse("provider_alerts");
    }
    return NextResponse.json({ error: "Erreur suppression alerte" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
