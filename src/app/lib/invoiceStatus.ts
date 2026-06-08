import { derivePaymentWorkflow, type PaymentWorkflowInput } from "./paymentWorkflow.ts";

export type InvoiceStatusValue = "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "canceled";

export function getInvoiceStatusLabel(value?: string | null) {
  const labels: Record<InvoiceStatusValue, string> = {
    draft: "Brouillon",
    issued: "Facture disponible",
    partially_paid: "Paiement partiel",
    paid: "Payee",
    overdue: "En retard",
    canceled: "Annulee",
  };
  return labels[value as InvoiceStatusValue] ?? value ?? "-";
}

export function getInvoicePaymentSummary(input: PaymentWorkflowInput) {
  const workflow = derivePaymentWorkflow(input);
  return {
    workflow,
    statusLabel: getInvoiceStatusLabel(input.invoiceStatus),
    title: "Ce que vous payez",
    amountLabel:
      workflow.status === "paid"
        ? "Facture reglee"
        : workflow.status === "balance_due" || workflow.status === "partially_paid"
          ? "Solde restant"
          : workflow.status === "deposit_requested"
            ? "Acompte a regler"
            : "Montant a regler",
  };
}

export function getInvoiceWorkflowEventType(status?: string | null) {
  if (status === "issued") return "invoice_available";
  if (status === "paid") return "invoice_paid";
  if (status === "partially_paid") return "invoice_partially_paid";
  if (status === "overdue") return "invoice_overdue";
  if (status === "canceled") return "invoice_canceled";
  return "invoice_status_changed";
}
