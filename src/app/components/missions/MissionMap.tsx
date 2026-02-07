"use client";

import { useCallback, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MissionAvailability } from "./types";

/* -------------------------------------------------------------------------- */
/* Leaflet icon fix                                                           */
/* -------------------------------------------------------------------------- */

type LeafletIconProto = {
  _getIconUrl?: () => string;
};

delete (L.Icon.Default.prototype as LeafletIconProto)._getIconUrl;


L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

/* -------------------------------------------------------------------------- */

interface MissionMapProps {
  zones: MissionAvailability["zones"];
  radiusKm: number;
  onZonesChange: (zones: MissionAvailability["zones"]) => void;
  onRadiusChange: (radiusKm: number) => void;
  isEditing: boolean;
}

function MapClickHandler({
  enabled,
  onAdd,
}: {
  enabled: boolean;
  onAdd: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (enabled) {
        onAdd(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return null;
}

export default function MissionMap({
  zones,
  radiusKm,
  onZonesChange,
  onRadiusChange,
  isEditing,
}: MissionMapProps) {
  const [newZoneLabel, setNewZoneLabel] = useState("");

  const addZoneAt = useCallback(
    (lat: number, lng: number, label = "Nouveau point") => {
      onZonesChange([
        ...zones,
        {
          placeId: crypto.randomUUID(),
          label,
          lat,
          lng,
        },
      ]);
    },
    [zones, onZonesChange]
  );

  const addZoneFromInput = () => {
    if (!newZoneLabel) return;
    addZoneAt(48.8566, 2.3522, newZoneLabel);
    setNewZoneLabel("");
  };

  return (
    <div>
      {isEditing && (
        <div style={{ marginBottom: 8, display: "flex", gap: 8 }}>
          <input
            value={newZoneLabel}
            onChange={(e) => setNewZoneLabel(e.target.value)}
            placeholder="Ajouter une zone…"
          />
          <button onClick={addZoneFromInput}>Ajouter</button>
        </div>
      )}

      <MapContainer
        center={zones[0] ? [zones[0].lat, zones[0].lng] : [48.8566, 2.3522]}
        zoom={10}
        style={{ height: 300, width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap"
        />

        {zones.map((z) => (
          <Marker key={z.placeId} position={[z.lat, z.lng]} />
        ))}

        {zones.map((z) => (
          <Circle
            key={`${z.placeId}-circle`}
            center={[z.lat, z.lng]}
            radius={radiusKm * 1000}
            pathOptions={{ color: "blue", fillOpacity: 0.2 }}
          />
        ))}

        <MapClickHandler
          enabled={isEditing}
          onAdd={(lat, lng) => addZoneAt(lat, lng)}
        />
      </MapContainer>

      {isEditing && (
        <label style={{ marginTop: 8, display: "block" }}>
          Rayon : {radiusKm} km
          <input
            type="range"
            min={5}
            max={100}
            value={radiusKm}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
          />
        </label>
      )}
    </div>
  );
}
