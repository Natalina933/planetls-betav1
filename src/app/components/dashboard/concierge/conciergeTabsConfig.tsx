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
  | "equipe"
  | "documents";

export interface ConciergeTab {
  id: ConciergeTabId;
  label: string;
  icon: IconType;
}

export const CONCIERGE_TABS: ConciergeTab[] = [
  { id: "fiche", label: "Fiche & Infos", icon: FiUser },
  { id: "tarifs", label: "Grille tarifaire", icon: FiDollarSign },
  { id: "missions", label: "Missions", icon: FiTarget },
  { id: "packs", label: "Mes Packs", icon: FiPackage },
  { id: "equipe", label: "Equipe & Zones", icon: FiUsers },
  { id: "documents", label: "Documents & Avis", icon: FiFileText },
];
