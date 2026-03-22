import React from "react";
import styles from "./OffersShared.module.scss";

interface OfferInfoCardProps {
  title: string;
  tone?: "default" | "danger";
  children: React.ReactNode;
}

export default function OfferInfoCard({
  title,
  tone = "default",
  children,
}: OfferInfoCardProps) {
  return (
    <article
      className={`${styles.infoCard} ${tone === "danger" ? styles.infoCardDanger : ""}`}
    >
      <strong className={styles.infoCardTitle}>{title}</strong>
      <div className={styles.infoCardBody}>{children}</div>
    </article>
  );
}
