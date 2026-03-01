"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./OwnerConciergesPage.module.scss";
import {
  buildOwnerConciergeFilterOptions,
  buildOwnerConciergeSearchParams,
  toggleOwnerConciergeService,
  type OwnerConciergeSearchFilters,
} from "./searchHelpers";

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
  property_types?: string[];
  is_pro: boolean;
  average_rating: number | null;
  reviews_count: number;
  latest_review_comment: string | null;
  latest_review_at: string | null;
};

type ConciergeSearchPayload = {
  items: ConciergeSearchRow[];
  available_filters?: {
    services?: string[];
    property_types?: string[];
  };
};

const initialFilters: OwnerConciergeSearchFilters = {
  city: "",
  selectedServices: [],
  propertyType: "",
  budgetMax: "",
  radiusKm: "",
  proOnly: false,
};

function formatAmount(value: number | null, suffix: string) {
  if (typeof value !== "number") return "Non renseigné";
  return `${value.toFixed(0)} EUR ${suffix}`;
}

function formatReviewDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function OwnerConciergesPage() {
  const [filters, setFilters] = useState<OwnerConciergeSearchFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [contactingId, setContactingId] = useState<string | null>(null);
  const [items, setItems] = useState<ConciergeSearchRow[]>([]);
  const [serverOptions, setServerOptions] = useState<{ services: string[]; propertyTypes: string[] }>({
    services: [],
    propertyTypes: [],
  });

  const totalPro = useMemo(() => items.filter((item) => item.is_pro).length, [items]);
  const clientOptions = useMemo(() => buildOwnerConciergeFilterOptions(items), [items]);

  const serviceOptions = useMemo(() => {
    const values = new Set([...serverOptions.services, ...clientOptions.services]);
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [clientOptions.services, serverOptions.services]);

  const propertyTypeOptions = useMemo(() => {
    const values = new Set([...serverOptions.propertyTypes, ...clientOptions.propertyTypes]);
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [clientOptions.propertyTypes, serverOptions.propertyTypes]);

  async function loadConcierges(nextFilters?: OwnerConciergeSearchFilters) {
    try {
      setLoading(true);
      setError(null);

      const effectiveFilters = nextFilters ?? filters;
      const params = buildOwnerConciergeSearchParams(effectiveFilters);
      const response = await fetch(`/api/profiles/concierges?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as ConciergeSearchPayload & { error?: string };

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de charger les concierges.");
      }

      setItems(Array.isArray(payload?.items) ? payload.items : []);
      setServerOptions({
        services: Array.isArray(payload?.available_filters?.services)
          ? payload.available_filters.services
          : [],
        propertyTypes: Array.isArray(payload?.available_filters?.property_types)
          ? payload.available_filters.property_types
          : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les concierges.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConcierges(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    loadConcierges(filters);
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
          subject: `Prise de contact propriétaire - ${item.display_name}`,
          prefill_message: `Bonjour ${item.display_name}, je souhaite échanger avec vous sur la gestion de mes logements en ${item.city || item.service_area || "France"}.`,
          metadata: {
            origin: "owner_concierge_search",
            concierge_profile_id: item.id,
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de créer la conversation.");
      }

      setFeedback(
        `Conversation créée avec ${item.display_name}. Vous pouvez maintenant poursuivre dans la messagerie propriétaire.`,
      );
      window.location.href = `/dashboard/owner/messages?created=${payload.id}`;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de créer la conversation.",
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
            Filtrez par zone, services, type de bien, budget et rayon pour trouver le bon partenaire concierge.
          </p>
          <div className={styles.chips}>
            <span className={styles.chip}>{items.length} concierge(s)</span>
            <span className={styles.chip}>{totalPro} profil(s) PRO</span>
            <span className={styles.chip}>
              {filters.selectedServices.length > 0
                ? `${filters.selectedServices.length} service(s) filtrés`
                : "Tous services"}
            </span>
          </div>
        </header>

        <form className={styles.filters} onSubmit={handleSubmit}>
          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span>Ville ou zone</span>
              <input
                value={filters.city}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, city: event.target.value }))
                }
                placeholder="Paris, Annecy, Bordeaux..."
              />
            </label>

            <label className={styles.field}>
              <span>Type de bien</span>
              <select
                value={filters.propertyType}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, propertyType: event.target.value }))
                }
              >
                <option value="">Tous les biens</option>
                {propertyTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Budget max / heure</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={filters.budgetMax}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, budgetMax: event.target.value }))
                }
                placeholder="90"
              />
            </label>

            <label className={styles.field}>
              <span>Rayon max</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={filters.radiusKm}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, radiusKm: event.target.value }))
                }
                placeholder="25"
              />
            </label>
          </div>

          <div className={styles.servicesBlock}>
            <span className={styles.blockLabel}>Services recherchés</span>
            <div className={styles.serviceChips}>
              {serviceOptions.length === 0 ? (
                <span className={styles.tagMuted}>
                  Les services apparaîtront après le premier chargement.
                </span>
              ) : (
                serviceOptions.map((serviceLabel) => {
                  const selected = filters.selectedServices.includes(serviceLabel);
                  return (
                    <button
                      key={serviceLabel}
                      type="button"
                      className={selected ? styles.serviceChipActive : styles.serviceChip}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          selectedServices: toggleOwnerConciergeService(
                            prev.selectedServices,
                            serviceLabel,
                          ),
                        }))
                      }
                    >
                      {serviceLabel}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={filters.proOnly}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, proOnly: event.target.checked }))
              }
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
                setFilters(initialFilters);
                setFeedback(null);
                loadConcierges(initialFilters);
              }}
              disabled={loading}
            >
              Réinitialiser
            </button>
          </div>
        </form>

        {error ? <p className={styles.errorBox}>{error}</p> : null}
        {feedback ? <p className={styles.successBox}>{feedback}</p> : null}

        {!loading && !error && items.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Aucun concierge ne correspond à vos critères.</h2>
            <p>Essayez d&apos;élargir la zone, de relever le budget ou de retirer un filtre service.</p>
          </div>
        ) : null}

        <div className={styles.grid}>
          {items.map((item) => (
            <article key={item.id} className={styles.card}>
              <div className={styles.cardHead}>
                <div>
                  <h2>{item.display_name}</h2>
                  <p>{item.city || item.service_area || "Zone non renseignée"}</p>
                </div>
                <div className={styles.badgesCol}>
                  <span className={item.is_pro ? styles.proBadge : styles.standardBadge}>
                    {item.is_pro ? "PRO" : "Standard"}
                  </span>
                  <span className={styles.ratingBadge}>
                    {typeof item.average_rating === "number"
                      ? `${item.average_rating.toFixed(1)} / 5`
                      : "Sans avis"}
                  </span>
                </div>
              </div>

              <div className={styles.stats}>
                <p>
                  <strong>Avis :</strong> {item.reviews_count}
                </p>
                <p>
                  <strong>Expérience :</strong>{" "}
                  {typeof item.years_experience === "number"
                    ? `${item.years_experience} an(s)`
                    : item.experience_level || "Non renseignée"}
                </p>
                <p>
                  <strong>Rayon :</strong>{" "}
                  {typeof item.service_radius_km === "number"
                    ? `${item.service_radius_km} km`
                    : "Non renseigné"}
                </p>
              </div>

              <div className={styles.pricing}>
                <span>{formatAmount(item.hourly_rate, "/ h")}</span>
                <span>{formatAmount(item.monthly_rate, "/ mois")}</span>
              </div>

              {item.property_types && item.property_types.length > 0 ? (
                <div className={styles.tags}>
                  {item.property_types.map((propertyType) => (
                    <span key={`${item.id}-property-${propertyType}`} className={styles.propertyTag}>
                      {propertyType}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className={styles.tags}>
                {item.services.length > 0 ? (
                  item.services.slice(0, 6).map((serviceLabel) => (
                    <span key={`${item.id}-${serviceLabel}`} className={styles.tag}>
                      {serviceLabel}
                    </span>
                  ))
                ) : (
                  <span className={styles.tagMuted}>Services non renseignés</span>
                )}
              </div>

              {item.latest_review_comment ? (
                <div className={styles.reviewSnippet}>
                  <strong>Avis récent</strong>
                  <p>{item.latest_review_comment}</p>
                  {item.latest_review_at ? (
                    <small>{formatReviewDate(item.latest_review_at)}</small>
                  ) : null}
                </div>
              ) : null}

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
