const FR_LOCALE = "fr-FR";

type DateFormatterOptions = Intl.DateTimeFormatOptions & {
  emptyLabel?: string;
  invalidLabel?: string;
};

export function formatDateValue(
  value: string | Date | null | undefined,
  {
    emptyLabel = "À planifier",
    invalidLabel = "Date invalide",
    ...options
  }: DateFormatterOptions = {},
) {
  if (!value) return emptyLabel;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return invalidLabel;

  const resolvedOptions: Intl.DateTimeFormatOptions =
    Object.keys(options).length > 0
      ? options
      : {
          day: "2-digit",
          month: "short",
        };

  return new Intl.DateTimeFormat(FR_LOCALE, resolvedOptions).format(date);
}

export function formatCurrencyAmount(
  amount: number | null | undefined,
  {
    currency = "EUR",
    emptyLabel = "Montant non défini",
    maximumFractionDigits = 0,
  }: {
    currency?: string;
    emptyLabel?: string;
    maximumFractionDigits?: number;
  } = {},
) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return emptyLabel;
  }

  return new Intl.NumberFormat(FR_LOCALE, {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(amount);
}

export function formatEuroAmountLabel(
  amount: number | null | undefined,
  emptyLabel = "Montant non défini",
) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return emptyLabel;
  }

  return `${amount.toFixed(0)} EUR`;
}
