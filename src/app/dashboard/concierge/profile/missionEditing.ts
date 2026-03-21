import { normalizeAreaLabel } from "../../../lib/profileLocation.ts";
import type { MissionAvailability } from "../../../components/missions/types.ts";

interface MissionCatalogItemLike {
  id: string;
  label: string;
}

interface MissionProfileMissionLike {
  id: string;
  label: string;
  isActive: boolean;
  minNoticeHours: number;
  allowUrgent: boolean;
  urgentMultiplier: number;
}

interface ParsedMissionPayloadLike {
  missionCatalog: MissionCatalogItemLike[];
  missionProfile: {
    missions: MissionProfileMissionLike[];
  };
}

interface MissionZoneChangeLike {
  zones: Array<{
    placeId?: string | null;
    label?: string | null;
    lat?: number | null;
    lng?: number | null;
    postcode?: string | null;
  }>;
  radiusKm: number;
  rules: unknown;
}

type AvailabilityPayloadLike = Record<string, unknown>;

export function buildMissionProfileFromSelection(
  parsed: ParsedMissionPayloadLike,
  selected: string[],
  toMissionTypeId: (value: string) => string,
) {
  const normalizedSelected = selected.map((item) => item.trim().toLowerCase());
  const selectedIdSet = new Set<string>();

  selected.forEach((item) => {
    const byCatalogLabel = parsed.missionCatalog.find(
      (catalogItem) => catalogItem.label.trim().toLowerCase() === item.trim().toLowerCase(),
    );
    const byCatalogId = parsed.missionCatalog.find((catalogItem) => catalogItem.id === item);
    selectedIdSet.add(byCatalogLabel?.id ?? byCatalogId?.id ?? toMissionTypeId(item));
  });

  const hasMissionProfile = parsed.missionProfile.missions.length > 0;
  const baseMissions = hasMissionProfile
    ? parsed.missionProfile.missions
    : parsed.missionCatalog.map((catalogItem) => ({
        id: catalogItem.id,
        label: catalogItem.label,
        isActive: false,
        minNoticeHours: 24,
        allowUrgent: false,
        urgentMultiplier: 1.3,
      }));

  const existingMissionIds = new Set(baseMissions.map((mission) => mission.id));
  const missingSelectedMissions = selected
    .map((item) => {
      const byCatalogLabel = parsed.missionCatalog.find(
        (catalogItem) => catalogItem.label.trim().toLowerCase() === item.trim().toLowerCase(),
      );
      const byCatalogId = parsed.missionCatalog.find((catalogItem) => catalogItem.id === item);
      const id = byCatalogLabel?.id ?? byCatalogId?.id ?? toMissionTypeId(item);
      const label = byCatalogLabel?.label ?? byCatalogId?.label ?? item;

      if (existingMissionIds.has(id)) return null;
      existingMissionIds.add(id);

      return {
        id,
        label,
        isActive: true,
        minNoticeHours: 24,
        allowUrgent: false,
        urgentMultiplier: 1.3,
      };
    })
    .filter(Boolean) as MissionProfileMissionLike[];

  return {
    ...parsed.missionProfile,
    missions: [...baseMissions, ...missingSelectedMissions].map((mission) => ({
      ...mission,
      isActive:
        selectedIdSet.has(mission.id) ||
        normalizedSelected.includes(mission.label.trim().toLowerCase()),
    })),
  };
}

export function buildProfileZoneUpdate(
  previousProfile: {
    location?: string | null;
    service_area?: string | null;
    city?: string | null;
    availability_hours?: string | null;
  },
  data: MissionZoneChangeLike,
  parseAvailabilityPayloadRaw: (value: string | null | undefined) => AvailabilityPayloadLike,
) {
  const zoneLabel = normalizeAreaLabel(data.zones[0]?.label);
  const fallbackLocation = normalizeAreaLabel(previousProfile.location);
  const fallbackServiceArea = normalizeAreaLabel(previousProfile.service_area);
  const normalizedZone = zoneLabel ?? fallbackLocation ?? fallbackServiceArea ?? null;
  const normalizedZones = data.zones
    .filter(
      (zone) =>
        typeof zone.label === "string" &&
        zone.label.trim() &&
        typeof zone.lat === "number" &&
        Number.isFinite(zone.lat) &&
        typeof zone.lng === "number" &&
        Number.isFinite(zone.lng),
    )
    .slice(0, 1)
    .map((zone, index) => ({
      placeId: zone.placeId?.trim() || `zone-${index}-${zone.label!.trim()}`,
      label: zone.label!.trim(),
      lat: zone.lat as number,
      lng: zone.lng as number,
      postcode: zone.postcode?.trim() || null,
    }));

  return {
    ...previousProfile,
    location: normalizedZone,
    service_area: normalizedZone,
    city: normalizedZone,
    service_radius_km: data.radiusKm,
    availability_hours: JSON.stringify({
      ...parseAvailabilityPayloadRaw(previousProfile.availability_hours),
      zones: normalizedZones,
      rules: data.rules,
    }),
  };
}

export function buildProfileWeeklyAvailabilityUpdate(
  previousProfile: {
    availability_hours?: string | null;
  },
  schedule: MissionAvailability["schedule"],
  emergency24h: boolean,
  parseAvailabilityPayloadRaw: (value: string | null | undefined) => AvailabilityPayloadLike,
  normalizeMissionSchedule: (
    schedule: MissionAvailability["schedule"],
  ) => MissionAvailability["schedule"],
) {
  return {
    ...previousProfile,
    availability_hours: JSON.stringify({
      ...parseAvailabilityPayloadRaw(previousProfile.availability_hours),
      schedule: normalizeMissionSchedule(schedule),
      emergency24h,
    }),
    emergency_service: emergency24h,
  };
}
