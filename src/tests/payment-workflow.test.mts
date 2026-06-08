import test from "node:test";
import assert from "node:assert/strict";

import { getInvoicePaymentSummary, getInvoiceWorkflowEventType } from "../app/lib/invoiceStatus.ts";
import { derivePaymentWorkflow } from "../app/lib/paymentWorkflow.ts";

test("scenario F supports deposit then balance workflow", () => {
  const depositRequested = derivePaymentWorkflow({
    invoiceStatus: "issued",
    totalAmount: 1000,
    paidAmount: 0,
    balanceAmount: 1000,
    paymentPlan: "deposit_balance",
  });

  assert.equal(depositRequested.status, "deposit_requested");
  assert.equal(depositRequested.requiresDepositBeforePlanning, true);
  assert.equal(depositRequested.canPayOnline, true);

  const balanceDue = derivePaymentWorkflow({
    invoiceStatus: "partially_paid",
    totalAmount: 1000,
    paidAmount: 300,
    balanceAmount: 700,
    paymentPlan: "deposit_balance",
  });

  assert.equal(balanceDue.status, "balance_due");
  assert.equal(balanceDue.nextActionOwner, "Regler le solde restant.");
  assert.equal(balanceDue.nextActionConcierge, "Demander le solde au proprietaire.");
});

test("scenario G supports full invoice payment", () => {
  const summary = getInvoicePaymentSummary({
    invoiceStatus: "paid",
    totalAmount: 450,
    paidAmount: 450,
    balanceAmount: 0,
  });

  assert.equal(summary.workflow.status, "paid");
  assert.equal(summary.amountLabel, "Facture reglee");
  assert.equal(summary.workflow.canPayOnline, false);
  assert.equal(getInvoiceWorkflowEventType("paid"), "invoice_paid");
});

test("payment workflow maps overdue and manual payment follow-up", () => {
  assert.equal(
    derivePaymentWorkflow({ invoiceStatus: "overdue", totalAmount: 200, balanceAmount: 200 }).status,
    "overdue",
  );
  assert.equal(
    derivePaymentWorkflow({ invoiceStatus: "issued", totalAmount: 200, balanceAmount: 200, manualPaymentPending: true }).status,
    "manual_payment_pending",
  );
  assert.equal(getInvoiceWorkflowEventType("issued"), "invoice_available");
  assert.equal(getInvoiceWorkflowEventType("overdue"), "invoice_overdue");
});
