import { NextRequest, NextResponse } from "next/server";
import {
  isProviderSchemaMissing,
  providerDb,
  providerSchemaMissingResponse,
  requireProviderAuth,
  toProviderJsonRecord,
} from "../../shared";

type ProviderConversation = {
  id: string;
  provider_profile_id: string;
  client_id: string | null;
  subject: string | null;
  status: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

async function getConversationForProvider(id: string, providerProfileId: string) {
  const { data, error } = await providerDb
    .from("provider_conversations")
    .select(
      "id, provider_profile_id, client_id, subject, status, last_message_preview, last_message_at, created_at, updated_at",
    )
    .eq("id", id)
    .eq("provider_profile_id", providerProfileId)
    .maybeSingle();

  return { data: data as ProviderConversation | null, error };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireProviderAuth(req);
  if (!authResult.ok) return authResult.response;

  const { auth } = authResult;
  const currentUserId = auth.userId;
  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const { data: conversation, error: conversationError } = await getConversationForProvider(
    id,
    currentUserId,
  );

  if (conversationError) {
    if (isProviderSchemaMissing(conversationError)) {
      return providerSchemaMissingResponse("provider_conversations");
    }
    return NextResponse.json({ error: "Erreur lecture conversation" }, { status: 500 });
  }
  if (!conversation) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }

  const { data: messages, error: messagesError } = await providerDb
    .from("provider_messages")
    .select("id, conversation_id, sender_profile_id, body, metadata, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(400);

  if (messagesError) {
    if (isProviderSchemaMissing(messagesError)) {
      return providerSchemaMissingResponse("provider_messages");
    }
    return NextResponse.json({ error: "Erreur lecture messages" }, { status: 500 });
  }

  const participantIds = Array.from(
    new Set([
      currentUserId,
      ...((messages ?? []) as Array<{ sender_profile_id: string }>).map(
        (item) => item.sender_profile_id,
      ),
    ]),
  );
  const { data: profiles, error: profilesError } = await providerDb
    .from("profiles")
    .select("id, first_name, last_name, username, company_name")
    .in("id", participantIds);

  if (profilesError) {
    return NextResponse.json({ error: "Erreur lecture participants" }, { status: 500 });
  }

  let client = null;
  if (conversation.client_id) {
    const { data: clientData, error: clientError } = await providerDb
      .from("provider_clients")
      .select("id, client_name, company_name, email, phone, city, owner_profile_id")
      .eq("id", conversation.client_id)
      .eq("provider_profile_id", currentUserId)
      .maybeSingle();

    if (clientError) {
      if (isProviderSchemaMissing(clientError)) {
        return providerSchemaMissingResponse("provider_clients");
      }
      return NextResponse.json({ error: "Erreur lecture client" }, { status: 500 });
    }

    client = clientData;
  }

  return NextResponse.json({
    conversation,
    messages: messages ?? [],
    participants: profiles ?? [],
    client,
    current_user_id: currentUserId,
  });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireProviderAuth(req);
  if (!authResult.ok) return authResult.response;

  const { auth } = authResult;
  const currentUserId = auth.userId;
  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = await req.json();
  const content = typeof body?.body === "string" ? body.body.trim() : "";

  if (!content) {
    return NextResponse.json({ error: "Message vide" }, { status: 400 });
  }

  const { data: conversation, error: conversationError } = await getConversationForProvider(
    id,
    currentUserId,
  );

  if (conversationError) {
    if (isProviderSchemaMissing(conversationError)) {
      return providerSchemaMissingResponse("provider_conversations");
    }
    return NextResponse.json({ error: "Erreur lecture conversation" }, { status: 500 });
  }
  if (!conversation) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }
  if (conversation.status === "closed") {
    return NextResponse.json({ error: "Conversation fermee" }, { status: 400 });
  }

  const { data: createdMessage, error: messageError } = await providerDb
    .from("provider_messages")
    .insert({
      conversation_id: id,
      sender_profile_id: currentUserId,
      body: content,
      metadata: toProviderJsonRecord(body?.metadata),
    })
    .select("id, conversation_id, sender_profile_id, body, metadata, created_at")
    .single();

  if (messageError || !createdMessage) {
    if (isProviderSchemaMissing(messageError)) {
      return providerSchemaMissingResponse("provider_messages");
    }
    return NextResponse.json({ error: "Erreur envoi message" }, { status: 500 });
  }

  return NextResponse.json(createdMessage, { status: 201 });
}
