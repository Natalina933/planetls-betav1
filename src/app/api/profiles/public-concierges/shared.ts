import { normalizeProfileLocationFields } from "../../../lib/profileLocation.ts";

type PublicConciergeRouteInput = {
  id: string;
  avatar_url?: string | null;
  image?: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  company_name: string | null;
  city: string | null;
  service_area: string | null;
  hourly_rate: number | null;
  monthly_rate: number | null;
  option: string | null;
  availability_hours: string | null;
  role: string | null;
  years_experience: number | null;
};

type ReviewRow = {
  reviewed_profile_id: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
};

const normalizeServiceKey = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const LEGACY_SERVICE_NOISE = new Set([
  "conciergerie complete menage",
  "accueil",
  "gestion",
  "cleaning",
  "welcome",
  "management",
  "checkin",
  "laundry",
]);

const SERVICE_LABEL_FIXES = new Map([
  ["menage", "Ménage"],
  ["grand menage", "Grand ménage"],
  ["desinfection complete", "Désinfection complète"],
  ["blanchisserie complete", "Blanchisserie complète"],
]);

const cleanServiceLabel = (value: unknown): string | null => {
  if (typeof value !== "string") return null;

  const cleaned = value
    .replace(/[[\]"]/g, "")
    .replace(/[()]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length === 0) return null;

  const key = normalizeServiceKey(cleaned);
  if (LEGACY_SERVICE_NOISE.has(key)) return null;

  return SERVICE_LABEL_FIXES.get(key) ?? cleaned;
};

const splitServices = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map(cleanServiceLabel).filter((item): item is string => Boolean(item));
    }
  } catch {
    // Legacy values are often stored as comma-separated or malformed JSON-like strings.
  }

  return value
    .split(/[;,|\n\r]+/g)
    .map(cleanServiceLabel)
    .filter((item): item is string => Boolean(item));
};

const readActiveMissionServices = (availabilityHours: string | null): string[] => {
  if (!availabilityHours) return [];

  try {
    const parsed = JSON.parse(availabilityHours) as Record<string, unknown>;
    const missionProfile = parsed?.missionProfile as
      | { missions?: Array<Record<string, unknown>> }
      | undefined;

    return (
      missionProfile?.missions
        ?.map((mission) =>
          mission?.isActive === true && typeof mission.label === "string"
            ? cleanServiceLabel(mission.label)
            : null,
        )
        .filter((item): item is string => Boolean(item)) ?? []
    );
  } catch {
    return [];
  }
};

export const parsePublicConciergeServices = (
  optionValue: string | null,
  availabilityHours: string | null,
): string[] => {
  const activeMissionServices = readActiveMissionServices(availabilityHours);
  if (activeMissionServices.length > 0) {
    return Array.from(new Set(activeMissionServices));
  }

  const values = new Set<string>();

  if (optionValue) {
    splitServices(optionValue).forEach((item) => values.add(item));
  }

  return Array.from(values);
};

export function buildPublicConciergeRecommendations(
  profiles: PublicConciergeRouteInput[],
  reviews: ReviewRow[],
) {
  const ratingsByProfile = new Map<string, number[]>();
  const latestReviewByProfile = new Map<
    string,
    { comment: string | null; created_at: string | null }
  >();

  reviews.forEach((review) => {
    if (typeof review.reviewed_profile_id !== "string") return;

    if (typeof review.rating === "number") {
      const current = ratingsByProfile.get(review.reviewed_profile_id) ?? [];
      current.push(review.rating);
      ratingsByProfile.set(review.reviewed_profile_id, current);
    }

    const existing = latestReviewByProfile.get(review.reviewed_profile_id);
    const currentTime = review.created_at ? new Date(review.created_at).getTime() : 0;
    const existingTime = existing?.created_at ? new Date(existing.created_at).getTime() : 0;
    if (!existing || currentTime >= existingTime) {
      latestReviewByProfile.set(review.reviewed_profile_id, {
        comment: review.comment ?? null,
        created_at: review.created_at ?? null,
      });
    }
  });

  return profiles
    .map((profile) => {
      const normalizedProfile = normalizeProfileLocationFields({
        city: profile.city,
        service_area: profile.service_area,
      });
      const ratings = ratingsByProfile.get(profile.id) ?? [];
      const averageRating =
        ratings.length > 0
          ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) /
            10
          : null;
      const latestReview = latestReviewByProfile.get(profile.id);

      return {
        id: profile.id,
        avatar_url: profile.avatar_url,
        image: profile.image,
        display_name:
          `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
          profile.company_name ||
          profile.username ||
          "Concierge",
        city: normalizedProfile.city,
        service_area: normalizedProfile.service_area,
        services: parsePublicConciergeServices(profile.option, profile.availability_hours),
        hourly_rate: profile.hourly_rate,
        monthly_rate: profile.monthly_rate,
        years_experience: profile.years_experience,
        is_pro: profile.role === "concierge_pro",
        average_rating: averageRating,
        reviews_count: ratings.length,
        latest_review_comment: latestReview?.comment ?? null,
      };
    })
    .sort((a, b) => {
      const ratingDelta = (b.average_rating ?? -1) - (a.average_rating ?? -1);
      if (ratingDelta !== 0) return ratingDelta;
      if (b.is_pro !== a.is_pro) return Number(b.is_pro) - Number(a.is_pro);
      return b.reviews_count - a.reviews_count;
    })
    .slice(0, 3);
}
