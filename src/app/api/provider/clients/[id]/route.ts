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
    client_name: typeof body?.client_name === "string" ? body.client_name : undefined,
    company_name: typeof body?.company_name === "string" ? body.company_name : undefined,
    email: typeof body?.email === "string" ? body.email : undefined,
    phone: typeof body?.phone === "string" ? body.phone : undefined,
    city: typeof body?.city === "string" ? body.city : undefined,
    client_type: typeof body?.client_type === "string" ? body.client_type : undefined,
    status: typeof body?.status === "string" ? body.status : undefined,
    notes: typeof body?.notes === "string" ? body.notes : undefined,
    metadata:
      body?.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? body.metadata
        : undefined,
  };

  const { data, error } = await (db as any)
    .from("provider_clients")
    .update(updatePayload)
    .eq("id", id)
    .eq("provider_profile_id", auth.userId)
    .select("*")
    .maybeSingle();

  if (error) {
    if (isProviderSchemaMissing(error)) {
      return providerSchemaMissingResponse("provider_clients");
    }
    return NextResponse.json({ error: "Erreur mise a jour client" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
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
    .from("provider_clients")
    .delete()
    .eq("id", id)
    .eq("provider_profile_id", auth.userId);

  if (error) {
    if (isProviderSchemaMissing(error)) {
      return providerSchemaMissingResponse("provider_clients");
    }
    return NextResponse.json({ error: "Erreur suppression client" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
