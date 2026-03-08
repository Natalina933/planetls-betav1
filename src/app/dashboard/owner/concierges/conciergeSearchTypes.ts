"use client";

export type ConciergeSearchRow = {
  id: string;
  avatar_url?: string | null;
  display_name: string;
  city: string | null;
  postal_code?: string | null;
  location?: string | null;
  country: string | null;
  service_area: string | null;
  service_radius_km: number | null;
  hourly_rate: number | null;
  monthly_rate: number | null;
  experience_level: string | null;
  years_experience: number | null;
  services: string[];
  property_types?: string[];
  is_pro: boolean;
  is_available_now?: boolean;
  average_rating: number | null;
  reviews_count: number;
  latest_review_comment: string | null;
  latest_review_at: string | null;
};

export type ConciergeSearchPayload = {
  items: ConciergeSearchRow[];
  available_filters?: {
    categories?: string[];
    services?: string[];
    property_types?: string[];
  };
};

export type SortMode = "available" | "rating" | "pro";
export type ViewMode = "cards" | "list";

export type ServerOptions = {
  categories: string[];
  services: string[];
  propertyTypes: string[];
};

export type ServiceCatalogItem = {
  id: number;
  category: string;
  service: string;
  description?: string | null;
};
