import { IconType } from "react-icons";
import {
  FiBell,
  FiBox,
  FiCalendar,
  FiClipboard,
  FiCreditCard,
  FiFileText,
  FiHome,
  FiMessageSquare,
  FiPackage,
  FiSearch,
  FiSettings,
  FiTool,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { buildUnifiedProfileSidebarItems } from "@/app/components/dashboard/profile/unifiedProfileTabsConfig";

export interface SidebarItem {
  label: string;
  path: string;
  icon?: IconType;
  children?: SidebarItem[];
  notificationKey?: string;
}

export type UserType = "admin" | "owner" | "concierge" | "provider";

export const sidebarConfig: Record<UserType, SidebarItem[]> = {
  admin: [
    { label: "Vue plateforme", path: "/dashboard/admin", icon: FiHome },
    { label: "Propriétaires", path: "/dashboard/owner", icon: FiUsers },
    { label: "Conciergeries", path: "/dashboard/concierge", icon: FiClipboard },
    { label: "Artisans", path: "/dashboard/provider", icon: FiTool },
  ],

  owner: [
    { label: "Tableau de bord", path: "/dashboard/owner", icon: FiHome },
    {
      label: "Logements",
      path: "/dashboard/owner/logements/overview",
      icon: FiClipboard,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/owner/logements/overview", icon: FiHome },
        { label: "Tous les logements", path: "/dashboard/owner/logements", icon: FiClipboard },
        { label: "Ajouter un logement", path: "/dashboard/owner/logements/create", icon: FiHome },
        { label: "Documents", path: "/dashboard/owner/documents", icon: FiFileText },
        { label: "Stocks & équipements", path: "/dashboard/owner/stocks", icon: FiBox },
      ],
    },
    {
      label: "Missions",
      path: "/dashboard/owner/missions/overview",
      icon: FiCalendar,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/owner/missions/overview", icon: FiHome },
        { label: "Planning", path: "/dashboard/owner/planning", icon: FiCalendar },
        { label: "Alertes", path: "/dashboard/owner/alertes", icon: FiBell },
        { label: "Mission urgente", path: "/dashboard/owner/mission-urgente", icon: FiTool },
        { label: "Litiges", path: "/dashboard/owner/litiges", icon: FiMessageSquare },
        { label: "Messages", path: "/dashboard/owner/messages", icon: FiMessageSquare },
      ],
    },
    {
      label: "Conciergerie",
      path: "/dashboard/owner/conciergerie/overview",
      icon: FiUsers,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/owner/conciergerie/overview", icon: FiHome },
        {
          label: "Suivi concierge",
          path: "/dashboard/owner/conciergerie",
          icon: FiUsers,
          notificationKey: "owner-service-replies",
        },
        { label: "Trouver un concierge", path: "/dashboard/owner/concierges", icon: FiSearch },
        { label: "Contacts concierge", path: "/dashboard/owner/contacts", icon: FiMessageSquare },
      ],
    },
    {
      label: "Finances",
      path: "/dashboard/owner/finances/overview",
      icon: FiCreditCard,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/owner/finances/overview", icon: FiHome },
        { label: "Factures", path: "/dashboard/owner/factures", icon: FiCreditCard },
        { label: "Devis", path: "/dashboard/owner/devis", icon: FiFileText },
        { label: "Règlements", path: "/dashboard/owner/reglement", icon: FiSettings },
      ],
    },
    {
      label: "Profil",
      path: "/dashboard/owner/settings?tab=overview",
      icon: FiUser,
      children: buildUnifiedProfileSidebarItems("/dashboard/owner/settings"),
    },
  ],

  concierge: [
    { label: "Tableau de bord", path: "/dashboard/concierge", icon: FiHome },
    {
      label: "Missions",
      path: "/dashboard/concierge/missions/overview",
      icon: FiCalendar,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/concierge/missions/overview", icon: FiHome },
        { label: "Planning", path: "/dashboard/concierge/planning", icon: FiCalendar },
        {
          label: "Demandes reçues",
          path: "/dashboard/concierge/demandes",
          icon: FiMessageSquare,
          notificationKey: "concierge-requests",
        },
        { label: "Urgences", path: "/dashboard/concierge/urgences", icon: FiBell },
        { label: "Messages", path: "/dashboard/concierge/messages", icon: FiMessageSquare },
        {
          label: "Services & disponibilités",
          path: "/dashboard/concierge/profile?tab=missions",
          icon: FiClipboard,
        },
      ],
    },
    {
      label: "Logements",
      path: "/dashboard/concierge/logements/overview",
      icon: FiClipboard,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/concierge/logements/overview", icon: FiHome },
        { label: "Tous les logements", path: "/dashboard/concierge/logements", icon: FiClipboard },
        { label: "Ajouter un logement", path: "/dashboard/concierge/logements/create", icon: FiHome },
        { label: "Stocks & équipements", path: "/dashboard/concierge/stocks", icon: FiBox },
      ],
    },
    {
      label: "Propriétaires",
      path: "/dashboard/concierge/proprietaires/overview",
      icon: FiUsers,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/concierge/proprietaires/overview", icon: FiHome },
        { label: "Relations actives", path: "/dashboard/concierge/contacts", icon: FiUsers },
        { label: "Pipeline", path: "/dashboard/concierge/recherche", icon: FiSearch },
        { label: "Messages propriétaires", path: "/dashboard/concierge/messages", icon: FiMessageSquare },
      ],
    },
    {
      label: "Finances",
      path: "/dashboard/concierge/finances/overview",
      icon: FiCreditCard,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/concierge/finances/overview", icon: FiHome },
        { label: "Devis & factures", path: "/dashboard/concierge/billing", icon: FiFileText },
        { label: "Tarifs", path: "/dashboard/concierge/pricing", icon: FiCreditCard },
        { label: "Packs", path: "/dashboard/concierge/services-packages", icon: FiPackage },
      ],
    },
    {
      label: "Profil",
      path: "/dashboard/concierge/profile?tab=overview",
      icon: FiUser,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/concierge/profile?tab=overview", icon: FiHome },
        { label: "Fiche & Infos", path: "/dashboard/concierge/profile?tab=fiche", icon: FiClipboard },
        { label: "Documents & Avis", path: "/dashboard/concierge/profile?tab=documents", icon: FiFileText },
      ],
    },
  ],

  provider: [
    { label: "Tableau de bord", path: "/dashboard/provider", icon: FiHome },
    {
      label: "Interventions",
      path: "/dashboard/provider/interventions/overview",
      icon: FiTool,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/provider/interventions/overview", icon: FiHome },
        { label: "Toutes les interventions", path: "/dashboard/provider/interventions", icon: FiTool },
        { label: "Planning", path: "/dashboard/provider/planning", icon: FiCalendar },
        { label: "Alertes", path: "/dashboard/provider/alertes", icon: FiBell },
        { label: "Messages", path: "/dashboard/provider/messages", icon: FiMessageSquare },
      ],
    },
    {
      label: "Clients",
      path: "/dashboard/provider/clients/overview",
      icon: FiUsers,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/provider/clients/overview", icon: FiHome },
        { label: "Suivi clients", path: "/dashboard/provider/clients", icon: FiUsers },
        { label: "Conversations clients", path: "/dashboard/provider/messages", icon: FiMessageSquare },
      ],
    },
    {
      label: "Finances",
      path: "/dashboard/provider/finances/overview",
      icon: FiCreditCard,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/provider/finances/overview", icon: FiHome },
        { label: "Devis & factures", path: "/dashboard/provider/devis", icon: FiFileText },
      ],
    },
    {
      label: "Profil",
      path: "/dashboard/provider/settings?tab=overview",
      icon: FiUser,
      children: buildUnifiedProfileSidebarItems("/dashboard/provider/settings"),
    },
  ],
};

