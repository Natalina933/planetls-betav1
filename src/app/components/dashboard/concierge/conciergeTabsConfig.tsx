import { IconType } from "react-icons";
import {
  FiUser,
  FiTarget,
  FiFileText,
  FiUsers,
  FiDollarSign,
  FiPackage,
} from "react-icons/fi";

export type ConciergeTabId =
  | "fiche"
  | "missions"
  | "packs"
  | "tarifs"
  | "devis"
  | "equipe"
  | "documents";

export interface ConciergeTab {
  id: ConciergeTabId;
  label: string;
  icon: IconType;
}

export const CONCIERGE_TABS: ConciergeTab[] = [
  { id: "fiche", label: "Fiche & Infos", icon: FiUser },
  { id: "missions", label: "Missions", icon: FiTarget },
  { id: "tarifs", label: "Grille tarifaire", icon: FiDollarSign },
  { id: "packs", label: "Mes Packs", icon: FiPackage },
  { id: "devis", label: "Devis & factures", icon: FiFileText },
  { id: "equipe", label: "Equipe & Zones", icon: FiUsers },
  { id: "documents", label: "Documents & Avis", icon: FiFileText },
];
