import type {
  OwnerCollaborationType,
  OwnerRequestFrequency,
  OwnerRequestGoal,
  OwnerResponsibilityLevel,
} from "@/app/lib/serviceRequestBrief";

export type RequestType = "ponctuel" | "renfort" | "durable";

export type RequestFormState = {
  requestType: RequestType;
  ownerGoal: OwnerRequestGoal;
  collaborationType: OwnerCollaborationType;
  frequency: OwnerRequestFrequency;
  estimatedDuration: string;
  responsibilityLevel: OwnerResponsibilityLevel;
  title: string;
  description: string;
  housingId: string;
  propertyName: string;
  propertyAddress: string;
  propertyType: string;
  sleepingCapacity: string;
  propertyConstraints: string;
  city: string;
  postalCode: string;
  desiredDate: string;
  budgetMax: string;
  currency: string;
  urgency: boolean;
};
