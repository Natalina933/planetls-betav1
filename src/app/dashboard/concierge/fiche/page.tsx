"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Lock, MapPin, Radar, Save, Unlock } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard";
import styles from "./ZoneLock.module.scss";

type InterventionZone = {
  serviceArea: string | null;
  serviceRadiusKm: number | null;
  city: string | null;
  postalCode: string | null;
  locked: boolean;
};

const DEFAULT_ZONE: InterventionZone = {
  serviceArea: null,
  serviceRadiusKm: 20,
  city: null,
  postalCode: null,
  locked: false,
};

export default function FicheConciergeriePage() {
  const [zone, setZone] = useState<InterventionZone>(DEFAULT_ZONE);
  const [draftArea, setDraftArea] = useState("");
  const [draftRadius, setDraftRadius] = useState(20);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadZone() {
      try {
        const response = await fetch("/api/concierge/intervention-zone", { cache: "no-store" });
        const payload = (await response.json()) as Partial<InterventionZone> & { error?: string };
        if (!response.ok) {
          throw new Error(payload.error || "Impossible de charger la zone.");
        }
        if (cancelled) return;

        const nextZone = {
          serviceArea: payload.serviceArea ?? null,
          serviceRadiusKm: payload.serviceRadiusKm ?? DEFAULT_ZONE.serviceRadiusKm,
          city: payload.city ?? null,
          postalCode: payload.postalCode ?? null,
          locked: Boolean(payload.locked),
        };
        setZone(nextZone);
        setDraftArea(nextZone.serviceArea || nextZone.city || "");
        setDraftRadius(nextZone.serviceRadiusKm ?? 20);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger la zone.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadZone();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveZone(locked: boolean) {
    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      const response = await fetch("/api/concierge/intervention-zone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceArea: draftArea.trim() || null,
          serviceRadiusKm: draftRadius,
          locked,
        }),
      });
      const payload = (await response.json()) as Partial<InterventionZone> & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossible d'enregistrer la zone.");
      }

      const nextZone = {
        serviceArea: payload.serviceArea ?? null,
        serviceRadiusKm: payload.serviceRadiusKm ?? draftRadius,
        city: payload.city ?? zone.city,
        postalCode: payload.postalCode ?? zone.postalCode,
        locked: Boolean(payload.locked),
      };
      setZone(nextZone);
      setMessage(locked ? "Zone verrouillée. Les demandes hors périmètre seront plus faciles à filtrer." : "Zone déverrouillée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer la zone.");
    } finally {
      setSaving(false);
    }
  }

  const zoneLabel = zone.serviceArea || zone.city || "Zone non renseignée";

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div>
          <p>Fiche conciergerie</p>
          <h1>Zone d'intervention</h1>
          <span>
            Cadrez votre périmètre local pour recevoir des opportunités plus réalistes et lisibles.
          </span>
        </div>
        <Link href="/dashboard/concierge" className={styles.backLink}>
          Retour dashboard
        </Link>
      </section>

      <div className={styles.grid}>
        <DashboardPanel title="Périmètre local" bodyClassName={styles.panelBody}>
          {loading ? <p className={styles.muted}>Chargement de votre zone...</p> : null}
          {error ? <p className={styles.errorBox}>{error}</p> : null}
          {message ? <p className={styles.successBox}>{message}</p> : null}

          <div className={styles.statusCard}>
            <span className={zone.locked ? styles.lockedIcon : styles.openIcon}>
              {zone.locked ? <Lock size={20} aria-hidden="true" /> : <Unlock size={20} aria-hidden="true" />}
            </span>
            <div>
              <strong>{zone.locked ? "Zone verrouillée" : "Zone modifiable"}</strong>
              <p>
                {zoneLabel}
                {zone.serviceRadiusKm ? ` · rayon ${zone.serviceRadiusKm} km` : ""}
              </p>
            </div>
          </div>

          <label className={styles.field}>
            <span>Ville ou secteur principal</span>
            <input
              value={draftArea}
              disabled={zone.locked || saving}
              onChange={(event) => setDraftArea(event.target.value)}
              placeholder="Ex. La Rochelle centre, Île de Ré, Royan..."
            />
          </label>

          <label className={styles.field}>
            <span>Rayon d'intervention</span>
            <div className={styles.radiusRow}>
              <input
                type="range"
                min={5}
                max={80}
                step={5}
                value={draftRadius}
                disabled={zone.locked || saving}
                onChange={(event) => setDraftRadius(Number(event.target.value))}
              />
              <strong>{draftRadius} km</strong>
            </div>
          </label>

          <div className={styles.actions}>
            <button type="button" disabled={zone.locked || saving} onClick={() => void saveZone(false)}>
              <Save size={17} aria-hidden="true" />
              Enregistrer
            </button>
            <button type="button" disabled={saving} onClick={() => void saveZone(!zone.locked)}>
              {zone.locked ? <Unlock size={17} aria-hidden="true" /> : <Lock size={17} aria-hidden="true" />}
              {zone.locked ? "Déverrouiller" : "Verrouiller ma zone"}
            </button>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Impact zone" bodyClassName={styles.panelBody}>
          <div className={styles.tipList}>
            <p>
              <MapPin size={26} aria-hidden="true" />
              Une zone verrouillée réduit les demandes trop loin et simplifie la prise de décision.
            </p>
            <p>
              <Radar size={26} aria-hidden="true" />
              Le rayon sert de repère métier pour les futures alertes propriétaires.
            </p>
            <p>
              <CheckCircle2 size={26} aria-hidden="true" />
              En mode Essentiel, ce réglage devient un garde-fou quotidien plutôt qu'un tableau complexe.
            </p>
          </div>
        </DashboardPanel>
      </div>
    </main>
  );
}
