export type ReservationWorkflowStepId =
  | "reservation"
  | "cleaning"
  | "control"
  | "welcome"
  | "checkin"
  | "checkout"
  | "maintenance"
  | "billing";

export type ReservationWorkflowAction = "move" | "delete" | "replan" | "assign" | "follow";

export type ReservationWorkflowStatus =
  | "planned"
  | "assigned"
  | "in_progress"
  | "completed"
  | "canceled";

export type ReservationWorkflowInput = {
  reservationId?: string;
  propertyId?: string | null;
  propertyLabel?: string | null;
  ownerProfileId?: string | null;
  conciergeProfileId: string;
  guestName?: string | null;
  checkIn: string;
  checkOut: string;
  currency?: string | null;
  accommodationAmount?: number | null;
  cleaningAmount?: number | null;
  maintenanceRequested?: boolean;
  source?: string | null;
};

export type ReservationMissionPlan = {
  stepId: Exclude<ReservationWorkflowStepId, "reservation">;
  title: string;
  description: string;
  status: ReservationWorkflowStatus;
  priority: "low" | "normal" | "high" | "urgent";
  scheduledStart: string;
  scheduledEnd: string;
  amount: number | null;
  currency: string;
  assignedProfileId: string | null;
  metadata: Record<string, unknown>;
};

export type ReservationInvoicePlan = {
  status: "draft" | "issued";
  issueDate: string;
  dueDate: string;
  subtotal: number;
  totalAmount: number;
  balanceAmount: number;
  currency: string;
  metadata: Record<string, unknown>;
};

export type ReservationWorkflow = {
  id: string;
  reservation: {
    id: string;
    propertyId: string | null;
    propertyLabel: string;
    ownerProfileId: string | null;
    conciergeProfileId: string;
    guestName: string | null;
    checkIn: string;
    checkOut: string;
  };
  missionPlans: ReservationMissionPlan[];
  invoicePlan: ReservationInvoicePlan;
  availableActions: ReservationWorkflowAction[];
};

const MINUTE = 60 * 1000;

function parseDate(value: string, label: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} invalide`);
  }
  return date;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * MINUTE);
}

function toIso(date: Date) {
  return date.toISOString();
}

function makeWorkflowId(input: ReservationWorkflowInput) {
  if (input.reservationId?.trim()) return input.reservationId.trim();
  const basis = `${input.propertyId ?? "property"}-${input.checkIn}-${input.checkOut}`;
  return `reservation-${Buffer.from(basis).toString("base64url").slice(0, 18)}`;
}

function buildMissionMetadata(input: {
  workflowId: string;
  reservationId: string;
  stepId: ReservationMissionPlan["stepId"];
  propertyLabel: string;
  guestName: string | null;
  checkIn: string;
  checkOut: string;
  source?: string | null;
}) {
  return {
    reservation_workflow: true,
    reservation_workflow_id: input.workflowId,
    reservation_id: input.reservationId,
    reservation_step: input.stepId,
    property_label: input.propertyLabel,
    guest_name: input.guestName,
    check_in: input.checkIn,
    check_out: input.checkOut,
    source: input.source ?? "reservation_planning_engine",
  };
}

function missionPlan(input: {
  workflowId: string;
  reservationId: string;
  stepId: ReservationMissionPlan["stepId"];
  title: string;
  description: string;
  start: Date;
  durationMinutes: number;
  amount?: number | null;
  currency: string;
  propertyLabel: string;
  guestName: string | null;
  checkIn: string;
  checkOut: string;
  conciergeProfileId: string;
  priority?: ReservationMissionPlan["priority"];
  source?: string | null;
}): ReservationMissionPlan {
  return {
    stepId: input.stepId,
    title: input.title,
    description: input.description,
    status: "planned",
    priority: input.priority ?? "normal",
    scheduledStart: toIso(input.start),
    scheduledEnd: toIso(addMinutes(input.start, input.durationMinutes)),
    amount: input.amount ?? null,
    currency: input.currency,
    assignedProfileId: input.conciergeProfileId,
    metadata: buildMissionMetadata(input),
  };
}

export function buildReservationWorkflow(input: ReservationWorkflowInput): ReservationWorkflow {
  const checkIn = parseDate(input.checkIn, "check-in");
  const checkOut = parseDate(input.checkOut, "check-out");
  if (checkOut <= checkIn) {
    throw new Error("Le check-out doit etre apres le check-in");
  }

  const workflowId = makeWorkflowId(input);
  const reservationId = input.reservationId?.trim() || workflowId;
  const propertyLabel = input.propertyLabel?.trim() || "Logement";
  const currency = input.currency || "EUR";
  const cleaningAmount = input.cleaningAmount ?? null;
  const accommodationAmount = input.accommodationAmount ?? 0;
  const guestName = input.guestName?.trim() || null;
  const common = {
    workflowId,
    reservationId,
    propertyLabel,
    guestName,
    checkIn: toIso(checkIn),
    checkOut: toIso(checkOut),
    conciergeProfileId: input.conciergeProfileId,
    currency,
    source: input.source,
  };

  const missionPlans: ReservationMissionPlan[] = [
    missionPlan({
      ...common,
      stepId: "cleaning",
      title: `Menage avant arrivee - ${propertyLabel}`,
      description: "Preparation complete du logement avant arrivee voyageur.",
      start: addMinutes(checkIn, -5 * 60),
      durationMinutes: 120,
      amount: cleaningAmount,
      priority: "high",
    }),
    missionPlan({
      ...common,
      stepId: "control",
      title: `Controle qualite - ${propertyLabel}`,
      description: "Controle readiness, consommables, linge et preuves photo.",
      start: addMinutes(checkIn, -2 * 60),
      durationMinutes: 45,
      priority: "high",
    }),
    missionPlan({
      ...common,
      stepId: "welcome",
      title: `Accueil voyageur - ${propertyLabel}`,
      description: "Preparation accueil, instructions et coordination voyageur.",
      start: addMinutes(checkIn, -60),
      durationMinutes: 30,
    }),
    missionPlan({
      ...common,
      stepId: "checkin",
      title: `Check-in - ${propertyLabel}`,
      description: "Suivi de l'arrivee voyageur et resolution des points d'entree.",
      start: checkIn,
      durationMinutes: 45,
      priority: "high",
    }),
    missionPlan({
      ...common,
      stepId: "checkout",
      title: `Check-out - ${propertyLabel}`,
      description: "Suivi depart voyageur, inspection rapide et signalement anomalies.",
      start: checkOut,
      durationMinutes: 45,
    }),
    missionPlan({
      ...common,
      stepId: "billing",
      title: `Facturation reservation - ${propertyLabel}`,
      description: "Verification des montants, extras et generation de la facturation.",
      start: addMinutes(checkOut, 2 * 60),
      durationMinutes: 30,
      amount: accommodationAmount + (cleaningAmount ?? 0),
    }),
  ];

  if (input.maintenanceRequested) {
    missionPlans.splice(
      missionPlans.length - 1,
      0,
      missionPlan({
        ...common,
        stepId: "maintenance",
        title: `Maintenance apres sejour - ${propertyLabel}`,
        description: "Diagnostic et intervention eventuelle apres depart voyageur.",
        start: addMinutes(checkOut, 60),
        durationMinutes: 90,
        priority: "normal",
      }),
    );
  }

  const subtotal = accommodationAmount + (cleaningAmount ?? 0);
  const issueDate = toIso(addMinutes(checkOut, 2 * 60)).slice(0, 10);
  const dueDate = toIso(addMinutes(checkOut, 7 * 24 * 60)).slice(0, 10);

  return {
    id: workflowId,
    reservation: {
      id: reservationId,
      propertyId: input.propertyId ?? null,
      propertyLabel,
      ownerProfileId: input.ownerProfileId ?? null,
      conciergeProfileId: input.conciergeProfileId,
      guestName,
      checkIn: toIso(checkIn),
      checkOut: toIso(checkOut),
    },
    missionPlans,
    invoicePlan: {
      status: "draft",
      issueDate,
      dueDate,
      subtotal,
      totalAmount: subtotal,
      balanceAmount: subtotal,
      currency,
      metadata: {
        reservation_workflow: true,
        reservation_workflow_id: workflowId,
        reservation_id: reservationId,
        check_in: toIso(checkIn),
        check_out: toIso(checkOut),
        property_label: propertyLabel,
        guest_name: guestName,
      },
    },
    availableActions: ["move", "delete", "replan", "assign", "follow"],
  };
}

function shiftPlan(plan: ReservationMissionPlan, deltaMinutes: number): ReservationMissionPlan {
  return {
    ...plan,
    scheduledStart: toIso(addMinutes(parseDate(plan.scheduledStart, "debut mission"), deltaMinutes)),
    scheduledEnd: toIso(addMinutes(parseDate(plan.scheduledEnd, "fin mission"), deltaMinutes)),
    metadata: {
      ...plan.metadata,
      moved_by_minutes: Number(plan.metadata.moved_by_minutes ?? 0) + deltaMinutes,
    },
  };
}

export function moveReservationWorkflow(workflow: ReservationWorkflow, deltaMinutes: number): ReservationWorkflow {
  return {
    ...workflow,
    reservation: {
      ...workflow.reservation,
      checkIn: toIso(addMinutes(parseDate(workflow.reservation.checkIn, "check-in"), deltaMinutes)),
      checkOut: toIso(addMinutes(parseDate(workflow.reservation.checkOut, "check-out"), deltaMinutes)),
    },
    missionPlans: workflow.missionPlans.map((plan) => shiftPlan(plan, deltaMinutes)),
  };
}

export function replanReservationStep(
  workflow: ReservationWorkflow,
  stepId: ReservationMissionPlan["stepId"],
  scheduledStart: string,
  scheduledEnd?: string | null,
): ReservationWorkflow {
  const start = parseDate(scheduledStart, "nouveau debut");
  const end = scheduledEnd ? parseDate(scheduledEnd, "nouvelle fin") : addMinutes(start, 60);
  if (end <= start) throw new Error("La fin doit etre apres le debut");

  return {
    ...workflow,
    missionPlans: workflow.missionPlans.map((plan) =>
      plan.stepId === stepId
        ? {
            ...plan,
            scheduledStart: toIso(start),
            scheduledEnd: toIso(end),
            metadata: { ...plan.metadata, replanned_at: new Date().toISOString() },
          }
        : plan,
    ),
  };
}

export function assignReservationStep(
  workflow: ReservationWorkflow,
  stepId: ReservationMissionPlan["stepId"],
  profileId: string,
): ReservationWorkflow {
  return {
    ...workflow,
    missionPlans: workflow.missionPlans.map((plan) =>
      plan.stepId === stepId
        ? {
            ...plan,
            status: "assigned",
            assignedProfileId: profileId,
            metadata: { ...plan.metadata, assigned_profile_id: profileId },
          }
        : plan,
    ),
  };
}

export function updateReservationStepStatus(
  workflow: ReservationWorkflow,
  stepId: ReservationMissionPlan["stepId"],
  status: ReservationWorkflowStatus,
): ReservationWorkflow {
  return {
    ...workflow,
    missionPlans: workflow.missionPlans.map((plan) =>
      plan.stepId === stepId
        ? {
            ...plan,
            status,
            metadata: { ...plan.metadata, followed_status: status, followed_at: new Date().toISOString() },
          }
        : plan,
    ),
  };
}

export function deleteReservationStep(
  workflow: ReservationWorkflow,
  stepId: ReservationMissionPlan["stepId"],
): ReservationWorkflow {
  return {
    ...workflow,
    missionPlans: workflow.missionPlans.map((plan) =>
      plan.stepId === stepId
        ? {
            ...plan,
            status: "canceled",
            metadata: { ...plan.metadata, deleted_at: new Date().toISOString() },
          }
        : plan,
    ),
  };
}
