"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./OwnerConciergesPage.module.scss";

type ConciergeSearchRow = {
  id: string;
  display_name: string;
  city: string | null;
  country: string | null;
  service_area: string | null;
  service_radius_km: number | null;
  hourly_rate: number | null;
  monthly_rate: number | null;
  experience_level: string | null;
  years_experience: number | null;
  services: string[];
  is_pro: boolean;
  average_rating: number | null;
  reviews_count: number;
};

function formatAmount(value: number | null, suffix: string) {
  if (typeof value !== "number") return "Non renseigne";
  return `${value.toFixed(0)} EUR ${suffix}`;
}

export default function OwnerConciergesPage() {
  const [city, setCity] = useState("");
  const [service, setService] = useState("");
  const [proOnly, setProOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [contactingId, setContactingId] = useState<string | null>(null);
  const [items, setItems] = useState<ConciergeSearchRow[]>([]);

  const totalPro = useMemo(() => items.filter((item) => item.is_pro).length, [items]);

  async function loadConcierges(options?: {
    nextCity?: string;
    nextService?: string;
    nextProOnly?: boolean;
  }) {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      const cityValue = options?.nextCity ?? city;
      const serviceValue = options?.nextService ?? service;
      const proValue = options?.nextProOnly ?? proOnly;

      if (cityValue.trim()) params.set("city", cityValue.trim());
      if (serviceValue.trim()) params.set("service", serviceValue.trim());
      if (proValue) params.set("proOnly", "1");

      const response = await fetch(`/api/profiles/concierges?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de charger les concierges.");
      }

      setItems(Array.isArray(payload?.items) ? payload.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les concierges.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConcierges({ nextCity: "", nextService: "", nextProOnly: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    loadConcierges();
  }

  async function handleContactConcierge(item: ConciergeSearchRow) {
    try {
      setContactingId(item.id);
      setError(null);
      setFeedback(null);

      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concierge_profile_id: item.id,
          source: "search",
          source_reference: item.id,
          subject: `Prise de contact proprietaire - ${item.display_name}`,
          prefill_message: `Bonjour ${item.display_name}, je souhaite echanger avec vous sur la gestion de mes logements en ${item.city || item.service_area || "France"}.`,
          metadata: {
            origin: "owner_concierge_search",
            concierge_profile_id: item.id,
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de creer la conversation.");
      }

      setFeedback(
        `Conversation creee avec ${item.display_name}. Vous pouvez maintenant poursuivre dans la messagerie proprietaire.`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de creer la conversation.",
      );
    } finally {
      setContactingId(null);
    }
  }

  return (
    <section className="dashboard-grid">
      <div className={styles.page}>
        <header className={styles.hero}>
          <span className={styles.eyebrow}>Mise en relation</span>
          <h1 className={styles.title}>Trouver un concierge</h1>
          <p className={styles.description}>
            Explorez des profils de concierges avec leurs services, leur zone, leur note moyenne et
            un acces direct a leur fiche publique ou a la prise de contact.
          </p>
          <div className={styles.chips}>
            <span className={styles.chip}>{items.length} concierge(s)</span>
            <span className={styles.chip}>{totalPro} profil(s) PRO</span>
          </div>
        </header>

        <form className={styles.filters} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Ville ou zone</span>
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Paris, Annecy, Bordeaux..."
            />
          </label>
          <label className={styles.field}>
            <span>Service recherche</span>
            <input
              value={service}
              onChange={(event) => setService(event.target.value)}
              placeholder="Menage, check-in, maintenance..."
            />
          </label>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={proOnly}
              onChange={(event) => setProOnly(event.target.checked)}
            />
            <span>Afficher uniquement les concierges PRO</span>
          </label>
          <div className={styles.actions}>
            <button type="submit" className={styles.primaryBtn} disabled={loading}>
              {loading ? "Recherche..." : "Rechercher"}
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => {
                setCity("");
                setService("");
                setProOnly(false);
                setFeedback(null);
                loadConcierges({ nextCity: "", nextService: "", nextProOnly: false });
              }}
              disabled={loading}
            >
              Reinitialiser
            </button>
          </div>
        </form>

        {error ? <p className={styles.errorBox}>{error}</p> : null}
        {feedback ? <p className={styles.successBox}>{feedback}</p> : null}

        {!loading && !error && items.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Aucun concierge ne correspond a vos criteres.</h2>
            <p>Essayez d'elargir la zone ou de retirer le filtre service.</p>
          </div>
        ) : null}

        <div className={styles.grid}>
          {items.map((item) => (
            <article key={item.id} className={styles.card}>
              <div className={styles.cardHead}>
                <div>
                  <h2>{item.display_name}</h2>
                  <p>{item.city || item.service_area || "Zone non renseignee"}</p>
                </div>
                <span className={item.is_pro ? styles.proBadge : styles.standardBadge}>
                  {item.is_pro ? "PRO" : "Standard"}
                </span>
              </div>

              <div className={styles.stats}>
                <p>
                  <strong>Note :</strong>{" "}
                  {typeof item.average_rating === "number"
                    ? `${item.average_rating.toFixed(1)} / 5`
                    : "Pas encore d'avis"}
                </p>
                <p>
                  <strong>Avis :</strong> {item.reviews_count}
                </p>
                <p>
                  <strong>Experience :</strong>{" "}
                  {typeof item.years_experience === "number"
                    ? `${item.years_experience} an(s)`
                    : item.experience_level || "Non renseignee"}
                </p>
                <p>
                  <strong>Rayon :</strong>{" "}
                  {typeof item.service_radius_km === "number"
                    ? `${item.service_radius_km} km`
                    : "Non renseigne"}
                </p>
              </div>

              <div className={styles.pricing}>
                <span>{formatAmount(item.hourly_rate, "/ h")}</span>
                <span>{formatAmount(item.monthly_rate, "/ mois")}</span>
              </div>

              <div className={styles.tags}>
                {item.services.length > 0 ? (
                  item.services.slice(0, 6).map((serviceLabel) => (
                    <span key={`${item.id}-${serviceLabel}`} className={styles.tag}>
                      {serviceLabel}
                    </span>
                  ))
                ) : (
                  <span className={styles.tagMuted}>Services non renseignes</span>
                )}
              </div>

              <div className={styles.cardActions}>
                <Link href={`/concierges/${item.id}`} className={styles.primaryBtn}>
                  Voir le profil
                </Link>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  disabled={contactingId === item.id}
                  onClick={() => handleContactConcierge(item)}
                >
                  {contactingId === item.id ? "Ouverture..." : "Contacter"}
                </button>
                <Link href="/dashboard/owner/conciergerie" className={styles.secondaryBtn}>
                  Voir mon suivi concierge
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
