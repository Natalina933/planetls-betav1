import { NextRequest, NextResponse } from "next/server";
import { RESERVATION_PARTICIPANT_ROLES, type ReservationRow } from "@/app/api/_shared/reservations";
import { createOrReuseStayMissions } from "@/app/api/_shared/stayMissionAssignments";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";

const dbAny = asLooseSupabaseClient(db);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiRole(req, RESERVATION_PARTICIPANT_ROLES);
    if (!guard.ok) return guard.response;
    const { userId, role } = guard.auth;
    const { id } = await params;
    const reservationId = decodeURIComponent(id);
    const body = (await req.json()) as Record<string, unknown>;

    const { data: reservationData, error: reservationError } = await dbAny
      .from("reservations")
      .select("*")
      .eq("id", reservationId)
      .maybeSingle();

    if (reservationError) return NextResponse.json({ error: "Erreur chargement réservation." }, { status: 500 });
    if (!reservationData) return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });

    const reservation = reservationData as ReservationRow;
    if (
      role !== "admin" &&
      role !== "super_admin" &&
      reservation.owner_profile_id !== userId &&
      reservation.concierge_profile_id !== userId
    ) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const result = await createOrReuseStayMissions({ db: dbAny, reservation, body });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    return NextResponse.json({ reservation_id: reservation.id, missions: result.missions }, { status: result.status });
  } catch (error) {
    console.error("[POST /api/owner/reservations/[id]/missions] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
