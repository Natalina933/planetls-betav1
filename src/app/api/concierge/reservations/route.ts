import { NextRequest, NextResponse } from "next/server";
import { insertMissionWithOptionalMetadata } from "@/app/api/_shared/missionInsert";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { buildReservationWorkflow, type ReservationWorkflowInput } from "@/app/lib/reservationPlanningEngine";
import { requireApiRole } from "@/server/auth/roleGuards";

const RESERVATION_ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro"]);
const dbAny = asLooseSupabaseClient(db);
const isUuidLike = (value: string | null | undefined): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

type MissionInsertRow = {
  id: string;
  title: string | null;
  status: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  metadata?: unknown;
};

function missionStatusFromPlan(status: string) {
  if (status === "assigned") return "assigned";
  if (status === "in_progress") return "in_progress";
  if (status === "completed") return "completed";
  if (status === "canceled") return "canceled";
  return "scheduled";
}

function toReservationInput(body: Record<string, unknown>, conciergeProfileId: string): ReservationWorkflowInput {
  const reservation = typeof body.reservation === "object" && body.reservation !== null
    ? (body.reservation as Record<string, unknown>)
    : body;

  return {
    reservationId: typeof reservation.reservation_id === "string" ? reservation.reservation_id : undefined,
    propertyId: typeof reservation.property_id === "string" ? reservation.property_id : null,
    propertyLabel: typeof reservation.property_label === "string" ? reservation.property_label : null,
    ownerProfileId: typeof reservation.owner_profile_id === "string" ? reservation.owner_profile_id : null,
    conciergeProfileId,
    guestName: typeof reservation.guest_name === "string" ? reservation.guest_name : null,
    checkIn: String(reservation.check_in ?? reservation.checkIn ?? ""),
    checkOut: String(reservation.check_out ?? reservation.checkOut ?? ""),
    currency: typeof reservation.currency === "string" ? reservation.currency : "EUR",
    accommodationAmount: typeof reservation.accommodation_amount === "number" ? reservation.accommodation_amount : null,
    cleaningAmount: typeof reservation.cleaning_amount === "number" ? reservation.cleaning_amount : null,
    maintenanceRequested: Boolean(reservation.maintenance_requested),
    source: typeof body.source === "string" ? body.source : "api_concierge_reservations",
  };
}

export async function GET(req: NextRequest) {
  try {
    const guard = await requireApiRole(req, RESERVATION_ROLES);
    if (!guard.ok) return guard.response;
    const { userId, role } = guard.auth;
    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get("limit") ?? "80");
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 80;

    let query = dbAny
      .from("missions")
      .select("id, title, status, priority, scheduled_start, scheduled_end, amount, currency, concierge_profile_id, owner_profile_id, property_id, metadata, created_at, updated_at")
      .contains("metadata", { reservation_workflow: true })
      .order("scheduled_start", { ascending: true })
      .limit(limit);

    if (role !== "admin" && role !== "super_admin") {
      query = query.eq("concierge_profile_id", userId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[GET /api/concierge/reservations] DB error:", error);
      return NextResponse.json({ error: "Erreur chargement reservations" }, { status: 500 });
    }

    const workflows = new Map<string, Record<string, unknown>>();
    for (const mission of (data ?? []) as Array<Record<string, unknown>>) {
      const metadata = mission.metadata && typeof mission.metadata === "object" ? mission.metadata as Record<string, unknown> : {};
      const workflowId = typeof metadata.reservation_workflow_id === "string" ? metadata.reservation_workflow_id : null;
      if (!workflowId) continue;
      const current = workflows.get(workflowId) ?? {
        id: workflowId,
        reservation: {
          property_label: metadata.property_label ?? null,
          guest_name: metadata.guest_name ?? null,
          check_in: metadata.check_in ?? null,
          check_out: metadata.check_out ?? null,
        },
        missions: [],
      };
      (current.missions as unknown[]).push(mission);
      workflows.set(workflowId, current);
    }

    return NextResponse.json({ workflows: Array.from(workflows.values()) });
  } catch (error) {
    console.error("[GET /api/concierge/reservations] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireApiRole(req, RESERVATION_ROLES);
    if (!guard.ok) return guard.response;
    const { userId } = guard.auth;
    const body = (await req.json()) as Record<string, unknown>;
    const workflow = buildReservationWorkflow(toReservationInput(body, userId));
    const createdMissions: MissionInsertRow[] = [];

    for (const plan of workflow.missionPlans) {
      const { data, error } = await insertMissionWithOptionalMetadata<MissionInsertRow>(
        db,
        {
          concierge_profile_id: workflow.reservation.conciergeProfileId,
          owner_profile_id: workflow.reservation.ownerProfileId,
          property_id: isUuidLike(workflow.reservation.propertyId) ? workflow.reservation.propertyId : null,
          title: plan.title,
          description: plan.description,
          status: missionStatusFromPlan(plan.status),
          priority: plan.priority,
          amount: plan.amount,
          currency: plan.currency,
          scheduled_start: plan.scheduledStart,
          scheduled_end: plan.scheduledEnd,
          metadata: {
            ...plan.metadata,
            property_housing_id: !isUuidLike(workflow.reservation.propertyId) ? workflow.reservation.propertyId : null,
            assigned_profile_id: plan.assignedProfileId,
          },
        },
        "id, title, status, scheduled_start, scheduled_end, metadata",
      );

      if (error || !data) {
        console.error("[POST /api/concierge/reservations] mission insert error:", error);
        return NextResponse.json(
          { error: "Creation partielle impossible", created_missions: createdMissions, details: error?.message },
          { status: 500 },
        );
      }
      createdMissions.push(data);

      await dbAny.from("mission_events").insert({
        mission_id: data.id,
        actor_profile_id: userId,
        event_type: "reservation_step_created",
        payload: {
          reservation_workflow_id: workflow.id,
          reservation_step: plan.stepId,
        },
      });
    }

    const billingMission = createdMissions.find((mission) => {
      const metadata = mission.metadata && typeof mission.metadata === "object" ? mission.metadata as Record<string, unknown> : {};
      return metadata.reservation_step === "billing";
    });

    const invoiceNumber = `RES-${workflow.id.slice(0, 12).toUpperCase()}-${Date.now().toString().slice(-5)}`;
    const { data: invoice, error: invoiceError } = await dbAny
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        concierge_profile_id: workflow.reservation.conciergeProfileId,
        owner_profile_id: workflow.reservation.ownerProfileId,
        mission_id: billingMission?.id ?? createdMissions[0]?.id ?? null,
        status: workflow.invoicePlan.status,
        issue_date: workflow.invoicePlan.issueDate,
        due_date: workflow.invoicePlan.dueDate,
        currency: workflow.invoicePlan.currency,
        subtotal: workflow.invoicePlan.subtotal,
        total_amount: workflow.invoicePlan.totalAmount,
        balance_amount: workflow.invoicePlan.balanceAmount,
        metadata: {
          ...workflow.invoicePlan.metadata,
          mission_ids: createdMissions.map((mission) => mission.id),
        },
      })
      .select("id, invoice_number, status, total_amount, balance_amount, metadata")
      .single();

    if (invoiceError) {
      console.error("[POST /api/concierge/reservations] invoice insert error:", invoiceError);
    }

    return NextResponse.json({ workflow, missions: createdMissions, invoice: invoice ?? null }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("[POST /api/concierge/reservations] ERROR:", error);
    return NextResponse.json({ error: message }, { status: message.includes("invalide") ? 400 : 500 });
  }
}