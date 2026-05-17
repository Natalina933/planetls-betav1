"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Copy,
  Eye,
  FileText,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquareText,
  Phone,
  Route,
  Send,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { Button, ButtonLink, Input, Select, Textarea } from "@/components/ui";
import { ServiceRequestCard, type ServiceRequestCardTone, type ServiceRequestFact, type ServiceRequestMilestone } from "@/features/service-requests";
import { formatDateValue } from "@/app/utils/formatters";
import styles from "./OwnerTravelerMissionsPage.module.scss";
import { isAcceptedMissionPartner, isUuidLike } from "../missionPartnerUtils";

type HousingRow = {
  id: string | number;
  nom_logement?: string | null;
  ville?: string | null;
  adresse?: string | null;
  photo_principale?: string | null;
};

type PartnerRequestRow = {
  id: string;
  title?: string | null;
  property_id?: string | null;
  property_name?: string | null;
  city?: string | null;
  selected_concierge_profile_id?: string | null;
  selected_concierge_name?: string | null;
  status?: string | null;
  workflow_status?: string | null;
  mission_id?: string | null;
  recipients?: Array<{ status?: string | null }> | null;
};

type MissionRow = {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  property_id: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  metadata?: Record<string, unknown> | null;
};

type TravelerMissionForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  adults: string;
  children: string;
  hasBaby: string;
  language: string;
  arrivalDate: string;
  departureDate: string;
  arrivalTime: string;
  departureTime: string;
  propertyId: string;
  conciergeProfileId: string;
  bookingPlatform: string;
  bookingCode: string;
  actions: string[];
  priority: "normal" | "high" | "urgent";
  specialWelcome: string;
  accessInstructions: string;
  parkingInstructions: string;
  sensitiveTraveler: string;
  notes: string;
  internalNotes: string;
  issueFlag: string;
};

type ParsedStay = {
  id: string;
  raw: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  adults: string;
  children: string;
  hasBaby: string;
  arrivalDate: string;
  departureDate: string;
  issueFlag: string;
  note: string;
};

type ParsedStayDraft = Partial<Omit<ParsedStay, "id" | "raw">>;

type AssignmentOption = {
  key: string;
  conciergeId: string;
  conciergeName: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  propertyPhoto: string;
  city: string;
  requestTitle: string;
  hasPartner: boolean;
};

type CreationMode = "platform" | "manual";

const initialForm: TravelerMissionForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  adults: "2",
  children: "0",
  hasBaby: "no",
  language: "fr",
  arrivalDate: "",
  departureDate: "",
  arrivalTime: "16:00",
  departureTime: "10:00",
  propertyId: "",
  conciergeProfileId: "",
  bookingPlatform: "Airbnb",
  bookingCode: "",
  actions: ["checkin"],
  priority: "normal",
  specialWelcome: "",
  accessInstructions: "",
  parkingInstructions: "",
  sensitiveTraveler: "",
  notes: "",
  internalNotes: "",
  issueFlag: "none",
};

const platformOptions = [
  {
    value: "Airbnb",
    label: "Airbnb",
    hint: "Copier-coller les messages de reservation ou le planning exporte.",
    placeholder: "Marie Dupont\n12 juin -> 16 juin\n2 adultes + 1 enfant\n+33 6 ...\nmarie@email.com",
  },
  {
    value: "Booking",
    label: "Booking",
    hint: "Coller les blocs client avec dates, voyageurs et contact.",
    placeholder: "Reservation BK-45821\nTimo Martin\n25 juillet -> 4 aout\n3 voyageurs\n07 ...",
  },
  {
    value: "Abritel",
    label: "Abritel",
    hint: "Importer les sejours recenses pour une conciergerie et un logement.",
    placeholder: "Famille Bernard\n3 aout -> 10 aout\n5 personnes\nArrivee tardive",
  },
  {
    value: "Direct",
    label: "Direct",
    hint: "Ajouter les reservations directes, hors plateforme.",
    placeholder: "Client direct\n18 septembre -> 22 septembre\n2 voyageurs\nAccueil autonome",
  },
  {
    value: "Autre",
    label: "Autre",
    hint: "Utiliser un format libre, puis completer les sejours detectes.",
    placeholder: "Nom voyageur\nDates\nNombre de voyageurs\nContact\nNotes",
  },
];

const actionOptions = [
  { value: "checkin", label: "Check-in" },
  { value: "checkout", label: "Check-out" },
  { value: "cleaning", label: "Ménage" },
  { value: "linen", label: "Linge" },
  { value: "groceries", label: "Courses" },
  { value: "quality_check", label: "Contrôle" },
  { value: "maintenance", label: "Maintenance" },
  { value: "emergency", label: "Urgence" },
  { value: "other", label: "Autre" },
  { value: "welcome", label: "Accueil spécifique" },
];

const statusOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "pending_planning", label: "En attente planning" },
  { value: "planned", label: "Planifiees" },
  { value: "urgent", label: "Urgences" },
  { value: "draft", label: "Nouveau séjour" },
  { value: "assigned", label: "Arrivée prévue" },
  { value: "accepted", label: "Acceptée" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Terminé" },
  { value: "canceled", label: "Annulé" },
];

const monthNumbers: Record<string, number> = {
  janvier: 1,
  fevrier: 2,
  février: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  août: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
  décembre: 12,
};

function buildDateTime(date: string, time: string) {
  if (!date) return null;
  const parsed = new Date(`${date}T${time || "00:00"}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function toIsoDate(day: string, month: string | undefined, year = new Date().getFullYear()) {
  if (!month) return "";
  const normalizedMonth = month.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const monthNumber = monthNumbers[normalizedMonth] ?? monthNumbers[month.toLowerCase()];
  if (!monthNumber) return "";
  return `${year}-${String(monthNumber).padStart(2, "0")}-${String(Number(day)).padStart(2, "0")}`;
}

function splitGuestName(value: string) {
  const cleaned = value
    .replace(/\s+[–-]\s+.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  const parts = cleaned.split(" ").filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
    note: value.includes("–") || value.includes("-") ? value.replace(cleaned, "").replace(/^[\s–-]+/, "").trim() : "",
  };
}

function parseDateRange(block: string) {
  const monthPattern =
    "janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre";
  const rangeRegex = new RegExp(
    `(\\d{1,2})\\s*(${monthPattern})?\\s*(?:→|->|jusqu.?au|au|-)\\s*(\\d{1,2})\\s*(${monthPattern})`,
    "i",
  );
  const rangeMatch = block.match(rangeRegex);
  if (rangeMatch) {
    const [, startDay, startMonthRaw, endDay, endMonthRaw] = rangeMatch;
    const startMonth = startMonthRaw || endMonthRaw;
    return {
      arrivalDate: toIsoDate(startDay, startMonth),
      departureDate: toIsoDate(endDay, endMonthRaw),
    };
  }

  const untilRegex = new RegExp(`jusqu.?au\\s*(\\d{1,2})\\s*(${monthPattern})`, "i");
  const untilMatch = block.match(untilRegex);
  if (untilMatch) {
    return {
      arrivalDate: "",
      departureDate: toIsoDate(untilMatch[1], untilMatch[2]),
    };
  }

  return { arrivalDate: "", departureDate: "" };
}

function parseGuestCounts(block: string) {
  const adultsMatch = block.match(/(\d+)\s*adult/i);
  const childrenMatch = block.match(/(\d+)\s*enfant/i);
  const babyMatch = block.match(/(\d+)?\s*b[ée]b[ée]/i);
  const totalMatch = block.match(/(\d+)\s*(?:personnes?|voyageurs?)/i);
  const children = childrenMatch ? Number(childrenMatch[1]) : 0;
  const baby = Boolean(babyMatch);
  const adults = adultsMatch
    ? Number(adultsMatch[1])
    : totalMatch
      ? Math.max(Number(totalMatch[1]) - children, 0)
      : 2;

  return {
    adults: String(adults),
    children: String(children),
    hasBaby: baby ? "yes" : "no",
  };
}

function isPlanningIntro(line: string) {
  return /^(saison|planning|airbnb|booking|séjours?)/i.test(line);
}

function hasStayDetails(line: string) {
  return (
    /^\d/.test(line) ||
    /(?:personnes?|voyageurs?|adultes?|enfants?|bébés?|jusqu.?au|arriv|départ)/i.test(line) ||
    /(?:\+?\d[\d\s().-]{7,}\d)/.test(line) ||
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(line)
  );
}

function isLikelyGuestHeading(line: string) {
  return line.length <= 80 && /[A-Za-zÀ-ÿ]/.test(line) && !hasStayDetails(line);
}

function splitPlanningIntoStayBlocks(value: string) {
  const lines = value
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !isPlanningIntro(line));

  const blocks: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (isLikelyGuestHeading(line)) {
      if (current.length) blocks.push(current.join("\n"));
      current = [line];
      continue;
    }

    if (!current.length) current = [`Voyageur ${blocks.length + 1}`];
    current.push(line);
  }

  if (current.length) blocks.push(current.join("\n"));
  return blocks;
}

function parsePlanningText(value: string): ParsedStay[] {
  return splitPlanningIntoStayBlocks(value)
    .map((block, index) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      const nameLine = lines[0] ?? `Voyageur ${index + 1}`;
      const { firstName, lastName, note } = splitGuestName(nameLine);
      const phone = block.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() ?? "";
      const email = block.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
      const dates = parseDateRange(block);
      const counts = parseGuestCounts(block);
      const issueFlag = /defaill|défaill|incident|urgent/i.test(block) ? "watch" : "none";

      return {
        id: `${index}-${nameLine}`,
        raw: block,
        firstName,
        lastName,
        phone,
        email,
        ...counts,
        ...dates,
        issueFlag,
        note,
      };
    });
}

function getMetadataString(mission: MissionRow, key: string) {
  const value = mission.metadata?.[key];
  return typeof value === "string" ? value : "";
}

function getPropertyLabel(housing: HousingRow[], propertyId: string | null) {
  const property = housing.find((item) => String(item.id) === String(propertyId ?? ""));
  return property?.nom_logement || property?.ville || "Logement à préciser";
}

function getMissionHousingId(mission: MissionRow) {
  const housingId = mission.metadata?.housing_id;
  return mission.property_id || (typeof housingId === "string" ? housingId : null);
}

function getGuestCount(mission: MissionRow) {
  const adults = Number(mission.metadata?.guest_adults ?? 0);
  const children = Number(mission.metadata?.guest_children ?? 0);
  const baby = mission.metadata?.guest_baby === true ? 1 : 0;
  const total = adults + children + baby;
  return total > 0 ? total : "-";
}

function getTravelerName(mission: MissionRow) {
  return (
    [getMetadataString(mission, "guest_first_name"), getMetadataString(mission, "guest_last_name")]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    mission.title ||
    "Voyageur"
  );
}

function getMissionConciergeName(partners: PartnerRequestRow[], mission: MissionRow) {
  const conciergeId = getMetadataString(mission, "concierge_profile_id");
  const partner = partners.find((item) => item.selected_concierge_profile_id === conciergeId);
  return partner?.selected_concierge_name || "Conciergerie concernée";
}

function getSelectedConciergeName(partners: PartnerRequestRow[], conciergeProfileId: string) {
  const partner = partners.find((item) => item.selected_concierge_profile_id === conciergeProfileId);
  return partner?.selected_concierge_name || "la conciergerie sélectionnée";
}

function getPartnerPropertyId(partner: PartnerRequestRow) {
  return partner.property_id ? String(partner.property_id) : "";
}

function getPartnerPropertyName(partner: PartnerRequestRow) {
  return partner.property_name || partner.city || "Appartement a preciser";
}

function buildAssignmentOptions(partners: PartnerRequestRow[], housing: HousingRow[] = []): AssignmentOption[] {
  const seen = new Set<string>();

  return partners
    .filter((partner) => isUuidLike(partner.selected_concierge_profile_id || ""))
    .map((partner) => {
      const conciergeId = partner.selected_concierge_profile_id || "";
      const propertyId = getPartnerPropertyId(partner);
      const property = housing.find((item) => String(item.id) === propertyId);
      const propertyName = property?.nom_logement || getPartnerPropertyName(partner);
      const key = `${conciergeId}:${propertyId || propertyName}:${partner.id}`;

      return {
        key,
        conciergeId,
        conciergeName: partner.selected_concierge_name || "Conciergerie",
        propertyId,
        propertyName,
        propertyAddress: property?.adresse || partner.city || "Adresse a confirmer",
        propertyPhoto: property?.photo_principale || "/images/default-logement.png",
        city: partner.city || "",
        requestTitle: partner.title || "Collaboration acceptee",
        hasPartner: true,
      };
    })
    .filter((option) => {
      const dedupeKey = `${option.conciergeId}:${option.propertyId || option.propertyName}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    });
}

function getAssignmentLabel(option: AssignmentOption) {
  return `${option.conciergeName} - ${option.propertyName}`;
}

function getMissionMetadataString(mission: MissionRow, keys: string[]) {
  for (const key of keys) {
    const value = mission.metadata?.[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function isMissionViewedByConcierge(mission: MissionRow) {
  return Boolean(
    getMissionMetadataString(mission, ["concierge_viewed_at", "viewed_at", "last_seen_by_concierge_at"]) ||
      ["accepted", "in_progress", "completed"].includes(mission.status || ""),
  );
}

function isMissionPlannedByConcierge(mission: MissionRow) {
  return Boolean(
    getMissionMetadataString(mission, ["planning_registered_at", "concierge_planned_at", "planned_at"]) ||
      mission.metadata?.added_to_concierge_planning === true ||
      mission.metadata?.concierge_planning_status === "planned" ||
      ["in_progress", "completed"].includes(mission.status || ""),
  );
}

function hasMissionIncident(mission: MissionRow) {
  const issueFlag = getMetadataString(mission, "issue_flag");
  return issueFlag === "incident" || mission.priority === "urgent" || issueFlag === "urgent";
}

function getMissionPlanningLabel(mission: MissionRow) {
  if (isMissionPlannedByConcierge(mission)) return "Mission planifiée par la concierge";
  if (isMissionViewedByConcierge(mission)) return "Consultée, en attente de planification";
  return "En attente de planification";
}

function getMissionStatusLabel(mission: MissionRow) {
  if (getMetadataString(mission, "issue_flag") === "incident") return "Incident";
  if (mission.priority === "urgent" || mission.metadata?.issue_flag === "urgent") return "Urgent";
  if (isMissionPlannedByConcierge(mission)) return "Planifiée";
  if (isMissionViewedByConcierge(mission)) return "Consultée";
  return statusOptions.find((item) => item.value === (mission.status || "assigned"))?.label || "Assignée";
}

function getMissionCardTone(mission: MissionRow): ServiceRequestCardTone {
  if (hasMissionIncident(mission)) return "expired";
  if (mission.status === "completed") return "accepted";
  if (mission.status === "canceled") return "expired";
  if (mission.status === "in_progress") return "discussion";
  if (isMissionPlannedByConcierge(mission)) return "accepted";
  if (isMissionViewedByConcierge(mission)) return "viewed";
  if (mission.status === "accepted") return "viewed";
  if (mission.status === "draft") return "draft";
  return "sent";
}

function getMissionCurrentDetail(mission: MissionRow) {
  const status = mission.status || "assigned";
  if (status === "completed") return "Mission terminée";
  if (status === "in_progress") return "Mission en cours sur le terrain";
  if (isMissionPlannedByConcierge(mission)) return "Mission enregistrée dans le planning concierge";
  if (isMissionViewedByConcierge(mission)) return "Mission consultée par la conciergerie";
  if (status === "accepted") return "Mission acceptée par la conciergerie";
  if (status === "draft") return "Mission à compléter";
  return "Mission proposée à la conciergerie";
}

function getMissionGuidance(mission: MissionRow) {
  const status = mission.status || "assigned";
  if (isMissionPlannedByConcierge(mission)) return "Vous avez la confirmation que la conciergerie a intégré ce séjour dans son organisation.";
  if (isMissionViewedByConcierge(mission)) return "La conciergerie a pris connaissance de la mission. La prochaine étape est l'enregistrement planning.";
  if (status === "completed") return "Le séjour est archivé avec ses informations voyageur.";
  if (status === "in_progress") return "Suivez l'exécution depuis le détail de mission ou le planning.";
  if (status === "accepted") return "La conciergerie peut préparer l'accueil, le ménage et les actions prévues.";
  return "La mission est visible dans l'espace de la conciergerie concernée et dans votre planning propriétaire.";
}

function getMissionMilestones(mission: MissionRow): ServiceRequestMilestone[] {
  const status = mission.status || "assigned";
  const viewed = isMissionViewedByConcierge(mission);
  const planned = isMissionPlannedByConcierge(mission);
  const running = ["in_progress", "completed"].includes(status);
  const completed = status === "completed";

  return [
    { label: "Transmise", detail: "Mission envoyée", state: "done", Icon: Send },
    { label: "Consultée", detail: "Vue concierge", state: viewed ? "done" : "active", Icon: Eye },
    { label: "Planifiée", detail: "Planning concierge", state: planned ? "done" : viewed ? "active" : "todo", Icon: CalendarCheck2 },
    { label: "En cours", detail: "Terrain", state: completed ? "done" : running ? "active" : "todo", Icon: Route },
    { label: "Terminée", detail: "Séjour clôturé", state: completed ? "done" : "todo", Icon: CheckCircle2 },
  ];
}

function getMissionFacts(mission: MissionRow, housing: HousingRow[]): ServiceRequestFact[] {
  const phone = getMetadataString(mission, "guest_phone");
  const email = getMetadataString(mission, "guest_email");
  const facts: ServiceRequestFact[] = [
    { label: "Logement", value: getPropertyLabel(housing, getMissionHousingId(mission)), Icon: Home },
    {
      label: "Arrivée",
      value: formatDateValue(mission.scheduled_start, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      Icon: CalendarClock,
    },
    { label: "Voyageurs", value: `${getGuestCount(mission)} voyageur(s)`, Icon: Users },
    { label: "Planning concierge", value: getMissionPlanningLabel(mission), Icon: CalendarCheck2 },
    { label: "Contact", value: phone || email || "-", Icon: phone ? Phone : Mail },
  ];

  if (mission.description) {
    facts.push({ label: "Consignes", value: "Notes transmises", Icon: MessageSquareText });
  }

  return facts.slice(0, 4);
}

function getMissionHeaderImage(mission: MissionRow) {
  const actions = Array.isArray(mission.metadata?.requested_actions)
    ? (mission.metadata?.requested_actions as string[]).join(" ")
    : "";
  const content = `${actions} ${mission.title ?? ""} ${mission.description ?? ""}`.toLowerCase();

  if (content.includes("linen") || content.includes("linge")) return "/images/carousel/planetls-card-header-linge.png";
  if (content.includes("maintenance")) return "/images/carousel/planetls-card-header-maintenance.png";
  if (content.includes("welcome") || content.includes("checkin") || content.includes("check-in")) {
    return "/images/carousel/planetls-card-header-accueil.png";
  }
  return "/images/carousel/planetls-private-voyageurs.png";
}

function buildTitle(form: TravelerMissionForm) {
  const name = [form.firstName, form.lastName].filter(Boolean).join(" ").trim() || "voyageurs";
  return `Séjour ${name}`;
}

function buildResetForm(current: TravelerMissionForm): TravelerMissionForm {
  return {
    ...initialForm,
    propertyId: current.propertyId,
    conciergeProfileId: current.conciergeProfileId,
    bookingPlatform: current.bookingPlatform,
  };
}

function buildMissionPayload(form: TravelerMissionForm) {
  return {
    concierge_profile_id: form.conciergeProfileId,
    property_id: isUuidLike(form.propertyId) ? form.propertyId : null,
    title: buildTitle(form),
    description: form.notes.trim() || null,
    status: "assigned",
    priority: form.issueFlag === "urgent" ? "urgent" : form.priority,
    scheduled_start: buildDateTime(form.arrivalDate, form.arrivalTime),
    scheduled_end: buildDateTime(form.departureDate, form.departureTime),
    metadata: {
      mission_kind: "traveler_stay",
      housing_id: form.propertyId || null,
      concierge_profile_id: form.conciergeProfileId,
      guest_first_name: form.firstName.trim(),
      guest_last_name: form.lastName.trim(),
      guest_phone: form.phone.trim(),
      guest_email: form.email.trim(),
      guest_adults: Number(form.adults || 0),
      guest_children: Number(form.children || 0),
      guest_baby: form.hasBaby === "yes",
      guest_language: form.language,
      arrival_date: form.arrivalDate,
      departure_date: form.departureDate,
      arrival_time: form.arrivalTime,
      departure_time: form.departureTime,
      booking_platform: form.bookingPlatform,
      booking_code: form.bookingCode.trim(),
      requested_actions: form.actions,
      special_welcome: form.specialWelcome.trim(),
      access_instructions: form.accessInstructions.trim(),
      parking_instructions: form.parkingInstructions.trim(),
      sensitive_traveler: form.sensitiveTraveler.trim(),
      internal_notes: form.internalNotes.trim(),
      issue_flag: form.issueFlag,
      notice_mode: "simple_stay_notification",
      concierge_planning_status: "pending",
      notification_reason: "new_traveler_mission",
      assignment_flow: "owner_proposed_to_concierge",
      visible_in_owner_space: true,
      visible_in_owner_planning: true,
      visible_in_concierge_workspace: true,
      created_from: "owner_traveler_mission",
    },
  };
}

function parsedStayToForm(stay: ParsedStay, current: TravelerMissionForm): TravelerMissionForm {
  return {
    ...initialForm,
    propertyId: current.propertyId,
    conciergeProfileId: current.conciergeProfileId,
    bookingPlatform: current.bookingPlatform,
    firstName: stay.firstName,
    lastName: stay.lastName,
    phone: stay.phone,
    email: stay.email,
    adults: stay.adults,
    children: stay.children,
    hasBaby: stay.hasBaby,
    arrivalDate: stay.arrivalDate,
    departureDate: stay.departureDate,
    issueFlag: stay.issueFlag,
    notes: stay.raw,
    internalNotes: stay.note,
  };
}

function TravelerMissionCard({
  mission,
  housing,
  partners,
  onDuplicate,
}: {
  mission: MissionRow;
  housing: HousingRow[];
  partners: PartnerRequestRow[];
  onDuplicate: (mission: MissionRow) => void;
}) {
  const actionValues = Array.isArray(mission.metadata?.requested_actions)
    ? (mission.metadata?.requested_actions as string[])
    : [];
  const conciergeName = getMissionConciergeName(partners, mission);
  const platform = getMetadataString(mission, "booking_platform") || "Séjour";
  const isUrgent = mission.priority === "urgent" || mission.metadata?.issue_flag === "urgent";

  return (
    <ServiceRequestCard
      title={getTravelerName(mission)}
      eyebrow={platform}
      actorName={conciergeName}
      actorDetail={`Proposée à ${conciergeName}`}
      statusLabel={getMissionStatusLabel(mission)}
      statusTone={getMissionCardTone(mission)}
      typeLabel="Mission voyageur"
      urgent={isUrgent}
      summary={mission.description || "Informations voyageur transmises à la conciergerie."}
      currentStepDetail={getMissionCurrentDetail(mission)}
      guidance={getMissionGuidance(mission)}
      headerImage={getMissionHeaderImage(mission)}
      facts={getMissionFacts(mission, housing)}
      milestones={getMissionMilestones(mission)}
      chips={
        <>
          <span className={styles.serviceChip}>{platform}</span>
          <span className={isMissionPlannedByConcierge(mission) ? styles.plannedChip : styles.pendingChip}>
            {isMissionPlannedByConcierge(mission) ? "Planning concierge confirmé" : "En attente planning"}
          </span>
          {actionValues.slice(0, 3).map((action) => (
            <span key={`${mission.id}-${action}`} className={styles.serviceChip}>
              {actionOptions.find((item) => item.value === action)?.label || action}
            </span>
          ))}
          {actionValues.length > 3 ? <span className={styles.serviceChip}>+{actionValues.length - 3}</span> : null}
        </>
      }
      actions={
        <>
          <button type="button" className={styles.buttonSecondary} onClick={() => onDuplicate(mission)}>
            <Copy size={15} aria-hidden="true" />
            Dupliquer
          </button>
          <ButtonLink href={`/dashboard/owner/missions/${mission.id}`} variant="secondary" size="sm">
            Ouvrir
          </ButtonLink>
          <ButtonLink href={`/dashboard/owner/messages?mission=${encodeURIComponent(mission.id)}`} variant="ghost" size="sm">
            <MessageCircle size={15} aria-hidden="true" />
            Messages
          </ButtonLink>
        </>
      }
    />
  );
}

export default function OwnerTravelerMissionsPage() {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [housing, setHousing] = useState<HousingRow[]>([]);
  const [partners, setPartners] = useState<PartnerRequestRow[]>([]);
  const [form, setForm] = useState<TravelerMissionForm>(initialForm);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bulkCreating, setBulkCreating] = useState(false);
  const [parsedStayCreatingId, setParsedStayCreatingId] = useState<string | null>(null);
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [creationMode, setCreationMode] = useState<CreationMode>("platform");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [planningText, setPlanningText] = useState("");
  const [parsedStayDrafts, setParsedStayDrafts] = useState<Record<string, ParsedStayDraft>>({});
  const [sentParsedStayIds, setSentParsedStayIds] = useState<Record<string, boolean>>({});

  const assignmentOptions = useMemo(() => buildAssignmentOptions(partners, housing), [partners, housing]);
  const selectedAssignment = useMemo(
    () =>
      assignmentOptions.find(
        (option) =>
          option.conciergeId === form.conciergeProfileId &&
          (!option.propertyId || !form.propertyId || option.propertyId === form.propertyId),
      ) ?? assignmentOptions.find((option) => option.conciergeId === form.conciergeProfileId) ?? null,
    [assignmentOptions, form.conciergeProfileId, form.propertyId],
  );
  const selectedPlatform = platformOptions.find((platform) => platform.value === form.bookingPlatform) ?? platformOptions[0];
  const parsedStays = useMemo(() => parsePlanningText(planningText), [planningText]);
  const editableParsedStays = useMemo(
    () => parsedStays.map((stay) => ({ ...stay, ...(parsedStayDrafts[stay.id] ?? {}) })),
    [parsedStays, parsedStayDrafts],
  );
  const validParsedStays = useMemo(
    () => editableParsedStays.filter((stay) => stay.firstName.trim() && stay.arrivalDate && stay.departureDate),
    [editableParsedStays],
  );
  const pendingParsedStays = useMemo(
    () => editableParsedStays.filter((stay) => !sentParsedStayIds[stay.id]),
    [editableParsedStays, sentParsedStayIds],
  );
  const validPendingParsedStays = useMemo(
    () => pendingParsedStays.filter((stay) => stay.firstName.trim() && stay.arrivalDate && stay.departureDate),
    [pendingParsedStays],
  );
  const allParsedStaysReady = pendingParsedStays.length > 0 && pendingParsedStays.length === validPendingParsedStays.length;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [missionsResponse, housingResponse, requestsResponse] = await Promise.all([
        fetch("/api/missions?scope=owner&limit=100", { cache: "no-store" }),
        fetch("/api/housing", { cache: "no-store" }),
        fetch("/api/service-requests?limit=100", { cache: "no-store" }),
      ]);

      const missionsPayload = await missionsResponse.json();
      const housingPayload = await housingResponse.json();
      const requestsPayload = await requestsResponse.json();

      if (!missionsResponse.ok) throw new Error(missionsPayload?.error || "Impossible de charger les missions.");
      if (!housingResponse.ok) throw new Error(housingPayload?.error || "Impossible de charger les logements.");
      if (!requestsResponse.ok) throw new Error(requestsPayload?.error || "Impossible de charger les partenaires.");

      const nextHousing = Array.isArray(housingPayload) ? housingPayload : [];
      const acceptedPartners = (Array.isArray(requestsPayload?.items) ? requestsPayload.items : []).filter(
        isAcceptedMissionPartner,
      );
      const nextAssignments = buildAssignmentOptions(acceptedPartners, nextHousing);
      const firstAssignment = nextAssignments[0];

      setMissions(
        (Array.isArray(missionsPayload) ? missionsPayload : []).filter(
          (mission: MissionRow) => mission.metadata?.mission_kind === "traveler_stay",
        ),
      );
      setHousing(nextHousing);
      setPartners(acceptedPartners);
      setForm((current) => ({
        ...current,
        propertyId: current.propertyId || firstAssignment?.propertyId || String(nextHousing[0]?.id ?? ""),
        conciergeProfileId:
          current.conciergeProfileId || firstAssignment?.conciergeId || "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger l'espace séjours.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setParsedStayDrafts((current) => {
      const allowedIds = new Set(parsedStays.map((stay) => stay.id));
      const nextEntries = Object.entries(current).filter(([id]) => allowedIds.has(id));
      return nextEntries.length === Object.keys(current).length ? current : Object.fromEntries(nextEntries);
    });
    setSentParsedStayIds((current) => {
      const allowedIds = new Set(parsedStays.map((stay) => stay.id));
      const nextEntries = Object.entries(current).filter(([id]) => allowedIds.has(id));
      return nextEntries.length === Object.keys(current).length ? current : Object.fromEntries(nextEntries);
    });
  }, [parsedStays]);

  const filteredMissions = useMemo(
    () =>
      missions.filter((mission) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "pending_planning") return !isMissionPlannedByConcierge(mission) && mission.status !== "completed";
        if (statusFilter === "planned") return isMissionPlannedByConcierge(mission);
        if (statusFilter === "urgent") return hasMissionIncident(mission);
        return (mission.status ?? "draft") === statusFilter;
      }),
    [missions, statusFilter],
  );

  const upcomingCount = useMemo(
    () => missions.filter((mission) => mission.status !== "completed" && mission.status !== "canceled").length,
    [missions],
  );

  const urgentCount = useMemo(
    () => missions.filter((mission) => mission.priority === "urgent" || mission.metadata?.issue_flag === "urgent").length,
    [missions],
  );

  const plannedCount = useMemo(
    () => missions.filter(isMissionPlannedByConcierge).length,
    [missions],
  );

  const pendingPlanningCount = useMemo(
    () => missions.filter((mission) => !isMissionPlannedByConcierge(mission) && mission.status !== "completed").length,
    [missions],
  );

  const completedCount = useMemo(
    () => missions.filter((mission) => mission.status === "completed").length,
    [missions],
  );

  const stats = [
    { label: "Séjours", value: loading ? "..." : String(missions.length), icon: <Users size={18} /> },
    { label: "À venir", value: loading ? "..." : String(upcomingCount), icon: <CalendarClock size={18} /> },
    { label: "Planifiées", value: loading ? "..." : String(plannedCount), icon: <CalendarCheck2 size={18} /> },
    { label: "À planifier", value: loading ? "..." : String(pendingPlanningCount), icon: <AlertTriangle size={18} /> },
    { label: "Urgences", value: loading ? "..." : String(urgentCount), icon: <Bell size={18} /> },
    { label: "Terminées", value: loading ? "..." : String(completedCount), icon: <CheckCircle2 size={18} /> },
    { label: "Partenaires", value: loading ? "..." : String(partners.length), icon: <ShieldCheck size={18} /> },
  ];

  function updateForm<K extends keyof TravelerMissionForm>(key: K, value: TravelerMissionForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleAction(action: string) {
    setForm((current) => ({
      ...current,
      actions: current.actions.includes(action)
        ? current.actions.filter((item) => item !== action)
        : [...current.actions, action],
    }));
  }

  function openComposer(mode: CreationMode = "platform") {
    setCreationMode(mode);
    setComposerOpen(true);
    window.requestAnimationFrame(() => {
      document.getElementById("atelier-mission-voyageur")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function selectAssignment(option: AssignmentOption) {
    setForm((current) => ({
      ...current,
      conciergeProfileId: option.conciergeId,
      propertyId: option.propertyId || current.propertyId,
    }));
  }

  function selectPlatform(platform: string) {
    setForm((current) => ({ ...current, bookingPlatform: platform }));
  }

  function updateParsedStay(id: string, key: keyof ParsedStayDraft, value: string) {
    setParsedStayDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [key]: value,
      },
    }));
  }

  function duplicateMission(mission: MissionRow) {
    setForm({
      ...initialForm,
      firstName: getMetadataString(mission, "guest_first_name"),
      lastName: getMetadataString(mission, "guest_last_name"),
      phone: getMetadataString(mission, "guest_phone"),
      email: getMetadataString(mission, "guest_email"),
      adults: String(mission.metadata?.guest_adults ?? "2"),
      children: String(mission.metadata?.guest_children ?? "0"),
      hasBaby: mission.metadata?.guest_baby === true ? "yes" : "no",
      language: getMetadataString(mission, "guest_language") || "fr",
      propertyId: String(getMissionHousingId(mission) ?? ""),
      conciergeProfileId: getMetadataString(mission, "concierge_profile_id"),
      bookingPlatform: getMetadataString(mission, "booking_platform") || "Airbnb",
      actions: Array.isArray(mission.metadata?.requested_actions)
        ? (mission.metadata?.requested_actions as string[])
        : initialForm.actions,
      priority: (mission.priority as TravelerMissionForm["priority"]) || "normal",
      specialWelcome: getMetadataString(mission, "special_welcome"),
      accessInstructions: getMetadataString(mission, "access_instructions"),
      parkingInstructions: getMetadataString(mission, "parking_instructions"),
      sensitiveTraveler: getMetadataString(mission, "sensitive_traveler"),
      notes: mission.description || "",
      internalNotes: getMetadataString(mission, "internal_notes"),
      issueFlag: getMetadataString(mission, "issue_flag") || "none",
    });
    setCreationMode("manual");
    setComposerOpen(true);
  }

  function fillFormFromStay(stay: ParsedStay) {
    setForm((current) => parsedStayToForm(stay, current));
    setCreationMode("manual");
    setComposerOpen(true);
    setError(null);
    setSuccess("Séjour chargé dans le formulaire. Relisez puis créez la mission.");
    window.requestAnimationFrame(() => {
      document.getElementById("mission-voyageur-formulaire")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function createMissionFromForm(input: TravelerMissionForm) {
    const response = await fetch("/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildMissionPayload(input)),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error || "Impossible de créer la mission voyageur.");
    return payload;
  }

  async function createParsedMission(stay: ParsedStay) {
    setError(null);
    setSuccess(null);

    if (!stay.firstName.trim() || !stay.arrivalDate || !stay.departureDate) {
      setError("Complétez le nom, la date d'arrivée et la date de départ avant d'envoyer ce séjour.");
      return;
    }
    if (partners.length === 0) {
      setError("Aucune conciergerie partenaire acceptée n'est disponible.");
      return;
    }
    if (!form.propertyId) {
      setError("Sélectionnez le logement concerné pour envoyer ce séjour à la bonne concierge.");
      return;
    }
    if (!isUuidLike(form.conciergeProfileId)) {
      setError("Sélectionnez le logement et la conciergerie concernée avant d'envoyer ce séjour.");
      return;
    }

    try {
      setParsedStayCreatingId(stay.id);
      await createMissionFromForm(parsedStayToForm(stay, form));
      setSentParsedStayIds((current) => ({ ...current, [stay.id]: true }));
      const stayName = [stay.firstName, stay.lastName].filter(Boolean).join(" ").trim() || "ce séjour";
      setSuccess(
        `La mission de ${stayName} est enregistrée et envoyée à ${getSelectedConciergeName(partners, form.conciergeProfileId)}.`,
      );
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer ce séjour à la conciergerie.");
    } finally {
      setParsedStayCreatingId(null);
    }
  }

  async function createParsedMissions() {
    setError(null);
    setSuccess(null);

    if (pendingParsedStays.length === 0) {
      setError("Collez d'abord les informations de planning reçues depuis la plateforme.");
      return;
    }
    if (!allParsedStaysReady) {
      setError("Complétez chaque séjour non envoyé avant de transférer les missions restantes à la conciergerie.");
      return;
    }
    if (partners.length === 0) {
      setError("Aucune conciergerie partenaire acceptée n'est disponible.");
      return;
    }
    if (!form.propertyId) {
      setError("Sélectionnez le logement concerné pour envoyer les séjours à la bonne concierge.");
      return;
    }
    if (!isUuidLike(form.conciergeProfileId)) {
      setError("Sélectionnez la conciergerie concernée avant de créer les missions.");
      return;
    }

    try {
      setBulkCreating(true);
      for (const stay of pendingParsedStays) {
        await createMissionFromForm(parsedStayToForm(stay, form));
      }
      setSuccess(
        `${pendingParsedStays.length} mission(s) voyageur validée(s) et transférée(s) à ${getSelectedConciergeName(partners, form.conciergeProfileId)}. Elles apparaissent côté concierge et dans votre planning.`,
      );
      setPlanningText("");
      setParsedStayDrafts({});
      setSentParsedStayIds({});
      setComposerOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer les missions depuis le planning.");
    } finally {
      setBulkCreating(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.firstName.trim() && !form.lastName.trim()) {
      setError("Renseignez au moins le nom ou prénom du voyageur.");
      return;
    }
    if (!form.arrivalDate || !form.departureDate) {
      setError("Renseignez les dates d'arrivée et de départ.");
      return;
    }
    if (partners.length === 0) {
      setError("Aucune conciergerie partenaire acceptée n'est disponible. Acceptez d'abord un devis ou une demande partenaire.");
      return;
    }
    if (!isUuidLike(form.conciergeProfileId)) {
      setError("Sélectionnez une conciergerie partenaire acceptée.");
      return;
    }

    try {
      setSubmitting(true);
      await createMissionFromForm(form);

      setSuccess(
        `La concierge ${getSelectedConciergeName(partners, form.conciergeProfileId)} a été prévenue du séjour. La fiche est disponible côté concierge et dans votre planning.`,
      );
      setForm((current) => buildResetForm(current));
      setComposerOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer la mission voyageur.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Missions voyageurs</p>
          <h1>Séjours voyageurs</h1>
          <p>
            Transmettez à votre conciergerie les arrivées, départs, voyageurs, consignes et actions terrain dans
            un espace clair, séparé des demandes commerciales.
          </p>
          <div className={styles.heroActions}>
            <button type="button" className={styles.primaryLink} onClick={() => openComposer("manual")}>
              <Bell size={16} aria-hidden="true" /> Prévenir la concierge
            </button>
            <ButtonLink href="/dashboard/owner/planning" variant="secondary">
              <CalendarClock size={16} aria-hidden="true" /> Planning
            </ButtonLink>
            <ButtonLink href="/dashboard/owner/conciergerie/partenaires" variant="secondary">
              <ShieldCheck size={16} aria-hidden="true" /> Partenaires acceptés
            </ButtonLink>
          </div>
        </div>
        <div className={styles.heroSnapshot}>
          <span><Send size={16} /> Séjours transmis</span>
          <strong>{loading ? "..." : upcomingCount}</strong>
          <p>missions à venir</p>
          <div className={styles.heroProgress}>
            <span style={{ width: `${Math.min(100, Math.max(12, missions.length * 18))}%` }} />
          </div>
        </div>
      </header>

      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}
      {success ? <p className={`${styles.message} ${styles.messageSuccess}`}>{success}</p> : null}

      <section className={styles.statsGrid} aria-label="Statistiques missions voyageurs">
        {stats.map((stat) => (
          <article key={stat.label} className={styles.statCard}>
            <span className={styles.statIcon}>{stat.icon}</span>
            <div>
              <strong>{stat.value}</strong>
              <p>{stat.label}</p>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.syncPanel} aria-label="Synchronisation planning concierge">
        <div className={styles.syncMain}>
          <span className={plannedCount > 0 ? styles.syncBadgeReady : styles.syncBadgeWaiting}>
            {plannedCount > 0 ? <CalendarCheck2 size={16} aria-hidden="true" /> : <AlertTriangle size={16} aria-hidden="true" />}
            {plannedCount > 0 ? "Mission enregistrée dans le planning concierge" : "En attente de planification concierge"}
          </span>
          <h2>Suivi opérationnel propriétaire ↔ conciergerie</h2>
          <p className={styles.meta}>
            Chaque séjour transmis reste rattaché à un logement, une conciergerie et une timeline métier. Quand la conciergerie l’enregistre dans son planning, le retour devient visible ici.
          </p>
        </div>
        <div className={styles.syncSteps} aria-label="Timeline de suivi">
          {["Créée", "Envoyée", "Consultée", "Planifiée", "En cours", "Terminée"].map((step, index) => (
            <span key={step} className={index <= 2 || plannedCount > 0 ? styles.syncStepDone : styles.syncStepTodo}>
              {step}
            </span>
          ))}
        </div>
      </section>

      <section id="nouvelle-mission-voyageur" className={styles.creationLauncher}>
        <div>
          <p className={styles.eyebrow}>Information séjour</p>
          <h2>Prévenir rapidement la conciergerie concernée</h2>
          <p className={styles.meta}>
            Envoyez une fiche séjour courte et professionnelle. La concierge reçoit l’essentiel, confirme la prise en charge, puis l’ajoute à son planning.
          </p>
        </div>
        <Button type="button" onClick={() => openComposer("manual")}>
          <Bell size={16} aria-hidden="true" />
          Prévenir la concierge
        </Button>
      </section>

      {isComposerOpen ? (
        <section id="atelier-mission-voyageur" className={styles.creationPanel}>
          <div className={styles.travelerMissionPage}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>Fiche séjour</p>
                <h2 id="mission-modal-title">Prévenir la concierge</h2>
              </div>
              <button type="button" className={styles.iconButton} onClick={() => setComposerOpen(false)} aria-label="Fermer">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
        <div className={styles.assignmentWorkbench}>
          <section className={styles.assignmentPanel}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>1. Sélection logement</p>
                <h2>Choisir le logement à confier</h2>
                <p className={styles.meta}>
                  La mission sera envoyee a la conciergerie selectionnee et rattachee au logement gere.
                </p>
              </div>
            </div>
            {assignmentOptions.length === 0 ? (
              <p className={styles.meta}>Aucune conciergerie acceptee avec logement rattache pour le moment.</p>
            ) : (
              <div className={styles.assignmentGrid}>
                {assignmentOptions.map((option) => {
                  const selected =
                    option.conciergeId === form.conciergeProfileId &&
                    (!option.propertyId || option.propertyId === form.propertyId);
                  return (
                    <button
                      key={option.key}
                      type="button"
                      className={selected ? styles.assignmentCardActive : styles.assignmentCard}
                      onClick={() => selectAssignment(option)}
                    >
                      <div className={styles.assignmentPhoto} style={{ backgroundImage: `url("${option.propertyPhoto}")` }} />
                      <span>
                        <ShieldCheck size={15} aria-hidden="true" />
                        {option.conciergeName}
                      </span>
                      <strong>{option.propertyName}</strong>
                      <small>
                        <MapPin size={13} aria-hidden="true" />
                        {option.propertyAddress || option.city || option.requestTitle}
                      </small>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className={styles.assignmentPanel}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>2. Plateforme</p>
                <h2>Indiquer la source des sejours</h2>
                <p className={styles.meta}>{selectedPlatform.hint}</p>
              </div>
            </div>
            <div className={styles.platformGrid}>
              {platformOptions.map((platform) => (
                <button
                  key={platform.value}
                  type="button"
                  className={form.bookingPlatform === platform.value ? styles.platformCardActive : styles.platformCard}
                  onClick={() => selectPlatform(platform.value)}
                >
                  <FileText size={16} aria-hidden="true" />
                  <strong>{platform.label}</strong>
                  <span>{platform.hint}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.creationModeTabs} role="tablist" aria-label="Mode de creation">
          <button
            type="button"
            className={creationMode === "manual" ? styles.modeTabActive : styles.modeTab}
            onClick={() => setCreationMode("manual")}
          >
            <Bell size={16} aria-hidden="true" />
            Prévenir simplement
          </button>
          <button
            type="button"
            className={creationMode === "platform" ? styles.modeTabActive : styles.modeTab}
            onClick={() => setCreationMode("platform")}
          >
            <ClipboardList size={16} aria-hidden="true" />
            Importer un planning
          </button>
        </div>

        <section className={styles.travelerMissionHero}>
          <div>
            <p className={styles.eyebrow}>Notification séjour</p>
            <h1>Prévenir la concierge sans friction</h1>
            <p className={styles.meta}>
              Une fiche courte remplace les SMS et messages éparpillés. La concierge reçoit les dates, le logement, les voyageurs et confirme ensuite la prise en charge.
            </p>
          </div>
          <div className={styles.travelerHeroSteps}>
            <span>1. Logement</span>
            <span>2. Séjour</span>
            <span>3. Envoyer</span>
          </div>
        </section>

        <section className={creationMode === "platform" ? styles.planningImportPanel : styles.hiddenPanel}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Planning Airbnb / Booking</p>
              <h2>Coller les informations reçues</h2>
              <p className={styles.meta}>
                Collez un message comme celui envoyé à votre concierge. Les séjours complets peuvent être créés en une fois.
              </p>
            </div>
            <Button type="button" disabled={bulkCreating || !allParsedStaysReady} onClick={createParsedMissions}>
              <Send size={16} aria-hidden="true" />
              {bulkCreating
                ? "Transfert..."
                : allParsedStaysReady
                  ? `Tout envoyer (${pendingParsedStays.length})`
                  : editableParsedStays.length === 0
                    ? "Coller un planning"
                    : pendingParsedStays.length === 0
                      ? "Toutes envoyées"
                      : `Compléter ${pendingParsedStays.length - validPendingParsedStays.length} séjour(s)`}
            </Button>
          </div>
          {editableParsedStays.length > 0 ? (
            <p className={styles.importReadiness}>
              {validParsedStays.length}/{editableParsedStays.length} séjour(s) prêt(s), {editableParsedStays.length - pendingParsedStays.length} déjà envoyé(s). Vous pouvez valider chaque mission séparément pour l’enregistrer puis l’envoyer à la concierge du logement.
            </p>
          ) : null}
          <div className={styles.planningImportGrid}>
            <label className={styles.label}>
              Message reçu
              <Textarea
                rows={9}
                value={planningText}
                onChange={(event) => {
                  setPlanningText(event.target.value);
                  setParsedStayDrafts({});
                  setSentParsedStayIds({});
                }}
                placeholder={selectedPlatform.placeholder}
              />
            </label>
            <div className={styles.parsedStayList}>
              {editableParsedStays.length === 0 ? (
                <p className={styles.meta}>Les séjours détectés apparaîtront ici.</p>
              ) : null}
              {editableParsedStays.map((stay, index) => {
                const isComplete = Boolean(stay.firstName.trim() && stay.arrivalDate && stay.departureDate);
                const isSent = Boolean(sentParsedStayIds[stay.id]);
                const isCreating = parsedStayCreatingId === stay.id;
                const totalGuests =
                  Number(stay.adults || 0) + Number(stay.children || 0) + (stay.hasBaby === "yes" ? 1 : 0);
                return (
                  <article key={stay.id} className={isComplete || isSent ? styles.parsedStayCard : styles.parsedStayCardMuted}>
                    <div className={styles.parsedStayHeader}>
                      <div>
                        <strong>Séjour {index + 1}</strong>
                        <span>
                          {isSent
                            ? "Mission enregistrée et envoyée"
                            : isComplete
                              ? "Prêt à envoyer séparément"
                              : "À compléter avant validation"}
                        </span>
                      </div>
                      <span className={isSent || isComplete ? styles.plannedChip : styles.pendingChip}>
                        {isSent ? "Envoyée" : isComplete ? "Complet" : "Incomplet"}
                      </span>
                    </div>
                    <div className={styles.parsedStayEditor}>
                      <label className={styles.label}>
                        Prénom
                        <Input
                          value={stay.firstName}
                          onChange={(event) => updateParsedStay(stay.id, "firstName", event.target.value)}
                        />
                      </label>
                      <label className={styles.label}>
                        Nom
                        <Input
                          value={stay.lastName}
                          onChange={(event) => updateParsedStay(stay.id, "lastName", event.target.value)}
                        />
                      </label>
                      <label className={styles.label}>
                        Arrivée
                        <Input
                          type="date"
                          value={stay.arrivalDate}
                          onChange={(event) => updateParsedStay(stay.id, "arrivalDate", event.target.value)}
                        />
                      </label>
                      <label className={styles.label}>
                        Départ
                        <Input
                          type="date"
                          value={stay.departureDate}
                          onChange={(event) => updateParsedStay(stay.id, "departureDate", event.target.value)}
                        />
                      </label>
                      <label className={styles.label}>
                        Adultes
                        <Input
                          type="number"
                          min="0"
                          value={stay.adults}
                          onChange={(event) => updateParsedStay(stay.id, "adults", event.target.value)}
                        />
                      </label>
                      <label className={styles.label}>
                        Enfants
                        <Input
                          type="number"
                          min="0"
                          value={stay.children}
                          onChange={(event) => updateParsedStay(stay.id, "children", event.target.value)}
                        />
                      </label>
                      <label className={styles.label}>
                        Téléphone
                        <Input
                          value={stay.phone}
                          onChange={(event) => updateParsedStay(stay.id, "phone", event.target.value)}
                        />
                      </label>
                      <label className={styles.label}>
                        Email
                        <Input
                          type="email"
                          value={stay.email}
                          onChange={(event) => updateParsedStay(stay.id, "email", event.target.value)}
                        />
                      </label>
                    </div>
                    <div className={styles.parsedStayFooter}>
                      <span>{totalGuests || 1} voyageur(s)</span>
                      {stay.note ? <span>{stay.note}</span> : null}
                      <div className={styles.parsedStayActions}>
                        <button type="button" className={styles.buttonSecondary} onClick={() => fillFormFromStay(stay)}>
                          Ouvrir en détail
                        </button>
                        <button
                          type="button"
                          className={styles.buttonSecondary}
                          disabled={!isComplete || isSent || bulkCreating || isCreating}
                          onClick={() => createParsedMission(stay)}
                        >
                          {isCreating ? "Envoi..." : isSent ? "Déjà envoyée" : "Valider et envoyer"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <div className={creationMode === "manual" ? styles.travelerMissionLayout : styles.hiddenPanel}>
          <form id="mission-voyageur-formulaire" className={styles.travelerMissionForm} onSubmit={handleSubmit}>
            <section className={styles.quickNoticePanel}>
              <div>
                <p className={styles.eyebrow}>Fiche express</p>
                <h2>Informer la concierge d’un séjour</h2>
                <p className={styles.meta}>
                  Remplissez uniquement l’essentiel. La conciergerie reçoit une notification claire et pourra confirmer la prise en charge.
                </p>
              </div>
              <div className={styles.quickNoticeSteps} aria-label="Suivi simplifié">
                <span>Envoyé</span>
                <span>Vu</span>
                <span>Pris en charge</span>
                <span>Planifié</span>
              </div>
            </section>

            <section className={styles.travelerFormSection}>
              <p className={styles.eyebrow}>Voyageur principal</p>
              <div className={styles.travelerFieldGrid}>
                <label className={styles.label}>
                  Prénom
                  <Input value={form.firstName} onChange={(event) => updateForm("firstName", event.target.value)} />
                </label>
                <label className={styles.label}>
                  Nom
                  <Input value={form.lastName} onChange={(event) => updateForm("lastName", event.target.value)} />
                </label>
                <label className={styles.label}>
                  Nombre d’adultes
                  <Input type="number" min="0" value={form.adults} onChange={(event) => updateForm("adults", event.target.value)} />
                </label>
                <label className={styles.label}>
                  Enfants
                  <Input type="number" min="0" value={form.children} onChange={(event) => updateForm("children", event.target.value)} />
                </label>
                <label className={styles.label}>
                  Téléphone
                  <Input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} placeholder="Optionnel mais utile" />
                </label>
                <label className={styles.label}>
                  Plateforme
                  <Select value={form.bookingPlatform} onChange={(event) => updateForm("bookingPlatform", event.target.value)}>
                    <option>Airbnb</option>
                    <option>Booking</option>
                    <option>Abritel</option>
                    <option>Direct</option>
                    <option>Autre</option>
                  </Select>
                </label>
              </div>
            </section>

            <section className={styles.travelerFormSection}>
              <p className={styles.eyebrow}>Arrivée et départ</p>
              <div className={styles.travelerFieldGrid}>
                <label className={styles.label}>
                  Date arrivée
                  <Input type="date" value={form.arrivalDate} onChange={(event) => updateForm("arrivalDate", event.target.value)} />
                </label>
                <label className={styles.label}>
                  Heure arrivée
                  <Input type="time" value={form.arrivalTime} onChange={(event) => updateForm("arrivalTime", event.target.value)} />
                </label>
                <label className={styles.label}>
                  Date départ
                  <Input type="date" value={form.departureDate} onChange={(event) => updateForm("departureDate", event.target.value)} />
                </label>
                <label className={styles.label}>
                  Heure départ
                  <Input type="time" value={form.departureTime} onChange={(event) => updateForm("departureTime", event.target.value)} />
                </label>
              </div>
              <label className={styles.label}>
                Message pour la concierge
                <Textarea
                  rows={4}
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                  placeholder="Ex : arrivée autonome, attention au lit bébé, voyageurs déjà informés des codes..."
                />
              </label>
            </section>

            <details className={styles.advancedNoticeDetails}>
              <summary>
                <span>
                  <ClipboardList size={16} aria-hidden="true" />
                  Ajouter des détails opérationnels
                </span>
                <small>Optionnel</small>
              </summary>
              <div className={styles.advancedNoticeContent}>
                <div className={styles.travelerFieldGrid}>
                  <label className={styles.label}>
                    Email voyageur
                    <Input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} />
                  </label>
                  <label className={styles.label}>
                    Bébé
                    <Select value={form.hasBaby} onChange={(event) => updateForm("hasBaby", event.target.value)}>
                      <option value="no">Non</option>
                      <option value="yes">Oui</option>
                    </Select>
                  </label>
                  <label className={styles.label}>
                    Langue
                    <Select value={form.language} onChange={(event) => updateForm("language", event.target.value)}>
                      <option value="fr">Français</option>
                      <option value="en">Anglais</option>
                      <option value="es">Espagnol</option>
                      <option value="de">Allemand</option>
                      <option value="it">Italien</option>
                    </Select>
                  </label>
                  <label className={styles.label}>
                    Code réservation
                    <Input value={form.bookingCode} onChange={(event) => updateForm("bookingCode", event.target.value)} />
                  </label>
                  <label className={styles.label}>
                    Priorité
                    <Select value={form.priority} onChange={(event) => updateForm("priority", event.target.value as TravelerMissionForm["priority"])}>
                      <option value="normal">Normale</option>
                      <option value="high">Haute</option>
                      <option value="urgent">Urgente</option>
                    </Select>
                  </label>
                  <label className={styles.label}>
                    Statut particulier
                    <Select value={form.issueFlag} onChange={(event) => updateForm("issueFlag", event.target.value)}>
                      <option value="none">Aucun</option>
                      <option value="watch">À surveiller</option>
                      <option value="incident">Incident</option>
                      <option value="urgent">Urgence</option>
                    </Select>
                  </label>
                </div>
                <div>
                  <p className={styles.eyebrow}>À prévoir si nécessaire</p>
                  <div className={styles.travelerChecklist}>
                    {actionOptions.map((action) => (
                      <button
                        key={action.value}
                        type="button"
                        className={form.actions.includes(action.value) ? styles.travelerCheckActive : styles.travelerCheck}
                        onClick={() => toggleAction(action.value)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className={styles.label}>
                  Accueil spécifique
                  <Input value={form.specialWelcome} onChange={(event) => updateForm("specialWelcome", event.target.value)} placeholder="Ex : champagne, lit bébé, arrivée tardive" />
                </label>
                <div className={styles.travelerFieldGrid}>
                  <label className={styles.label}>
                    Accès logement et codes
                    <Textarea rows={3} value={form.accessInstructions} onChange={(event) => updateForm("accessInstructions", event.target.value)} />
                  </label>
                  <label className={styles.label}>
                    Parking et arrivée
                    <Textarea rows={3} value={form.parkingInstructions} onChange={(event) => updateForm("parkingInstructions", event.target.value)} />
                  </label>
                </div>
                <label className={styles.label}>
                  Voyageurs sensibles ou informations importantes
                  <Textarea rows={3} value={form.sensitiveTraveler} onChange={(event) => updateForm("sensitiveTraveler", event.target.value)} />
                </label>
                <label className={styles.label}>
                  Notes internes
                  <Textarea rows={3} value={form.internalNotes} onChange={(event) => updateForm("internalNotes", event.target.value)} />
                </label>
              </div>
            </details>

            <Button type="submit" disabled={submitting} className={styles.noticeSubmitButton}>
              <Send size={16} aria-hidden="true" />
              {submitting ? "Envoi..." : "Envoyer à la concierge"}
            </Button>
          </form>

          <aside className={styles.travelerMissionAside}>
            <div className={styles.travelerSummaryCard}>
              <p className={styles.eyebrow}>Aperçu envoyé</p>
              <strong>{buildTitle(form)}</strong>
              <span>
                <Building2 size={15} aria-hidden="true" />
                {selectedAssignment ? getAssignmentLabel(selectedAssignment) : "Logement et conciergerie à choisir"}
              </span>
              <span>{form.arrivalDate || "Arrivée à préciser"} - {form.departureDate || "Départ à préciser"}</span>
              <span>{Number(form.adults || 0) + Number(form.children || 0) + (form.hasBaby === "yes" ? 1 : 0)} voyageur(s)</span>
              <span>{form.bookingPlatform} · prise en charge à confirmer</span>
            </div>
            <div className={styles.travelerSummaryCard}>
              <p className={styles.eyebrow}>Notifications</p>
              <span>La concierge reçoit une fiche séjour courte, puis le propriétaire voit le suivi : envoyé, vu, pris en charge, planifié.</span>
            </div>
            <div className={styles.travelerSummaryCard}>
              <p className={styles.eyebrow}>Côté concierge</p>
              <span><Eye size={15} aria-hidden="true" /> Nouveau séjour à organiser</span>
              <span><CheckCircle2 size={15} aria-hidden="true" /> Bouton Confirmer la prise en charge</span>
              <span><CalendarCheck2 size={15} aria-hidden="true" /> Ajout au planning si nécessaire</span>
            </div>
          </aside>
        </div>
        </div>
          </section>
      ) : null}

        <section className={styles.travelerMissionListSection}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Séjours transmis</p>
              <h2>Vue liste missions voyageurs</h2>
            </div>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </Select>
          </div>

          {loading ? <p>Chargement des séjours...</p> : null}
          {!loading && filteredMissions.length === 0 ? (
            <p className={styles.meta}>Aucune mission voyageur pour le moment.</p>
          ) : null}

          <div className={styles.travelerMissionGrid}>
            {filteredMissions.map((mission) => (
              <TravelerMissionCard
                key={mission.id}
                mission={mission}
                housing={housing}
                partners={partners}
                onDuplicate={duplicateMission}
              />
            ))}
          </div>
        </section>
    </div>
  );
}
