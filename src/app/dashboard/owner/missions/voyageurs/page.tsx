"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Copy,
  Home,
  Mail,
  MessageSquareText,
  Phone,
  Plus,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button, ButtonLink, Input, Select, Textarea } from "@/components/ui";
import { formatDateValue } from "@/app/utils/formatters";
import styles from "./OwnerTravelerMissionsPage.module.scss";
import { isAcceptedMissionPartner, isUuidLike } from "../missionPartnerUtils";

type HousingRow = {
  id: string | number;
  nom_logement?: string | null;
  ville?: string | null;
};

type PartnerRequestRow = {
  id: string;
  title?: string | null;
  property_id?: string | null;
  property_name?: string | null;
  city?: string | null;
  selected_concierge_profile_id?: string | null;
  selected_concierge_name?: string | null;
  status?: string | null;
  workflow_status?: string | null;
  mission_id?: string | null;
  recipients?: Array<{ status?: string | null }> | null;
};

type MissionRow = {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  property_id: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  metadata?: Record<string, unknown> | null;
};

type TravelerMissionForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  adults: string;
  children: string;
  hasBaby: string;
  language: string;
  arrivalDate: string;
  departureDate: string;
  arrivalTime: string;
  departureTime: string;
  propertyId: string;
  conciergeProfileId: string;
  bookingPlatform: string;
  bookingCode: string;
  actions: string[];
  priority: "normal" | "high" | "urgent";
  specialWelcome: string;
  notes: string;
  internalNotes: string;
  issueFlag: string;
};

const initialForm: TravelerMissionForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  adults: "2",
  children: "0",
  hasBaby: "no",
  language: "fr",
  arrivalDate: "",
  departureDate: "",
  arrivalTime: "16:00",
  departureTime: "10:00",
  propertyId: "",
  conciergeProfileId: "",
  bookingPlatform: "Airbnb",
  bookingCode: "",
  actions: ["checkin", "cleaning", "linen"],
  priority: "normal",
  specialWelcome: "",
  notes: "",
  internalNotes: "",
  issueFlag: "none",
};

const actionOptions = [
  { value: "checkin", label: "Check-in" },
  { value: "checkout", label: "Check-out" },
  { value: "cleaning", label: "Ménage" },
  { value: "linen", label: "Linge" },
  { value: "quality_check", label: "Contrôle" },
  { value: "maintenance", label: "Maintenance" },
  { value: "welcome", label: "Accueil spécifique" },
];

const statusOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "draft", label: "Nouveau séjour" },
  { value: "assigned", label: "Arrivée prévue" },
  { value: "accepted", label: "Acceptée" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Terminé" },
  { value: "canceled", label: "Annulé" },
];

function buildDateTime(date: string, time: string) {
  if (!date) return null;
  const parsed = new Date(`${date}T${time || "00:00"}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function getMetadataString(mission: MissionRow, key: string) {
  const value = mission.metadata?.[key];
  return typeof value === "string" ? value : "";
}

function getPropertyLabel(housing: HousingRow[], propertyId: string | null) {
  const property = housing.find((item) => String(item.id) === String(propertyId ?? ""));
  return property?.nom_logement || property?.ville || "Logement à préciser";
}

function getMissionHousingId(mission: MissionRow) {
  const housingId = mission.metadata?.housing_id;
  return mission.property_id || (typeof housingId === "string" ? housingId : null);
}

function getGuestCount(mission: MissionRow) {
  const adults = Number(mission.metadata?.guest_adults ?? 0);
  const children = Number(mission.metadata?.guest_children ?? 0);
  const baby = mission.metadata?.guest_baby === true ? 1 : 0;
  const total = adults + children + baby;
  return total > 0 ? total : "-";
}

function getTravelerName(mission: MissionRow) {
  return (
    [getMetadataString(mission, "guest_first_name"), getMetadataString(mission, "guest_last_name")]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    mission.title ||
    "Voyageur"
  );
}

function buildTitle(form: TravelerMissionForm) {
  const name = [form.firstName, form.lastName].filter(Boolean).join(" ").trim() || "voyageurs";
  return `Séjour ${name}`;
}

function buildResetForm(current: TravelerMissionForm): TravelerMissionForm {
  return {
    ...initialForm,
    propertyId: current.propertyId,
    conciergeProfileId: current.conciergeProfileId,
    bookingPlatform: current.bookingPlatform,
  };
}

export default function OwnerTravelerMissionsPage() {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [housing, setHousing] = useState<HousingRow[]>([]);
  const [partners, setPartners] = useState<PartnerRequestRow[]>([]);
  const [form, setForm] = useState<TravelerMissionForm>(initialForm);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [missionsResponse, housingResponse, requestsResponse] = await Promise.all([
        fetch("/api/missions?scope=owner&limit=100", { cache: "no-store" }),
        fetch("/api/housing", { cache: "no-store" }),
        fetch("/api/service-requests?limit=100", { cache: "no-store" }),
      ]);

      const missionsPayload = await missionsResponse.json();
      const housingPayload = await housingResponse.json();
      const requestsPayload = await requestsResponse.json();

      if (!missionsResponse.ok) throw new Error(missionsPayload?.error || "Impossible de charger les missions.");
      if (!housingResponse.ok) throw new Error(housingPayload?.error || "Impossible de charger les logements.");
      if (!requestsResponse.ok) throw new Error(requestsPayload?.error || "Impossible de charger les partenaires.");

      const nextHousing = Array.isArray(housingPayload) ? housingPayload : [];
      const acceptedPartners = (Array.isArray(requestsPayload?.items) ? requestsPayload.items : []).filter(
        isAcceptedMissionPartner,
      );

      setMissions(
        (Array.isArray(missionsPayload) ? missionsPayload : []).filter(
          (mission: MissionRow) => mission.metadata?.mission_kind === "traveler_stay",
        ),
      );
      setHousing(nextHousing);
      setPartners(acceptedPartners);
      setForm((current) => ({
        ...current,
        propertyId: current.propertyId || String(nextHousing[0]?.id ?? ""),
        conciergeProfileId:
          current.conciergeProfileId || acceptedPartners[0]?.selected_concierge_profile_id || "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger l'espace séjours.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredMissions = useMemo(
    () =>
      missions.filter((mission) => statusFilter === "all" || (mission.status ?? "draft") === statusFilter),
    [missions, statusFilter],
  );

  const upcomingCount = useMemo(
    () => missions.filter((mission) => mission.status !== "completed" && mission.status !== "canceled").length,
    [missions],
  );

  const urgentCount = useMemo(
    () => missions.filter((mission) => mission.priority === "urgent" || mission.metadata?.issue_flag === "urgent").length,
    [missions],
  );

  const completedCount = useMemo(
    () => missions.filter((mission) => mission.status === "completed").length,
    [missions],
  );

  const stats = [
    { label: "Séjours", value: loading ? "..." : String(missions.length), icon: <Users size={18} /> },
    { label: "À venir", value: loading ? "..." : String(upcomingCount), icon: <CalendarClock size={18} /> },
    { label: "Urgences", value: loading ? "..." : String(urgentCount), icon: <Bell size={18} /> },
    { label: "Terminées", value: loading ? "..." : String(completedCount), icon: <CheckCircle2 size={18} /> },
    { label: "Partenaires", value: loading ? "..." : String(partners.length), icon: <ShieldCheck size={18} /> },
  ];

  function updateForm<K extends keyof TravelerMissionForm>(key: K, value: TravelerMissionForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleAction(action: string) {
    setForm((current) => ({
      ...current,
      actions: current.actions.includes(action)
        ? current.actions.filter((item) => item !== action)
        : [...current.actions, action],
    }));
  }

  function duplicateMission(mission: MissionRow) {
    setForm({
      ...initialForm,
      firstName: getMetadataString(mission, "guest_first_name"),
      lastName: getMetadataString(mission, "guest_last_name"),
      phone: getMetadataString(mission, "guest_phone"),
      email: getMetadataString(mission, "guest_email"),
      adults: String(mission.metadata?.guest_adults ?? "2"),
      children: String(mission.metadata?.guest_children ?? "0"),
      hasBaby: mission.metadata?.guest_baby === true ? "yes" : "no",
      language: getMetadataString(mission, "guest_language") || "fr",
      propertyId: String(getMissionHousingId(mission) ?? ""),
      conciergeProfileId: getMetadataString(mission, "concierge_profile_id"),
      bookingPlatform: getMetadataString(mission, "booking_platform") || "Airbnb",
      actions: Array.isArray(mission.metadata?.requested_actions)
        ? (mission.metadata?.requested_actions as string[])
        : initialForm.actions,
      priority: (mission.priority as TravelerMissionForm["priority"]) || "normal",
      specialWelcome: getMetadataString(mission, "special_welcome"),
      notes: mission.description || "",
      internalNotes: getMetadataString(mission, "internal_notes"),
      issueFlag: getMetadataString(mission, "issue_flag") || "none",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.firstName.trim() && !form.lastName.trim()) {
      setError("Renseignez au moins le nom ou prénom du voyageur.");
      return;
    }
    if (!form.arrivalDate || !form.departureDate) {
      setError("Renseignez les dates d'arrivée et de départ.");
      return;
    }
    if (partners.length === 0) {
      setError("Aucune conciergerie partenaire acceptée n'est disponible. Acceptez d'abord un devis ou une demande partenaire.");
      return;
    }
    if (!isUuidLike(form.conciergeProfileId)) {
      setError("Sélectionnez une conciergerie partenaire acceptée.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concierge_profile_id: form.conciergeProfileId,
          property_id: isUuidLike(form.propertyId) ? form.propertyId : null,
          title: buildTitle(form),
          description: form.notes.trim() || null,
          status: "assigned",
          priority: form.issueFlag === "urgent" ? "urgent" : form.priority,
          scheduled_start: buildDateTime(form.arrivalDate, form.arrivalTime),
          scheduled_end: buildDateTime(form.departureDate, form.departureTime),
          metadata: {
            mission_kind: "traveler_stay",
            housing_id: form.propertyId || null,
            concierge_profile_id: form.conciergeProfileId,
            guest_first_name: form.firstName.trim(),
            guest_last_name: form.lastName.trim(),
            guest_phone: form.phone.trim(),
            guest_email: form.email.trim(),
            guest_adults: Number(form.adults || 0),
            guest_children: Number(form.children || 0),
            guest_baby: form.hasBaby === "yes",
            guest_language: form.language,
            arrival_date: form.arrivalDate,
            departure_date: form.departureDate,
            arrival_time: form.arrivalTime,
            departure_time: form.departureTime,
            booking_platform: form.bookingPlatform,
            booking_code: form.bookingCode.trim(),
            requested_actions: form.actions,
            special_welcome: form.specialWelcome.trim(),
            internal_notes: form.internalNotes.trim(),
            issue_flag: form.issueFlag,
            notification_reason: "new_traveler_mission",
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Impossible de créer la mission voyageur.");

      setSuccess("Mission voyageur créée. Vous pouvez saisir un nouveau séjour.");
      setForm((current) => buildResetForm(current));
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer la mission voyageur.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Missions voyageurs</p>
          <h1>Séjours voyageurs</h1>
          <p>
            Transmettez à votre conciergerie les arrivées, départs, voyageurs, consignes et actions terrain dans
            un espace clair, séparé des demandes commerciales.
          </p>
          <div className={styles.heroActions}>
            <a href="#nouvelle-mission-voyageur" className={styles.primaryLink}>
              <Plus size={16} aria-hidden="true" /> Nouveau séjour
            </a>
            <ButtonLink href="/dashboard/owner/planning" variant="secondary">
              <CalendarClock size={16} aria-hidden="true" /> Planning
            </ButtonLink>
            <ButtonLink href="/dashboard/owner/conciergerie/partenaires" variant="secondary">
              <ShieldCheck size={16} aria-hidden="true" /> Partenaires acceptés
            </ButtonLink>
          </div>
        </div>
        <div className={styles.heroSnapshot}>
          <span><Send size={16} /> Séjours transmis</span>
          <strong>{loading ? "..." : upcomingCount}</strong>
          <p>missions à venir</p>
          <div className={styles.heroProgress}>
            <span style={{ width: `${Math.min(100, Math.max(12, missions.length * 18))}%` }} />
          </div>
        </div>
      </header>

      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}
      {success ? <p className={`${styles.message} ${styles.messageSuccess}`}>{success}</p> : null}

      <section className={styles.statsGrid} aria-label="Statistiques missions voyageurs">
        {stats.map((stat) => (
          <article key={stat.label} className={styles.statCard}>
            <span className={styles.statIcon}>{stat.icon}</span>
            <div>
              <strong>{stat.value}</strong>
              <p>{stat.label}</p>
            </div>
          </article>
        ))}
      </section>

      <section id="nouvelle-mission-voyageur" className={styles.creationPanel}>
        <div className={styles.travelerMissionPage}>

        <section className={styles.travelerMissionHero}>
          <div>
            <p className={styles.eyebrow}>Séjour opérationnel</p>
            <h1>Créer une mission voyageur en moins de 2 minutes</h1>
            <p className={styles.meta}>
              Voyageurs, horaires, logement, checklist et notes restent centralisés dans la mission. Les demandes de conciergerie restent dans l&apos;espace Conciergeries.
            </p>
          </div>
          <div className={styles.travelerHeroSteps}>
            <span>1. Voyageurs</span>
            <span>2. Séjour</span>
            <span>3. Actions</span>
          </div>
        </section>

        <div className={styles.travelerMissionLayout}>
          <form className={styles.travelerMissionForm} onSubmit={handleSubmit}>
            <section className={styles.travelerFormSection}>
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.eyebrow}>Voyageurs</p>
                  <h2>Identité et contact</h2>
                </div>
              </div>
              <div className={styles.travelerFieldGrid}>
                <label className={styles.label}>
                  Prénom
                  <Input value={form.firstName} onChange={(event) => updateForm("firstName", event.target.value)} />
                </label>
                <label className={styles.label}>
                  Nom
                  <Input value={form.lastName} onChange={(event) => updateForm("lastName", event.target.value)} />
                </label>
                <label className={styles.label}>
                  Téléphone
                  <Input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} />
                </label>
                <label className={styles.label}>
                  Email
                  <Input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} />
                </label>
                <label className={styles.label}>
                  Adultes
                  <Input type="number" min="0" value={form.adults} onChange={(event) => updateForm("adults", event.target.value)} />
                </label>
                <label className={styles.label}>
                  Enfants
                  <Input type="number" min="0" value={form.children} onChange={(event) => updateForm("children", event.target.value)} />
                </label>
                <label className={styles.label}>
                  Bébé
                  <Select value={form.hasBaby} onChange={(event) => updateForm("hasBaby", event.target.value)}>
                    <option value="no">Non</option>
                    <option value="yes">Oui</option>
                  </Select>
                </label>
                <label className={styles.label}>
                  Langue
                  <Select value={form.language} onChange={(event) => updateForm("language", event.target.value)}>
                    <option value="fr">Français</option>
                    <option value="en">Anglais</option>
                    <option value="es">Espagnol</option>
                    <option value="de">Allemand</option>
                    <option value="it">Italien</option>
                  </Select>
                </label>
              </div>
            </section>

            <section className={styles.travelerFormSection}>
              <p className={styles.eyebrow}>Séjour</p>
              <div className={styles.travelerFieldGrid}>
                <label className={styles.label}>
                  Date arrivée
                  <Input type="date" value={form.arrivalDate} onChange={(event) => updateForm("arrivalDate", event.target.value)} />
                </label>
                <label className={styles.label}>
                  Heure arrivée
                  <Input type="time" value={form.arrivalTime} onChange={(event) => updateForm("arrivalTime", event.target.value)} />
                </label>
                <label className={styles.label}>
                  Date départ
                  <Input type="date" value={form.departureDate} onChange={(event) => updateForm("departureDate", event.target.value)} />
                </label>
                <label className={styles.label}>
                  Heure départ
                  <Input type="time" value={form.departureTime} onChange={(event) => updateForm("departureTime", event.target.value)} />
                </label>
                <label className={styles.label}>
                  Logement
                  <Select value={form.propertyId} onChange={(event) => updateForm("propertyId", event.target.value)}>
                    <option value="">Choisir</option>
                    {housing.map((item) => (
                      <option key={String(item.id)} value={String(item.id)}>
                        {item.nom_logement || item.ville || "Logement"}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className={styles.label}>
                  Conciergerie partenaire
                  <Select value={form.conciergeProfileId} onChange={(event) => updateForm("conciergeProfileId", event.target.value)}>
                    <option value="">Choisir</option>
                    {partners.map((partner) => (
                      <option key={partner.id} value={partner.selected_concierge_profile_id || ""}>
                        {partner.selected_concierge_name || "Conciergerie"} - {partner.property_name || partner.city || "partenaire"}
                      </option>
                    ))}
                  </Select>
                  {partners.length === 0 ? (
                    <span className={styles.meta}>Aucun partenaire accepté trouvé pour le moment.</span>
                  ) : null}
                </label>
                <label className={styles.label}>
                  Plateforme
                  <Select value={form.bookingPlatform} onChange={(event) => updateForm("bookingPlatform", event.target.value)}>
                    <option>Airbnb</option>
                    <option>Booking</option>
                    <option>Abritel</option>
                    <option>Direct</option>
                    <option>Autre</option>
                  </Select>
                </label>
                <label className={styles.label}>
                  Code réservation
                  <Input value={form.bookingCode} onChange={(event) => updateForm("bookingCode", event.target.value)} />
                </label>
              </div>
            </section>

            <section className={styles.travelerFormSection}>
              <p className={styles.eyebrow}>Actions à réaliser</p>
              <div className={styles.travelerChecklist}>
                {actionOptions.map((action) => (
                  <button
                    key={action.value}
                    type="button"
                    className={form.actions.includes(action.value) ? styles.travelerCheckActive : styles.travelerCheck}
                    onClick={() => toggleAction(action.value)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              <div className={styles.travelerFieldGrid}>
                <label className={styles.label}>
                  Priorité
                  <Select value={form.priority} onChange={(event) => updateForm("priority", event.target.value as TravelerMissionForm["priority"])}>
                    <option value="normal">Normale</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </Select>
                </label>
                <label className={styles.label}>
                  Statut particulier
                  <Select value={form.issueFlag} onChange={(event) => updateForm("issueFlag", event.target.value)}>
                    <option value="none">Aucun</option>
                    <option value="watch">À surveiller</option>
                    <option value="incident">Incident</option>
                    <option value="urgent">Urgence</option>
                  </Select>
                </label>
              </div>
              <label className={styles.label}>
                Accueil spécifique
                <Input value={form.specialWelcome} onChange={(event) => updateForm("specialWelcome", event.target.value)} placeholder="Ex : champagne, lit bébé, arrivée tardive" />
              </label>
              <label className={styles.label}>
                Remarques pour la conciergerie
                <Textarea rows={4} value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} />
              </label>
              <label className={styles.label}>
                Notes internes
                <Textarea rows={3} value={form.internalNotes} onChange={(event) => updateForm("internalNotes", event.target.value)} />
              </label>
              <Button type="submit" disabled={submitting}>
                <Plus size={16} aria-hidden="true" />
                {submitting ? "Création..." : "Créer la mission voyageur"}
              </Button>
            </section>
          </form>

          <aside className={styles.travelerMissionAside}>
            <div className={styles.travelerSummaryCard}>
              <p className={styles.eyebrow}>Résumé intelligent</p>
              <strong>{buildTitle(form)}</strong>
              <span>{form.arrivalDate || "Arrivée à préciser"} - {form.departureDate || "Départ à préciser"}</span>
              <span>{Number(form.adults || 0) + Number(form.children || 0) + (form.hasBaby === "yes" ? 1 : 0)} voyageur(s)</span>
              <span>{form.actions.length} action(s) prévues</span>
            </div>
            <div className={styles.travelerSummaryCard}>
              <p className={styles.eyebrow}>Notifications</p>
              <span>La conciergerie sera informée à la création, puis à chaque modification importante.</span>
            </div>
          </aside>
        </div>

        <section className={styles.travelerMissionListSection}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Séjours transmis</p>
              <h2>Vue liste missions voyageurs</h2>
            </div>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </Select>
          </div>

          {loading ? <p>Chargement des séjours...</p> : null}
          {!loading && filteredMissions.length === 0 ? (
            <p className={styles.meta}>Aucune mission voyageur pour le moment.</p>
          ) : null}

          <div className={styles.travelerMissionGrid}>
            {filteredMissions.map((mission) => (
              <article key={mission.id} className={styles.travelerMissionCard}>
                <div className={styles.travelerMissionTopline}>
                  <div>
                    <p className={styles.cardLabel}>{getMetadataString(mission, "booking_platform") || "Séjour"}</p>
                    <h3>{getTravelerName(mission)}</h3>
                  </div>
                  <span className={mission.priority === "urgent" ? styles.statusUrgent : styles.statusBubble}>
                    {mission.priority === "urgent" ? "Urgent" : statusOptions.find((item) => item.value === (mission.status || "assigned"))?.label || "Assignée"}
                  </span>
                </div>
                <div className={styles.travelerMissionFacts}>
                  <span><Home size={14} /> {getPropertyLabel(housing, getMissionHousingId(mission))}</span>
                  <span><CalendarClock size={14} /> {formatDateValue(mission.scheduled_start, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  <span><Users size={14} /> {getGuestCount(mission)} voyageur(s)</span>
                  <span><Phone size={14} /> {getMetadataString(mission, "guest_phone") || "-"}</span>
                  <span><Mail size={14} /> {getMetadataString(mission, "guest_email") || "-"}</span>
                  <span><MessageSquareText size={14} /> {mission.description ? "Notes" : "Sans note"}</span>
                </div>
                <div className={styles.travelerChecklist}>
                  {(Array.isArray(mission.metadata?.requested_actions) ? mission.metadata?.requested_actions as string[] : []).map((action) => (
                    <span key={`${mission.id}-${action}`} className={styles.travelerActionPill}>
                      {actionOptions.find((item) => item.value === action)?.label || action}
                    </span>
                  ))}
                </div>
                <button type="button" className={styles.buttonSecondary} onClick={() => duplicateMission(mission)}>
                  <Copy size={15} aria-hidden="true" />
                  Dupliquer
                </button>
                <Link className={styles.buttonSecondary} href={`/dashboard/owner/missions/${mission.id}`}>
                  Ouvrir la mission
                </Link>
              </article>
            ))}
          </div>
        </section>
        </div>
      </section>
    </div>
  );
}
