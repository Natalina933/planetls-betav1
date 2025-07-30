"use client";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import ProfilesDisplay from "../layout/Home/ProfilesDisplay/ProfilesDisplay";
import { useSearchParams } from "next/navigation";
import styles from "./MapWithList.module.scss";
import Loader from "../common/Loader/Loader";


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Réponse serveur invalide");
  const text = await res.text();
  if (!text) throw new Error("Réponse vide du serveur");
  return JSON.parse(text);
};
export default function MapWithList() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") || "proprietaire"; // Valeur par défaut si non définie
  const location = searchParams.get("location") || "";
  const { data: properties, error } = useSWR(
    `/api/profiles?category=${filter}&location=${location}`,
    fetcher
  );
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(filter);
  useEffect(() => {
    if (error) {
      toast.error(`Erreur API : ${error.message}`);
    }
  }, [error]);

  if (!properties) {
    return (
      <>
        <ToastContainer />
        <Loader showText={true} text="Chargement des profils..." />
      </>
    );
  }

  return (
    <>
      <ToastContainer />
      <div style={{ display: "flex", height: "600px" }}>
        {/* Liste des profils */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            borderRight: "1px solid #ccc",
            padding: "10px",
          }}
        >
          <ProfilesDisplay
            visibleProfiles={properties}
            onHover={(id) => setHoveredId(id)}
            onLeave={() => setHoveredId(null)}
          />
        </div>

        {/* Carte */}
        <div style={{ flex: 2 }}>
          <MapContainer
            aria-label="Carte des profils"
            center={[48.85, 2.35]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {properties.map((p) => (
              <Marker
                key={p.id}
                position={[p.latitude, p.longitude]}
                opacity={hoveredId === p.id ? 1 : 0.5}
              >
                <Popup>
                  <strong>{p.name}</strong>
                  <br />
                  {p.type}
                  <br />
                  {p.services.join(", ")}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </>
  );
}
