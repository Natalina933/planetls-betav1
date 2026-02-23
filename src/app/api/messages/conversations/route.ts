import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/app/lib/dbServer";
import type { Json } from "@/types/supabase";

type ConversationSource = "manual" | "search" | "mission" | "quote" | "invoice";

interface CreateConversationBody {
  owner_profile_id?: string;
  source?: ConversationSource;
  source_reference?: string | null;
  subject?: string | null;
  prefill_message?: string | null;
  metadata?: Json | null;
}

const VALID_SOURCES: ConversationSource[] = [
  "manual",
  "search",
  "mission",
  "quote",
  "invoice",
];

const getUserId = async (req: NextRequest): Promise<string | null> => {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });
  return typeof token?.sub === "string" ? token.sub : null;
};

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

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const url = new URL(req.url);
    const roleHint = url.searchParams.get("role") ?? "concierge";
    const limitRaw = Number(url.searchParams.get("limit") ?? "40");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 150) : 40;

    const filterColumn =
      roleHint === "owner" ? "owner_profile_id" : "concierge_profile_id";

    const { data: conversations, error } = await db
      .from("contact_conversations")
      .select(conversationSelect)
      .eq(filterColumn, userId)
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
        conversation.concierge_profile_id === userId
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
        conversation.concierge_profile_id === userId
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

    return NextResponse.json(hydrated);
  } catch (err) {
    console.error("[GET /api/messages/conversations] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body: CreateConversationBody = await req.json();
    const ownerProfileId = (body.owner_profile_id ?? "").trim();
    if (!ownerProfileId) {
      return NextResponse.json({ error: "owner_profile_id requis" }, { status: 400 });
    }

    if (ownerProfileId === userId) {
      return NextResponse.json(
        { error: "Impossible de creer une conversation avec vous-meme" },
        { status: 400 },
      );
    }

    const source: ConversationSource = VALID_SOURCES.includes(body.source as ConversationSource)
      ? (body.source as ConversationSource)
      : "manual";
    const sourceReference = (body.source_reference ?? "").trim() || null;
    const subject = (body.subject ?? "").trim() || null;

    let existingQuery = db
      .from("contact_conversations")
      .select(conversationSelect)
      .eq("concierge_profile_id", userId)
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
        concierge_profile_id: userId,
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
      sender_profile_id: userId,
      message_type: "text",
      body: prefillBody,
      metadata: {
        source,
        source_reference: sourceReference,
        prefill: true,
      },
    });

    if (messageError) {
      console.error("[POST /api/messages/conversations] prefill message error:", messageError);
    }

    return NextResponse.json(createdConversation, { status: 201 });
  } catch (err) {
    console.error("[POST /api/messages/conversations] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
