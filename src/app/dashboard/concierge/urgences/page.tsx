"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import styles from "./UrgencesPage.module.scss";
import { formatMissionWhen } from "@/app/lib/urgentMissions";

type Opportunity = {
  id: string;
  title: string | null;
  property_address: string;
  mission_type: string;
  scheduled_at: string;
  own_match: {
    estimated_intervention_minutes: number;
    estimated_price: number | null;
    distance_km: number;
    is_available_now: boolean;
  };
};

export default function ConciergeUrgencesPage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  async function loadItems() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/urgent-missions?scope=opportunities&horizon=today", {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de charger les opportunites urgentes.");
      }
      setItems(Array.isArray(payload?.items) ? payload.items : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger les opportunites urgentes.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  const availableNowCount = useMemo(
    () => items.filter((item) => item.own_match?.is_available_now).length,
    [items],
  );

  async function handleAccept(id: string) {
    try {
      setAcceptingId(id);
      setActionMessage(null);
      const response = await fetch(`/api/urgent-missions/${id}/accept`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'accepter cette mission.");
      }
      setActionMessage("Mission verrouillee. Le proprietaire est notifie et le chat peut etre ouvert.");
      await loadItems();
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : "Impossible d'accepter cette mission.",
      );
    } finally {
      setAcceptingId(null);
    }
  }

  return (
    <ConciergeWorkspacePage
      eyebrow="Opportunites urgentes"
      title="Missions urgentes a capter"
      description={
        loading
          ? "Chargement des opportunites..."
          : error ||
            "Recevez les demandes critiques du jour, acceptez en un clic et verrouillez la mission avant les autres."
      }
      chips={[`${items.length} opportunite(s)`, `${availableNowCount} disponible(s) maintenant`]}
      metrics={[
        {
          label: "Aujourd'hui",
          value: loading ? "..." : String(items.length),
          hint: "Demandes urgentes ouvertes",
        },
        {
          label: "Disponibles",
          value: loading ? "..." : String(availableNowCount),
          hint: "Profils immediats sur ce flux",
        },
      ]}
      actions={[
        { label: "Parametrer mon profil missions", href: "/dashboard/concierge/profile?tab=missions" },
        { label: "Voir mon planning", href: "/dashboard/concierge/planning" },
      ]}
      cards={[
        {
          title: "1. Notification prioritaire",
          text: "Le module prepare le support push, email et dashboard avec resume distance + horaire mission.",
        },
        {
          title: "2. Acceptation immediate",
          text: "Premier concierge a accepter gagne la mission. Le verrouillage evite les doublons.",
        },
        {
          title: "3. Paiement securise",
          text: "Le statut de paiement passe en autorisation des acceptation pour preparer l'encaissement securise.",
        },
      ]}
    >
      <div className={styles.page}>
        <div className={styles.actions}>
          <Link href="/dashboard/concierge/profile?tab=missions" className={styles.actionLink}>
            Activer ma disponibilite urgente
          </Link>
          <Link href="/dashboard/concierge/messages" className={styles.actionLink}>
            Ouvrir la messagerie
          </Link>
        </div>

        {actionMessage ? <p className={styles.message}>{actionMessage}</p> : null}

        <div className={styles.list}>
          {items.map((item) => (
            <article key={item.id} className={styles.card}>
              <div className={styles.topline}>
                <div>
                  <h2>{item.title || "Mission urgente"}</h2>
                  <div className={styles.meta}>
                    <span>{item.property_address}</span>
                    <span>{formatMissionWhen(item.scheduled_at)}</span>
                  </div>
                </div>
                {item.own_match?.is_available_now ? (
                  <span className={styles.badge}>Disponible maintenant</span>
                ) : null}
              </div>

              <div className={styles.stats}>
                <span>{item.mission_type === "check-in" ? "Check-in" : "Check-out"}</span>
                <span>{item.own_match.estimated_intervention_minutes} min estimees</span>
                <span>{item.own_match.distance_km.toFixed(0)} km</span>
                <span>{typeof item.own_match.estimated_price === "number" ? `${item.own_match.estimated_price} EUR` : "Prix a valider"}</span>
              </div>

              <button
                type="button"
                className={styles.acceptButton}
                disabled={acceptingId === item.id}
                onClick={() => handleAccept(item.id)}
              >
                {acceptingId === item.id ? "Acceptation..." : "J'accepte la mission"}
              </button>
            </article>
          ))}

          {!loading && !error && items.length === 0 ? (
            <p className={styles.message}>Aucune urgence compatible pour le moment.</p>
          ) : null}
        </div>
      </div>
    </ConciergeWorkspacePage>
  );
}
