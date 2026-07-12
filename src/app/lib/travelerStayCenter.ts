export const TRAVELER_STAY_STATUSES = [
  "to_prepare",
  "missing_information",
  "arrival_to_confirm",
  "ready_for_arrival",
  "guest_arrived",
  "stay_in_progress",
  "departure_to_prepare",
  "guest_left",
  "closed",
  "canceled",
  "incident_open",
] as const;

export type TravelerStayStatus = (typeof TRAVELER_STAY_STATUSES)[number];

export const TRAVELER_STAY_STATUS_LABELS: Record<TravelerStayStatus, string> = {
  to_prepare: "A preparer",
  missing_information: "Infos manquantes",
  arrival_to_confirm: "Arrivee a confirmer",
  ready_for_arrival: "Pret arrivee",
  guest_arrived: "Voyageur arrive",
  stay_in_progress: "Sejour en cours",
  departure_to_prepare: "Depart a preparer",
  guest_left: "Voyageur parti",
  closed: "Cloture",
  canceled: "Annule",
  incident_open: "Incident ouvert",
};

export type TravelerProfile = {
  id?: string | null;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  language?: string | null;
  previousStays?: number | null;
  notes?: string | null;
};

export type TravelerStayMission = {
  id: string;
  title: string;
  step?: string | null;
  status?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
};

export type TravelerStayIncident = {
  id: string;
  title: string;
  status?: string | null;
  priority?: string | null;
};

export type TravelerStayInput = {
  id: string;
  reservationId?: string | null;
  propertyLabel?: string | null;
  ownerName?: string | null;
  channel?: string | null;
  status?: string | null;
  primaryTraveler?: TravelerProfile | null;
  travelers?: TravelerProfile[];
  guestCount?: number | null;
  adultCount?: number | null;
  childCount?: number | null;
  petCount?: number | null;
  checkIn?: string | null;
  checkOut?: string | null;
  arrivalTimeConfirmed?: boolean | null;
  estimatedArrivalTime?: string | null;
  accessInstructionsReady?: boolean | null;
  accessCode?: string | null;
  keysAvailable?: boolean | null;
  cleaningDone?: boolean | null;
  qualityChecked?: boolean | null;
  linenReady?: boolean | null;
  consumablesReady?: boolean | null;
  equipmentChecked?: boolean | null;
  babyBedRequested?: boolean | null;
  babyBedConfirmed?: boolean | null;
  extraLinenRequested?: boolean | null;
  extraLinenConfirmed?: boolean | null;
  lateCheckoutRequested?: boolean | null;
  lateCheckoutConfirmed?: boolean | null;
  departureInstructionsReady?: boolean | null;
  checkoutInspectionDone?: boolean | null;
  depositReviewed?: boolean | null;
  preparationOverride?: boolean | null;
  preparationOverrideReason?: string | null;
  specialRequests?: string[] | null;
  missions?: TravelerStayMission[];
  incidents?: TravelerStayIncident[];
  messagesCount?: number | null;
  historyCount?: number | null;
  updatedAt?: string | null;
};

export type StayWorkflowStep = {
  id: string;
  label: string;
  description: string;
  done: boolean;
  critical?: boolean;
};

export type StayPreparationState = {
  steps: StayWorkflowStep[];
  blockers: string[];
  criticalBlockers: string[];
  completion: number;
  canMarkReady: boolean;
  overrideRequired: boolean;
};

export type StayDepartureState = {
  steps: StayWorkflowStep[];
  blockers: string[];
  completion: number;
  nextAction: string;
};

export type TravelerStay = TravelerStayInput & {
  status: TravelerStayStatus;
  primaryTraveler: TravelerProfile;
  preparation: StayPreparationState;
  departure: StayDepartureState;
};

export type TravelerStayDashboard = {
  total: number;
  today: number;
  arrivalsToday: number;
  departuresToday: number;
  inProgress: number;
  upcoming: number;
  completed: number;
  missingInformation: number;
  incidentsOpen: number;
  criticalBlockers: number;
};

const ONE_DAY = 24 * 60 * 60 * 1000;

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sameLocalDay(a: Date | null, b: Date) {
  if (!a) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function hasValue(value: unknown) {
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

function missionDone(missions: TravelerStayMission[] | undefined, steps: string[]) {
  return (missions ?? []).some((mission) => {
    const step = String(mission.step ?? "").toLowerCase();
    const title = mission.title.toLowerCase();
    const status = String(mission.status ?? "").toLowerCase();
    return steps.some((candidate) => step === candidate || title.includes(candidate)) && status === "completed";
  });
}

export function normalizeTravelerStayStatus(value: unknown): TravelerStayStatus {
  if (typeof value !== "string") return "to_prepare";
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if ((TRAVELER_STAY_STATUSES as readonly string[]).includes(normalized)) {
    return normalized as TravelerStayStatus;
  }
  if (normalized === "ready" || normalized === "prepared") return "ready_for_arrival";
  if (normalized === "in_progress" || normalized === "current") return "stay_in_progress";
  if (normalized === "completed" || normalized === "done") return "closed";
  if (normalized === "incident" || normalized === "blocked") return "incident_open";
  return "to_prepare";
}

export function deriveTravelerStayStatus(input: TravelerStayInput, now = new Date()): TravelerStayStatus {
  const explicit = normalizeTravelerStayStatus(input.status);
  if (explicit !== "to_prepare") return explicit;
  if ((input.incidents ?? []).some((incident) => String(incident.status ?? "open") !== "closed")) return "incident_open";

  const checkIn = parseDate(input.checkIn);
  const checkOut = parseDate(input.checkOut);
  if (checkOut && checkOut < now) return "closed";
  if (checkOut && sameLocalDay(checkOut, now)) return "departure_to_prepare";
  if (checkIn && checkOut && checkIn <= now && checkOut >= now) return "stay_in_progress";
  if (checkIn && sameLocalDay(checkIn, now)) return "arrival_to_confirm";
  return "to_prepare";
}

export function buildStayPreparation(input: TravelerStayInput): StayPreparationState {
  const cleaningDone = Boolean(input.cleaningDone || missionDone(input.missions, ["cleaning", "menage"]));
  const qualityDone = Boolean(input.qualityChecked || missionDone(input.missions, ["control", "controle"]));
  const hasArrivalTime = Boolean(input.arrivalTimeConfirmed || hasValue(input.estimatedArrivalTime));
  const accessReady = Boolean(input.accessInstructionsReady || hasValue(input.accessCode) || input.keysAvailable);
  const babyReady = !input.babyBedRequested || Boolean(input.babyBedConfirmed);
  const extraLinenReady = !input.extraLinenRequested || Boolean(input.extraLinenConfirmed);
  const openIncident = (input.incidents ?? []).some((incident) => String(incident.status ?? "open") !== "closed");

  const steps: StayWorkflowStep[] = [
    {
      id: "stay_identity",
      label: "Sejour identifie",
      description: "Logement, voyageur principal et dates sont connus.",
      done: hasValue(input.propertyLabel) && hasValue(input.primaryTraveler?.displayName) && hasValue(input.checkIn) && hasValue(input.checkOut),
      critical: true,
    },
    {
      id: "arrival_time",
      label: "Horaire d'arrivee",
      description: "Creneau d'arrivee confirme ou estime.",
      done: hasArrivalTime,
      critical: true,
    },
    {
      id: "access",
      label: "Acces pret",
      description: "Consignes, code ou cles disponibles pour l'arrivee.",
      done: accessReady,
      critical: true,
    },
    {
      id: "cleaning",
      label: "Menage termine",
      description: "Mission menage terminee ou validation manuelle.",
      done: cleaningDone,
      critical: true,
    },
    {
      id: "quality",
      label: "Controle qualite",
      description: "Controle logement, photos ou checklist de readiness.",
      done: qualityDone,
      critical: true,
    },
    {
      id: "linen_consumables",
      label: "Linge et consommables",
      description: "Linge, accueil et consommables operationnels.",
      done: Boolean(input.linenReady && input.consumablesReady),
    },
    {
      id: "equipment",
      label: "Equipements verifies",
      description: "Wifi, cles, chauffage, climatisation ou equipements sensibles verifies.",
      done: Boolean(input.equipmentChecked),
    },
    {
      id: "special_requests",
      label: "Demandes speciales",
      description: "Lit bebe, linge extra et demandes non sensibles traitees.",
      done: babyReady && extraLinenReady,
      critical: Boolean(input.babyBedRequested || input.extraLinenRequested),
    },
    {
      id: "incident_clearance",
      label: "Aucun incident bloquant",
      description: "Les incidents ouverts sont leves ou assumes avec trace.",
      done: !openIncident,
      critical: true,
    },
  ];

  const blockers = steps.filter((step) => !step.done).map((step) => step.label);
  const criticalBlockers = steps.filter((step) => step.critical && !step.done).map((step) => step.label);
  const completion = Math.round((steps.filter((step) => step.done).length / steps.length) * 100);
  const canMarkReady = criticalBlockers.length === 0 || Boolean(input.preparationOverride && input.preparationOverrideReason);

  return {
    steps,
    blockers,
    criticalBlockers,
    completion,
    canMarkReady,
    overrideRequired: criticalBlockers.length > 0 && !canMarkReady,
  };
}

export function buildStayDeparture(input: TravelerStayInput): StayDepartureState {
  const checkoutDone = Boolean(input.checkoutInspectionDone || missionDone(input.missions, ["checkout", "check-out"]));
  const cleaningPlanned = (input.missions ?? []).some((mission) => {
    const step = String(mission.step ?? "").toLowerCase();
    const title = mission.title.toLowerCase();
    return step === "cleaning" || title.includes("menage") || title.includes("cleaning");
  });
  const steps: StayWorkflowStep[] = [
    {
      id: "departure_time",
      label: "Depart cadré",
      description: "Heure ou consignes de depart communiquees.",
      done: Boolean(input.departureInstructionsReady || hasValue(input.checkOut)),
      critical: true,
    },
    {
      id: "late_checkout",
      label: "Late check-out tranche",
      description: "Demande de depart tardif confirmee ou absente.",
      done: !input.lateCheckoutRequested || Boolean(input.lateCheckoutConfirmed),
      critical: Boolean(input.lateCheckoutRequested),
    },
    {
      id: "inspection",
      label: "Inspection de depart",
      description: "Controle apres depart realise ou mission check-out terminee.",
      done: checkoutDone,
    },
    {
      id: "deposit",
      label: "Caution et anomalies",
      description: "Points de caution ou incidents relus sans decision automatique.",
      done: Boolean(input.depositReviewed),
    },
    {
      id: "turnover",
      label: "Rotation suivante",
      description: "Menage ou remise en etat planifiee apres depart.",
      done: cleaningPlanned,
    },
  ];
  const blockers = steps.filter((step) => step.critical && !step.done).map((step) => step.label);
  const completion = Math.round((steps.filter((step) => step.done).length / steps.length) * 100);
  const nextStep = steps.find((step) => !step.done);

  return {
    steps,
    blockers,
    completion,
    nextAction: nextStep?.label ?? "Cloturer le sejour",
  };
}

export function buildTravelerStay(input: TravelerStayInput, now = new Date()): TravelerStay {
  const primaryTraveler = input.primaryTraveler ?? input.travelers?.[0] ?? { displayName: "Voyageur a renseigner" };
  return {
    ...input,
    status: deriveTravelerStayStatus({ ...input, primaryTraveler }, now),
    primaryTraveler,
    preparation: buildStayPreparation({ ...input, primaryTraveler }),
    departure: buildStayDeparture({ ...input, primaryTraveler }),
  };
}

export function buildTravelerStayDashboard(stays: TravelerStayInput[], now = new Date()): TravelerStayDashboard {
  const normalized = stays.map((stay) => buildTravelerStay(stay, now));
  return normalized.reduce<TravelerStayDashboard>(
    (dashboard, stay) => {
      const checkIn = parseDate(stay.checkIn);
      const checkOut = parseDate(stay.checkOut);
      dashboard.total += 1;
      if (sameLocalDay(checkIn, now) || sameLocalDay(checkOut, now)) dashboard.today += 1;
      if (sameLocalDay(checkIn, now)) dashboard.arrivalsToday += 1;
      if (sameLocalDay(checkOut, now)) dashboard.departuresToday += 1;
      if (stay.status === "stay_in_progress" || (checkIn && checkOut && checkIn <= now && checkOut >= now)) dashboard.inProgress += 1;
      if (checkIn && checkIn.getTime() > now.getTime() && checkIn.getTime() < now.getTime() + 30 * ONE_DAY) dashboard.upcoming += 1;
      if (stay.status === "closed" || stay.status === "guest_left") dashboard.completed += 1;
      if (stay.status === "missing_information" || stay.preparation.criticalBlockers.length > 0) dashboard.missingInformation += 1;
      if (stay.status === "incident_open") dashboard.incidentsOpen += 1;
      dashboard.criticalBlockers += stay.preparation.criticalBlockers.length;
      return dashboard;
    },
    {
      total: 0,
      today: 0,
      arrivalsToday: 0,
      departuresToday: 0,
      inProgress: 0,
      upcoming: 0,
      completed: 0,
      missingInformation: 0,
      incidentsOpen: 0,
      criticalBlockers: 0,
    },
  );
}
