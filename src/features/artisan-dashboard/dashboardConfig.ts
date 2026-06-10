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
  {
    label: "Completer mon profil metier",
    href: "/dashboard/provider/settings",
    badge: "A faire en premier",
    description: "Precisez votre zone, vos specialites et vos coordonnees pour rendre votre profil exploitable.",
  },
  {
    label: "Suivre les interventions",
    href: "/dashboard/provider/interventions",
    badge: "Terrain",
    description: "Gardez les missions ouvertes, les urgences et les dossiers a confirmer au meme endroit.",
  },
  {
    label: "Envoyer un devis",
    href: "/dashboard/provider/devis",
    badge: "Conversion",
    description: "Transformez une demande qualifiee en proposition claire pour votre client.",
  },
];

export const ARTISAN_SHORTCUTS: DashboardShortcutItem[] = [
  { label: "Alertes", href: "/dashboard/provider/alertes" },
  { label: "Messages", href: "/dashboard/provider/messages" },
  { label: "Parametres", href: "/dashboard/provider/settings" },
];
