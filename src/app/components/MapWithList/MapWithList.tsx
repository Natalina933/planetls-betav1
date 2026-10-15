"use client";

import "leaflet/dist/leaflet.css";
import { conciergeProfileHref } from "@/features/owner-concierges/lib/searchNavigation";
import { groupProfilesAtCoordinates, isSearchPoint, searchRadiusMeters } from "@/features/owner-concierges/lib/geography";
import { ConciergeServices } from "@/features/owner-concierges/components/ConciergeServices";
import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { ToastContainer, toast } from "react-toastify";

import { MapContainer, Marker, Popup, TileLayer, Circle, useMap } from "react-leaflet";

import L, { LatLngExpression } from "leaflet";
import { useSearchParams } from "next/navigation";
import { Loader } from "@/components/ui";

import ProfilesDisplay from "../layout/Home/ProfilesDisplay/ProfilesDisplay";
import styles from "./MapWithList.module.scss";

delete (L.Icon.Default.prototype as unknown as {
  _getIconUrl?: () => string;
})._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export interface Profile {
  id: string;
  name: string;
  type: "concierge";
  city: string;
  latitude: number;
  longitude: number;
  services?: string[];
}

export type SearchMapProps = {
  profiles: Profile[];
  center: { latitude: number; longitude: number };
  radiusKm: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  fitAllProfiles?: boolean;
  profileReturnTo?: string;
  ariaLabel?: string;
};

function SearchMapViewport({ center, radiusKm, selectedId, profiles, fitAllProfiles }: SearchMapProps) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLng(center.latitude, center.longitude).toBounds(searchRadiusMeters(radiusKm) * 2);
    if (fitAllProfiles) profiles.forEach((profile) => bounds.extend(L.latLng(profile.latitude, profile.longitude)));
    map.fitBounds(bounds, { animate: false });
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, center.latitude, center.longitude, radiusKm, fitAllProfiles, profiles]);
  useEffect(() => {
    const selected = profiles.find((profile) => profile.id === selectedId);
    if (selected) map.panTo([selected.latitude, selected.longitude]);
  }, [map, selectedId, profiles]);
  return null;
}

function ConciergeSearchMap(props: SearchMapProps) {
  const profiles = useMemo(() => props.profiles.filter(isSearchPoint), [props.profiles]);
  const groups = groupProfilesAtCoordinates(profiles);
  if (!isSearchPoint(props.center)) return <p>Centre de recherche indisponible.</p>;
  return <MapContainer center={[props.center.latitude, props.center.longitude]} zoom={11}
    style={{ height: "100%", width: "100%" }} aria-label={props.ariaLabel || "Carte des concierges"}>
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
    <SearchMapViewport {...props} profiles={profiles} />
    <Circle center={[props.center.latitude, props.center.longitude]} radius={searchRadiusMeters(props.radiusKm)}
      pathOptions={{ color: "var(--ds-color-accent)", weight: 1, fillOpacity: 0.05 }} />
    {groups.map((group, index) => {
      const consulted = group.profiles.some((profile) => profile.id === props.selectedId);
      return <Marker key={group.key} position={[group.latitude, group.longitude]}
        title={group.profiles.length > 1 ? group.profiles.length + " professionnels" : group.profiles[0].name}
        icon={L.divIcon({ className: "", html: '<span style="display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:var(--ds-color-primary);color:var(--ds-color-text-inverse);border:3px solid '+(consulted ? 'var(--ds-color-gold)' : 'var(--ds-color-surface)')+'">'+(group.profiles.length > 1 ? group.profiles.length : index + 1)+'</span>', iconSize: [36, 36], iconAnchor: [18, 18] })}
        zIndexOffset={consulted ? 1000 : 0}
        eventHandlers={{ click: () => { if (group.profiles.length === 1) props.onSelect(group.profiles[0].id); } }}>
        <Popup maxHeight={300} minWidth={240}>
          {group.profiles.length > 1 ? <strong>{group.profiles.length} professionnels à cet emplacement</strong> : null}
          <ul>{group.profiles.map((profile) => <li key={profile.id}>
            <button type="button" aria-pressed={props.selectedId === profile.id} onClick={() => props.onSelect(profile.id)}>Consulter {profile.name}</button>
            {props.selectedId === profile.id || group.profiles.length === 1 ? <div>
              <p>{profile.city}</p>
              <ConciergeServices values={profile.services ?? []} />
              <a href={conciergeProfileHref(profile.id, props.profileReturnTo)}>Voir le profil</a>
            </div> : null}
          </li>)}</ul>
        </Popup>
      </Marker>;
    })}
  </MapContainer>;
}

const fetcher = async (url: string): Promise<Profile[]> => {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Erreur serveur : ${response.status}`);
  }

  const payload = (await response.json()) as {
    items?: Array<{
      id: string;
      display_name: string;
      city: string | null;
      service_area: string | null;
      services?: string[];
    }>;
  };

  const items = Array.isArray(payload.items) ? payload.items : [];
  const cityCoords = new Map<string, { latitude: number; longitude: number }>();

  await Promise.all(
    Array.from(
      new Set(
        items
          .map((item) => (item.city || item.service_area || "").trim())
          .filter(Boolean),
      ),
    ).map(async (city) => {
      try {
        const geocodeResponse = await fetch(`/api/geocode?q=${encodeURIComponent(city)}`, {
          cache: "no-store",
        });
        if (!geocodeResponse.ok) return;

        const geocodePayload = (await geocodeResponse.json()) as {
          latitude?: number;
          longitude?: number;
        };

        if (
          typeof geocodePayload.latitude === "number" &&
          typeof geocodePayload.longitude === "number"
        ) {
          cityCoords.set(city, {
            latitude: geocodePayload.latitude,
            longitude: geocodePayload.longitude,
          });
        }
      } catch {
        // Keep loading list data even when geocoding fails.
      }
    }),
  );

  const mappedProfiles: Profile[] = [];

  items.forEach((item) => {
    const city = (item.city || item.service_area || "").trim();
    const coords = cityCoords.get(city);
    if (!coords) return;

    mappedProfiles.push({
      id: item.id,
      name: item.display_name || "Concierge",
      type: "concierge",
      city,
      latitude: coords.latitude,
      longitude: coords.longitude,
      services: Array.isArray(item.services) ? item.services : [],
    });
  });

  return mappedProfiles;
};

export default function MapWithList(props: SearchMapProps | Record<string, never>) {
  if ("profiles" in props) return <ConciergeSearchMap {...props as SearchMapProps} />;
  return <PublicMapWithList />;
}

function PublicMapWithList() {
  const searchParams = useSearchParams();

  const filter = searchParams.get("filter") ?? "concierge";
  const location = (searchParams.get("location") ?? "").trim().toLowerCase();

  const { data: profiles, error } = useSWR<Profile[]>(
    "/api/profiles/public-concierges",
    fetcher,
  );

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  if (!profiles) {
    return (
      <>
        <ToastContainer />
        <Loader showText text="Chargement des profils..." />
      </>
    );
  }

  const visibleProfiles = profiles.filter((profile) => {
    if (filter !== "all" && filter !== "concierge") return false;
    if (!location) return true;
    return (
      profile.city.toLowerCase().includes(location) ||
      profile.name.toLowerCase().includes(location)
    );
  });

  const isConciergeOnly = filter === "concierge";

  const center: LatLngExpression =
    visibleProfiles.length > 0
      ? [visibleProfiles[0].latitude, visibleProfiles[0].longitude]
      : [48.85, 2.35];

  return (
    <>
      <ToastContainer />

      <div className={styles.container}>
        {!isConciergeOnly ? (
          <div className={styles.list}>
            <ProfilesDisplay
              visibleProfiles={visibleProfiles.map((profile) => ({
                id: profile.id,
                name: profile.name,
                type: profile.type,
                services: profile.services,
                available: true,
              }))}
              onHover={(id: string) => setHoveredId(id)}
              onLeave={() => setHoveredId(null)}
            />
          </div>
        ) : null}

        <div className={styles.map}>
          <MapContainer
            center={center}
            zoom={11}
            className={styles.mapCanvas}
            aria-label="Carte des profils"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            {visibleProfiles.map((profile) => {
              const position: LatLngExpression = [profile.latitude, profile.longitude];

              return (
                <Marker
                  key={profile.id}
                  position={position}
                  opacity={hoveredId === profile.id ? 1 : 0.6}
                >
                  <Popup>
                    <strong>{profile.name}</strong>
                    <br />
                    {profile.type}
                    <br />
                    {profile.city}
                    <br />
                    {profile.services?.length
                      ? profile.services.join(", ")
                      : "Services non renseignes"}
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </>
  );
}
