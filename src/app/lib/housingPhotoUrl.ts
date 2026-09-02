const HOUSING_PHOTOS_BUCKET = "housing-photos";

export function getHousingPhotoStoragePath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed, "https://planetls.local");
    const proxiedPath = url.searchParams.get("path");
    if (url.pathname === "/api/housing/photos" && proxiedPath) return proxiedPath;

    const marker = `/storage/v1/object/public/${HOUSING_PHOTOS_BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex >= 0) return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    // Current uploads store their raw Storage path.
  }

  return /^[A-Za-z0-9_-]+\/(?:draft|[1-9][0-9]*)\/[A-Za-z0-9_.-]+$/.test(trimmed) ? trimmed : null;
}

export function toHousingPhotoUrl(value: string, housingId: string | number) {
  const path = getHousingPhotoStoragePath(value);
  if (!path) return value;

  const params = new URLSearchParams({ housingId: String(housingId), path });
  return `/api/housing/photos?${params.toString()}`;
}

export async function removeHousingPhoto(value: string, housingId: string | number) {
  const path = getHousingPhotoStoragePath(value);
  if (!path) return;

  const params = new URLSearchParams({ housingId: String(housingId), path });
  const response = await fetch(`/api/housing/photos?${params.toString()}`, { method: "DELETE" });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(typeof payload?.error === "string" ? payload.error : "Suppression de la photo impossible.");
  }
}
