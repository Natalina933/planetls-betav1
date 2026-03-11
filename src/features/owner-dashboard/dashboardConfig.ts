import type { DashboardNavItem, DashboardQuickAction, DashboardShortcutItem } from "@/components/dashboard";

export const OWNER_DASHBOARD_CONFIG = {
  title: "Cabinet proprietaire",
  defaultSubtitle:
    "Suivi des biens, revenus, interventions et relation conciergerie depuis une vue unique.",
  navTitle: "Sections proprietaire",
  profileName: "Espace proprietaire",
} as const;

export const OWNER_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Mes biens", href: "/dashboard/owner/logements" },
  { label: "Trouver une conciergerie", href: "/dashboard/owner/concierges" },
  { label: "Revenus", href: "/dashboard/owner/factures" },
  { label: "Messages", href: "/dashboard/owner/messages" },
];

export const OWNER_QUICK_ACTIONS: DashboardQuickAction[] = [
  { label: "Ajouter un logement", href: "/dashboard/owner/logements/create" },
  { label: "Trouver une conciergerie", href: "/dashboard/owner/concierges" },
  { label: "Demander une intervention", href: "/dashboard/owner/mission-urgente" },
];

export const OWNER_SHORTCUTS: DashboardShortcutItem[] = [
  { label: "Annonces", href: "/dashboard/owner/logements" },
  { label: "Conciergerie", href: "/dashboard/owner/conciergerie" },
  { label: "Devis", href: "/dashboard/owner/devis" },
  { label: "Planning", href: "/dashboard/owner/planning" },
];
