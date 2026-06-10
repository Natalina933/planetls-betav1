export type OwnerPlanningKpi = {
  id: string;
  label: string;
  value: number;
  helperText?: string;
  tone?: "neutral" | "warning" | "positive";
};

export type OwnerPlanningItem = {
  id: string;
  date: string;
  propertyName: string;
  propertyCode?: string;
  city?: string;
  type: "menage" | "maintenance" | "checkin" | "checkout" | "autre";
  status: "a_faire" | "urgent" | "en_attente_validation" | "confirme" | "pret_voyageurs";
  assignedTo?: string;
  notes?: string;
  amount?: number | null;
};
