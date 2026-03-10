"use client";

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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

interface Profile {
  id: string;
  name: string;
  type: "concierge";
  city: string;
  latitude: number;
  longitude: number;
  services?: string[];
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

export default function MapWithList() {
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

  const center: LatLngExpression =
    visibleProfiles.length > 0
      ? [visibleProfiles[0].latitude, visibleProfiles[0].longitude]
      : [48.85, 2.35];

  return (
    <>
      <ToastContainer />

      <div className={styles.container}>
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
