import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/server/auth/roleGuards";
import {
  createOrRefreshInvitation,
  dispatchOwnerInvitationEmail,
  getProfileLabel,
  loadConciergeProfile,
  loadHousingForInvitation,
  loadInvitationById,
} from "../../shared";

const ALLOWED_ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro"]);

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireApiRole(req, ALLOWED_ROLES);
    if (!guard.ok) return guard.response;
    const auth = guard.auth;

    const { id } = await context.params;
    const invitation = await loadInvitationById(id);
    if (!invitation) {
      return NextResponse.json({ error: "Invitation introuvable." }, { status: 404 });
    }

    if (invitation.concierge_profile_id !== auth.userId && !auth.isAdmin) {
      return NextResponse.json({ error: "Acces refuse a cette invitation." }, { status: 403 });
    }

    const housingId = invitation.housing_id;
    if (housingId == null) {
      return NextResponse.json({ error: "Cette invitation n'est rattachee a aucun logement." }, { status: 400 });
    }

    const housing = await loadHousingForInvitation(String(housingId), auth.userId, auth.role, auth.isAdmin);
    const conciergeProfile = await loadConciergeProfile(invitation.concierge_profile_id);
    const conciergeLabel = getProfileLabel(conciergeProfile);

    const created = await createOrRefreshInvitation({
      conciergeProfileId: invitation.concierge_profile_id,
      housingId: String(housingId),
      email: invitation.invited_email_normalized,
      ownerNameHint: invitation.invited_owner_name ?? undefined,
      personalNote: invitation.personal_note ?? undefined,
      quoteId: invitation.quote_id ?? null,
      missionId: invitation.mission_id ?? null,
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
    const message = error instanceof Error ? error.message : "Impossible de relancer l'invitation.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
