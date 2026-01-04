"use client";

import { useState } from "react";
import StatusBadge from "@/app/components/status/StatusBadge/StatusBadge";
import StatusSelector from "@/app/components/status/StatusSelector/StatusSelector";
import type { UserStatus } from "@/app/components/status/userStatusTypes";
import styles from "./StatusTestPage.module.scss";
import AvatarWithStatus from '@/app/components/status/AvatarWithStatus/AvatarWithStatus';

export default function StatusTestPage() {
  const [status, setStatus] = useState<UserStatus>("active");

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Test des statuts utilisateur</h1>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Statut sélectionné</h2>
        <StatusBadge status={status} size="lg" />
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Changer de statut</h2>
        <StatusSelector defaultStatus={status} onChange={setStatus} />
      </section>
<section className={styles.section}>
  <h2 className={styles.subtitle}>Avatar avec statut</h2>

  <div className={styles.avatarRow}>
    <AvatarWithStatus status={status} size={72} />
  </div>
</section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Aperçu de tous les statuts</h2>
        <div className={styles.previewRow}>
          <StatusBadge status="active" />
          <StatusBadge status="busy" />
          <StatusBadge status="away" />
          <StatusBadge status="vacation" />
          <StatusBadge status="offline" />
        </div>
      </section>
      <section className={styles.section}>
  <h2 className={styles.subtitle}>Explication des statuts</h2>

  <div className={styles.statusExplanation}>
    <div className={styles.item}>
      <StatusBadge status="active" />
      <p>Disponible et présent. Répond rapidement.</p>
    </div>

    <div className={styles.item}>
      <StatusBadge status="busy" />
      <p>En intervention (check-in, ménage, maintenance…). Réponse plus lente.</p>
    </div>

    <div className={styles.item}>
      <StatusBadge status="away" />
      <p>Indisponible temporairement. Réponse différée.</p>
    </div>

    <div className={styles.item}>
      <StatusBadge status="vacation" />
      <p>En vacances ou en pause prolongée. Indisponible plusieurs jours.</p>
    </div>

    <div className={styles.item}>
      <StatusBadge status="offline" />
      <p>Déconnecté de la plateforme. Statut automatique.</p>
    </div>
  </div>
</section>

    </div>
  );
}
