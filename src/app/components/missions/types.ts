// src/app/components/missions/types.ts

export type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

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
