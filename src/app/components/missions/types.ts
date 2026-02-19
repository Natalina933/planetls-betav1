// src/app/components/missions/types.ts

export type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface MissionPriorityFlags {
  urgent: boolean;
  recurrent: boolean;
  premium: boolean;
}

export interface MissionCatalogItem {
  id: string;
  label: string;
  basePrice?: number | null;
  customizable?: boolean;
}

export interface MissionPreferences {
  acceptedMissionTypeIds: string[];
  priorityFlags: MissionPriorityFlags;
}

export type ConciergePositioning =
  | "standard"
  | "premium"
  | "urgent_24_7"
  | "checkin_specialist"
  | "full_service";

export interface MissionConfig {
  id: string;
  label: string;
  isActive: boolean;
  minNoticeHours: number;
  allowUrgent: boolean;
  urgentMultiplier: number;
}

export interface MissionSpecialConditions {
  acceptNightInterventions: boolean;
  acceptWeekendInterventions: boolean;
  acceptHighSeasonInterventions: boolean;
  highSeasonMultiplier: number;
  geographicNotes: string;
}

export interface ConciergeMissionProfile {
  positioning: ConciergePositioning;
  missions: MissionConfig[];
  specialConditions: MissionSpecialConditions;
}

export interface MissionAvailability {
  zones: {
    placeId: string;
    label: string;
    lat: number;
    lng: number;
  }[];

  radiusKm: number;

  schedule: {
    day: WeekDay;
    ranges: {
      start: string; // "09:00"
      end: string; // "12:00"
    }[];
  }[];

  emergency24h: boolean;

  rules: {
    refuseOutOfZone: boolean;
    refuseOutOfSchedule: boolean;
    autoAcceptEmergency: boolean;
  };
}
