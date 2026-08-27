import { getCanonicalListingId } from "@/app/lib/listingReferences";

type TravelerMissionLike = {
  id: string;
  title: string | null;
  status: string | null;
  scheduled_start: string | null;
  property_id?: string | number | null;
  metadata?: Record<string, unknown> | null;
};

function getMetadataString(
  mission: Pick<TravelerMissionLike, "metadata">,
  key: string,
) {
  const value = mission.metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

export function isTravelerMission(mission: Pick<TravelerMissionLike, "metadata">) {
  return Boolean(
    getMetadataString(mission, "guest_first_name") ||
      getMetadataString(mission, "guest_last_name") ||
      getMetadataString(mission, "booking_platform") ||
      getMetadataString(mission, "booking_code"),
  );
}

export function getTravelerMissionGuestName(
  mission: Pick<TravelerMissionLike, "metadata" | "title">,
) {
  const fullName = [
    getMetadataString(mission, "guest_first_name"),
    getMetadataString(mission, "guest_last_name"),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || mission.title || "Voyageur";
}

export function getTravelerMissionGuestCount(
  mission: Pick<TravelerMissionLike, "metadata">,
) {
  const adults = Number(mission.metadata?.guest_adults ?? 0);
  const children = Number(mission.metadata?.guest_children ?? 0);
  const baby = mission.metadata?.guest_baby === true ? 1 : 0;
  const total = adults + children + baby;
  return total > 0 ? total : null;
}

export function getTravelerMissionPlatform(
  mission: Pick<TravelerMissionLike, "metadata">,
) {
  return getMetadataString(mission, "booking_platform");
}

export function getTravelerMissionStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "draft":
      return "Enregistree";
    case "assigned":
      return "Prise en compte";
    case "accepted":
      return "Acceptee";
    case "scheduled":
    case "date_confirmed":
      return "Planifiee";
    case "in_progress":
      return "En cours";
    case "completed":
      return "Terminee";
    case "canceled":
      return "Annulee";
    default:
      return "A suivre";
  }
}

export function getTravelerMissionStatusTone(status: string | null | undefined) {
  switch (status) {
    case "assigned":
    case "accepted":
    case "scheduled":
    case "date_confirmed":
    case "completed":
      return "success" as const;
    case "draft":
    case "to_schedule":
    case "date_requested":
    case "date_proposed":
    case "in_progress":
      return "warning" as const;
    default:
      return "default" as const;
  }
}

export function getTravelerMissionPropertyId(
  mission: Pick<TravelerMissionLike, "metadata" | "property_id">,
) {
  return getCanonicalListingId({
    propertyId: mission.property_id ?? null,
    metadata: mission.metadata ?? null,
  }) ?? "";
}
