"use client";

import { CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  addServiceValues,
  groupServiceCatalog,
  hasServiceValue,
  removeServiceValue,
  toggleServiceValue,
  type ServiceCatalogGroup,
  type ServiceCatalogItem,
} from "@/app/lib/serviceCatalog";
import { ServiceCategoryIcon } from "@/components/ui";
import styles from "./ServiceCatalogPicker.module.scss";

export type ServiceCatalogPickerMode = "request" | "offer";

export type ServiceCatalogPickerProps = {
  items: ServiceCatalogItem[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
  mode?: ServiceCatalogPickerMode;
  emptyMessage?: string;
};

function getPanelHint(mode: ServiceCatalogPickerMode) {
  return mode === "offer"
    ? "Décochez les services que vous ne proposez pas."
    : "Ajoutez uniquement les prestations utiles.";
}

export function ServiceCatalogPicker({
  items,
  selected,
  onChange,
  disabled = false,
  mode = "request",
  emptyMessage = "Aucun service disponible.",
}: ServiceCatalogPickerProps) {
  const groups = useMemo(() => groupServiceCatalog(items), [items]);
  const [activeCategory, setActiveCategory] = useState<string | null>(groups[0]?.category ?? null);

  const activeGroup = useMemo<ServiceCatalogGroup | null>(
    () => groups.find((group) => group.category === activeCategory) ?? groups[0] ?? null,
    [activeCategory, groups],
  );

  function handleCategoryClick(group: ServiceCatalogGroup) {
    if (disabled) return;

    setActiveCategory(group.category);
    const categorySelected = hasServiceValue(selected, group.category);
    if (mode === "request") {
      onChange(toggleServiceValue(selected, group.category));
      return;
    }

    onChange(
      categorySelected
        ? removeServiceValue(selected, group.category)
        : addServiceValues(selected, [
            group.category,
            ...group.services.map((service) => service.service),
          ]),
    );
  }

  function handleServiceClick(service: string) {
    if (disabled) return;
    onChange(toggleServiceValue(selected, service));
  }

  if (groups.length === 0) {
    return <div className={styles.emptyState}>{emptyMessage}</div>;
  }

  return (
    <div className={styles.catalogArea}>
      <div className={styles.categoryRail}>
        {groups.map((group) => {
          const isCategorySelected = hasServiceValue(selected, group.category);
          const isActive = activeGroup?.category === group.category;

          return (
            <section
              key={group.category}
              className={`${styles.categoryItem} ${isCategorySelected ? styles.categoryItemSelected : ""} ${
                isActive ? styles.categoryItemActive : ""
              }`}
            >
              <button
                type="button"
                className={styles.categoryButton}
                aria-pressed={isCategorySelected}
                aria-label={isCategorySelected ? `Retirer ${group.category}` : `Ajouter ${group.category}`}
                data-label={group.category}
                title={group.category}
                disabled={disabled}
                onClick={() => handleCategoryClick(group)}
              >
                <span className={`${styles.categoryCheck} ${isCategorySelected ? styles.categoryCheckSelected : ""}`}>
                  {isCategorySelected ? <CheckCircle2 size={13} aria-hidden="true" /> : null}
                </span>
                <span className={styles.categoryIcon}>
                  <ServiceCategoryIcon category={group.category} size={16} />
                </span>
                <span className={styles.categoryName}>{group.category}</span>
              </button>
            </section>
          );
        })}
      </div>

      {activeGroup ? (
        <section className={styles.detailsPanel} aria-label={`Services ${activeGroup.category}`}>
          <div className={styles.detailsHeader}>
            <span className={styles.detailsIcon}>
              <ServiceCategoryIcon category={activeGroup.category} size={18} />
            </span>
            <div>
              <strong>{activeGroup.category}</strong>
              <small>{getPanelHint(mode)}</small>
            </div>
          </div>
          <div className={styles.serviceGrid}>
            {activeGroup.services.map((item) => {
              const isSelected = hasServiceValue(selected, item.service);

              return (
                <button
                  key={String(item.id)}
                  type="button"
                  className={`${styles.serviceChoice} ${isSelected ? styles.serviceChoiceSelected : ""}`}
                  aria-pressed={isSelected}
                  disabled={disabled}
                  onClick={() => handleServiceClick(item.service)}
                >
                  <span className={styles.serviceCheck}>
                    {isSelected ? <CheckCircle2 size={14} aria-hidden="true" /> : null}
                  </span>
                  <span>
                    <strong>{item.service}</strong>
                    {item.description ? <small>{item.description}</small> : null}
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
