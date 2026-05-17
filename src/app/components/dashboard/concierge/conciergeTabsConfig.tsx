import { IconType } from "react-icons";
import {
  FiHome,
  FiClipboard,
  FiFileText,
  FiTarget,
} from "react-icons/fi";

export type ConciergeVisibleTabId = "overview" | "fiche" | "missions" | "documents";

export type ConciergeHiddenTabId =
  | "missions"
  | "packs"
  | "tarifs"
  | "devis"
  | "equipe";

export type ConciergeTabId =
  | ConciergeVisibleTabId
  | ConciergeHiddenTabId;

export const CONCIERGE_PROFILE_TAB_IDS: ConciergeTabId[] = [
  "overview",
  "fiche",
  "missions",
  "packs",
  "tarifs",
  "devis",
  "equipe",
  "documents",
];

export interface ConciergeTab {
  id: ConciergeVisibleTabId;
  label: string;
  icon: IconType;
}

export const CONCIERGE_TABS: ConciergeTab[] = [
  { id: "overview", label: "Vue d'ensemble", icon: FiHome },
  { id: "fiche", label: "Fiche & Infos", icon: FiClipboard },
  { id: "missions", label: "Missions", icon: FiTarget },
  { id: "documents", label: "Documents & Avis", icon: FiFileText },
];
