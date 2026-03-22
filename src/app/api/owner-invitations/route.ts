import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import {
  buildConciergeInvitationSummary,
  createOrRefreshInvitation,
  dispatchOwnerInvitationEmail,
  getProfileLabel,
  loadConciergeProfile,
  loadHousingForInvitation,
  loadHousingInvitations,
} from "./shared";
import {
  isValidInvitationEmail,
  normalizeInvitationEmail,
  type CreateOwnerInvitationPayload,
} from "@/types/ownerInvitations";

const ALLOWED_ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro"]);

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
    }
    if (!ALLOWED_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
    }

    const url = new URL(req.url);
    const housingId = url.searchParams.get("housingId")?.trim() || "";
    if (!housingId) {
      return NextResponse.json({ error: "Le logement est requis." }, { status: 400 });
    }

    const housing = await loadHousingForInvitation(housingId, auth.userId, auth.role, auth.isAdmin);
    const conciergeProfile = await loadConciergeProfile(auth.userId);
    const invitations = await loadHousingInvitations(housing.id, auth.userId);

    return NextResponse.json({
      items: buildConciergeInvitationSummary(
        invitations,
        getProfileLabel(conciergeProfile),
        housing.nom_logement || "Logement",
      ),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de charger les invitations.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
    }
    if (!ALLOWED_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
    }

    const body = (await req.json()) as CreateOwnerInvitationPayload;
    const housingId = typeof body.housingId === "string" ? body.housingId.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!housingId) {
      return NextResponse.json({ error: "Le logement est requis." }, { status: 400 });
    }
    if (!isValidInvitationEmail(email)) {
      return NextResponse.json({ error: "Veuillez renseigner un email proprietaire valide." }, { status: 400 });
    }

    const housing = await loadHousingForInvitation(housingId, auth.userId, auth.role, auth.isAdmin);
    const conciergeProfile = await loadConciergeProfile(auth.userId);
    const conciergeLabel = getProfileLabel(conciergeProfile);

    const created = await createOrRefreshInvitation({
      conciergeProfileId: auth.userId,
      housingId,
      email: normalizeInvitationEmail(email),
      ownerNameHint: typeof body.ownerNameHint === "string" ? body.ownerNameHint : undefined,
      personalNote: typeof body.personalNote === "string" ? body.personalNote : undefined,
      quoteId: body.quoteId ?? null,
      missionId: body.missionId ?? null,
      origin: req.nextUrl.origin,
    });

    const delivery = await dispatchOwnerInvitationEmail({
      claimUrl: created.claimUrl,
      invitation: created.invitation,
      conciergeLabel,
      housingLabel: housing.nom_logement || "Logement",
    });

    return NextResponse.json({
      item: {
        ...created.invitation,
        conciergeLabel,
        housingLabel: housing.nom_logement || "Logement",
      },
      delivery,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de creer l'invitation.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
