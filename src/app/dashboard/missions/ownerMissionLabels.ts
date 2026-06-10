import type { OwnerMissionItem, OwnerMissionStatus } from "./ownerMissionTypes";

export const ownerMissionTypeLabels: Record<OwnerMissionItem["type"], string> = {
  menage: "Ménage",
  maintenance: "Maintenance",
  checkin: "Arrivée voyageur",
  checkout: "Départ voyageur",
  autre: "Mission",
};

export const ownerMissionStatusLabels: Record<OwnerMissionStatus, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  en_attente_validation: "En attente de validation",
  en_retard: "En retard",
  termine: "Terminé",
};

export function formatOwnerMissionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date à confirmer";

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatOwnerMissionTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horaire à confirmer";

  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getOwnerMissionPriority(item: OwnerMissionItem) {
  if (item.status === "en_retard") return 0;
  if (item.status === "en_attente_validation") return 1;
  if (item.isCriticalForNextStay) return 2;
  if (item.status === "en_cours") return 3;
  return 4;
}
