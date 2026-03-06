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
  zones: Array<{ label?: string | null }>;
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
    availability_hours?: string | null;
  },
  data: MissionZoneChangeLike,
  parseAvailabilityPayloadRaw: (value: string | null | undefined) => AvailabilityPayloadLike,
) {
  const zoneLabel = data.zones[0]?.label?.trim()
    ? data.zones[0].label.trim()
    : previousProfile.location ?? previousProfile.service_area ?? null;

  return {
    ...previousProfile,
    location: zoneLabel,
    service_area: zoneLabel,
    service_radius_km: data.radiusKm,
    availability_hours: JSON.stringify({
      ...parseAvailabilityPayloadRaw(previousProfile.availability_hours),
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
    }),
    emergency_service: emergency24h,
  };
}
import type { MissionAvailability } from "@/app/components/missions/types";
