"use client";

import { useState } from "react";
import styles from "./LogementWorkspace.module.scss";
import LogementCreateFromQuote from "./LogementCreateFromQuote";
import type { QuotePreview } from "@/types/housing";

type Props = {
  onCreated?: (housingId?: number) => void;
};

export default function LogementFromQuoteFlow({ onCreated }: Props) {
  const [quoteId, setQuoteId] = useState("");
  const [preview, setPreview] = useState<QuotePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadPreview() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const response = await fetch(`/api/profiles/housing/from-quote?quoteId=${encodeURIComponent(quoteId)}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Chargement du devis impossible.");
      }
      setPreview(payload);
    } catch (previewError) {
      setPreview(null);
      setError(previewError instanceof Error ? previewError.message : "Chargement du devis impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function createFromQuote() {
    try {
      setCreating(true);
      setError("");
      setSuccess("");
      const response = await fetch("/api/profiles/housing/from-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Création automatique impossible.");
      }
      setSuccess(payload?.created ? "Logement créé automatiquement depuis le devis." : "Un logement existait déjà pour ce devis.");
      onCreated?.(typeof payload?.housingId === "number" ? payload.housingId : undefined);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Création automatique impossible.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Depuis Devis</p>
            <h2 className={styles.cardTitle}>Création automatique après acceptation</h2>
          </div>
        </div>
        <p className={styles.muted}>
          Saisissez l'identifiant du devis accepté pour vérifier le pré-remplissage avant création
          ou rejouer manuellement un logement déjà éligible.
        </p>
        <div className={styles.row}>
          <input
            className={styles.field}
            value={quoteId}
            onChange={(event) => setQuoteId(event.target.value)}
            placeholder="UUID du devis"
          />
          <button className={styles.actionSecondary} type="button" onClick={loadPreview} disabled={loading || !quoteId.trim()}>
            {loading ? "Chargement..." : "Prévisualiser"}
          </button>
        </div>
        {success ? <p className={styles.messageSuccess}>{success}</p> : null}
      </section>

      <LogementCreateFromQuote
        preview={preview}
        loading={loading}
        error={error}
        onCreate={createFromQuote}
        creating={creating}
      />
    </div>
  );
}
