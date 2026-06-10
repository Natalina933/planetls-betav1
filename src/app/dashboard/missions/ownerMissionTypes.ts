export type OwnerMissionKpi = {
  id: string;
  label: string;
  value: number;
  helperText?: string;
  tone?: "neutral" | "warning" | "positive";
};

export type OwnerMissionStatus =
  | "a_faire"
  | "en_cours"
  | "en_attente_validation"
  | "en_retard"
  | "termine";

export type OwnerMissionItem = {
  id: string;
  propertyName: string;
  propertyCode?: string;
  city?: string;
  type: "menage" | "maintenance" | "checkin" | "checkout" | "autre";
  date: string;
  timeSlot?: string;
  status: OwnerMissionStatus;
  assignedTo?: string;
  isCriticalForNextStay?: boolean;
  notes?: string;
};
