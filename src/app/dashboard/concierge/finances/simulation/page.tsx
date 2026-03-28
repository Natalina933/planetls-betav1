"use client";

import { useMemo, useState } from "react";
import ConciergeWorkspacePage from "../../_components/ConciergeWorkspacePage";
import styles from "@/app/components/tariffs/TariffBillingDesk.module.scss";

const round2 = (value: number) => Math.round(value * 100) / 100;
const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);

export default function ConciergeFinanceSimulationPage() {
  const [monthlyRevenueEstimate, setMonthlyRevenueEstimate] = useState(6000);
  const [newListingsEstimate, setNewListingsEstimate] = useState(1);
  const [actServicesEstimate, setActServicesEstimate] = useState(4);
  const [commissionRatePct, setCommissionRatePct] = useState(20);
  const [setupFee, setSetupFee] = useState(0);
  const [actAverage, setActAverage] = useState(0);

  const projection = useMemo(() => {
    const commissionAmount = (monthlyRevenueEstimate * commissionRatePct) / 100;
    const actAmount = actAverage * actServicesEstimate;
    const setupAmount = setupFee * newListingsEstimate;
    const total = round2(commissionAmount + actAmount + setupAmount);
    const ownersNeeded = monthlyRevenueEstimate > 0 ? Math.ceil(total / monthlyRevenueEstimate) : 0;
    const listingsNeeded = newListingsEstimate > 0 ? Math.ceil(total / Math.max(newListingsEstimate, 1)) : 0;

    return {
      commissionAmount: round2(commissionAmount),
      actAmount: round2(actAmount),
      setupAmount: round2(setupAmount),
      total,
      ownersNeeded,
      listingsNeeded,
    };
  }, [actAverage, actServicesEstimate, commissionRatePct, monthlyRevenueEstimate, newListingsEstimate, setupFee]);

  return (
    <ConciergeWorkspacePage
      eyebrow="Projection"
      title="Simulation de revenus concierge"
      description="Estimez le revenu potentiel de votre activité en fonction du nombre de propriétaires, de logements et de services réalisés."
      chips={["Simulation", "Projection activité", "Objectifs revenus"]}
      actions={[
        { label: "Ouvrir devis & factures", href: "/dashboard/concierge/billing" },
        { label: "Voir mes tarifs", href: "/dashboard/concierge/pricing" },
      ]}
      metrics={[
        { label: "Projection totale", value: formatCurrency(projection.total, "EUR") },
        { label: "Commission", value: formatCurrency(projection.commissionAmount, "EUR") },
        { label: "Services à l'acte", value: formatCurrency(projection.actAmount, "EUR") },
        { label: "Set-up", value: formatCurrency(projection.setupAmount, "EUR") },
      ]}
      cards={[
        { title: "Propriétaires", text: `${projection.ownersNeeded} propriétaire(s) à convertir pour atteindre cette projection.` },
        { title: "Logements", text: `${projection.listingsNeeded} logement(s) estimés selon vos hypothèses actuelles.` },
        { title: "Pilotage", text: "Ajustez les hypothèses pour comprendre combien de clients et de biens il faut signer pour atteindre votre objectif." },
      ]}
    >
      <section className={styles.projectionCard}>
        <h4>Simulation revenus concierge</h4>
        <div className={styles.projectionInputs}>
          <label>
            <span>Revenus locatifs mensuels (EUR)</span>
            <input type="number" min={0} step={100} value={monthlyRevenueEstimate} onChange={(event) => setMonthlyRevenueEstimate(Math.max(0, Number(event.target.value || 0)))} />
          </label>
          <label>
            <span>Nouveaux logements / mois</span>
            <input type="number" min={0} step={1} value={newListingsEstimate} onChange={(event) => setNewListingsEstimate(Math.max(0, Number(event.target.value || 0)))} />
          </label>
          <label>
            <span>Services à l'acte / mois</span>
            <input type="number" min={0} step={1} value={actServicesEstimate} onChange={(event) => setActServicesEstimate(Math.max(0, Number(event.target.value || 0)))} />
          </label>
          <label>
            <span>Commission %</span>
            <input type="number" min={0} step={1} value={commissionRatePct} onChange={(event) => setCommissionRatePct(Math.max(0, Number(event.target.value || 0)))} />
          </label>
          <label>
            <span>Frais de set-up</span>
            <input type="number" min={0} step={1} value={setupFee} onChange={(event) => setSetupFee(Math.max(0, Number(event.target.value || 0)))} />
          </label>
          <label>
            <span>Panier service à l'acte</span>
            <input type="number" min={0} step={1} value={actAverage} onChange={(event) => setActAverage(Math.max(0, Number(event.target.value || 0)))} />
          </label>
        </div>
        <div className={styles.projectionMetrics}>
          <span>Commission: <strong>{formatCurrency(projection.commissionAmount, "EUR")}</strong></span>
          <span>Set-up: <strong>{formatCurrency(projection.setupAmount, "EUR")}</strong></span>
          <span>Actes: <strong>{formatCurrency(projection.actAmount, "EUR")}</strong></span>
          <span className={styles.projectionTotal}>Total estimé: <strong>{formatCurrency(projection.total, "EUR")}</strong></span>
        </div>
      </section>
    </ConciergeWorkspacePage>
  );
}
