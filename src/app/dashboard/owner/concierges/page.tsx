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

type RequestType = "ponctuel" | "renfort" | "durable";

type RequestFormState = {
  requestType: RequestType;
  title: string;
  description: string;
  city: string;
  postalCode: string;
  desiredDate: string;
  budgetMax: string;
  urgency: boolean;
};

const initialFilters: OwnerConciergeSearchFilters = {
  city: "",
  selectedServices: [],
  propertyType: "",
  budgetMax: "",
  radiusKm: "",
  proOnly: false,
};

const initialRequestForm: RequestFormState = {
  requestType: "ponctuel",
  title: "",
  description: "",
  city: "",
  postalCode: "",
  desiredDate: "",
  budgetMax: "",
  urgency: false,
};

function formatAmount(value: number | null, suffix: string) {
  if (typeof value !== "number") return "Non renseigne";
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
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [items, setItems] = useState<ConciergeSearchRow[]>([]);
  const [selectedConciergeIds, setSelectedConciergeIds] = useState<string[]>([]);
  const [requestForm, setRequestForm] = useState<RequestFormState>(initialRequestForm);
  const [serverOptions, setServerOptions] = useState<{ services: string[]; propertyTypes: string[] }>({
    services: [],
    propertyTypes: [],
  });

  const totalPro = useMemo(() => items.filter((item) => item.is_pro).length, [items]);
  const clientOptions = useMemo(() => buildOwnerConciergeFilterOptions(items), [items]);

  const selectedConcierges = useMemo(
    () => items.filter((item) => selectedConciergeIds.includes(item.id)),
    [items, selectedConciergeIds],
  );

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

      const nextItems = Array.isArray(payload?.items) ? payload.items : [];
      setItems(nextItems);
      setSelectedConciergeIds((prev) => prev.filter((id) => nextItems.some((item) => item.id === id)));
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
    void loadConcierges(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setRequestForm((prev) => ({
      ...prev,
      city: prev.city || filters.city,
    }));
  }, [filters.city]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    void loadConcierges(filters);
  }

  function toggleConciergeSelection(itemId: string) {
    setSelectedConciergeIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
    setFeedback(null);
    setError(null);
  }

  async function handleSendRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedConciergeIds.length === 0) {
      setError("Selectionnez au moins un concierge avant d'envoyer une demande.");
      return;
    }

    if (!requestForm.title.trim()) {
      setError("Ajoutez un titre a votre demande.");
      return;
    }

    try {
      setSubmittingRequest(true);
      setError(null);
      setFeedback(null);

      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type: requestForm.requestType,
          title: requestForm.title.trim(),
          description: requestForm.description.trim(),
          requested_services: filters.selectedServices,
          city: requestForm.city.trim(),
          postal_code: requestForm.postalCode.trim(),
          desired_date: requestForm.desiredDate ? new Date(requestForm.desiredDate).toISOString() : null,
          urgency: requestForm.urgency,
          budget_max: requestForm.budgetMax ? Number(requestForm.budgetMax) : null,
          currency: "EUR",
          recipient_ids: selectedConciergeIds,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'envoyer votre demande.");
      }

      setFeedback(
        `Demande envoyee a ${selectedConciergeIds.length} concierge(s). Vous pouvez maintenant suivre les retours.`,
      );
      setSelectedConciergeIds([]);
      setRequestForm({
        ...initialRequestForm,
        city: filters.city,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer votre demande.");
    } finally {
      setSubmittingRequest(false);
    }
  }

  return (
    <section className="dashboard-grid">
      <div className={styles.page}>
        <header className={styles.hero}>
          <span className={styles.eyebrow}>Mise en relation</span>
          <h1 className={styles.title}>Trouver un concierge</h1>
          <p className={styles.description}>
            Filtrez par zone, services, type de bien, budget et rayon, puis envoyez une vraie
            demande aux profils que vous retenez.
          </p>
          <div className={styles.chips}>
            <span className={styles.chip}>{items.length} concierge(s)</span>
            <span className={styles.chip}>{totalPro} profil(s) PRO</span>
            <span className={styles.chip}>
              {selectedConciergeIds.length > 0
                ? `${selectedConciergeIds.length} concierge(s) selectionne(s)`
                : "Aucune selection"}
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
            <span className={styles.blockLabel}>Services recherches</span>
            <div className={styles.serviceChips}>
              {serviceOptions.length === 0 ? (
                <span className={styles.tagMuted}>
                  Les services apparaitront apres le premier chargement.
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
                void loadConcierges(initialFilters);
              }}
              disabled={loading}
            >
              Reinitialiser
            </button>
          </div>
        </form>

        <form className={styles.requestPanel} onSubmit={handleSendRequest}>
          <div className={styles.requestHeader}>
            <div>
              <p className={styles.eyebrow}>Demande</p>
              <h2 className={styles.requestTitle}>Envoyer un brief a vos concierges selectionnes</h2>
            </div>
            <span className={styles.requestCount}>{selectedConciergeIds.length} cible(s)</span>
          </div>

          <div className={styles.selectedList}>
            {selectedConcierges.length > 0 ? (
              selectedConcierges.map((item) => (
                <span key={item.id} className={styles.selectedChip}>
                  {item.display_name}
                </span>
              ))
            ) : (
              <span className={styles.tagMuted}>
                Selectionnez un ou plusieurs concierges dans la liste ci-dessous.
              </span>
            )}
          </div>

          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span>Type de demande</span>
              <select
                value={requestForm.requestType}
                onChange={(event) =>
                  setRequestForm((prev) => ({
                    ...prev,
                    requestType: event.target.value as RequestType,
                  }))
                }
              >
                <option value="ponctuel">Besoin ponctuel</option>
                <option value="renfort">Remplacement / renfort</option>
                <option value="durable">Besoin durable</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>Ville</span>
              <input
                value={requestForm.city}
                onChange={(event) =>
                  setRequestForm((prev) => ({ ...prev, city: event.target.value }))
                }
                placeholder="Ville d'intervention"
              />
            </label>

            <label className={styles.field}>
              <span>Code postal</span>
              <input
                value={requestForm.postalCode}
                onChange={(event) =>
                  setRequestForm((prev) => ({ ...prev, postalCode: event.target.value }))
                }
                placeholder="75015"
              />
            </label>

            <label className={styles.field}>
              <span>Date souhaitee</span>
              <input
                type="datetime-local"
                value={requestForm.desiredDate}
                onChange={(event) =>
                  setRequestForm((prev) => ({ ...prev, desiredDate: event.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span>Budget max</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={requestForm.budgetMax}
                onChange={(event) =>
                  setRequestForm((prev) => ({ ...prev, budgetMax: event.target.value }))
                }
                placeholder="120"
              />
            </label>

            <label className={styles.field}>
              <span>Titre</span>
              <input
                value={requestForm.title}
                onChange={(event) =>
                  setRequestForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Ex: besoin de check-in ce week-end"
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>Description</span>
            <textarea
              className={styles.requestTextarea}
              value={requestForm.description}
              onChange={(event) =>
                setRequestForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Expliquez la situation, le logement, l'urgence et ce que vous attendez."
              rows={5}
            />
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={requestForm.urgency}
              onChange={(event) =>
                setRequestForm((prev) => ({ ...prev, urgency: event.target.checked }))
              }
            />
            <span>Cette demande est urgente</span>
          </label>

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={submittingRequest || selectedConciergeIds.length === 0}
            >
              {submittingRequest ? "Envoi..." : "Envoyer ma demande"}
            </button>
            <Link href="/dashboard/owner/conciergerie" className={styles.secondaryBtn}>
              Voir mon suivi concierge
            </Link>
          </div>
        </form>

        {error ? <p className={styles.errorBox}>{error}</p> : null}
        {feedback ? <p className={styles.successBox}>{feedback}</p> : null}

        {!loading && !error && items.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Aucun concierge ne correspond a vos criteres.</h2>
            <p>Essayez d'elargir la zone, de relever le budget ou de retirer un filtre service.</p>
          </div>
        ) : null}

        <div className={styles.grid}>
          {items.map((item) => {
            const isSelected = selectedConciergeIds.includes(item.id);

            return (
              <article key={item.id} className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}>
                <div className={styles.cardHead}>
                  <div>
                    <h2>{item.display_name}</h2>
                    <p>{item.city || item.service_area || "Zone non renseignee"}</p>
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
                    <span className={styles.tagMuted}>Services non renseignes</span>
                  )}
                </div>

                {item.latest_review_comment ? (
                  <div className={styles.reviewSnippet}>
                    <strong>Avis recent</strong>
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
                    onClick={() => toggleConciergeSelection(item.id)}
                  >
                    {isSelected ? "Retirer de la demande" : "Selectionner"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
