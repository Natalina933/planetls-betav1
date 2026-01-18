"use client";

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L, { LatLngExpression } from "leaflet";
import { useSearchParams } from "next/navigation";

import ProfilesDisplay from "../layout/Home/ProfilesDisplay/ProfilesDisplay";
import Loader from "../common/Loader/Loader";
import styles from "./MapWithList.module.scss";

/* ----------------------------- */
/* Fix icônes Leaflet (Next.js)  */
/* ----------------------------- */

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

/* ----------------------------- */
/* Types                         */
/* ----------------------------- */

interface Profile {
  id: number;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  services?: string[];
}

/* ----------------------------- */
/* Fetcher SWR                   */
/* ----------------------------- */

const fetcher = async (url: string): Promise<Profile[]> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Erreur serveur : ${response.status}`);
  }

  const text = await response.text();

  if (!text.trim()) {
    throw new Error("Réponse vide du serveur");
  }

  return JSON.parse(text) as Profile[];
};

/* ----------------------------- */
/* Composant                     */
/* ----------------------------- */

export default function MapWithList() {
  const searchParams = useSearchParams();

  const filter = searchParams.get("filter") ?? "proprietaire";
  const location = searchParams.get("location") ?? "";

  const { data: profiles, error } = useSWR<Profile[]>(
    `/api/profiles?category=${filter}&location=${location}`,
    fetcher
  );

  const [hoveredId, setHoveredId] = useState<number | null>(null);

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

  const center: LatLngExpression = [48.85, 2.35];

  return (
    <>
      <ToastContainer />

      <div className={styles.container}>
        {/* Liste */}
        <div className={styles.list}>
          <ProfilesDisplay
            visibleProfiles={profiles}
            onHover={(id: number) => setHoveredId(id)}
            onLeave={() => setHoveredId(null)}
          />
        </div>

        {/* Carte */}
        <div className={styles.map}>
          <MapContainer
            center={center}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            aria-label="Carte des profils"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            {profiles.map((profile) => {
              const position: LatLngExpression = [
                profile.latitude,
                profile.longitude,
              ];

              return (
                <Marker
                  key={profile.id}
                  position={position}
                  opacity={hoveredId === profile.id ? 1 : 0.5}
                >
                  <Popup>
                    <strong>{profile.name}</strong>
                    <br />
                    {profile.type}
                    <br />
                    {profile.services?.length
                      ? profile.services.join(", ")
                      : "Services non renseignés"}
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
