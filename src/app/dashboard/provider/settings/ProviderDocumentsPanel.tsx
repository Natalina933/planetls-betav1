"use client";

import { FormEvent, useEffect, useState } from "react";
import styles from "./ProviderDocumentsPanel.module.scss";

type ProviderDocument = {
  id: string;
  document_type: string;
  label: string;
  mime_type: string;
  file_size_bytes: number;
  verification_status: "pending" | "verified" | "rejected";
  rejection_reason: string | null;
  created_at: string;
};

const TYPE_LABELS: Record<string, string> = {
  insurance: "Assurance RC Pro",
  certification: "Certification / habilitation",
  identity: "Identité",
  company: "Entreprise / Kbis",
  portfolio: "Portfolio",
  other: "Autre justificatif",
};

const STATUS_LABELS = {
  pending: "En attente de vérification",
  verified: "Vérifié",
  rejected: "Refusé",
} as const;

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} Mo` : `${Math.ceil(bytes / 1024)} Ko`;
}

export function ProviderDocumentsPanel() {
  const [items, setItems] = useState<ProviderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadDocuments() {
      try {
        const response = await fetch("/api/provider/profile-documents", { cache: "no-store", signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Chargement impossible.");
        setItems(Array.isArray(payload?.items) ? payload.items : []);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Chargement impossible.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadDocuments();
    return () => controller.abort();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/provider/profile-documents", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Téléversement impossible.");
      setItems((current) => [payload as ProviderDocument, ...current]);
      form.reset();
      setSuccess("Justificatif envoyé. Il reste privé jusqu'à sa vérification.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Téléversement impossible.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="provider-documents-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Confiance professionnelle</p>
          <h2 id="provider-documents-title">Justificatifs privés</h2>
          <p>Ajoutez vos preuves. Elles ne deviennent jamais publiques automatiquement.</p>
        </div>
        <span className={styles.counter}>{items.length} document{items.length > 1 ? "s" : ""}</span>
      </header>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {success ? <p className={styles.success} role="status">{success}</p> : null}

      <form className={styles.form} onSubmit={handleSubmit}>
        <label>Type
          <select name="documentType" required defaultValue="insurance">
            {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>Nom du document
          <input name="label" maxLength={200} placeholder="Ex. RC Pro 2026" />
        </label>
        <label className={styles.fileField}>Fichier PDF ou image, 10 Mo maximum
          <input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required />
        </label>
        <button type="submit" disabled={uploading}>{uploading ? "Envoi…" : "Ajouter le justificatif"}</button>
      </form>

      <div className={styles.list} aria-live="polite">
        {loading ? <p>Chargement des justificatifs…</p> : null}
        {!loading && items.length === 0 ? <p className={styles.empty}>Aucun justificatif ajouté.</p> : null}
        {items.map((item) => (
          <article className={styles.document} key={item.id}>
            <div>
              <strong>{item.label}</strong>
              <p>{TYPE_LABELS[item.document_type] ?? "Justificatif"} · {formatSize(item.file_size_bytes)}</p>
              {item.verification_status === "rejected" && item.rejection_reason ? <p className={styles.reason}>{item.rejection_reason}</p> : null}
            </div>
            <div className={styles.actions}>
              <span data-status={item.verification_status}>{STATUS_LABELS[item.verification_status]}</span>
              <a href={`/api/provider/profile-documents/${item.id}/download`} target="_blank" rel="noreferrer">Télécharger</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}