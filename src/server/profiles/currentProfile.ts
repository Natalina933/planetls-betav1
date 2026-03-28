import { db } from "@/app/lib/dbServer";

export const CURRENT_PROFILE_SELECT = `
  id,
  created_at,
  updated_at,
  username,
  first_name,
  last_name,
  email,
  phone,
  avatar_url,
  additional_info,
  category,
  location,
  option,
  search_target,
  role,
  status,
  avatar_scale,
  avatar_offset_x,
  avatar_offset_y,
  avatar_rotation,
  avatar_width,
  avatar_height,
  company_name,
  legal_form,
  siret,
  siren,
  vat_number,
  street_address,
  postal_code,
  city,
  country,
  website,
  linkedin,
  facebook,
  instagram,
  insurance_number,
  insurance_company,
  service_area,
  service_radius_km,
  hourly_rate,
  monthly_rate,
  availability_hours,
  emergency_service,
  certifications,
  years_experience,
  travel_fee,
  experience_level,
  iban,
  bic,
  certification_level,
  certification_date,
  certification_expires_at,
  certification_metadata,
  onboarding_complete,
  onboarding_completed_at
`;

export async function fetchCurrentProfile(userId: string) {
  return db
    .from("profiles")
    .select(CURRENT_PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();
}
