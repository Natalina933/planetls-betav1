import Link from "next/link";
import { ArrowRight, Clock3, MapPinned, Navigation, Route, TriangleAlert } from "lucide-react";
import type { DashboardEvent } from "@/app/components/dashboard/calendar/DashboardCalendar";
import styles from "./ConciergeRoutePreview.module.scss";

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

      {stops.length > 0 ? (
        <>
          {!compact && <>
          <div className={styles.progressHeader}>
            <span>Progression indicative</span>
            <strong>{progress}% · {stops.length} étape{stops.length > 1 ? "s" : ""}</strong>
          </div>
          <div className={styles.progressTrack} role="progressbar" aria-label="Progression indicative de la tournée" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <span style={{ width: `${progress}%` }} />
          </div>
          </>}
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
        </>
      ) : null}

      <div className={styles.footer}>
        <span><Navigation size={14} aria-hidden="true" /> Distances disponibles dans le planificateur</span>
        <Link href="/dashboard/concierge/planning">Voir la tournée complète</Link>
      </div>
    </section>
  );
}
