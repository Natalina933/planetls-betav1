export type OwnerMissionStatus =
  | "a_faire"
  | "en_cours"
  | "en_attente_validation"
  | "en_retard"
  | "termine";

export type OwnerMissionType = "menage" | "maintenance" | "checkin" | "checkout" | "autre";

export type OwnerMissionListItem = {
  id: string;
  propertyName: string;
  propertyId?: string | number;
  city?: string;
  type: OwnerMissionType;
  date: string;
  timeSlot?: string;
  status: OwnerMissionStatus;
  assignedTo?: string;
};

export type OwnerMissionStatusFilter = "tous" | OwnerMissionStatus;
export type OwnerMissionPeriodFilter = "semaine" | "mois" | "toutes";

export type OwnerMissionsFiltersValue = {
  status: OwnerMissionStatusFilter;
  property: string;
  period: OwnerMissionPeriodFilter;
};
