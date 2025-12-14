// src/app/components/dashboard/Sidebar/sidebarconfig.tsx
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
} from "react-icons/fi";

export interface SidebarItem {
  label: string;
  path: string;
  icon?: IconType;
  children?: SidebarItem[];
}

export type UserType = "owner" | "concierge" | "providence" | "artisan";

export const sidebarConfig: Record<UserType, SidebarItem[]> = {
  owner: [
    { label: "Mon tableau de bord", path: "/dashboard/owner", icon: FiHome },
    { label: "Mes Logements", path: "/dashboard/owner/logements", icon: FiClipboard },
    { label: "Ma Conciergerie", path: "/dashboard/owner/conciergerie", icon: FiUsers },
    { label: "Planning", path: "/dashboard/owner/planning", icon: FiCalendar },
    { label: "Messagerie", path: "/dashboard/owner/messages", icon: FiMessageSquare },
    { label: "Mes Contacts", path: "/dashboard/owner/contacts", icon: FiUsers },
    { label: "Mes Documents", path: "/dashboard/owner/documents", icon: FiFileText },
    { label: "Mes Objectifs", path: "/dashboard/owner/objectifs", icon: FiTarget },
    { label: "Mon Règlement", path: "/dashboard/owner/reglement", icon: FiSettings },
    { label: "Mes stocks", path: "/dashboard/owner/stocks", icon: FiBox },
    { label: "Alertes", path: "/dashboard/owner/alertes", icon: FiBell },
    { label: "Paramètres", path: "/dashboard/owner/settings", icon: FiSettings },
  ],

  concierge: [
    { label: "Mon tableau de bord", path: "/dashboard/concierge", icon: FiHome },
    {
      label: "Ma Conciergerie",
      path: "/dashboard/concierge/profile?tab=fiche",
      icon: FiClipboard,
      children: [
        { label: "Fiche & Infos", path: "/dashboard/concierge/profile?tab=fiche", icon: FiClipboard },
        { label: "Missions", path: "/dashboard/concierge/profile?tab=missions", icon: FiCalendar },
        { label: "Tarifs & Contrats", path: "/dashboard/concierge/profile?tab=tarifs", icon: FiFileText },
        { label: "Équipe & Zones", path: "/dashboard/concierge/profile?tab=equipe", icon: FiUsers },
        { label: "Documents & Avis", path: "/dashboard/concierge/profile?tab=documents", icon: FiFileText }
      ]
    },
    { label: "Logements", path: "/dashboard/concierge/logements", icon: FiClipboard },
    { label: "Recherche mes annonces", path: "/dashboard/concierge/recherche", icon: FiSearch },
    { label: "Contacts", path: "/dashboard/concierge/contacts", icon: FiUsers },
    { label: "Objectifs", path: "/dashboard/concierge/objectifs", icon: FiTarget },
    { label: "Planning", path: "/dashboard/concierge/planning", icon: FiCalendar },
    { label: "Stocks", path: "/dashboard/concierge/stocks", icon: FiBox },
    { label: "Messagerie", path: "/dashboard/concierge/messages", icon: FiMessageSquare },
    { label: "Alertes", path: "/dashboard/concierge/alertes", icon: FiBell },
    { label: "Paramètres", path: "/dashboard/concierge/settings", icon: FiSettings },
  ],


  providence: [
    { label: "Mon tableau de bord", path: "/dashboard/providence", icon: FiHome },
    { label: "Mes Tâches", path: "/dashboard/providence/taches", icon: FiClipboard },
    { label: "Mes Stocks", path: "/dashboard/providence/stocks", icon: FiBox },
    { label: "Mes Campagnes", path: "/dashboard/providence/campagnes", icon: FiTarget },
    { label: "Planning", path: "/dashboard/providence/planning", icon: FiCalendar },
    { label: "Messagerie", path: "/dashboard/providence/messages", icon: FiMessageSquare },
    { label: "Outils", path: "/dashboard/providence/outils", icon: FiTool },
    { label: "Alertes", path: "/dashboard/providence/alertes", icon: FiBell },
    { label: "Mes Documents", path: "/dashboard/providence/documents", icon: FiFileText },
    { label: "Paramètres", path: "/dashboard/providence/settings", icon: FiSettings },
  ],

  artisan: [
    { label: "Mon tableau de bord", path: "/dashboard/artisan", icon: FiHome },
    { label: "Mes Interventions", path: "/dashboard/artisan/interventions", icon: FiTool },
    { label: "Planning", path: "/dashboard/artisan/planning", icon: FiCalendar },
    { label: "Devis & Factures", path: "/dashboard/artisan/devis", icon: FiFileText },
    { label: "Mes Clients", path: "/dashboard/artisan/clients", icon: FiUsers },
    { label: "Messagerie", path: "/dashboard/artisan/messages", icon: FiMessageSquare },
    { label: "Mes Outils", path: "/dashboard/artisan/outils", icon: FiSettings },
    { label: "Alertes", path: "/dashboard/artisan/alertes", icon: FiBell },
    { label: "Paramètres", path: "/dashboard/artisan/settings", icon: FiSettings },
  ],
};