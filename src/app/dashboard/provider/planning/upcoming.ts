import { takeFirst } from "../../shared/collections.ts";

export function getUpcomingInterventions<T extends { scheduled_start: string | null }>(
  items: readonly T[],
  now: Date,
) {
  const cutoff = now.getTime();
  const scheduled = items.flatMap((item) => {
    const start = Date.parse(item.scheduled_start ?? "");
    return start >= cutoff ? [{ item, start }] : [];
  });

  scheduled.sort((a, b) => a.start - b.start);
  return takeFirst(scheduled, 10).map(({ item }) => item);
}
