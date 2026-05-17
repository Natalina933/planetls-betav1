"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  CheckCircle2,
  CreditCard,
  Gauge,
  MapPinned,
  MessageSquare,
  RadioTower,
  ShieldCheck,
  Siren,
  Zap,
} from "lucide-react";
import { DashboardOperationalPage, DashboardPanel } from "@/components/dashboard";
import { formatMissionWhen } from "@/app/lib/urgentMissions";
import styles from "./UrgencesPage.module.scss";

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
        throw new Error(payload?.error || "Impossible de charger les opportunités urgentes.");
      }
      setItems(Array.isArray(payload?.items) ? payload.items : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger les opportunités urgentes.",
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

  const averageDistance = useMemo(() => {
    if (items.length === 0) return 0;
    const total = items.reduce((sum, item) => sum + (item.own_match?.distance_km ?? 0), 0);
    return Math.round(total / items.length);
  }, [items]);

  const pricedCount = useMemo(
    () => items.filter((item) => typeof item.own_match?.estimated_price === "number").length,
    [items],
  );

  const opportunityItems = useMemo(
    () =>
      items.map((item) => ({
        title: item.title || "Mission urgente",
        meta: formatMissionWhen(item.scheduled_at),
        description: `${item.property_address} - ${item.mission_type === "check-in" ? "Check-in" : "Check-out"}, ${item.own_match.estimated_intervention_minutes} min, ${item.own_match.distance_km.toFixed(0)} km.`,
        action: { label: "Voir le flux", href: "/dashboard/concierge/urgences" },
      })),
    [items],
  );

  const availableItems = useMemo(
    () =>
      items
        .filter((item) => item.own_match?.is_available_now)
        .map((item) => ({
          title: item.title || "Mission urgente",
          meta: "Disponible maintenant",
          description: `${item.property_address} - intervention estimée à ${item.own_match.estimated_intervention_minutes} min.`,
          action: { label: "Traiter", href: "/dashboard/concierge/urgences" },
        })),
    [items],
  );

  const pricingItems = useMemo(
    () =>
      items.map((item) => ({
        title: item.title || "Mission urgente",
        meta:
          typeof item.own_match.estimated_price === "number"
            ? `${item.own_match.estimated_price} EUR`
            : "Prix à valider",
        description: "Contrôlez le prix estimé avant acceptation pour éviter une mission mal cadrée.",
        action: { label: "Vérifier", href: "/dashboard/concierge/urgences" },
      })),
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
      setActionMessage("Mission verrouillée. Le propriétaire est notifié et le chat peut être ouvert.");
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
    <DashboardOperationalPage
      tone="concierge"
      badge="Vue opérationnelle"
      title="Missions urgentes"
      description={
        loading
          ? "Chargement des opportunités urgentes..."
          : error ||
            "Captez les demandes critiques du jour, vérifiez la faisabilité et verrouillez la mission avant les autres."
      }
      primaryActions={[
        { label: "Activer ma disponibilité", href: "/dashboard/concierge/profile?tab=missions" },
        { label: "Ouvrir la messagerie", href: "/dashboard/concierge/messages" },
      ]}
      metrics={[
        {
          label: "Aujourd’hui",
          value: loading ? "..." : String(items.length),
          hint: "Demandes urgentes ouvertes",
          detailSectionId: "opportunites",
        },
        {
          label: "Disponibles",
          value: loading ? "..." : String(availableNowCount),
          hint: "Compatibles maintenant",
          detailSectionId: "disponibles",
        },
        {
          label: "Distance",
          value: loading ? "..." : `${averageDistance} km`,
          hint: "Moyenne estimée",
          detailSectionId: "opportunites",
        },
        {
          label: "Prix",
          value: loading ? "..." : `${pricedCount}/${items.length}`,
          hint: "Estimations prêtes",
          detailSectionId: "prix",
        },
      ]}
      focus={{
        title: "Priorité immédiate",
        status: availableNowCount > 0 ? "À capter" : "Veille",
        statusVariant: availableNowCount > 0 ? "danger" : "info",
        icon: availableNowCount > 0 ? <Siren size={28} /> : <CheckCircle2 size={28} />,
        heading:
          availableNowCount > 0
            ? `${availableNowCount} mission(s) compatible(s) maintenant`
            : "Aucune mission compatible immédiate",
        description:
          availableNowCount > 0
            ? "Ouvrez le flux, contrôlez distance, horaire et prix, puis acceptez la mission si votre équipe peut suivre."
            : "Gardez vos disponibilités urgentes à jour pour être visible dès qu’une demande entre dans votre zone.",
        action: { label: "Paramétrer les urgences", href: "/dashboard/concierge/profile?tab=missions" },
      }}
      risks={[
        {
          label: "Flux",
          value: loading ? "..." : items.length,
          hint: "Opportunités ouvertes",
          icon: RadioTower,
          tone: items.length > 0 ? "warning" : "info",
          detailSectionId: "opportunites",
        },
        {
          label: "Disponibilité",
          value: loading ? "..." : availableNowCount,
          hint: "À traiter maintenant",
          icon: Zap,
          tone: availableNowCount > 0 ? "danger" : "success",
          detailSectionId: "disponibles",
        },
        {
          label: "Distance",
          value: loading ? "..." : `${averageDistance} km`,
          hint: "Moyenne terrain",
          icon: MapPinned,
          tone: averageDistance > 20 ? "warning" : "info",
          detailSectionId: "opportunites",
        },
        {
          label: "Paiement",
          value: loading ? "..." : pricedCount,
          hint: "Prix estimés",
          icon: CreditCard,
          tone: pricedCount === items.length ? "success" : "warning",
          detailSectionId: "prix",
        },
      ]}
      cadenceTitle="Cadence d’urgence"
      cadence={[
        {
          label: "Réception",
          text: "Qualifier l’adresse, l’horaire et le type de mission avant acceptation.",
          icon: BellRing,
        },
        {
          label: "Décision",
          text: "Accepter uniquement si la disponibilité terrain et la distance sont maîtrisées.",
          icon: Gauge,
        },
        {
          label: "Suivi",
          text: "Prévenir le propriétaire et basculer vers la messagerie dès la mission verrouillée.",
          icon: MessageSquare,
        },
      ]}
      detailsBadge="Flux"
      detailsTitle="Opportunités à traiter"
      detailsDescription="Cliquez sur un indicateur pour isoler les missions ouvertes, disponibles maintenant ou à valider côté prix."
      detailSections={[
        {
          id: "opportunites",
          title: "Demandes urgentes ouvertes",
          description: "Missions critiques détectées sur votre zone et votre profil.",
          emptyText: loading ? "Chargement des urgences." : error || "Aucune urgence compatible pour le moment.",
          items: opportunityItems,
        },
        {
          id: "disponibles",
          title: "Disponibles maintenant",
          description: "Demandes que vous pouvez théoriquement capter tout de suite.",
          emptyText: loading ? "Analyse des disponibilités." : error || "Aucune mission disponible immédiatement.",
          items: availableItems,
        },
        {
          id: "prix",
          title: "Prix et cadrage",
          description: "Estimations à contrôler avant verrouillage de la mission.",
          emptyText: loading ? "Analyse des estimations." : error || "Aucun prix à valider pour le moment.",
          items: pricingItems,
        },
      ]}
      illustration={{
        mainIcon: Siren,
        topLeftIcon: ShieldCheck,
        topRightIcon: RadioTower,
      }}
    >
      <div className={styles.page}>
        {actionMessage ? <p className={styles.message}>{actionMessage}</p> : null}

        <DashboardPanel title="Flux d’acceptation" className={styles.operationalPanel}>
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
                  <span>{item.own_match.estimated_intervention_minutes} min estimées</span>
                  <span>{item.own_match.distance_km.toFixed(0)} km</span>
                  <span>
                    {typeof item.own_match.estimated_price === "number"
                      ? `${item.own_match.estimated_price} EUR`
                      : "Prix à valider"}
                  </span>
                </div>

                <button
                  type="button"
                  className={styles.acceptButton}
                  disabled={acceptingId === item.id}
                  onClick={() => handleAccept(item.id)}
                >
                  {acceptingId === item.id ? "Acceptation..." : "J’accepte la mission"}
                </button>
              </article>
            ))}

            {!loading && !error && items.length === 0 ? (
              <p className={styles.message}>Aucune urgence compatible pour le moment.</p>
            ) : null}
          </div>
        </DashboardPanel>
      </div>
    </DashboardOperationalPage>
  );
}
