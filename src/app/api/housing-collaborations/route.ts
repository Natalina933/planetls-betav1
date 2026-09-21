import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { requireApiRole } from "@/server/auth/roleGuards";
import type { PendingHousingCollaboration } from "@/features/housing-collaborations/types";

export const dynamic = "force-dynamic";
const roles = new Set(["owner", "owner_pro", "concierge", "concierge_pro"]);
const headers = { "Cache-Control": "private, no-store" };
type Row = {
  id: string; housing_id: number; owner_profile_id: string; concierge_profile_id: string;
  quote_id: string | null; service_request_id: string | null; mission_id: string | null; status: "pending_handover" | "active";
};
type Person = { id: string; first_name: string | null; last_name: string | null; company_name: string | null };
type Housing = { id: number; nom_logement: string | null; proprietaire: Record<string, unknown> | null };
type Quote = { id: string; quote_number: string | null; status: string; owner_profile_id: string; concierge_profile_id: string; service_request_id: string | null };
type Request = { id: string; title: string; owner_profile_id: string };
type Contract = { id: string; collaboration_id: string };
const name = (person: Person | undefined, fallback: string) =>
  person?.company_name || `${person?.first_name ?? ""} ${person?.last_name ?? ""}`.trim() || fallback;

export async function GET(req: NextRequest) {
  try {
    const guard = await requireApiRole(req, roles);
    if (!guard.ok) return guard.response;
    const { userId, role } = guard.auth;
    const client = asLooseSupabaseClient(db);
    const url = new URL(req.url);
    const requestedStatus = url.searchParams.get("status") === "active" ? "active" : "pending_handover";
    // The service-role client bypasses RLS: scope MUST come from authenticated identity.
    // Client-supplied participant IDs are deliberately ignored. No admin bypass.
    const { data, error } = await client.from("housing_collaborations")
      .select("id,housing_id,owner_profile_id,concierge_profile_id,quote_id,service_request_id,mission_id,status")
      .eq(role === "owner" || role === "owner_pro" ? "owner_profile_id" : "concierge_profile_id", userId)
      .eq("status", requestedStatus)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as Row[];
    if (!rows.length) return NextResponse.json({ items: [] }, { headers });
    const ids = (values: (string | number | null)[]) => [...new Set(values.filter((v) => v !== null))];
    const results = await Promise.all([
      client.from("profiles").select("id,first_name,last_name,company_name").in("id", ids(rows.flatMap(r => [r.owner_profile_id, r.concierge_profile_id]))),
      client.from("housing").select("id,nom_logement,proprietaire").in("id", ids(rows.map(r => r.housing_id))),
      client.from("quotes").select("id,quote_number,status,owner_profile_id,concierge_profile_id,service_request_id").in("id", ids(rows.map(r => r.quote_id))),
      rows.some(r => r.service_request_id)
        ? client.from("service_requests").select("id,title,owner_profile_id").in("id", ids(rows.map(r => r.service_request_id)))
        : Promise.resolve({ data: [], error: null }),
      requestedStatus === "active"
        ? client.from("services_contracts").select("id,collaboration_id").in("collaboration_id", ids(rows.map(r => r.id)))
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (results.some(r => r.error)) throw new Error("Collaboration references unavailable");
    const people = new Map((results[0].data as Person[]).map(p => [p.id, p]));
    const housings = new Map((results[1].data as Housing[]).map(h => [h.id, h]));
    const quotes = new Map((results[2].data as Quote[]).map(q => [q.id, q]));
    const requests = new Map((results[3].data as Request[]).map(r => [r.id, r]));
    const contracts = new Map((results[4].data as Contract[]).map(c => [c.collaboration_id, c]));
    const items: PendingHousingCollaboration[] = [];
    for (const row of rows) {
      const housing = housings.get(row.housing_id);
      const quote = row.quote_id ? quotes.get(row.quote_id) : undefined;
      const request = row.service_request_id ? requests.get(row.service_request_id) : undefined;
      const ownerKeys = ["owner_profile_id", "owner_id", "proprietaire_id", "id", "userId", "profile_id"];
      const owners = ownerKeys.map(key => housing?.proprietaire?.[key]).filter(value => value != null && value !== "");
      // Legacy insert/update RLS is broader than the contractual model. Fail closed
      // on inconsistent references rather than disclose another owner's details.
      if (!housing || !owners.length || owners.some(id => id !== row.owner_profile_id)
        || (requestedStatus === "pending_handover" && !quote)
        || (quote && (quote.status !== "accepted"
          || quote.owner_profile_id !== row.owner_profile_id || quote.concierge_profile_id !== row.concierge_profile_id
          || (quote.service_request_id && quote.service_request_id !== row.service_request_id)))
        || (row.service_request_id && (!request || request.owner_profile_id !== row.owner_profile_id))) {
        return NextResponse.json({ error: "Une collaboration comporte des références incohérentes. Consultation indisponible." }, { status: 409, headers });
      }
      items.push({
        id: row.id, status: row.status,
        owner: { id: row.owner_profile_id, name: name(people.get(row.owner_profile_id), "Propriétaire") },
        concierge: { id: row.concierge_profile_id, name: name(people.get(row.concierge_profile_id), "Concierge") },
        housing: { id: housing.id, name: housing.nom_logement || `Logement ${housing.id}` },
        quote: quote ? { id: quote.id, number: quote.quote_number } : { id: "", number: null },
        request: request ? { id: request.id, title: request.title } : null,
        contractId: contracts.get(row.id)?.id ?? null,
        missionId: row.mission_id,
      });
    }
    return NextResponse.json({ items }, { headers });
  } catch (error) {
    console.error("[GET /api/housing-collaborations]", error);
    return NextResponse.json({ error: "Impossible de charger les collaborations." }, { status: 500, headers });
  }
}
