"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MissionAvailability } from "./types";
import styles from "./MissionMap.module.scss";

type LeafletIconProto = { _getIconUrl?: () => string };
delete (L.Icon.Default.prototype as LeafletIconProto)._getIconUrl;

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
  isEditing: boolean;
}

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522];
const DEFAULT_LABEL = "Nouveau point";

function FitToZones({ zones }: { zones: MissionAvailability["zones"] }) {
  const map = useMap();

  useEffect(() => {
    if (!zones.length) return;

    const bounds = L.latLngBounds(zones.map((z) => L.latLng(z.lat, z.lng))).pad(0.25);
    map.fitBounds(bounds, { animate: true });
  }, [zones, map]);

  return null;
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
      if (enabled) onAdd(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MissionMap({
  zones,
  radiusKm,
  onZonesChange,
  isEditing,
}: MissionMapProps) {
  const [newZoneLabel, setNewZoneLabel] = useState("");
  const [uiError, setUiError] = useState<string | null>(null);

  const center = useMemo<[number, number]>(() => {
    if (zones[0]) return [zones[0].lat, zones[0].lng];
    return DEFAULT_CENTER;
  }, [zones]);

  const addZoneAt = useCallback(
    (lat: number, lng: number, label = DEFAULT_LABEL) => {
      const safeLabel = label.trim() || DEFAULT_LABEL;

      onZonesChange([
        ...zones,
        {
          placeId: crypto.randomUUID(),
          label: safeLabel,
          lat,
          lng,
        },
      ]);
    },
    [zones, onZonesChange],
  );

  const removeZone = useCallback(
    (placeId: string) => {
      onZonesChange(zones.filter((z) => z.placeId !== placeId));
    },
    [zones, onZonesChange],
  );

  const renameZone = useCallback(
    (placeId: string, nextLabel: string) => {
      onZonesChange(zones.map((z) => (z.placeId === placeId ? { ...z, label: nextLabel } : z)));
    },
    [zones, onZonesChange],
  );

  const addZoneFromInput = () => {
    const label = newZoneLabel.trim();
    if (!label) {
      setUiError("Saisis un nom de zone (ex : Paris centre).");
      return;
    }
    setUiError(null);
    addZoneAt(DEFAULT_CENTER[0], DEFAULT_CENTER[1], label);
    setNewZoneLabel("");
  };

  const canEdit = isEditing;

  return (
    <div className={styles.container}>
      {canEdit && (
        <div className={styles.toolbar}>
          <div className={styles.addZone}>
            <input
              value={newZoneLabel}
              onChange={(e) => setNewZoneLabel(e.target.value)}
              placeholder="Ajouter une zone..."
              className={styles.input}
              aria-label="Nom de la zone a ajouter"
              onKeyDown={(e) => {
                if (e.key === "Enter") addZoneFromInput();
              }}
            />
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={addZoneFromInput}
            >
              Ajouter
            </button>
          </div>

          <p className={styles.helpText}>Astuce : clique directement sur la carte pour ajouter un point.</p>

          {uiError && (
            <p className={styles.error} role="alert">
              {uiError}
            </p>
          )}
        </div>
      )}

      <div className={styles.mapWrap}>
        <MapContainer center={center} zoom={10} className={styles.map}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap"
          />

          <FitToZones zones={zones} />

          {zones.map((z) => (
            <Marker key={z.placeId} position={[z.lat, z.lng]}>
              <Popup>
                <div className={styles.popup}>
                  {canEdit ? (
                    <>
                      <label className={styles.popupLabel}>
                        Nom
                        <input
                          className={styles.popupInput}
                          value={z.label}
                          onChange={(e) => renameZone(z.placeId, e.target.value)}
                        />
                      </label>

                      <div className={styles.popupMeta}>
                        <span>Lat: {z.lat.toFixed(5)}</span>
                        <span>Lng: {z.lng.toFixed(5)}</span>
                      </div>

                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => removeZone(z.placeId)}
                      >
                        Supprimer
                      </button>
                    </>
                  ) : (
                    <>
                      <strong className={styles.popupTitle}>{z.label}</strong>
                      <div className={styles.popupMeta}>
                        <span>Lat: {z.lat.toFixed(5)}</span>
                        <span>Lng: {z.lng.toFixed(5)}</span>
                      </div>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {zones.map((z) => (
            <Circle
              key={`${z.placeId}-circle`}
              center={[z.lat, z.lng]}
              radius={radiusKm * 1000}
              pathOptions={{ color: "#2b6cb0", fillOpacity: 0.18 }}
            />
          ))}

          <MapClickHandler enabled={canEdit} onAdd={(lat, lng) => addZoneAt(lat, lng)} />
        </MapContainer>
      </div>
    </div>
  );
}
