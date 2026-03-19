import { IconType } from "react-icons";
import {
  FiHome,
  FiClipboard,
  FiFileText,
} from "react-icons/fi";

export type ConciergeVisibleTabId = "overview" | "fiche" | "documents";

export type ConciergeHiddenTabId =
  | "missions"
  | "packs"
  | "tarifs"
  | "devis"
  | "equipe";

export type ConciergeTabId =
  | ConciergeVisibleTabId
  | ConciergeHiddenTabId;

export interface ConciergeTab {
  id: ConciergeVisibleTabId;
  label: string;
  icon: IconType;
}

export const CONCIERGE_TABS: ConciergeTab[] = [
  { id: "overview", label: "Vue d'ensemble", icon: FiHome },
  { id: "fiche", label: "Fiche & Infos", icon: FiClipboard },
  { id: "documents", label: "Documents & Avis", icon: FiFileText },
];
