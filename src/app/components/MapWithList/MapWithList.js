// src/app/components/MapWithList/MapWithList.jsx
"use client";
import React from "react";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import ProfilesDisplay from "../layout/Home/ProfilesDisplay/ProfilesDisplay";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const generateRandomProperties = (count) => {
  const latMin = 48.8;
  const latMax = 48.9;
  const lngMin = 2.3;
  const lngMax = 2.4;
  const types = ["proprietaire", "conciergerie", "artisan"];
  const servicesList = [
    "Nettoyage",
    "Maintenance",
    "Accueil",
    "Gestion",
    "Photographie",
  ];

  const properties = [];
  for (let i = 0; i < count; i++) {
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomServices = servicesList
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 1);
    properties.push({
      id: i,
      name: `Profil ${i + 1}`,
      type: randomType,
      lat: latMin + Math.random() * (latMax - latMin),
      lng: lngMin + Math.random() * (lngMax - lngMin),
      photo: `https://i.pravatar.cc/100?img=${i + 1}`,
      services: randomServices,
    });
  }
  return properties;
};

export default function MapWithList() {
  const [properties, setProperties] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);

  // Génération aléatoire UNIQUEMENT côté client
  React.useEffect(() => {
    setProperties(generateRandomProperties(30));
  }, []);

  // Tant que les propriétés ne sont pas prêtes, affiche un loader ou rien
  if (properties.length === 0) {
    return <div>Chargement de la carte...</div>;
  }

  return (
    <div style={{ display: "flex", height: "600px" }}>
      {/* Liste des biens */}
      <div
        style={{
          flex: "1",
          overflowY: "auto",
          borderRight: "1px solid #ccc",
          padding: "10px",
        }}>
        <ProfilesDisplay
          visibleProfiles={properties}
          onHover={(id) => setHoveredId(id)}
          onLeave={() => setHoveredId(null)}
        />
      </div>

      {/* Carte */}
      <div style={{ flex: 2 }}>
        <MapContainer
          center={[48.85, 2.35]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {properties.map((p) => (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              opacity={hoveredId === p.id ? 1 : 0.5}>
              <Popup>{p.title}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
