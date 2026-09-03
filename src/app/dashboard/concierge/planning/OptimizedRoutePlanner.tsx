"use client";

import { useMemo, useState } from "react";
import { FiArrowDown, FiArrowUp, FiDownload, FiMapPin, FiSave, FiShuffle } from "react-icons/fi";
import MissionSnapshotShell from "@/app/components/dashboard/concierge/MissionSnapshotShell";
import type { Json } from "@/types/supabase";
import {
  hasUsableCoordinates,
  reorderOptimizedStops,
  type OptimizableMission,
  type OptimizedRouteResult,
  type RoutePoint,
} from "./routeOptimization";
import profileStyles from "../profile/ConciergeProfilePage.module.scss";
import styles from "./page.module.scss";

type RawMissionRow = {
  id: string;
  concierge_profile_id?: string | null;
  owner_profile_id?: string | null;
  property_id?: string | null;
  service_id?: number | null;
  title: string | null;
  description?: string | null;
  status: string | null;
  priority: string | null;
  scheduled_start: string | null;
  scheduled_end?: string | null;
  metadata?: Json | null;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgent",
  high: "Haute",
  normal: "Normale",
  low: "Basse",
};

function metadataRecord(value: Json | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function textFromMetadata(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function numberFromMetadata(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    const numberValue = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return null;
}

function constraintsFromMetadata(metadata: Record<string, unknown>) {
  const raw = metadata.constraints;
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) return [raw.trim()];
  return [];
}

function normalizeMission(mission: RawMissionRow): OptimizableMission {
  const metadata = metadataRecord(mission.metadata);
  const address = textFromMetadata(metadata, ["address", "adresse", "locationAddress", "zone"]);
  const estimatedDuration = numberFromMetadata(metadata, ["estimatedDuration", "estimated_duration", "durationMinutes"]);
  const serviceType = textFromMetadata(metadata, ["serviceType", "service_type", "service", "category"]);
  const latitude = numberFromMetadata(metadata, ["latitude", "lat"]);
  const longitude = numberFromMetadata(metadata, ["longitude", "lng", "lon"]);
  const priority = ["low", "normal", "high", "urgent"].includes(String(mission.priority))
    ? (mission.priority as OptimizableMission["priority"])
    : "normal";

  return {
    id: mission.id,
    conciergeId: mission.concierge_profile_id ?? null,
    ownerId: mission.owner_profile_id ?? null,
    title: mission.title || "Mission sans titre",
    serviceType: serviceType || "Service",
    address,
    latitude,
    longitude,
    estimatedDuration: Math.max(15, estimatedDuration ?? 75),
    preferredStartTime: textFromMetadata(metadata, ["preferredStartTime", "preferred_start_time"]) || mission.scheduled_start,
    preferredEndTime: textFromMetadata(metadata, ["preferredEndTime", "preferred_end_time"]) || mission.scheduled_end || null,
    priority,
    status: mission.status,
    constraints: constraintsFromMetadata(metadata),
  };
}

function formatMinutes(minutes: number) {
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  if (hours <= 0) return `${rest} min`;
  return `${hours} h ${String(rest).padStart(2, "0")}`;
}

function formatDistance(km: number) {
  return `${km.toFixed(km >= 10 ? 0 : 1)} km`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function buildShareText(route: OptimizedRouteResult) {
  const lines = [
    `Tournée optimisée - ${route.stops.length} mission(s)`,
    `Distance: ${formatDistance(route.totalDistance)} - Trajet: ${formatMinutes(route.totalTravelTime)}`,
    ...route.stops.map(
      (stop) => `${stop.order}. ${formatTime(stop.estimatedArrivalTime)} ${stop.mission.title} - ${stop.mission.address || "adresse à compléter"}`,
    ),
  ];
  return lines.join("\n");
}

export default function OptimizedRoutePlanner({ missions }: { missions: RawMissionRow[] }) {
  const optimizableMissions = useMemo(
    () =>
      missions
        .filter((mission) => !["completed", "canceled"].includes(String(mission.status)))
        .map(normalizeMission),
    [missions],
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [startAddress, setStartAddress] = useState("Point de départ concierge");
  const [startLatitude, setStartLatitude] = useState("");
  const [startLongitude, setStartLongitude] = useState("");
  const [route, setRoute] = useState<OptimizedRouteResult | null>(null);
  const [automaticRoute, setAutomaticRoute] = useState<OptimizedRouteResult | null>(null);
  const [dirty, setDirty] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const selectedMissions = useMemo(
    () => optimizableMissions.filter((mission) => selectedIds.includes(mission.id)),
    [optimizableMissions, selectedIds],
  );

  const startPoint: RoutePoint = {
    address: startAddress,
    latitude: Number.isFinite(Number(startLatitude)) ? Number(startLatitude) : null,
    longitude: Number.isFinite(Number(startLongitude)) ? Number(startLongitude) : null,
  };

  const selectedWarnings = selectedMissions
    .filter((mission) => !mission.address || !hasUsableCoordinates(mission))
    .map((mission) => `${mission.title}: ${!mission.address ? "adresse manquante" : "coordonnées manquantes"}`);

  const toggleMission = (missionId: string) => {
    setSelectedIds((current) =>
      current.includes(missionId) ? current.filter((id) => id !== missionId) : [...current, missionId],
    );
    setSaveState("idle");
  };

  const optimize = async () => {
    if (selectedMissions.length === 0) return;
    setIsOptimizing(true);
    setOptimizeError(null);

    try {
      const response = await fetch("/api/concierge/optimized-routes/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startPoint,
          missions: selectedMissions,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Optimisation impossible.");

      const nextRoute = payload as OptimizedRouteResult;
      setRoute(nextRoute);
      setAutomaticRoute(nextRoute);
      setDirty(false);
      setSaveState("idle");
      setSaveMessage(null);
    } catch (error) {
      setOptimizeError(error instanceof Error ? error.message : "Optimisation impossible.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const moveStop = (index: number, direction: -1 | 1) => {
    if (!route) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= route.stops.length) return;
    setRoute(reorderOptimizedStops(route.stops, index, nextIndex, startPoint));
    setDirty(true);
    setSaveState("idle");
  };

  const saveRoute = async () => {
    if (!route) return;
    setSaveState("saving");
    setSaveMessage(null);

    try {
      const response = await fetch("/api/concierge/optimized-routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startPoint,
          result: route,
          missionIds: selectedIds,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Sauvegarde impossible.");
      setSaveState("saved");
      setDirty(false);
      setSaveMessage("Organisation sauvegardée.");
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Sauvegarde impossible.");
    }
  };

  const exportRoute = async () => {
    if (!route) return;
    const text = buildShareText(route);
    if (navigator.share) {
      await navigator.share({ title: "Tournée optimisée", text });
      return;
    }
    await navigator.clipboard.writeText(text);
    setSaveMessage("Planning copié dans le presse-papiers.");
  };

  return (
    <section className={styles.optimizerSection} aria-labelledby="route-optimizer-title">
      <div className={styles.optimizerHeader}>
        <div>
          <p className={styles.optimizerEyebrow}>Optimisation terrain</p>
          <h3 id="route-optimizer-title">Organiser une tournée</h3>
          <p>
            Sélectionnez les missions, posez le point de départ, puis générez un ordre de passage modifiable.
          </p>
        </div>
        <button
          type="button"
          className={styles.primaryAction}
          onClick={optimize}
          disabled={selectedMissions.length === 0 || isOptimizing}
        >
          <FiShuffle aria-hidden />
          {isOptimizing ? "Calcul en cours..." : "Optimiser ma tournée"}
        </button>
      </div>

      {optimizeError ? (
        <div className={styles.warningBox} role="alert">
          <p>{optimizeError}</p>
        </div>
      ) : null}

      <div className={styles.optimizerGrid}>
        <MissionSnapshotShell styles={profileStyles} eyebrow="Missions" title="À organiser">
          <div className={styles.startPointGrid}>
            <label>
              Point de départ
              <input value={startAddress} onChange={(event) => setStartAddress(event.target.value)} />
            </label>
            <label>
              Latitude
              <input inputMode="decimal" value={startLatitude} onChange={(event) => setStartLatitude(event.target.value)} />
            </label>
            <label>
              Longitude
              <input inputMode="decimal" value={startLongitude} onChange={(event) => setStartLongitude(event.target.value)} />
            </label>
          </div>

          <div className={styles.missionSelectList}>
            {optimizableMissions.length > 0 ? (
              optimizableMissions.slice(0, 12).map((mission) => (
                <label key={mission.id} className={styles.missionSelectItem}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(mission.id)}
                    onChange={() => toggleMission(mission.id)}
                  />
                  <span className={styles.missionSelectBody}>
                    <strong>{mission.title}</strong>
                    <span>{mission.address || "Adresse à compléter"}</span>
                    <span>
                      {mission.serviceType} · {formatMinutes(mission.estimatedDuration)} ·{" "}
                      {PRIORITY_LABELS[mission.priority]}
                    </span>
                  </span>
                </label>
              ))
            ) : (
              <p className={styles.optimizerEmpty}>Aucune mission active à organiser.</p>
            )}
          </div>
        </MissionSnapshotShell>

        <MissionSnapshotShell styles={profileStyles} eyebrow="Carte" title="Lieux sélectionnés">
          <div className={styles.routeMap} role="img" aria-label="Carte simplifiée des missions sélectionnées">
            {selectedMissions.length > 0 ? (
              selectedMissions.map((mission, index) => (
                <span
                  key={mission.id}
                  className={styles.mapPin}
                  style={{
                    left: `${18 + ((index * 23) % 62)}%`,
                    top: `${18 + ((index * 31) % 58)}%`,
                  }}
                  title={mission.address}
                >
                  <FiMapPin aria-hidden />
                  {index + 1}
                </span>
              ))
            ) : (
              <span className={styles.mapEmpty}>Sélectionnez des missions pour afficher les lieux.</span>
            )}
          </div>
          {selectedWarnings.length > 0 ? (
            <div className={styles.warningBox} role="alert">
              {selectedWarnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}
        </MissionSnapshotShell>
      </div>

      {route ? (
        <div className={styles.routeResultGrid}>
          <MissionSnapshotShell styles={profileStyles} eyebrow="Résumé" title="Tournée proposée">
            <div className={styles.routeSummaryGrid}>
              <span>
                <strong>{route.stops.length}</strong>
                Missions
              </span>
              <span>
                <strong>{formatDistance(route.totalDistance)}</strong>
                Distance
              </span>
              <span>
                <strong>{formatMinutes(route.totalTravelTime)}</strong>
                Trajets
              </span>
              <span>
                <strong>{formatTime(route.estimatedStartTime)}-{formatTime(route.estimatedEndTime)}</strong>
                Amplitude
              </span>
            </div>
            <p className={styles.providerNotice}>
              Calcul d&apos;itinéraire: {route.routeProviderMode === "api" ? route.routeProvider : "estimation locale"}
            </p>
            {dirty && automaticRoute ? (
              <p className={styles.dirtyNotice}>
                Ordre manuel non sauvegardé. Automatique: {formatDistance(automaticRoute.totalDistance)},{" "}
                {formatMinutes(automaticRoute.totalTravelTime)} de trajet.
              </p>
            ) : null}
            {route.warnings.length > 0 ? (
              <div className={styles.warningBox} role="alert">
                {route.warnings.slice(0, 5).map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            ) : (
              <p className={styles.successNotice}>Optimisation réussie sans alerte bloquante.</p>
            )}
          </MissionSnapshotShell>

          <MissionSnapshotShell styles={profileStyles} eyebrow="Ordre" title="Passages recommandés">
            <ol className={styles.routeStopList}>
              {route.stops.map((stop, index) => (
                <li key={stop.mission.id} className={styles.routeStopItem}>
                  <div className={styles.routeStopOrder}>{stop.order}</div>
                  <div className={styles.routeStopBody}>
                    <strong>{stop.mission.title}</strong>
                    <span>{formatTime(stop.estimatedArrivalTime)}-{formatTime(stop.estimatedDepartureTime)}</span>
                    <span>
                      {formatDistance(stop.distanceFromPrevious)} · {formatMinutes(stop.travelTimeFromPrevious)} depuis l&apos;étape précédente
                    </span>
                    {stop.warningMessage ? <em>{stop.warningMessage}</em> : null}
                  </div>
                  <div className={styles.routeStopActions}>
                    <button type="button" onClick={() => moveStop(index, -1)} disabled={index === 0} aria-label="Monter la mission">
                      <FiArrowUp aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStop(index, 1)}
                      disabled={index === route.stops.length - 1}
                      aria-label="Descendre la mission"
                    >
                      <FiArrowDown aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
            <div className={styles.routeActions}>
              <button type="button" onClick={saveRoute} disabled={saveState === "saving"}>
                <FiSave aria-hidden />
                {saveState === "saving" ? "Sauvegarde..." : "Sauvegarder"}
              </button>
              <button type="button" onClick={exportRoute}>
                <FiDownload aria-hidden />
                Exporter
              </button>
            </div>
            {saveMessage ? <p className={saveState === "error" ? styles.errorNotice : styles.successNotice}>{saveMessage}</p> : null}
          </MissionSnapshotShell>
        </div>
      ) : null}
    </section>
  );
}


