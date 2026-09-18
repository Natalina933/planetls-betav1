import { IconType } from "react-icons";
import { ownerDashboardContent } from "@/features/owner-dashboard/ownerDashboardContent";
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
    { label: "Tableau de bord", path: "/dashboard/owner", icon: DashboardGaugeIcon },
    {
      section: "Gestion",
      label: ownerDashboardContent.navigation.properties,
      path: "/dashboard/owner/logements/overview",
      icon: DashboardHomeIcon,
      children: [
        { label: "Tous mes logements", path: "/dashboard/owner/logements", icon: DashboardHousesIcon },
        { label: "Ajouter un logement", path: "/dashboard/owner/logements/create", icon: DashboardHomeIcon },
        { label: "Équipements & stocks", path: "/dashboard/owner/stocks", icon: FiBox },
        { label: "Documents", path: "/dashboard/owner/documents", icon: FiFileText },
      ],
    },
    {
      label: ownerDashboardContent.navigation.reservations,
      path: "/dashboard/owner/missions/voyageurs",
      icon: FiBookOpen,
      children: [
        { label: "Séjours", path: "/dashboard/owner/missions/voyageurs", icon: FiUsers },
        { label: "Calendrier", path: "/dashboard/owner/planning", icon: FiCalendar },
      ],
    },
    {
      label: ownerDashboardContent.navigation.interventions,
      path: "/dashboard/owner/missions/overview",
      icon: FiCalendar,
      children: [
        { label: "Arrivées & départs", path: "/dashboard/owner/planning?type=movements", icon: FiCalendar },
        { label: "Maintenance", path: "/dashboard/owner/planning?type=maintenance", icon: FiTool },
        { label: "Alertes & urgences", path: "/dashboard/owner/alertes", icon: FiBell },
        { label: "Litiges", path: "/dashboard/owner/litiges", icon: FiMessageSquare },
      ],
    },
    {
      label: "Conciergeries",
      section: "Mon équipe",
      path: "/dashboard/owner/conciergerie/overview",
      icon: FiUsers,
      children: [
        {
          label: "Mes partenaires",
          path: "/dashboard/owner/conciergerie/partenaires",
          icon: FiUsers,
          notificationKey: "owner-service-replies",
        },
        { label: "Trouver une conciergerie", path: "/dashboard/owner/concierges", icon: FiSearch },
        {
          label: "Mes demandes",
          path: "/dashboard/owner/demandes",
          icon: FiMessageSquare,
          notificationKey: "owner-service-replies",
        },
      ],
    },
    { label: ownerDashboardContent.navigation.messages, path: "/dashboard/owner/messages", icon: FiMessageSquare },
    {
      label: "Finances",
      section: "Finances",
      path: "/dashboard/owner/finances/overview",
      icon: FiCreditCard,
      children: [
        { label: "Devis", path: "/dashboard/owner/devis", icon: FiFileText },
        { label: "Factures", path: "/dashboard/owner/factures", icon: FiCreditCard },
        { label: "Règlements", path: "/dashboard/owner/reglement", icon: FiSettings },
      ],
    },
    {
      label: ownerDashboardContent.navigation.settings,
      path: "/dashboard/owner/settings?tab=overview",
      icon: FiUser,
    },
  ],

  concierge: [
    { label: "Tableau de bord", path: "/dashboard/concierge", icon: DashboardGaugeIcon },
    { section: "Mon activité", label: "Missions", path: "/dashboard/concierge/missions", icon: FiCalendar },
    { label: "Planning & tournées", path: "/dashboard/concierge/planning", icon: FiCalendar },
    { label: "Urgences", path: "/dashboard/concierge/urgences", icon: FiBell },
    {
      section: "Commercial",
      label: "Demandes",
      path: "/dashboard/concierge/demandes",
      icon: FiMessageSquare,
      notificationKey: "concierge-requests",
    },
    { label: "Devis", path: "/dashboard/concierge/billing", icon: FiFileText },
    { label: "Collaborations", path: "/dashboard/concierge/contacts", icon: FiUsers },
    { label: "Contrats", path: "/dashboard/concierge/contract-templates", icon: FiClipboard },
    { label: "Offre de services", path: "/dashboard/concierge/missions/overview", icon: FiPackage },
    { label: "Prospection", path: "/dashboard/concierge/recherche", icon: FiSearch },
    {
      section: "Clients",
      label: "Propriétaires",
      path: "/dashboard/concierge/proprietaires/overview",
      icon: FiUsers,
    },
    { label: "Logements", path: "/dashboard/concierge/logements", icon: DashboardHousesIcon },
    { label: "Voyageurs & séjours", path: "/dashboard/concierge/sejours", icon: FiUsers },
    {
      section: "Prestataires",
      label: "Artisans & interventions",
      path: "/dashboard/concierge/maintenance",
      icon: FiTool,
    },
    { section: "Gestion", label: "Messages", path: "/dashboard/concierge/messages", icon: FiMessageSquare },
    { label: "Documents", path: "/dashboard/concierge/profile?tab=documents", icon: FiFileText },
    { label: "Stocks", path: "/dashboard/concierge/stocks", icon: FiBox },
    { label: "Facturation", path: "/dashboard/concierge/billing", icon: FiCreditCard },
    {
      section: "Pilotage",
      label: "Finances",
      path: "/dashboard/concierge/finances/overview",
      icon: FiCreditCard,
    },
    { label: "Objectifs", path: "/dashboard/concierge/objectifs", icon: DashboardGaugeIcon },
    { label: "Simulation de revenus", path: "/dashboard/concierge/finances/simulation", icon: FiCreditCard },
    { section: "Configuration", label: "Mon profil", path: "/dashboard/concierge/profile", icon: FiUser },
    { label: "Mon équipe", path: "/dashboard/concierge/equipe", icon: FiUsers },
    { label: "Tarifs", path: "/dashboard/concierge/pricing", icon: FiCreditCard },
    { label: "Packs de services", path: "/dashboard/concierge/services-packages", icon: FiPackage },
    { label: "Paramètres", path: "/dashboard/concierge/settings", icon: FiSettings },
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
