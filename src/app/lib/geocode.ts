// src/lib/geocode.ts
export async function geocodeLocation(location: string): Promise<{ latitude: number; longitude: number } | null> {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(location)}`);
    if (!res.ok) return null;

    const data = await res.json();
    return {
        latitude: data.latitude,
        longitude: data.longitude,
    };
}
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
