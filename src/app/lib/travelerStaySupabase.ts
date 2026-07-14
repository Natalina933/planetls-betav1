import type { TravelerStayInput, TravelerStayMission } from "./travelerStayCenter";

export type TravelerStayMissionRow = {
  id: string;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  amount?: number | null;
  currency?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TravelerStayReservationWorkflow = {
  id: string;
  reservation?: {
    property_label?: unknown;
    guest_name?: unknown;
    check_in?: unknown;
    check_out?: unknown;
  };
  missions?: TravelerStayMissionRow[];
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function boolValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "yes", "1"].includes(value.toLowerCase());
  return null;
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function getGuestName(metadata: Record<string, unknown> | null | undefined, fallback?: unknown) {
  return (
    stringValue(metadata?.guest_name) ??
    stringValue(metadata?.traveler_name) ??
    stringValue(metadata?.primary_guest_name) ??
    stringValue(fallback) ??
    "Voyageur à renseigner"
  );
}

function missionToStayMission(mission: TravelerStayMissionRow): TravelerStayMission {
  const metadata = isRecord(mission.metadata) ? mission.metadata : {};
  return {
    id: mission.id,
    title: mission.title || "Mission séjour",
    step: stringValue(metadata.reservation_step) ?? stringValue(metadata.mission_step),
    status: mission.status,
    scheduledStart: mission.scheduled_start,
    scheduledEnd: mission.scheduled_end,
  };
}

export function workflowToTravelerStay(workflow: TravelerStayReservationWorkflow): TravelerStayInput {
  const missions = workflow.missions ?? [];
  const firstMission = missions[0];
  const metadata = isRecord(firstMission?.metadata) ? firstMission.metadata : {};
  const reservation = workflow.reservation ?? {};
  const checkIn = stringValue(reservation.check_in) ?? stringValue(metadata.check_in) ?? firstMission?.scheduled_start ?? null;
  const checkOut = stringValue(reservation.check_out) ?? stringValue(metadata.check_out) ?? missions.at(-1)?.scheduled_end ?? null;
  const guestCount =
    numberValue(metadata.guest_count) ??
    numberValue(metadata.guests) ??
    ((numberValue(metadata.guest_adults) ?? 0) + (numberValue(metadata.guest_children) ?? 0) || null);
  const incidents = missions
    .filter((mission) => mission.priority === "urgent" || mission.metadata?.incident_open === true || mission.metadata?.issue_flag === "urgent")
    .map((mission) => ({
      id: mission.id,
      title: mission.title || "Incident séjour",
      status: mission.status === "completed" ? "closed" : "open",
      priority: mission.priority,
    }));

  return {
    id: workflow.id,
    reservationId: workflow.id,
    propertyLabel: stringValue(reservation.property_label) ?? stringValue(metadata.property_label) ?? "Logement à renseigner",
    ownerName: stringValue(metadata.owner_name),
    channel: stringValue(metadata.booking_source) ?? stringValue(metadata.channel) ?? stringValue(metadata.source),
    status: stringValue(metadata.traveler_stay_status) ?? stringValue(metadata.stay_status),
    primaryTraveler: {
      displayName: getGuestName(metadata, reservation.guest_name),
      email: stringValue(metadata.guest_email),
      phone: stringValue(metadata.guest_phone),
      language: stringValue(metadata.guest_language),
      previousStays: numberValue(metadata.previous_stays),
      notes: stringValue(metadata.traveler_operational_notes) ?? stringValue(metadata.guest_notes),
    },
    guestCount,
    adultCount: numberValue(metadata.guest_adults),
    childCount: numberValue(metadata.guest_children),
    petCount: numberValue(metadata.guest_pets),
    checkIn,
    checkOut,
    arrivalTimeConfirmed: boolValue(metadata.arrival_time_confirmed),
    estimatedArrivalTime: stringValue(metadata.estimated_arrival_time),
    accessInstructionsReady: boolValue(metadata.access_instructions_ready),
    accessCode: stringValue(metadata.access_code),
    keysAvailable: boolValue(metadata.keys_available),
    cleaningDone: missions.some((mission) => mission.status === "completed" && mission.metadata?.reservation_step === "cleaning"),
    qualityChecked: missions.some((mission) => mission.status === "completed" && mission.metadata?.reservation_step === "control"),
    linenReady: boolValue(metadata.linen_ready),
    consumablesReady: boolValue(metadata.consumables_ready),
    equipmentChecked: boolValue(metadata.equipment_checked),
    babyBedRequested: boolValue(metadata.baby_bed_requested),
    babyBedConfirmed: boolValue(metadata.baby_bed_confirmed),
    extraLinenRequested: boolValue(metadata.extra_linen_requested),
    extraLinenConfirmed: boolValue(metadata.extra_linen_confirmed),
    lateCheckoutRequested: boolValue(metadata.late_checkout_requested),
    lateCheckoutConfirmed: boolValue(metadata.late_checkout_confirmed),
    departureInstructionsReady: boolValue(metadata.departure_instructions_ready),
    checkoutInspectionDone: missions.some((mission) => mission.status === "completed" && mission.metadata?.reservation_step === "checkout"),
    depositReviewed: boolValue(metadata.deposit_reviewed),
    preparationOverride: boolValue(metadata.preparation_override),
    preparationOverrideReason: stringValue(metadata.preparation_override_reason),
    specialRequests: arrayValue(metadata.special_requests),
    missions: missions.map(missionToStayMission),
    incidents,
    messagesCount: numberValue(metadata.messages_count),
    historyCount: missions.length,
    updatedAt: firstMission?.updated_at,
  };
}

export function missionLooksLikeTravelerStay(mission: TravelerStayMissionRow) {
  const metadata = isRecord(mission.metadata) ? mission.metadata : {};
  const title = `${mission.title ?? ""} ${mission.description ?? ""}`.toLowerCase();
  return Boolean(
    metadata.reservation_workflow ||
      metadata.mission_kind === "traveler_stay" ||
      metadata.guest_name ||
      metadata.traveler_name ||
      metadata.check_in ||
      metadata.check_out ||
      title.includes("check-in") ||
      title.includes("check-out") ||
      title.includes("voyageur") ||
      title.includes("accueil"),
  );
}

export function missionToTravelerStay(mission: TravelerStayMissionRow): TravelerStayInput {
  const metadata = isRecord(mission.metadata) ? mission.metadata : {};
  return {
    id: stringValue(metadata.reservation_workflow_id) ?? stringValue(metadata.reservation_id) ?? mission.id,
    reservationId: stringValue(metadata.reservation_id) ?? stringValue(metadata.reservation_workflow_id),
    propertyLabel: stringValue(metadata.property_label) ?? stringValue(metadata.housing_label) ?? "Logement à renseigner",
    channel: stringValue(metadata.booking_source) ?? stringValue(metadata.channel),
    status: stringValue(metadata.traveler_stay_status) ?? stringValue(metadata.stay_status),
    primaryTraveler: {
      displayName: getGuestName(metadata),
      phone: stringValue(metadata.guest_phone),
      email: stringValue(metadata.guest_email),
      language: stringValue(metadata.guest_language),
      previousStays: numberValue(metadata.previous_stays),
      notes: stringValue(metadata.traveler_operational_notes),
    },
    guestCount: numberValue(metadata.guest_count) ?? numberValue(metadata.guests),
    adultCount: numberValue(metadata.guest_adults),
    childCount: numberValue(metadata.guest_children),
    petCount: numberValue(metadata.guest_pets),
    checkIn: stringValue(metadata.check_in) ?? mission.scheduled_start,
    checkOut: stringValue(metadata.check_out) ?? mission.scheduled_end,
    arrivalTimeConfirmed: boolValue(metadata.arrival_time_confirmed),
    estimatedArrivalTime: stringValue(metadata.estimated_arrival_time),
    accessInstructionsReady: boolValue(metadata.access_instructions_ready),
    accessCode: stringValue(metadata.access_code),
    keysAvailable: boolValue(metadata.keys_available),
    cleaningDone: mission.status === "completed" && metadata.reservation_step === "cleaning",
    qualityChecked: boolValue(metadata.quality_checked),
    linenReady: boolValue(metadata.linen_ready),
    consumablesReady: boolValue(metadata.consumables_ready),
    equipmentChecked: boolValue(metadata.equipment_checked),
    departureInstructionsReady: boolValue(metadata.departure_instructions_ready),
    checkoutInspectionDone: mission.status === "completed" && metadata.reservation_step === "checkout",
    depositReviewed: boolValue(metadata.deposit_reviewed),
    specialRequests: arrayValue(metadata.special_requests),
    missions: [missionToStayMission(mission)],
    incidents:
      mission.priority === "urgent" || metadata.incident_open === true
        ? [{ id: mission.id, title: mission.title || "Incident séjour", status: mission.status === "completed" ? "closed" : "open", priority: mission.priority }]
        : [],
    messagesCount: numberValue(metadata.messages_count),
    historyCount: 1,
    updatedAt: mission.updated_at,
  };
}

export function mergeDuplicateTravelerStays(stays: TravelerStayInput[]) {
  const byId = new Map<string, TravelerStayInput>();
  for (const stay of stays) {
    const existing = byId.get(stay.id);
    if (!existing) {
      byId.set(stay.id, stay);
      continue;
    }
    byId.set(stay.id, {
      ...existing,
      ...stay,
      missions: [...(existing.missions ?? []), ...(stay.missions ?? [])],
      incidents: [...(existing.incidents ?? []), ...(stay.incidents ?? [])],
      primaryTraveler: existing.primaryTraveler?.displayName !== "Voyageur à renseigner" ? existing.primaryTraveler : stay.primaryTraveler,
    });
  }
  return Array.from(byId.values());
}

export function workflowsAndMissionsToTravelerStays(input: {
  workflows?: TravelerStayReservationWorkflow[];
  missions?: TravelerStayMissionRow[];
}) {
  return mergeDuplicateTravelerStays([
    ...(input.workflows ?? []).map(workflowToTravelerStay),
    ...(input.missions ?? []).filter(missionLooksLikeTravelerStay).map(missionToTravelerStay),
  ]);
}


