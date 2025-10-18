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

interface SidebarItem {
  label: string;
  path: string;
  icon?: IconType;
}

export type UserType = "owner" | "concierge" | "providence";

export const sidebarConfig: Record<UserType, SidebarItem[]> = {
  owner: [
    { label: "Mon tableau de bord", path: "/dashboard/owner", icon: FiHome },
    { label: "Mes Logements", path: "/dashboard/owner/logements", icon: FiClipboard },
    { label: "Ma Conciergerie", path: "/dashboard/owner/conciergerie", icon: FiUsers },
    { label: "Planning", path: "/dashboard/owner/planning", icon: FiCalendar },
    { label: "Messagerie", path: "/dashboard/owner/messages", icon: FiMessageSquare },
    { label: "Mes Contacts", path: "/dashboard/owner/contacts", icon: FiUsers },
    { label: "Mes Documents", path: "/dashboard/owner/documents", icon: FiFileText },
    { label: "Alertes", path: "/dashboard/owner/alertes", icon: FiBell },
    { label: "Paramètres", path: "/dashboard/owner/settings", icon: FiSettings },
  ],

  concierge: [
    { label: "Mon tableau de bord", path: "/dashboard/concierge", icon: FiHome },
    { label: "Ma Conciergerie", path: "/dashboard/concierge/fiche", icon: FiClipboard },
    { label: "Mes Informations", path: "/dashboard/concierge/informations", icon: FiFileText },
    { label: "Mon Règlement", path: "/dashboard/concierge/reglement", icon: FiSettings },
    { label: "Mes Objectifs", path: "/dashboard/concierge/objectifs", icon: FiTarget },
    { label: "Planning", path: "/dashboard/concierge/planning", icon: FiCalendar },
    { label: "Messagerie", path: "/dashboard/concierge/messages", icon: FiMessageSquare },
    { label: "Alertes", path: "/dashboard/concierge/alertes", icon: FiBell },
    { label: "Recherche Logement", path: "/dashboard/concierge/recherche", icon: FiSearch },
    { label: "Mes Documents", path: "/dashboard/concierge/documents", icon: FiFileText },
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
};
