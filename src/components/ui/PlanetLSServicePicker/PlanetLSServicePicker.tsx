"use client";

import { CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  PLANETLS_SERVICE_FAMILIES,
  PLANETLS_SERVICE_TARGET,
  type PlanetLSServiceTargetEntry,
} from "@/app/lib/planetlsServiceCatalogTarget";
import { normalizePlanetLSSelection } from "@/app/lib/planetlsServiceSelection";
import styles from "./PlanetLSServicePicker.module.scss";

export type PlanetLSServicePickerProps = {
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
  emptyMessage?: string;
};

type PlanetLSFamilyGroup = {
  slug: string;
  label: string;
  services: PlanetLSServiceTargetEntry[];
};

function buildFamilyGroups(): PlanetLSFamilyGroup[] {
  return PLANETLS_SERVICE_FAMILIES.map((family) => ({
    slug: family.slug,
    label: family.label,
    services: PLANETLS_SERVICE_TARGET.filter(
      (entry) => entry.family === family.slug,
    ),
  })).filter((group) => group.services.length > 0);
}

function toggleSlug(selected: string[], slug: string): string[] {
  const normalized = normalizePlanetLSSelection(selected);
  if (normalized.includes(slug)) {
    return normalized.filter((item) => item !== slug);
  }
  return [...normalized, slug];
}

export function PlanetLSServicePicker({
  selected,
  onChange,
  disabled = false,
  emptyMessage = "Catalogue des prestations indisponible. Veuillez réessayer plus tard.",
}: PlanetLSServicePickerProps) {
  const groups = useMemo(() => buildFamilyGroups(), []);
  const selectedSet = useMemo(
    () => new Set(normalizePlanetLSSelection(selected)),
    [selected],
  );
  const [activeFamily, setActiveFamily] = useState<string | null>(
    groups[0]?.slug ?? null,
  );

  const activeGroup = useMemo<PlanetLSFamilyGroup | null>(
    () =>
      groups.find((group) => group.slug === activeFamily) ?? groups[0] ?? null,
    [activeFamily, groups],
  );

  if (groups.length === 0) {
    return <div className={styles.emptyState}>{emptyMessage}</div>;
  }

  return (
    <div className={styles.catalogArea}>
      <div className={styles.familyRail} role="tablist" aria-label="Familles de prestations">
        {groups.map((group) => {
          const isActive = activeGroup?.slug === group.slug;
          const selectedCount = group.services.filter((service) =>
            selectedSet.has(service.slug),
          ).length;

          return (
            <button
              key={group.slug}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.familyButton} ${isActive ? styles.familyButtonActive : ""}`}
              disabled={disabled}
              onClick={() => setActiveFamily(group.slug)}
            >
              <span className={styles.familyName}>{group.label}</span>
              {selectedCount > 0 ? (
                <span className={styles.familyCount}>{selectedCount}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {activeGroup ? (
        <section
          className={styles.detailsPanel}
          aria-label={`Prestations ${activeGroup.label}`}
        >
          <div className={styles.detailsHeader}>
            <div>
              <strong>{activeGroup.label}</strong>
              <small>Sélectionnez uniquement les prestations souhaitées.</small>
            </div>
          </div>
          <div className={styles.serviceGrid}>
            {activeGroup.services.map((service) => {
              const isSelected = selectedSet.has(service.slug);

              return (
                <button
                  key={service.slug}
                  type="button"
                  className={`${styles.serviceChoice} ${isSelected ? styles.serviceChoiceSelected : ""}`}
                  aria-pressed={isSelected}
                  disabled={disabled}
                  onClick={() => onChange(toggleSlug(selected, service.slug))}
                >
                  <span className={styles.serviceCheck}>
                    {isSelected ? (
                      <CheckCircle2 size={14} aria-hidden="true" />
                    ) : null}
                  </span>
                  <span>
                    <strong>{service.label}</strong>
                    <small>{activeGroup.label}</small>
                    {service.kind === "group" ? (
                      <small className={styles.groupHint}>
                        Groupe à préciser dans la description
                      </small>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
