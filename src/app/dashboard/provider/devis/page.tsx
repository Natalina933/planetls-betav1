"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import WorkflowStatusBadge from "@/app/components/ui/WorkflowStatusBadge/WorkflowStatusBadge";
import ProviderWorkspacePage from "../_components/ProviderWorkspacePage";
import styles from "../ProviderCrudPage.module.scss";

type QuoteRow = {
  id: string;
  quote_number: string | null;
  status: string | null;
  total_amount: number | null;
  currency?: string | null;
  valid_until?: string | null;
  sent_at?: string | null;
  accepted_at?: string | null;
  rejected_at?: string | null;
  created_at?: string | null;
  owner?: {
    first_name?: string | null;
    last_name?: string | null;
    company_name?: string | null;
  } | null;
  quote_items?: Array<{
    id: string;
    label: string;
    quantity: number;
    line_total: number;
  }>;
};

const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

function formatAmount(value: number | null | undefined, currency = "EUR") {
  if (typeof value !== "number") return "-";
  if (currency === "EUR") return money.format(value);
  return `${value.toFixed(2)} ${currency}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function ownerLabel(owner: QuoteRow["owner"]) {
  return (
    owner?.company_name ||
    [owner?.first_name, owner?.last_name].filter(Boolean).join(" ") ||
    "Client"
  );
}

export default function ProviderDevisPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    ownerProfileId: "",
    label: "",
    quantity: "1",
    unitPrice: "",
    notes: "",
  });

  const loadQuotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/quotes?limit=80", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de charger les devis.");
      }

      setQuotes(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les devis.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function createQuote() {
    try {
      setBusyAction("create");
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_profile_id: draft.ownerProfileId.trim(),
          notes: draft.notes.trim() || null,
          items: [
            {
              label: draft.label.trim(),
              quantity: Number(draft.quantity || 1),
              unit_price: Number(draft.unitPrice || 0),
            },
          ],
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de créer le devis.");
      }

      setDraft({ ownerProfileId: "", label: "", quantity: "1", unitPrice: "", notes: "" });
      setSuccess("Le devis a été créé. Vous pouvez maintenant l'envoyer au client.");
      await loadQuotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer le devis.");
    } finally {
      setBusyAction(null);
    }
  }

  async function updateQuoteStatus(quoteId: string, status: "sent") {
    try {
      setBusyAction(`${quoteId}:${status}`);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/quotes/${quoteId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de mettre à jour le devis.");
      }

      setSuccess("Le devis a été envoyé au client.");
      await loadQuotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour le devis.");
    } finally {
      setBusyAction(null);
    }
  }

  async function generateInvoice(quoteId: string) {
    try {
      setBusyAction(`${quoteId}:invoice`);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/invoices/from-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote_id: quoteId, status: "issued" }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de générer la facture.");
      }

      setSuccess(`Facture ${payload?.invoice_number || ""} générée.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de générer la facture.");
    } finally {
      setBusyAction(null);
    }
  }

  useEffect(() => {
    void loadQuotes();
  }, [loadQuotes]);

  const filteredQuotes = useMemo(
    () =>
      statusFilter === "all"
        ? quotes
        : quotes.filter((quote) => (quote.status ?? "draft") === statusFilter),
    [quotes, statusFilter],
  );

  const pendingCount = useMemo(
    () => quotes.filter((quote) => ["draft", "sent"].includes(String(quote.status ?? ""))).length,
    [quotes],
  );
  const acceptedCount = useMemo(
    () => quotes.filter((quote) => quote.status === "accepted").length,
    [quotes],
  );
  const rejectedCount = useMemo(
    () => quotes.filter((quote) => quote.status === "rejected").length,
    [quotes],
  );
  const visibleAmount = useMemo(
    () => filteredQuotes.reduce((sum, quote) => sum + (quote.total_amount ?? 0), 0),
    [filteredQuotes],
  );

  return (
    <ProviderWorkspacePage
      eyebrow="Finance"
      title="Devis et factures"
      description="Suivez les devis envoyés, acceptés ou refusés par vos clients."
      chips={["Devis", "Validation client", "Facturation"]}
      metrics={[
        { label: "Devis", value: loading ? "..." : String(quotes.length) },
        { label: "En cours", value: loading ? "..." : String(pendingCount) },
        { label: "Acceptés", value: loading ? "..." : String(acceptedCount) },
        { label: "Refusés", value: loading ? "..." : String(rejectedCount) },
      ]}
      actions={[
        { label: "Voir les clients", href: "/dashboard/provider/clients" },
        { label: "Voir la vue d'ensemble", href: "/dashboard/provider" },
      ]}
      cards={[]}
    >
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Suivi commercial</h2>
            <p className={styles.emptyState}>
              {loading ? "Chargement..." : `${filteredQuotes.length} devis affiché(s), ${formatAmount(visibleAmount)} visibles.`}
            </p>
          </div>
          <div className={styles.toolbarGroup}>
            <select
              className={styles.toolbarSelect}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filtrer les devis par statut"
            >
              <option value="all">Tous statuts</option>
              <option value="draft">Brouillon</option>
              <option value="sent">En cours</option>
              <option value="accepted">Accepté</option>
              <option value="rejected">Refusé</option>
              <option value="expired">Expiré</option>
              <option value="canceled">Annulé</option>
            </select>
            <button type="button" className={styles.secondaryButton} onClick={() => void loadQuotes()}>
              Actualiser
            </button>
          </div>
        </div>

        {error ? <p className={styles.errorBox}>{error}</p> : null}
        {success ? <p className={styles.successBox}>{success}</p> : null}

        <div className={styles.formGrid}>
          <label>
            Profil client
            <input
              className={styles.fieldInput}
              value={draft.ownerProfileId}
              onChange={(event) => setDraft((current) => ({ ...current, ownerProfileId: event.target.value }))}
              placeholder="UUID du propriétaire"
            />
          </label>
          <label>
            Prestation
            <input
              className={styles.fieldInput}
              value={draft.label}
              onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
              placeholder="Ex. Dépannage plomberie"
            />
          </label>
          <label>
            Quantité
            <input
              className={styles.fieldInput}
              type="number"
              min="1"
              value={draft.quantity}
              onChange={(event) => setDraft((current) => ({ ...current, quantity: event.target.value }))}
            />
          </label>
          <label>
            Prix unitaire
            <input
              className={styles.fieldInput}
              type="number"
              min="0"
              step="0.01"
              value={draft.unitPrice}
              onChange={(event) => setDraft((current) => ({ ...current, unitPrice: event.target.value }))}
            />
          </label>
          <label className={styles.fullWidth}>
            Notes
            <textarea
              className={styles.fieldTextarea}
              value={draft.notes}
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Conditions, délai, détails visibles sur le devis"
            />
          </label>
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={
                busyAction === "create" ||
                !draft.ownerProfileId.trim() ||
                !draft.label.trim() ||
                Number(draft.unitPrice || 0) <= 0
              }
              onClick={() => void createQuote()}
            >
              {busyAction === "create" ? "Création..." : "Créer un devis"}
            </button>
          </div>
        </div>

        {!loading && !error && filteredQuotes.length === 0 ? (
          <p className={styles.emptyState}>Aucun devis à afficher pour ce filtre.</p>
        ) : null}

        <div className={styles.cardList}>
          {filteredQuotes.map((quote) => (
            <article key={quote.id} className={styles.itemCard}>
              <div className={styles.itemHead}>
                <div>
                  <h3>{quote.quote_number || "Devis brouillon"}</h3>
                  <p>{ownerLabel(quote.owner)}</p>
                </div>
                <WorkflowStatusBadge value={quote.status || "draft"} />
              </div>
              <div className={styles.itemMeta}>
                <span>{formatAmount(quote.total_amount, quote.currency ?? "EUR")}</span>
                <span>Créé le {formatDate(quote.created_at)}</span>
                <span>Validité {formatDate(quote.valid_until)}</span>
                {quote.accepted_at ? <span>Accepté le {formatDate(quote.accepted_at)}</span> : null}
                {quote.rejected_at ? <span>Refusé le {formatDate(quote.rejected_at)}</span> : null}
              </div>
              <p className={styles.itemBody}>
                {(quote.quote_items ?? []).length
                  ? (quote.quote_items ?? [])
                      .slice(0, 3)
                      .map((item) => `${item.label} (${item.quantity}x)`)
                      .join(" · ")
                  : "Aucune ligne de devis renseignée."}
              </p>
              <div className={styles.cardActions}>
                {quote.status === "draft" ? (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={busyAction === `${quote.id}:sent`}
                    onClick={() => void updateQuoteStatus(quote.id, "sent")}
                  >
                    {busyAction === `${quote.id}:sent` ? "Envoi..." : "Envoyer"}
                  </button>
                ) : null}
                {quote.status === "accepted" ? (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={busyAction === `${quote.id}:invoice`}
                    onClick={() => void generateInvoice(quote.id)}
                  >
                    {busyAction === `${quote.id}:invoice` ? "Génération..." : "Générer facture"}
                  </button>
                ) : null}
                <a
                  href={`/api/quotes/${quote.id}/document`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.linkButton}
                >
                  Ouvrir le PDF
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </ProviderWorkspacePage>
  );
}
