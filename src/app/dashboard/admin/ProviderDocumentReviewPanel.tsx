"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./ProviderDocumentReviewPanel.module.scss";

type ProviderDocument = {
  id: string;
  document_type: string;
  label: string;
  verification_status: "pending" | "verified" | "rejected";
  rejection_reason: string | null;
  expires_at: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  insurance: "Assurance",
  certification: "Certification",
  identity: "Identité",
  company: "Entreprise",
  portfolio: "Portfolio",
  other: "Autre",
};

export function ProviderDocumentReviewPanel({ providerId }: { providerId: string }) {
  const [items, setItems] = useState<ProviderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    const response = await fetch(`/api/provider/profile-documents?providerId=${encodeURIComponent(providerId)}`, { cache: "no-store", signal });
    if (!response.ok) throw new Error("Chargement des justificatifs impossible.");
    const payload = (await response.json()) as { items?: ProviderDocument[] };
    setItems(payload.items ?? []);
    setLoading(false);
  }, [providerId]);

  useEffect(() => {
    const controller = new AbortController();
    setMessage(null);
    void load(controller.signal).catch((error) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setLoading(false);
      setMessage(error instanceof Error ? error.message : "Erreur de chargement.");
    });
    return () => controller.abort();
  }, [load]);

  async function decide(item: ProviderDocument, status: "verified" | "rejected") {
    setActionId(item.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/provider/profile-documents/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason: rejectionReasons[item.id] ?? "" }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Décision impossible.");
      await load();
      setMessage(status === "verified" ? "Justificatif vérifié." : "Justificatif rejeté.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Décision impossible.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="provider-document-review-title">
      <div className={styles.header}>
        <div>
          <h4 id="provider-document-review-title">Justificatifs professionnels</h4>
          <p>Les fichiers restent privés ; seule la décision de vérification devient un signal public.</p>
        </div>
        <strong>{items.length} document(s)</strong>
      </div>
      {message ? <p className={styles.message} role="status">{message}</p> : null}
      {loading ? <p>Chargement des justificatifs…</p> : null}
      {!loading && items.length === 0 ? <p>Aucun justificatif transmis.</p> : null}
      <div className={styles.list}>
        {items.map((item) => (
          <article key={item.id} className={styles.item}>
            <div className={styles.itemHeader}>
              <div><strong>{item.label}</strong><p>{TYPE_LABELS[item.document_type] ?? item.document_type}{item.expires_at ? ` · expire le ${item.expires_at}` : ""}</p></div>
              <span className={styles.status} data-status={item.verification_status}>{item.verification_status}</span>
            </div>
            {item.verification_status === "rejected" && item.rejection_reason ? <p>Motif : {item.rejection_reason}</p> : null}
            <label className={styles.reason}>
              <span>Motif obligatoire en cas de rejet</span>
              <textarea value={rejectionReasons[item.id] ?? ""} onChange={(event) => setRejectionReasons((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={500} />
            </label>
            <div className={styles.actions}>
              <a href={`/api/provider/profile-documents/${item.id}/download`} target="_blank" rel="noreferrer">Consulter le fichier privé</a>
              <button type="button" disabled={actionId !== null} onClick={() => void decide(item, "verified")}>Vérifier</button>
              <button type="button" disabled={actionId !== null} onClick={() => void decide(item, "rejected")}>Rejeter</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
