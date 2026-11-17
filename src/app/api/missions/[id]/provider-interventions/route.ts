import { NextRequest, NextResponse } from "next/server";
import { attachProviderInterventionReports } from "@/app/api/_shared/providerInterventionReports";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { canAccessMissionForRole, CONCIERGE_MISSION_ROLES } from "@/app/lib/missionPermissions";
import { requireApiRole } from "@/server/auth/roleGuards";
import { resolveCommercialPrincipalAccess } from "@/server/auth/commercialAccess";
import { randomUUID } from "node:crypto";
import { missionAssignmentSchemaReady } from "@/app/api/_shared/missionProviderAssignmentAccess";
import type { Json } from "@/types/supabase";

const dbAny = asLooseSupabaseClient(db);
const ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro", "owner", "owner_pro"]);
type MissionProviderRow = Record<string, unknown> & {
  id: string;
  title?: string | null;
  service_label?: string | null;
  description?: string | null;
  owner_profile_id?: string | null;
  concierge_profile_id?: string | null;
  reservation_id?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  amount?: number | null;
  currency?: string | null;
  metadata?: Json | null;
};

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

async function loadMission(id: string) {
  const result = await dbAny
    .from("missions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const row = result.data as MissionProviderRow | null;
  return {
    ...result,
    data: row ? { ...row, title: row.title ?? row.service_label ?? null } : null,
  };
}

function isMissingReservationIdColumn(error: { code?: string; message?: string; details?: string } | null | undefined) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return (
    error?.code === "42703" ||
    error?.code === "PGRST204" ||
    (message.includes("reservation_id") && message.includes("column"))
  );
}

async function loadProviderInterventionsForMission(mission: MissionProviderRow) {
  const reservationId = typeof mission.reservation_id === "string" ? mission.reservation_id : null;
  if (reservationId) {
    const withReservationLink = await dbAny
      .from("provider_interventions")
      .select("*")
      .or(`reservation_id.eq.${reservationId},metadata->>mission_id.eq.${mission.id}`)
      .order("created_at", { ascending: false });

    if (!isMissingReservationIdColumn(withReservationLink.error)) {
      return withReservationLink;
    }
  }

  return dbAny
    .from("provider_interventions")
    .select("*")
    .contains("metadata", { mission_id: mission.id })
    .order("created_at", { ascending: false });
}

async function resolveMissionId(req: NextRequest, params: Promise<{ id: string }>) {
  const segments = req.nextUrl.pathname.split("/").filter(Boolean);
  const pathId = segments[2] ?? "";
  if (isUuidLike(pathId)) return pathId;
  const routeId = (await params)?.id;
  return typeof routeId === "string" ? routeId.trim() : "";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiRole(req, ROLES);
  if (!guard.ok) return guard.response;
  const { userId, role } = guard.auth;
  const id = await resolveMissionId(req, params);
  if (!isUuidLike(id)) return NextResponse.json({ error: "Mission invalide" }, { status: 400 });

  const { data: mission } = await loadMission(id);
  if (!mission) return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  if (!canAccessMissionForRole({ role, userId, ownerProfileId: mission.owner_profile_id, conciergeProfileId: mission.concierge_profile_id })) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { data, error } = await loadProviderInterventionsForMission(mission);
  if (error) return NextResponse.json({ error: "Erreur chargement interventions" }, { status: 500 });
  const reports = await attachProviderInterventionReports(dbAny, data ?? []);
  return NextResponse.json({
    items: reports.items,
    completion_reports_schema_ready: reports.schemaReady,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await resolveCommercialPrincipalAccess(req);
  if (auth instanceof NextResponse) return auth;
  if (!CONCIERGE_MISSION_ROLES.has(auth.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (!missionAssignmentSchemaReady()) {
    return NextResponse.json({ error: "Affectations sécurisées non activées" }, { status: 503 });
  }
  const id = (await resolveMissionId(req, params)).toLowerCase();
  if (!isUuidLike(id)) return NextResponse.json({ error: "Mission invalide" }, { status: 400 });
  let body: Record<string, unknown>;
  try {
    const input: unknown = await req.json();
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error();
    body = input as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const providerId = typeof body.provider_profile_id === "string" ? body.provider_profile_id.trim().toLowerCase() : "";
  const operationId = req.headers.get("Idempotency-Key") ?? randomUUID();
  if (!isUuidLike(providerId) || !isUuidLike(operationId)) {
    return NextResponse.json({ error: "Identifiant de prestataire ou d’opération invalide" }, { status: 400 });
  }
  // Forward only RPC-supported parameters. Identities and relationships come from
  // authenticated server context and the locked mission, never the request body.
  const parameters: Record<string, unknown> = {};
  for (const key of ["title", "description", "service_label", "priority", "scheduled_start", "scheduled_end", "location_label"]) {
    if (typeof body[key] === "string") parameters[key] = body[key];
  }
  if (typeof body.budget_amount === "number" && Number.isFinite(body.budget_amount)) parameters.budget_amount = body.budget_amount;
  try {
    const { data, error } = await dbAny.rpc("create_mission_provider_assignment", {
      p_principal_id: auth.principalProfileId,
      p_actor_id: auth.userId,
      p_mission_id: id,
      p_provider_id: providerId,
      p_operation_id: operationId,
      p_parameters: parameters as Json,
    });
    if (error) {
      const status = error.code === "42501" ? 403 : error.code === "22023" || error.code?.startsWith("22") ? 400
        : ["23503", "23514", "23505", "55000", "40001", "40P01"].includes(error.code ?? "") ? 409 : 503;
      return NextResponse.json({ error: status === 403 ? "Accès refusé" : "Création de l’affectation indisponible ou refusée" }, { status });
    }
    // The SQL statement owns all writes and rolls back on failure. No REST fallback.
    const result = data as { intervention?: Record<string, unknown>; assignment?: { mission_id?: string; provider_profile_id?: string; provider_intervention_id?: string; state?: string }; replayed?: boolean } | null;
    if (!result?.intervention?.id || result.assignment?.mission_id !== id
      || result.assignment.provider_profile_id !== providerId
      || result.assignment.provider_intervention_id !== result.intervention.id
      || result.assignment.state !== "active") {
      return NextResponse.json({ error: "Réponse d’affectation invalide" }, { status: 503 });
    }
    return NextResponse.json(result.intervention, { status: result.replayed ? 200 : 201, headers: { "Idempotency-Key": operationId } });
  } catch {
    return NextResponse.json({ error: "Création de l’affectation indisponible" }, { status: 503 });
  }
}
