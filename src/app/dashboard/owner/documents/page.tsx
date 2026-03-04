"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../OwnerDashboardPages.module.scss";

type OwnerQuoteRow = {
  id: string;
  quote_number: string | null;
  status: string | null;
  valid_until?: string | null;
};

type OwnerInvoiceRow = {
  id: string;
  invoice_number: string | null;
  status: string | null;
  due_date?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Date non renseignée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function OwnerDocumentsPage() {
  const [quotes, setQuotes] = useState<OwnerQuoteRow[]>([]);
  const [invoices, setInvoices] = useState<OwnerInvoiceRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocuments() {
      try {
        setError(null);

        const [quotesRes, invoicesRes] = await Promise.all([
          fetch("/api/quotes?limit=10", { cache: "no-store" }),
          fetch("/api/invoices?limit=10", { cache: "no-store" }),
        ]);

        const quotesPayload = await quotesRes.json();
        const invoicesPayload = await invoicesRes.json();

        if (!quotesRes.ok) {
          throw new Error(quotesPayload?.error || "Impossible de charger les devis.");
        }
        if (!invoicesRes.ok) {
          throw new Error(invoicesPayload?.error || "Impossible de charger les factures.");
        }

        setQuotes(Array.isArray(quotesPayload) ? quotesPayload : []);
        setInvoices(Array.isArray(invoicesPayload) ? invoicesPayload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos documents.");
      }
    }

    void loadDocuments();
  }, []);

  const pendingQuotes = useMemo(
    () => quotes.filter((quote) => quote.status === "draft" || quote.status === "sent").length,
    [quotes],
  );
  const pendingInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "canceled").length,
    [invoices],
  );

  return (
    <section className="dashboard-grid">
      <div className={styles.dashboardFlow}>
        <section className={styles.heroPanel}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Documents</p>
              <h1 className={styles.terracottaTitle}>Documents et PDF</h1>
              <p className={styles.meta}>
                {error ||
                  "Retrouvez vos devis et factures dans une lecture plus claire, pensée pour distinguer ce qui est à valider, à régler ou simplement à archiver."}
              </p>
            </div>
            <div className={styles.inlineActions}>
              <Link href="/dashboard/owner/devis" className={styles.buttonSecondary}>
                Ouvrir les devis
              </Link>
              <Link href="/dashboard/owner/factures" className={styles.buttonPrimary}>
                Ouvrir les factures
              </Link>
            </div>
          </div>

          <div className={styles.priorityGrid}>
            <article className={styles.priorityCard}>
              <p className={styles.cardLabel}>Devis</p>
              <strong className={styles.cardValue}>{quotes.length}</strong>
              <span className={styles.meta}>{pendingQuotes} en attente de validation.</span>
            </article>
            <article className={styles.priorityCard}>
              <p className={styles.cardLabel}>Factures</p>
              <strong className={styles.cardValue}>{invoices.length}</strong>
              <span className={styles.meta}>{pendingInvoices} à suivre ou à régler.</span>
            </article>
            <article className={`${styles.priorityCard} ${styles.priorityWarning}`}>
              <p className={styles.cardLabel}>Actions</p>
              <strong className={styles.cardValue}>{pendingQuotes + pendingInvoices}</strong>
              <span className={styles.meta}>Documents qui demandent encore une décision.</span>
            </article>
          </div>
        </section>

        <div className={styles.sectionGrid}>
          <section className={styles.panel}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Derniers devis</p>
                <h2 className={styles.terracottaSectionTitle}>À valider ou comparer</h2>
              </div>
            </div>
            {quotes.length ? (
              <ul className={styles.list}>
                {quotes.slice(0, 5).map((quote) => (
                  <li key={quote.id} className={styles.listItem}>
                    <strong>{quote.quote_number || "Devis"}</strong>
                    <p className={styles.meta}>
                      {quote.status || "brouillon"} | Valide jusqu’au {formatDate(quote.valid_until)}
                    </p>
                    <a href={`/api/quotes/${quote.id}/document`} className={styles.cardAction}>
                      Ouvrir le PDF
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.meta}>Aucun devis disponible pour le moment.</p>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Dernières factures</p>
                <h2 className={styles.terracottaSectionTitle}>Paiement et archivage</h2>
              </div>
            </div>
            {invoices.length ? (
              <ul className={styles.list}>
                {invoices.slice(0, 5).map((invoice) => (
                  <li key={invoice.id} className={styles.listItem}>
                    <strong>{invoice.invoice_number || "Facture"}</strong>
                    <p className={styles.meta}>
                      {invoice.status || "ouverte"} | Échéance {formatDate(invoice.due_date)}
                    </p>
                    <a href={`/api/invoices/${invoice.id}/document`} className={styles.cardAction}>
                      Ouvrir le PDF
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.meta}>Aucune facture disponible pour le moment.</p>
            )}
          </section>
        </div>

        <section className={styles.panel}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Lecture rapide</p>
              <h2 className={styles.terracottaSectionTitle}>Repères documentaires</h2>
            </div>
          </div>
          <div className={styles.sectionGrid}>
            <article className={styles.priorityCard}>
              <p className={styles.cardLabel}>Validation</p>
              <p className={styles.meta}>
                Concentrez-vous d’abord sur les devis `draft` ou `sent` avant de lancer une mission ou de confirmer une prestation.
              </p>
            </article>
            <article className={styles.priorityCard}>
              <p className={styles.cardLabel}>Paiement</p>
              <p className={styles.meta}>
                Les factures non `paid` restent vos points d’attention immédiats pour garder un suivi financier propre.
              </p>
            </article>
            <article className={styles.priorityCard}>
              <p className={styles.cardLabel}>Archivage</p>
              <p className={styles.meta}>
                Gardez ici une base lisible avant d’ajouter ensuite des filtres par logement, concierge ou période.
              </p>
            </article>
          </div>
        </section>
      </div>
    </section>
  );
}
