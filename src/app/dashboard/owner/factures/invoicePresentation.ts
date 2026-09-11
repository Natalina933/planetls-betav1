export type InvoiceAmounts = {
  status: string | null;
  currency?: string | null;
  total_amount: number | null;
  paid_amount?: number | null;
  balance_amount: number | null;
};

export function invoiceStatusLabel(status: string | null) {
  const labels: Record<string,string> = { draft: "Brouillon", issued: "Émise", open: "Ouverte", partially_paid: "Partiellement réglée", paid: "Réglée", overdue: "En retard", canceled: "Annulée" };
  return labels[status ?? "open"] ?? status ?? "Ouverte";
}

export function invoiceAmount(value: number | null | undefined, currency = "EUR") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  try { return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value); }
  catch { return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + " " + currency; }
}

export function invoiceDate(value: string | null | undefined) {
  if (!value || !Number.isFinite(Date.parse(value))) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

// Chaque devise garde son total ; un montant absent reste inconnu.
export function invoiceTotals(rows: InvoiceAmounts[]) {
  const groups = new Map<string, { total: number | null; paid: number | null; balance: number | null }>();
  for (const row of rows) {
    if (row.status === "canceled" || row.status === "draft") continue;
    const currency = row.currency || "EUR";
    const values = groups.get(currency) ?? { total: 0, paid: 0, balance: 0 };
    for (const [key, field] of [["total","total_amount"],["paid","paid_amount"],["balance","balance_amount"]] as const) {
      const value = row[field];
      values[key] = values[key] !== null && typeof value === "number" && Number.isFinite(value) ? values[key]! + value : null;
    }
    groups.set(currency,values);
  }
  return [...groups].map(([currency, values]) => ({ currency, ...values }));
}
