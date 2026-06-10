import type { OwnerPlanningItem } from "./types";

export const planningTypeLabels: Record<OwnerPlanningItem["type"], string> = {
  menage: "Ménage",
  maintenance: "Maintenance",
  checkin: "Arrivée voyageur",
  checkout: "Départ voyageur",
  autre: "Mission",
};

export const planningStatusLabels: Record<OwnerPlanningItem["status"], string> = {
  a_faire: "À faire",
  urgent: "Urgent",
  en_attente_validation: "En attente de validation",
  confirme: "Confirmé",
  pret_voyageurs: "Prêt pour les voyageurs",
};

export function formatPlanningDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date à confirmer";

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function formatPlanningTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Heure à confirmer";

  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatPlanningDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date à confirmer";

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getPlanningItemPriority(item: OwnerPlanningItem) {
  if (item.status === "urgent") return 0;
  if (item.status === "en_attente_validation") return 1;
  if (item.status === "a_faire") return 2;
  return 3;
}
