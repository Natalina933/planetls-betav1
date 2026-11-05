import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/app/lib/dbServer";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { requireApiRole } from "@/server/auth/roleGuards";
import type { PendingHousingCollaboration } from "@/features/housing-collaborations/types";
import { collaborationLifecycle } from "@/app/api/_shared/collaborationLifecycle";

export const dynamic = "force-dynamic";
const roles = new Set(["owner", "owner_pro", "concierge", "concierge_pro"]);
const headers = { "Cache-Control": "private, no-store" };
type Row = {
  scope?: unknown; ends_on?: string | null;
  id: string; housing_id: number; owner_profile_id: string; concierge_profile_id: string;
  quote_id: string | null; service_request_id: string | null; mission_id: string | null; status: PendingHousingCollaboration["status"];
};
type Person = { id: string; first_name: string | null; last_name: string | null; company_name: string | null };
type Housing = { id: number; nom_logement: string | null; proprietaire: Record<string, unknown> | null };
type Quote = { id: string; quote_number: string | null; status: string; owner_profile_id: string; concierge_profile_id: string; service_request_id: string | null; total_amount: number | null; currency: string | null; accepted_at: string | null; valid_until: string | null };
type Request = { id: string; title: string; owner_profile_id: string; requested_services?: string[] | null };
type Contract = { id: string; collaboration_id: string };
type Mission = { id: string; title: string; status: string | null };

const name = (person: Person | undefined, fallback: string) =>
  person?.company_name || `${person?.first_name ?? ""} ${person?.last_name ?? ""}`.trim() || fallback;

/**
 * GET /api/housing-collaborations/[id]
 * Récupère les détails d'une collaboration spécifique pour un propriétaire.
 * Vérifie que l'utilisateur authentifié est bien le propriétaire de la collaboration.
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Authentification et autorisation
    const guard = await requireApiRole(req, roles);
    if (!guard.ok) return guard.response;
    const { userId, role } = guard.auth;
    
    // Récupération de l'ID de la collaboration
    const { id: collaborationId } = await context.params;
    if (!z.string().uuid().safeParse(collaborationId).success) {
      return NextResponse.json({ error: "ID de collaboration invalide." }, { status: 400, headers });
    }

    const client = asLooseSupabaseClient(db);
    const now = new Date();

    // Récupération de la collaboration
    // Un propriétaire ne peut consulter que ses propres collaborations
    const column = role === "owner" || role === "owner_pro" ? "owner_profile_id" : "concierge_profile_id";
    const { data: rawRow, error: fetchError } = await client
      .from("housing_collaborations")
      .select("id,housing_id,owner_profile_id,concierge_profile_id,quote_id,service_request_id,mission_id,status,scope,ends_on")
      .eq("id", collaborationId)
      .eq(column, userId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!rawRow) {
      return NextResponse.json({ error: "Collaboration introuvable ou accès refusé." }, { status: 404, headers });
    }

    const row = rawRow as Row;
    const scope = row.scope as Record<string, unknown> | undefined;

    // Vérification du lifecycle
    if (collaborationLifecycle(row, now).invalid) {
      return NextResponse.json({ error: "Les dates de cette collaboration sont incohérentes." }, { status: 409, headers });
    }

    // Calcul du statut effectif
    const effectiveStatus = collaborationLifecycle(row, now).status as Row["status"];
    const termination = collaborationLifecycle(row, now).termination;

    // Récupération des données associées
    const [peopleResult, housingResult, quoteResult, requestResult, contractResult, missionResult] = await Promise.all([
      client.from("profiles").select("id,first_name,last_name,company_name").in("id", [row.owner_profile_id, row.concierge_profile_id]),
      client.from("housing").select("id,nom_logement,proprietaire").eq("id", row.housing_id).maybeSingle(),
      row.quote_id ? client.from("quotes").select("*").eq("id", row.quote_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
      row.service_request_id ? client.from("service_requests").select("id,title,owner_profile_id,requested_services").eq("id", row.service_request_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
      client.from("services_contracts").select("id").eq("collaboration_id", row.id).maybeSingle(),
      row.mission_id ? client.from("missions").select("id,title,status").eq("id", row.mission_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ]);

    if (peopleResult.error || housingResult.error) {
      throw new Error("Impossible de charger les références de la collaboration.");
    }

    const people = new Map((peopleResult.data as Person[]).map(p => [p.id, p]));
    const housing = housingResult.data as Housing | null;
    const quote = quoteResult.data as Quote | null;
    const request = requestResult.data as Request | null;
    const contract = contractResult.data as Contract | null;
    const mission = missionResult.data as Mission | null;

    // Vérification des références (sécurité)
    const ownerKeys = ["owner_profile_id", "owner_id", "proprietaire_id", "id", "userId", "profile_id"];
    const owners = housing?.proprietaire ? ownerKeys.map(key => housing.proprietaire[key]).filter(value => value != null && value !== "") : [];
    
    if (!housing || owners.length === 0 || owners.some(id => id !== row.owner_profile_id)) {
      return NextResponse.json({ error: "Références de logement incohérentes." }, { status: 409, headers });
    }

    // Construction de la réponse
    const item: PendingHousingCollaboration & {
      quote: PendingHousingCollaboration["quote"] & { total_amount?: number | null; currency?: string | null; accepted_at?: string | null; valid_until?: string | null };
      request: PendingHousingCollaboration["request"] & { requested_services?: string[] | null } | null;
      mission: { id: string; title: string; status: string | null } | null;
      termination?: Record<string, unknown> | null;
      collaboration_type?: string | null;
      start_date?: string | null;
    } = {
      id: row.id,
      status: effectiveStatus,
      owner: { id: row.owner_profile_id, name: name(people.get(row.owner_profile_id), "Propriétaire") },
      concierge: { id: row.concierge_profile_id, name: name(people.get(row.concierge_profile_id), "Concierge") },
      housing: { id: housing.id, name: housing.nom_logement || `Logement ${housing.id}` },
      quote: {
        id: quote?.id ?? row.quote_id ?? "",
        number: quote?.quote_number ?? null,
        total_amount: quote?.total_amount ?? null,
        currency: quote?.currency ?? null,
        accepted_at: quote?.accepted_at ?? null,
        valid_until: quote?.valid_until ?? null,
      },
      request: request ? {
        id: request.id,
        title: request.title,
        requested_services: request.requested_services ?? null,
      } : null,
      contractId: contract?.id ?? null,
      missionId: row.mission_id,
      mission: mission ? {
        id: mission.id,
        title: mission.title,
        status: mission.status,
      } : null,
      termination,
      // Champs supplémentaires pour le détail
      collaboration_type: scope?.type as string | null ?? null,
      start_date: scope?.start_date as string | null ?? null,
    };

    return NextResponse.json({ item }, { headers });
  } catch (error) {
    console.error("[GET /api/housing-collaborations/[id]]", error);
    return NextResponse.json({ error: "Impossible de charger les détails de la collaboration." }, { status: 500, headers });
  }
}
