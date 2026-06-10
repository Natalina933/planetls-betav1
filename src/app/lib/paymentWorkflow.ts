export type PaymentWorkflowStatus =
  | "pending"
  | "deposit_requested"
  | "deposit_paid"
  | "payment_requested"
  | "paid"
  | "partially_paid"
  | "balance_due"
  | "overdue"
  | "failed"
  | "canceled"
  | "refunded"
  | "manual_payment_pending";

export type PaymentWorkflowRole = "owner" | "concierge";

export type PaymentPlanType =
  | "full_before_mission"
  | "deposit_then_balance"
  | "after_completion"
  | "monthly";

export type PaymentWorkflowInput = {
  invoiceStatus?: string | null;
  totalAmount?: number | null;
  paidAmount?: number | null;
  balanceAmount?: number | null;
  dueDate?: string | null;
  paymentPlan?: string | null;
  metadata?: Record<string, unknown> | null;
  manualPaymentPending?: boolean | null;
};

export type PaymentPlanAmounts = {
  plan: PaymentPlanType;
  label: string;
  totalAmount: number;
  depositRequired: boolean;
  depositAmount: number;
  depositPercent: number | null;
  balanceAmount: number;
};

export type MissionPaymentInvoiceInput = PaymentWorkflowInput & {
  id?: string | null;
};

export type MissionPlanningPaymentGuard = {
  canPlan: boolean;
  reason: string | null;
  blockingInvoiceId: string | null;
  requiredDepositAmount: number;
  paidAmount: number;
};

export type PaymentWorkflowState = {
  status: PaymentWorkflowStatus;
  label: string;
  nextActionOwner: string;
  nextActionConcierge: string;
  canPayOnline: boolean;
  canMarkManualPayment: boolean;
  requiresDepositBeforePlanning: boolean;
};

function isPastDate(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function numberFromMetadata(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric >= 0) return numeric;
  }
  return null;
}

function stringFromMetadata(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function normalizePaymentPlanType(value?: string | null): PaymentPlanType {
  const raw = String(value ?? "").trim();
  if (raw === "full_before_mission" || raw === "full" || raw === "payment_before_mission") {
    return "full_before_mission";
  }
  if (raw === "deposit_then_balance" || raw === "deposit_balance" || raw === "deposit") {
    return "deposit_then_balance";
  }
  if (raw === "after_completion" || raw === "after_mission") return "after_completion";
  if (raw === "monthly" || raw === "recurring") return "monthly";
  return "full_before_mission";
}

export function getPaymentPlanLabel(plan?: string | null) {
  const labels: Record<PaymentPlanType, string> = {
    full_before_mission: "Paiement complet avant mission",
    deposit_then_balance: "Acompte puis solde",
    after_completion: "Paiement apres realisation",
    monthly: "Accompagnement mensuel",
  };
  return labels[normalizePaymentPlanType(plan)];
}

export function computePaymentPlanAmounts(input: {
  totalAmount?: number | null;
  paymentPlan?: string | null;
  depositAmount?: number | null;
  depositPercent?: number | null;
  metadata?: Record<string, unknown> | null;
}): PaymentPlanAmounts {
  const metadata = asRecord(input.metadata);
  const totalAmount = Math.max(Number(input.totalAmount ?? 0), 0);
  const plan = normalizePaymentPlanType(
    input.paymentPlan ?? stringFromMetadata(metadata, ["payment_plan", "paymentPlan"]),
  );
  const metadataDepositAmount = numberFromMetadata(metadata, ["deposit_amount", "depositAmount"]);
  const metadataDepositPercent = numberFromMetadata(metadata, ["deposit_percent", "depositPercent"]);
  const depositPercent =
    input.depositPercent !== null && input.depositPercent !== undefined
      ? Number(input.depositPercent)
      : metadataDepositPercent;
  const explicitDepositAmount =
    input.depositAmount !== null && input.depositAmount !== undefined
      ? Number(input.depositAmount)
      : metadataDepositAmount;
  const fallbackPercent = plan === "deposit_then_balance" ? 30 : 0;
  const safePercent = Number.isFinite(depositPercent ?? NaN)
    ? Math.min(Math.max(Number(depositPercent), 0), 100)
    : fallbackPercent;
  const computedDeposit =
    plan === "deposit_then_balance"
      ? Number.isFinite(explicitDepositAmount ?? NaN) && Number(explicitDepositAmount) > 0
        ? Number(explicitDepositAmount)
        : (totalAmount * safePercent) / 100
      : plan === "full_before_mission"
        ? totalAmount
        : 0;
  const depositAmount = Math.min(Math.round(computedDeposit * 100) / 100, totalAmount);

  return {
    plan,
    label: getPaymentPlanLabel(plan),
    totalAmount,
    depositRequired: plan === "deposit_then_balance" && depositAmount > 0,
    depositAmount,
    depositPercent: plan === "deposit_then_balance" ? safePercent : null,
    balanceAmount: Math.max(Math.round((totalAmount - depositAmount) * 100) / 100, 0),
  };
}

function labelForStatus(status: PaymentWorkflowStatus) {
  const labels: Record<PaymentWorkflowStatus, string> = {
    pending: "Paiement en attente",
    deposit_requested: "Acompte demande",
    deposit_paid: "Acompte paye",
    payment_requested: "Paiement demande",
    paid: "Paye",
    partially_paid: "Paiement partiel",
    balance_due: "Solde a regler",
    overdue: "Paiement en retard",
    failed: "Paiement echoue",
    canceled: "Paiement annule",
    refunded: "Rembourse",
    manual_payment_pending: "Paiement manuel a verifier",
  };
  return labels[status];
}

export function derivePaymentWorkflow(input: PaymentWorkflowInput): PaymentWorkflowState {
  const invoiceStatus = input.invoiceStatus ?? "draft";
  const totalAmount = Number(input.totalAmount ?? 0);
  const paidAmount = Number(input.paidAmount ?? 0);
  const balanceAmount = Number(input.balanceAmount ?? Math.max(totalAmount - paidAmount, 0));
  const paymentPlan = computePaymentPlanAmounts({
    totalAmount,
    paymentPlan: input.paymentPlan,
    metadata: input.metadata,
  });
  const hasDepositPlan = paymentPlan.plan === "deposit_then_balance";

  let status: PaymentWorkflowStatus = "pending";

  if (invoiceStatus === "canceled") status = "canceled";
  else if (input.manualPaymentPending) status = "manual_payment_pending";
  else if (invoiceStatus === "paid" || balanceAmount <= 0) status = "paid";
  else if (invoiceStatus === "overdue" || isPastDate(input.dueDate)) status = "overdue";
  else if (hasDepositPlan && paidAmount < paymentPlan.depositAmount && invoiceStatus === "issued") status = "deposit_requested";
  else if (hasDepositPlan && paidAmount > 0 && balanceAmount > 0) status = "balance_due";
  else if (paidAmount > 0 && balanceAmount > 0) status = "partially_paid";
  else if (invoiceStatus === "issued") status = "payment_requested";

  const canPayOnline = !["paid", "canceled", "refunded"].includes(status) && balanceAmount > 0;
  const canMarkManualPayment = !["paid", "canceled", "refunded"].includes(status);
  const requiresDepositBeforePlanning =
    hasDepositPlan && paidAmount < paymentPlan.depositAmount && status !== "paid";

  return {
    status,
    label: labelForStatus(status),
    nextActionOwner:
      status === "paid"
        ? "Conserver la facture et le recu dans les documents."
        : status === "deposit_requested"
          ? "Regler l'acompte pour debloquer la planification."
          : status === "balance_due" || status === "partially_paid"
            ? "Regler le solde restant."
            : status === "overdue"
              ? "Regler la facture en retard ou contacter le concierge."
              : "Verifier le detail puis regler la facture.",
    nextActionConcierge:
      status === "paid"
        ? "Archiver le paiement et poursuivre la mission."
        : status === "manual_payment_pending"
          ? "Verifier le reglement manuel puis marquer la facture payee."
          : status === "balance_due" || status === "partially_paid"
            ? "Demander le solde au proprietaire."
            : status === "overdue"
              ? "Relancer le paiement en retard."
              : "Emettre la facture ou suivre le paiement.",
    canPayOnline,
    canMarkManualPayment,
    requiresDepositBeforePlanning,
  };
}

export function getPaymentWorkflowActionForRole(state: PaymentWorkflowState, role: PaymentWorkflowRole) {
  return role === "owner" ? state.nextActionOwner : state.nextActionConcierge;
}

export function canPlanMissionWithPayment(input: {
  invoices?: MissionPaymentInvoiceInput[] | null;
  quoteMetadata?: Record<string, unknown> | null;
}): MissionPlanningPaymentGuard {
  const invoices = Array.isArray(input.invoices) ? input.invoices : [];

  for (const invoice of invoices) {
    const plan = computePaymentPlanAmounts({
      totalAmount: invoice.totalAmount,
      paymentPlan: invoice.paymentPlan,
      metadata: invoice.metadata,
    });
    const paidAmount = Number(invoice.paidAmount ?? 0);
    if (plan.depositRequired && paidAmount < plan.depositAmount) {
      return {
        canPlan: false,
        reason: `Acompte requis avant planification: ${plan.depositAmount.toFixed(2)} a regler.`,
        blockingInvoiceId: invoice.id ?? null,
        requiredDepositAmount: plan.depositAmount,
        paidAmount,
      };
    }
  }

  if (invoices.length === 0 && input.quoteMetadata) {
    const plan = computePaymentPlanAmounts({ metadata: input.quoteMetadata });
    if (plan.plan === "deposit_then_balance") {
      return {
        canPlan: false,
        reason: "Acompte requis avant planification: genere ou emettez la facture d'acompte.",
        blockingInvoiceId: null,
        requiredDepositAmount: plan.depositAmount,
        paidAmount: 0,
      };
    }
  }

  return {
    canPlan: true,
    reason: null,
    blockingInvoiceId: null,
    requiredDepositAmount: 0,
    paidAmount: 0,
  };
}
