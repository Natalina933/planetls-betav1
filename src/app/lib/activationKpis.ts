export type ActivationRole = "owner" | "concierge" | "provider";

export const ACTIVATION_MARKER: Record<ActivationRole, string> = {
  owner: "request",
  concierge: "quote",
  provider: "mission",
};

export function computeActivationCohort(input: {
  role: ActivationRole;
  profiles: Array<{ id: string; role: string | null; createdAt: Date | null }>;
  roleAliases: string[];
  activityByProfile: Map<string, Map<string, Date>>;
  windowStart: Date;
  now: Date;
}) {
  const marker = ACTIVATION_MARKER[input.role];
  const matureAt = new Date(input.now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const candidates = input.profiles.filter((profile) =>
    Boolean(profile.createdAt && profile.createdAt >= input.windowStart && profile.createdAt <= matureAt && profile.role && input.roleAliases.includes(profile.role)),
  );
  const activated = candidates.filter((profile) => {
    const eventAt = input.activityByProfile.get(profile.id)?.get(marker);
    if (!profile.createdAt || !eventAt) return false;
    const deadline = new Date(profile.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventAt >= profile.createdAt && eventAt <= deadline;
  }).length;
  return {
    activation_j7: candidates.length > 0 ? Math.round((activated / candidates.length) * 10_000) / 100 : null,
    activation_j7_eligible: candidates.length,
    activation_j7_activated: activated,
    activation_definition: marker,
  };
}
export type ActivationSeriesPoint = {
  period_start: string;
  period_end: string;
  eligible: number;
  activated: number;
  rate: number | null;
};

export function computeWeeklyActivationSeries(input: {
  role: ActivationRole;
  profiles: Array<{ id: string; role: string | null; createdAt: Date | null }>;
  roleAliases: string[];
  activityByProfile: Map<string, Map<string, Date>>;
  windowStart: Date;
  now: Date;
}): ActivationSeriesPoint[] {
  const points: ActivationSeriesPoint[] = [];
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const matureAt = new Date(input.now.getTime() - weekMs);
  for (let start = new Date(input.windowStart); start < matureAt; start = new Date(start.getTime() + weekMs)) {
    const end = new Date(Math.min(start.getTime() + weekMs, matureAt.getTime() + 1));
    const cohort = computeActivationCohort({
      ...input,
      profiles: input.profiles.filter((profile) => Boolean(profile.createdAt && profile.createdAt >= start && profile.createdAt < end)),
      windowStart: start,
      now: new Date(end.getTime() + weekMs),
    });
    points.push({
      period_start: start.toISOString(),
      period_end: end.toISOString(),
      eligible: cohort.activation_j7_eligible,
      activated: cohort.activation_j7_activated,
      rate: cohort.activation_j7,
    });
  }
  return points;
}
export type ActivationZonePoint = {
  zone: string;
  eligible: number;
  activated: number;
  rate: number | null;
};

export function computeActivationByZone(input: {
  role: ActivationRole;
  profiles: Array<{ id: string; role: string | null; createdAt: Date | null; zone?: string | null }>;
  roleAliases: string[];
  activityByProfile: Map<string, Map<string, Date>>;
  windowStart: Date;
  now: Date;
}): ActivationZonePoint[] {
  const zones = new Map<string, typeof input.profiles>();
  for (const profile of input.profiles) {
    const zone = profile.zone?.trim() || "Non renseignee";
    zones.set(zone, [...(zones.get(zone) ?? []), profile]);
  }
  return [...zones.entries()]
    .map(([zone, profiles]) => {
      const cohort = computeActivationCohort({ ...input, profiles });
      return {
        zone,
        eligible: cohort.activation_j7_eligible,
        activated: cohort.activation_j7_activated,
        rate: cohort.activation_j7,
      };
    })
    .filter((point) => point.eligible > 0)
    .sort((left, right) => right.eligible - left.eligible || left.zone.localeCompare(right.zone, "fr"))
    .slice(0, 20);
}