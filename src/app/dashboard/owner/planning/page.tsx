"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ownerApiError } from "../ownerFeedback";
import OwnerPlanningPage from "./OwnerPlanningPage";
import { planningStatusLabels, planningTypeLabels } from "./planningLabels";
import type { OwnerPlanningItem, OwnerPlanningKpi } from "./types";

type OwnerMissionRow = {
  id: string;
  title?: string | null;
  service_label?: string | null;
  status: string | null;
  priority: string | null;
  amount: number | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  description?: string | null;
  concierge_name?: string | null;
  metadata?: Record<string, unknown> | null;
};

const urgentStatuses = new Set(["urgent"]);
const validationStatuses = new Set(["pending", "quote_pending", "invoice_pending", "date_requested", "date_proposed", "to_schedule", "draft"]);
const confirmedStatuses = new Set(["scheduled", "accepted", "assigned", "date_confirmed", "confirmed", "in_progress"]);
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

function getPropertyName(mission: OwnerMissionRow) {
  return getMetadataString(mission.metadata, ["property_label", "housing_name", "property_name"]) || "Logement à préciser";
}

function getCity(mission: OwnerMissionRow) {
  return getMetadataString(mission.metadata, ["property_city", "city"]);
}

function normalizeType(value: string | null | undefined): OwnerPlanningItem["type"] {
  const key = (value || "").toLowerCase();

  if (key.includes("clean") || key.includes("ménage") || key.includes("menage")) return "menage";
  if (key.includes("maintenance") || key.includes("serrure") || key.includes("plomberie") || key.includes("réparation")) return "maintenance";
  if (key.includes("check_in") || key.includes("check-in") || key.includes("arrivée") || key.includes("arrivee")) return "checkin";
  if (key.includes("check_out") || key.includes("check-out") || key.includes("départ") || key.includes("depart")) return "checkout";

  return "autre";
}

function getMissionType(mission: OwnerMissionRow): OwnerPlanningItem["type"] {
  const requestedServices = mission.metadata?.requested_services;
  const firstService = Array.isArray(requestedServices)
    ? requestedServices.find((service): service is string => typeof service === "string" && service.trim().length > 0)
    : null;

  return normalizeType(
    getMetadataString(mission.metadata, ["service_type", "category", "mission_type"]) ||
      firstService ||
      mission.service_label ||
      mission.title,
  );
}

function mapStatus(mission: OwnerMissionRow): OwnerPlanningItem["status"] {
  if (mission.priority === "urgent" || urgentStatuses.has(mission.status || "")) return "urgent";
  if (validationStatuses.has(mission.status || "")) return "en_attente_validation";
  if (completedStatuses.has(mission.status || "")) return "pret_voyageurs";
  if (confirmedStatuses.has(mission.status || "")) return "confirme";
  return "a_faire";
}

function mapMissionToPlanningItem(mission: OwnerMissionRow): OwnerPlanningItem {
  return {
    id: mission.id,
    date: mission.scheduled_start || new Date().toISOString(),
    propertyName: getPropertyName(mission),
    propertyCode: getMetadataString(mission.metadata, ["property_code"]) || undefined,
    city: getCity(mission) || undefined,
    type: getMissionType(mission),
    status: mapStatus(mission),
    assignedTo: mission.concierge_name || undefined,
    notes: mission.description || undefined,
    amount: mission.amount,
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
  const [missions, setMissions] = useState<OwnerMissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPlanning = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/missions?scope=owner&limit=80", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(ownerApiError("Impossible de charger votre planning.", payload?.error));
      }

      setMissions(Array.isArray(payload) ? payload : []);
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
    () => missions.map(mapMissionToPlanningItem).sort(sortPlanningItems),
    [missions],
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
