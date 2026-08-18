import type { DashboardNavItem, DashboardShortcutItem } from "@/components/dashboard";

export type AdminNavigationSection = "operations" | "business" | "productTech";

const ADMIN_OVERVIEW_ITEM: DashboardNavItem = {
  label: "Vue d'ensemble",
  href: "/dashboard/admin",
};

const SECTION_ITEMS: Record<AdminNavigationSection, DashboardNavItem[]> = {
  operations: [
    { label: "Utilisateurs", href: "/dashboard/admin/utilisateurs" },
    { label: "Proprietaires", href: "/dashboard/admin/proprietaires" },
    { label: "Conciergeries", href: "/dashboard/admin/conciergeries" },
    { label: "Artisans", href: "/dashboard/admin/artisans" },
    { label: "Demandes", href: "/dashboard/admin/demandes" },
    { label: "Missions", href: "/dashboard/admin/missions" },
    { label: "Controle", href: "/dashboard/admin/controle" },
  ],
  business: [
    { label: "Pilotage business", href: "/dashboard/admin/pilotage" },
    { label: "Modele financier", href: "/dashboard/admin/modele-financier" },
    { label: "Personas", href: "/dashboard/admin/personas" },
  ],
  productTech: [
    { label: "Developpement", href: "/dashboard/admin/developpement" },
    { label: "Decisions architecture", href: "/dashboard/admin/decisions-architecture" },
  ],
};

function dedupeByHref<T extends { href: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.href, item])).values());
}

export function buildAdminNavItems(...sections: AdminNavigationSection[]) {
  return dedupeByHref([
    ADMIN_OVERVIEW_ITEM,
    ...sections.flatMap((section) => SECTION_ITEMS[section]),
  ]);
}

export function buildAdminShortcuts(...sections: AdminNavigationSection[]): DashboardShortcutItem[] {
  return buildAdminNavItems(...sections).map((item) => ({
    label: item.label,
    href: item.href,
  }));
}

export function overrideAdminNavItems(
  _legacyItems: DashboardNavItem[],
  ...sections: AdminNavigationSection[]
) {
  return buildAdminNavItems(...sections);
}

export function overrideAdminShortcuts(
  _legacyItems: DashboardShortcutItem[],
  ...sections: AdminNavigationSection[]
) {
  return buildAdminShortcuts(...sections);
}
