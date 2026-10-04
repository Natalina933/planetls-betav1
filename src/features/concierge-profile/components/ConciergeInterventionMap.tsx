"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { isSearchPoint, type SearchPoint } from "@/features/owner-concierges/lib/geography";
import type { PublicProfilePayload } from "./PublicConciergeProfilePage";
import styles from "./OwnerConciergeProfileView.module.scss";

const Map = dynamic(() => import("@/app/components/MapWithList/MapWithList"), { ssr: false });
const noSelection = () => {};

export function ConciergeInterventionMap({ profile }: { profile: PublicProfilePayload["profile"] }) {
  const zones = useMemo(() => (profile.intervention_zones || []).filter(isSearchPoint), [profile.intervention_zones]);
  const [cityPoint, setCityPoint] = useState<SearchPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<"unknown" | "unavailable" | null>(null);
  const { data: session } = useSession();
  const profileHref = "/dashboard/concierge/profile?tab=fiche#Adresse_professionnelle";
  const canEdit = session?.user?.id === profile.id;
  useEffect(() => {
    setCityPoint(null);
    setLocationError(null);
    if (zones.length || !profile.city) return;
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/geocode?q=${encodeURIComponent([profile.city, profile.country].filter(Boolean).join(", "))}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) { if (!controller.signal.aborted) setLocationError(response.status === 404 ? "unknown" : "unavailable"); return null; }
        return response.json();
      })
      .then((point: unknown) => { if (!controller.signal.aborted && isSearchPoint(point)) setCityPoint(point); })
      .catch(() => { if (!controller.signal.aborted) setLocationError("unavailable"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [zones, profile.city, profile.country]);
  const points = useMemo(() => zones.length ? zones : cityPoint ? [cityPoint] : [], [zones, cityPoint]);
  const profiles = useMemo(() => points.map((point, index) => ({ ...point, id: `${profile.id}-${index}`, name: profile.company_name || profile.display_name, city: zones.length ? "Zone d’intervention déclarée" : profile.city || "", type: "concierge" as const })), [points, profile.id, profile.company_name, profile.display_name, profile.city, zones.length]);
  if (!points.length) return <div className={styles.locationNotice} role="status">
    {loading ? <span>Chargement de la carte…</span> : <>
      <p><span className={styles.redLight} aria-hidden="true" />{locationError === "unknown" ? "Ville non reconnue" : !profile.city ? "Ville non renseignée" : "Localisation momentanément indisponible"}</p>
      {canEdit && locationError !== "unavailable" && <Link className={styles.locationButton} href={profileHref}>Mettre à jour mon profil</Link>}
    </>}
  </div>;
  const radius = typeof profile.service_radius_km === "number" && Number.isFinite(profile.service_radius_km) && profile.service_radius_km > 0 ? profile.service_radius_km : 0;
  return <div><div className={styles.miniMap}><Map profiles={profiles} center={points[0]} radiusKm={radius} selectedId={null} onSelect={noSelection} fitAllProfiles ariaLabel="Carte de la zone d’intervention" /></div>
    <p className={styles.mapCaption}>{zones.length ? "Zones déclarées par ce professionnel." : "Repère approximatif centré sur la ville renseignée."}{radius > 0 ? ` Cercles : rayon déclaré de ${radius} km.` : " Rayon non renseigné."}</p></div>;
}
