import type { DashboardNavItem, DashboardQuickAction, DashboardShortcutItem } from "@/components/dashboard";

export const OWNER_DASHBOARD_CONFIG = {
  title: "Tableau de bord",
  defaultSubtitle:
    "Suivi des biens, revenus, interventions et relation conciergerie depuis une vue unique.",
  navTitle: "Sections propriétaire",
  profileName: "Espace propriétaire",
} as const;

export const OWNER_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Mes biens", href: "/dashboard/owner/logements" },
  { label: "Trouver une conciergerie", href: "/dashboard/owner/concierges" },
  { label: "Revenus", href: "/dashboard/owner/factures" },
  { label: "Litiges", href: "/dashboard/owner/litiges" },
  { label: "Messages", href: "/dashboard/owner/messages" },
];

export const OWNER_QUICK_ACTIONS: DashboardQuickAction[] = [
  {
    label: "Ajouter mon logement",
    href: "/dashboard/owner/logements/create",
    badge: "A faire en premier",
    description: "Creez la fiche du bien pour lancer le suivi, les demandes et les futures mises en relation.",
  },
  {
    label: "Trouver une conciergerie",
    href: "/dashboard/owner/concierges",
    badge: "Mise en relation",
    description: "Comparez les profils disponibles et gardez un interlocuteur clair pour votre bien.",
  },
  {
    label: "Demander une intervention",
    href: "/dashboard/owner/mission-urgente",
    badge: "Besoin urgent",
    description: "Signalez une demande terrain quand un point bloque l'exploitation ou la satisfaction.",
  },
];

export const OWNER_SHORTCUTS: DashboardShortcutItem[] = [
  { label: "Annonces", href: "/dashboard/owner/logements" },
  { label: "Conciergerie", href: "/dashboard/owner/conciergerie" },
  { label: "Devis", href: "/dashboard/owner/devis" },
  { label: "Litiges", href: "/dashboard/owner/litiges" },
  { label: "Planning", href: "/dashboard/owner/planning" },
];
