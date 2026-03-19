"use client";

import { useEffect, useMemo, useState } from "react";
import SimpleOverviewWorkspace from "@/app/dashboard/_components/SimpleOverviewWorkspace";
import { buildProviderClientsCompletion } from "@/app/dashboard/shared";

type ConciergeOwnerOverviewPayload = {
  summary?: {
    total_clients?: number;
    active_clients?: number;
    attached_owners?: number;
    prospects?: number;
    active_missions?: number;
    unread_notifications?: number;
  };
  items?: Array<Record<string, unknown>>;
  note?: string | null;
};

export default function ConciergeOwnersOverviewPage() {
  const [payload, setPayload] = useState<ConciergeOwnerOverviewPayload>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/concierge/owners", { cache: "no-store" });
        const nextPayload = (await response.json()) as ConciergeOwnerOverviewPayload;

        if (!response.ok) {
          throw new Error(nextPayload?.note || "Impossible de charger la vue proprietaires.");
        }

        setPayload(nextPayload);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Impossible de charger la vue proprietaires.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  const items = useMemo(() => (Array.isArray(payload.items) ? payload.items : []), [payload.items]);
  const summary = payload.summary ?? {};
  const completion = useMemo(
    () =>
      buildProviderClientsCompletion({
        clients: items,
        conversations: items.filter((item) => Boolean(item.conversation_id)),
      }),
    [items],
  );

  return (
    <SimpleOverviewWorkspace
      tone="concierge"
      eyebrow="Relations proprietaires"
      title="Vue d'ensemble des proprietaires"
      description={
        loading
          ? "Chargement de vos relations proprietaires..."
          : error ||
            payload.note ||
            "Cette vue rassemble les proprietaires rattaches a votre espace, vos prospects encore en conversation et le volume de missions deja converties."
      }
      chips={[
        `${summary.total_clients ?? items.length} relation(s)`,
        `${summary.active_clients ?? 0} active(s)`,
        `${summary.prospects ?? 0} prospect(s)`,
      ]}
      actions={[
        { label: "Voir les relations actives", href: "/dashboard/concierge/contacts", variant: "primary" },
        { label: "Ouvrir le pipeline", href: "/dashboard/concierge/recherche", variant: "secondary" },
      ]}
      completion={{
        title: "Proprietaires",
        description:
          "Structurez votre pipe commercial et votre portefeuille proprietaires a partir des clients crees automatiquement apres acceptation d'un devis.",
        percentage: completion.percentage,
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
        missingItems: completion.missingItems,
        actionLabel: "Voir les relations actives",
        actionHref: "/dashboard/concierge/contacts",
      }}
    />
  );
}
