export type ControlHealthStatus = "healthy" | "warning" | "danger" | "unverifiable";

export type ControlSourceHealth = {
  key: string;
  label: string;
  available: boolean;
  reason: string | null;
};

export function buildControlTowerHealth({
  sources,
  dangerCount,
  warningCount,
  checkedAt = new Date().toISOString(),
}: {
  sources: ControlSourceHealth[];
  dangerCount: number;
  warningCount: number;
  checkedAt?: string;
}) {
  const unavailableSources = sources.filter((source) => !source.available);
  const status: ControlHealthStatus = unavailableSources.length > 0
    ? "unverifiable"
    : dangerCount > 0
      ? "danger"
      : warningCount > 0
        ? "warning"
        : "healthy";

  const labels: Record<ControlHealthStatus, string> = {
    healthy: "Tout est opérationnel",
    warning: "Points à surveiller",
    danger: "Intervention nécessaire",
    unverifiable: "Contrôle incomplet",
  };

  return {
    status,
    label: labels[status],
    checkedAt,
    fullyVerifiable: unavailableSources.length === 0,
    checkedSourceCount: sources.length - unavailableSources.length,
    totalSourceCount: sources.length,
    dangerCount,
    warningCount,
    unavailableSources,
  };
}
