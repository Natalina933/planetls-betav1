"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AsyncState,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  Tag,
  Textarea,
} from "@/components/ui";
import styles from "./TariffBillingDesk.module.scss";

type QuoteItem = {
  id?: string;
  label: string;
  description?: string | null;
  quantity: number;
  unit_price: number;
  service_id?: number | null;
  pricing_id?: string | null;
  sort_order?: number;
};

type QuoteMeta = {
  source?: string;
  requested_services?: string[];
  auto_match_summary?: { matchedPackageName?: string | null; matchedPricingCount?: number };
};

type QuoteLite = {
  id: string;
  quote_number?: string | null;
  status?: string | null;
  total_amount?: number | null;
  valid_until?: string | null;
  created_at?: string | null;
  package_id?: string | null;
  notes?: string | null;
  metadata?: QuoteMeta | null;
  owner?: {
    id?: string;
    first_name?: string | null;
    last_name?: string | null;
    company_name?: string | null;
  } | null;
  quote_items?: QuoteItem[];
};

type InvoiceLite = {
  id: string;
  invoice_number?: string | null;
  status?: string | null;
  total_amount?: number | null;
  created_at?: string | null;
};

type PricingLite = {
  id: string;
  label?: string | null;
  amount?: number | null;
  unit?: string | null;
  service_id?: number | null;
};

type PackageLite = {
  id: string;
  name?: string | null;
  services_package_items?: Array<{ service_id: string | number }>;
};

type ServiceLite = { id: number; service?: string | null; category?: string | null };
type Mode = "package" | "custom";
type TariffBillingDeskProps = { initialSelectedQuoteId?: string; [key: string]: unknown };

const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const formatMoney = (value?: number | null) => money.format(Number(value ?? 0));
const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString("fr-FR") : "-");
const formatPackageName = (value?: string | null) =>
  (value ?? "").replace(/\(\s*seed\s*\)/gi, "(Initial)").trim() || "Pack";

const statusLabel = (status?: string | null) =>
  ({
    draft: "Brouillon",
    sent: "Envoyé",
    accepted: "Accepté",
    rejected: "Refusé",
    canceled: "Annulé",
    expired: "Expiré",
    issued: "Émise",
    paid: "Payée",
    overdue: "En retard",
  })[String(status ?? "")] ?? (status || "-");

const statusVariant = (status?: string | null) => {
  if (status === "accepted" || status === "paid") return "success" as const;
  if (status === "sent" || status === "issued") return "info" as const;
  if (status === "rejected" || status === "canceled") return "danger" as const;
  if (status === "expired" || status === "overdue") return "warning" as const;
  return "neutral" as const;
};

const ownerLabel = (owner?: QuoteLite["owner"]) =>
  owner?.company_name ||
  [owner?.first_name, owner?.last_name].filter(Boolean).join(" ") ||
  "Propriétaire";

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.trashIcon}>
      <path
        d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v8h-2v-8Zm4 0h2v8h-2v-8ZM7 10h2v8H7v-8Zm1 11h8a2 2 0 0 0 2-2V8H6v11a2 2 0 0 0 2 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function TariffBillingDesk({ initialSelectedQuoteId }: TariffBillingDeskProps) {
  const [quotes, setQuotes] = useState<QuoteLite[]>([]);
  const [invoices, setInvoices] = useState<InvoiceLite[]>([]);
  const [pricing, setPricing] = useState<PricingLite[]>([]);
  const [packages, setPackages] = useState<PackageLite[]>([]);
  const [services, setServices] = useState<ServiceLite[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(initialSelectedQuoteId ?? null);
  const [editor, setEditor] = useState<QuoteLite | null>(null);
  const [mode, setMode] = useState<Mode>("custom");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedPricingId, setSelectedPricingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [quotesRes, invoicesRes, pricingRes, packagesRes, servicesRes] = await Promise.all([
        fetch("/api/quotes?limit=30", { cache: "no-store" }),
        fetch("/api/invoices?limit=12", { cache: "no-store" }),
        fetch("/api/services/service_pricing", { cache: "no-store" }),
        fetch("/api/services/packages", { cache: "no-store" }),
        fetch("/api/services/services-catalog", { cache: "no-store" }),
      ]);

      const [quotesData, invoicesData, pricingData, packagesData, servicesData] = await Promise.all([
        quotesRes.json(),
        invoicesRes.json(),
        pricingRes.json(),
        packagesRes.json(),
        servicesRes.json(),
      ]);

      if (!quotesRes.ok) {
        throw new Error(quotesData?.error || "Impossible de charger les devis.");
      }

      const nextQuotes = Array.isArray(quotesData) ? quotesData : [];
      setQuotes(nextQuotes);
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      setPricing(Array.isArray(pricingData) ? pricingData : []);
      setPackages(Array.isArray(packagesData) ? packagesData : []);
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setSelectedQuoteId((previous) => previous ?? initialSelectedQuoteId ?? nextQuotes[0]?.id ?? null);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Impossible de charger le bureau devis.");
    } finally {
      setLoading(false);
    }
  }, [initialSelectedQuoteId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedQuoteId) {
      setEditor(null);
      return;
    }
    const current = quotes.find((quote) => quote.id === selectedQuoteId) ?? null;
    if (!current) return;
    setEditor({
      ...current,
      quote_items: (current.quote_items ?? []).map((item, index) => ({
        ...item,
        quantity: Number(item.quantity ?? 1),
        unit_price: Number(item.unit_price ?? 0),
        sort_order: Number(item.sort_order ?? index),
      })),
    });
    setSelectedPackageId(current.package_id ?? "");
    setMode(current.package_id ? "package" : "custom");
  }, [quotes, selectedQuoteId]);

  const serviceNames = useMemo(
    () =>
      new Map(
        services.map((service) => [
          service.id,
          service.service || service.category || `Service #${service.id}`,
        ]),
      ),
    [services],
  );

  const packagePricing = useMemo(() => {
    if (!selectedPackageId) return [] as PricingLite[];
    const currentPackage = packages.find((entry) => entry.id === selectedPackageId);
    const serviceIds = new Set(
      (currentPackage?.services_package_items ?? []).map((item) => Number(item.service_id)),
    );
    return pricing.filter((entry) => entry.service_id !== null && serviceIds.has(Number(entry.service_id)));
  }, [packages, pricing, selectedPackageId]);

  const totals = useMemo(() => {
    const subtotal = (editor?.quote_items ?? []).reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
      0,
    );
    return { subtotal, total: subtotal };
  }, [editor]);

  const updateEditor = (patch: Partial<QuoteLite>) =>
    setEditor((previous) => (previous ? { ...previous, ...patch } : previous));

  const updateItem = (index: number, patch: Partial<QuoteItem>) =>
    setEditor((previous) =>
      previous
        ? {
            ...previous,
            quote_items: (previous.quote_items ?? []).map((item, itemIndex) =>
              itemIndex === index ? { ...item, ...patch } : item,
            ),
          }
        : previous,
    );

  const removeItem = (index: number) =>
    setEditor((previous) =>
      previous
        ? {
            ...previous,
            quote_items: (previous.quote_items ?? [])
              .filter((_, itemIndex) => itemIndex !== index)
              .map((item, itemIndex) => ({ ...item, sort_order: itemIndex })),
          }
        : previous,
    );

  const applyPackage = () => {
    if (!editor || !selectedPackageId) return;
    updateEditor({
      package_id: selectedPackageId,
      quote_items: packagePricing.map((entry, index) => ({
        label: entry.label?.trim() || "Service packagé",
        description: entry.unit ? `Tarif ${entry.unit}` : null,
        quantity: entry.unit?.toLowerCase().includes("heure") ? 2 : 1,
        unit_price: Number(entry.amount ?? 0),
        service_id: entry.service_id ?? null,
        pricing_id: entry.id,
        sort_order: index,
      })),
    });
    setSuccessMsg("Le pack a été intégré au devis.");
  };

  const addPricing = () => {
    if (!editor || !selectedPricingId) return;
    const currentPricing = pricing.find((entry) => entry.id === selectedPricingId);
    if (!currentPricing) return;
    if ((editor.quote_items ?? []).some((item) => item.pricing_id === currentPricing.id)) {
      setSuccessMsg("Ce tarif est déjà présent dans le devis.");
      return;
    }
    updateEditor({
      package_id: null,
      quote_items: [
        ...(editor.quote_items ?? []),
        {
          label: currentPricing.label?.trim() || "Tarif",
          description: currentPricing.unit ? `Tarif ${currentPricing.unit}` : null,
          quantity: currentPricing.unit?.toLowerCase().includes("heure") ? 2 : 1,
          unit_price: Number(currentPricing.amount ?? 0),
          service_id: currentPricing.service_id ?? null,
          pricing_id: currentPricing.id,
          sort_order: (editor.quote_items ?? []).length,
        },
      ],
    });
    setSuccessMsg("Le tarif a été ajouté au devis.");
  };

  const saveQuote = async () => {
    if (!editor) return;
    setBusyAction("save");
    setErrorMsg(null);
    try {
      const response = await fetch(`/api/quotes/${editor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: mode === "package" ? selectedPackageId || null : null,
          valid_until: editor.valid_until ?? null,
          notes: editor.notes ?? null,
          items: (editor.quote_items ?? []).map((item, index) => ({ ...item, sort_order: index })),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Impossible d'enregistrer le devis.");
      setQuotes((previous) => previous.map((quote) => (quote.id === payload.id ? payload : quote)));
      setSuccessMsg("Le devis a été enregistré.");
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Erreur d'enregistrement.");
    } finally {
      setBusyAction(null);
    }
  };

  const sendQuote = async () => {
    if (!editor) return;
    setBusyAction("send");
    setErrorMsg(null);
    try {
      const response = await fetch(`/api/quotes/${editor.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sent" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Impossible d'envoyer le devis.");
      setQuotes((previous) =>
        previous.map((quote) => (quote.id === payload.id ? { ...quote, ...payload } : quote)),
      );
      setSuccessMsg("Le devis a été envoyé.");
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Erreur d'envoi.");
    } finally {
      setBusyAction(null);
    }
  };

  const generateInvoice = async () => {
    if (!editor) return;
    setBusyAction("invoice");
    setErrorMsg(null);
    try {
      const response = await fetch("/api/invoices/from-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote_id: editor.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Impossible de générer la facture.");
      setInvoices((previous) => [payload, ...previous]);
      setSuccessMsg("La facture a été générée.");
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Erreur de génération de facture.");
    } finally {
      setBusyAction(null);
    }
  };

  const deleteQuote = async () => {
    if (!editor) return;
    setBusyAction("delete");
    setErrorMsg(null);
    try {
      const response = await fetch(`/api/quotes/${editor.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Impossible de supprimer le devis.");
      const remainingQuotes = quotes.filter((quote) => quote.id !== editor.id);
      setQuotes(remainingQuotes);
      setSelectedQuoteId(remainingQuotes[0]?.id ?? null);
      setSuccessMsg("Le devis brouillon a été supprimé.");
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Erreur de suppression.");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className={styles.root}>
      {successMsg ? <p className={styles.feedbackSuccess}>{successMsg}</p> : null}
      {errorMsg && !loading ? <p className={styles.feedbackError}>{errorMsg}</p> : null}

      <AsyncState
        loading={loading}
        error={loading ? null : errorMsg}
        isEmpty={!loading && quotes.length === 0}
        emptyLabel="Aucun devis disponible pour le moment."
      >
        {editor ? (
          <div className={styles.layout}>
            <aside className={styles.sidebar}>
              <Card variant="large" tone="soft" className={styles.panel}>
                <CardHeader>
                  <div>
                    <h3 className={styles.panelTitle}>Mes devis</h3>
                  </div>
                </CardHeader>
                <CardBody className={styles.listBody}>
                  {quotes.map((quote) => (
                    <div
                      key={quote.id}
                      className={`${styles.quoteRow} ${selectedQuoteId === quote.id ? styles.quoteRowActive : ""}`}
                    >
                      <button
                        type="button"
                        className={styles.quoteRowButton}
                        onClick={() => setSelectedQuoteId(quote.id)}
                      >
                        <div className={styles.quoteRowHead}>
                          <strong>{quote.quote_number || "Devis brouillon"}</strong>
                          <Badge variant={statusVariant(quote.status)}>{statusLabel(quote.status)}</Badge>
                        </div>
                      </button>
                      {["draft", "canceled"].includes(String(quote.status ?? "")) ? (
                        <button
                          type="button"
                          className={styles.quoteDeleteBtn}
                          aria-label={`Supprimer ${quote.quote_number || "ce devis"}`}
                          onClick={async (event) => {
                            event.stopPropagation();
                            const response = await fetch(`/api/quotes/${quote.id}`, { method: "DELETE" });
                            const payload = await response.json();
                            if (!response.ok) {
                              setErrorMsg(payload?.error || "Impossible de supprimer le devis.");
                              return;
                            }
                            const remainingQuotes = quotes.filter((entry) => entry.id !== quote.id);
                            setQuotes(remainingQuotes);
                            if (selectedQuoteId === quote.id) {
                              setSelectedQuoteId(remainingQuotes[0]?.id ?? null);
                            }
                            setSuccessMsg("Le devis a été supprimé.");
                          }}
                        >
                          <TrashIcon />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </CardBody>
              </Card>

              <Card variant="large" tone="outlined" className={styles.panel}>
                <CardHeader>
                  <div>
                    <h3 className={styles.panelTitle}>Dernières factures</h3>
                    <p className={styles.panelText}>Juste les plus récentes.</p>
                  </div>
                </CardHeader>
                <CardBody className={styles.listBody}>
                  {invoices.length ? (
                    invoices.slice(0, 4).map((invoice) => (
                      <div key={invoice.id} className={styles.invoiceRow}>
                        <div className={styles.quoteRowHead}>
                          <strong>{invoice.invoice_number || "Facture"}</strong>
                          <Badge variant={statusVariant(invoice.status)}>{statusLabel(invoice.status)}</Badge>
                        </div>
                        <span>{formatDate(invoice.created_at)}</span>
                        <span>{formatMoney(invoice.total_amount)}</span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.emptyCopy}>Aucune facture générée.</p>
                  )}
                </CardBody>
              </Card>
            </aside>

            <section className={styles.editorColumn}>
              <Card variant="large" tone="elevated" className={styles.editorCard}>
                <CardHeader className={styles.editorHeader}>
                  <div>
                    <div className={styles.editorTitleRow}>
                      <h3 className={styles.panelTitle}>{editor.quote_number || "Devis brouillon"}</h3>
                      <Badge variant={statusVariant(editor.status)}>{statusLabel(editor.status)}</Badge>
                    </div>
                    <p className={styles.panelText}>
                      {ownerLabel(editor.owner)} · validité {formatDate(editor.valid_until)}
                    </p>
                  </div>
                  <div className={styles.actionRow}>
                    <Button className={styles.actionSecondary} variant="dark" size="sm" onClick={() => void load()} disabled={loading}>
                      Actualiser
                    </Button>
                    <Button className={styles.actionSecondary} variant="dark" size="sm" onClick={saveQuote} disabled={Boolean(busyAction)}>
                      Enregistrer
                    </Button>
                    <Button
                      className={styles.actionPrimary}
                      variant="primary"
                      size="sm"
                      onClick={sendQuote}
                      disabled={Boolean(busyAction) || editor.status === "sent"}
                    >
                      Envoyer
                    </Button>
                    <Button
                      className={styles.actionSecondary}
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/quotes/${editor.id}/document`, "_blank", "noopener,noreferrer")}
                    >
                      PDF
                    </Button>
                    <Button className={styles.actionGhost} variant="ghost" size="sm" onClick={generateInvoice} disabled={Boolean(busyAction)}>
                      Générer facture
                    </Button>
                    {editor.status === "draft" ? (
                      <Button className={styles.actionDanger} variant="outline" size="sm" onClick={deleteQuote} disabled={Boolean(busyAction)}>
                        Supprimer
                      </Button>
                    ) : null}
                  </div>
                </CardHeader>

                <CardBody className={styles.editorBody}>
                  {editor.metadata?.source === "service_request" ? (
                    <div className={styles.contextBox}>
                      <div className={styles.contextHeader}>
                        <strong>Contexte propriétaire</strong>
                        {editor.metadata.auto_match_summary?.matchedPackageName ? (
                          <Tag tone="gold">Pack suggéré: {formatPackageName(editor.metadata.auto_match_summary.matchedPackageName)}</Tag>
                        ) : null}
                      </div>
                      <p className={styles.contextOwner}>{ownerLabel(editor.owner)}</p>
                      <div className={styles.tags}>
                        {(editor.metadata.requested_services ?? []).length ? (
                          (editor.metadata.requested_services ?? []).map((service) => (
                            <Tag key={`${editor.id}-${service}`} tone="category">
                              {service}
                            </Tag>
                          ))
                        ) : (
                          <Tag tone="default">Services à préciser</Tag>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className={styles.modeRow}>
                    <Button className={mode === "package" ? styles.actionPrimary : styles.actionSecondary} variant={mode === "package" ? "primary" : "outline"} size="sm" onClick={() => setMode("package")}>
                      Utiliser un pack
                    </Button>
                    <Button
                      className={mode === "custom" ? styles.actionPrimary : styles.actionSecondary}
                      variant={mode === "custom" ? "primary" : "outline"}
                      size="sm"
                      onClick={() => {
                        setMode("custom");
                        updateEditor({ package_id: null });
                      }}
                    >
                      Tarifs unitaires
                    </Button>
                  </div>

                  {mode === "package" ? (
                    <div className={styles.selectionRow}>
                      <Select label="Pack" value={selectedPackageId} onChange={(event) => setSelectedPackageId(event.target.value)}>
                        <option value="">Sélectionner un pack</option>
                        {packages.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {formatPackageName(entry.name) || "Pack sans nom"}
                          </option>
                        ))}
                      </Select>
                      <Button className={styles.actionSecondary} variant="secondary" onClick={applyPackage} disabled={!selectedPackageId}>
                        Intégrer le pack
                      </Button>
                    </div>
                  ) : (
                    <div className={styles.selectionRow}>
                      <Select label="Tarif" value={selectedPricingId} onChange={(event) => setSelectedPricingId(event.target.value)}>
                        <option value="">Sélectionner un tarif</option>
                        {pricing.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {(entry.label || "Tarif") + " · " + formatMoney(entry.amount)}
                          </option>
                        ))}
                      </Select>
                      <Button className={styles.actionSecondary} variant="secondary" onClick={addPricing} disabled={!selectedPricingId}>
                        Ajouter le tarif
                      </Button>
                    </div>
                  )}

                  <div className={styles.lines}>
                    {(editor.quote_items ?? []).map((item, index) => (
                      <Card key={`${item.pricing_id ?? item.label}-${index}`} variant="large" tone="soft" className={styles.lineCard}>
                        <CardBody className={styles.lineGrid}>
                          <Input
                            label="Libellé"
                            value={item.label}
                            onChange={(event) => updateItem(index, { label: event.target.value })}
                          />
                          <Input
                            label="Description"
                            value={item.description ?? ""}
                            onChange={(event) => updateItem(index, { description: event.target.value })}
                          />
                          <Input
                            label="Quantité"
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(event) => updateItem(index, { quantity: Number(event.target.value || 1) })}
                          />
                          <Input
                            label="Prix unitaire"
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(event) => updateItem(index, { unit_price: Number(event.target.value || 0) })}
                          />
                          <div className={styles.lineMeta}>
                            <span>{item.pricing_id ? "Tarif existant" : "Ligne libre"}</span>
                            {item.service_id ? (
                              <Tag tone="default">
                                {serviceNames.get(Number(item.service_id)) || `Service #${item.service_id}`}
                              </Tag>
                            ) : null}
                          </div>
                          <div className={styles.lineSide}>
                            <strong>{formatMoney(Number(item.quantity || 0) * Number(item.unit_price || 0))}</strong>
                            <Button className={styles.actionGhost} variant="ghost" size="sm" onClick={() => removeItem(index)}>
                              Retirer
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>

                  <div className={styles.footerGrid}>
                    <Textarea
                      label="Notes visibles dans le devis"
                      value={editor.notes ?? ""}
                      onChange={(event) => updateEditor({ notes: event.target.value })}
                    />
                    <Card variant="large" tone="outlined" className={styles.totalCard}>
                      <CardBody className={styles.totalBody}>
                        <div>
                          <span>Sous-total</span>
                          <strong>{formatMoney(totals.subtotal)}</strong>
                        </div>
                        <div>
                          <span>Total</span>
                          <strong>{formatMoney(totals.total)}</strong>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </CardBody>
              </Card>
            </section>
          </div>
        ) : null}
      </AsyncState>
    </div>
  );
}
