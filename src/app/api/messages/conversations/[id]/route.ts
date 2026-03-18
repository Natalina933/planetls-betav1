import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import type { Json } from "@/types/supabase";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { setConversationSeenAt } from "../shared";
import { z } from "zod";

const conversationSelect = `
  id,
  concierge_profile_id,
  owner_profile_id,
  source,
  source_reference,
  subject,
  status,
  last_message_preview,
  last_message_at,
  metadata,
  created_at,
  updated_at
`;

const messageSelect = `
  id,
  conversation_id,
  sender_profile_id,
  message_type,
  body,
  metadata,
  created_at
`;

const canAccessConversation = (userId: string, conversation: {
  concierge_profile_id: string;
  owner_profile_id: string;
}) => conversation.concierge_profile_id === userId || conversation.owner_profile_id === userId;

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await getApiAuthContext(req);
    if (!userId || !isUuidLike(userId)) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;
    if (!isUuidLike(id)) {
      return NextResponse.json({ error: "Conversation invalide" }, { status: 400 });
    }
    const { data: conversation, error: conversationError } = await db
      .from("contact_conversations")
      .select(conversationSelect)
      .eq("id", id)
      .maybeSingle();

    if (conversationError) {
      console.error("[GET /api/messages/conversations/:id] conversation error:", conversationError);
      return NextResponse.json({ error: "Erreur lecture conversation" }, { status: 500 });
    }
    if (!conversation) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }
    if (!canAccessConversation(userId, conversation)) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const roleView = conversation.owner_profile_id === userId ? "owner" : "concierge";
    const lastSeenAt = conversation.last_message_at || new Date().toISOString();
    const nextMetadata = setConversationSeenAt(conversation.metadata, roleView, lastSeenAt);

    await db
      .from("contact_conversations")
      .update({ metadata: nextMetadata as Json })
      .eq("id", id);

    const { data: messages, error: messagesError } = await db
      .from("contact_messages")
      .select(messageSelect)
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .limit(400);

    if (messagesError) {
      console.error("[GET /api/messages/conversations/:id] messages error:", messagesError);
      return NextResponse.json({ error: "Erreur lecture messages" }, { status: 500 });
    }

    const participantIds = Array.from(
      new Set([conversation.concierge_profile_id, conversation.owner_profile_id]),
    );
    const { data: participants, error: participantsError } = await db
      .from("profiles")
      .select("id, first_name, last_name, username, company_name")
      .in("id", participantIds);

    if (participantsError) {
      console.error("[GET /api/messages/conversations/:id] participants error:", participantsError);
    }

    const participantsById = new Map(
      (participants ?? []).map((participant) => [
        participant.id,
        {
          id: participant.id,
          first_name: participant.first_name,
          last_name: participant.last_name,
          username: participant.username,
          company_name: participant.company_name,
        },
      ]),
    );

    return NextResponse.json({
      conversation,
      messages: messages ?? [],
      participants: participantsById.size > 0 ? Array.from(participantsById.values()) : [],
      current_user_id: userId,
    });
  } catch (err) {
    console.error("[GET /api/messages/conversations/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await getApiAuthContext(req);
    if (!userId || !isUuidLike(userId)) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;
    if (!isUuidLike(id)) {
      return NextResponse.json({ error: "Conversation invalide" }, { status: 400 });
    }

    const rawBody: unknown = await req.json();
    const parsedBody = sendMessageSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Message vide ou invalide" }, { status: 400 });
    }
    const body = parsedBody.data;
    const content = body.body.trim();

    const { data: conversation, error: conversationError } = await db
      .from("contact_conversations")
      .select("id, concierge_profile_id, owner_profile_id, status")
      .eq("id", id)
      .maybeSingle();

    if (conversationError) {
      console.error("[POST /api/messages/conversations/:id] conversation error:", conversationError);
      return NextResponse.json({ error: "Erreur lecture conversation" }, { status: 500 });
    }
    if (!conversation) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }
    if (!canAccessConversation(userId, conversation)) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }
    if (conversation.status === "closed") {
      return NextResponse.json({ error: "Conversation fermee" }, { status: 400 });
    }

    const safeMetadata: Json =
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? (body.metadata as Json)
        : {};

    const { data: createdMessage, error: messageError } = await db
      .from("contact_messages")
      .insert({
        conversation_id: id,
        sender_profile_id: userId,
        message_type: "text",
        body: content,
        metadata: safeMetadata,
      })
      .select(messageSelect)
      .single();

    if (messageError || !createdMessage) {
      console.error("[POST /api/messages/conversations/:id] create message error:", messageError);
      return NextResponse.json({ error: "Erreur envoi message" }, { status: 500 });
    }

    const roleView = conversation.owner_profile_id === userId ? "owner" : "concierge";
    const { data: currentConversation } = await db
      .from("contact_conversations")
      .select("metadata")
      .eq("id", id)
      .maybeSingle();
    const nextMetadata = setConversationSeenAt(
      currentConversation?.metadata,
      roleView,
      createdMessage.created_at,
    );

    await db
      .from("contact_conversations")
      .update({ metadata: nextMetadata as Json })
      .eq("id", id);

    return NextResponse.json(createdMessage, { status: 201 });
  } catch (err) {
    console.error("[POST /api/messages/conversations/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
