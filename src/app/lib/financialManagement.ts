export type FinancialInvoiceInput = {
  id: string;
  total_amount?: number | null;
  subtotal?: number | null;
  tax_rate?: number | null;
  tax_amount?: number | null;
  paid_amount?: number | null;
  balance_amount?: number | null;
  status?: string | null;
  created_at?: string | null;
  issue_date?: string | null;
  paid_at?: string | null;
};

export type CommissionCalculation = {
  reservationAmount: number;
  commissionRatePct: number;
  commissionAmount: number;
  vatRatePct: number;
  vatAmount: number;
  netAmount: number;
};

export type FinancialManagementDashboard = {
  calculation: CommissionCalculation;
  monthlyRevenue: number;
  annualRevenueForecast: number;
  paidRevenue: number;
  pendingRevenue: number;
  profitabilityRate: number;
  objectiveAmount: number;
  objectiveProgressPct: number;
  forecastRevenue: number;
  monthlySeries: Array<{ label: string; revenue: number; commission: number; net: number }>;
};

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aout", "Sep", "Oct", "Nov", "Dec"];

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function safeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function calculateCommission(input: {
  reservationAmount: number;
  commissionRatePct: number;
  vatRatePct?: number;
}): CommissionCalculation {
  const reservationAmount = Math.max(0, safeNumber(input.reservationAmount));
  const commissionRatePct = Math.max(0, safeNumber(input.commissionRatePct));
  const vatRatePct = Math.max(0, safeNumber(input.vatRatePct ?? 20));
  const commissionAmount = round2((reservationAmount * commissionRatePct) / 100);
  const vatAmount = round2((commissionAmount * vatRatePct) / 100);

  return {
    reservationAmount,
    commissionRatePct,
    commissionAmount,
    vatRatePct,
    vatAmount,
    netAmount: round2(commissionAmount - vatAmount),
  };
}

export function buildFinancialManagementDashboard(input: {
  invoices?: FinancialInvoiceInput[];
  reservationAmount?: number;
  commissionRatePct?: number;
  vatRatePct?: number;
  monthlyObjective?: number;
}): FinancialManagementDashboard {
  const invoices = input.invoices ?? [];
  const calculation = calculateCommission({
    reservationAmount: input.reservationAmount ?? 950,
    commissionRatePct: input.commissionRatePct ?? 20,
    vatRatePct: input.vatRatePct ?? 20,
  });
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlyBuckets = MONTH_LABELS.map((label) => ({ label, revenue: 0, commission: 0, net: 0 }));

  invoices.forEach((invoice) => {
    const date = new Date(invoice.paid_at || invoice.issue_date || invoice.created_at || "");
    if (!Number.isFinite(date.getTime()) || date.getFullYear() !== currentYear) return;
    const revenue = safeNumber(invoice.total_amount);
    const commission = safeNumber(invoice.subtotal) || Math.max(0, revenue - safeNumber(invoice.tax_amount));
    const net = commission - safeNumber(invoice.tax_amount);
    monthlyBuckets[date.getMonth()].revenue += revenue;
    monthlyBuckets[date.getMonth()].commission += commission;
    monthlyBuckets[date.getMonth()].net += net;
  });

  const paidRevenue = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + safeNumber(invoice.total_amount), 0);
  const pendingRevenue = invoices
    .filter((invoice) => invoice.status !== "paid" && invoice.status !== "canceled")
    .reduce((sum, invoice) => sum + safeNumber(invoice.balance_amount ?? invoice.total_amount), 0);
  const monthlyRevenue = monthlyBuckets[currentMonth]?.revenue || calculation.commissionAmount;
  const averageMonthly =
    monthlyBuckets.reduce((sum, month) => sum + month.revenue, 0) / Math.max(1, monthlyBuckets.filter((month) => month.revenue > 0).length || 1);
  const forecastRevenue = round2(Math.max(monthlyRevenue, averageMonthly, calculation.commissionAmount) * 3);
  const objectiveAmount = Math.max(1, input.monthlyObjective ?? 5000);

  return {
    calculation,
    monthlyRevenue: round2(monthlyRevenue),
    annualRevenueForecast: round2(Math.max(monthlyRevenue, averageMonthly, calculation.commissionAmount) * 12),
    paidRevenue: round2(paidRevenue),
    pendingRevenue: round2(pendingRevenue),
    profitabilityRate: calculation.commissionAmount > 0 ? round2((calculation.netAmount / calculation.commissionAmount) * 100) : 0,
    objectiveAmount,
    objectiveProgressPct: Math.min(100, round2((monthlyRevenue / objectiveAmount) * 100)),
    forecastRevenue,
    monthlySeries: monthlyBuckets.map((month) => ({
      label: month.label,
      revenue: round2(month.revenue),
      commission: round2(month.commission),
      net: round2(month.net),
    })),
  };
}
