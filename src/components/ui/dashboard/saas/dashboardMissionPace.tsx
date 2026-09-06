import type { CSSProperties, ReactNode } from "react";
import type { DashboardStatusTone } from "./DashboardStatusBadge";

export type DashboardMissionPaceLevel = "calm" | "soft" | "active" | "high";

export type DashboardMissionPaceMeta = {
  level: DashboardMissionPaceLevel;
  label: string;
  tone: DashboardStatusTone;
  iconSrc: string;
  iconPosition: string;
  iconBackgroundSize: string;
  icon: ReactNode;
};

export const DASHBOARD_MISSION_PACE_LEVELS: DashboardMissionPaceLevel[] = ["calm", "soft", "active", "high"];

export const DASHBOARD_MISSION_PACE_ICONS: Record<
  DashboardMissionPaceLevel,
  {
    label: string;
    tone: DashboardStatusTone;
    iconSrc: string;
    iconPosition: string;
    iconBackgroundSize: string;
    iconSize: number;
  }
> = {
  calm: {
    label: "Journée calme",
    tone: "primary",
    iconSrc: "/icons/mission-pace-calm-sea.svg",
    iconPosition: "0% 0%",
    iconBackgroundSize: "contain",
    iconSize: 62,
  },
  soft: {
    label: "Rythme doux",
    tone: "info",
    iconSrc: "/icons/mission-pace-soft-sea.svg",
    iconPosition: "0% 0%",
    iconBackgroundSize: "contain",
    iconSize: 62,
  },
  active: {
    label: "Journée active",
    tone: "info",
    iconSrc: "/icons/mission-pace-active-sea.svg",
    iconPosition: "0% 0%",
    iconBackgroundSize: "contain",
    iconSize: 62,
  },
  high: {
    label: "Forte cadence",
    tone: "warning",
    iconSrc: "/icons/mission-pace-high-sea.svg",
    iconPosition: "0% 0%",
    iconBackgroundSize: "contain",
    iconSize: 64,
  },
};

function DashboardMissionPaceIcon({
  level,
  src,
  position,
  backgroundSize,
  size,
}: {
  level: DashboardMissionPaceLevel;
  src: string;
  position: string;
  backgroundSize: string;
  size: number;
}) {
  return (
    <span
      aria-hidden="true"
      className="dashboardMissionPaceIcon"
      data-mission-pace={level}
      style={
        {
          "--mission-pace-icon-size": `${size}px`,
          "--mission-pace-icon-position": position,
          "--mission-pace-icon-src": `url("${src}")`,
          "--mission-pace-icon-background-size": backgroundSize,
          display: "inline-flex",
          flex: "0 0 auto",
          width: "var(--mission-pace-icon-size)",
          height: "var(--mission-pace-icon-size)",
          borderRadius: "18px",
          backgroundImage: "var(--mission-pace-icon-src)",
          backgroundPosition: "var(--mission-pace-icon-position, 0% 0%)",
          backgroundRepeat: "no-repeat",
          backgroundSize: "var(--mission-pace-icon-background-size, contain)",
        } as CSSProperties
      }
    />
  );
}

export function getDashboardMissionPaceLevel(count: number): DashboardMissionPaceLevel {
  if (count <= 0) return "calm";
  if (count <= 2) return "soft";
  if (count <= 5) return "active";
  return "high";
}

export function getDashboardMissionPaceMetaForLevel(level: DashboardMissionPaceLevel): DashboardMissionPaceMeta {
  const meta = DASHBOARD_MISSION_PACE_ICONS[level];

  return {
    level,
    label: meta.label,
    tone: meta.tone,
    iconSrc: meta.iconSrc,
    iconPosition: meta.iconPosition,
    iconBackgroundSize: meta.iconBackgroundSize,
    icon: (
      <DashboardMissionPaceIcon
        level={level}
        src={meta.iconSrc}
        position={meta.iconPosition}
        backgroundSize={meta.iconBackgroundSize}
        size={meta.iconSize}
      />
    ),
  };
}

export function getDashboardMissionPaceMeta(count: number): DashboardMissionPaceMeta {
  return getDashboardMissionPaceMetaForLevel(getDashboardMissionPaceLevel(count));
}
