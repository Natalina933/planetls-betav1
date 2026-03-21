"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from "react-leaflet";
import { FiMapPin, FiSearch, FiTrash2 } from "react-icons/fi";
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

interface GeocodeSuggestion {
  placeId: string;
  label: string;
  latitude: number;
  longitude: number;
  displayName: string;
  subtitle?: string;
  postcode?: string | null;
}

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522];
const ZONE_COLORS = [
  { stroke: "#1d4ed8", fill: "rgba(59, 130, 246, 0.20)", surface: "#dbeafe" },
  { stroke: "#0f766e", fill: "rgba(20, 184, 166, 0.20)", surface: "#ccfbf1" },
  { stroke: "#b45309", fill: "rgba(245, 158, 11, 0.20)", surface: "#fef3c7" },
  { stroke: "#be185d", fill: "rgba(236, 72, 153, 0.20)", surface: "#fce7f3" },
  { stroke: "#6d28d9", fill: "rgba(139, 92, 246, 0.20)", surface: "#ede9fe" },
];

function FitToZones({
  zones,
  radiusKm,
}: {
  zones: MissionAvailability["zones"];
  radiusKm: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!zones.length) return;
    if (!(map as L.Map & { _loaded?: boolean })._loaded) return;

    const bounds = zones.reduce((acc, zone) => {
      const circleBounds = L.latLng(zone.lat, zone.lng).toBounds(
        Math.max(radiusKm, 1) * 2000,
      );

      if (!acc) {
        return circleBounds;
      }

      return acc.extend(circleBounds);
    }, null as L.LatLngBounds | null);

    if (!bounds) return;

    const paddedBounds = bounds.pad(0.12);
    const targetZoom = radiusKm <= 3 ? 13 : radiusKm <= 10 ? 12 : 11;

    // Avoid animated fitBounds here: Leaflet can throw during pane transitions
    // when the map remounts while a zoom animation is still in flight.
    map.stop();
    map.fitBounds(paddedBounds, {
      animate: false,
      padding: [28, 28],
      maxZoom: targetZoom,
    });
  }, [zones, radiusKm, map]);

  return null;
}

export default function MissionMap({
  zones,
  radiusKm,
  onZonesChange,
  isEditing,
}: MissionMapProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);

  const decoratedZones = useMemo(
    () =>
      zones.map((zone, index) => ({
        ...zone,
        order: index + 1,
        colors: ZONE_COLORS[index % ZONE_COLORS.length],
      })),
    [zones],
  );

  const center = useMemo<[number, number]>(() => {
    if (zones[0]) return [zones[0].lat, zones[0].lng];
    return DEFAULT_CENTER;
  }, [zones]);

  const addZoneFromSuggestion = useCallback(
    (suggestion: GeocodeSuggestion) => {
      onZonesChange([
        ...zones,
        {
          placeId: suggestion.placeId,
          label: suggestion.label,
          lat: suggestion.latitude,
          lng: suggestion.longitude,
          postcode: suggestion.postcode ?? null,
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

  useEffect(() => {
    if (!isEditing) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    const query = searchQuery.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setSearching(true);
        setUiError(null);
        const response = await fetch(
          `/api/geocode?q=${encodeURIComponent(query)}&mode=suggest&limit=6`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as {
          error?: string;
          suggestions?: GeocodeSuggestion[];
        };

        if (!response.ok) {
          throw new Error(payload.error || "Recherche de ville impossible.");
        }

        setSuggestions(Array.isArray(payload.suggestions) ? payload.suggestions : []);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setSuggestions([]);
        setUiError(
          error instanceof Error ? error.message : "Recherche de ville impossible.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [isEditing, searchQuery]);

  const handleSuggestionSelect = useCallback(
    (suggestion: GeocodeSuggestion) => {
      addZoneFromSuggestion(suggestion);
      setSearchQuery("");
      setSuggestions([]);
      setUiError(null);
    },
    [addZoneFromSuggestion],
  );

  const createZoneIcon = useCallback(
    (index: number) =>
      L.divIcon({
        className: "",
        html: `
          <span
            class="${styles.zoneMarker}"
            style="--zone-marker:${ZONE_COLORS[index % ZONE_COLORS.length].stroke}"
          >
            ${index + 1}
          </span>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -28],
      }),
    [],
  );

  return (
    <div className={styles.container}>
      {isEditing ? (
        <div className={styles.toolbar}>
          <div className={styles.searchMeta}>
            {searching ? <span className={styles.searchState}>Recherche en cours</span> : null}
          </div>

          <div className={styles.searchInputWrap}>
            <FiSearch className={styles.searchIcon} aria-hidden="true" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un code postal, une ville ou un arrondissement..."
              className={styles.input}
              aria-label="Rechercher un code postal ou une ville reconnue"
              autoComplete="off"
            />
          </div>

          {suggestions.length > 0 ? (
            <div className={styles.suggestionsPanel}>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.placeId}
                  type="button"
                  className={styles.suggestionBtn}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <span className={styles.suggestionIcon} aria-hidden="true">
                    <FiMapPin />
                  </span>
                  <span className={styles.suggestionCopy}>
                    <strong>{suggestion.label}</strong>
                    <span>{suggestion.subtitle || suggestion.displayName}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {uiError ? (
            <p className={styles.error} role="alert">
              {uiError}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={styles.mapWrap}>
        <div className={styles.radiusBadge}>
          <span className={styles.radiusBadgeLabel}>Rayon</span>
          <strong>{radiusKm} km</strong>
        </div>

        {decoratedZones.length > 0 ? (
          <div className={styles.mapLegend}>
            {decoratedZones.map((zone) => (
              <div key={zone.placeId} className={styles.legendItem}>
                <span
                  className={styles.legendSwatch}
                  style={
                    {
                      "--legend-stroke": zone.colors.stroke,
                      "--legend-surface": zone.colors.surface,
                    } as CSSProperties
                  }
                >
                  {zone.order}
                </span>
                <span className={styles.legendLabel}>{zone.label}</span>
              </div>
            ))}
          </div>
        ) : null}

        <MapContainer center={center} zoom={10} className={styles.map}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap"
          />

          <FitToZones zones={zones} radiusKm={radiusKm} />

          {decoratedZones.map((zone, index) => (
            <Marker
              key={zone.placeId}
              position={[zone.lat, zone.lng]}
              icon={createZoneIcon(index)}
            >
              <Popup>
                <div className={styles.popup}>
                  <strong className={styles.popupTitle}>{zone.label}</strong>
                  <span
                    className={styles.popupBadge}
                    style={{ "--popup-accent": zone.colors.stroke } as CSSProperties}
                  >
                    Zone {zone.order}
                  </span>
                  <div className={styles.popupMeta}>
                    <span>Lat: {zone.lat.toFixed(5)}</span>
                    <span>Lng: {zone.lng.toFixed(5)}</span>
                  </div>
                  {isEditing ? (
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      onClick={() => removeZone(zone.placeId)}
                    >
                      <FiTrash2 aria-hidden="true" />
                      Supprimer
                    </button>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          ))}

          {decoratedZones.map((zone) => (
            <Circle
              key={`${zone.placeId}-circle`}
              center={[zone.lat, zone.lng]}
              radius={radiusKm * 1000}
              pathOptions={{
                color: zone.colors.stroke,
                fillColor: zone.colors.fill,
                fillOpacity: 0.22,
                weight: 3,
                opacity: 0.9,
                dashArray: isEditing ? "10 8" : undefined,
              }}
            />
          ))}

          {decoratedZones.map((zone) => (
            <Circle
              key={`${zone.placeId}-focus`}
              center={[zone.lat, zone.lng]}
              radius={Math.max(350, Math.min(radiusKm * 120, 1800))}
              pathOptions={{
                color: zone.colors.stroke,
                fillColor: zone.colors.stroke,
                fillOpacity: 0.12,
                weight: 1.5,
                opacity: 0.45,
              }}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
