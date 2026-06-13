import type { IconType } from "react-icons";
import { FiClipboard, FiFileText, FiMapPin, FiMessageSquare } from "react-icons/fi";
import { DashboardGaugeIcon } from "@/components/ui/PublicIcon";
import type { ProfileShellTab } from "./ProfilePageShell";

export type UnifiedProfileTabId =
  | "overview"
  | "account"
  | "address"
  | "socials"
  | "presentation";

export const UNIFIED_PROFILE_TABS: Array<ProfileShellTab<UnifiedProfileTabId>> = [
  { id: "overview", label: "Vue d'ensemble", icon: DashboardGaugeIcon },
  { id: "account", label: "Compte", icon: FiClipboard },
  { id: "address", label: "Adresse", icon: FiMapPin },
  { id: "socials", label: "Réseaux", icon: FiMessageSquare },
  { id: "presentation", label: "Présentation", icon: FiFileText },
];

export function buildUnifiedProfileSidebarItems(basePath: string) {
  return UNIFIED_PROFILE_TABS.map((tab) => ({
    label: tab.label,
    path: `${basePath}?tab=${tab.id}`,
    icon: tab.icon as IconType,
  }));
}
