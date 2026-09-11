"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Bell, CalendarDays, Copy, Eye, Plus, Users } from "lucide-react";
import { Alert, AsyncState, Badge, Button, ButtonLink, Card, DataTable, Input, Select, TableFilters, type DataTableColumn } from "@/components/ui";
import DashboardEmptyState from "@/components/ui/dashboard/saas/DashboardEmptyState";
import styles from "./TravelerStaysOverview.module.scss";

export type StayOverviewRow = {
  id: string;
  name: string;
  propertyId: string;
  property: string;
  conciergeId: string;
  concierge: string;
  guests: number | string;
  arrival: string | null;
  departure: string | null;
  status: string;
  statusLabel: string;
  isPending: boolean;
  isPlanned: boolean;
  isUrgent: boolean;
  isUpcoming: boolean;
};

type Collaboration = {
  name: string;
  property: string;
  quoteNumber?: string | null;
  href: string;
  hasQuote: boolean;
  hasMission: boolean;
};

type Props = {
  rows: StayOverviewRow[];
  stats: { label: string; value: string; icon: ReactNode }[];
  collaboration: Collaboration | null;
  partnerCount: number;
  plannedCount: number;
  completedCount: number;
  loading: boolean;
  error: string | null;
  success: string | null;
  onRetry: () => void;
  onCreate: () => void;
  onImport: () => void;
  onFollow: (id: string) => void;
  onDuplicate: (id: string) => void;
};

const groups = [
  ["all", "Tous"], ["upcoming", "À venir"], ["pending", "À planifier"],
  ["in_progress", "En cours"], ["completed", "Terminés"],
] as const;
const statusLabels = [
  ["all", "Tous les statuts"], ["pending", "En attente de planning"], ["planned", "Planifiés"],
  ["urgent", "Urgences et incidents"], ["draft", "Créés"], ["assigned", "Envoyés"],
  ["accepted", "Consultés / acceptés"], ["in_progress", "En cours"], ["completed", "Terminés"], ["canceled", "Annulés"],
] as const;
const explanation = ["Vous transmettez le séjour", "La conciergerie consulte les informations", "Elle planifie les interventions", "Vous suivez l’avancement"];

function dateLabel(value: string | null, time = false) {
  if (!value || Number.isNaN(Date.parse(value))) return "À préciser";
  return new Intl.DateTimeFormat("fr-FR", time
    ? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
    : { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function matchesStatus(row: StayOverviewRow, value: string) {
  if (value === "all") return true;
  if (value === "upcoming") return row.isUpcoming;
  if (value === "pending") return row.isPending;
  if (value === "planned") return row.isPlanned;
  if (value === "urgent") return row.isUrgent;
  return row.status === value;
}

function StayStatus({ row }: { row: StayOverviewRow }) {
  return <Badge variant={row.isUrgent ? "danger" : row.status === "completed" ? "success" : row.isPending ? "warning" : "neutral"}>{row.statusLabel}</Badge>;
}

export default function TravelerStaysOverview(props: Props) {
  const { rows, loading, error, collaboration, onCreate, onFollow, onDuplicate } = props;
  const [group, setGroup] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [property, setProperty] = useState("");
  const [concierge, setConcierge] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const reset = () => { setGroup("all"); setStatus("all"); setSearch(""); setProperty(""); setConcierge(""); setFrom(""); setTo(""); };
  const normalize = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr");
  const filtered = rows.filter(row => {
    const arrival = row.arrival ? Date.parse(row.arrival) : NaN;
    const departure = row.departure ? Date.parse(row.departure) : arrival;
    return matchesStatus(row, group) && matchesStatus(row, status)
      && (!property || row.propertyId === property) && (!concierge || row.conciergeId === concierge)
      && (!search.trim() || normalize(`${row.name} ${row.property} ${row.concierge}`).includes(normalize(search.trim())))
      && (!from || departure >= new Date(`${from}T00:00:00`).getTime())
      && (!to || arrival <= new Date(`${to}T23:59:59.999`).getTime());
  });
  const upcoming = useMemo(() => rows.filter(row => row.isUpcoming).sort((a, b) => Date.parse(a.arrival!) - Date.parse(b.arrival!)).slice(0, 3), [rows]);
  const properties = new Map(rows.map(row => [row.propertyId, row.property]));
  const concierges = new Map(rows.map(row => [row.conciergeId, row.concierge]));
  const activeCount = [group !== "all", status !== "all", Boolean(search), Boolean(property), Boolean(concierge), Boolean(from), Boolean(to)].filter(Boolean).length;
  const columns: DataTableColumn<StayOverviewRow>[] = [
    { id: "stay", label: "Séjour", render: row => <Button variant="ghost" size="sm" onClick={() => onFollow(row.id)}>{row.name}</Button> },
    { id: "housing", label: "Logement", render: row => row.property },
    { id: "guests", label: "Voyageurs", render: row => `${row.guests} voyageur(s)` },
    { id: "dates", label: "Dates", render: row => <span>{dateLabel(row.arrival)}<br />→ {dateLabel(row.departure)}</span> },
    { id: "concierge", label: "Conciergerie", render: row => row.concierge },
    { id: "status", label: "Statut", render: row => <StayStatus row={row} /> },
  ];

  return <div className={styles.overview}>
    <header className={styles.hero}>
      <div>
        <p className={styles.eyebrow}>Séjours voyageurs</p>
        <h1>Préparez sereinement chaque arrivée</h1>
        <p className={styles.description}>Transmettez à votre conciergerie les informations essentielles sur vos voyageurs, leurs horaires et les besoins liés au séjour.</p>
        <div className={styles.actions}>
          <Button onClick={onCreate}><Bell size={16} aria-hidden="true" /> Prévenir la conciergerie</Button>
          <ButtonLink href="/dashboard/owner/planning" variant="secondary">Voir le planning</ButtonLink>
        </div>
      </div>
    </header>

    {props.success && <Alert tone="success" title="Informations transmises" announcement="polite">{props.success}</Alert>}
    {error && <Alert tone="danger" title="Impossible de charger les séjours" announcement="assertive" action={<Button variant="secondary" onClick={props.onRetry}>Réessayer</Button>}>{error}</Alert>}

    <section className={styles.metrics} aria-label="Synthèse des séjours">
      {props.stats.map(stat => <Card key={stat.label} className={styles.metric} tone="outlined">
        <span aria-hidden="true">{stat.icon}</span><div><strong>{error ? "—" : stat.value}</strong><p>{stat.label}</p></div>
      </Card>)}
    </section>

    <AsyncState className={styles.sections} loading={loading} loadingLabel="Chargement des séjours et de votre collaboration…">
      {!error && <>
        <section aria-labelledby="collaboration-title">
          <Card className={styles.collaboration} tone="outlined">
            <div>
              <p className={styles.eyebrow}>Collaboration en cours</p>
              <h2 id="collaboration-title">Votre conciergerie</h2>
              {collaboration ? <>
                <h3>{collaboration.name}</h3>
                <Badge variant="success">Collaboration active</Badge>
                <p>{collaboration.property}</p>
                {collaboration.quoteNumber && <p>Devis {collaboration.quoteNumber}</p>}
              </> : <p>{props.partnerCount ? "Sélectionnez un logement et sa conciergerie pour transmettre un séjour." : "Aucune collaboration active pour le moment. Retrouvez vos demandes et les conciergeries partenaires avant de transmettre un séjour."}</p>}
              <div className={styles.actions}>
                {collaboration && <ButtonLink href={collaboration.href} variant="secondary" size="sm">Voir la collaboration</ButtonLink>}
                <ButtonLink href="/dashboard/owner/conciergerie/partenaires" variant="ghost" size="sm">Partenaires acceptés ({props.partnerCount})</ButtonLink>
                {!collaboration && <ButtonLink href="/dashboard/owner/demandes" variant="secondary" size="sm">Voir mes demandes</ButtonLink>}
              </div>
            </div>
            {collaboration && <ol className={styles.progress} aria-label="Parcours de collaboration">
              <li data-complete="true">Demande envoyée</li>
              <li data-complete={collaboration.hasQuote}>Devis {collaboration.hasQuote ? "accepté" : "à vérifier"}</li>
              <li data-complete={collaboration.hasMission}>Collaboration {collaboration.hasMission ? "créée" : "acceptée"}</li>
              <li aria-current="step">Séjours voyageurs</li>
            </ol>}
          </Card>
        </section>

        <section aria-labelledby="upcoming-stays-title">
          <div className={styles.sectionHeading}><h2 id="upcoming-stays-title">Mes prochains séjours</h2>
            <Button variant="secondary" size="sm" onClick={props.onImport}>Importer un planning</Button>
          </div>
          {upcoming.length ? <div className={styles.upcoming}>{upcoming.map(row => <Card className={styles.stay} key={row.id} tone="outlined">
            <p className={styles.eyebrow}>{row.property}</p><h3>{row.name}</h3>
            <p>{dateLabel(row.arrival)} → {dateLabel(row.departure)}</p>
            <p><Users size={16} aria-hidden="true" /> {row.guests} voyageurs</p>
            <p><CalendarDays size={16} aria-hidden="true" /> Arrivée : {dateLabel(row.arrival, true)}</p>
            <p>Conciergerie : {row.concierge}</p><StayStatus row={row} />
            <Button variant="secondary" size="sm" onClick={() => onFollow(row.id)}>Voir le séjour</Button>
          </Card>)}</div> : <Card className={styles.empty} tone="outlined">
            <DashboardEmptyState icon={<CalendarDays size={32} aria-hidden="true" />} title="Aucun séjour prévu pour le moment" copy="Lorsque vous connaissez votre prochaine réservation, transmettez les informations à votre conciergerie pour préparer l’arrivée dans de bonnes conditions." />
            <Button onClick={onCreate}><Plus size={16} aria-hidden="true" /> Ajouter un séjour</Button>
          </Card>}
        </section>

        <section className={styles.explanation} aria-labelledby="workflow-title">
          <h2 id="workflow-title">Comment ça fonctionne ?</h2>
          <ol>{explanation.map((text, index) => <li key={text}><span aria-hidden="true">{index + 1}</span>{text}</li>)}</ol>
          <p>Statuts de suivi : Créée → Envoyée → Consultée → Planifiée → En cours → Terminée.</p>
        </section>

        <section className={styles.list} aria-labelledby="all-stays-title">
          <div className={styles.sectionHeading}><h2 id="all-stays-title">Tous les séjours</h2><p>{props.plannedCount} planifiés · {props.completedCount} terminés</p></div>
          <div className={styles.groups} role="group" aria-label="Vue des séjours">
            {groups.map(([value, label]) => <Button key={value} variant={group === value ? "primary" : "ghost"} size="sm" aria-pressed={group === value} onClick={() => { setGroup(value); setStatus("all"); }}>{label}</Button>)}
          </div>
          <TableFilters resultCount={filtered.length} resultLabel={`${filtered.length} séjour(s)`} activeCount={activeCount} onReset={reset} resetLabel="Réinitialiser">
            <label>Recherche<Input bare type="search" placeholder="Voyageur, logement…" value={search} onChange={event => setSearch(event.target.value)} /></label>
            <label>Logement<Select bare aria-label="Logement" value={property} onChange={event => setProperty(event.target.value)}><option value="">Tous les logements</option>{[...properties].filter(([id]) => id).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</Select></label>
            <label>Conciergerie<Select bare aria-label="Conciergerie" value={concierge} onChange={event => setConcierge(event.target.value)}><option value="">Toutes les conciergeries</option>{[...concierges].filter(([id]) => id).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</Select></label>
            <label>Statut<Select bare aria-label="Statut" value={status} onChange={event => setStatus(event.target.value)}>{statusLabels.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Select></label>
            <label>Du<Input bare type="date" value={from} onChange={event => setFrom(event.target.value)} /></label>
            <label>Au<Input bare type="date" value={to} min={from || undefined} onChange={event => setTo(event.target.value)} /></label>
          </TableFilters>
          <DataTable caption="Séjours transmis à vos conciergeries" columns={columns} rows={filtered} getRowId={row => row.id} responsiveStrategy="cards" emptyLabel={rows.length ? "Aucun séjour ne correspond à ces filtres." : "Aucun séjour transmis pour le moment."}
            renderRowAction={row => <div className={styles.rowActions}>
              <Button variant="secondary" size="sm" onClick={() => onFollow(row.id)}><Eye size={14} aria-hidden="true" /> Suivi</Button>
              <details><summary>Autres actions<span className={styles.srOnly}> — {row.name}</span></summary><div>
                <Button variant="ghost" size="sm" onClick={() => onDuplicate(row.id)}><Copy size={14} aria-hidden="true" /> Dupliquer</Button>
                <ButtonLink href={`/dashboard/owner/missions/${row.id}`} variant="ghost" size="sm">Ouvrir</ButtonLink>
                <ButtonLink href={`/dashboard/owner/messages?mission=${encodeURIComponent(row.id)}`} variant="ghost" size="sm">Messages</ButtonLink>
              </div></details>
            </div>} />
        </section>
      </>}
    </AsyncState>
  </div>;
}
