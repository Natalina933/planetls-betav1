import type { DashboardNavItem, DashboardQuickAction, DashboardShortcutItem } from "@/components/dashboard";

export const ARTISAN_DASHBOARD_CONFIG = {
  title: "Atelier prestataire",
  subtitle: "Pilotage des interventions, alertes terrain et relation clients.",
  navTitle: "Sections artisan",
} as const;

export const ARTISAN_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Interventions", href: "/dashboard/provider/interventions" },
  { label: "Clients", href: "/dashboard/provider/clients" },
  { label: "Planning", href: "/dashboard/provider/planning" },
  { label: "Facturation", href: "/dashboard/provider/devis" },
];

export const ARTISAN_QUICK_ACTIONS: DashboardQuickAction[] = [
  { label: "Accepter une mission", href: "/dashboard/provider/interventions" },
  { label: "Mettre a jour le planning", href: "/dashboard/provider/planning" },
  { label: "Envoyer un devis", href: "/dashboard/provider/devis" },
];

export const ARTISAN_SHORTCUTS: DashboardShortcutItem[] = [
  { label: "Alertes", href: "/dashboard/provider/alertes" },
  { label: "Messages", href: "/dashboard/provider/messages" },
  { label: "Parametres", href: "/dashboard/provider/settings" },
];
