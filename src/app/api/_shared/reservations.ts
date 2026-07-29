import type { TravelerStayInput, TravelerStayMission } from "@/app/lib/travelerStayCenter";
import type { TravelerStayMissionRow } from "@/app/lib/travelerStaySupabase";

export const OWNER_RESERVATION_ROLES = new Set(["owner", "owner_pro", "admin", "super_admin"]);
export const CONCIERGE_RESERVATION_ROLES = new Set(["concierge", "concierge_pro", "admin", "super_admin"]);
export const RESERVATION_PARTICIPANT_ROLES = new Set([
  "owner",
  "owner_pro",
  "concierge",
  "concierge_pro",
  "admin",
  "super_admin",
]);

export type ReservationRow = {
  id: string;
  contract_id?: string | null;
  owner_profile_id: string;
  concierge_profile_id: string;
  property_id?: string | null;
  source?: string | null;
  external_reference?: string | null;
  channel?: string | null;
  traveler_first_name?: string | null;
  traveler_last_name?: string | null;
  traveler_phone?: string | null;
  traveler_email?: string | null;
  guest_count?: number | null;
  adults_count?: number | null;
  children_count?: number | null;
  infants_count?: number | null;
  pets_count?: number | null;
  check_in_at: string;
  check_out_at: string;
  arrival_time_window?: string | null;
  departure_time_window?: string | null;
  access_instructions?: string | null;
  owner_notes?: string | null;
  concierge_notes?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
  created_by_profile_id?: string | null;
  acknowledged_at?: string | null;
  completed_at?: string | null;
  canceled_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ProfileMini = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  username?: string | null;
  email?: string | null;
};

export type PropertyMini = {
  id: string;
  name?: string | null;
  city?: string | null;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function cleanNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function cleanBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "oui"].includes(normalized)) return true;
    if (["false", "0", "no", "non"].includes(normalized)) return false;
  }
  return null;
}

export function profileDisplayName(profile: ProfileMini | null | undefined, fallback = "Profil sans nom") {
  if (!profile) return fallback;
  const fullName = [cleanString(profile.first_name), cleanString(profile.last_name)].filter(Boolean).join(" ");
  return fullName || cleanString(profile.company_name) || cleanString(profile.username) || cleanString(profile.email) || fallback;
}

function missionToTravelerStayMission(mission: TravelerStayMissionRow): TravelerStayMission {
  const metadata = isRecord(mission.metadata) ? mission.metadata : {};
  return {
    id: mission.id,
    title: mission.title || "Mission séjour",
    step: cleanString(metadata.reservation_step) ?? cleanString(metadata.mission_step),
    status: mission.status,
    scheduledStart: mission.scheduled_start,
    scheduledEnd: mission.scheduled_end,
  };
}

export function getReservationMissionKey(mission: TravelerStayMissionRow) {
  const linkedReservationId = cleanString((mission as TravelerStayMissionRow & { reservation_id?: string | null }).reservation_id);
  if (linkedReservationId) return linkedReservationId;
  const metadata = isRecord(mission.metadata) ? mission.metadata : {};
  return cleanString(metadata.reservation_id) ?? cleanString(metadata.reservation_workflow_id);
}

export function reservationToTravelerStay(input: {
  reservation: ReservationRow;
  ownerName?: string | null;
  propertyLabel?: string | null;
  missions?: TravelerStayMissionRow[];
}): TravelerStayInput {
  const reservation = input.reservation;
  const metadata = isRecord(reservation.metadata) ? reservation.metadata : {};
  const travelerDisplayName =
    [cleanString(reservation.traveler_first_name), cleanString(reservation.traveler_last_name)].filter(Boolean).join(" ") ||
    cleanString(metadata.guest_name) ||
    cleanString(metadata.traveler_name) ||
    "Voyageur à renseigner";
  const missions = input.missions ?? [];
  const incidents = missions
    .filter((mission) => {
      const missionMetadata = isRecord(mission.metadata) ? mission.metadata : {};
      return mission.priority === "urgent" || missionMetadata.incident_open === true || missionMetadata.issue_flag === "urgent";
    })
    .map((mission) => ({
      id: mission.id,
      title: mission.title || "Incident séjour",
      status: mission.status === "completed" ? "closed" : "open",
      priority: mission.priority,
    }));

  return {
    id: reservation.id,
    reservationId: reservation.id,
    propertyLabel:
      input.propertyLabel ||
      cleanString(metadata.property_label) ||
      cleanString(metadata.housing_label) ||
      "Logement à renseigner",
    ownerName: input.ownerName || cleanString(metadata.owner_name),
    channel: cleanString(reservation.channel) ?? cleanString(metadata.channel) ?? cleanString(metadata.source),
    status: cleanString(metadata.traveler_stay_status) ?? cleanString(metadata.stay_status) ?? cleanString(reservation.status),
    primaryTraveler: {
      displayName: travelerDisplayName,
      email: cleanString(reservation.traveler_email) ?? cleanString(metadata.guest_email),
      phone: cleanString(reservation.traveler_phone) ?? cleanString(metadata.guest_phone),
      language: cleanString(metadata.guest_language),
      previousStays: cleanNumber(metadata.previous_stays),
      notes: cleanString(metadata.traveler_operational_notes) ?? cleanString(metadata.guest_notes),
    },
    guestCount: cleanNumber(reservation.guest_count) ?? cleanNumber(metadata.guest_count) ?? cleanNumber(metadata.guests),
    adultCount: cleanNumber(reservation.adults_count) ?? cleanNumber(metadata.guest_adults),
    childCount: cleanNumber(reservation.children_count) ?? cleanNumber(metadata.guest_children),
    petCount: cleanNumber(reservation.pets_count) ?? cleanNumber(metadata.guest_pets),
    checkIn: cleanString(reservation.check_in_at),
    checkOut: cleanString(reservation.check_out_at),
    arrivalTimeConfirmed: cleanBoolean(metadata.arrival_time_confirmed),
    estimatedArrivalTime: cleanString(metadata.estimated_arrival_time) ?? cleanString(reservation.arrival_time_window),
    accessInstructionsReady: cleanBoolean(metadata.access_instructions_ready),
    accessCode: cleanString(metadata.access_code),
    keysAvailable: cleanBoolean(metadata.keys_available),
    cleaningDone: missions.some((mission) => mission.status === "completed" && getReservationStep(mission) === "cleaning"),
    qualityChecked: missions.some((mission) => mission.status === "completed" && getReservationStep(mission) === "control"),
    linenReady: cleanBoolean(metadata.linen_ready),
    consumablesReady: cleanBoolean(metadata.consumables_ready),
    equipmentChecked: cleanBoolean(metadata.equipment_checked),
    babyBedRequested: cleanBoolean(metadata.baby_bed_requested),
    babyBedConfirmed: cleanBoolean(metadata.baby_bed_confirmed),
    extraLinenRequested: cleanBoolean(metadata.extra_linen_requested),
    extraLinenConfirmed: cleanBoolean(metadata.extra_linen_confirmed),
    lateCheckoutRequested: cleanBoolean(metadata.late_checkout_requested),
    lateCheckoutConfirmed: cleanBoolean(metadata.late_checkout_confirmed),
    departureInstructionsReady: cleanBoolean(metadata.departure_instructions_ready),
    checkoutInspectionDone: missions.some((mission) => mission.status === "completed" && getReservationStep(mission) === "checkout"),
    depositReviewed: cleanBoolean(metadata.deposit_reviewed),
    preparationOverride: cleanBoolean(metadata.preparation_override),
    preparationOverrideReason: cleanString(metadata.preparation_override_reason),
    specialRequests: Array.isArray(metadata.special_requests)
      ? metadata.special_requests.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [],
    missions: missions.map(missionToTravelerStayMission),
    incidents,
    messagesCount: cleanNumber(metadata.messages_count),
    historyCount: missions.length,
    updatedAt: cleanString(reservation.updated_at) ?? cleanString(reservation.created_at),
  };
}

export function getReservationStep(mission: TravelerStayMissionRow) {
  const metadata = isRecord(mission.metadata) ? mission.metadata : {};
  return cleanString(metadata.reservation_step) ?? cleanString(metadata.mission_step);
}
