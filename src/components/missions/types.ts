// src/app/components/missions/types.ts

export type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

// Format HH:MM (TypeScript only, validation runtime toujours nécessaire)
export type TimeHHMM = `${number}${number}:${number}${number}`;

export interface MissionPriorityFlags {
  urgent: boolean;
  recurrent: boolean;
  premium: boolean;
}

export interface MissionCatalogItem {
  id: string;
  label: string;
  // garde la compatibilité avec ton code existant
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
  minNoticeHours: number; // 0..168 recommandé
  allowUrgent: boolean;
  urgentMultiplier: number; // 1..3 recommandé
}

export interface MissionSpecialConditions {
  acceptNightInterventions: boolean;
  acceptWeekendInterventions: boolean;
  acceptHighSeasonInterventions: boolean;
  highSeasonMultiplier: number; // 1..3 recommandé
  geographicNotes: string;
}

export interface ConciergeMissionProfile {
  positioning: ConciergePositioning;
  missions: MissionConfig[];
  specialConditions: MissionSpecialConditions;
}

/** Zone géographique (point + rayon appliqué côté availability) */
export interface MissionZone {
  placeId: string;
  label: string;
  lat: number;
  lng: number;
}

/** Plage horaire */
export interface MissionTimeRange {
  start: TimeHHMM; // ex: "09:00"
  end: TimeHHMM;   // ex: "18:00"
}

/** Horaires par jour */
export interface MissionDaySchedule {
  day: WeekDay;
  ranges: MissionTimeRange[];
}

export interface MissionRules {
  refuseOutOfZone: boolean;
  refuseOutOfSchedule: boolean;
  autoAcceptEmergency: boolean;
}

export interface MissionAvailability {
  zones: MissionZone[];
  radiusKm: number;
  schedule: MissionDaySchedule[];
  emergency24h: boolean;
  rules: MissionRules;
}