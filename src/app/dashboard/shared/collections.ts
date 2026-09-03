export function takeFirst<T>(items: T[], limit: number) {
  return items.slice(0, limit);
}

export function sumBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((sum, item) => sum + getValue(item), 0);
}

export function averageBy<T>(items: T[], getValue: (item: T) => number | null | undefined) {
  const values = items
    .map(getValue)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
