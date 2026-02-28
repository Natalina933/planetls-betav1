import { db } from "@/app/lib/dbServer";
import type { TablesInsert } from "@/types/supabase";

type StripeEventInsert = TablesInsert<"stripe_events">;

type SubscriptionSnapshotInput = {
  role: string | null;
  additional_info: string | null;
  updated_at: string | null;
};

export function parseStripeSubscriptionSnapshot(profile: SubscriptionSnapshotInput) {
  const additionalInfo =
    typeof profile.additional_info === "string" ? profile.additional_info.trim() : "";

  if (additionalInfo.startsWith("stripe_subscription:")) {
    const raw = additionalInfo.replace("stripe_subscription:", "").trim();
    const [source, ...rest] = raw.split(":");

    return {
      is_pro: profile.role === "concierge_pro",
      source: source || null,
      reference: rest.join(":").trim() || null,
      updated_at: profile.updated_at ?? null,
    };
  }

  return {
    is_pro: profile.role === "concierge_pro",
    source: null,
    reference: null,
    updated_at: profile.updated_at ?? null,
  };
}

export async function recordStripeEvent(input: {
  profileId?: string | null;
  stripeObjectId: string;
  stripeEventType: string;
  source?: string;
  payload?: unknown;
}) {
  const insertPayload: StripeEventInsert = {
    profile_id: input.profileId ?? null,
    stripe_object_id: input.stripeObjectId,
    stripe_event_type: input.stripeEventType,
    source: input.source ?? "webhook",
    payload: (input.payload ?? {}) as StripeEventInsert["payload"],
  };

  const { error } = await db.from("stripe_events").insert(insertPayload);
  if (error) {
    console.error("[recordStripeEvent] insert error:", error);
  }
}
