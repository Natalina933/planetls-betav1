"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./LogementWorkspace.module.scss";
import LogementCreateManual from "./LogementCreateManual";
import LogementFromQuoteFlow from "./LogementFromQuoteFlow";

type Mode = "manual" | "quote";

export default function LogementCreateModal() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("manual");

  function handleCreated(housingId?: number) {
    if (typeof housingId === "number") {
      router.push(`/dashboard/concierge/logements/${housingId}`);
      router.refresh();
      return;
    }
    router.push("/dashboard/concierge/logements");
    router.refresh();
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <p className={styles.eyebrow}>Logements Concierge</p>
            <h1 className={styles.title}>Nouveau logement, sans friction</h1>
            <p className={styles.muted}>
              Deux flux distincts pour couvrir la creation guidee complete et la creation automatique
              apres devis accepte, sans separer le proprietaire du logement.
            </p>
          </div>
        </div>
        <div className={styles.tabList}>
          <button
            type="button"
            className={`${styles.tabButton} ${mode === "manual" ? styles.tabButtonActive : ""}`}
            onClick={() => setMode("manual")}
          >
            Flux manuel
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${mode === "quote" ? styles.tabButtonActive : ""}`}
            onClick={() => setMode("quote")}
          >
            Flux auto devis
          </button>
        </div>
      </section>

      {mode === "manual" ? <LogementCreateManual onCreated={handleCreated} /> : null}
      {mode === "quote" ? <LogementFromQuoteFlow onCreated={handleCreated} /> : null}
    </div>
  );
}
