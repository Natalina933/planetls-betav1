import type { Json } from "@/types/supabase";

export type UrgentMissionType = "check-in" | "check-out";
export type UrgentMissionStatus = "open" | "accepted" | "completed" | "cancelled";
export type UrgentMissionPaymentStatus =
  | "pending"
  | "authorized"
  | "paid"
  | "released"
  | "cancelled";

export interface UrgentMissionFormInput {
  mission_type: string;
  scheduled_at: string;
  property_address: string;
  traveler_count?: number | null;
  spoken_language?: string | null;
  special_instructions?: string | null;
  key_handover_type?: string | null;
  contact_phone: string;
  contact_email?: string | null;
}

export interface ConciergeMatchCandidate {
  concierge_id: string;
  display_name: string;
  city: string | null;
  service_area: string | null;
  average_rating: number | null;
  reviews_count: number;
  response_time_avg: number;
  max_radius_km: number;
  distance_km: number;
  estimated_intervention_minutes: number;
  estimated_price: number | null;
  is_available_now: boolean;
  score: number;
}

export type ReviewRow = {
  reviewed_profile_id: string | null;
  rating: number | null;
};

export type ConciergeProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  company_name: string | null;
  city: string | null;
  country: string | null;
  service_area: string | null;
  service_radius_km: number | null;
  hourly_rate: number | null;
  emergency_service: boolean | null;
  is_available_for_urgent: boolean | null;
  max_radius_km: number | null;
  response_time_avg: number | null;
  availability_hours: string | null;
  role: string | null;
};

export function normalizeUrgentMissionType(value: string): UrgentMissionType {
  return value === "check-out" ? "check-out" : "check-in";
}

export function normalizeUrgentMissionStatus(value: string): UrgentMissionStatus {
  if (value === "accepted" || value === "completed" || value === "cancelled") {
    return value;
  }
  return "open";
}

export function normalizeUrgentMissionPaymentStatus(value: string): UrgentMissionPaymentStatus {
  if (
    value === "authorized" ||
    value === "paid" ||
    value === "released" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "pending";
}

export function deriveUrgentMissionTitle(type: UrgentMissionType, address: string) {
  return `${type === "check-in" ? "Check-in" : "Check-out"} urgent - ${extractMissionArea(address)}`;
}

export function extractMissionArea(address: string) {
  const segments = address
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) return "Adresse non renseignee";
  return segments.length >= 2 ? segments[segments.length - 2] : segments[0];
}

export function buildConciergeDisplayName(profile: Pick<
  ConciergeProfileRow,
  "first_name" | "last_name" | "username" | "company_name"
>) {
  const name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
  return name || profile.company_name || profile.username || "Concierge";
}

export function buildReviewSummary(reviews: ReviewRow[]) {
  const byProfile = new Map<string, { count: number; sum: number }>();

  for (const review of reviews) {
    if (!review.reviewed_profile_id || typeof review.rating !== "number") continue;
    const current = byProfile.get(review.reviewed_profile_id) ?? { count: 0, sum: 0 };
    current.count += 1;
    current.sum += review.rating;
    byProfile.set(review.reviewed_profile_id, current);
  }

  return byProfile;
}

function profileSupportsUrgent(profile: ConciergeProfileRow) {
  return profile.is_available_for_urgent === true || profile.emergency_service === true;
}

function hasImmediateAvailability(profile: ConciergeProfileRow) {
  if (profileSupportsUrgent(profile)) return true;

  if (!profile.availability_hours) return false;
  try {
    const parsed = JSON.parse(profile.availability_hours) as {
      emergency24h?: boolean;
      rules?: { autoAcceptEmergency?: boolean };
    };
    return parsed.emergency24h === true || parsed.rules?.autoAcceptEmergency === true;
  } catch {
    return false;
  }
}

function estimateDistanceKm(address: string, profile: ConciergeProfileRow) {
  const normalizedAddress = address.trim().toLowerCase();
  const city = (profile.city ?? "").trim().toLowerCase();
  const serviceArea = (profile.service_area ?? "").trim().toLowerCase();
  const radius = profile.max_radius_km ?? profile.service_radius_km ?? 20;

  if (city && normalizedAddress.includes(city)) return Math.min(4, radius);
  if (serviceArea && normalizedAddress.includes(serviceArea)) return Math.min(8, radius);
  if (city && serviceArea && city === serviceArea) return Math.min(12, radius);
  return Math.min(Math.max(radius * 0.65, 10), radius + 15);
}

function estimateResponseMinutes(profile: ConciergeProfileRow, distanceKm: number) {
  const response = profile.response_time_avg ?? 18;
  const drive = Math.max(12, Math.round(distanceKm * 3.2));
  return response + drive;
}

function estimatePrice(profile: ConciergeProfileRow, type: UrgentMissionType) {
  if (typeof profile.hourly_rate !== "number") return null;
  const base = type === "check-in" ? profile.hourly_rate * 1.15 : profile.hourly_rate * 1.05;
  const urgent = profileSupportsUrgent(profile) ? 1.2 : 1.1;
  return Math.round(base * urgent);
}

function buildScore(input: {
  distanceKm: number;
  responseTimeAvg: number;
  averageRating: number | null;
  reviewsCount: number;
  isAvailableNow: boolean;
}) {
  const availabilityScore = input.isAvailableNow ? 40 : 8;
  const distanceScore = Math.max(0, 30 - input.distanceKm);
  const responseScore = Math.max(0, 22 - input.responseTimeAvg / 4);
  const ratingScore = (input.averageRating ?? 4) * 6;
  const proofScore = Math.min(12, input.reviewsCount);
  return Number(
    (availabilityScore + distanceScore + responseScore + ratingScore + proofScore).toFixed(2),
  );
}

export function buildUrgentMissionMatches(args: {
  address: string;
  missionType: UrgentMissionType;
  profiles: ConciergeProfileRow[];
  reviews: ReviewRow[];
}) {
  const reviewSummary = buildReviewSummary(args.reviews);

  return args.profiles
    .filter((profile) => {
      const role = (profile.role ?? "").toLowerCase();
      return role === "concierge" || role === "concierge_pro";
    })
    .map((profile) => {
      const summary = reviewSummary.get(profile.id);
      const averageRating =
        summary && summary.count > 0 ? Number((summary.sum / summary.count).toFixed(1)) : null;
      const reviewsCount = summary?.count ?? 0;
      const distanceKm = estimateDistanceKm(args.address, profile);
      const maxRadiusKm = profile.max_radius_km ?? profile.service_radius_km ?? 20;
      const responseTimeAvg = profile.response_time_avg ?? 18;
      const isAvailableNow = hasImmediateAvailability(profile);
      const estimatedInterventionMinutes = estimateResponseMinutes(profile, distanceKm);
      const estimatedPrice = estimatePrice(profile, args.missionType);
      const score = buildScore({
        distanceKm,
        responseTimeAvg,
        averageRating,
        reviewsCount,
        isAvailableNow,
      });

      return {
        concierge_id: profile.id,
        display_name: buildConciergeDisplayName(profile),
        city: profile.city,
        service_area: profile.service_area,
        average_rating: averageRating,
        reviews_count: reviewsCount,
        response_time_avg: responseTimeAvg,
        max_radius_km: maxRadiusKm,
        distance_km: distanceKm,
        estimated_intervention_minutes: estimatedInterventionMinutes,
        estimated_price: estimatedPrice,
        is_available_now: isAvailableNow,
        score,
      } satisfies ConciergeMatchCandidate;
    })
    .filter((candidate) => candidate.distance_km <= candidate.max_radius_km + 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

export function sanitizeUrgentMissionPayload(input: UrgentMissionFormInput) {
  const missionType = normalizeUrgentMissionType(input.mission_type);
  const scheduledAt = new Date(input.scheduled_at);

  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Date de mission invalide.");
  }

  const propertyAddress = input.property_address.trim();
  if (!propertyAddress) {
    throw new Error("L'adresse du logement est requise.");
  }

  const contactPhone = input.contact_phone.trim();
  if (!contactPhone) {
    throw new Error("Le telephone est requis.");
  }

  return {
    mission_type: missionType,
    scheduled_at: scheduledAt.toISOString(),
    property_address: propertyAddress,
    traveler_count:
      typeof input.traveler_count === "number" && Number.isFinite(input.traveler_count)
        ? input.traveler_count
        : null,
    spoken_language: input.spoken_language?.trim() || null,
    special_instructions: input.special_instructions?.trim() || null,
    key_handover_type: input.key_handover_type?.trim() || null,
    contact_phone: contactPhone,
    contact_email: input.contact_email?.trim() || null,
  };
}

export function buildUrgentMissionMetadata(args: {
  matches: ConciergeMatchCandidate[];
  ownerAuthenticated: boolean;
}) {
  return {
    broadcast_mode: "simultaneous",
    owner_authenticated: args.ownerAuthenticated,
    notifications: {
      push: "pending",
      email: "pending",
      dashboard: "pending",
    },
    broadcast_targets: args.matches.map((candidate) => ({
      concierge_id: candidate.concierge_id,
      score: candidate.score,
      response_time_avg: candidate.response_time_avg,
      estimated_intervention_minutes: candidate.estimated_intervention_minutes,
      estimated_price: candidate.estimated_price,
    })),
  } satisfies Json;
}

export function formatMissionWhen(value: string | null) {
  if (!value) return "Date non renseignee";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
