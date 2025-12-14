import { IconType } from "react-icons";
import {
  FiUser,
  FiTarget,
  FiFileText,
  FiUsers,
  FiDollarSign,
} from "react-icons/fi";

export type ConciergeTabId =
  | "fiche"
  | "missions"
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
  { id: "missions", label: "Missions", icon: FiTarget },
  { id: "tarifs", label: "Tarifs & Contrats", icon: FiDollarSign },
  { id: "equipe", label: "Équipe & Zones", icon: FiUsers },
  { id: "documents", label: "Documents & Avis", icon: FiFileText },
];
