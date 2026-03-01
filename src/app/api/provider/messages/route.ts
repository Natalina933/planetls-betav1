import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import {
  isProviderSchemaMissing,
  providerSchemaMissingResponse,
  requireProviderAuth,
  toProviderJsonRecord,
} from "../shared";
import type { ProviderInsert, ProviderRow } from "@/types/supabase-provider";

type ProviderConversationRow = ProviderRow<"provider_conversations">;
type ProviderClientLookupRow = Pick<ProviderRow<"provider_clients">, "id" | "client_name" | "company_name">;

export async function GET(req: NextRequest) {
  const authResult = await requireProviderAuth(req);
  if (!authResult.ok) {
    return authResult.response;
  }

  const { auth } = authResult;
  const providerProfileId = auth.userId;
  if (!providerProfileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await (db as any)
    .from("provider_conversations")
    .select("id, client_id, subject, status, last_message_preview, last_message_at, created_at")
    .eq("provider_profile_id", providerProfileId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    if (isProviderSchemaMissing(error)) {
      return NextResponse.json({
        items: [],
        summary: {
          total: 0,
          unread: 0,
        },
        note:
          "La messagerie artisan attend encore la migration provider en base. Appliquez-la pour activer les conversations.",
      });
    }
    return NextResponse.json({ error: "Erreur chargement conversations" }, { status: 500 });
  }

  const rows = (data ?? []) as ProviderConversationRow[];
  const clientIds = Array.from(
    new Set(rows.map((item) => item.client_id).filter((value): value is string => Boolean(value))),
  );
  const clientsById = new Map<string, ProviderClientLookupRow>();

  if (clientIds.length > 0) {
    const { data: clients, error: clientsError } = await (db as any)
      .from("provider_clients")
      .select("id, client_name, company_name")
      .in("id", clientIds);

    if (clientsError) {
      if (isProviderSchemaMissing(clientsError)) {
        return providerSchemaMissingResponse("provider_clients");
      }
      return NextResponse.json({ error: "Erreur chargement clients" }, { status: 500 });
    }

    for (const client of (clients ?? []) as ProviderClientLookupRow[]) {
      clientsById.set(client.id, client);
    }
  }

  return NextResponse.json({
    items: rows.map((item) => {
      const client = item.client_id ? clientsById.get(item.client_id) : null;
      return {
        ...item,
        counterpart_name: client?.client_name ?? client?.company_name ?? "Client",
      };
    }),
    summary: {
      total: rows.length,
      unread: 0,
    },
    note: rows.length === 0 ? "Aucune conversation artisan pour le moment." : null,
  });
}

export async function POST(req: NextRequest) {
  const authResult = await requireProviderAuth(req);
  if (!authResult.ok) {
    return authResult.response;
  }

  const { auth } = authResult;
  const providerProfileId = auth.userId;
  if (!providerProfileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const clientId = typeof body?.client_id === "string" ? body.client_id : null;
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const content = typeof body?.body === "string" ? body.body.trim() : "";

  if (!clientId) {
    return NextResponse.json({ error: "client_id requis" }, { status: 400 });
  }

  const { data: client, error: clientError } = await (db as any)
    .from("provider_clients")
    .select("id")
    .eq("id", clientId)
    .eq("provider_profile_id", providerProfileId)
    .maybeSingle();

  if (clientError) {
    if (isProviderSchemaMissing(clientError)) {
      return providerSchemaMissingResponse("provider_clients");
    }
    return NextResponse.json({ error: "Erreur verification client" }, { status: 500 });
  }
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const { data: conversation, error: conversationError } = await (db as any)
    .from("provider_conversations")
    .insert({
      provider_profile_id: providerProfileId,
      client_id: clientId,
      subject: subject || null,
      status: "open",
      metadata: toProviderJsonRecord(body?.metadata),
    } satisfies ProviderInsert<"provider_conversations">)
    .select("id, client_id, subject, status, last_message_preview, last_message_at, created_at")
    .single();

  if (conversationError || !conversation) {
    if (isProviderSchemaMissing(conversationError)) {
      return providerSchemaMissingResponse("provider_conversations");
    }
    return NextResponse.json({ error: "Erreur creation conversation" }, { status: 500 });
  }

  let createdMessage = null;
  if (content) {
    const { data: message, error: messageError } = await (db as any)
      .from("provider_messages")
      .insert({
        conversation_id: conversation.id,
        sender_profile_id: providerProfileId,
        body: content,
        metadata: toProviderJsonRecord(body?.message_metadata),
      } satisfies ProviderInsert<"provider_messages">)
      .select("id, conversation_id, sender_profile_id, body, metadata, created_at")
      .single();

    if (messageError) {
      if (isProviderSchemaMissing(messageError)) {
        return providerSchemaMissingResponse("provider_messages");
      }
      return NextResponse.json({ error: "Erreur creation premier message" }, { status: 500 });
    }
    createdMessage = message;
  }

  return NextResponse.json({ conversation, message: createdMessage }, { status: 201 });
}
