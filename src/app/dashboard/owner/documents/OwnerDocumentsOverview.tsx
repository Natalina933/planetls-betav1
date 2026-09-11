"use client";

import { useState } from "react";
import { ArrowRight, FileText, Files, Receipt, CircleCheck, House } from "lucide-react";
import { Badge, Button, ButtonLink, Card, Input, Select } from "@/components/ui";
import { invoiceDate, invoiceStatusLabel } from "../factures/invoicePresentation";
import type { OwnerInvoiceRow, OwnerQuoteRow } from "./page";
import styles from "./OwnerDocumentsOverview.module.scss";

type Props = {
  quotes: OwnerQuoteRow[];
  invoices: OwnerInvoiceRow[];
  pendingQuotes: number;
  pendingInvoices: number;
  loading: boolean;
  error: string | null;
};

const quoteLabels: Record<string, string> = { draft: "Brouillon", sent: "Envoyé", accepted: "Accepté", rejected: "Refusé", canceled: "Annulé", expired: "Expiré", signed: "Signé" };

export default function OwnerDocumentsOverview({ quotes, invoices, pendingQuotes, pendingInvoices, loading, error }: Props) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [attention, setAttention] = useState("all");
  const documents = [
    ...quotes.map(row => ({ id: row.id, type: "quote", label: row.quote_number || "Devis sans numéro", date: row.valid_until, status: quoteLabels[row.status ?? "draft"] || row.status, pending: row.status === "draft" || row.status === "sent", href: `/api/quotes/${row.id}/document` })),
    ...invoices.map(row => ({ id: row.id, type: "invoice", label: row.invoice_number || "Facture sans numéro", date: row.due_date, status: invoiceStatusLabel(row.status), pending: row.status !== "paid" && row.status !== "canceled", href: `/api/invoices/${row.id}/document` })),
  ];
  const filtered = documents.filter(row => (type === "all" || type === row.type) && (attention === "all" || row.pending) && `${row.label} ${row.status}`.toLocaleLowerCase("fr").includes(search.trim().toLocaleLowerCase("fr")));
  const metrics = [
    { label: "Documents", value: documents.length, hint: "Documents récents", icon: Files },
    { label: "Devis", value: quotes.length, hint: `${pendingQuotes} en attente`, icon: FileText },
    { label: "Factures", value: invoices.length, hint: `${pendingInvoices} à suivre`, icon: Receipt },
    { label: "À suivre", value: pendingQuotes + pendingInvoices, hint: "Validation et règlement", icon: CircleCheck },
  ];
  return <div className={styles.page} aria-busy={loading}>
    <header className={styles.hero}>
      <nav aria-label="Fil d’Ariane">Propriétaire <span aria-hidden="true">›</span> Documents</nav>
      <p className={styles.eyebrow}>Documents et justificatifs</p><h1>Vos documents, au même endroit</h1>
      <p>Retrouvez vos devis et factures, suivez les validations et gardez vos justificatifs à portée de main.</p>
      <blockquote>« Des séjours sereins, des logements qui performent. »</blockquote>
    </header>
    <section className={styles.metrics} aria-label="Indicateurs documentaires">
      {metrics.map(({ label, value, hint, icon: Icon }) => <Card className={styles.metric} key={label}><Icon aria-hidden="true" /><div><strong>{loading || error ? "—" : value}</strong><h2>{label}</h2><p>{loading || error ? "Documents récents" : hint}</p></div></Card>)}
    </section>
    <Card className={styles.quickActions}><div><p className={styles.eyebrow}>Actions rapides</p><h2>Faire maintenant</h2></div>
      <ButtonLink className={styles.quickAction} href="/dashboard/owner/devis" variant="secondary"><FileText aria-hidden="true" /><span><small>Validation</small>Consulter mes devis</span><ArrowRight aria-hidden="true" /></ButtonLink>
      <ButtonLink className={styles.quickAction} href="/dashboard/owner/factures" variant="secondary"><Receipt aria-hidden="true" /><span><small>Règlements</small>Suivre mes factures</span><ArrowRight aria-hidden="true" /></ButtonLink>
    </Card>
    <section className={styles.library} aria-labelledby="documents-title">
      <div className={styles.heading}><div><p className={styles.eyebrow}>Bibliothèque</p><h2 id="documents-title">Mes documents</h2></div><p>{loading || error ? "—" : filtered.length} document(s)</p></div>
      <div className={styles.filters}>
        <Input aria-label="Rechercher un document" placeholder="Rechercher un numéro, un statut…" value={search} onChange={event => setSearch(event.target.value)} />
        <Select aria-label="Type de document" value={type} onChange={event => setType(event.target.value)}><option value="all">Tous les documents</option><option value="quote">Devis</option><option value="invoice">Factures</option></Select>
        <Select aria-label="Suivi des documents" value={attention} onChange={event => setAttention(event.target.value)}><option value="all">Tous les suivis</option><option value="pending">À suivre</option></Select>
        <Button variant="ghost" onClick={() => { setSearch(""); setType("all"); setAttention("all"); }}>Réinitialiser</Button>
      </div>
      {loading ? <p role="status">Chargement des documents…</p> : error ? <div role="alert" className={styles.error}><p>{error}</p><Button variant="secondary" onClick={() => window.location.reload()}>Réessayer</Button></div> : filtered.length ? <div className={styles.tableWrap}>
        <table><caption>Devis et factures récents</caption><thead><tr><th scope="col">Document</th><th scope="col">Type</th><th scope="col">Date limite</th><th scope="col">Statut</th><th scope="col">Actions</th></tr></thead>
          <tbody>{filtered.map(row => <tr key={`${row.type}-${row.id}`}><td data-label="Document"><span className={styles.documentName}><FileText size={20} aria-hidden="true" /><strong>{row.label}</strong></span></td><td data-label="Type">{row.type === "quote" ? "Devis" : "Facture"}</td><td data-label="Date limite"><span><small>{row.type === "quote" ? "Validité" : "Échéance"}</small>{invoiceDate(row.date)}</span></td><td data-label="Statut"><Badge variant={row.pending ? "warning" : "neutral"}>{row.status}</Badge></td><td data-label="Actions"><div className={styles.rowActions}><ButtonLink href={row.href} target="_blank" rel="noreferrer" variant="secondary" size="sm">Consulter</ButtonLink><ButtonLink href={`${row.href}?print=1`} target="_blank" rel="noreferrer" variant="ghost" size="sm">Imprimer / PDF</ButtonLink></div></td></tr>)}</tbody>
        </table>
      </div> : <div className={styles.empty}><Files aria-hidden="true" /><h3>{documents.length ? "Aucun résultat pour ces filtres" : "Vos documents apparaîtront ici"}</h3><p>{documents.length ? "Modifiez votre recherche ou réinitialisez les filtres." : "Les devis et factures disponibles seront regroupés dans cette bibliothèque."}</p></div>}
      <p className={styles.note}>Cette vue présente les dix derniers devis et les dix dernières factures. Pour poursuivre leur suivi, ouvrez la rubrique correspondante.</p>
    </section>
    <section className={styles.tips} aria-label="Repères documentaires">
      <Card><h2>Valider sereinement</h2><p>Relisez les devis en attente avant de confirmer une prestation.</p><ButtonLink href="/dashboard/owner/devis" variant="ghost">Ouvrir les devis <ArrowRight size={16} aria-hidden="true" /></ButtonLink></Card>
      <Card><h2>Garder une trace</h2><p>Ouvrez le document puis utilisez l’impression pour conserver une copie PDF.</p></Card>
      <Card><h2>Une question ?</h2><p>Retrouvez votre conciergerie dans la messagerie pour clarifier un document.</p><ButtonLink href="/dashboard/owner/messages" variant="ghost">Ouvrir la messagerie <ArrowRight size={16} aria-hidden="true" /></ButtonLink></Card>
    </section>
    <footer className={styles.footer}><div><House aria-hidden="true" /><span><strong>PlanetLS</strong><small>Mon espace propriétaire</small></span></div><p>« Des séjours sereins,<br />des logements qui performent. »</p></footer>
  </div>;
}
