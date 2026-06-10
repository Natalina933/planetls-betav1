export type BookingSource = "airbnb" | "abritel" | "autre";

export type Booking = {
  id: string;
  source: BookingSource;
  externalRef?: string;
  propertyId: string;
  ownerId: string;
  checkInDate: string;
  checkOutDate: string;
  guestName?: string;
  guestCount?: number;
  notes?: string;
  status?: "confirmee" | "modifiee" | "annulee";
};

export type QuoteStatus = "brouillon" | "envoye" | "accepte" | "refuse" | "annule";

export type Quote = {
  id: string;
  ownerId: string;
  conciergeId: string;
  propertyId: string;
  bookingId?: string;
  services: {
    id: string;
    label: string;
    description?: string;
    quantity: number;
    unitPrice: number;
  }[];
  totalAmount: number;
  currency: string;
  status: QuoteStatus;
  createdAt: string;
  acceptedAt?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  notes?: string;
};

export type MissionStatus =
  | "a_planifier"
  | "planifiee"
  | "en_cours"
  | "en_attente_validation"
  | "en_retard"
  | "terminee"
  | "annulee";

export type MissionType = "menage" | "maintenance" | "checkin" | "checkout" | "linge" | "autre";

export type Mission = {
  id: string;
  ownerId: string;
  conciergeId: string;
  propertyId: string;
  quoteId: string;
  bookingId?: string;
  type: MissionType;
  status: MissionStatus;
  date: string;
  timeSlot?: string;
  createdAt: string;
  updatedAt: string;
  isCriticalForNextStay?: boolean;
  visibleForOwner: boolean;
  visibleForConcierge: boolean;
  notesOwner?: string;
  notesConcierge?: string;
  cancellationReason?: string;
  paymentStatus?: "a_payer" | "en_attente" | "paye" | "litige";
  bookingChanged?: boolean;
};

export type MissionCalendarEvent = {
  id: string;
  date: string;
  timeSlot?: string;
  label: string;
  propertyName: string;
  type: Mission["type"];
  status: Mission["status"];
  href: string;
};

function inferMissionType(quote: Quote): MissionType {
  const labels = quote.services.map((service) => service.label.toLowerCase()).join(" ");
  if (labels.includes("ménage") || labels.includes("menage")) return "menage";
  if (labels.includes("maintenance") || labels.includes("réparation")) return "maintenance";
  if (labels.includes("check-in") || labels.includes("arrivée")) return "checkin";
  if (labels.includes("check-out") || labels.includes("départ")) return "checkout";
  if (labels.includes("linge")) return "linge";
  return "autre";
}

function buildTimeSlot(start?: string, end?: string) {
  if (!start || !end) return undefined;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return undefined;
  const formatter = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

export function createMissionFromAcceptedQuote(quote: Quote, booking?: Booking): Mission {
  const now = new Date().toISOString();
  const hasSchedule = Boolean(quote.scheduledStart);
  const missionType = inferMissionType(quote);
  const executionDate = quote.scheduledStart || booking?.checkInDate || now;
  const nextStayDate = booking?.checkInDate ? new Date(booking.checkInDate) : null;
  const executionDateTime = new Date(executionDate);
  const daysBeforeStay =
    nextStayDate && !Number.isNaN(executionDateTime.getTime())
      ? (nextStayDate.getTime() - executionDateTime.getTime()) / (24 * 60 * 60 * 1000)
      : null;

  return {
    id: crypto.randomUUID(),
    ownerId: quote.ownerId,
    conciergeId: quote.conciergeId,
    propertyId: quote.propertyId,
    quoteId: quote.id,
    bookingId: booking?.id || quote.bookingId,
    type: missionType,
    status: hasSchedule ? "planifiee" : "a_planifier",
    date: executionDate,
    timeSlot: buildTimeSlot(quote.scheduledStart, quote.scheduledEnd),
    createdAt: now,
    updatedAt: now,
    isCriticalForNextStay: daysBeforeStay !== null && daysBeforeStay <= 2 && missionType !== "autre",
    visibleForOwner: true,
    visibleForConcierge: true,
    notesOwner: quote.notes,
    paymentStatus: "a_payer",
    bookingChanged: booking?.status === "modifiee",
  };
}

export function mapMissionsToCalendarEvents(
  missions: Mission[],
  propertyNameById: Record<string, string>,
  persona: "owner" | "concierge",
): MissionCalendarEvent[] {
  return missions
    .filter((mission) => (persona === "owner" ? mission.visibleForOwner : mission.visibleForConcierge))
    .map((mission) => {
      const propertyName = propertyNameById[mission.propertyId] || "Logement à préciser";
      return {
        id: mission.id,
        date: mission.date,
        timeSlot: mission.timeSlot,
        label: `${propertyName} · ${mission.timeSlot || "Créneau à confirmer"}`,
        propertyName,
        type: mission.type,
        status: mission.status,
        href: `/dashboard/${persona}/missions/${mission.id}`,
      };
    });
}
