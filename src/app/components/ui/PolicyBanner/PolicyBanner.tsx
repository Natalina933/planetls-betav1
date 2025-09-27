// app/components/ui/PolicyBanner.tsx
import React from "react";
import styles from "./PolicyBanner.module.scss";

export default function PolicyBanner() {
  return (
    <div className={styles.banner}>
      <span>En poursuivant, vous acceptez notre <a href="/privacy" target="_blank" rel="noopener noreferrer">politique de confidentialité</a> et le traitement sécurisé des données.</span>
    </div>
  );
}
