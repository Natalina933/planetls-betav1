import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFinancialManagementDashboard,
  calculateCommission,
} from "../app/lib/financialManagement.ts";

test("calculateCommission computes commission, VAT and net amount", () => {
  const result = calculateCommission({
    reservationAmount: 950,
    commissionRatePct: 20,
    vatRatePct: 20,
  });

  assert.equal(result.commissionAmount, 190);
  assert.equal(result.vatAmount, 38);
  assert.equal(result.netAmount, 152);
});

test("buildFinancialManagementDashboard aggregates invoices and forecasts", () => {
  const dashboard = buildFinancialManagementDashboard({
    reservationAmount: 950,
    commissionRatePct: 20,
    vatRatePct: 20,
    monthlyObjective: 1000,
    invoices: [
      {
        id: "invoice-1",
        total_amount: 1200,
        subtotal: 1000,
        tax_amount: 200,
        balance_amount: 0,
        status: "paid",
        issue_date: new Date().toISOString(),
      },
      {
        id: "invoice-2",
        total_amount: 800,
        subtotal: 667,
        tax_amount: 133,
        balance_amount: 800,
        status: "issued",
        issue_date: new Date().toISOString(),
      },
    ],
  });

  assert.equal(dashboard.paidRevenue, 1200);
  assert.equal(dashboard.pendingRevenue, 800);
  assert.equal(dashboard.monthlyRevenue, 2000);
  assert.equal(dashboard.objectiveProgressPct, 100);
  assert.ok(dashboard.annualRevenueForecast >= 24000);
});
