"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Lock, MapPin, Radar, Save, Unlock } from "lucide-react";
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
        if (!response.ok) throw new Error(payload.error || "Impossible de charger la zone.");
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
        if (!cancelled) setError(err instanceof Error ? err.message : "Impossible de charger la zone.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadZone();
    return () => { cancelled = true; };
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
      if (!response.ok) throw new Error(payload.error || "Impossible d'enregistrer la zone.");

      const nextZone = {
        serviceArea: payload.serviceArea ?? null,
        serviceRadiusKm: payload.serviceRadiusKm ?? draftRadius,
        city: payload.city ?? zone.city,
        postalCode: payload.postalCode ?? zone.postalCode,
        locked: Boolean(payload.locked),
      };
      setZone(nextZone);
      setMessage(
        locked
          ? "Zone verrouillée. Votre périmètre est maintenant défini pour mieux cibler les demandes."
          : "Zone déverrouillée. Vous pouvez à nouveau modifier votre périmètre.",
      );
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
          <p>Conciergerie · Paramètres métier</p>
          <h1>Zone d&apos;intervention</h1>
          <span>
            Définissez un périmètre réaliste autour de votre activité pour mieux cibler les demandes,
            maîtriser vos trajets et préserver la qualité de vos interventions.
          </span>
        </div>
        <Link href="/dashboard/concierge" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" />
          Retour au tableau de bord
        </Link>
      </section>

      <div className={styles.grid}>
        <DashboardPanel title="Mon périmètre" bodyClassName={styles.panelBody}>
          {loading ? <p className={styles.muted}>Chargement de votre zone d&apos;intervention…</p> : null}
          {error ? <p className={styles.errorBox} role="alert">{error}</p> : null}
          {message ? <p className={styles.successBox} role="status">{message}</p> : null}

          <div className={styles.statusCard}>
            <span className={zone.locked ? styles.lockedIcon : styles.openIcon}>
              {zone.locked ? <Lock size={19} aria-hidden="true" /> : <Unlock size={19} aria-hidden="true" />}
            </span>
            <div>
              <strong>{zone.locked ? "Périmètre verrouillé" : "Périmètre modifiable"}</strong>
              <p>
                {zoneLabel}
                {zone.serviceRadiusKm ? ` · jusqu’à ${zone.serviceRadiusKm} km` : ""}
              </p>
            </div>
          </div>

          <label className={styles.field}>
            <span>Ville ou secteur de référence</span>
            <input
              value={draftArea}
              disabled={zone.locked || saving}
              onChange={(event) => setDraftArea(event.target.value)}
              placeholder="Ex. Le Barcarès, Perpignan, Côte Vermeille…"
            />
          </label>

          <label className={styles.field}>
            <span>Rayon maximum d&apos;intervention</span>
            <div className={styles.radiusRow}>
              <input
                type="range"
                min={5}
                max={80}
                step={5}
                value={draftRadius}
                disabled={zone.locked || saving}
                onChange={(event) => setDraftRadius(Number(event.target.value))}
                aria-label="Rayon maximum d'intervention"
              />
              <strong>{draftRadius} km</strong>
            </div>
          </label>

          <div className={styles.actions}>
            <button type="button" disabled={zone.locked || saving} onClick={() => void saveZone(false)}>
              <Save size={16} aria-hidden="true" />
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button type="button" disabled={saving} onClick={() => void saveZone(!zone.locked)}>
              {zone.locked ? <Unlock size={16} aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
              {zone.locked ? "Modifier mon périmètre" : "Valider et verrouiller"}
            </button>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Pourquoi définir cette zone ?" bodyClassName={styles.panelBody}>
          <div className={styles.tipList}>
            <p>
              <MapPin aria-hidden="true" />
              <span><strong>Des demandes plus pertinentes.</strong><br />Écartez plus facilement les opportunités trop éloignées de votre secteur.</span>
            </p>
            <p>
              <Radar aria-hidden="true" />
              <span><strong>Des trajets mieux maîtrisés.</strong><br />Votre rayon devient un repère pour organiser les missions et les tournées.</span>
            </p>
            <p>
              <CheckCircle2 aria-hidden="true" />
              <span><strong>Un cadre simple au quotidien.</strong><br />Une fois verrouillée, la zone sert de référence sans ajouter de complexité à votre espace.</span>
            </p>
          </div>
        </DashboardPanel>
      </div>
    </main>
  );
}
