import { NextRequest, NextResponse } from "next/server";
import { recordWorkflowEvent } from "@/app/api/_shared/workflowEvents";
import { db } from "@/app/lib/dbServer";

const PUBLIC_CTA_KEYS = new Set([
  "contact_platform",
  "visit_website",
  "view_linkedin",
  "view_instagram",
  "view_facebook",
]);

type PublicProfileTrackBody = {
  ctaKey?: string;
  href?: string | null;
  source?: string | null;
};

type PublicProfileTrackRow = {
  id: string;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await req.json().catch(() => null)) as PublicProfileTrackBody | null;
    const ctaKey = typeof body?.ctaKey === "string" ? body.ctaKey : "";

    if (!PUBLIC_CTA_KEYS.has(ctaKey)) {
      return NextResponse.json({ error: "CTA public invalide." }, { status: 400 });
    }

    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("id, role, first_name, last_name, company_name")
      .eq("id", id)
      .maybeSingle<PublicProfileTrackRow>();

    if (profileError) {
      return NextResponse.json({ error: "Erreur lecture profil public." }, { status: 500 });
    }

    if (!profile || (profile.role !== "concierge" && profile.role !== "concierge_pro")) {
      return NextResponse.json({ error: "Profil non disponible publiquement." }, { status: 404 });
    }

    const displayName =
      `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
      profile.company_name ||
      "Concierge";

    const href = typeof body?.href === "string" ? body.href : null;
    const source = typeof body?.source === "string" ? body.source : "public_profile";

    await recordWorkflowEvent(db, {
      conciergeProfileId: profile.id,
      eventType: "public_profile_cta_clicked",
      title: `CTA public active pour ${displayName}`,
      body: `Interaction publique sur le CTA ${ctaKey}.`,
      actionHref: href,
      metadata: {
        scope: "public_profile",
        cta_key: ctaKey,
        source,
        href,
        pathname: `/concierges/${profile.id}`,
        referrer: req.headers.get("referer"),
        user_agent: req.headers.get("user-agent"),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/profiles/public/:id/track] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
