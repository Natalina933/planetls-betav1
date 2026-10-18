export type ProfessionalSearchType = "all" | "concierge" | "provider";

export type ProfessionalSearchRow = {
  id: string;
  professional_type: "concierge" | "provider";
  role: string;

  avatar_url?: string | null;
  image?: string | null;
  display_name: string;

  city: string | null;
  postal_code?: string | null;
  location?: string | null;
  country: string | null;
  service_area: string | null;
  service_radius_km: number | null;

  latitude?: number | null;
  longitude?: number | null;

  services: string[];
  category?: string | null;

  hourly_rate: number | null;
  monthly_rate: number | null;
  experience_level: string | null;
  years_experience: number | null;

  property_types?: string[];
  is_pro: boolean;
  is_available_now?: boolean;

  average_rating: number | null;
  reviews_count: number;
  latest_review_comment: string | null;
  latest_review_at: string | null;
};

export type ProfessionalSearchPayload = {
  items: ProfessionalSearchRow[];

  center?: {
    latitude: number;
    longitude: number;
  } | null;

  warning?: string | null;

  available_filters?: {
    categories?: string[];
    services?: string[];
    property_types?: string[];
  };
};
