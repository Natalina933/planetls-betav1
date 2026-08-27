"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { getCanonicalListingId } from "@/app/lib/listingReferences";
import { Button, ButtonLink, Input, Select, Textarea } from "@/components/ui";
import { ServiceRequestCard, type ServiceRequestCardTone, type ServiceRequestFact, type ServiceRequestMilestone } from "@/features/service-requests";
import { formatDateValue } from "@/app/utils/formatters";
import { focusFirstModalElement, trapFocusInModal } from "../../modalAccessibility";
import styles from "./OwnerTravelerMissionsPage.module.scss";
import { isAcceptedMissionPartner, isUuidLike } from "../missionPartnerUtils";

type HousingRow = {
  id: string | number;
  nom_logement?: string | null;
  ville?: string | null;
  adresse?: string | null;
  photo_principale?: string | null;
  plateforme?: string | null;
  infos?: Record<string, unknown> | null;
  location?: Record<string, unknown> | null;
  menage?: Record<string, unknown> | null;
  tarifs?: Record<string, unknown> | null;
  contrat?: Record<string, unknown> | null;
  notes?: string[] | string | null;
};

type PartnerRequestRow = {
  id: string;
  title?: string | null;
  description?: string | null;
  property_id?: string | null;
  property_name?: string | null;
  city?: string | null;
  requested_services?: string[] | null;
  selected_concierge_profile_id?: string | null;
  selected_concierge_name?: string | null;
  status?: string | null;
  workflow_status?: string | null;
  mission_id?: string | null;
  metadata?: Record<string, unknown> | null;
  recipients?: Array<{
    status?: string | null;
    concierge_profile_id?: string | null;
    quote_id?: string | null;
    quote_number?: string | null;
    quote_status?: string | null;
  }> | null;
};

type OwnerQuoteRow = {
  id: string;
  quote_number: string | null;
  concierge_profile_id?: string | null;
  owner_profile_id?: string | null;
  status: string | null;
  service_request_id?: string | null;
  service_request_recipient_id?: string | null;
  total_amount?: number | null;
  currency?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  package?: {
    id: string;
    name: string | null;
    description?: string | null;
    category?: string | null;
  } | null;
  quote_items?: Array<{
    id: string;
    label: string;
    description?: string | null;
    quantity?: number | null;
    line_total?: number | null;
  }>;
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

type OwnerReservationApiRow = {
  id: string;
  property_id?: string | null;
  property_label?: string | null;
  concierge_profile_id?: string | null;
  concierge_name?: string | null;
  traveler_first_name?: string | null;
  traveler_last_name?: string | null;
  traveler_phone?: string | null;
  traveler_email?: string | null;
  guest_count?: number | null;
  adults_count?: number | null;
  children_count?: number | null;
  check_in_at?: string | null;
  check_out_at?: string | null;
  channel?: string | null;
  access_instructions?: string | null;
  owner_notes?: string | null;
  concierge_notes?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
};

type ReservationTimelineItem = {
  id: string;
  created_at?: string | null;
  title?: string | null;
  body?: string | null;
  event_type?: string | null;
};

type ReservationDetailPayload = {
  reservation?: {
    id: string;
    owner_name?: string | null;
    concierge_name?: string | null;
    property_label?: string | null;
    access_instructions?: string | null;
    owner_notes?: string | null;
    concierge_notes?: string | null;
    status?: string | null;
    updated_at?: string | null;
  } | null;
  timeline?: ReservationTimelineItem[];
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
  requestId: string;
  conciergeId: string;
  conciergeName: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  propertyPhoto: string;
  city: string;
  requestTitle: string;
  requestDescription: string;
  requestedServices: string[];
  selectedQuoteId: string;
  hasPartner: boolean;
};

type MissionOperationalContext = {
  assignment: AssignmentOption | null;
  quote: OwnerQuoteRow | null;
  housing: HousingRow | null;
  quoteServiceLabels: string[];
  housingServiceLabels: string[];
  actionValues: string[];
  accessInstructions: string;
  parkingInstructions: string;
  housekeepingInstructions: string;
  housingInternalNotes: string;
  contractSummary: string;
  missionBrief: string;
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
    hint: "Copier-coller les messages de réservation ou le planning exporté.",
    placeholder: "Marie Dupont\n12 juin -> 16 juin\n2 adultes + 1 enfant\n+33 6 ...\nmarie@email.com",
  },
  {
    value: "Booking",
    label: "Booking",
    hint: "Coller les blocs client avec dates, voyageurs et contact.",
    placeholder: "Réservation BK-45821\nTimo Martin\n25 juillet -> 4 août\n3 voyageurs\n07 ...",
  },
  {
    value: "Abritel",
    label: "Abritel",
    hint: "Importer les séjours recensés pour une conciergerie et un logement.",
    placeholder: "Famille Bernard\n3 août -> 10 août\n5 personnes\nArrivée tardive",
  },
  {
    value: "Direct",
    label: "Direct",
    hint: "Ajouter les réservations directes, hors plateforme.",
    placeholder: "Client direct\n18 septembre -> 22 septembre\n2 voyageurs\nAccueil autonome",
  },
  {
    value: "Autre",
    label: "Autre",
    hint: "Utiliser un format libre, puis compléter les séjours détectés.",
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
  return (
    getCanonicalListingId({
      propertyId: mission.property_id ?? null,
      metadata: mission.metadata ?? null,
    }) ?? null
  );
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

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function getGenericMetadataString(metadata: Record<string, unknown> | null | undefined, keys: string[]) {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function getPartnerPropertyId(partner: PartnerRequestRow) {
  return (
    getCanonicalListingId({
      propertyId: partner.property_id ?? null,
      metadata: partner.metadata ?? null,
    }) ?? ""
  );
}

function getPartnerPropertyName(partner: PartnerRequestRow) {
  return partner.property_name || partner.city || "Appartement à préciser";
}

function getPartnerSelectedQuoteId(partner: PartnerRequestRow, conciergeId: string) {
  const metadataQuoteId = getGenericMetadataString(partner.metadata, ["selected_quote_id", "quote_id"]);
  if (metadataQuoteId) return metadataQuoteId;

  const acceptedRecipient = partner.recipients?.find(
    (recipient) =>
      (!recipient.concierge_profile_id || recipient.concierge_profile_id === conciergeId) &&
      (recipient.quote_status === "accepted" || recipient.status === "selected" || recipient.status === "accepted") &&
      recipient.quote_id,
  );
  return acceptedRecipient?.quote_id ?? "";
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
      const selectedQuoteId = getPartnerSelectedQuoteId(partner, conciergeId);
      const key = `${conciergeId}:${propertyId || propertyName}:${partner.id}`;

      return {
        key,
        requestId: partner.id,
        conciergeId,
        conciergeName: partner.selected_concierge_name || "Conciergerie",
        propertyId,
        propertyName,
        propertyAddress: property?.adresse || partner.city || "Adresse à confirmer",
        propertyPhoto: property?.photo_principale || "/images/default-logement.png",
        city: partner.city || "",
        requestTitle: partner.title || "Collaboration acceptée",
        requestDescription: partner.description || "",
        requestedServices: Array.isArray(partner.requested_services) ? partner.requested_services : [],
        selectedQuoteId,
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

function getAssignmentAddressLabel(option: AssignmentOption) {
  const address = cleanString(option.propertyAddress);
  const city = cleanString(option.city);
  const propertyName = cleanString(option.propertyName);
  const fallback = cleanString(option.requestTitle);

  if (address && address !== city && address !== propertyName) return address;
  if (city && city !== propertyName) return city;
  return fallback && fallback !== propertyName ? fallback : "";
}

function getHousingContractQuoteId(housing: HousingRow | null | undefined) {
  const contract = asRecord(housing?.contrat);
  return getGenericMetadataString(contract, ["quote_id", "quoteId"]);
}

function getHousingServiceLabels(housing: HousingRow | null | undefined) {
  const menage = asRecord(housing?.menage);
  const infos = asRecord(housing?.infos);
  const serviceSource = Array.isArray(menage.services)
    ? menage.services
    : Array.isArray(infos.services)
      ? infos.services
      : [];

  return serviceSource
    .map((service) => {
      const item = asRecord(service);
      const label = cleanString(item.label) || cleanString(item.name);
      const frequency = cleanString(item.frequency);
      return [label, frequency].filter(Boolean).join(" · ");
    })
    .filter(Boolean);
}

function getHousingAccessInstructions(housing: HousingRow | null | undefined) {
  const location = asRecord(housing?.location);
  const infos = asRecord(housing?.infos);
  const lines = [
    cleanString(location.entry_instructions),
    cleanString(location.access_code) || cleanString(infos.digicode)
      ? `Code accès : ${cleanString(location.access_code) || cleanString(infos.digicode)}`
      : "",
    cleanString(location.floor) ? `Étage : ${cleanString(location.floor)}` : "",
    cleanString(infos.wifi_info) ? `Wi-Fi : ${cleanString(infos.wifi_info)}` : "",
    cleanString(housing?.adresse) ? `Adresse : ${cleanString(housing?.adresse)}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

function getHousingParkingInstructions(housing: HousingRow | null | undefined) {
  const location = asRecord(housing?.location);
  const infos = asRecord(housing?.infos);
  return (
    cleanString(location.parking_instructions) ||
    cleanString(location.parking) ||
    cleanString(infos.parking_instructions) ||
    cleanString(infos.parking)
  );
}

function getHousingHousekeepingInstructions(housing: HousingRow | null | undefined) {
  const menage = asRecord(housing?.menage);
  const lines = [
    cleanString(menage.instructions),
    cleanString(menage.checklist) ? `Checklist : ${cleanString(menage.checklist)}` : "",
    cleanString(menage.temps) ? `Temps prévu : ${cleanString(menage.temps)}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

function getHousingInternalNotes(housing: HousingRow | null | undefined) {
  const menage = asRecord(housing?.menage);
  const notes = Array.isArray(housing?.notes) ? housing?.notes.join("\n") : cleanString(housing?.notes);
  return [cleanString(menage.internal_notes), notes].filter(Boolean).join("\n");
}

function inferActionFromLabel(label: string) {
  const normalized = label.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  if (/(menage|clean|housekeep)/.test(normalized)) return "cleaning";
  if (/(linge|linen|drap|serviette)/.test(normalized)) return "linen";
  if (/(check.?out|depart|sortie)/.test(normalized)) return "checkout";
  if (/(check.?in|accueil|arrivee|welcome)/.test(normalized)) return "checkin";
  if (/(course|grocery|panier)/.test(normalized)) return "groceries";
  if (/(controle|inspection|qualite|verification)/.test(normalized)) return "quality_check";
  if (/(maintenance|reparation|technique|depannage)/.test(normalized)) return "maintenance";
  if (/(urgence|urgent|incident)/.test(normalized)) return "emergency";
  return "";
}

function findAcceptedQuoteForAssignment(quotes: OwnerQuoteRow[], option: AssignmentOption | null, housing: HousingRow | null) {
  if (!option) return null;
  const housingQuoteId = getHousingContractQuoteId(housing);
  const acceptedQuotes = quotes.filter((quote) => quote.status === "accepted");
  const byId = acceptedQuotes.find((quote) => quote.id === option.selectedQuoteId || quote.id === housingQuoteId);
  if (byId) return byId;

  const byRequest = acceptedQuotes.find((quote) => {
    const metadata = asRecord(quote.metadata);
    const requestId = quote.service_request_id || getGenericMetadataString(metadata, ["service_request_id", "request_id"]);
    return requestId === option.requestId && quote.concierge_profile_id === option.conciergeId;
  });
  if (byRequest) return byRequest;

  const byProperty = acceptedQuotes.find((quote) => {
    const metadata = asRecord(quote.metadata);
    const quotePropertyId =
      getCanonicalListingId({
        propertyId: getGenericMetadataString(metadata, ["property_id", "service_property_id"]) || null,
        metadata,
      }) ?? "";
    return quotePropertyId && quotePropertyId === option.propertyId && quote.concierge_profile_id === option.conciergeId;
  });
  if (byProperty) return byProperty;

  const sameConcierge = acceptedQuotes.filter((quote) => quote.concierge_profile_id === option.conciergeId);
  return sameConcierge.length === 1 ? sameConcierge[0] : null;
}

function buildOperationalContext(input: {
  form: TravelerMissionForm;
  assignment: AssignmentOption | null;
  housing: HousingRow[];
  quotes: OwnerQuoteRow[];
}): MissionOperationalContext {
  const selectedHousing = input.housing.find((item) => String(item.id) === input.form.propertyId) ?? null;
  const quote = findAcceptedQuoteForAssignment(input.quotes, input.assignment, selectedHousing);
  const quoteItems = quote?.quote_items ?? [];
  const quoteServiceLabels = uniqueStrings([
    ...(input.assignment?.requestedServices ?? []),
    ...quoteItems.map((item) => cleanString(item.label)),
  ]);
  const housingServiceLabels = uniqueStrings(getHousingServiceLabels(selectedHousing));
  const allServiceLabels = uniqueStrings([...quoteServiceLabels, ...housingServiceLabels]);
  const actionValues = uniqueStrings(allServiceLabels.map(inferActionFromLabel));
  const packageLabel = cleanString(quote?.package?.name);
  const contractParts = [
    quote?.quote_number ? `Devis ${quote.quote_number}` : "",
    packageLabel ? `Pack ${packageLabel}` : "",
    typeof quote?.total_amount === "number" ? `Montant ${quote.total_amount.toFixed(2)} ${quote.currency ?? "EUR"}` : "",
  ].filter(Boolean);
  const accessInstructions = getHousingAccessInstructions(selectedHousing);
  const parkingInstructions = getHousingParkingInstructions(selectedHousing);
  const housekeepingInstructions = getHousingHousekeepingInstructions(selectedHousing);
  const housingInternalNotes = getHousingInternalNotes(selectedHousing);
  const missionBriefLines = [
    contractParts.length ? `Base contractuelle : ${contractParts.join(" · ")}` : "",
    quoteServiceLabels.length ? `Prestations devis : ${quoteServiceLabels.join(", ")}` : "",
    housingServiceLabels.length ? `Infos logement : ${housingServiceLabels.join(", ")}` : "",
    housekeepingInstructions ? `Consignes ménage/logement : ${housekeepingInstructions}` : "",
    quote?.notes ? `Notes du devis : ${quote.notes}` : "",
  ];

  return {
    assignment: input.assignment,
    quote,
    housing: selectedHousing,
    quoteServiceLabels,
    housingServiceLabels,
    actionValues,
    accessInstructions,
    parkingInstructions,
    housekeepingInstructions,
    housingInternalNotes,
    contractSummary: contractParts.join(" · "),
    missionBrief: missionBriefLines.filter(Boolean).join("\n"),
  };
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

function mapReservationStatusToMissionStatus(status: string | null | undefined) {
  switch (status) {
    case "completed":
      return "completed";
    case "canceled":
      return "canceled";
    case "in_stay":
      return "in_progress";
    case "scheduled":
      return "in_progress";
    case "acknowledged":
      return "accepted";
    case "shared":
      return "assigned";
    default:
      return "assigned";
  }
}

function formatTimelineDate(value: string | null | undefined) {
  if (!value) return "A l'instant";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "A l'instant";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function reservationToMissionRow(reservation: OwnerReservationApiRow): MissionRow {
  const metadata = asRecord(reservation.metadata);
  const firstName = cleanString(reservation.traveler_first_name);
  const lastName = cleanString(reservation.traveler_last_name);
  const travelerName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const normalizedStatus = mapReservationStatusToMissionStatus(reservation.status);
  const normalizedMetadata: Record<string, unknown> = {
    ...metadata,
    mission_kind: "traveler_stay",
    reservation_id: reservation.id,
    reservation_status: reservation.status ?? null,
    housing_id: getCanonicalListingId({ propertyId: reservation.property_id ?? null, metadata }) ?? null,
    property_label: reservation.property_label ?? cleanString(metadata.property_label),
    concierge_profile_id: reservation.concierge_profile_id ?? cleanString(metadata.concierge_profile_id),
    concierge_name: reservation.concierge_name ?? cleanString(metadata.concierge_name),
    guest_first_name: firstName,
    guest_last_name: lastName,
    guest_phone: cleanString(reservation.traveler_phone) || cleanString(metadata.guest_phone),
    guest_email: cleanString(reservation.traveler_email) || cleanString(metadata.guest_email),
    guest_adults:
      typeof reservation.adults_count === "number"
        ? reservation.adults_count
        : Number(metadata.guest_adults ?? reservation.guest_count ?? 0),
    guest_children:
      typeof reservation.children_count === "number"
        ? reservation.children_count
        : Number(metadata.guest_children ?? 0),
    booking_platform: cleanString(reservation.channel) || cleanString(metadata.booking_platform) || cleanString(metadata.channel),
    check_in: reservation.check_in_at ?? cleanString(metadata.check_in),
    check_out: reservation.check_out_at ?? cleanString(metadata.check_out),
    access_instructions: cleanString(reservation.access_instructions) || cleanString(metadata.access_instructions),
    owner_notes: cleanString(reservation.owner_notes) || cleanString(metadata.owner_notes),
    concierge_notes: cleanString(reservation.concierge_notes) || cleanString(metadata.concierge_notes),
    visible_in_owner_space: true,
  };

  if (["accepted", "in_progress", "completed"].includes(normalizedStatus)) {
    normalizedMetadata.concierge_viewed_at =
      cleanString(metadata.concierge_viewed_at) || cleanString(metadata.viewed_at) || reservation.check_in_at || new Date().toISOString();
  }

  if (["in_progress", "completed"].includes(normalizedStatus)) {
    normalizedMetadata.planning_registered_at =
      cleanString(metadata.planning_registered_at) || cleanString(metadata.concierge_planned_at) || reservation.check_in_at || new Date().toISOString();
    normalizedMetadata.added_to_concierge_planning = true;
    normalizedMetadata.concierge_planning_status = "planned";
  }

  return {
    id: reservation.id,
    title: travelerName || "Voyageur",
    description: cleanString(reservation.owner_notes) || null,
    status: normalizedStatus,
    priority:
      cleanString(metadata.issue_flag) === "urgent" ? "urgent" : ((cleanString(metadata.priority) as MissionRow["priority"]) ?? "normal"),
    property_id: reservation.property_id ?? null,
    scheduled_start: reservation.check_in_at ?? null,
    scheduled_end: reservation.check_out_at ?? null,
    metadata: normalizedMetadata,
  };
}

function buildReservationPayload(form: TravelerMissionForm, context?: MissionOperationalContext) {
  const requestedActions = uniqueStrings([...form.actions, ...(context?.actionValues ?? [])]);
  const internalNotes = [form.internalNotes.trim(), context?.housingInternalNotes ?? ""].filter(Boolean).join("\n\n");
  const selectedHousing = context?.housing;
  const propertyLabel =
    cleanString(selectedHousing?.nom_logement) ||
    cleanString(selectedHousing?.ville) ||
    cleanString(context?.assignment?.propertyName) ||
    "";

  return {
    concierge_profile_id: form.conciergeProfileId,
    property_id: isUuidLike(form.propertyId) ? form.propertyId : null,
    property_label: propertyLabel || null,
    traveler_first_name: form.firstName.trim(),
    traveler_last_name: form.lastName.trim(),
    traveler_phone: form.phone.trim() || null,
    traveler_email: form.email.trim() || null,
    guest_count: Number(form.adults || 0) + Number(form.children || 0) + (form.hasBaby === "yes" ? 1 : 0),
    adults_count: Number(form.adults || 0),
    children_count: Number(form.children || 0),
    infants_count: form.hasBaby === "yes" ? 1 : 0,
    check_in_at: buildDateTime(form.arrivalDate, form.arrivalTime),
    check_out_at: buildDateTime(form.departureDate, form.departureTime),
    arrival_time_window: form.arrivalTime || null,
    departure_time_window: form.departureTime || null,
    access_instructions: form.accessInstructions.trim() || context?.accessInstructions || null,
    owner_notes: [form.notes.trim(), context?.missionBrief ?? ""].filter(Boolean).join("\n\n") || null,
    status: "shared",
    channel: form.bookingPlatform,
    metadata: {
      mission_kind: "traveler_stay",
      housing_id: getCanonicalListingId({ propertyId: form.propertyId || null, metadata: null }) ?? null,
      property_label: propertyLabel || null,
      concierge_profile_id: form.conciergeProfileId,
      concierge_name: context?.assignment?.conciergeName ?? null,
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
      requested_actions: requestedActions,
      special_welcome: form.specialWelcome.trim(),
      access_instructions: form.accessInstructions.trim() || context?.accessInstructions || "",
      parking_instructions: form.parkingInstructions.trim() || context?.parkingInstructions || "",
      sensitive_traveler: form.sensitiveTraveler.trim(),
      internal_notes: internalNotes,
      issue_flag: form.issueFlag,
      source_quote_id: context?.quote?.id ?? null,
      source_quote_number: context?.quote?.quote_number ?? null,
      source_quote_package_name: context?.quote?.package?.name ?? null,
      source_quote_services: context?.quoteServiceLabels ?? [],
      source_housing_services: context?.housingServiceLabels ?? [],
      source_housing_access_instructions: context?.accessInstructions ?? "",
      source_housing_parking_instructions: context?.parkingInstructions ?? "",
      source_housing_instructions: context?.housekeepingInstructions ?? "",
      source_housing_internal_notes: context?.housingInternalNotes ?? "",
      source_contract_summary: context?.contractSummary ?? "",
      notice_mode: "shared_reservation",
      concierge_planning_status: "pending",
      notification_reason: "new_shared_reservation",
      assignment_flow: "owner_proposed_to_concierge",
      visible_in_owner_space: true,
      visible_in_owner_planning: true,
      visible_in_concierge_workspace: true,
      created_from: "owner_shared_reservation",
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
  onFocus,
}: {
  mission: MissionRow;
  housing: HousingRow[];
  partners: PartnerRequestRow[];
  onDuplicate: (mission: MissionRow) => void;
  onFocus: (missionId: string) => void;
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
          <button type="button" className={styles.buttonSecondary} onClick={() => onFocus(mission.id)}>
            <Eye size={15} aria-hidden="true" />
            Suivi
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

function OwnerTravelerMissionsContent() {
  const searchParams = useSearchParams();
  const targetRequestId = searchParams.get("request");
  const targetQuoteId = searchParams.get("quote");
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [housing, setHousing] = useState<HousingRow[]>([]);
  const [partners, setPartners] = useState<PartnerRequestRow[]>([]);
  const [acceptedQuotes, setAcceptedQuotes] = useState<OwnerQuoteRow[]>([]);
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
  const [focusedMissionId, setFocusedMissionId] = useState<string | null>(null);
  const [focusedReservationDetail, setFocusedReservationDetail] = useState<ReservationDetailPayload | null>(null);
  const [focusedReservationLoading, setFocusedReservationLoading] = useState(false);
  const [focusedReservationError, setFocusedReservationError] = useState<string | null>(null);
  const [focusedReservationSaving, setFocusedReservationSaving] = useState(false);
  const [focusedReservationSuccess, setFocusedReservationSuccess] = useState<string | null>(null);
  const [focusedReservationDraft, setFocusedReservationDraft] = useState({
    accessInstructions: "",
    ownerNotes: "",
  });
  const [planningText, setPlanningText] = useState("");
  const [parsedStayDrafts, setParsedStayDrafts] = useState<Record<string, ParsedStayDraft>>({});
  const [sentParsedStayIds, setSentParsedStayIds] = useState<Record<string, boolean>>({});
  const composerModalRef = useRef<HTMLElement | null>(null);
  const composerReturnFocusRef = useRef<HTMLElement | null>(null);
  const autoOpenTargetRef = useRef<string | null>(null);

  const closeComposer = useCallback(() => {
    setComposerOpen(false);
  }, []);

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
  const operationalContext = useMemo(
    () => buildOperationalContext({ form, assignment: selectedAssignment, housing, quotes: acceptedQuotes }),
    [acceptedQuotes, form, housing, selectedAssignment],
  );
  const hasOperationalContext = Boolean(
    operationalContext.quote ||
      operationalContext.quoteServiceLabels.length > 0 ||
      operationalContext.housingServiceLabels.length > 0 ||
      operationalContext.accessInstructions,
  );
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
      const [reservationsResponse, housingResponse, requestsResponse, quotesResponse] = await Promise.all([
        fetch("/api/owner/reservations", { cache: "no-store" }),
        fetch("/api/housing", { cache: "no-store" }),
        fetch("/api/service-requests?limit=100", { cache: "no-store" }),
        fetch("/api/quotes?status=accepted&limit=100", { cache: "no-store" }),
      ]);

      const reservationsPayload = await reservationsResponse.json();
      const housingPayload = await housingResponse.json();
      const requestsPayload = await requestsResponse.json();
      const quotesPayload = await quotesResponse.json();

      if (!reservationsResponse.ok) throw new Error(reservationsPayload?.error || "Impossible de charger les séjours.");
      if (!housingResponse.ok) throw new Error(housingPayload?.error || "Impossible de charger les logements.");
      if (!requestsResponse.ok) throw new Error(requestsPayload?.error || "Impossible de charger les partenaires.");
      if (!quotesResponse.ok) throw new Error(quotesPayload?.error || "Impossible de charger les devis acceptés.");

      const nextHousing = Array.isArray(housingPayload) ? housingPayload : [];
      const acceptedPartners = (Array.isArray(requestsPayload?.items) ? requestsPayload.items : []).filter(
        isAcceptedMissionPartner,
      );
      const nextAssignments = buildAssignmentOptions(acceptedPartners, nextHousing);
      const targetedAssignment =
        nextAssignments.find((option) => targetRequestId && option.requestId === targetRequestId) ??
        nextAssignments.find((option) => targetQuoteId && option.selectedQuoteId === targetQuoteId) ??
        nextAssignments[0];
      const nextReservations = Array.isArray(reservationsPayload?.reservations) ? reservationsPayload.reservations : [];

      setMissions(
        nextReservations
          .map((reservation: OwnerReservationApiRow) => reservationToMissionRow(reservation))
          .filter((mission: MissionRow) => mission.metadata?.mission_kind === "traveler_stay"),
      );
      setHousing(nextHousing);
      setPartners(acceptedPartners);
      setAcceptedQuotes(Array.isArray(quotesPayload) ? quotesPayload : []);
      setForm((current) => ({
        ...current,
        propertyId: current.propertyId || targetedAssignment?.propertyId || String(nextHousing[0]?.id ?? ""),
        conciergeProfileId:
          current.conciergeProfileId || targetedAssignment?.conciergeId || "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger l'espace séjours.");
    } finally {
      setLoading(false);
    }
  }, [targetQuoteId, targetRequestId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isComposerOpen) return;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.requestAnimationFrame(() => focusFirstModalElement(composerModalRef.current));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeComposer();
        return;
      }
      trapFocusInModal(event, composerModalRef.current);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      window.requestAnimationFrame(() => composerReturnFocusRef.current?.focus());
    };
  }, [closeComposer, isComposerOpen]);

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
  const focusedMission = useMemo(
    () => filteredMissions.find((mission) => mission.id === focusedMissionId) ?? filteredMissions[0] ?? null,
    [filteredMissions, focusedMissionId],
  );

  useEffect(() => {
    let active = true;

    async function loadFocusedReservation() {
      if (!focusedMission?.id) {
        setFocusedReservationDetail(null);
        setFocusedReservationError(null);
        return;
      }

      setFocusedReservationLoading(true);
      setFocusedReservationError(null);
      try {
        const response = await fetch(`/api/reservations/${encodeURIComponent(focusedMission.id)}`, { cache: "no-store" });
        const payload = (await response.json()) as ReservationDetailPayload & { error?: string };
        if (!response.ok) throw new Error(payload?.error || "Impossible de charger le detail du sejour.");
        if (active) setFocusedReservationDetail(payload);
      } catch (err) {
        if (active) {
          setFocusedReservationDetail(null);
          setFocusedReservationError(err instanceof Error ? err.message : "Impossible de charger le suivi collaboratif.");
        }
      } finally {
        if (active) setFocusedReservationLoading(false);
      }
    }

    void loadFocusedReservation();
    return () => {
      active = false;
    };
  }, [focusedMission?.id]);

  useEffect(() => {
    setFocusedReservationDraft({
      accessInstructions: focusedReservationDetail?.reservation?.access_instructions ?? "",
      ownerNotes: focusedReservationDetail?.reservation?.owner_notes ?? "",
    });
  }, [focusedReservationDetail?.reservation?.access_instructions, focusedReservationDetail?.reservation?.owner_notes]);

  useEffect(() => {
    if (!focusedReservationSuccess) return;
    const timeout = window.setTimeout(() => setFocusedReservationSuccess(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [focusedReservationSuccess]);

  const patchFocusedReservation = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!focusedMission?.id) return false;
      setFocusedReservationSaving(true);
      setFocusedReservationError(null);
      setFocusedReservationSuccess(null);
      try {
        const response = await fetch(`/api/reservations/${encodeURIComponent(focusedMission.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json()) as ReservationDetailPayload & { error?: string };
        if (!response.ok) throw new Error(data?.error || "Impossible de mettre a jour le sejour.");
        setFocusedReservationDetail(data);
        setFocusedReservationSuccess("Brief proprietaire mis a jour.");
        return true;
      } catch (err) {
        setFocusedReservationError(err instanceof Error ? err.message : "Impossible de mettre a jour le sejour.");
        return false;
      } finally {
        setFocusedReservationSaving(false);
      }
    },
    [focusedMission?.id],
  );

  const saveFocusedReservationBrief = useCallback(async () => {
    await patchFocusedReservation({
      patch: {
        access_instructions: focusedReservationDraft.accessInstructions,
        owner_notes: focusedReservationDraft.ownerNotes,
      },
    });
  }, [focusedReservationDraft.accessInstructions, focusedReservationDraft.ownerNotes, patchFocusedReservation]);

  const cancelFocusedReservation = useCallback(async () => {
    if (!focusedMission?.id) return;
    if (!window.confirm("Annuler ce sejour partage et l'ajouter a la timeline collaborative ?")) return;
    const ok = await patchFocusedReservation({
      action: "cancel",
      reason: "Annulation demandee par le proprietaire depuis le cockpit owner.",
    });
    if (ok) {
      setFocusedReservationSuccess("Sejour annule et timeline mise a jour.");
    }
  }, [focusedMission?.id, patchFocusedReservation]);

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
  const isPostAcceptanceEntry = Boolean((targetRequestId || targetQuoteId) && selectedAssignment);
  const isQuickArrivalComposer = isPostAcceptanceEntry && creationMode === "manual";

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
    composerReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setCreationMode(mode);
    setComposerOpen(true);
  }

  useEffect(() => {
    const targetKey = targetRequestId || targetQuoteId;
    if (!targetKey || loading || assignmentOptions.length === 0 || autoOpenTargetRef.current === targetKey) return;

    const targetedAssignment =
      assignmentOptions.find((option) => targetRequestId && option.requestId === targetRequestId) ??
      assignmentOptions.find((option) => targetQuoteId && option.selectedQuoteId === targetQuoteId);

    if (!targetedAssignment) return;

    autoOpenTargetRef.current = targetKey;
    selectAssignment(targetedAssignment);
    setSuccess(
      `La collaboration avec ${targetedAssignment.conciergeName} est prête : transmettez maintenant une arrivée ou votre planning.`,
    );
  }, [assignmentOptions, loading, targetQuoteId, targetRequestId]);

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
    openComposer("manual");
  }

  function fillFormFromStay(stay: ParsedStay) {
    setForm((current) => parsedStayToForm(stay, current));
    openComposer("manual");
    setError(null);
    setSuccess("Séjour chargé dans le formulaire. Relisez puis créez la mission.");
    window.requestAnimationFrame(() => {
      document.getElementById("mission-voyageur-formulaire")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function createMissionFromForm(input: TravelerMissionForm) {
    const context = buildOperationalContext({
      form: input,
      assignment: selectedAssignment,
      housing,
      quotes: acceptedQuotes,
    });
    const response = await fetch("/api/owner/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildReservationPayload(input, context)),
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
      closeComposer();
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
      closeComposer();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer la mission voyageur.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={`${styles.hero} ${isPostAcceptanceEntry ? styles.heroFocused : ""}`}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Missions voyageurs</p>
          <h1>{isPostAcceptanceEntry ? "Transmettre les prochains séjours" : "Séjours voyageurs"}</h1>
          <p>
            {isPostAcceptanceEntry
              ? `La conciergerie est reliée. Commencez simplement par la prochaine arrivée ou importez votre planning.`
              : "Transmettez à votre conciergerie les arrivées, départs, voyageurs, consignes et actions terrain dans un espace clair."}
          </p>
          {!isPostAcceptanceEntry ? (
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
          ) : null}
        </div>
        {!isPostAcceptanceEntry ? (
          <div className={styles.heroSnapshot}>
            <span><Send size={16} /> Séjours transmis</span>
            <strong>{loading ? "..." : upcomingCount}</strong>
            <p>missions à venir</p>
            <div className={styles.heroProgress}>
              <span style={{ width: `${Math.min(100, Math.max(12, missions.length * 18))}%` }} />
            </div>
          </div>
        ) : null}
      </header>

      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}
      {success ? <p className={`${styles.message} ${styles.messageSuccess}`}>{success}</p> : null}

      {selectedAssignment && !isPostAcceptanceEntry ? (
        <section className={styles.syncPanel} aria-label="Lien avec la demande et le devis acceptés">
          <div className={styles.syncMain}>
            <span className={styles.syncBadgeReady}>
              <ShieldCheck size={16} aria-hidden="true" />
              Mission commerciale créée après devis accepté
            </span>
            <h2>{selectedAssignment.requestTitle}</h2>
            <p className={styles.meta}>
              Le devis accepté a validé la collaboration avec {selectedAssignment.conciergeName}. Les séjours voyageurs
              créés ici sont les missions opérationnelles à transmettre ensuite à cette conciergerie.
            </p>
          </div>
          <div className={styles.syncSteps} aria-label="Parcours demande vers séjour">
            <span className={styles.syncStepDone}>Demande envoyée</span>
            <span className={styles.syncStepDone}>
              {operationalContext.quote?.quote_number ? `Devis ${operationalContext.quote.quote_number}` : "Devis accepté"}
            </span>
            <span className={styles.syncStepDone}>Mission commerciale</span>
            <span className={styles.syncStepTodo}>Séjours voyageurs</span>
          </div>
        </section>
      ) : null}

      {isPostAcceptanceEntry && selectedAssignment ? (
        <section className={styles.postAcceptancePanel} aria-labelledby="post-acceptance-title">
          <div>
            <p className={styles.eyebrow}>Prochaine étape</p>
            <h2 id="post-acceptance-title">Comment souhaitez-vous démarrer avec {selectedAssignment.conciergeName} ?</h2>
            <p className={styles.meta}>
              Vous pouvez transmettre seulement la prochaine arrivée, ou importer plusieurs séjours depuis votre plateforme.
            </p>
          </div>
          <div className={styles.postAcceptanceChoices}>
            <button type="button" className={styles.postAcceptanceChoicePrimary} onClick={() => openComposer("manual")}>
              <Bell size={18} aria-hidden="true" />
              <span>
                <strong>Prévenir d&apos;une prochaine arrivée</strong>
                <small>Ajoutez un séjour voyageur en quelques informations.</small>
              </span>
            </button>
            <button type="button" className={styles.postAcceptanceChoice} onClick={() => openComposer("platform")}>
              <ClipboardList size={18} aria-hidden="true" />
              <span>
                <strong>Importer un planning</strong>
                <small>Collez plusieurs réservations Airbnb, Booking ou autre.</small>
              </span>
            </button>
          </div>
        </section>
      ) : null}

      {!isPostAcceptanceEntry ? (
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
      ) : null}

      {!isPostAcceptanceEntry ? <section className={styles.syncPanel} aria-label="Synchronisation planning concierge">
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
      </section> : null}

      {!isPostAcceptanceEntry ? <section id="nouvelle-mission-voyageur" className={styles.creationLauncher}>
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
      </section> : null}

      {isComposerOpen ? (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeComposer();
          }}
        >
        <section
          id="atelier-mission-voyageur"
          ref={composerModalRef}
          className={styles.missionModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mission-modal-title"
          tabIndex={-1}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className={styles.travelerMissionPage}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>Fiche séjour</p>
                <h2 id="mission-modal-title">
                  {isQuickArrivalComposer && selectedAssignment
                    ? `Prévenir ${selectedAssignment.conciergeName} d’une arrivée`
                    : "Prévenir la concierge"}
                </h2>
              </div>
              <button type="button" className={styles.iconButton} onClick={closeComposer} aria-label="Fermer">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
        {isQuickArrivalComposer && selectedAssignment ? (
          <section className={styles.quickArrivalContext} aria-label="Destinataire de l'arrivée">
            <span><ShieldCheck size={16} aria-hidden="true" /> Conciergerie destinataire</span>
            <strong>{selectedAssignment.conciergeName}</strong>
            <small>{selectedAssignment.propertyName}</small>
          </section>
        ) : null}

        {!isQuickArrivalComposer ? <div className={styles.assignmentWorkbench}>
          <section className={styles.assignmentPanel}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Logement</p>
                <h2>Logement concerné</h2>
              </div>
            </div>
            {assignmentOptions.length === 0 ? (
              <p className={styles.meta}>Aucune conciergerie acceptée avec logement rattaché pour le moment.</p>
            ) : (
              <div className={styles.assignmentGrid}>
                {assignmentOptions.map((option) => {
                  const selected =
                    option.conciergeId === form.conciergeProfileId &&
                    (!option.propertyId || option.propertyId === form.propertyId);
                  const addressLabel = getAssignmentAddressLabel(option);
                  return (
                    <button
                      key={option.key}
                      type="button"
                      className={selected ? styles.assignmentCardActive : styles.assignmentCard}
                      onClick={() => selectAssignment(option)}
                    >
                      <div className={styles.assignmentPhoto} style={{ backgroundImage: `url("${option.propertyPhoto}")` }} />
                      <strong>{option.propertyName}</strong>
                      <span>
                        <ShieldCheck size={15} aria-hidden="true" />
                        {option.conciergeName}
                      </span>
                      {addressLabel ? (
                        <small>
                          <MapPin size={13} aria-hidden="true" />
                          {addressLabel}
                        </small>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className={styles.assignmentPanel}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Source</p>
                <h2>Plateforme</h2>
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
                </button>
              ))}
            </div>
          </section>
        </div> : null}

        {!isQuickArrivalComposer ? <div className={styles.creationModeTabs} role="tablist" aria-label="Mode de création">
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
        </div> : null}

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

        <div className={creationMode === "manual" ? `${styles.travelerMissionLayout} ${isQuickArrivalComposer ? styles.quickArrivalLayout : ""}` : styles.hiddenPanel}>
          <form
            id="mission-voyageur-formulaire"
            className={styles.travelerMissionForm}
            onSubmit={handleSubmit}
          >
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
                  Nombre de voyageurs
                  <Input type="number" min="0" value={form.adults} onChange={(event) => updateForm("adults", event.target.value)} />
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
                Consigne pour la concierge <small>(facultatif)</small>
                <Textarea
                  rows={3}
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
                    Téléphone voyageur
                    <Input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} />
                  </label>
                  <label className={styles.label}>
                    Email voyageur
                    <Input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} />
                  </label>
                  <label className={styles.label}>
                    Enfants
                    <Input type="number" min="0" value={form.children} onChange={(event) => updateForm("children", event.target.value)} />
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

            <Button
              type="submit"
              disabled={submitting}
              className={styles.noticeSubmitButton}
            >
              <Send size={16} aria-hidden="true" />
              {submitting ? "Envoi..." : "Envoyer à la concierge"}
            </Button>
          </form>

          <aside className={styles.travelerMissionAside}>
            {focusedMission ? (
              <div className={styles.travelerSummaryCard}>
                <p className={styles.eyebrow}>Derniere prise en compte</p>
                <span className={styles.plannedChip}>
                  <CheckCircle2 size={15} aria-hidden="true" />
                  Mission bien prise en compte
                </span>
                <strong>{getTravelerName(focusedMission)}</strong>
                <span>
                  <Building2 size={15} aria-hidden="true" />
                  {getPropertyLabel(housing, getMissionHousingId(focusedMission))}
                </span>
                <span>
                  {formatDateValue(focusedMission.scheduled_start, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }) || "Arrivee a confirmer"}
                </span>
                <span>{getGuestCount(focusedMission)} voyageur(s)</span>
                <span>
                  {getMetadataString(focusedMission, "booking_platform") || form.bookingPlatform}
                  {" · "}
                  {focusedMission.status === "assigned" ? "transmise a la concierge" : "suivi actif"}
                </span>
              </div>
            ) : null}
            {focusedMission ? (
              <div className={styles.travelerSummaryCard}>
                <p className={styles.eyebrow}>Brief collaboratif</p>
                <strong>{focusedReservationDetail?.reservation?.concierge_name || getMissionConciergeName(partners, focusedMission)}</strong>
                <span>
                  <ShieldCheck size={15} aria-hidden="true" />
                  {focusedReservationDetail?.reservation?.status || getMetadataString(focusedMission, "reservation_status") || "shared"}
                </span>
                <span>
                  <MapPin size={15} aria-hidden="true" />
                  {focusedReservationDetail?.reservation?.property_label || getPropertyLabel(housing, getMissionHousingId(focusedMission))}
                </span>
                {focusedReservationLoading ? <p className={styles.meta}>Chargement du suivi collaboratif...</p> : null}
                {focusedReservationError ? <p className={styles.meta}>{focusedReservationError}</p> : null}
                <div className={styles.editorialCardBlock}>
                  <strong>Accès et consignes</strong>
                  <Textarea
                    rows={3}
                    value={focusedReservationDraft.accessInstructions}
                    onChange={(event) =>
                      setFocusedReservationDraft((current) => ({ ...current, accessInstructions: event.target.value }))
                    }
                    placeholder="Accès, codes, parking, instructions d'arrivée..."
                  />
                </div>
                <div className={styles.editorialCardBlock}>
                  <strong>Note propriétaire</strong>
                  <Textarea
                    rows={3}
                    value={focusedReservationDraft.ownerNotes}
                    onChange={(event) =>
                      setFocusedReservationDraft((current) => ({ ...current, ownerNotes: event.target.value }))
                    }
                    placeholder="Contexte voyageur, priorités, demandes éditoriales pour la conciergerie..."
                  />
                </div>
                {focusedReservationDetail?.reservation?.concierge_notes ? (
                  <div className={styles.editorialCardBlock}>
                    <strong>Retour conciergerie</strong>
                    <p>{focusedReservationDetail.reservation.concierge_notes}</p>
                  </div>
                ) : null}
                {focusedReservationSuccess ? <p className={`${styles.message} ${styles.messageSuccess}`}>{focusedReservationSuccess}</p> : null}
                <div className={styles.heroActions}>
                  <button type="button" className={styles.buttonSecondary} onClick={() => void saveFocusedReservationBrief()} disabled={focusedReservationSaving}>
                    {focusedReservationSaving ? "Enregistrement..." : "Mettre a jour le brief"}
                  </button>
                  {focusedReservationDetail?.reservation?.status !== "canceled" && focusedReservationDetail?.reservation?.status !== "completed" ? (
                    <button type="button" className={styles.buttonSecondary} onClick={() => void cancelFocusedReservation()} disabled={focusedReservationSaving}>
                      Annuler le sejour
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
            {focusedMission ? (
              <div className={styles.travelerSummaryCard}>
                <p className={styles.eyebrow}>Timeline recente</p>
                {(focusedReservationDetail?.timeline ?? []).slice(0, 4).map((item) => (
                  <div key={item.id} className={styles.timelineCardItem}>
                    <small>{formatTimelineDate(item.created_at)}</small>
                    <strong>{item.title || "Evenement sejour"}</strong>
                    {item.body ? <p>{item.body}</p> : null}
                  </div>
                ))}
                {!focusedReservationLoading && (focusedReservationDetail?.timeline?.length ?? 0) === 0 ? (
                  <p className={styles.meta}>Le suivi collaboratif apparaitra ici des la premiere mise a jour concierge.</p>
                ) : null}
              </div>
            ) : null}
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
            {hasOperationalContext ? (
              <div className={styles.travelerSummaryCard}>
                <p className={styles.eyebrow}>Contexte repris</p>
                {operationalContext.quote ? (
                  <span>
                    <FileText size={15} aria-hidden="true" />
                    {operationalContext.quote.quote_number
                      ? `Devis ${operationalContext.quote.quote_number}`
                      : "Devis accepté"}
                    {operationalContext.quote.package?.name ? ` · Pack ${operationalContext.quote.package.name}` : ""}
                  </span>
                ) : null}
                {operationalContext.quoteServiceLabels.slice(0, 4).map((label) => (
                  <span key={`quote-service-${label}`}>
                    <CheckCircle2 size={15} aria-hidden="true" />
                    {label}
                  </span>
                ))}
                {operationalContext.housingServiceLabels.slice(0, 3).map((label) => (
                  <span key={`housing-service-${label}`}>
                    <Home size={15} aria-hidden="true" />
                    {label}
                  </span>
                ))}
                {operationalContext.accessInstructions ? (
                  <span>
                    <MapPin size={15} aria-hidden="true" />
                    Consignes logement reprises
                  </span>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
        </div>
          </section>
        </div>
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
                onFocus={setFocusedMissionId}
              />
            ))}
          </div>
        </section>
    </div>
  );
}

export default function OwnerTravelerMissionsPage() {
  return (
    <Suspense fallback={null}>
      <OwnerTravelerMissionsContent />
    </Suspense>
  );
}
