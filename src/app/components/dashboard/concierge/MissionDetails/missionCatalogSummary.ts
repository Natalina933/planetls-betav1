"use client";

export interface MissionCatalogSummaryItem {
  id: number;
  category: string;
  service: string;
}

export interface DetailedMissionCategory {
  category: string;
  services: string[];
}

const CATEGORY_ORDER = [
  "Ménage",
  "Linge",
  "Accueil",
  "Maintenance",
  "Courses",
  "Administratif",
  "Extérieur",
  "Sécurité",
  "Confort",
  "Éco",
];

export function buildDetailedMissionSummary(
  selectedServices: string[],
  catalog: MissionCatalogSummaryItem[],
): DetailedMissionCategory[] {
  if (catalog.length === 0 || selectedServices.length === 0) {
    return [];
  }

  const groups: Record<string, string[]> = {};

  selectedServices.filter(Boolean).forEach((serviceName) => {
    const normalizedInput = serviceName.trim().toLowerCase();
    if (!normalizedInput) {
      return;
    }

    const found = catalog.find((item) => {
      const serviceLabel = item.service.toLowerCase();
      const categoryLabel = item.category.toLowerCase();

      return (
        serviceLabel.includes(normalizedInput) ||
        normalizedInput.includes(serviceLabel) ||
        categoryLabel.includes(normalizedInput) ||
        normalizedInput.includes(categoryLabel)
      );
    });

    if (!found) {
      return;
    }

    if (!groups[found.category]) {
      groups[found.category] = [];
    }

    if (!groups[found.category].includes(found.service)) {
      groups[found.category].push(found.service);
    }
  });

  return Object.entries(groups)
    .map(([category, services]) => ({ category, services }))
    .sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a.category);
      const indexB = CATEGORY_ORDER.indexOf(b.category);
      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });
}

export function countDetailedMissionServices(
  summary: DetailedMissionCategory[],
): number {
  return summary.reduce((total, group) => total + group.services.length, 0);
}
