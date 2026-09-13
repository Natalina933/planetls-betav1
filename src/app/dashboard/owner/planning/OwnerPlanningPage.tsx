"use client";

import { Download, Plus } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, AsyncState, Button, ButtonLink, Input, Select, TableFilters } from "@/components/ui";
import OwnerPlanningKpiBar from "./OwnerPlanningKpiBar";
import OwnerPlanningList from "./OwnerPlanningList";
import OwnerPlanningPriorities from "./OwnerPlanningPriorities";
import { getPlanningItemPriority, planningStatusLabels, planningTypeLabels } from "./planningLabels";
import type { OwnerPlanningItem, OwnerPlanningKpi } from "./types";
import styles from "./OwnerPlanningPage.module.scss";

type PlanningViewMode = "jour" | "semaine" | "mois";

type OwnerPlanningPageProps = {
  kpis: OwnerPlanningKpi[];
  priorities: OwnerPlanningItem[];
  items: OwnerPlanningItem[];
  loading?: boolean;
  error?: string | null;
  success?: string | null;
  onRetry?: () => void;
  onExport?: () => void;
};

export default function OwnerPlanningPage(props: OwnerPlanningPageProps) {
  return (
    <Suspense fallback={<section className="dashboard-grid">Chargement du planning...</section>}>
      <OwnerPlanningPageContent {...props} />
    </Suspense>
  );
}

function OwnerPlanningPageContent({
  kpis,
  priorities,
  items,
  loading = false,
  error = null,
  success = null,
  onRetry,
  onExport,
}: OwnerPlanningPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const requestedType = useSearchParams().get("type") ?? "all";
  const urlType = requestedType === "arrival" ? "checkin" : requestedType === "departure" ? "checkout" : requestedType;
  const initialType = urlType === "movements" || Object.hasOwn(planningTypeLabels, urlType) ? urlType : "all";
  const [typeSelection, setTypeSelection] = useState({ source: requestedType, value: initialType });
  const typeFilter = typeSelection.source === requestedType ? typeSelection.value : initialType;
  if (typeSelection.source !== requestedType) setTypeSelection({ source: requestedType, value: initialType });
  const setTypeFilter = (value: string) => setTypeSelection({ source: requestedType, value });
  const [viewMode, setViewMode] = useState<PlanningViewMode>("semaine");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });

  const propertyOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.propertyName))).sort((a, b) => a.localeCompare(b, "fr")),
    [items],
  );

  const monthOptions = useMemo(() => {
    const today = new Date();

    return Array.from({ length: 13 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - 3 + index, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);

      return { value, label };
    });
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items
      .filter((item) => {
        const matchesProperty = propertyFilter === "all" || item.propertyName === propertyFilter;
        const matchesStatus = statusFilter === "all" || item.status === statusFilter;
        const matchesType = typeFilter === "all" || item.type === typeFilter || (typeFilter === "movements" && (item.type === "checkin" || item.type === "checkout"));
        if (!matchesProperty || !matchesStatus || !matchesType) return false;
        if (!normalizedSearch) return true;

        return [
          item.propertyName,
          item.propertyCode,
          item.city,
          item.assignedTo,
          item.notes,
          planningStatusLabels[item.status],
          planningTypeLabels[item.type],
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((a, b) => getPlanningItemPriority(a) - getPlanningItemPriority(b) || new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [items, propertyFilter, searchTerm, statusFilter, typeFilter]);

  const resetFilters = () => { setSearchTerm(""); setPropertyFilter("all"); setStatusFilter("all"); setTypeFilter("all"); };
  const activeCount = [Boolean(searchTerm), propertyFilter !== "all", statusFilter !== "all", typeFilter !== "all"].filter(Boolean).length;
  const upcomingKpi = kpis.find(kpi => kpi.id === "a-venir");

  return (
    <div className={styles.page} aria-busy={loading}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Planning propriétaire</p>
          <h1>Chaque intervention, au bon moment</h1>
          <p className={styles.description}>Retrouvez les arrivées, les missions et les préparatifs de vos logements dans un agenda partagé avec votre conciergerie.</p>
          <div className={styles.actions}>
            <ButtonLink href="/dashboard/owner/missions/new"><Plus size={16} aria-hidden="true" /> Créer une mission</ButtonLink>
            <ButtonLink href="/dashboard/owner/messages" variant="secondary">Contacter ma conciergerie</ButtonLink>
          </div>
        </div>
      </header>
      {success && <Alert tone="success" title="Export du planning" announcement="polite">{success}</Alert>}
      {error && !loading && <Alert tone="danger" title="Planning indisponible" announcement="assertive" action={onRetry ? <Button variant="secondary" onClick={onRetry}>Réessayer</Button> : undefined}>{error}</Alert>}
      <OwnerPlanningKpiBar kpis={kpis} loading={loading} unavailable={Boolean(error)} />
      <AsyncState loading={loading} loadingLabel="Chargement du planning…" className={styles.sections}>
        {!error && <>
          <OwnerPlanningPriorities priorities={priorities} />
          <section className={styles.agenda} aria-label="Votre agenda">
            <div className={styles.sectionHeading}>
              <div><h2>Votre agenda</h2><p>{upcomingKpi ? upcomingKpi.value + " intervention(s) à venir sur les 7 prochains jours" : "Retrouvez vos missions et leurs responsables."}</p></div>
              <Button variant="secondary" size="sm" onClick={onExport} disabled={!onExport || filteredItems.length === 0}><Download size={16} aria-hidden="true" /> Exporter tout</Button>
            </div>
            <TableFilters className={styles.filters} resultCount={filteredItems.length} resultLabel={filteredItems.length + " mission(s) correspondant aux filtres, toutes dates"} activeCount={activeCount} onReset={resetFilters} resetLabel="Réinitialiser">
              <label>Recherche<Input bare type="search" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Logement, mission, responsable…" /></label>
              <label>Logement<Select bare aria-label="Filtrer par logement" value={propertyFilter} onChange={event => setPropertyFilter(event.target.value)}><option value="all">Tous les logements</option>{propertyOptions.map(property => <option key={property} value={property}>{property}</option>)}</Select></label>
              <label>Statut<Select bare aria-label="Filtrer par statut" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">Tous les statuts</option>{Object.entries(planningStatusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</Select></label>
              <label>Mission<Select bare aria-label="Filtrer par type de mission" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}><option value="all">Toutes les missions</option><option value="movements">Arrivées &amp; départs</option>{Object.entries(planningTypeLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</Select></label>
            </TableFilters>
            <div className={styles.calendarControls}>
              <div className={styles.viewSwitch} role="group" aria-label="Choisir la vue du planning">
                {([ ["jour","Jour"], ["semaine","Semaine"], ["mois","Mois"] ] as const).map(([value,label]) => <Button key={value} variant={viewMode === value ? "primary" : "ghost"} size="sm" aria-pressed={viewMode === value} onClick={() => setViewMode(value)}>{label}</Button>)}
              </div>
              {viewMode === "mois" && <Select label="Mois affiché" value={selectedMonth} onChange={event => setSelectedMonth(event.target.value)}>{monthOptions.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}</Select>}
            </div>
            <OwnerPlanningList items={filteredItems} viewMode={viewMode} selectedMonth={selectedMonth} />
          </section>
        </>}
      </AsyncState>
    </div>
  );
}
