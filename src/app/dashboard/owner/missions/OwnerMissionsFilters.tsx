import type { OwnerMissionsFiltersValue } from "./types";
import styles from "./OwnerMissionsFilters.module.scss";

type OwnerMissionsFiltersProps = {
  value: OwnerMissionsFiltersValue;
  properties: string[];
  onChange: (value: OwnerMissionsFiltersValue) => void;
};

const statusOptions = [
  { value: "tous", label: "Tous les statuts" },
  { value: "a_faire", label: "À planifier" },
  { value: "en_cours", label: "En cours" },
  { value: "en_attente_validation", label: "En attente de validation" },
  { value: "termine", label: "Terminées" },
  { value: "en_retard", label: "En retard" },
] as const;

const periodOptions = [
  { value: "semaine", label: "Prochaine semaine" },
  { value: "mois", label: "Prochain mois" },
  { value: "toutes", label: "Toutes les missions" },
] as const;

export default function OwnerMissionsFilters({ value, properties, onChange }: OwnerMissionsFiltersProps) {
  return (
    <section className={styles.filters} aria-label="Filtres des missions">
      <label>
        Statut
        <select
          value={value.status}
          onChange={(event) => onChange({ ...value, status: event.target.value as OwnerMissionsFiltersValue["status"] })}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Logement
        <select value={value.property} onChange={(event) => onChange({ ...value, property: event.target.value })}>
          <option value="tous">Tous les logements</option>
          {properties.map((property) => (
            <option key={property} value={property}>
              {property}
            </option>
          ))}
        </select>
      </label>

      <label>
        Période
        <select
          value={value.period}
          onChange={(event) => onChange({ ...value, period: event.target.value as OwnerMissionsFiltersValue["period"] })}
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
