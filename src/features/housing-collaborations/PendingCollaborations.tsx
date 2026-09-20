"use client";

import { useEffect, useState } from "react";
import { Section } from "@/components/ui/Section";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui";
import { PENDING_COLLABORATION_LABEL, type PendingHousingCollaboration } from "./types";

export function PendingCollaborations({ refreshKey }: { refreshKey?: unknown }) {
  const [items, setItems] = useState<PendingHousingCollaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch("/api/housing-collaborations", { cache: "no-store", signal: controller.signal });
        const payload = await response.json();
        if (!response.ok || !Array.isArray(payload.items)) throw new Error("Collaboration unavailable");
        if (!controller.signal.aborted) setItems(payload.items);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [refreshKey, attempt]);

  return (
    <Section tone="outlined" aria-label="Collaborations en attente" aria-busy={loading}>
      <CardHeader variant="plain"><h2>Collaborations en attente</h2></CardHeader>
      {loading ? <p role="status">Chargement des collaborations…</p> : error ? (
        <div role="alert">
          <p>Impossible de charger les collaborations.</p>
          <Button onClick={() => setAttempt(value => value + 1)}>Réessayer</Button>
        </div>
      ) : items.length === 0 ? (
        <p>Aucune collaboration en attente de contractualisation à afficher.</p>
      ) : items.map(item => (
        <Card key={item.id} tone="outlined">
          <CardHeader variant="plain"><h3>{item.housing.name}</h3><p>{PENDING_COLLABORATION_LABEL}</p></CardHeader>
          <CardBody>
            <p>Propriétaire : {item.owner.name} · Concierge : {item.concierge.name}</p>
            <p>Devis accepté : {item.quote.number || item.quote.id}</p>
            <p>Demande d’origine : {item.request?.title || "Non renseignée"}</p>
          </CardBody>
        </Card>
      ))}
    </Section>
  );
}
