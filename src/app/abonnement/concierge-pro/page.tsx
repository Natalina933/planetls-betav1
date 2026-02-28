"use client";

import React, { useMemo, useState } from "react";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./ConciergeProPage.module.scss";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";

const features = [
  "Tableau de bord pro plus lisible pour piloter logements, missions et revenus",
  "Priorisation des leads proprietaires et workflows de conversion",
  "Facturation, devis et offres premium centralises",
  "Base prete pour l'abonnement Stripe et le suivi du statut PRO",
];

const summary = [
  "Abonnement mensuel concierge PRO",
  "Orientation premium pour les concierges en croissance",
  "Compatible avec une future commission de mise en relation",
];

export default function ConciergeProSubscriptionPage() {
  const searchParams = useSearchParams();
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionRef, setSubscriptionRef] = useState<string | null>(null);
  const [subscriptionSource, setSubscriptionSource] = useState<string | null>(null);
  const [subscriptionUpdatedAt, setSubscriptionUpdatedAt] = useState<string | null>(null);

  const isPro = user?.role === "concierge_pro";

  const banner = useMemo(() => {
    const status = searchParams.get("checkout");
    if (status === "success") return "Paiement confirme. Le statut PRO peut maintenant etre synchronise.";
    if (status === "cancel") return "Paiement annule. Vous pouvez reprendre plus tard.";
    return null;
  }, [searchParams]);

  useEffect(() => {
    const checkoutStatus = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");

    if (checkoutStatus !== "success" || !sessionId) return;

    let cancelled = false;

    async function syncSubscription() {
      try {
        setSyncing(true);
        setError(null);

        const response = await fetch("/api/billing/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de synchroniser le statut PRO.");
        }

        if (!cancelled) {
          setFeedback("Abonnement Stripe valide. Le profil concierge est maintenant synchronise en PRO.");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Impossible de synchroniser l'abonnement.",
          );
        }
      } finally {
        if (!cancelled) {
          setSyncing(false);
        }
      }
    }

    syncSubscription();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadSubscriptionState() {
      try {
        const response = await fetch("/api/profiles/current", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || cancelled) return;

        const additionalInfo =
          typeof payload?.additional_info === "string" ? payload.additional_info : "";
        if (additionalInfo.startsWith("stripe_subscription:")) {
          const raw = additionalInfo.replace("stripe_subscription:", "").trim();
          const [source, ...rest] = raw.split(":");
          setSubscriptionSource(source || null);
          setSubscriptionRef(rest.join(":").trim() || null);
        } else {
          setSubscriptionSource(null);
          setSubscriptionRef(null);
        }
        setSubscriptionUpdatedAt(typeof payload?.updated_at === "string" ? payload.updated_at : null);
      } catch {
        if (!cancelled) {
          setSubscriptionSource(null);
          setSubscriptionRef(null);
          setSubscriptionUpdatedAt(null);
        }
      }
    }

    loadSubscriptionState();

    return () => {
      cancelled = true;
    };
  }, [feedback, searchParams]);

  async function startCheckout() {
    try {
      setLoading(true);
      setError(null);
      setFeedback(null);

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "concierge_pro_monthly" }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de demarrer le checkout Stripe.");
      }

      if (payload?.url) {
        window.location.href = payload.url;
        return;
      }

      setFeedback("Checkout prepare. Il reste a ouvrir Stripe avec l'URL retournee.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de lancer l'abonnement.");
    } finally {
      setLoading(false);
    }
  }

  const subscriptionUpdatedLabel = useMemo(() => {
    if (!subscriptionUpdatedAt) return null;
    const date = new Date(subscriptionUpdatedAt);
    if (Number.isNaN(date.getTime())) return subscriptionUpdatedAt;
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }, [subscriptionUpdatedAt]);

  const subscriptionSourceLabel =
    subscriptionSource === "webhook"
      ? "Webhook Stripe"
      : subscriptionSource === "return"
      ? "Retour navigateur"
      : null;

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Abonnement concierge PRO</span>
          <h1 className={styles.title}>Passez a un espace plus premium et plus rentable.</h1>
          <p className={styles.subtitle}>
            Cette page pose la base du module d&apos;abonnement Stripe pour les concierges.
            Le parcours est deja structure, et la session checkout pourra etre ouverte des que
            les cles Stripe et le prix mensuel seront configures.
          </p>
          {banner ? <div className={styles.feedback}>{banner}</div> : null}
        </section>

        <section className={styles.grid}>
          <article className={styles.features}>
            <h2>Ce que debloque l&apos;offre PRO</h2>
            <div className={styles.featureList}>
              {features.map((feature) => (
                <div key={feature} className={styles.featureItem}>
                  {feature}
                </div>
              ))}
            </div>
          </article>

          <aside className={styles.offer}>
            <span className={styles.eyebrow}>Offre active</span>
            <h2>Concierge PRO</h2>
            <div className={styles.statusCard}>
              <strong>{isPro ? "Statut actuel : PRO actif" : "Statut actuel : Standard"}</strong>
              <span>
                {isPro
                  ? "Votre compte a acces aux fonctions premium et aux workflows avances."
                  : "Passez en PRO pour afficher vos outils premium et un pilotage avance."}
              </span>
              {subscriptionRef ? (
                <span className={styles.reference}>Reference Stripe : {subscriptionRef}</span>
              ) : null}
              {subscriptionSourceLabel ? (
                <span className={styles.reference}>Source de synchronisation : {subscriptionSourceLabel}</span>
              ) : null}
              {subscriptionUpdatedLabel ? (
                <span className={styles.reference}>Derniere mise a jour : {subscriptionUpdatedLabel}</span>
              ) : null}
            </div>
            <div className={styles.price}>
              <span className={styles.amount}>29 EUR</span>
              <span>/ mois</span>
            </div>
            <div className={styles.summaryList}>
              {summary.map((item) => (
                <div key={item} className={styles.summaryItem}>
                  {item}
                </div>
              ))}
            </div>
            <button className={styles.cta} onClick={startCheckout} disabled={loading || syncing || isPro}>
              {loading
                ? "Preparation du checkout..."
                : syncing
                ? "Synchronisation du statut PRO..."
                : isPro
                ? "Abonnement deja actif"
                : "Activer Concierge PRO"}
            </button>
            {feedback ? <div className={styles.feedback}>{feedback}</div> : null}
            {error ? <div className={`${styles.feedback} ${styles.error}`}>{error}</div> : null}
          </aside>
        </section>
      </div>
    </div>
  );
}
