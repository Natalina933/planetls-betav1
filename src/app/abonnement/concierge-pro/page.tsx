"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./ConciergeProPage.module.scss";

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
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const banner = useMemo(() => {
    const status = searchParams.get("checkout");
    if (status === "success") return "Paiement confirme. Le statut PRO peut maintenant etre synchronise.";
    if (status === "cancel") return "Paiement annule. Vous pouvez reprendre plus tard.";
    return null;
  }, [searchParams]);

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
            <button className={styles.cta} onClick={startCheckout} disabled={loading}>
              {loading ? "Preparation du checkout..." : "Activer Concierge PRO"}
            </button>
            {feedback ? <div className={styles.feedback}>{feedback}</div> : null}
            {error ? <div className={`${styles.feedback} ${styles.error}`}>{error}</div> : null}
          </aside>
        </section>
      </div>
    </div>
  );
}
