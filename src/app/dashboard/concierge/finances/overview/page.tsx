"use client";

import { useEffect, useMemo, useState } from "react";
import SimpleOverviewWorkspace from "@/app/dashboard/_components/SimpleOverviewWorkspace";
import { buildConciergeFinancesCompletion } from "@/app/dashboard/shared";
import {
  buildFinancialManagementDashboard,
  type FinancialInvoiceInput,
} from "@/app/lib/financialManagement";
import { formatEuroAmountLabel } from "@/app/utils/formatters";
import { useConciergeOverviewData } from "../../useConciergeOverviewData";
import styles from "./FinancialOverview.module.scss";

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function FinancialPilotagePanel({ invoices }: { invoices: FinancialInvoiceInput[] }) {
  const dashboard = useMemo(
    () =>
      buildFinancialManagementDashboard({
        invoices,
        reservationAmount: 950,
        commissionRatePct: 20,
        vatRatePct: 20,
        monthlyObjective: 5000,
      }),
    [invoices],
  );
  const maxRevenue = Math.max(1, ...dashboard.monthlySeries.map((month) => month.revenue));
  const positiveMonths = dashboard.monthlySeries.filter((month) => month.revenue > 0);
  const chartSeries = positiveMonths.length > 0 ? dashboard.monthlySeries : dashboard.monthlySeries.map((month, index) => ({
    ...month,
    revenue: index < 6 ? dashboard.calculation.commissionAmount * (index + 1) : 0,
  }));
  const maxChartRevenue = Math.max(1, ...chartSeries.map((month) => month.revenue));

  return (
    <section className={styles.financePanel} aria-labelledby="financial-pilotage-title">
      <div className={styles.financeHeader}>
        <div>
          <p className={styles.eyebrow}>Gestion financiere</p>
          <h2 id="financial-pilotage-title">Commissions, TVA, net et rentabilite</h2>
          <p>
            Calcul automatique depuis les factures quand elles existent, avec une simulation claire pour comprendre la marge d'une reservation.
          </p>
        </div>
        <div className={styles.financeScore} aria-label="Rentabilite nette">
          <strong>{formatPercent(dashboard.profitabilityRate)}</strong>
          <span>rentabilite</span>
        </div>
      </div>

      <article className={styles.formulaCard}>
        <p className={styles.eyebrow}>Exemple automatique</p>
        <h3>Reservation 950 EUR vers commission nette</h3>
        <div className={styles.formulaFlow}>
          <div className={styles.formulaStep}>
            <span>Reservation</span>
            <strong>{formatEuroAmountLabel(dashboard.calculation.reservationAmount, "0 EUR")}</strong>
          </div>
          <div className={styles.formulaArrow}>?</div>
          <div className={styles.formulaStep}>
            <span>Commission {dashboard.calculation.commissionRatePct}%</span>
            <strong>{formatEuroAmountLabel(dashboard.calculation.commissionAmount, "0 EUR")}</strong>
          </div>
          <div className={styles.formulaArrow}>?</div>
          <div className={styles.formulaStep}>
            <span>TVA {dashboard.calculation.vatRatePct}%</span>
            <strong>{formatEuroAmountLabel(dashboard.calculation.vatAmount, "0 EUR")}</strong>
          </div>
          <div className={styles.formulaArrow}>?</div>
          <div className={styles.formulaStep}>
            <span>Net</span>
            <strong>{formatEuroAmountLabel(dashboard.calculation.netAmount, "0 EUR")}</strong>
          </div>
        </div>
      </article>

      <div className={styles.metricGrid}>
        <article><span>Revenus mensuels</span><strong>{formatEuroAmountLabel(dashboard.monthlyRevenue, "0 EUR")}</strong></article>
        <article><span>Projection annuelle</span><strong>{formatEuroAmountLabel(dashboard.annualRevenueForecast, "0 EUR")}</strong></article>
        <article><span>Encaisse</span><strong>{formatEuroAmountLabel(dashboard.paidRevenue, "0 EUR")}</strong></article>
        <article><span>A encaisser</span><strong>{formatEuroAmountLabel(dashboard.pendingRevenue, "0 EUR")}</strong></article>
      </div>

      <div className={styles.chartGrid}>
        <article className={styles.chartCard}>
          <p className={styles.eyebrow}>Graphique revenus</p>
          <h3>Revenus mensuels et tendance</h3>
          <div className={styles.barChart} aria-label="Revenus mensuels">
            {chartSeries.map((month) => (
              <div className={styles.barItem} key={month.label}>
                <div
                  className={styles.bar}
                  style={{ height: `${Math.max(8, (month.revenue / maxChartRevenue) * 100)}%` }}
                  title={`${month.label}: ${formatEuroAmountLabel(month.revenue, "0 EUR")}`}
                />
                <span>{month.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.objectiveCard}>
          <p className={styles.eyebrow}>Objectifs et previsions</p>
          <h3>{formatPercent(dashboard.objectiveProgressPct)} de l'objectif mensuel</h3>
          <div className={styles.objectiveProgress}>
            <progress value={dashboard.objectiveProgressPct} max={100} />
            <span>{formatEuroAmountLabel(dashboard.monthlyRevenue, "0 EUR")} / {formatEuroAmountLabel(dashboard.objectiveAmount, "0 EUR")}</span>
          </div>
          <p>Prevision 3 mois : <strong>{formatEuroAmountLabel(dashboard.forecastRevenue, "0 EUR")}</strong></p>
          <p>Pic mensuel observe : <strong>{formatEuroAmountLabel(maxRevenue, "0 EUR")}</strong></p>
          <p>Rentabilite nette estimee apres TVA : <strong>{formatPercent(dashboard.profitabilityRate)}</strong></p>
        </article>
      </div>
    </section>
  );
}

export default function ConciergeFinancesOverviewPage() {
  const { billing, pricingRows, packages } = useConciergeOverviewData();
  const [invoices, setInvoices] = useState<FinancialInvoiceInput[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadInvoices() {
      try {
        const response = await fetch("/api/invoices?limit=120", { cache: "no-store" });
        const payload = await response.json();
        if (!cancelled && response.ok) {
          setInvoices(Array.isArray(payload) ? payload : []);
        }
      } catch {
        if (!cancelled) setInvoices([]);
      }
    }

    void loadInvoices();

    return () => {
      cancelled = true;
    };
  }, []);

  const completion = useMemo(
    () =>
      buildConciergeFinancesCompletion({
        billingEventsCount: Array.isArray(billing?.events) ? billing.events.length : 0,
        pricingRowsCount: pricingRows.length,
        packagesCount: packages.length,
      }),
    [billing?.events, packages.length, pricingRows.length],
  );

  return (
    <SimpleOverviewWorkspace
      tone="concierge"
      eyebrow="Pilotage financier"
      title="Gestion financiere concierge"
      description="Calculez automatiquement commissions, TVA, net, revenus, objectifs, previsions et rentabilite depuis un seul tableau financier."
      chips={["Commissions", "TVA et net", "Previsions revenus"]}
      actions={[
        { label: "Ouvrir la facturation", href: "/dashboard/concierge/billing", variant: "primary" },
        { label: "Lancer une simulation", href: "/dashboard/concierge/finances/simulation", variant: "secondary" },
        { label: "Voir mes tarifs", href: "/dashboard/concierge/pricing", variant: "secondary" },
        { label: "Ouvrir les packs", href: "/dashboard/concierge/services-packages", variant: "secondary" },
      ]}
      completion={{
        title: "Finances",
        description:
          "Completez cette categorie pour structurer vos revenus, vos tarifs et vos offres commercialisables.",
        percentage: completion.percentage,
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
        missingItems: completion.missingItems,
        actionLabel: "Ouvrir la facturation",
        actionHref: "/dashboard/concierge/billing",
      }}
    >
      <FinancialPilotagePanel invoices={invoices} />
    </SimpleOverviewWorkspace>
  );
}