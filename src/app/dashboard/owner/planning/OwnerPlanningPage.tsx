"use client";

import Link from "next/link";
import { Download, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardSectionShell } from "@/components/dashboard";
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

export default function OwnerPlanningPage({
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
  const [typeFilter, setTypeFilter] = useState("all");
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
        const matchesType = typeFilter === "all" || item.type === typeFilter;
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

  return (
    <DashboardSectionShell
      persona="owner"
      title="Planning propriétaire"
      subtitle="Voyez ce qui est prévu, ce qui est urgent et ce qui attend votre validation."
      stats={kpis.slice(0, 4).map((kpi) => ({ label: kpi.label, value: loading ? "..." : `${kpi.value}` }))}
      actions={[
        { label: "Créer une mission", href: "/dashboard/owner/missions/new" },
        { label: "Mission urgente", href: "/dashboard/owner/mission-urgente" },
      ]}
    >
      <main className={styles.page} aria-busy={loading}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Agenda opérationnel</p>
            <h1>Tout ce qui compte pour vos voyageurs, au bon moment.</h1>
            <p>
              Suivez les missions, les validations et les logements à préparer sans vous perdre dans les détails
              techniques.
            </p>
          </div>
          <div className={styles.heroActions}>
            <Link href="/dashboard/owner/missions/new" className={styles.primaryAction}>
              Créer une mission
              <Plus size={16} aria-hidden="true" />
            </Link>
            <Link href="/dashboard/owner/messages" className={styles.secondaryAction}>
              Contacter ma conciergerie
            </Link>
          </div>
        </section>

        <OwnerPlanningKpiBar kpis={kpis} />
        <OwnerPlanningPriorities priorities={priorities} />

        <section className={styles.filters} aria-label="Filtres du planning">
          <label className={styles.searchField}>
            <Search size={16} aria-hidden="true" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher un logement, une mission ou un responsable"
            />
          </label>
          <select
            value={propertyFilter}
            onChange={(event) => setPropertyFilter(event.target.value)}
            aria-label="Filtrer par logement"
          >
            <option value="all">Tous les logements</option>
            {propertyOptions.map((property) => (
              <option key={property} value={property}>
                {property}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filtrer par statut"
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(planningStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filtrer par type de mission"
          >
            <option value="all">Toutes les missions</option>
            {Object.entries(planningTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            aria-label="Choisir le mois affiché"
          >
            {monthOptions.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          <div className={styles.viewSwitch} role="group" aria-label="Choisir la vue du planning">
            {[
              { value: "jour", label: "Jour" },
              { value: "semaine", label: "Semaine" },
              { value: "mois", label: "Mois" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={viewMode === option.value ? styles.viewSwitchActive : ""}
                onClick={() => setViewMode(option.value as PlanningViewMode)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={onExport} disabled={!onExport || filteredItems.length === 0} className={styles.secondaryAction}>
            Exporter
            <Download size={16} aria-hidden="true" />
          </button>
        </section>

        {success ? <p className={`${styles.feedback} ${styles.success}`} role="status">{success}</p> : null}
        {loading ? <p className={styles.feedback} role="status">Chargement du planning...</p> : null}
        {!loading && error ? (
          <div className={`${styles.feedback} ${styles.error}`} role="alert">
            <span>{error}</span>
            {onRetry ? (
              <button type="button" onClick={onRetry}>
                Réessayer
              </button>
            ) : null}
          </div>
        ) : null}

        {!loading && !error ? (
          <OwnerPlanningList items={filteredItems} viewMode={viewMode} selectedMonth={selectedMonth} />
        ) : null}
      </main>
    </DashboardSectionShell>
  );
}
