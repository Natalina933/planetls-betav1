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
  FiMapPin,
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
    { label: labels?.messages ?? "Conversations", path: `${basePath}/messages`, icon: FiMessageSquare },
    { label: labels?.objectifs ?? "Objectifs", path: `${basePath}/objectifs`, icon: FiTarget },
    { label: labels?.alertes ?? "Alertes", path: `${basePath}/alertes`, icon: FiBell },
    { label: labels?.settings ?? "Paramètres", path: `${basePath}/settings`, icon: FiSettings },
  ];
}

const providerSidebarItems: SidebarItem[] = [
  { label: "Tableau de bord", path: "/dashboard/provider", icon: FiHome },
  { label: "Interventions", path: "/dashboard/provider/interventions", icon: FiTool },
  { label: "Devis et factures", path: "/dashboard/provider/devis", icon: FiFileText },
  { label: "Suivi clients", path: "/dashboard/provider/clients", icon: FiUsers },
  { label: "Outils", path: "/dashboard/provider/outils", icon: FiSettings },
  ...buildSharedWorkspaceItems("/dashboard/provider"),
];

export const sidebarConfig: Record<UserType, SidebarItem[]> = {
  owner: [
    { label: "Tableau de bord", path: "/dashboard/owner", icon: FiHome },
    {
      label: "Parc immobilier",
      path: "/dashboard/owner/logements",
      icon: FiClipboard,
      children: [
        { label: "Logements", path: "/dashboard/owner/logements", icon: FiClipboard },
        { label: "Ajouter un logement", path: "/dashboard/owner/logements/create", icon: FiHome },
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
        { label: "Conversations", path: "/dashboard/owner/contacts", icon: FiUsers },
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
    ...buildSharedWorkspaceItems("/dashboard/owner"),
  ],

  concierge: [
    { label: "Tableau de bord", path: "/dashboard/concierge", icon: FiHome },
    {
      label: "Missions",
      path: "/dashboard/concierge/planning",
      icon: FiCalendar,
      children: [
        { label: "Vue missions", path: "/dashboard/concierge/planning", icon: FiCalendar },
        { label: "Demandes reçues", path: "/dashboard/concierge/demandes", icon: FiMessageSquare },
        { label: "Urgences", path: "/dashboard/concierge/urgences", icon: FiBell },
        { label: "Configuration missions", path: "/dashboard/concierge/profile?tab=missions", icon: FiClipboard },
      ],
    },
    {
      label: "Logements",
      path: "/dashboard/concierge/logements",
      icon: FiClipboard,
      children: [
        { label: "Tous les logements", path: "/dashboard/concierge/logements", icon: FiClipboard },
        { label: "Ajouter un logement", path: "/dashboard/concierge/logements/create", icon: FiHome },
        { label: "Stocks et équipements", path: "/dashboard/concierge/stocks", icon: FiBox },
      ],
    },
    {
      label: "Propriétaires",
      path: "/dashboard/concierge/contacts",
      icon: FiUsers,
      children: [
        { label: "Relations actives", path: "/dashboard/concierge/contacts", icon: FiUsers },
        { label: "Pipeline", path: "/dashboard/concierge/recherche", icon: FiSearch },
        { label: "Conversations", path: "/dashboard/concierge/messages", icon: FiMessageSquare },
      ],
    },
    {
      label: "Finances",
      path: "/dashboard/concierge/profile?tab=devis",
      icon: FiCreditCard,
      children: [
        { label: "Devis & factures", path: "/dashboard/concierge/profile?tab=devis", icon: FiFileText },
        { label: "Grille tarifaire", path: "/dashboard/concierge/profile?tab=tarifs", icon: FiCreditCard },
        { label: "Mes Packs", path: "/dashboard/concierge/profile?tab=packs", icon: FiPackage },
      ],
    },
    {
      label: "Paramètres",
      path: "/dashboard/concierge/profile?tab=fiche",
      icon: FiSettings,
      children: [
        { label: "Fiche & Infos", path: "/dashboard/concierge/profile?tab=fiche", icon: FiClipboard },
        { label: "Equipe & Zones", path: "/dashboard/concierge/profile?tab=equipe", icon: FiMapPin },
        { label: "Documents & Avis", path: "/dashboard/concierge/profile?tab=documents", icon: FiFileText },
      ],
    },
  ],

  provider: providerSidebarItems,
};
