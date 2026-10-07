"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, CalendarClock, CheckCircle2 } from "lucide-react";
import { Alert, Button, Input, Select, Textarea } from "@/components/ui";
import styles from "./page.module.scss";

type HousingOption = {
  id: string;
  name: string;
  city: string;
  ownerId: string | null;
};

type CollaborationItem = {
  id: string;
  owner?: { id?: string; name?: string | null };
  housing?: { id?: number | string; name?: string | null };
};

type HousingRow = {
  id: number | string;
  nom_logement?: string | null;
  ville?: string | null;
};

type Priority = "low" | "normal" | "high" | "urgent";

const INTERVENTION_TYPES = [
  { value: "check-in-check-out", label: "Check-in / Check-out" },
  { value: "menage", label: "Ménage" },
  { value: "maintenance", label: "Maintenance" },
  { value: "intendance", label: "Intendance" },
  { value: "accueil-voyageurs", label: "Accueil voyageurs" },
  { value: "urgence-de-nuit", label: "Urgence de nuit" },
] as const;

const PRIORITIES: Array<{ value: Priority; label: string }> = [
  { value: "low", label: "Faible" },
  { value: "normal", label: "Normale" },
  { value: "high", label: "Élevée" },
  { value: "urgent", label: "Urgente" },
];

function todayInputValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toScheduledStart(date: string, time: string) {
  const value = new Date(`${date}T${time}:00`);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

function getErrorMessage(status: number, fallback?: string) {
  if (status === 403) return "Vous n'êtes pas autorisée à créer une intervention pour ce logement.";
  if (status === 409) return "Ce séjour ne correspond pas au logement sélectionné.";
  if (fallback) return fallback;
  return "Une erreur est survenue lors de la création de l'intervention.";
}

export default function NewConciergeInterventionPage() {
  const [housingOptions, setHousingOptions] = useState<HousingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [housingId, setHousingId] = useState("");
  const [interventionType, setInterventionType] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [instructions, setInstructions] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdMissionId, setCreatedMissionId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadHousing() {
      setLoading(true);
      setLoadError("");
      try {
        const [collaborationsResponse, housingResponse] = await Promise.all([
          fetch("/api/housing-collaborations?status=active", { cache: "no-store" }),
          fetch("/api/housing", { cache: "no-store" }),
        ]);

        if (!collaborationsResponse.ok) {
          throw new Error("Impossible de charger vos collaborations actives.");
        }
        if (!housingResponse.ok) {
          throw new Error("Impossible de charger vos logements.");
        }

        const collaborationsPayload = (await collaborationsResponse.json()) as { items?: CollaborationItem[] };
        const housingPayload = (await housingResponse.json()) as HousingRow[];
        const housingById = new Map((Array.isArray(housingPayload) ? housingPayload : []).map((item) => [String(item.id), item]));

        const options = (collaborationsPayload.items ?? [])
          .map((item) => {
            const id = item.housing?.id != null ? String(item.housing.id) : "";
            if (!id) return null;
            const housing = housingById.get(id);
            return {
              id,
              name: item.housing?.name?.trim() || housing?.nom_logement?.trim() || `Logement ${id}`,
              city: housing?.ville?.trim() || "Ville non renseignée",
              ownerId: item.owner?.id ?? null,
            };
          })
          .filter(Boolean) as HousingOption[];

        if (!active) return;
        setHousingOptions(options);
        setHousingId((current) => current || options[0]?.id || "");
      } catch (error) {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "Impossible de charger vos logements.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadHousing();

    return () => {
      active = false;
    };
  }, []);

  const selectedHousing = useMemo(
    () => housingOptions.find((option) => option.id === housingId) ?? null,
    [housingId, housingOptions],
  );
  const selectedType = INTERVENTION_TYPES.find((item) => item.value === interventionType) ?? null;
  const canSubmit = !submitting && housingOptions.length > 0 && !createdMissionId;

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!housingId) nextErrors.housing = "Sélectionnez le logement concerné.";
    if (!interventionType) nextErrors.type = "Sélectionnez le type d'intervention.";
    if (!date) nextErrors.date = "Indiquez une date.";
    if (!time) nextErrors.time = "Indiquez une heure.";
    if (date && time && !toScheduledStart(date, time)) {
      nextErrors.date = "La date ou l'heure est invalide.";
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || createdMissionId) return;
    setSubmitError("");

    if (!validate()) return;
    const scheduledStart = toScheduledStart(date, time);
    if (!scheduledStart || !selectedType) return;

    setSubmitting(true);
    try {
      const title = selectedHousing?.name ? `${selectedType.label} — ${selectedHousing.name}` : selectedType.label;
      const payload = {
        title,
        description: instructions.trim() || null,
        reservation_id: null,
        status: "scheduled",
        priority,
        scheduled_start: scheduledStart,
        metadata: {
          source: "manual_concierge_intervention",
          intervention_type: selectedType.value,
          property_housing_id: housingId,
        },
      };

      const response = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responsePayload = (await response.json().catch(() => null)) as { id?: string; error?: string } | null;

      if (!response.ok) {
        throw new Error(getErrorMessage(response.status, responsePayload?.error));
      }

      setCreatedMissionId(responsePayload?.id ?? "created");
    } catch (error) {
      const message =
        error instanceof TypeError
          ? "Impossible de créer l'intervention. Vérifiez votre connexion et réessayez."
          : error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de la création de l'intervention.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.shell} aria-labelledby="intervention-title">
        <Link href="/dashboard/concierge" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" />
          Retour au dashboard
        </Link>

        <header className={styles.header}>
          <span className={styles.iconWrap} aria-hidden="true">
            <CalendarClock size={24} />
          </span>
          <div>
            <p className={styles.eyebrow}>Planning opérationnel</p>
            <h1 id="intervention-title">Ajouter une intervention</h1>
            <p>Planifiez une intervention pour l'un de vos logements suivis.</p>
          </div>
        </header>

        {loadError ? <Alert tone="danger" title="Chargement impossible">{loadError}</Alert> : null}

        {!loading && housingOptions.length === 0 ? (
          <Alert
            tone="warning"
            title="Aucun logement disponible"
            action={<Link href="/dashboard/concierge/demandes">Voir mes demandes</Link>}
          >
            Une collaboration active avec un propriétaire est nécessaire avant de pouvoir ajouter une intervention.
          </Alert>
        ) : null}

        {createdMissionId ? (
          <Alert
            tone="success"
            title="Intervention ajoutée"
            action={
              <div className={styles.successActions}>
                <Link href="/dashboard/concierge/planning" className={styles.successPrimary}>
                  Voir dans mon planning
                </Link>
                <Link href="/dashboard/concierge" className={styles.successSecondary}>
                  Fermer
                </Link>
              </div>
            }
          >
            Elle a été ajoutée à votre planning.
          </Alert>
        ) : null}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.fieldGroup}>
            <Select
              id="housing"
              label="Logement"
              value={housingId}
              onChange={(event) => setHousingId(event.target.value)}
              disabled={loading || housingOptions.length === 0 || Boolean(createdMissionId)}
              error={fieldErrors.housing}
              required
            >
              <option value="">{loading ? "Chargement des logements..." : "Sélectionnez un logement"}</option>
              {housingOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} — {option.city}
                </option>
              ))}
            </Select>
            <p className={styles.helper}>Sélectionnez le logement concerné.</p>
          </div>

          <div className={styles.fieldGroup}>
            <Select id="reservation" label="Séjour associé" value="" disabled>
              <option value="">Aucun séjour associé</option>
            </Select>
            <p className={styles.helper}>Facultatif. Cette première version crée une intervention indépendante.</p>
          </div>

          <div className={styles.fieldGroup}>
            <Select
              id="intervention-type"
              label="Type d'intervention"
              value={interventionType}
              onChange={(event) => setInterventionType(event.target.value)}
              disabled={Boolean(createdMissionId)}
              error={fieldErrors.type}
              required
            >
              <option value="">Sélectionnez un type</option>
              {INTERVENTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>

          <div className={styles.dateRow}>
            <Input
              id="intervention-date"
              label="Date"
              type="date"
              value={date}
              min={todayInputValue()}
              onChange={(event) => setDate(event.target.value)}
              disabled={Boolean(createdMissionId)}
              error={fieldErrors.date}
              required
            />
            <Input
              id="intervention-time"
              label="Heure"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              disabled={Boolean(createdMissionId)}
              error={fieldErrors.time}
              required
            />
          </div>

          <Select
            id="priority"
            label="Priorité"
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
            disabled={Boolean(createdMissionId)}
          >
            {PRIORITIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>

          <div className={styles.fieldGroup}>
            <Textarea
              id="instructions"
              label="Consignes"
              rows={5}
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Ajoutez les informations utiles pour réaliser l'intervention..."
              disabled={Boolean(createdMissionId)}
            />
            <p className={styles.helper}>Accès, matériel, instructions particulières...</p>
          </div>

          {submitError ? (
            <Alert tone="danger" appearance="inline" announcement="assertive">
              {submitError}
            </Alert>
          ) : null}

          <div className={styles.actions}>
            <Link href="/dashboard/concierge" className={styles.cancelLink}>
              Annuler
            </Link>
            <Button type="submit" disabled={!canSubmit} className={styles.submitButton}>
              {submitting ? "Création..." : createdMissionId ? (
                <>
                  <CheckCircle2 size={17} aria-hidden="true" />
                  Intervention créée
                </>
              ) : (
                "Créer l'intervention"
              )}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
