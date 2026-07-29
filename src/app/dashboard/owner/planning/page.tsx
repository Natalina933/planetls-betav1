"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ownerApiError } from "../ownerFeedback";
import OwnerPlanningPage from "./OwnerPlanningPage";
import { planningStatusLabels, planningTypeLabels } from "./planningLabels";
import type { OwnerPlanningItem, OwnerPlanningKpi } from "./types";

type OwnerReservationRow = {
  id: string;
  property_label?: string | null;
  concierge_name?: string | null;
  traveler_first_name?: string | null;
  traveler_last_name?: string | null;
  status: string | null;
  channel?: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  access_instructions?: string | null;
  owner_notes?: string | null;
  concierge_notes?: string | null;
  metadata?: Record<string, unknown> | null;
};

const urgentStatuses = new Set(["urgent"]);
const confirmedStatuses = new Set(["scheduled", "accepted", "acknowledged", "assigned", "confirmed", "in_progress", "in_stay"]);
const completedStatuses = new Set(["completed"]);

function isSameDay(value: string, date: Date) {
  const missionDate = new Date(value);
  return (
    missionDate.getFullYear() === date.getFullYear() &&
    missionDate.getMonth() === date.getMonth() &&
    missionDate.getDate() === date.getDate()
  );
}

function isInNextDays(value: string, days: number) {
  const date = new Date(value);
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + days);
  return date >= now && date <= end;
}

function getMetadataString(metadata: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!metadata) return null;
  const value = keys.map((key) => metadata[key]).find((candidate) => typeof candidate === "string" && candidate.trim());
  return typeof value === "string" ? value.trim() : null;
}

function getPropertyName(reservation: OwnerReservationRow) {
  return reservation.property_label || getMetadataString(reservation.metadata, ["property_label", "housing_name", "property_name"]) || "Logement à préciser";
}

function getCity(reservation: OwnerReservationRow) {
  return getMetadataString(reservation.metadata, ["property_city", "city"]);
}

function normalizeType(value: string | null | undefined): OwnerPlanningItem["type"] {
  const key = (value || "").toLowerCase();

  if (key.includes("clean") || key.includes("ménage") || key.includes("menage")) return "menage";
  if (key.includes("maintenance") || key.includes("serrure") || key.includes("plomberie") || key.includes("réparation")) return "maintenance";
  if (key.includes("check_out") || key.includes("check-out") || key.includes("départ") || key.includes("depart")) return "checkout";
  if (key.includes("check_in") || key.includes("check-in") || key.includes("arrivée") || key.includes("arrivee")) return "checkin";

  return "autre";
}

function getReservationType(reservation: OwnerReservationRow): OwnerPlanningItem["type"] {
  const requestedActions = reservation.metadata?.requested_actions;
  const firstAction = Array.isArray(requestedActions)
    ? requestedActions.find((action): action is string => typeof action === "string" && action.trim().length > 0)
    : null;

  return normalizeType(
    getMetadataString(reservation.metadata, ["service_type", "category", "mission_type"]) ||
      firstAction ||
      reservation.channel ||
      "check_in",
  );
}

function mapStatus(reservation: OwnerReservationRow): OwnerPlanningItem["status"] {
  const issueFlag = getMetadataString(reservation.metadata, ["issue_flag"]);
  if (issueFlag === "urgent" || urgentStatuses.has(reservation.status || "")) return "urgent";
  if ((reservation.status || "") === "shared") return "en_attente_validation";
  if (completedStatuses.has(reservation.status || "")) return "pret_voyageurs";
  if (confirmedStatuses.has(reservation.status || "")) return "confirme";
  return "a_faire";
}

function mapReservationToPlanningItem(reservation: OwnerReservationRow): OwnerPlanningItem {
  const travelerName = [reservation.traveler_first_name, reservation.traveler_last_name].filter(Boolean).join(" ").trim();
  const narrativeParts = [
    travelerName ? `Voyageur ${travelerName}` : null,
    reservation.concierge_name ? `Conciergerie ${reservation.concierge_name}` : null,
    reservation.owner_notes ? `Note owner : ${reservation.owner_notes}` : null,
    reservation.concierge_notes ? `Retour concierge : ${reservation.concierge_notes}` : null,
    reservation.access_instructions ? `Acces : ${reservation.access_instructions}` : null,
  ].filter(Boolean);

  return {
    id: reservation.id,
    date: reservation.check_in_at || reservation.check_out_at || new Date().toISOString(),
    propertyName: getPropertyName(reservation),
    propertyCode: getMetadataString(reservation.metadata, ["property_code"]) || undefined,
    city: getCity(reservation) || undefined,
    travelerName: travelerName || undefined,
    type: getReservationType(reservation),
    status: mapStatus(reservation),
    assignedTo: reservation.concierge_name || undefined,
    notes: [reservation.owner_notes, reservation.concierge_notes, reservation.access_instructions].filter(Boolean).join(" · ") || travelerName || undefined,
    narrative: narrativeParts.join(" · ") || undefined,
    amount: null,
  };
}

function buildKpis(items: OwnerPlanningItem[]): OwnerPlanningKpi[] {
  const today = new Date();
  const urgentCount = items.filter((item) => item.status === "urgent").length;
  const validationCount = items.filter((item) => item.status === "en_attente_validation").length;
  const toPrepareProperties = new Set(
    items
      .filter((item) => ["a_faire", "urgent", "en_attente_validation"].includes(item.status))
      .map((item) => item.propertyName),
  );
  const readyProperties = new Set(items.filter((item) => item.status === "pret_voyageurs").map((item) => item.propertyName));
  const upcomingCount = items.filter((item) => isInNextDays(item.date, 7)).length;
  const todayCount = items.filter((item) => isSameDay(item.date, today)).length;

  return [
    {
      id: "a-traiter",
      label: "À traiter",
      value: urgentCount + validationCount,
      helperText: todayCount > 0 ? `${todayCount} mission(s) aujourd'hui` : "Aucune action aujourd'hui",
      tone: urgentCount > 0 ? "warning" : "neutral",
    },
    {
      id: "validations",
      label: "En attente de validation",
      value: validationCount,
      helperText: validationCount > 0 ? "Votre accord est nécessaire" : "Rien à valider",
      tone: validationCount > 0 ? "warning" : "positive",
    },
    {
      id: "preparations",
      label: "Logements à préparer",
      value: toPrepareProperties.size,
      helperText: "Avant les prochaines arrivées",
      tone: toPrepareProperties.size > 0 ? "warning" : "positive",
    },
    {
      id: "prets",
      label: "Prêts pour les voyageurs",
      value: readyProperties.size,
      helperText: "Logements sans action bloquante",
      tone: "positive",
    },
    {
      id: "a-venir",
      label: "Interventions à venir",
      value: upcomingCount,
      helperText: "Sur les 7 prochains jours",
      tone: "neutral",
    },
  ];
}

function sortPlanningItems(a: OwnerPlanningItem, b: OwnerPlanningItem) {
  const score = (item: OwnerPlanningItem) => {
    if (item.status === "urgent") return 0;
    if (item.status === "en_attente_validation") return 1;
    if (item.status === "a_faire") return 2;
    return 3;
  };

  return score(a) - score(b) || new Date(a.date).getTime() - new Date(b.date).getTime();
}

export default function OwnerPlanningRoutePage() {
  const [reservations, setReservations] = useState<OwnerReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPlanning = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/owner/reservations", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(ownerApiError("Impossible de charger votre planning.", payload?.error));
      }

      setReservations(Array.isArray(payload?.reservations) ? payload.reservations : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : ownerApiError("Impossible de charger votre planning."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlanning();
  }, [loadPlanning]);

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => setSuccess(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [success]);

  const items = useMemo(
    () => reservations.map(mapReservationToPlanningItem).sort(sortPlanningItems),
    [reservations],
  );

  const kpis = useMemo(() => buildKpis(items), [items]);

  const priorities = useMemo(
    () => items.filter((item) => item.status === "urgent" || item.status === "en_attente_validation" || item.status === "a_faire"),
    [items],
  );

  function exportPlanningCsv() {
    const rows = [
      ["Date", "Logement", "Ville", "Type", "Responsable", "Statut"],
      ...items.map((item) => [
        item.date,
        item.propertyName,
        item.city || "",
        planningTypeLabels[item.type],
        item.assignedTo || "À assigner",
        planningStatusLabels[item.status],
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "planning-proprietaire.csv";
    link.click();
    window.URL.revokeObjectURL(url);
    setSuccess("Export CSV généré.");
  }

  return (
    <OwnerPlanningPage
      kpis={kpis}
      priorities={priorities}
      items={items}
      loading={loading}
      error={error}
      success={success}
      onRetry={() => void loadPlanning()}
      onExport={exportPlanningCsv}
    />
  );
}
