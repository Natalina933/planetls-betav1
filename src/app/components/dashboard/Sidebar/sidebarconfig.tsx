// config/sidebarConfig.ts
import { IconType } from "react-icons";
import { FiHome, FiUsers, FiSettings } from "react-icons/fi";

interface SidebarItem {
  label: string;
  path: string;
  icon?: IconType;
}

type SidebarConfig = {
  admin: SidebarItem[];
  concierge: SidebarItem[];
  owner: SidebarItem[];
  providence: SidebarItem[];
};

export const sidebarConfig: SidebarConfig = {
  admin: [
    { label: "Dashboard", path: "/dashboard/admin", icon: FiHome },
    { label: "Utilisateurs", path: "/dashboard/admin/users", icon: FiUsers },
    { label: "Paramètres", path: "/dashboard/admin/settings", icon: FiSettings },
  ],

  concierge: [
    { label: "Tableau de bord", path: "/dashboard/concierge", icon: FiHome },
    { label: "Propriétaires", path: "/dashboard/concierge/owners", icon: FiUsers },
    { label: "Paramètres", path: "/dashboard/concierge/settings", icon: FiSettings },
  ],

  owner: [
    { label: "Mes biens", path: "/dashboard/owner", icon: FiHome },
    { label: "Conciergeries", path: "/dashboard/owner/concierges", icon: FiUsers },
    { label: "Paramètres", path: "/dashboard/owner/settings", icon: FiSettings },
  ],

  providence: [
    { label: "Plateforme", path: "/dashboard/providence", icon: FiHome },
    { label: "Partenaires", path: "/dashboard/providence/partners", icon: FiUsers },
    { label: "Paramètres", path: "/dashboard/providence/settings", icon: FiSettings },
  ],
};

