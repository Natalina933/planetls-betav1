import Link from "next/link";
import { ArrowRight, Clock3, MapPinned, Navigation, Route, TriangleAlert } from "lucide-react";
import type { DashboardEvent } from "@/app/components/dashboard/calendar/DashboardCalendar";
import styles from "./ConciergeRoutePreview.module.scss";

type TourStartPoint = {
  label: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

const tourStartPoint: TourStartPoint = {
  label: "Départ",
  address: "Secteur centre",
};

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(value);
}

export default function ConciergeRoutePreview({ events, compact = false }: { events: readonly DashboardEvent[]; compact?: boolean }) {
  const stops = events.slice(0, 6);
  const nextStop = stops[0];
  const progress = stops.length > 0 ? Math.round((1 / stops.length) * 100) : 0;

  return (
    <section className={[styles.preview, compact ? styles.compact : ""].join(" ")} aria-labelledby="concierge-route-preview-title">
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Organisation terrain</span>
          <h2 id="concierge-route-preview-title">Ma tournée du jour</h2>
          <p>
            {stops.length > 0
              ? `${stops.length} étape${stops.length > 1 ? "s" : ""} planifiée${stops.length > 1 ? "s" : ""} · ordre chronologique`
              : "Aucune étape planifiée pour aujourd'hui."}
          </p>
        </div>
        <span className={styles.routeIcon} aria-hidden="true"><Route size={20} /></span>
      </div>

      {!compact && nextStop ? (
        <div className={styles.nextStop}>
          <div className={styles.nextCopy}>
            <span className={styles.nextLabel}>Prochaine mission</span>
            <strong>{String(nextStop.title || "Mission sans titre")}</strong>
            <span>{formatTime(nextStop.start)} · {nextStop.type === "reminder" ? "Rappel prioritaire" : "Mission planifiée"}</span>
          </div>
          <Link href="/dashboard/concierge/planning" className={styles.primaryAction}>
            Ouvrir le planning <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      ) : !nextStop ? (
        <div className={styles.emptyState}>
          <MapPinned size={18} aria-hidden="true" />
          <span>Votre tournée se construira ici dès qu&apos;une mission sera planifiée.</span>
        </div>
      ) : null}

      <>
          {stops.length > 0 && !compact && <>
          <div className={styles.progressHeader}>
            <span>Progression indicative</span>
            <strong>{progress}% · {stops.length} étape{stops.length > 1 ? "s" : ""}</strong>
          </div>
          <div className={styles.progressTrack} role="progressbar" aria-label="Progression indicative de la tournée" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <span style={{ width: `${progress}%` }} />
          </div>
          </>}
          <div className={styles.routeContent}>
            {stops.length > 0 && (
            <ol className={styles.timeline}>
              {stops.map((event, index) => (
                <li key={`${event.bookingId ?? event.title}-${index}`} className={styles.stop}>
                  <span className={styles.marker}>{index + 1}</span>
                  <div className={styles.stopCopy}>
                    <strong>{String(event.title || "Mission sans titre")}</strong>
                    <span>{formatTime(event.start)} · {event.type === "reminder" ? "Rappel prioritaire" : "Mission"}</span>
                  </div>
                  <span className={event.type === "reminder" ? styles.urgent : styles.status}>
                    {event.type === "reminder" ? <TriangleAlert size={13} aria-hidden="true" /> : <Clock3 size={13} aria-hidden="true" />}
                    {event.type === "reminder" ? "Urgent" : "À venir"}
                  </span>
                </li>
              ))}
            </ol>
            )}

            <figure className={styles.routeMap}>
              <figcaption>
                <strong>Aperçu de la tournée</strong>
                <span>Itinéraire indicatif</span>
              </figcaption>
              <svg viewBox="0 0 420 230" role="img" aria-label="Aperçu fictif de cinq étapes de la tournée au Barcarès">
                <defs>
                  <pattern id="route-map-texture" width="18" height="18" patternUnits="userSpaceOnUse">
                    <circle className={styles.textureDot} cx="3" cy="3" r="0.8" />
                  </pattern>
                </defs>
                <rect className={styles.mapLand} width="420" height="230" />
                <rect className={styles.mapTexture} width="420" height="230" />
                <path className={styles.mapSea} d="M326 0 C310 35 337 66 319 101 C301 137 331 165 316 198 C310 212 307 222 309 230 H420 V0 Z" />
                <path className={styles.coastLine} d="M326 0 C310 35 337 66 319 101 C301 137 331 165 316 198 C310 212 307 222 309 230" />
                <path className={styles.naturalArea} d="M16 122 C53 98 86 111 102 139 C113 159 92 177 57 174 C26 171 4 148 16 122 Z" />
                <path className={styles.naturalArea} d="M203 18 C229 8 267 15 278 35 C287 54 265 66 236 61 C208 56 190 35 203 18 Z" />
                <path className={styles.landmarkArea} d="M239 157 C259 145 291 148 302 166 C309 180 292 191 268 190 C244 188 225 173 239 157 Z" />
                <g className={styles.secondaryRoads}>
                  <path d="M8 70 C77 58 124 65 183 48 S270 36 321 50" />
                  <path d="M25 207 C71 170 127 167 173 177 S252 211 311 202" />
                  <path d="M90 12 C107 51 101 88 116 126 S145 185 166 230" />
                  <path d="M216 0 C205 48 224 80 212 117 S195 183 211 230" />
                </g>
                <g className={styles.mainRoads}>
                  <path d="M18 27 C78 42 135 36 181 69 S255 116 319 105" />
                  <path d="M44 230 C70 191 116 151 160 135 S252 128 318 145" />
                </g>
                <text className={styles.placeLabel} x="220" y="108">Le Barcarès</text>
                <path className={styles.routeLine} d="M48 27 C49 45 59 55 76 68 C94 80 113 86 135 98 S170 122 184 140 C166 159 139 174 115 187 C159 199 221 184 278 172" />
                <g className={styles.startPoint} aria-label={`${tourStartPoint.label}, ${tourStartPoint.address}`}>
                  <title>{`${tourStartPoint.label} - ${tourStartPoint.address}`}</title>
                  <circle cx="48" cy="27" r="15" />
                  <path className={styles.startIcon} d="M40 27 L48 20 L56 27 V35 H51 V29 H45 V35 H40 Z" />
                  <text className={styles.startLabel} x="69" y="24">{tourStartPoint.label}</text>
                  <text className={styles.startSubLabel} x="69" y="38">{tourStartPoint.address}</text>
                </g>
                {[
                  { x: 76, y: 68, place: "Marina", title: "Départ voyageurs", labelX: 94, labelY: 63, anchor: "start" as const },
                  { x: 135, y: 98, place: "Village", title: "Maintenance", labelX: 153, labelY: 93, anchor: "start" as const },
                  { x: 184, y: 140, place: "Plage", title: "Ménage", labelX: 202, labelY: 135, anchor: "start" as const },
                  { x: 115, y: 187, place: "Port", title: "Contrôle", labelX: 133, labelY: 182, anchor: "start" as const },
                  { x: 278, y: 172, place: "Plage", title: "Arrivée voyageurs", labelX: 260, labelY: 167, anchor: "end" as const },
                ].map((stop, index) => (
                  <g key={stop.title} className={styles.mapStop} aria-label={`${index + 1}. ${stop.place}, ${stop.title}`}>
                    <title>{`${index + 1}. ${stop.place} - ${stop.title}`}</title>
                    <circle cx={stop.x} cy={stop.y} r="12" />
                    <text className={styles.mapNumber} x={stop.x} y={stop.y}>{index + 1}</text>
                    <text className={styles.missionPlace} x={stop.labelX} y={stop.labelY} textAnchor={stop.anchor}>{stop.place}</text>
                    <text className={styles.missionType} x={stop.labelX} y={stop.labelY + 13} textAnchor={stop.anchor}>{stop.title}</text>
                  </g>
                ))}
              </svg>
              <div className={styles.mapOptimization}>
                <Route size={14} aria-hidden="true" />
                <span>Optimisation disponible après calcul des distances.</span>
              </div>
            </figure>
          </div>
      </>

      <div className={styles.footer}>
        <span><Navigation size={14} aria-hidden="true" /> Distances disponibles dans le planificateur</span>
        <Link href="/dashboard/concierge/planning">Voir la tournée complète</Link>
      </div>
    </section>
  );
}
