"use client";

import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  useMapEvents,
} from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MissionAvailability } from "./types";

// 🔹 Fix TS pour les icônes Leaflet
interface IconDefaultWithFix extends L.Icon.Default {
  _getIconUrl?: () => string;
}

const DefaultIcon = L.Icon.Default.prototype as IconDefaultWithFix;
delete DefaultIcon._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MissionMapProps {
  zones: MissionAvailability["zones"];
  radiusKm: number;
  onZonesChange: (zones: MissionAvailability["zones"]) => void;
  onRadiusChange: (radiusKm: number) => void;
  isEditing: boolean;
}

export default function MissionMap({
  zones,
  radiusKm,
  onZonesChange,
  onRadiusChange,
  isEditing,
}: MissionMapProps) {
  const [newZoneLabel, setNewZoneLabel] = useState("");

  // Ajouter une zone via input
  const addZone = () => {
    if (!newZoneLabel) return;

    const mockLatLng: LatLngExpression = [48.8566, 2.3522]; // Paris par défaut
    onZonesChange([
      ...zones,
      {
        placeId: Date.now().toString(),
        label: newZoneLabel,
        lat: (mockLatLng as [number, number])[0],
        lng: (mockLatLng as [number, number])[1],
      },
    ]);
    setNewZoneLabel("");
  };

  // Ajouter une zone via clic sur la carte
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        if (!isEditing) return;

        onZonesChange([
          ...zones,
          {
            placeId: Date.now().toString(),
            label: "Nouveau point",
            lat: e.latlng.lat,
            lng: e.latlng.lng,
          },
        ]);
      },
    });
    return null;
  };

  return (
    <div>
      {isEditing && (
        <div style={{ marginBottom: "0.5rem", display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="Ajouter une zone..."
            value={newZoneLabel}
            onChange={(e) => setNewZoneLabel(e.target.value)}
          />
          <button type="button" onClick={addZone}>
            Ajouter
          </button>
        </div>
      )}

      <MapContainer
        center={zones[0] ? [zones[0].lat, zones[0].lng] : [48.8566, 2.3522]}
        zoom={10}
        style={{ height: 300, width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {zones.map((z) => (
          <Marker key={z.placeId} position={[z.lat, z.lng]} />
        ))}

        {zones.map((z) => (
          <Circle
            key={z.placeId}
            center={[z.lat, z.lng]}
            radius={radiusKm * 1000}
            pathOptions={{ color: "blue", fillOpacity: 0.2 }}
          />
        ))}

        <MapClickHandler />
      </MapContainer>

      {isEditing && (
        <div style={{ marginTop: "0.5rem" }}>
          <label>
            Rayon : {radiusKm} km
            <input
              type="range"
              min={5}
              max={100}
              value={radiusKm}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
            />
          </label>
        </div>
      )}
    </div>
  );
}
