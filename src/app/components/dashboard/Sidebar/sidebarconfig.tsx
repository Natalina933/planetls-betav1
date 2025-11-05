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
      path: "/dashboard/concierge",
      icon: FiClipboard,
      children: [
        { label: "Fiche Conciergerie", path: "/dashboard/concierge/fiche", icon: FiClipboard },
        { label: "Informations générales", path: "/dashboard/concierge/informations", icon: FiFileText },
        { label: "Tarifs et prestations", path: "/dashboard/concierge/tarifs", icon: FiFileText },
        { label: "Mon Règlement", path: "/dashboard/concierge/reglement", icon: FiSettings },
        { label: "Protocoles d’intervention", path: "/dashboard/concierge/protocoles", icon: FiTool },
        { label: "Équipe et collaborateurs", path: "/dashboard/concierge/equipe", icon: FiUsers },
        { label: "Zones d’intervention", path: "/dashboard/concierge/zones", icon: FiTarget },
        { label: "Historique des missions", path: "/dashboard/concierge/historique", icon: FiCalendar },
        { label: "Documents administratifs", path: "/dashboard/concierge/documents", icon: FiFileText },
        { label: "Avis et retours clients", path: "/dashboard/concierge/avis", icon: FiMessageSquare },
      ],
      //✨ Détail des sous-menus ma conciergerie:

// Fiche Conciergerie =	Résumé de ton activité, ton identité professionnelle
// Informations générales =	Coordonnées, horaires, services proposés
// Tarifs et prestations =	Liste des services avec leurs prix et conditions
// Mon Règlement =	Règles internes, engagements, politique de confidentialité
// Protocoles d’intervention =	Procédures à suivre pour les interventions (ménage, accueil, urgence…)
// Équipe et collaborateurs =	Liste des personnes qui travaillent avec toi ou que tu coordonnes
// Zones d’intervention =	Quartiers, villes ou résidences où tu interviens
// Historique des missions =	Planning passé, interventions réalisées, statistiques
// Documents administratifs = 	Contrats, attestations, factures, assurances
// Avis et retours clients =	Témoignages, évaluations, feedbacks pour améliorer tes services

    },
    { label: "Mes Logements", path: "/dashboard/concierge/logements", icon: FiClipboard },
    { label: "Mes Informations", path: "/dashboard/concierge/informations", icon: FiFileText },
    { label: "Mes Contacts", path: "/dashboard/concierge/contacts", icon: FiUsers },
    { label: "Mon Règlement", path: "/dashboard/concierge/reglement", icon: FiSettings },
    { label: "Mes Objectifs", path: "/dashboard/concierge/objectifs", icon: FiTarget },
    { label: "Planning", path: "/dashboard/concierge/planning", icon: FiCalendar },
    { label: "Mes Stocks", path: "/dashboard/concierge/stocks", icon: FiBox },
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
