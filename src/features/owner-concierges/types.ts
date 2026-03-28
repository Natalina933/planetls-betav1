export type RequestType = "ponctuel" | "renfort" | "durable";

export type RequestFormState = {
  requestType: RequestType;
  title: string;
  description: string;
  city: string;
  postalCode: string;
  desiredDate: string;
  budgetMax: string;
  urgency: boolean;
};
