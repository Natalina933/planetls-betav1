export function getPlanningState(interventionCount: number | undefined, failed: boolean) {
  if (failed) {
    return {
      status: "error",
      title: "Impossible de charger le planning",
      message: "Actualisez la page pour réessayer.",
    } as const;
  }
  if (interventionCount === undefined) {
    return { status: "loading", message: "Chargement du planning…" } as const;
  }
  if (interventionCount === 0) {
    return {
      status: "empty",
      title: "Planning vide",
      message: "Aucune intervention n’est enregistrée pour le moment.",
    } as const;
  }
  return { status: "ready" } as const;
}

export function formatInterventionCount(count: number) {
  return `${count} intervention${count > 1 ? "s" : ""}`;
}

export function getMonthDates(base: Date) {
  const year = base.getFullYear();
  const month = base.getMonth();
  const first = new Date(year, month, 1);
  const leadingDays = (first.getDay() + 6) % 7;
  const monthDays = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.max(35, Math.ceil((leadingDays + monthDays) / 7) * 7);

  return Array.from({ length: cellCount }, (_, index) => new Date(year, month, 1 - leadingDays + index));
}
