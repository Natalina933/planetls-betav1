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
  ],

  owner: [
    { label: "Tableau de bord", path: "/dashboard/owner", icon: DashboardGaugeIcon },
    {
      label: "Logements",
      path: "/dashboard/owner/logements/overview",
      icon: DashboardHomeIcon,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/owner/logements/overview", icon: DashboardGaugeIcon },
        { label: "Tous les logements", path: "/dashboard/owner/logements", icon: DashboardHousesIcon },
        { label: "Ajouter un logement", path: "/dashboard/owner/logements/create", icon: DashboardHomeIcon },
        { label: "Documents", path: "/dashboard/owner/documents", icon: FiFileText },
        { label: "Stocks & équipements", path: "/dashboard/owner/stocks", icon: FiBox },
      ],
    },
    {
      label: "Missions",
      path: "/dashboard/owner/missions/overview",
      icon: FiCalendar,
      children: [
        { label: "Vue globale", path: "/dashboard/owner/missions/overview", icon: DashboardGaugeIcon },
        { label: "Séjours voyageurs", path: "/dashboard/owner/missions/voyageurs", icon: FiUsers },
        { label: "Planning", path: "/dashboard/owner/planning", icon: FiCalendar },
        { label: "Arrivées voyageurs", path: "/dashboard/owner/planning?type=arrival", icon: FiCalendar },
        { label: "Départs voyageurs", path: "/dashboard/owner/planning?type=departure", icon: FiCalendar },
        { label: "Maintenance", path: "/dashboard/owner/planning?type=maintenance", icon: FiTool },
        { label: "Alertes", path: "/dashboard/owner/alertes", icon: FiBell },
        { label: "Urgences", path: "/dashboard/owner/mission-urgente", icon: FiBell },
        { label: "Litiges", path: "/dashboard/owner/litiges", icon: FiMessageSquare },
      ],
    },
    {
      label: "Conciergeries",
      path: "/dashboard/owner/conciergerie/overview",
      icon: FiUsers,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/owner/conciergerie/overview", icon: DashboardGaugeIcon },
        { label: "Recherche", path: "/dashboard/owner/concierges", icon: FiSearch },
        {
          label: "Demandes",
          path: "/dashboard/owner/demandes",
          icon: FiMessageSquare,
          notificationKey: "owner-service-replies",
        },
        {
          label: "Partenaires acceptés",
          path: "/dashboard/owner/conciergerie/partenaires",
          icon: FiUsers,
          notificationKey: "owner-service-replies",
        },
        { label: "Discussions", path: "/dashboard/owner/messages?scope=conciergeries", icon: FiMessageSquare },
        { label: "Contacts", path: "/dashboard/owner/contacts", icon: FiUsers },
      ],
    },
    {
      label: "Finances",
      path: "/dashboard/owner/finances/overview",
      icon: FiCreditCard,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/owner/finances/overview", icon: DashboardGaugeIcon },
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
    { label: "Tableau de bord", path: "/dashboard/concierge", icon: DashboardGaugeIcon },
    {
      label: "Missions",
      path: "/dashboard/concierge/missions/overview",
      icon: FiCalendar,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/concierge/missions/overview", icon: DashboardGaugeIcon },
        { label: "Séjours voyageurs", path: "/dashboard/concierge/sejours", icon: FiUsers },
        { label: "Planning", path: "/dashboard/concierge/planning", icon: FiCalendar },
        { label: "Urgences", path: "/dashboard/concierge/urgences", icon: FiBell },
        { label: "Maintenance", path: "/dashboard/concierge/maintenance", icon: FiTool },
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
      icon: DashboardHomeIcon,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/concierge/logements/overview", icon: DashboardGaugeIcon },
        { label: "Tous les logements", path: "/dashboard/concierge/logements", icon: DashboardHousesIcon },
        { label: "Ajouter un logement", path: "/dashboard/concierge/logements/create", icon: DashboardHomeIcon },
        { label: "Stocks & équipements", path: "/dashboard/concierge/stocks", icon: FiBox },
        { label: "Assistant Décoration IA", path: "/dashboard/concierge/decoration-ai", icon: FiImage },
      ],
    },
    {
      label: "Propriétaires",
      path: "/dashboard/concierge/proprietaires/overview",
      icon: FiUsers,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/concierge/proprietaires/overview", icon: DashboardGaugeIcon },
        {
          label: "Demandes reçues",
          path: "/dashboard/concierge/demandes",
          icon: FiMessageSquare,
          notificationKey: "concierge-requests",
        },
        { label: "Relations actives", path: "/dashboard/concierge/contacts", icon: FiUsers },
        { label: "Prospection", path: "/dashboard/concierge/recherche", icon: FiSearch },
        { label: "Messages propriétaires", path: "/dashboard/concierge/messages", icon: FiMessageSquare },
      ],
    },
    {
      label: "Finances",
      path: "/dashboard/concierge/finances/overview",
      icon: FiCreditCard,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/concierge/finances/overview", icon: DashboardGaugeIcon },
        { label: "Devis & factures", path: "/dashboard/concierge/billing", icon: FiFileText },
        { label: "Simulation", path: "/dashboard/concierge/finances/simulation", icon: FiCreditCard },
        { label: "Tarifs", path: "/dashboard/concierge/pricing", icon: FiCreditCard },
        { label: "Packs", path: "/dashboard/concierge/services-packages", icon: FiPackage },
      ],
    },
    {
      label: "Profil",
      path: "/dashboard/concierge/profile?tab=overview",
      icon: FiUser,
      children: [
        { label: "Vue d'ensemble", path: "/dashboard/concierge/profile?tab=overview", icon: DashboardGaugeIcon },
        { label: "Fiche & Infos", path: "/dashboard/concierge/profile?tab=fiche", icon: FiClipboard },
        { label: "Documents & Avis", path: "/dashboard/concierge/profile?tab=documents", icon: FiFileText },
      ],
    },
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
