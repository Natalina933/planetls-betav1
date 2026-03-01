import { IconType } from "react-icons";
import {
  FiHome,
  FiUsers,
  FiSettings,
  FiCalendar,
  FiMessageSquare,
  FiFileText,
  FiClipboard,
  FiBox,
  FiTarget,
  FiBell,
  FiTool,
  FiSearch,
  FiPackage,
  FiCreditCard,
} from "react-icons/fi";

export interface SidebarItem {
  label: string;
  path: string;
  icon?: IconType;
  children?: SidebarItem[];
}

export type UserType = "owner" | "concierge" | "provider";

function buildSharedWorkspaceItems(
  basePath: string,
  labels?: {
    planning?: string;
    messages?: string;
    objectifs?: string;
    alertes?: string;
    settings?: string;
  },
): SidebarItem[] {
  return [
    { label: labels?.planning ?? "Planning", path: `${basePath}/planning`, icon: FiCalendar },
    { label: labels?.messages ?? "Messages", path: `${basePath}/messages`, icon: FiMessageSquare },
    { label: labels?.objectifs ?? "Objectifs", path: `${basePath}/objectifs`, icon: FiTarget },
    { label: labels?.alertes ?? "Alertes", path: `${basePath}/alertes`, icon: FiBell },
    { label: labels?.settings ?? "Parametres", path: `${basePath}/settings`, icon: FiSettings },
  ];
}

const providerSidebarItems: SidebarItem[] = [
  { label: "Vue d'ensemble", path: "/dashboard/provider", icon: FiHome },
  { label: "Interventions", path: "/dashboard/provider/interventions", icon: FiTool },
  { label: "Devis et factures", path: "/dashboard/provider/devis", icon: FiFileText },
  { label: "Clients", path: "/dashboard/provider/clients", icon: FiUsers },
  { label: "Outils", path: "/dashboard/provider/outils", icon: FiSettings },
  ...buildSharedWorkspaceItems("/dashboard/provider"),
];

export const sidebarConfig: Record<UserType, SidebarItem[]> = {
  owner: [
    { label: "Vue d'ensemble", path: "/dashboard/owner", icon: FiHome },
    {
      label: "Mes biens",
      path: "/dashboard/owner/logements",
      icon: FiClipboard,
      children: [
        { label: "Logements", path: "/dashboard/owner/logements", icon: FiClipboard },
        { label: "Documents", path: "/dashboard/owner/documents", icon: FiFileText },
        { label: "Stocks et equipements", path: "/dashboard/owner/stocks", icon: FiBox },
      ],
    },
    {
      label: "Conciergerie",
      path: "/dashboard/owner/conciergerie",
      icon: FiUsers,
      children: [
        { label: "Suivi de ma conciergerie", path: "/dashboard/owner/conciergerie", icon: FiUsers },
        { label: "Trouver un concierge", path: "/dashboard/owner/concierges", icon: FiSearch },
        { label: "Contacts", path: "/dashboard/owner/contacts", icon: FiUsers },
      ],
    },
    {
      label: "Finances",
      path: "/dashboard/owner/devis",
      icon: FiCreditCard,
      children: [
        { label: "Devis", path: "/dashboard/owner/devis", icon: FiFileText },
        { label: "Factures", path: "/dashboard/owner/factures", icon: FiCreditCard },
        { label: "Reglement", path: "/dashboard/owner/reglement", icon: FiSettings },
      ],
    },
    ...buildSharedWorkspaceItems("/dashboard/owner", {
      settings: "Parametres du compte",
    }),
  ],

  concierge: [
    { label: "Vue d'ensemble", path: "/dashboard/concierge", icon: FiHome },
    {
      label: "Mon activite",
      path: "/dashboard/concierge/profile?tab=fiche",
      icon: FiClipboard,
      children: [
        { label: "Profil et infos", path: "/dashboard/concierge/profile?tab=fiche", icon: FiClipboard },
        { label: "Tarifs", path: "/dashboard/concierge/profile?tab=tarifs", icon: FiFileText },
        { label: "Missions", path: "/dashboard/concierge/profile?tab=missions", icon: FiCalendar },
        { label: "Packs de services", path: "/dashboard/concierge/profile?tab=packs", icon: FiPackage },
        { label: "Equipe et zones", path: "/dashboard/concierge/profile?tab=equipe", icon: FiUsers },
        { label: "Documents et avis", path: "/dashboard/concierge/profile?tab=documents", icon: FiFileText },
      ],
    },
    { label: "Logements", path: "/dashboard/concierge/logements", icon: FiClipboard },
    { label: "Recherche d'annonces", path: "/dashboard/concierge/recherche", icon: FiSearch },
    { label: "Contacts", path: "/dashboard/concierge/contacts", icon: FiUsers },
    { label: "Stocks", path: "/dashboard/concierge/stocks", icon: FiBox },
    { label: "Abonnement PRO", path: "/abonnement/concierge-pro", icon: FiCreditCard },
    { label: "Facturation Stripe", path: "/dashboard/concierge/billing", icon: FiFileText },
    ...buildSharedWorkspaceItems("/dashboard/concierge"),
  ],

  provider: providerSidebarItems,
};
