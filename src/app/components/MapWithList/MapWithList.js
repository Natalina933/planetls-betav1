"use client";
import React from "react";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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
  const properties = [];
  for (let i = 0; i < count; i++) {
    properties.push({
      id: i,
      title: `Bien n°${i + 1}`,
      lat: latMin + Math.random() * (latMax - latMin),
      lng: lngMin + Math.random() * (lngMax - lngMin),
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
        <h2>Liste des biens</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {properties.map((p) => (
            <li
              key={p.id}
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                padding: "8px",
                cursor: "pointer",
                backgroundColor: hoveredId === p.id ? "#def" : "transparent",
                borderRadius: "4px",
                marginBottom: "4px",
              }}>
              {p.title}
            </li>
          ))}
        </ul>
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
