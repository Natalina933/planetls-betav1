"use client";

import { CheckCircle2 } from "lucide-react";
import { useId, useMemo, useState } from "react";
import {
  PLANETLS_SERVICE_FAMILIES,
  PLANETLS_SERVICE_TARGET,
  type PlanetLSServiceTargetEntry,
} from "@/app/lib/planetlsServiceCatalogTarget";
import { normalizePlanetLSSelection } from "@/app/lib/planetlsServiceSelection";
import {
  GUEST_CHECKIN_CHECKOUT_BUNDLE,
  DEFAULT_GUEST_CHECKIN_CHECKOUT_MODE,
  GUEST_CHECKIN_SLUG,
  GUEST_CHECKOUT_SLUG,
  getGuestCheckinCheckoutModeLabel,
  hasGuestCheckinCheckoutSelection,
  inferGuestCheckinCheckoutMode,
  replaceGuestCheckinCheckoutServices,
  type GuestCheckinCheckoutMode,
} from "@/app/lib/guestCheckinCheckout";
import styles from "./PlanetLSServicePicker.module.scss";

export type PlanetLSServicePickerProps = {
  selected: string[];
  onChange: (selected: string[]) => void;
  availableFamilies?: readonly string[];
  allowGroups?: boolean;
  collapseGuestCheckinCheckout?: boolean;
  compact?: boolean;
  preferredFamily?: string;
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
  if (slug === GUEST_CHECKIN_CHECKOUT_BUNDLE) {
    const hasBundle =
      normalized.includes(GUEST_CHECKIN_SLUG) ||
      normalized.includes(GUEST_CHECKOUT_SLUG);
    return hasBundle
      ? normalized.filter(
          (item) =>
            item !== GUEST_CHECKIN_SLUG && item !== GUEST_CHECKOUT_SLUG,
        )
      : [...normalized, GUEST_CHECKIN_SLUG, GUEST_CHECKOUT_SLUG];
  }
  if (normalized.includes(slug)) {
    return normalized.filter((item) => item !== slug);
  }
  return [...normalized, slug];
}

export function PlanetLSServicePicker({
  selected,
  onChange,
  availableFamilies,
  allowGroups = true,
  collapseGuestCheckinCheckout = false,
  compact = false,
  preferredFamily,
  disabled = false,
  emptyMessage = "Catalogue des prestations indisponible. Veuillez réessayer plus tard.",
}: PlanetLSServicePickerProps) {
  const pickerId = useId();
  const groups = useMemo(() => {
    const allowedFamilies = availableFamilies ? new Set(availableFamilies) : null;
    return buildFamilyGroups()
      .filter((group) => !allowedFamilies || allowedFamilies.has(group.slug))
      .map((group) => ({
        ...group,
        services: allowGroups
          ? group.services
          : group.services.filter((service) => service.kind !== "group"),
      }))
      .map((group) => ({
        ...group,
        services: collapseGuestCheckinCheckout
          ? group.services.filter(
              (service) =>
                service.slug !== GUEST_CHECKIN_SLUG &&
                service.slug !== GUEST_CHECKOUT_SLUG,
            )
          : group.services,
      }))
      .filter((group) => group.services.length > 0);
  }, [allowGroups, availableFamilies, collapseGuestCheckinCheckout]);
  const selectedSet = useMemo(
    () => {
      const normalized = normalizePlanetLSSelection(selected);
      const selectedSlugs = new Set(normalized);
      if (
        collapseGuestCheckinCheckout &&
        (selectedSlugs.has(GUEST_CHECKIN_SLUG) ||
          selectedSlugs.has(GUEST_CHECKOUT_SLUG))
      ) {
        selectedSlugs.add(GUEST_CHECKIN_CHECKOUT_BUNDLE);
      }
      return selectedSlugs;
    },
    [collapseGuestCheckinCheckout, selected],
  );
  const checkinCheckoutMode =
    inferGuestCheckinCheckoutMode(selected) ??
    DEFAULT_GUEST_CHECKIN_CHECKOUT_MODE;

  function changeCheckinCheckoutMode(mode: GuestCheckinCheckoutMode) {
    onChange(replaceGuestCheckinCheckoutServices(selected, mode));
  }
  const [activeFamily, setActiveFamily] = useState<string | null>(null);

  const activeGroup = useMemo<PlanetLSFamilyGroup | null>(
    () =>
      groups.find((group) => group.slug === activeFamily) ??
      groups.find((group) => group.slug === preferredFamily) ?? groups[0] ?? null,
    [activeFamily, groups, preferredFamily],
  );

  if (groups.length === 0) {
    return <div className={styles.emptyState}>{emptyMessage}</div>;
  }

  const modalityPicker = collapseGuestCheckinCheckout &&
      hasGuestCheckinCheckoutSelection(selected) ? (
        <fieldset className={styles.modalityPicker}>
          <legend>Modalité d’intervention</legend>
          {(
            [
              "arrival_departure",
              "arrival_only",
              "departure_only",
            ] as const
          ).map((mode) => (
            <label key={mode} className={styles.modalityChoice}>
              <input
                type="radio"
                name={`guest-checkin-checkout-mode-${pickerId}`}
                value={mode}
                checked={checkinCheckoutMode === mode}
                disabled={disabled}
                onChange={() => changeCheckinCheckoutMode(mode)}
              />
              <span>{getGuestCheckinCheckoutModeLabel(mode)}</span>
            </label>
          ))}
        </fieldset>
      ) : null;

  return (
    <div className={`${styles.catalogArea} ${compact ? styles.compact : ""}`}>
      {!compact ? modalityPicker : null}
      <div className={styles.familyRail} role={compact ? "group" : "tablist"} aria-label="Familles de prestations">
        {groups.map((group) => {
          const isActive = activeGroup?.slug === group.slug;
          const selectedCount = group.services.filter((service) =>
            selectedSet.has(service.slug),
          ).length;

          return (
            <button
              key={group.slug}
              type="button"
              role={compact ? undefined : "tab"}
              aria-selected={compact ? undefined : isActive}
              aria-pressed={compact ? isActive : undefined}
              aria-controls={compact ? `${pickerId}-services` : undefined}
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
          id={`${pickerId}-services`}
          aria-label={`Prestations ${activeGroup.label}`}
        >
          {!compact ? <div className={styles.detailsHeader}>
            <div>
              <strong>{activeGroup.label}</strong>
              <small>Sélectionnez uniquement les prestations souhaitées.</small>
            </div>
          </div> : null}
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
                    {!compact ? <small>{activeGroup.label}</small> : null}
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
      {compact ? modalityPicker : null}
    </div>
  );
}
