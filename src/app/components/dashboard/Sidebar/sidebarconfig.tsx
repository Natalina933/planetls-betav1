import { IconType } from "react-icons";
import {
  FiBell,
  FiBookOpen,
  FiBox,
  FiCalendar,
  FiClipboard,
  FiCreditCard,
  FiFileText,
  FiImage,
  FiMessageSquare,
  FiPackage,
  FiSearch,
  FiSettings,
  FiTool,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { buildUnifiedProfileSidebarItems } from "@/app/components/dashboard/profile/unifiedProfileTabsConfig";
import { DashboardGaugeIcon, DashboardHomeIcon, DashboardHousesIcon } from "@/components/ui/PublicIcon";

export interface SidebarItem {
  section?: string;
  label: string;
  path: string;
  icon?: IconType;
  children?: SidebarItem[];
  notificationKey?: string;
}

export type UserType = "admin" | "owner" | "concierge" | "provider";

export const sidebarConfig: Record<UserType, SidebarItem[]> = {
  admin: [
    { label: "Vue plateforme", path: "/dashboard/admin", icon: DashboardGaugeIcon },
    { label: "Pilotage business", path: "/dashboard/admin/pilotage", icon: FiCreditCard },
    { label: "Modèle financier", path: "/dashboard/admin/modele-financier", icon: FiClipboard },
    { label: "Personas", path: "/dashboard/admin/personas", icon: FiUsers },
    { label: "Contrôle détaillé", path: "/dashboard/admin/controle", icon: FiBell },
    { label: "Développement", path: "/dashboard/admin/developpement", icon: FiBookOpen },
    { label: "Design & maquettes", path: "/dashboard/admin/design", icon: FiImage },
  ],

  owner: [
    { section: "Pilotage", label: "Tableau de bord", path: "/dashboard/owner", icon: DashboardGaugeIcon },
    {
      label: "Mes logements",
      path: "/dashboard/owner/logements",
      icon: DashboardHomeIcon,
      children: [
        { label: "Tous mes logements", path: "/dashboard/owner/logements", icon: DashboardHousesIcon },
        { label: "Ajouter un logement", path: "/dashboard/owner/logements/create", icon: DashboardHomeIcon },
        { label: "Équipements & stocks", path: "/dashboard/owner/stocks", icon: FiBox },
      ],
    },
    { label: "Calendrier", path: "/dashboard/owner/planning", icon: FiCalendar },
    { section: "Collaborations", label: "Rechercher un partenaire", path: "/dashboard/owner/concierges", icon: FiSearch },
    {
      label: "Mes demandes",
      path: "/dashboard/owner/demandes",
      icon: FiMessageSquare,
      notificationKey: "owner-service-replies",
    },
    { label: "Mes partenaires", path: "/dashboard/owner/conciergerie/partenaires", icon: FiUsers },
    {
      section: "Activité",
      label: "Missions",
      path: "/dashboard/owner/missions/overview",
      icon: FiBookOpen,
      children: [
        { label: "Séjours", path: "/dashboard/owner/missions/voyageurs", icon: FiUsers },
        { label: "Arrivées & départs", path: "/dashboard/owner/planning?type=movements", icon: FiCalendar },
        { label: "Maintenance", path: "/dashboard/owner/planning?type=maintenance", icon: FiTool },
        { label: "Alertes & urgences", path: "/dashboard/owner/alertes", icon: FiBell },
        { label: "Litiges", path: "/dashboard/owner/litiges", icon: FiMessageSquare },
      ],
    },
    { label: "Messages", path: "/dashboard/owner/messages", icon: FiMessageSquare },
    { section: "Gestion", label: "Devis", path: "/dashboard/owner/devis", icon: FiFileText },
    {
      label: "Factures",
      path: "/dashboard/owner/factures",
      icon: FiCreditCard,
      children: [
        { label: "Suivi financier", path: "/dashboard/owner/finances/overview", icon: FiCreditCard },
        { label: "Règlements", path: "/dashboard/owner/reglement", icon: FiSettings },
      ],
    },
    { label: "Documents", path: "/dashboard/owner/documents", icon: FiFileText },
    { section: "En bas", label: "Paramètres", path: "/dashboard/owner/settings?tab=overview", icon: FiUser },
  ],

  concierge: [
    { label: "Tableau de bord", path: "/dashboard/concierge", icon: DashboardGaugeIcon },
    { label: "Calendrier", path: "/dashboard/concierge/planning", icon: FiCalendar },

    { section: "MON RÉSEAU", label: "Rechercher un propriétaire", path: "/dashboard/concierge/recherche", icon: FiSearch },
    {
      label: "Mes demandes",
      path: "/dashboard/concierge/demandes",
      icon: FiMessageSquare,
      notificationKey: "concierge-requests",
    },
    { label: "Mes partenaires", path: "/dashboard/concierge/contacts", icon: FiUsers },

    { section: "MON ACTIVITÉ", label: "Logements", path: "/dashboard/concierge/logements", icon: DashboardHousesIcon },
    { label: "Séjours", path: "/dashboard/concierge/sejours", icon: FiUsers },
    { label: "Interventions", path: "/dashboard/concierge/maintenance", icon: FiTool },
    { label: "Messages", path: "/dashboard/concierge/messages", icon: FiMessageSquare },

    { section: "MON SUIVI", label: "Devis", path: "/dashboard/concierge/billing", icon: FiFileText },
    { label: "Factures", path: "/dashboard/concierge/billing", icon: FiCreditCard },
    { label: "Documents", path: "/dashboard/concierge/profile?tab=documents", icon: FiFileText },

    { section: "En bas", label: "Paramètres", path: "/dashboard/concierge/settings", icon: FiSettings },
  ],

  provider: [
    { label: "Tableau de bord", path: "/dashboard/provider", icon: DashboardGaugeIcon },
    {
      label: "Interventions",
      path: "/dashboard/provider/interventions/overview",
      icon: FiTool,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/provider/interventions/overview", icon: DashboardGaugeIcon },
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
        { label: "Vue d'ensemble", path: "/dashboard/provider/clients/overview", icon: DashboardGaugeIcon },
        { label: "Suivi clients", path: "/dashboard/provider/clients", icon: FiUsers },
        { label: "Conversations clients", path: "/dashboard/provider/messages", icon: FiMessageSquare },
      ],
    },
    {
      label: "Finances",
      path: "/dashboard/provider/finances/overview",
      icon: FiCreditCard,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/provider/finances/overview", icon: DashboardGaugeIcon },
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
