import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import type { Json } from "@/types/supabase";
import { z } from "zod";
import { getConversationSeenAt, resolveConversationParticipants, setConversationSeenAt } from "./shared";
import { requireActor } from "@/app/lib/apiSecurity";

type ConversationSource = "manual" | "search" | "mission" | "quote" | "invoice";

const VALID_SOURCES: ConversationSource[] = ["manual", "search", "mission", "quote", "invoice"];
const OWNER_ROLES = new Set(["owner", "owner_pro"]);
const CONCIERGE_ROLES = new Set(["concierge", "concierge_pro"]);
const ALLOWED_CONVERSATION_CREATOR_ROLES = new Set([
  "admin",
  "super_admin",
  "concierge",
  "concierge_pro",
  "owner",
  "owner_pro",
]);

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const createConversationSchema = z.object({
  owner_profile_id: z.string().uuid().optional(),
  concierge_profile_id: z.string().uuid().optional(),
  source: z.enum(VALID_SOURCES).optional(),
  source_reference: z.string().trim().max(120).optional().nullable(),
  subject: z.string().trim().max(180).optional().nullable(),
  prefill_message: z.string().trim().max(5000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

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

function getRoleView(role: string, requestedRoleHint: string | null): "owner" | "concierge" | null {
  if (OWNER_ROLES.has(role)) return "owner";
  if (CONCIERGE_ROLES.has(role)) return "concierge";
  if (role === "admin" || role === "super_admin") {
    if (requestedRoleHint === "owner" || requestedRoleHint === "concierge") {
      return requestedRoleHint;
    }
    return "concierge";
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const actorResult = await requireActor(req, {
      logLabel: "messages conversations auth",
      actionLabel: "accéder à la messagerie",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }

    if (!isUuidLike(actorResult.actor.userId)) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const url = new URL(req.url);
    const requestedRoleHint = url.searchParams.get("role");
    if (requestedRoleHint && requestedRoleHint !== "concierge" && requestedRoleHint !== "owner") {
      return NextResponse.json({ error: "role invalide" }, { status: 400 });
    }

    const roleView = getRoleView(actorResult.actor.role, requestedRoleHint);
    if (!roleView) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const limitRaw = Number(url.searchParams.get("limit") ?? "40");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 150) : 40;
    const filterColumn = roleView === "owner" ? "owner_profile_id" : "concierge_profile_id";

    const { data: conversations, error } = await db
      .from("contact_conversations")
      .select(conversationSelect)
      .eq(filterColumn, actorResult.actor.userId)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[GET /api/messages/conversations] DB error:", error);
      return NextResponse.json({ error: "Erreur chargement conversations" }, { status: 500 });
    }

    const rows = conversations ?? [];
    const counterpartIds = new Set<string>();
    rows.forEach((conversation) => {
      const counterpartId =
        conversation.concierge_profile_id === actorResult.actor.userId
          ? conversation.owner_profile_id
          : conversation.concierge_profile_id;
      if (counterpartId) counterpartIds.add(counterpartId);
    });

    const counterpartIdList = Array.from(counterpartIds);
    const profilesById = new Map<
      string,
      {
        first_name: string | null;
        last_name: string | null;
        username: string | null;
        company_name: string | null;
      }
    >();

    if (counterpartIdList.length > 0) {
      const { data: profiles, error: profilesError } = await db
        .from("profiles")
        .select("id, first_name, last_name, username, company_name")
        .in("id", counterpartIdList);

      if (profilesError) {
        console.error("[GET /api/messages/conversations] profiles error:", profilesError);
      } else {
        (profiles ?? []).forEach((profile) => {
          profilesById.set(profile.id, {
            first_name: profile.first_name,
            last_name: profile.last_name,
            username: profile.username,
            company_name: profile.company_name,
          });
        });
      }
    }

    const hydrated = rows.map((conversation) => {
      const counterpartId =
        conversation.concierge_profile_id === actorResult.actor.userId
          ? conversation.owner_profile_id
          : conversation.concierge_profile_id;
      const counterpart = counterpartId ? profilesById.get(counterpartId) : null;
      const displayName = counterpart
        ? `${counterpart.first_name ?? ""} ${counterpart.last_name ?? ""}`.trim() ||
          counterpart.company_name ||
          counterpart.username ||
          "Contact"
        : "Contact";

      return {
        ...conversation,
        counterpart_profile_id: counterpartId,
        counterpart_name: displayName,
      };
    });

    const conversationIds = hydrated.map((conversation) => conversation.id);
    const unreadCounts = new Map<string, number>();

    if (conversationIds.length > 0) {
      const { data: messages, error: messagesError } = await db
        .from("contact_messages")
        .select("conversation_id, sender_profile_id, created_at")
        .in("conversation_id", conversationIds)
        .neq("sender_profile_id", actorResult.actor.userId)
        .order("created_at", { ascending: false });

      if (messagesError) {
        console.error("[GET /api/messages/conversations] messages error:", messagesError);
      } else {
        for (const conversation of hydrated) {
          const seenAt = getConversationSeenAt(conversation.metadata, roleView);
          const seenTime = seenAt ? new Date(seenAt).getTime() : 0;
          const count = (messages ?? []).filter((message) => {
            if (message.conversation_id !== conversation.id) return false;
            const messageTime = new Date(message.created_at).getTime();
            if (Number.isNaN(messageTime)) return false;
            return seenTime === 0 || messageTime > seenTime;
          }).length;
          unreadCounts.set(conversation.id, count);
        }
      }
    }

    const items = hydrated.map((conversation) => ({
      ...conversation,
      unread_count: unreadCounts.get(conversation.id) ?? 0,
    }));

    return NextResponse.json({
      items,
      summary: {
        total: items.length,
        unread: items.reduce((sum, item) => sum + item.unread_count, 0),
      },
      note: items.length === 0 ? "Aucune conversation pour le moment." : null,
    });
  } catch (err) {
    console.error("[GET /api/messages/conversations] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actorResult = await requireActor(req, {
      logLabel: "messages conversations auth",
      allowedRoles: ALLOWED_CONVERSATION_CREATOR_ROLES,
      actionLabel: "créer une conversation",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }

    if (!isUuidLike(actorResult.actor.userId)) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const rawBody: unknown = await req.json();
    const parsedBody = createConversationSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }
    const body = parsedBody.data;
    const { ownerProfileId, conciergeProfileId } = resolveConversationParticipants({
      role: actorResult.actor.role,
      userId: actorResult.actor.userId,
      ownerProfileId: body.owner_profile_id,
      conciergeProfileId: body.concierge_profile_id,
    });

    if (!ownerProfileId || !conciergeProfileId) {
      return NextResponse.json(
        { error: "owner_profile_id ou concierge_profile_id requis" },
        { status: 400 },
      );
    }

    if (ownerProfileId === conciergeProfileId) {
      return NextResponse.json(
        { error: "Impossible de creer une conversation avec vous-meme" },
        { status: 400 },
      );
    }

    if (!actorResult.actor.isAdmin) {
      const isOwnerActor = OWNER_ROLES.has(actorResult.actor.role) && ownerProfileId === actorResult.actor.userId;
      const isConciergeActor =
        CONCIERGE_ROLES.has(actorResult.actor.role) && conciergeProfileId === actorResult.actor.userId;

      if (!isOwnerActor && !isConciergeActor) {
        return NextResponse.json(
          { error: "Vous ne pouvez creer une conversation qu'en votre nom." },
          { status: 403 },
        );
      }
    }

    const { data: ownerProfile, error: ownerProfileError } = await db
      .from("profiles")
      .select("id, role, category, status")
      .eq("id", ownerProfileId)
      .maybeSingle();

    if (ownerProfileError) {
      console.error("[POST /api/messages/conversations] owner profile error:", ownerProfileError);
      return NextResponse.json({ error: "Erreur verification destinataire" }, { status: 500 });
    }
    if (!ownerProfile) {
      return NextResponse.json({ error: "Destinataire introuvable" }, { status: 404 });
    }
    if (ownerProfile.status === "suspended" || ownerProfile.status === "deleted") {
      return NextResponse.json({ error: "Destinataire indisponible" }, { status: 403 });
    }

    const roleValue = (ownerProfile.role ?? "").toLowerCase();
    const categoryValue = (ownerProfile.category ?? "").toLowerCase();
    const isOwnerTarget =
      roleValue === "owner" || roleValue === "owner_pro" || categoryValue.startsWith("proprietaire");

    if (!isOwnerTarget) {
      return NextResponse.json({ error: "Destinataire invalide" }, { status: 400 });
    }

    const { data: conciergeProfile, error: conciergeProfileError } = await db
      .from("profiles")
      .select("id, role, category, status")
      .eq("id", conciergeProfileId)
      .maybeSingle();

    if (conciergeProfileError) {
      console.error(
        "[POST /api/messages/conversations] concierge profile error:",
        conciergeProfileError,
      );
      return NextResponse.json({ error: "Erreur verification concierge" }, { status: 500 });
    }
    if (!conciergeProfile) {
      return NextResponse.json({ error: "Concierge introuvable" }, { status: 404 });
    }
    if (conciergeProfile.status === "suspended" || conciergeProfile.status === "deleted") {
      return NextResponse.json({ error: "Concierge indisponible" }, { status: 403 });
    }

    const conciergeRoleValue = (conciergeProfile.role ?? "").toLowerCase();
    const conciergeCategoryValue = (conciergeProfile.category ?? "").toLowerCase();
    const isConciergeTarget =
      conciergeRoleValue === "concierge" ||
      conciergeRoleValue === "concierge_pro" ||
      conciergeCategoryValue.startsWith("concierge");

    if (!isConciergeTarget) {
      return NextResponse.json({ error: "Concierge invalide" }, { status: 400 });
    }

    const source: ConversationSource = VALID_SOURCES.includes(body.source as ConversationSource)
      ? (body.source as ConversationSource)
      : "manual";
    const sourceReference = (body.source_reference ?? "").trim() || null;
    const subject = (body.subject ?? "").trim() || null;

    let existingQuery = db
      .from("contact_conversations")
      .select(conversationSelect)
      .eq("concierge_profile_id", conciergeProfileId)
      .eq("owner_profile_id", ownerProfileId)
      .eq("source", source);

    existingQuery =
      sourceReference === null
        ? existingQuery.is("source_reference", null)
        : existingQuery.eq("source_reference", sourceReference);

    const { data: existingConversationsResult, error: existingError } = await existingQuery.limit(1);

    if (existingError) {
      console.error("[POST /api/messages/conversations] read existing error:", existingError);
      return NextResponse.json({ error: "Erreur verification conversation" }, { status: 500 });
    }

    const existingConversation = (existingConversationsResult ?? [])[0];
    if (existingConversation) {
      return NextResponse.json(existingConversation);
    }

    const safeMetadataObject =
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, Json | undefined>)
        : {};

    const { data: createdConversation, error: createError } = await db
      .from("contact_conversations")
      .insert({
        concierge_profile_id: conciergeProfileId,
        owner_profile_id: ownerProfileId,
        source,
        source_reference: sourceReference,
        subject,
        metadata: {
          ...safeMetadataObject,
          prefilled: true,
        } as Json,
      })
      .select(conversationSelect)
      .single();

    if (createError || !createdConversation) {
      console.error("[POST /api/messages/conversations] create error:", createError);
      return NextResponse.json({ error: "Erreur creation conversation" }, { status: 500 });
    }

    const prefillBody =
      (body.prefill_message ?? "").trim() ||
      "Bonjour, je vous contacte suite a votre annonce. Je peux vous proposer une prise en charge adaptee a vos besoins.";

    const { error: messageError } = await db.from("contact_messages").insert({
      conversation_id: createdConversation.id,
      sender_profile_id: actorResult.actor.userId,
      message_type: "text",
      body: prefillBody,
      metadata: {
        source,
        source_reference: sourceReference,
        prefill: true,
      },
    });

    if (messageError) {
      console.error("[POST /api/messages/conversations] prefill error:", messageError);
      await db.from("contact_conversations").delete().eq("id", createdConversation.id);
      return NextResponse.json({ error: "Erreur creation message" }, { status: 500 });
    }

    const roleView = ownerProfileId === actorResult.actor.userId ? "owner" : "concierge";
    const nextMetadata = setConversationSeenAt(
      createdConversation.metadata,
      roleView,
      new Date().toISOString(),
    );

    await db
      .from("contact_conversations")
      .update({ metadata: nextMetadata as Json })
      .eq("id", createdConversation.id);

    return NextResponse.json(createdConversation, { status: 201 });
  } catch (err) {
    console.error("[POST /api/messages/conversations] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
