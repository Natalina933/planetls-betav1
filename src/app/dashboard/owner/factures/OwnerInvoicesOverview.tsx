"use client";

import { useState } from "react";
import { CalendarClock, CreditCard, Download, Files, Wallet } from "lucide-react";
import { Alert, AsyncState, Badge, Button, ButtonLink, Card, DataTable, Input, Select, TableFilters, type DataTableColumn } from "@/components/ui";
import { getInvoicePaymentSummary } from "@/app/lib/invoiceStatus";
import type { OwnerInvoiceRow } from "./OwnerInvoicesPageClient";
import { invoiceAmount, invoiceDate, invoiceStatusLabel, invoiceTotals } from "./invoicePresentation";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { MetricGroup } from "@/components/ui/StatsCard/MetricGroup";
import { Section } from "@/components/ui/Section";
import { CardHeader } from "@/components/ui/Card";
import styles from "./OwnerInvoicesOverview.module.scss";

type Props = {
  invoices: OwnerInvoiceRow[];
  filteredInvoices: OwnerInvoiceRow[];
  searchTerm: string;
  onSearch: (value: string) => void;
  statusFilter: string;
  onStatus: (value: string) => void;
  loading: boolean;
  error: string | null;
  feedback: string | null;
  targetedInvoice: OwnerInvoiceRow | null;
  targetInvoiceId: string | null;
  payingInvoiceId: string | null;
  onPay: (id: string) => Promise<void>;
  onExport: (rows: OwnerInvoiceRow[]) => void;
  onRetry: () => void;
};

const tabs = [["all","Toutes les factures"],["issued","Factures émises"],["paid","Factures réglées"],["pending","En attente"]] as const;
const yearOf = (invoice: OwnerInvoiceRow) => (invoice.issue_date || invoice.created_at || "").slice(0,4);
function metadata(invoice: OwnerInvoiceRow, keys: string[]) {
  return keys.map(key => invoice.metadata?.[key]).find((value): value is string => typeof value === "string" && Boolean(value.trim())) || "—";
}
function Status({ invoice }: { invoice: OwnerInvoiceRow }) {
  return <Badge variant={invoice.status === "paid" ? "success" : invoice.status === "overdue" ? "danger" : invoice.status === "canceled" ? "neutral" : "warning"}>{invoiceStatusLabel(invoice.status)}</Badge>;
}

export default function OwnerInvoicesOverview(props: Props) {
  const [year,setYear] = useState("all");
  const [tab,setTab] = useState("all");
  const [page,setPage] = useState(1);
  const [now] = useState(() => new Date());
  const years = [...new Set(props.invoices.map(yearOf).filter(value => /^\d{4}$/.test(value)))].sort().reverse();
  const periodRows = props.invoices.filter(row => year === "all" || yearOf(row) === year);
  const rows = props.filteredInvoices.filter(row => (year === "all" || yearOf(row) === year) && (tab === "all" || (tab === "paid" ? row.status === "paid" : tab === "pending" ? row.status !== "paid" && row.status !== "canceled" : row.status !== "draft" && row.status !== "canceled")));
  const pageCount = Math.max(1,Math.ceil(rows.length / 10));
  const currentPage = Math.min(page,pageCount);
  const totals = invoiceTotals(periodRows);
  const amountText = (key: "total" | "paid" | "balance", source = totals) => source.length ? source.map(total => invoiceAmount(total[key],total.currency)).join(" · ") : "—";
  const annualYear = year === "all" ? String(now.getFullYear()) : year;
  const annualRows = props.invoices.filter(row => yearOf(row) === annualYear);
  const annualTotals = invoiceTotals(annualRows);
  const pending = periodRows.filter(row => row.status !== "paid" && row.status !== "canceled").sort((a,b) => (Date.parse(a.due_date ?? "") || Infinity) - (Date.parse(b.due_date ?? "") || Infinity));
  const reset = () => { props.onSearch(""); props.onStatus("all"); setYear("all"); setTab("all"); setPage(1); };
  const activeCount = [Boolean(props.searchTerm),props.statusFilter !== "all",year !== "all",tab !== "all"].filter(Boolean).length;
  const statuses = [...new Set(["open","draft","issued","partially_paid","paid","overdue","canceled",...props.invoices.map(row => row.status || "open")])];
  const columns: DataTableColumn<OwnerInvoiceRow>[] = [
    { id: "number",label: "N° facture",render: row => <strong>{row.invoice_number || "Facture sans numéro"}</strong> },
    { id: "date",label: "Date",render: row => invoiceDate(row.issue_date || row.created_at) },
    { id: "stay",label: "Séjour / référence",render: row => metadata(row,["traveler_name","client_name","stay_reference"]) },
    { id: "property",label: "Logement",render: row => metadata(row,["property_label","housing_name","property_name"]) },
    { id: "amount",label: "Montant TTC",render: row => invoiceAmount(row.total_amount,row.currency || "EUR") },
    { id: "status",label: "Statut",render: row => <Status invoice={row} /> },
  ];

  function rowActions(invoice: OwnerInvoiceRow) {
    const currency = invoice.currency || "EUR";
    const summary = getInvoicePaymentSummary({ invoiceStatus: invoice.status, totalAmount: invoice.total_amount, paidAmount: invoice.paid_amount, balanceAmount: invoice.balance_amount, dueDate: invoice.due_date, metadata: invoice.metadata });
    const amountToPay = summary.workflow.status === "paid" ? invoice.total_amount : invoice.balance_amount ?? invoice.total_amount;
    return <div className={styles.rowActions}>
      <ButtonLink href={`/api/invoices/${invoice.id}/document`} target="_blank" rel="noreferrer" variant="secondary" size="sm">Voir la facture</ButtonLink>
      {invoice.status !== "paid" && invoice.status !== "canceled" && <Button size="sm" onClick={() => void props.onPay(invoice.id)} disabled={props.payingInvoiceId === invoice.id}>{props.payingInvoiceId === invoice.id ? "Redirection…" : "Régler"}</Button>}
      <details><summary>Détails et documents</summary><div className={styles.invoiceDetails}>
        <strong>{summary.title}</strong><span>{summary.amountLabel} : {invoiceAmount(amountToPay,currency)}</span>
        <span>Déjà réglé : {invoiceAmount(invoice.paid_amount ?? 0,currency)}</span><span>Solde : {invoiceAmount(invoice.balance_amount,currency)}</span>
        <span>Échéance : {invoiceDate(invoice.due_date)}</span><span>{summary.workflow.nextActionOwner}</span>
        <span>{invoice.invoice_items?.length ?? 0} ligne(s)</span>
        {invoice.invoice_items?.slice(0,3).map(item => <span key={item.id}>{item.label} ({invoiceAmount(item.line_total,currency)})</span>)}
        <ButtonLink href={`/api/invoices/${invoice.id}/document?print=1`} target="_blank" rel="noreferrer" variant="ghost" size="sm"><Download size={14} aria-hidden="true" /> Imprimer / PDF</ButtonLink>
      </div></details>
    </div>;
  }

  return <div className={styles.page} aria-busy={props.loading}>
    <PageHeader
      variant="illustrated"
      className={styles.hero}
      breadcrumb={<><ButtonLink href="/dashboard/owner" variant="ghost" size="sm">Propriétaire</ButtonLink><span>› Finance et règlements</span></>}
      eyebrow="Finance et règlements"
      title="Suivi des factures"
      description="Consultez vos factures, retrouvez vos documents et gardez une vue claire des montants réglés et de vos prochaines échéances."
      quote="« Des séjours sereins, des logements qui performent. »"
    />
    {props.feedback && <Alert tone="info" title="Suivi du paiement" announcement="polite">{props.feedback}</Alert>}
    {props.error && <Alert tone="danger" title="Impossible de terminer l’opération" announcement="assertive" action={<Button variant="secondary" onClick={props.onRetry}>Réessayer</Button>}>{props.error}</Alert>}
    <MetricGroup className={styles.metrics} aria-label="Synthèse des factures">
      {[
        {label:"Total facturé",value:amountText("total"),Icon:Files},
        {label:"Montant réglé",value:amountText("paid"),Icon:CreditCard},
        {label:"Reste à régler",value:amountText("balance"),Icon:Wallet},
        {label:"Factures",value:String(periodRows.length),Icon:CalendarClock},
      ].map(({label,value,Icon}) => <Card className={styles.metric} tone="outlined" key={label}><Icon size={20} aria-hidden="true" /><div><strong>{props.loading ? "…" : props.error ? "—" : value}</strong><h2>{label}</h2><p>{year === "all" ? "Factures chargées" : "Année " + year}</p></div></Card>)}
    </MetricGroup>
    <AsyncState loading={props.loading} loadingLabel="Chargement des factures…" className={styles.sections}>
      {!props.error && <>
        <Section tone="outlined" id="invoice-list" className={styles.tablePanel} aria-labelledby="invoice-list-title">
          <CardHeader variant="plain" className={styles.sectionHeading}><h2 id="invoice-list-title">Vos factures</h2><Button variant="secondary" size="sm" onClick={() => props.onExport(rows)} disabled={!rows.length}>Exporter CSV</Button></CardHeader>
          <div className={styles.tabs} role="group" aria-label="Vue des factures">{tabs.map(([value,label]) => <Button key={value} size="sm" variant={tab === value ? "primary" : "ghost"} aria-pressed={tab === value} onClick={() => {setTab(value);props.onStatus("all");setPage(1);}}>{label}</Button>)}</div>
          <TableFilters resultCount={rows.length} resultLabel={rows.length + " facture(s)"} activeCount={activeCount} onReset={reset} resetLabel="Réinitialiser">
            <label>Recherche<Input bare type="search" value={props.searchTerm} onChange={event => {props.onSearch(event.target.value);setPage(1);}} placeholder="N°, séjour, logement…" /></label>
            <label>Année<Select bare aria-label="Année des factures" value={year} onChange={event => {setYear(event.target.value);setPage(1);}}><option value="all">Toutes les années</option>{years.map(value => <option key={value} value={value}>{value}</option>)}</Select></label>
            <label>Statut<Select bare aria-label="Statut des factures" value={props.statusFilter} onChange={event => {props.onStatus(event.target.value);setPage(1);}}><option value="all">Tous les statuts</option>{statuses.map(value => <option key={value} value={value}>{invoiceStatusLabel(value)}</option>)}</Select></label>
          </TableFilters>
          {props.targetInvoiceId && <Alert tone="info" title="Facture sélectionnée" action={<ButtonLink href="/dashboard/owner/factures" variant="ghost" size="sm">Voir toutes les factures</ButtonLink>}>{props.targetedInvoice?.invoice_number || "La facture demandée n’est pas présente dans les résultats chargés."}</Alert>}
          <DataTable columns={columns} rows={rows.slice((currentPage-1)*10,currentPage*10)} getRowId={row => row.id} caption="Factures et règlements du propriétaire" responsiveStrategy="cards" emptyLabel="Aucune facture ne correspond à cette sélection." renderRowAction={rowActions} />
          {rows.length > 10 && <nav className={styles.pagination} aria-label="Pagination des factures"><Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage-1)}>Précédent</Button><span aria-live="polite">Page {currentPage} sur {pageCount}</span><Button variant="secondary" size="sm" disabled={currentPage === pageCount} onClick={() => setPage(currentPage+1)}>Suivant</Button></nav>}
          <p>Montants hors brouillons et factures annulées. Les montants non renseignés sont indiqués par un tiret ; les devises restent séparées.</p>
          {props.invoices.length >= 30 && <p>Cette vue porte sur les 30 factures les plus récentes ; les totaux et l’export peuvent être incomplets.</p>}
        </Section>
        <section className={styles.bottomGrid} aria-label="Règlements et récapitulatif">
          <Card variant="large" className={styles.panel} tone="outlined"><h2>Prochains règlements</h2>{pending.slice(0,2).map(invoice => <div className={styles.nextPayment} key={invoice.id}><strong>{invoice.invoice_number || "Facture sans numéro"}</strong><span>{invoiceAmount(invoice.balance_amount,invoice.currency || "EUR")}</span><p>Échéance : {invoiceDate(invoice.due_date)}</p><p>{metadata(invoice,["property_label","housing_name"])}</p></div>)}{!pending.length && <p>Aucune facture en attente dans les résultats chargés.</p>}<Button variant="ghost" size="sm" onClick={() => {reset();setTab("pending");document.getElementById("invoice-list")?.scrollIntoView();}}>Voir les factures à régler</Button></Card>
          <Card variant="large" className={styles.panel} tone="outlined"><h2>Récapitulatif annuel ({annualYear})</h2><dl>{[["Total facturé",amountText("total",annualTotals)],["Montant réglé",amountText("paid",annualTotals)],["Reste à régler",amountText("balance",annualTotals)],["Factures",String(annualRows.length)]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p>Sur les factures chargées de l’année.</p><Button variant="ghost" size="sm" onClick={() => {reset();setYear(annualYear);document.getElementById("invoice-list")?.scrollIntoView();}}>Voir le détail annuel</Button></Card>
          <Card variant="large" className={styles.panel} tone="outlined"><h2>Actions rapides</h2><ButtonLink href="#invoice-list" variant="ghost" size="sm">Retrouver mes documents</ButtonLink><Button variant="ghost" size="sm" onClick={() => props.onExport(rows)} disabled={!rows.length}>Exporter en CSV</Button><ButtonLink href="/dashboard/owner/messages" variant="ghost" size="sm">Demander un avoir / nous contacter</ButtonLink><p>Pour un avoir, contactez l’émetteur de votre facture.</p></Card>
        </section>
      </>}
    </AsyncState>
    <footer className={styles.footer}><span>PlanetLS · Mon espace propriétaire</span><em>Des séjours sereins, des logements qui performent.</em></footer>
  </div>;
}
