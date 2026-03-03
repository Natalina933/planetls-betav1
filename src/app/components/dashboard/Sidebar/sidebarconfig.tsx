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
    { label: labels?.planning ?? "Pilotage planning", path: `${basePath}/planning`, icon: FiCalendar },
    { label: labels?.messages ?? "Suivi messages", path: `${basePath}/messages`, icon: FiMessageSquare },
    { label: labels?.objectifs ?? "Pilotage objectifs", path: `${basePath}/objectifs`, icon: FiTarget },
    { label: labels?.alertes ?? "Points d'attention", path: `${basePath}/alertes`, icon: FiBell },
    { label: labels?.settings ?? "Paramètres", path: `${basePath}/settings`, icon: FiSettings },
  ];
}

const providerSidebarItems: SidebarItem[] = [
  { label: "Vue prioritaire", path: "/dashboard/provider", icon: FiHome },
  { label: "Interventions", path: "/dashboard/provider/interventions", icon: FiTool },
  { label: "Devis et factures", path: "/dashboard/provider/devis", icon: FiFileText },
  { label: "Suivi clients", path: "/dashboard/provider/clients", icon: FiUsers },
  { label: "Outils", path: "/dashboard/provider/outils", icon: FiSettings },
  ...buildSharedWorkspaceItems("/dashboard/provider", {
    planning: "Pilotage planning",
    messages: "Suivi des échanges",
    objectifs: "Objectifs d'activité",
    alertes: "Points d'attention",
    settings: "Compte et configuration",
  }),
];

export const sidebarConfig: Record<UserType, SidebarItem[]> = {
  owner: [
    { label: "Vue prioritaire", path: "/dashboard/owner", icon: FiHome },
    {
      label: "Parc immobilier",
      path: "/dashboard/owner/logements",
      icon: FiClipboard,
      children: [
        { label: "Logements", path: "/dashboard/owner/logements", icon: FiClipboard },
        { label: "Documents", path: "/dashboard/owner/documents", icon: FiFileText },
        { label: "Stocks et équipements", path: "/dashboard/owner/stocks", icon: FiBox },
      ],
    },
    {
      label: "Relation concierge",
      path: "/dashboard/owner/conciergerie",
      icon: FiUsers,
      children: [
        { label: "Suivi de ma conciergerie", path: "/dashboard/owner/conciergerie", icon: FiUsers },
        { label: "Trouver un concierge", path: "/dashboard/owner/concierges", icon: FiSearch },
        { label: "Contacts et échanges", path: "/dashboard/owner/contacts", icon: FiUsers },
      ],
    },
    {
      label: "Pilotage financier",
      path: "/dashboard/owner/devis",
      icon: FiCreditCard,
      children: [
        { label: "Devis", path: "/dashboard/owner/devis", icon: FiFileText },
        { label: "Factures", path: "/dashboard/owner/factures", icon: FiCreditCard },
        { label: "Règlements", path: "/dashboard/owner/reglement", icon: FiSettings },
      ],
    },
    ...buildSharedWorkspaceItems("/dashboard/owner", {
      planning: "Suivi des interventions",
      messages: "Suivi des échanges",
      objectifs: "Objectifs de pilotage",
      alertes: "Points d'attention",
      settings: "Paramètres du compte",
    }),
  ],

  concierge: [
    { label: "Vue prioritaire", path: "/dashboard/concierge", icon: FiHome },
    {
      label: "Offre et positionnement",
      path: "/dashboard/concierge/profile?tab=fiche",
      icon: FiClipboard,
      children: [
        { label: "Profil et infos", path: "/dashboard/concierge/profile?tab=fiche", icon: FiClipboard },
        { label: "Tarifs", path: "/dashboard/concierge/profile?tab=tarifs", icon: FiFileText },
        { label: "Missions", path: "/dashboard/concierge/profile?tab=missions", icon: FiCalendar },
        { label: "Packs de services", path: "/dashboard/concierge/profile?tab=packs", icon: FiPackage },
        { label: "Équipe et zones", path: "/dashboard/concierge/profile?tab=equipe", icon: FiUsers },
        { label: "Documents et avis", path: "/dashboard/concierge/profile?tab=documents", icon: FiFileText },
      ],
    },
    { label: "Parc géré", path: "/dashboard/concierge/logements", icon: FiClipboard },
    { label: "Prospection propriétaires", path: "/dashboard/concierge/recherche", icon: FiSearch },
    { label: "Contacts et relation", path: "/dashboard/concierge/contacts", icon: FiUsers },
    { label: "Stocks et terrain", path: "/dashboard/concierge/stocks", icon: FiBox },
    { label: "Offre PRO", path: "/abonnement/concierge-pro", icon: FiCreditCard },
    { label: "Facturation et revenus", path: "/dashboard/concierge/billing", icon: FiFileText },
    ...buildSharedWorkspaceItems("/dashboard/concierge", {
      planning: "Pilotage terrain",
      messages: "Suivi des conversations",
      objectifs: "Objectifs d'activité",
      alertes: "Points d'attention",
    }),
  ],

  provider: providerSidebarItems,
};
