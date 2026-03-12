import type { DashboardNavItem, DashboardQuickAction, DashboardShortcutItem } from "@/components/dashboard";

export const CONCIERGERIE_DASHBOARD_CONFIG = {
  title: "Console conciergerie",
  subtitle: "Pilotage des biens, des propriétaires et des interventions en temps réel.",
  navTitle: "Sections conciergerie",
  profileName: "Conciergerie",
} as const;

export const CONCIERGERIE_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Biens gérés", href: "/dashboard/concierge/logements" },
  { label: "Propriétaires", href: "/dashboard/concierge/contacts" },
  { label: "Interventions", href: "/dashboard/concierge/planning" },
  { label: "Réseau artisans", href: "/dashboard/concierge/recherche" },
];

export const CONCIERGERIE_QUICK_ACTIONS: DashboardQuickAction[] = [
  { label: "Ajouter un bien", href: "/dashboard/concierge/logements/create" },
  { label: "Créer une intervention", href: "/dashboard/concierge/planning" },
  { label: "Affecter un artisan", href: "/dashboard/concierge/recherche" },
];

export const CONCIERGERIE_SHORTCUTS: DashboardShortcutItem[] = [
  { label: "Messages", href: "/dashboard/concierge/messages" },
  { label: "Urgences", href: "/dashboard/concierge/urgences" },
  { label: "Profil", href: "/dashboard/concierge/profile?tab=fiche" },
];
