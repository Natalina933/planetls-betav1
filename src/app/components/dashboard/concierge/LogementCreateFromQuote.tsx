"use client";

import styles from "./LogementWorkspace.module.scss";
import type { QuotePreview } from "@/types/housing";

type Props = {
  preview: QuotePreview | null;
  loading: boolean;
  error: string;
  onCreate: () => void;
  creating: boolean;
};

export default function LogementCreateFromQuote({
  preview,
  loading,
  error,
  onCreate,
  creating,
}: Props) {
  if (loading) {
    return <section className={styles.panel}><p className={styles.muted}>Chargement du devis source...</p></section>;
  }

  if (error) {
    return <section className={styles.panel}><p className={styles.messageError}>{error}</p></section>;
  }

  if (!preview) {
    return (
      <section className={styles.emptyState}>
        <h3 className={styles.cardTitle}>Aucun devis chargé</h3>
        <p className={styles.muted}>
          Renseignez un devis accepté pour pré-remplir automatiquement le propriétaire, l'adresse,
          les services et les tarifs du logement.
        </p>
      </section>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Flux Auto</p>
            <h3 className={styles.cardTitle}>{preview.housingName}</h3>
          </div>
          <span className={styles.statusPill}>Actif - suivi en cours</span>
        </div>
        <p className={styles.muted}>
          Le logement sera créé automatiquement avec le propriétaire demandeur du devis, l'adresse
          du devis et la liste de services associés.
        </p>
      </section>

      <section className={styles.cardGrid}>
        <article className={styles.quoteCard}>
          <span className={styles.statLabel}>Propriétaire</span>
          <strong className={styles.cardTitle}>{preview.owner.fullName || "Propriétaire"}</strong>
          <p className={styles.cardMeta}>{preview.owner.email || "Email non renseigné"}</p>
        </article>
        <article className={styles.quoteCard}>
          <span className={styles.statLabel}>Localisation</span>
          <strong className={styles.cardTitle}>{preview.locationInfo.addressLine1 || "Adresse à confirmer"}</strong>
          <p className={styles.cardMeta}>
            {[preview.locationInfo.postalCode, preview.locationInfo.city].filter(Boolean).join(" ")}
          </p>
        </article>
        <article className={styles.quoteCard}>
          <span className={styles.statLabel}>Tarification</span>
          <strong className={styles.cardTitle}>
            {typeof preview.pricing.totalContractValue === "number"
              ? `${preview.pricing.totalContractValue} ${preview.pricing.currency}`
              : "A confirmer"}
          </strong>
          <p className={styles.cardMeta}>Devis {preview.quoteNumber}</p>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Services</p>
            <h3 className={styles.cardTitle}>Services repris depuis le devis</h3>
          </div>
        </div>
        <div className={styles.cardGrid}>
          {preview.services.items.map((service) => (
            <article key={service.id} className={styles.serviceCard}>
              <strong className={styles.cardTitle}>{service.label}</strong>
              <p className={styles.cardMeta}>
                {service.frequency || "Selon devis"}{typeof service.totalPrice === "number" ? ` | ${service.totalPrice} ${preview.pricing.currency}` : ""}
              </p>
              {service.notes ? <p className={styles.cardMeta}>{service.notes}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel}>
        <button className={styles.actionPrimary} type="button" onClick={onCreate} disabled={creating}>
          {creating ? "Création du logement..." : "Créer ce logement automatiquement"}
        </button>
      </section>
    </div>
  );
}
