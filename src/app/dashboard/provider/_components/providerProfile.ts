export interface ProviderCurrentProfile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  email?: string | null;
  company_name?: string | null;
  city?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  website?: string | null;
  availability_hours?: string | null;
  service_radius_km?: number | null;
  service_area?: string | null;
  role?: string | null;
  category?: string | null;
}

export interface ProviderWorkspacePayload {
  profile: ProviderCurrentProfile;
  summary: {
    display_name: string;
    location: string | null;
    is_pro: boolean;
  };
}

export async function fetchCurrentProviderProfile(): Promise<ProviderWorkspacePayload> {
  const response = await fetch("/api/provider/workspace", { cache: "no-store" });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || "Impossible de charger l'espace artisan.");
  }

  return payload as ProviderWorkspacePayload;
}

export function buildProviderDisplayName(profile: ProviderCurrentProfile | null): string {
  if (!profile) return "Artisan";

  const fullName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
  return fullName || profile.company_name || profile.username || "Artisan";
}
