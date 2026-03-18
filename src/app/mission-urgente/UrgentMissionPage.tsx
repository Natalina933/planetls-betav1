"use client";

import { useMemo, useState } from "react";
import { Button, ButtonLink, Input, Select, Textarea } from "@/components/ui";
import styles from "./UrgentMissionPage.module.scss";

type MissionType = "check-in" | "check-out";

type MatchItem = {
  concierge_id: string;
  display_name: string;
  city: string | null;
  service_area: string | null;
  average_rating: number | null;
  reviews_count: number;
  estimated_intervention_minutes: number;
  estimated_price: number | null;
  is_available_now: boolean;
  distance_km: number;
};

type ApiResponse = {
  error?: string;
  broadcast_count?: number;
  matches?: MatchItem[];
};

const initialForm = {
  mission_type: "check-in" as MissionType,
  scheduled_at: "",
  property_address: "",
  traveler_count: "2",
  spoken_language: "Francais",
  special_instructions: "",
  key_handover_type: "Boite a cle",
  contact_phone: "",
  contact_email: "",
};

function formatPrice(value: number | null) {
  return typeof value === "number" ? `${value.toFixed(0)} EUR estime` : "Prix sur validation";
}

function formatEta(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const extra = minutes % 60;
  return extra > 0 ? `${hours} h ${extra}` : `${hours} h`;
}

export default function UrgentMissionPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [broadcastCount, setBroadcastCount] = useState(0);

  const selectedLabel = useMemo(
    () => (form.mission_type === "check-in" ? "check-in" : "check-out"),
    [form.mission_type],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/urgent-missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          traveler_count: Number(form.traveler_count || "0"),
        }),
      });

      const payload = (await response.json()) as ApiResponse;
      if (!response.ok) {
        throw new Error(payload.error || "Impossible de poster la mission urgente.");
      }

      setMatches(Array.isArray(payload.matches) ? payload.matches : []);
      setBroadcastCount(payload.broadcast_count ?? 0);
      setSuccess("Mission urgente envoyee. Le broadcast est en cours vers les concierges compatibles.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de poster la mission urgente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Mission urgente</span>
          <h1>Besoin d&apos;un {selectedLabel} en urgence ?</h1>
          <p>
            Trouvez un concierge disponible en moins de 24h, diffusez la demande en simultane et
            verrouillez la mission au premier acceptant.
          </p>
          <div className={styles.heroActions}>
            <ButtonLink href="/dashboard/owner/mission-urgente" variant="secondary" className={styles.secondaryLink}>
              Suivre mes urgences
            </ButtonLink>
            <ButtonLink href="/dashboard/concierge/urgences" variant="secondary" className={styles.secondaryLink}>
              Voir les opportunites concierge
            </ButtonLink>
          </div>
        </div>

        <div className={styles.heroCard}>
          <strong>3 minutes pour declencher l&apos;intervention</strong>
          <ul>
            <li>Formulaire ultra court</li>
            <li>Matching instantane par zone, dispo et rapidite</li>
            <li>Broadcast simultane puis mission verrouillee</li>
          </ul>
        </div>
      </section>

      <section className={styles.layout}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate aria-labelledby="urgent-mission-form-title">
          <h2 id="urgent-mission-form-title" className={styles.formTitle}>
            Détailler la mission urgente
          </h2>
          <div className={styles.section}>
            <span className={styles.step}>1. Type de mission</span>
            <fieldset className={styles.toggleGroup}>
              <legend className={styles.visuallyHidden}>Type de mission</legend>
              <div className={styles.toggleRow}>
              {(["check-in", "check-out"] as MissionType[]).map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={form.mission_type === option ? styles.toggleActive : styles.toggle}
                  onClick={() => setForm((prev) => ({ ...prev, mission_type: option }))}
                  aria-pressed={form.mission_type === option}
                >
                  {option === "check-in" ? "Check-in" : "Check-out"}
                </Button>
              ))}
              </div>
            </fieldset>
          </div>

          <div className={styles.grid}>
            <label className={styles.field}>
              <span>2. Date et heure exacte</span>
              <Input
                bare
                id="urgent-scheduled-at"
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, scheduled_at: event.target.value }))
                }
                required
              />
            </label>

            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span>3. Adresse</span>
              <Input
                bare
                id="urgent-property-address"
                value={form.property_address}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, property_address: event.target.value }))
                }
                placeholder="12 rue des Tilleuls, Annecy"
                required
              />
            </label>

            <label className={styles.field}>
              <span>4. Nombre de voyageurs</span>
              <Input
                bare
                id="urgent-traveler-count"
                type="number"
                min="1"
                value={form.traveler_count}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, traveler_count: event.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span>Langue parlee</span>
              <Input
                bare
                id="urgent-spoken-language"
                value={form.spoken_language}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, spoken_language: event.target.value }))
                }
                placeholder="Francais, Anglais"
              />
            </label>

            <label className={styles.field}>
              <span>Remise de cles</span>
              <Select
                id="urgent-key-handover"
                value={form.key_handover_type}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, key_handover_type: event.target.value }))
                }
              >
                <option value="Boite a cle">Boite a cle</option>
                <option value="Remise physique">Remise physique</option>
                <option value="Serrure connectee">Serrure connectee</option>
              </Select>
            </label>

            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span>Instructions particulieres</span>
              <Textarea
                id="urgent-special-instructions"
                rows={4}
                value={form.special_instructions}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, special_instructions: event.target.value }))
                }
                placeholder="Code portail, infos voyageurs, details clefs, contraintes d'acces..."
              />
            </label>

            <label className={styles.field}>
              <span>5. Telephone</span>
              <Input
                bare
                id="urgent-contact-phone"
                type="tel"
                value={form.contact_phone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, contact_phone: event.target.value }))
                }
                placeholder="06 12 34 56 78"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Email</span>
              <Input
                bare
                id="urgent-contact-email"
                type="email"
                value={form.contact_email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, contact_email: event.target.value }))
                }
                placeholder="vous@exemple.fr"
              />
            </label>
          </div>

          <Button type="submit" variant="primary" size="lg" className={styles.primaryButton} disabled={loading}>
            {loading ? "Recherche des concierges..." : "Lancer la mission urgente"}
          </Button>

          {error ? (
            <p className={styles.errorBox} role="alert" aria-live="assertive">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className={styles.successBox} role="status" aria-live="polite">
              {success}
            </p>
          ) : null}
        </form>

        <aside className={styles.results}>
          <div className={styles.resultHeader}>
            <span className={styles.step}>Matching instantane</span>
            <h2>
              {broadcastCount > 0
                ? `${broadcastCount} concierges disponibles pour intervenir`
                : "Aucun matching lance pour l'instant"}
            </h2>
            <p>
              Les profils sont classes par disponibilite immediate, temps de reponse moyen, note
              et proximite.
            </p>
          </div>

          <div className={styles.matchList}>
            {matches.length === 0 ? (
              <div className={styles.emptyState}>
                <strong>Le matching apparaitra ici apres validation.</strong>
                <p>Vous verrez le badge de disponibilite, l&apos;ETA et le prix estime.</p>
              </div>
            ) : (
              matches.slice(0, 6).map((match) => (
                <article key={match.concierge_id} className={styles.matchCard}>
                  <div className={styles.matchTop}>
                    <div>
                      <h3>{match.display_name}</h3>
                      <p>{match.city || match.service_area || "Zone renseignee a la demande"}</p>
                    </div>
                    {match.is_available_now ? (
                      <span className={styles.availableBadge}>Disponible maintenant</span>
                    ) : (
                      <span className={styles.waitBadge}>Disponible a confirmer</span>
                    )}
                  </div>

                  <div className={styles.matchStats}>
                    <span>Intervention estimee: {formatEta(match.estimated_intervention_minutes)}</span>
                    <span>Distance: {match.distance_km.toFixed(0)} km</span>
                    <span>
                      Note: {typeof match.average_rating === "number" ? `${match.average_rating}/5` : "Nouveau profil"}
                    </span>
                    <span>{formatPrice(match.estimated_price)}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
