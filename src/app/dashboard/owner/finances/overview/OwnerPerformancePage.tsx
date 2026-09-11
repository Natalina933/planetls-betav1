"use client";

import { useMemo, useState } from "react";
import { BarChart3, CalendarDays, CircleHelp, Home, Wallet } from "lucide-react";
import { Alert, AsyncState, Badge, Button, ButtonLink, Card, DataTable, Input, Select, TableFilters, type DataTableColumn } from "@/components/ui";
import { performancePeriod, propertyStatus, summarizeReservations, type PerformanceProperty, type PerformanceReservation } from "./performanceData";
import styles from "./OwnerPerformancePage.module.scss";

type Props = {
  properties: PerformanceProperty[];
  reservations: PerformanceReservation[];
  quotesCount: number;
  invoicesCount: number;
  completion: { percentage: number; completedCount: number; totalCount: number };
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

export default function OwnerPerformancePage(props: Props) {
  const { properties, reservations, loading, error } = props;
  const [now] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("next");
  const next = useMemo(() => summarizeReservations(reservations, performancePeriod(now)), [reservations, now]);
  const selected = useMemo(() => summarizeReservations(reservations, performancePeriod(now, period === "next" ? undefined : Number(period))), [reservations, now, period]);
  const reservationYears = reservations
    .flatMap(row => [row.check_in_at, row.check_out_at])
    .filter((date): date is string => Boolean(date) && Number.isFinite(Date.parse(date!)))
    .map(date => Number(date.slice(0, 4)));
  const years = [...new Set([now.getFullYear(), ...reservationYears])].sort((a, b) => b - a);
  const activeProperties = properties.filter(property => propertyStatus(property.statut) === "En ligne");
  const attention = properties.filter(property => ["Hors ligne", "Brouillon", "Maintenance"].includes(propertyStatus(property.statut)));
  const rows = properties.filter(property => (status === "all" || propertyStatus(property.statut) === status) && `${property.nom_logement ?? ""} ${property.ville ?? ""}`.toLocaleLowerCase("fr").includes(search.trim().toLocaleLowerCase("fr")));
  const distribution = useMemo(() => {
    const cities = new Map<string, number>();
    const known = new Set(properties.map(property => String(property.id)));
    for (const property of properties) {
      const nights = next.nightsByProperty.get(String(property.id))?.size ?? 0;
      if (nights) cities.set(property.ville || "Ville à préciser", (cities.get(property.ville || "Ville à préciser") ?? 0) + nights);
    }
    for (const [id, nights] of next.nightsByProperty) if (!known.has(id)) cities.set("Autres logements", (cities.get("Autres logements") ?? 0) + nights.size);
    return [...cities].sort((a,b) => b[1] - a[1]);
  }, [next, properties]);
  const totalNights = distribution.reduce((sum, [, nights]) => sum + nights, 0);
  const columns: DataTableColumn<PerformanceProperty>[] = [
    { id: "property", label: "Logement", render: row => <strong>{row.nom_logement || "Logement sans nom"}</strong> },
    { id: "city", label: "Ville", render: row => row.ville || "À préciser" },
    { id: "occupation", label: "Occupation", render: () => <span aria-label="Taux d’occupation indisponible">—</span> },
    { id: "nights", label: "Nuits renseignées", render: row => selected.nightsByProperty.get(String(row.id))?.size ?? 0 },
    { id: "net", label: "Revenu net", render: () => <span aria-label="Revenu net indisponible">—</span> },
    { id: "status", label: "Statut", render: row => <Badge variant={propertyStatus(row.statut) === "En ligne" ? "success" : "neutral"}>{propertyStatus(row.statut)}</Badge> },
    { id: "trend", label: "Évolution", render: () => <span aria-label="Évolution indisponible">—</span> },
  ];

  return <div className={styles.page} aria-busy={loading}>
    <header className={styles.hero}>
      <nav aria-label="Fil d’Ariane"><ButtonLink href="/dashboard/owner" variant="ghost" size="sm">Propriétaire</ButtonLink><span aria-hidden="true">›</span><span>Pilotage propriétaire</span></nav>
      <p className={styles.eyebrow}>Pilotage propriétaire</p>
      <h1>Vue d’ensemble de vos performances</h1>
      <p>Suivez l’activité de vos logements, vos revenus et vos opportunités pour prendre les meilleures décisions.</p>
      <blockquote>« Des séjours sereins, des logements qui performent. »</blockquote>
    </header>
    <section className={styles.intro} aria-labelledby="performance-intro">
      <div><h2 id="performance-intro">Pilotez, optimisez, développez</h2><p>Comparez vos logements et identifiez vos prochaines actions.</p></div>
      <div className={styles.actions}><ButtonLink href="#performance-properties" variant="secondary">Voir les détails</ButtonLink><ButtonLink href="/dashboard/owner/logements">Gérer mes logements</ButtonLink></div>
    </section>
    {error && <Alert tone="danger" title="Performances indisponibles" announcement="assertive" action={<Button variant="secondary" onClick={props.onRetry}>Réessayer</Button>}>{error}</Alert>}
    <section className={styles.metrics} aria-label="Indicateurs de performance">
      {[
        { label: "Logements", value: properties.length, hint: "Total de vos biens", Icon: Home },
        { label: "Réservations", value: next.count, hint: "6 prochains mois · séjours transmis", Icon: CalendarDays },
        { label: "Taux d’occupation", value: "—", hint: "Disponibilités à renseigner", Icon: BarChart3 },
        { label: "Revenu net estimé", value: "—", hint: "Recettes et charges à renseigner", Icon: Wallet },
      ].map(({ label, value, hint, Icon }) => <Card className={styles.metric} tone="outlined" key={label}><Icon size={20} aria-hidden="true" /><div><strong>{loading ? "…" : error ? "—" : value}</strong><h2>{label}</h2><p>{hint}</p></div></Card>)}
    </section>
    <AsyncState className={styles.sections} loading={loading} loadingLabel="Chargement de vos performances…">
      {!error && <>
        <section className={styles.charts} aria-label="Résultats et répartition">
          <Card className={styles.panel} tone="outlined"><h2>Revenus mensuels</h2><p>{now.getFullYear()} · Encaissements et prévisions</p><div className={styles.unavailable}><Wallet size={30} aria-hidden="true" /><strong>Vos revenus locatifs ne sont pas encore renseignés</strong><p>Ils apparaîtront ici lorsqu’ils seront disponibles. Vos factures de prestations restent accessibles séparément.</p><ButtonLink href="/dashboard/owner/factures" variant="secondary" size="sm">Voir mes factures</ButtonLink></div></Card>
          <Card className={styles.panel} tone="outlined"><h2>Répartition des nuits</h2><p>6 prochains mois · séjours transmis</p><strong className={styles.number}>{totalNights} nuits renseignées</strong>
            {distribution.length ? <ul className={styles.distribution}>{distribution.map(([city,nights]) => <li key={city}><div><span>{city}</span><strong>{nights} nuits · {Math.round(nights / totalNights * 100)} %</strong></div><progress aria-label={city} value={nights} max={totalNights} /></li>)}</ul> : <p>Aucune nuit renseignée sur cette période.</p>}
            {next.unmatchedReservations > 0 && <p>{next.unmatchedReservations} séjour(s) sans logement identifié ne sont pas répartis.</p>}
          </Card>
          <Card className={styles.panel} tone="outlined"><h2>Performance globale</h2><dl className={styles.global}><div><dt>Logements en ligne</dt><dd>{activeProperties.length} / {properties.length}</dd></div><div><dt>Objectif annuel</dt><dd>Non renseigné</dd></div><div><dt>CA supplémentaire estimé</dt><dd>Non disponible</dd></div><div><dt>Progression vs objectif</dt><dd>Non disponible</dd></div></dl><ButtonLink href="/dashboard/owner/objectifs" variant="ghost" size="sm">Mes objectifs de collaboration</ButtonLink></Card>
        </section>
        <section id="performance-properties" className={styles.tablePanel} aria-labelledby="property-performance-title">
          <div className={styles.sectionHeading}><div><h2 id="property-performance-title">Performance par logement</h2><p>Comparez vos biens à partir des séjours renseignés.</p></div><ButtonLink href="/dashboard/owner/logements" variant="ghost" size="sm">Voir tous les logements</ButtonLink></div>
          <TableFilters resultCount={rows.length} resultLabel={rows.length + " logement(s)"} activeCount={Number(Boolean(search)) + Number(status !== "all")} onReset={() => { setSearch(""); setStatus("all"); }} resetLabel="Réinitialiser">
            <Input label="Recherche" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Logement, ville…" />
            <Select label="Période des nuits" value={period} onChange={event => setPeriod(event.target.value)}><option value="next">6 prochains mois</option>{years.map(year => <option key={year} value={year}>{year}</option>)}</Select>
            <Select label="Statut du logement" value={status} onChange={event => setStatus(event.target.value)}><option value="all">Tous les statuts</option>{[...new Set(properties.map(property => propertyStatus(property.statut)))].map(label => <option key={label} value={label}>{label}</option>)}</Select>
          </TableFilters>
          <DataTable caption="Performance des logements — les tirets indiquent des indicateurs indisponibles" columns={columns} rows={rows} getRowId={row => String(row.id)} responsiveStrategy="cards" emptyLabel={properties.length ? "Aucun logement ne correspond à ces filtres." : "Ajoutez votre premier logement pour commencer."} renderRowAction={row => <ButtonLink href={"/dashboard/owner/logements/" + row.id} variant="secondary" size="sm">Voir</ButtonLink>} />
          <p>Les nuits correspondent aux séjours transmis, sans compter deux fois les nuits qui se chevauchent pour un même logement.</p>
          {reservations.length >= 160 && <p>Cette vue utilise les 160 séjours les plus récents. Les totaux peuvent être incomplets.</p>}
        </section>
        <section className={styles.insights} aria-label="Explications et actions">
          <Card className={styles.panel} tone="outlined"><h2>Points clés à retenir</h2><ul><li>{activeProperties.length} logement(s) en ligne sur {properties.length}.</li><li>{next.count} réservation(s) renseignée(s) sur les six prochains mois.</li><li>{attention.length} logement(s) hors ligne, en brouillon ou en maintenance à vérifier.</li></ul></Card>
          <Card className={styles.panel} tone="outlined"><h2>Opportunités</h2><p>{attention.length ? "Vérifiez les logements qui ne sont pas en ligne et préparez leur prochaine mise en location." : "Préparez vos prochaines locations avec votre conciergerie."}</p><ButtonLink href="/dashboard/owner/conciergerie/partenaires" variant="secondary" size="sm">Mes conciergeries partenaires</ButtonLink><ButtonLink href="/dashboard/owner/logements/create" variant="ghost" size="sm">Ajouter un logement</ButtonLink></Card>
          <Card className={styles.panel} tone="outlined"><h2>Prochaines actions</h2><ul className={styles.nextActions}>{attention.slice(0,3).map(property => <li key={property.id}><div><strong>{property.nom_logement || "Logement sans nom"}</strong><Badge variant="warning">{propertyStatus(property.statut)}</Badge></div><ButtonLink href={"/dashboard/owner/logements/" + property.id} variant="secondary" size="sm">Vérifier</ButtonLink></li>)}</ul>{!attention.length && <p>Aucun logement signalé hors ligne ou en maintenance.</p>}<ButtonLink href="/dashboard/owner/missions/voyageurs" variant="ghost" size="sm">Compléter mes séjours</ButtonLink></Card>
          <Card className={styles.panel} tone="outlined"><h2><CircleHelp size={20} aria-hidden="true" /> Nos recommandations</h2><p>Gardez vos informations de logement et vos séjours à jour pour faciliter le suivi avec votre conciergerie.</p><ButtonLink href="/dashboard/owner/messages" variant="secondary" size="sm">Échanger avec ma conciergerie</ButtonLink></Card>
        </section>
        <Card className={styles.panel} tone="outlined"><h2>Mes documents financiers</h2><p>{props.quotesCount} devis et {props.invoicesCount} factures dans vos documents récents. Dossier financier complété à {props.completion.percentage} % ({props.completion.completedCount}/{props.completion.totalCount}).</p><div className={styles.actions}><ButtonLink href="/dashboard/owner/devis" variant="secondary" size="sm">Voir les devis</ButtonLink><ButtonLink href="/dashboard/owner/factures" variant="secondary" size="sm">Voir les factures</ButtonLink><ButtonLink href="/dashboard/owner/reglement" variant="secondary" size="sm">Ouvrir les règlements</ButtonLink></div></Card>
      </>}
    </AsyncState>
    <footer className={styles.footer}><span>PlanetLS · Mon espace propriétaire</span><em>Des séjours sereins, des logements qui performent.</em></footer>
  </div>;
}
