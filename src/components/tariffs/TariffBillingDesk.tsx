"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiRefreshCw,
  FiSend,
} from "react-icons/fi";
import styles from "./TariffBillingDesk.module.scss";

type MissionLite = {
  id: string;
  title: string;
  status: string;
  amount: number | null;
  currency: string | null;
};

type QuoteLite = {
  id: string;
  quote_number: string;
  status: string;
  owner_profile_id?: string | null;
  mission_id: string | null;
  total_amount: number;
  currency: string;
  notes?: string | null;
  created_at: string;
  quote_items?: Array<{
    id?: string;
    label: string;
    description?: string | null;
    quantity: number;
    unit_price: number;
    line_total?: number | null;
    sort_order?: number | null;
  }>;
};

type InvoiceLite = {
  id: string;
  invoice_number: string;
  quote_id: string | null;
  status: string;
  total_amount: number;
  balance_amount: number;
  currency: string;
  due_date: string | null;
  created_at: string;
};

type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired" | "canceled";
type InvoiceStatus =
  | "draft"
  | "issued"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "canceled";

const QUOTE_STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoye",
  accepted: "Accepte",
  rejected: "Refuse",
  expired: "Expire",
  canceled: "Annule",
};

const INVOICE_STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  issued: "Emise",
  partially_paid: "Partiellement payee",
  paid: "Payee",
  overdue: "En retard",
  canceled: "Annulee",
};

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

const getResponseError = async (res: Response, fallback: string): Promise<string> => {
  try {
    const data = await res.json();
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
    return fallback;
  } catch {
    return fallback;
  }
};

type TariffBillingDeskProps = {
  hourlyRate?: number;
  travelFee?: number;
  minimumInvoice?: number;
  urgentPercent?: number;
  nightPercent?: number;
  weekendPercent?: number;
  highSeasonPercent?: number;
  commissionRatePct?: number;
  setupFee?: number;
  presetVersion?: number;
  presetMonthlyRevenueEstimate?: number;
  presetNewListingsEstimate?: number;
  presetActServicesEstimate?: number;
  ownerProfileId?: string | null;
  ownerLabel?: string | null;
  conversationId?: string | null;
  missionId?: string | null;
};

type CreatedQuoteResult = {
  id?: string;
  quote_number?: string;
  mission_id?: string | null;
};

type DraftQuoteEditorState = {
  label: string;
  description: string;
  quantity: string;
  unitPrice: string;
  notes: string;
};

const TariffBillingDesk = ({
  hourlyRate = 0,
  travelFee = 0,
  minimumInvoice = 0,
  urgentPercent = 0,
  nightPercent = 0,
  weekendPercent = 0,
  highSeasonPercent = 0,
  commissionRatePct = 20,
  setupFee = 0,
  presetVersion = 0,
  presetMonthlyRevenueEstimate,
  presetNewListingsEstimate,
  presetActServicesEstimate,
  ownerProfileId,
  ownerLabel,
  conversationId,
  missionId,
}: TariffBillingDeskProps) => {
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [missions, setMissions] = useState<MissionLite[]>([]);
  const [quotes, setQuotes] = useState<QuoteLite[]>([]);
  const [invoices, setInvoices] = useState<InvoiceLite[]>([]);

  const [selectedMissionId, setSelectedMissionId] = useState("");
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [draftEditor, setDraftEditor] = useState<DraftQuoteEditorState>({
    label: "",
    description: "",
    quantity: "1",
    unitPrice: "0",
    notes: "",
  });
  const [monthlyRevenueEstimate, setMonthlyRevenueEstimate] = useState(6000);
  const [newListingsEstimate, setNewListingsEstimate] = useState(1);
  const [actServicesEstimate, setActServicesEstimate] = useState(4);

  useEffect(() => {
    if (presetMonthlyRevenueEstimate != null) {
      setMonthlyRevenueEstimate(Math.max(0, Number(presetMonthlyRevenueEstimate || 0)));
    }
    if (presetNewListingsEstimate != null) {
      setNewListingsEstimate(Math.max(0, Number(presetNewListingsEstimate || 0)));
    }
    if (presetActServicesEstimate != null) {
      setActServicesEstimate(Math.max(0, Number(presetActServicesEstimate || 0)));
    }
  }, [
    presetVersion,
    presetMonthlyRevenueEstimate,
    presetNewListingsEstimate,
    presetActServicesEstimate,
  ]);

  const loadData = useCallback(async () => {
    const missionParams = new URLSearchParams({ scope: "concierge", limit: "40" });
    const quoteParams = new URLSearchParams({ limit: "30" });
    const invoiceParams = new URLSearchParams({ limit: "30" });

    if (ownerProfileId) {
      missionParams.set("ownerProfileId", ownerProfileId);
      quoteParams.set("ownerProfileId", ownerProfileId);
      invoiceParams.set("ownerProfileId", ownerProfileId);
    }

    const [missionsRes, quotesRes, invoicesRes] = await Promise.all([
      fetch(`/api/missions?${missionParams.toString()}`),
      fetch(`/api/quotes?${quoteParams.toString()}`),
      fetch(`/api/invoices?${invoiceParams.toString()}`),
    ]);

    if (!missionsRes.ok) {
      throw new Error(await getResponseError(missionsRes, "Erreur chargement missions"));
    }
    if (!quotesRes.ok) {
      throw new Error(await getResponseError(quotesRes, "Erreur chargement devis"));
    }
    if (!invoicesRes.ok) {
      throw new Error(await getResponseError(invoicesRes, "Erreur chargement factures"));
    }

    const [missionsData, quotesData, invoicesData] = await Promise.all([
      missionsRes.json(),
      quotesRes.json(),
      invoicesRes.json(),
    ]);

    const nextMissions: MissionLite[] = Array.isArray(missionsData) ? missionsData : [];
    const nextQuotes: QuoteLite[] = Array.isArray(quotesData) ? quotesData : [];
    const nextInvoices: InvoiceLite[] = Array.isArray(invoicesData) ? invoicesData : [];

    setMissions(nextMissions);
    setQuotes(nextQuotes);
    setInvoices(nextInvoices);

    const missionToSelect =
      (missionId && nextMissions.find((mission) => mission.id === missionId)?.id) ??
      nextMissions[0]?.id ??
      "";
    const quoteToSelect =
      (missionId && nextQuotes.find((quote) => quote.mission_id === missionId)?.id) ??
      nextQuotes[0]?.id ??
      "";

    setSelectedMissionId((prev) => {
      if (prev && nextMissions.some((mission) => mission.id === prev)) return prev;
      return missionToSelect;
    });
    setSelectedQuoteId((prev) => {
      if (prev && nextQuotes.some((quote) => quote.id === prev)) return prev;
      return quoteToSelect;
    });
  }, [missionId, ownerProfileId]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        await loadData();
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [loadData]);

  const quoteCandidates = useMemo(
    () =>
      quotes.filter(
        (quote) => quote.status !== "canceled" && quote.status !== "rejected",
      ),
    [quotes],
  );

  const receivableAmount = useMemo(
    () => invoices.reduce((sum, invoice) => sum + Number(invoice.balance_amount ?? 0), 0),
    [invoices],
  );

  const openInvoiceCount = useMemo(
    () =>
      invoices.filter(
        (invoice) => invoice.status !== "paid" && invoice.status !== "canceled",
      ).length,
    [invoices],
  );

  const actionPending = (actionKey: string) => busyAction === actionKey;
  const contextLabel = ownerLabel?.trim() || "ce proprietaire";
  const hasContext = Boolean(ownerProfileId || conversationId || missionId);
  const selectedQuote = useMemo(
    () => quotes.find((quote) => quote.id === selectedQuoteId) ?? null,
    [quotes, selectedQuoteId],
  );
  const selectedDraftQuote = useMemo(
    () => (selectedQuote?.status === "draft" ? selectedQuote : null),
    [selectedQuote],
  );

  const quoteProjection = useMemo(() => {
    const commissionAmount = (monthlyRevenueEstimate * commissionRatePct) / 100;
    const actAverage = Math.max(minimumInvoice, hourlyRate * 2 + travelFee);
    const actAmount = actAverage * actServicesEstimate;
    const setupAmount = setupFee * newListingsEstimate;
    const total = round2(commissionAmount + actAmount + setupAmount);

    return {
      commissionAmount: round2(commissionAmount),
      actAmount: round2(actAmount),
      setupAmount: round2(setupAmount),
      total,
    };
  }, [
    monthlyRevenueEstimate,
    commissionRatePct,
    minimumInvoice,
    hourlyRate,
    travelFee,
    actServicesEstimate,
    setupFee,
    newListingsEstimate,
  ]);

  const refreshData = async () => {
    try {
      setBusyAction("refresh");
      setSuccessMsg(null);
      setErrorMsg(null);
      await loadData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur actualisation");
    } finally {
      setBusyAction(null);
    }
  };

  useEffect(() => {
    if (!selectedDraftQuote) {
      setDraftEditor({
        label: "",
        description: "",
        quantity: "1",
        unitPrice: "0",
        notes: "",
      });
      return;
    }

    const firstItem = selectedDraftQuote.quote_items?.[0];
    setDraftEditor({
      label: firstItem?.label ?? `Prestation de conciergerie - ${contextLabel}`,
      description: firstItem?.description ?? "",
      quantity: String(firstItem?.quantity ?? 1),
      unitPrice: String(firstItem?.unit_price ?? round2(Math.max(minimumInvoice, hourlyRate * 2 + travelFee, 0))),
      notes: selectedDraftQuote.notes ?? "",
    });
  }, [contextLabel, hourlyRate, minimumInvoice, selectedDraftQuote, travelFee]);

  const createPrefilledQuote = async () => {
    const missionIdToUse = selectedMissionId || missionId || "";

    try {
      setBusyAction("create-prefilled-quote");
      setSuccessMsg(null);
      setErrorMsg(null);

      let response: Response;
      if (missionIdToUse) {
        response = await fetch("/api/quotes/from-mission", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mission_id: missionIdToUse }),
        });
      } else if (ownerProfileId) {
        const defaultUnitPrice = round2(Math.max(minimumInvoice, hourlyRate * 2 + travelFee, 0));
        response = await fetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owner_profile_id: ownerProfileId,
            mission_id: null,
            status: "draft",
            currency: "EUR",
            notes: `Brouillon CRM pre-rempli pour ${contextLabel}`,
            metadata: {
              source: "crm_prefill",
              owner_label: ownerLabel ?? null,
              conversation_id: conversationId ?? null,
            },
            items: [
              {
                label: `Prestation de conciergerie - ${contextLabel}`,
                description:
                  "Brouillon cree depuis le CRM concierge. Ajustez le perimetre, le prix et les details avant envoi.",
                quantity: 1,
                unit_price: defaultUnitPrice,
                metadata: {
                  source: "crm_prefill",
                },
              },
            ],
          }),
        });
      } else {
        throw new Error("Aucun proprietaire cible pour creer un devis pre-rempli.");
      }

      if (!response.ok) {
        throw new Error(await getResponseError(response, "Impossible de creer le devis pre-rempli"));
      }

      const created = (await response.json().catch(() => null)) as CreatedQuoteResult | null;
      await loadData();

      if (created?.mission_id && created.mission_id !== selectedMissionId) {
        setSelectedMissionId(created.mission_id);
      }
      if (created?.id) {
        setSelectedQuoteId(created.id);
      }

      setSuccessMsg(
        created?.quote_number
          ? `${created.quote_number} cree et preselectionne.`
          : "Devis pre-rempli cree et preselectionne.",
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur creation devis pre-rempli");
    } finally {
      setBusyAction(null);
    }
  };

  const createQuoteFromMission = async () => {
    if (!selectedMissionId) return;

    try {
      setBusyAction("create-quote");
      setSuccessMsg(null);
      setErrorMsg(null);

      const res = await fetch("/api/quotes/from-mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission_id: selectedMissionId }),
      });

      if (!res.ok) {
        throw new Error(await getResponseError(res, "Impossible de creer le devis"));
      }

      const created: QuoteLite | null = await res.json().catch(() => null);
      await loadData();
      if (created?.id) {
        setSelectedQuoteId(created.id);
      }
      setSuccessMsg("Devis cree depuis mission.");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur creation devis");
    } finally {
      setBusyAction(null);
    }
  };

  const createInvoiceFromQuote = async () => {
    if (!selectedQuoteId) return;

    try {
      setBusyAction("create-invoice");
      setSuccessMsg(null);
      setErrorMsg(null);

      const res = await fetch("/api/invoices/from-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote_id: selectedQuoteId }),
      });

      if (!res.ok) {
        throw new Error(await getResponseError(res, "Impossible de creer la facture"));
      }

      await loadData();
      setSuccessMsg("Facture creee depuis devis.");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur creation facture");
    } finally {
      setBusyAction(null);
    }
  };

  const saveDraftQuote = async (): Promise<boolean> => {
    if (!selectedDraftQuote) return false;

    const quantity = Number(draftEditor.quantity || 0);
    const unitPrice = Number(draftEditor.unitPrice || 0);
    if (!draftEditor.label.trim()) {
      setErrorMsg("Le libelle du devis est requis.");
      return false;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setErrorMsg("La quantite doit etre superieure a 0.");
      return false;
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      setErrorMsg("Le prix unitaire doit etre valide.");
      return false;
    }

    try {
      setBusyAction("save-draft-quote");
      setSuccessMsg(null);
      setErrorMsg(null);

      const res = await fetch(`/api/quotes/${selectedDraftQuote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: selectedDraftQuote.currency ?? "EUR",
          notes: draftEditor.notes.trim() || null,
          items: [
            {
              label: draftEditor.label.trim(),
              description: draftEditor.description.trim() || null,
              quantity,
              unit_price: unitPrice,
              sort_order: 0,
              metadata: {
                source: "billing_desk_editor",
              },
            },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error(await getResponseError(res, "Impossible d'enregistrer le brouillon"));
      }

      const updated = (await res.json().catch(() => null)) as QuoteLite | null;
      await loadData();
      if (updated?.id) {
        setSelectedQuoteId(updated.id);
      }
      setSuccessMsg("Brouillon enregistre.");
      return true;
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur enregistrement brouillon");
      return false;
    } finally {
      setBusyAction(null);
    }
  };

  const saveAndSendDraftQuote = async () => {
    if (!selectedDraftQuote) return;
    const saved = await saveDraftQuote();
    if (!saved) return;
    await updateQuoteStatus(selectedDraftQuote.id, "sent");
  };

  const updateQuoteStatus = async (quoteId: string, status: QuoteStatus) => {
    try {
      setBusyAction(`quote-${quoteId}-${status}`);
      setSuccessMsg(null);
      setErrorMsg(null);

      const res = await fetch(`/api/quotes/${quoteId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error(await getResponseError(res, "Impossible de changer le statut devis"));
      }

      await loadData();
      setSuccessMsg("Statut devis mis a jour.");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur mise a jour devis");
    } finally {
      setBusyAction(null);
    }
  };

  const updateInvoiceStatus = async (
    invoice: InvoiceLite,
    status: InvoiceStatus,
    paidAmount?: number,
  ) => {
    try {
      setBusyAction(`invoice-${invoice.id}-${status}`);
      setSuccessMsg(null);
      setErrorMsg(null);

      const payload: { status: InvoiceStatus; paid_amount?: number } = { status };
      if (paidAmount !== undefined) {
        payload.paid_amount = paidAmount;
      }

      const res = await fetch(`/api/invoices/${invoice.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(await getResponseError(res, "Impossible de changer le statut facture"));
      }

      await loadData();
      setSuccessMsg("Statut facture mis a jour.");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur mise a jour facture");
    } finally {
      setBusyAction(null);
    }
  };

  const openQuoteDocument = (quoteId: string) => {
    window.open(`/api/quotes/${quoteId}/document?print=1`, "_blank", "noopener,noreferrer");
  };

  const openInvoiceDocument = (invoiceId: string) => {
    window.open(
      `/api/invoices/${invoiceId}/document?print=1`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  if (loading) {
    return <p className={styles.placeholder}>Chargement des données devis et factures...</p>;
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerIntro}>
          <h4 className={styles.headerTitle}>Production devis et factures</h4>
          <p className={styles.lead}>
            Transformez rapidement les missions en devis puis en factures, avec
            suivi des statuts et des montants restants.
          </p>
          <p className={styles.lead}>
            Base active: {hourlyRate} EUR/h - D&eacute;placement: {travelFee} EUR - Minimum:{" "}
            {minimumInvoice} EUR - Majorations: U {urgentPercent}% / N {nightPercent}% / WE{" "}
            {weekendPercent}% / HS {highSeasonPercent}%
          </p>
        </div>
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={refreshData}
          disabled={actionPending("refresh")}
        >
          <FiRefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {hasContext && (
        <div className={styles.contextCard}>
          <div className={styles.contextIntro}>
            <span className={styles.contextEyebrow}>Contexte CRM</span>
            <strong className={styles.contextTitle}>{contextLabel}</strong>
            <p className={styles.contextText}>
              Les missions, devis et factures sont filtres sur ce proprietaire pour preparer un
              devis plus vite.
            </p>
          </div>
          <div className={styles.contextFacts}>
            {ownerProfileId && <span>Proprietaire cible</span>}
            {missionId && <span>Mission preselectionnee</span>}
            {conversationId && (
              <Link href={`/dashboard/concierge/messages?conversation=${encodeURIComponent(conversationId)}`}>
                Ouvrir la conversation
              </Link>
            )}
            <button
              type="button"
              className={styles.contextAction}
              onClick={createPrefilledQuote}
              disabled={!ownerProfileId || actionPending("create-prefilled-quote")}
            >
              {actionPending("create-prefilled-quote")
                ? "Creation du devis..."
                : "Creer un devis pre-rempli"}
            </button>
          </div>
        </div>
      )}

      <div className={styles.projectionCard}>
        <h4>Simulation devis live (3 piliers)</h4>
        <div className={styles.projectionInputs}>
          <label>
            <span>Revenus locatifs mensuels (EUR)</span>
            <input
              type="number"
              min={0}
              step={100}
              value={monthlyRevenueEstimate}
              onChange={(e) => setMonthlyRevenueEstimate(Math.max(0, Number(e.target.value || 0)))}
            />
          </label>
          <label>
            <span>Nouveaux logements / mois</span>
            <input
              type="number"
              min={0}
              step={1}
              value={newListingsEstimate}
              onChange={(e) => setNewListingsEstimate(Math.max(0, Number(e.target.value || 0)))}
            />
          </label>
          <label>
            <span>Services &agrave; l&apos;acte / mois</span>
            <input
              type="number"
              min={0}
              step={1}
              value={actServicesEstimate}
              onChange={(e) => setActServicesEstimate(Math.max(0, Number(e.target.value || 0)))}
            />
          </label>
        </div>
        <div className={styles.projectionMetrics}>
          <span>
            Commission ({commissionRatePct}%):{" "}
            <strong>{formatCurrency(quoteProjection.commissionAmount, "EUR")}</strong>
          </span>
          <span>
            Set-up ({newListingsEstimate}):{" "}
            <strong>{formatCurrency(quoteProjection.setupAmount, "EUR")}</strong>
          </span>
          <span>
            Actes ({actServicesEstimate}):{" "}
            <strong>{formatCurrency(quoteProjection.actAmount, "EUR")}</strong>
          </span>
          <span className={styles.projectionTotal}>
            Total estime: <strong>{formatCurrency(quoteProjection.total, "EUR")}</strong>
          </span>
        </div>
      </div>

      {errorMsg && <p className={styles.errorBox}>{errorMsg}</p>}
      {successMsg && <p className={styles.successBox}>{successMsg}</p>}

      <div className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Devis</span>
          <strong className={styles.kpiValue}>{quotes.length}</strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Devis envoyes</span>
          <strong className={styles.kpiValue}>
            {quotes.filter((quote) => quote.status === "sent").length}
          </strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Factures ouvertes</span>
          <strong className={styles.kpiValue}>{openInvoiceCount}</strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Encaissement restant</span>
          <strong className={styles.kpiValue}>{formatCurrency(receivableAmount, "EUR")}</strong>
        </article>
      </div>

      <div className={styles.actionGrid}>
        <article className={styles.actionCard}>
          <h4>
            <FiFileText size={14} />
            Creer un devis depuis mission
          </h4>
          {ownerProfileId && (
            <p className={styles.contextHint}>
              Suggestions limitees aux missions rattachees a {contextLabel}.
            </p>
          )}
          <select
            value={selectedMissionId}
            onChange={(event) => setSelectedMissionId(event.target.value)}
            className={styles.select}
          >
            {missions.length === 0 && <option value="">Aucune mission disponible</option>}
            {missions.map((mission) => (
              <option key={mission.id} value={mission.id}>
                {mission.title} - {mission.status}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={createQuoteFromMission}
            disabled={!selectedMissionId || actionPending("create-quote")}
          >
            {actionPending("create-quote") ? "Cr&eacute;ation..." : "G&eacute;n&eacute;rer devis"}
          </button>
        </article>

        <article className={styles.actionCard}>
          <h4>
            <FiDollarSign size={14} />
            Creer une facture depuis devis
          </h4>
          {ownerProfileId && (
            <p className={styles.contextHint}>
              Les devis visibles ici correspondent deja a {contextLabel}.
            </p>
          )}
          <select
            value={selectedQuoteId}
            onChange={(event) => setSelectedQuoteId(event.target.value)}
            className={styles.select}
          >
            {quoteCandidates.length === 0 && <option value="">Aucun devis disponible</option>}
            {quoteCandidates.map((quote) => (
              <option key={quote.id} value={quote.id}>
                {quote.quote_number} - {QUOTE_STATUS_LABEL[quote.status] ?? quote.status}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={createInvoiceFromQuote}
            disabled={!selectedQuoteId || actionPending("create-invoice")}
          >
            {actionPending("create-invoice") ? "Cr&eacute;ation..." : "G&eacute;n&eacute;rer facture"}
          </button>
        </article>
      </div>

      {selectedDraftQuote && (
        <section className={styles.editorCard}>
          <div className={styles.editorHeader}>
            <div>
              <h4 className={styles.listTitle}>Brouillon rapide</h4>
              <p className={styles.contextText}>
                Ajustez le devis {selectedDraftQuote.quote_number} puis enregistrez ou envoyez-le
                directement.
              </p>
            </div>
            <div className={styles.editorActions}>
              <button
                type="button"
                className={styles.smallBtnGhost}
                onClick={saveDraftQuote}
                disabled={actionPending("save-draft-quote")}
              >
                {actionPending("save-draft-quote") ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={saveAndSendDraftQuote}
                disabled={actionPending("save-draft-quote") || actionPending(`quote-${selectedDraftQuote.id}-sent`)}
              >
                {actionPending(`quote-${selectedDraftQuote.id}-sent`) ? "Envoi..." : "Enregistrer et envoyer"}
              </button>
            </div>
          </div>
          <div className={styles.editorGrid}>
            <label>
              <span>Libelle</span>
              <input
                type="text"
                value={draftEditor.label}
                onChange={(event) =>
                  setDraftEditor((prev) => ({ ...prev, label: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Quantite</span>
              <input
                type="number"
                min={1}
                step={1}
                value={draftEditor.quantity}
                onChange={(event) =>
                  setDraftEditor((prev) => ({ ...prev, quantity: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Prix unitaire (EUR)</span>
              <input
                type="number"
                min={0}
                step={1}
                value={draftEditor.unitPrice}
                onChange={(event) =>
                  setDraftEditor((prev) => ({ ...prev, unitPrice: event.target.value }))
                }
              />
            </label>
            <label className={styles.editorWide}>
              <span>Description</span>
              <textarea
                rows={3}
                value={draftEditor.description}
                onChange={(event) =>
                  setDraftEditor((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </label>
            <label className={styles.editorWide}>
              <span>Notes internes / client</span>
              <textarea
                rows={3}
                value={draftEditor.notes}
                onChange={(event) =>
                  setDraftEditor((prev) => ({ ...prev, notes: event.target.value }))
                }
              />
            </label>
          </div>
          <div className={styles.editorSummary}>
            Total brouillon:{" "}
            <strong>
              {formatCurrency(
                round2(Number(draftEditor.quantity || 0) * Number(draftEditor.unitPrice || 0)),
                selectedDraftQuote.currency ?? "EUR",
              )}
            </strong>
          </div>
        </section>
      )}

      <div className={styles.listGrid}>
        <section className={styles.listCard}>
          <h4 className={styles.listTitle}>Derniers devis</h4>
          {quotes.length === 0 ? (
            <p className={styles.placeholder}>Aucun devis genere.</p>
          ) : (
            <div className={styles.rows}>
              {quotes.slice(0, 8).map((quote) => (
                <article key={quote.id} className={styles.row}>
                  <div className={styles.rowHead}>
                    <strong>{quote.quote_number}</strong>
                    <span
                      className={`${styles.statusBadge} ${styles[`statusQuote${quote.status}`] ?? ""}`}
                    >
                      {QUOTE_STATUS_LABEL[quote.status] ?? quote.status}
                    </span>
                  </div>
                  <div className={styles.rowMeta}>
                    <span>{formatDate(quote.created_at)}</span>
                    <span>{formatCurrency(Number(quote.total_amount ?? 0), quote.currency)}</span>
                  </div>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.smallBtnGhost}
                        onClick={() => openQuoteDocument(quote.id)}
                      >
                        PDF
                      </button>
                      {quote.status === "draft" && (
                        <button
                          type="button"
                          className={styles.smallBtn}
                        onClick={() => updateQuoteStatus(quote.id, "sent")}
                        disabled={actionPending(`quote-${quote.id}-sent`)}
                      >
                        <FiSend size={12} />
                        Envoyer
                      </button>
                    )}
                    {quote.status === "sent" && (
                      <button
                        type="button"
                        className={styles.smallBtn}
                        onClick={() => updateQuoteStatus(quote.id, "accepted")}
                        disabled={actionPending(`quote-${quote.id}-accepted`)}
                      >
                        <FiCheckCircle size={12} />
                        Accepter
                      </button>
                    )}
                    {(quote.status === "draft" || quote.status === "sent") && (
                      <button
                        type="button"
                        className={styles.smallBtnGhost}
                        onClick={() => updateQuoteStatus(quote.id, "canceled")}
                        disabled={actionPending(`quote-${quote.id}-canceled`)}
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={styles.listCard}>
          <h4 className={styles.listTitle}>Dernieres factures</h4>
          {invoices.length === 0 ? (
            <p className={styles.placeholder}>Aucune facture generee.</p>
          ) : (
            <div className={styles.rows}>
              {invoices.slice(0, 8).map((invoice) => (
                <article key={invoice.id} className={styles.row}>
                  <div className={styles.rowHead}>
                    <strong>{invoice.invoice_number}</strong>
                    <span
                      className={`${styles.statusBadge} ${styles[`statusInvoice${invoice.status}`] ?? ""}`}
                    >
                      {INVOICE_STATUS_LABEL[invoice.status] ?? invoice.status}
                    </span>
                  </div>
                  <div className={styles.rowMeta}>
                    <span>
                      <FiClock size={12} />
                      Echeance: {formatDate(invoice.due_date)}
                    </span>
                    <span>{formatCurrency(Number(invoice.total_amount ?? 0), invoice.currency)}</span>
                  </div>
                  <div className={styles.rowMetaSecondary}>
                    Reste: {formatCurrency(Number(invoice.balance_amount ?? 0), invoice.currency)}
                  </div>
                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.smallBtnGhost}
                      onClick={() => openInvoiceDocument(invoice.id)}
                    >
                      PDF
                    </button>
                    {invoice.status === "draft" && (
                      <button
                        type="button"
                        className={styles.smallBtn}
                        onClick={() => updateInvoiceStatus(invoice, "issued")}
                        disabled={actionPending(`invoice-${invoice.id}-issued`)}
                      >
                        Emettre
                      </button>
                    )}
                    {(invoice.status === "issued" || invoice.status === "overdue") && (
                      <button
                        type="button"
                        className={styles.smallBtn}
                        onClick={() =>
                          updateInvoiceStatus(
                            invoice,
                            "partially_paid",
                            round2(Number(invoice.total_amount ?? 0) / 2),
                          )
                        }
                        disabled={actionPending(`invoice-${invoice.id}-partially_paid`)}
                      >
                        Paiement partiel
                      </button>
                    )}
                    {(invoice.status === "issued" ||
                      invoice.status === "partially_paid" ||
                      invoice.status === "overdue") && (
                      <button
                        type="button"
                        className={styles.smallBtn}
                        onClick={() =>
                          updateInvoiceStatus(
                            invoice,
                            "paid",
                            round2(Number(invoice.total_amount ?? 0)),
                          )
                        }
                        disabled={actionPending(`invoice-${invoice.id}-paid`)}
                      >
                        Marquer payee
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TariffBillingDesk;


