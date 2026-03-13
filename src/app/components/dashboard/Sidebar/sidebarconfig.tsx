import { IconType } from "react-icons";
import {
  FiBell,
  FiBox,
  FiCalendar,
  FiClipboard,
  FiCreditCard,
  FiFileText,
  FiHome,
  FiMapPin,
  FiMessageSquare,
  FiPackage,
  FiSearch,
  FiSettings,
  FiTool,
  FiUsers,
} from "react-icons/fi";

export interface SidebarItem {
  label: string;
  path: string;
  icon?: IconType;
  children?: SidebarItem[];
  notificationKey?: string;
}

export type UserType = "owner" | "concierge" | "provider";

export const sidebarConfig: Record<UserType, SidebarItem[]> = {
  owner: [
    { label: "Tableau de bord", path: "/dashboard/owner", icon: FiHome },
    {
      label: "Logements",
      path: "/dashboard/owner/logements",
      icon: FiClipboard,
      children: [
        { label: "Tous les logements", path: "/dashboard/owner/logements", icon: FiClipboard },
        { label: "Ajouter un logement", path: "/dashboard/owner/logements/create", icon: FiHome },
        { label: "Documents", path: "/dashboard/owner/documents", icon: FiFileText },
        { label: "Stocks & équipements", path: "/dashboard/owner/stocks", icon: FiBox },
      ],
    },
    {
      label: "Missions",
      path: "/dashboard/owner/planning",
      icon: FiCalendar,
      children: [
        { label: "Planning", path: "/dashboard/owner/planning", icon: FiCalendar },
        { label: "Alertes", path: "/dashboard/owner/alertes", icon: FiBell },
        { label: "Mission urgente", path: "/dashboard/owner/mission-urgente", icon: FiTool },
        { label: "Litiges", path: "/dashboard/owner/litiges", icon: FiMessageSquare },
      ],
    },
    {
      label: "Conciergerie",
      path: "/dashboard/owner/conciergerie",
      icon: FiUsers,
      children: [
        { label: "Suivi concierge", path: "/dashboard/owner/conciergerie", icon: FiUsers },
        { label: "Trouver un concierge", path: "/dashboard/owner/concierges", icon: FiSearch },
        { label: "Messages", path: "/dashboard/owner/messages", icon: FiMessageSquare },
      ],
    },
    {
      label: "Finances",
      path: "/dashboard/owner/factures",
      icon: FiCreditCard,
      children: [
        { label: "Factures", path: "/dashboard/owner/factures", icon: FiCreditCard },
        { label: "Devis", path: "/dashboard/owner/devis", icon: FiFileText },
        { label: "Règlements", path: "/dashboard/owner/reglement", icon: FiSettings },
      ],
    },
    {
      label: "Paramètres",
      path: "/dashboard/owner/settings",
      icon: FiSettings,
      children: [
        { label: "Profil", path: "/dashboard/owner/settings", icon: FiClipboard },
        { label: "Contacts concierge", path: "/dashboard/owner/contacts", icon: FiMessageSquare },
      ],
    },
  ],

  concierge: [
    { label: "Tableau de bord", path: "/dashboard/concierge", icon: FiHome },
    {
      label: "Missions",
      path: "/dashboard/concierge/planning",
      icon: FiCalendar,
      children: [
        { label: "Vue missions", path: "/dashboard/concierge/planning", icon: FiCalendar },
        {
          label: "Demandes reçues",
          path: "/dashboard/concierge/demandes",
          icon: FiMessageSquare,
          notificationKey: "concierge-requests",
        },
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
        { label: "Stocks & équipements", path: "/dashboard/concierge/stocks", icon: FiBox },
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
        { label: "Équipe & Zones", path: "/dashboard/concierge/profile?tab=equipe", icon: FiMapPin },
        { label: "Documents & Avis", path: "/dashboard/concierge/profile?tab=documents", icon: FiFileText },
      ],
    },
  ],

  provider: [
    { label: "Tableau de bord", path: "/dashboard/provider", icon: FiHome },
    {
      label: "Interventions",
      path: "/dashboard/provider/interventions",
      icon: FiTool,
      children: [
        { label: "Toutes les interventions", path: "/dashboard/provider/interventions", icon: FiTool },
        { label: "Planning", path: "/dashboard/provider/planning", icon: FiCalendar },
        { label: "Alertes", path: "/dashboard/provider/alertes", icon: FiBell },
      ],
    },
    {
      label: "Clients",
      path: "/dashboard/provider/clients",
      icon: FiUsers,
      children: [
        { label: "Suivi clients", path: "/dashboard/provider/clients", icon: FiUsers },
        { label: "Messages", path: "/dashboard/provider/messages", icon: FiMessageSquare },
      ],
    },
    {
      label: "Finances",
      path: "/dashboard/provider/devis",
      icon: FiCreditCard,
      children: [
        { label: "Devis & factures", path: "/dashboard/provider/devis", icon: FiFileText },
      ],
    },
    {
      label: "Paramètres",
      path: "/dashboard/provider/settings",
      icon: FiSettings,
      children: [
        { label: "Profil", path: "/dashboard/provider/settings", icon: FiClipboard },
        { label: "Outils", path: "/dashboard/provider/outils", icon: FiSettings },
      ],
    },
  ],
};
