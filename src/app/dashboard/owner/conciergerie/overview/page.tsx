"use client";

import { useEffect, useMemo, useState } from "react";
import { CompletionStatusCard } from "@/components/dashboard";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { buildOwnerConciergeCompletion, fetchJsonOrFallback } from "@/app/dashboard/shared";
import { useOwnerDashboardData } from "../../useOwnerDashboardData";
import CategoryOverviewPage from "@/app/dashboard/_components/CategoryOverviewPage";

export default function OwnerConciergeOverviewPage() {
  const { isAuthenticated } = useCurrentUser();
  const { conversations } = useOwnerDashboardData(isAuthenticated);
  const [requestsCount, setRequestsCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadRequests() {
      const payload = await fetchJsonOrFallback<{ items?: Array<Record<string, unknown>> }>(
        "/api/service-requests?limit=20",
        { items: [] },
      );
      if (!cancelled) {
        setRequestsCount(Array.isArray(payload.items) ? payload.items.length : 0);
      }
    }
    void loadRequests();
    return () => {
      cancelled = true;
    };
  }, []);

  const completion = useMemo(
    () => buildOwnerConciergeCompletion({ requestsCount, conversations: conversations as Record<string, unknown>[] }),
    [conversations, requestsCount],
  );

  return (
    <CategoryOverviewPage
      tone="owner"
      eyebrow="Réseau conciergerie"
      title="Vue d'ensemble de la conciergerie"
      description="Centralisez vos demandes envoyées, vos contacts concierge et le suivi relationnel avant d'entrer dans le détail."
      chips={["Vue synthèse", "Demandes", "Contacts & messages"]}
      actions={[
        { label: "Voir le suivi concierge", href: "/dashboard/owner/conciergerie", variant: "primary" },
        { label: "Trouver un concierge", href: "/dashboard/owner/concierges", variant: "secondary" },
      ]}
      metrics={[
        { label: "Demandes", value: String(requestsCount), hint: "Demandes envoyées" },
        { label: "Conversations", value: String(conversations.length), hint: "Contacts concierge actifs" },
        { label: "Complétion", value: `${completion.percentage}%`, hint: `${completion.completedCount}/${completion.totalCount} repères validés` },
      ]}
      cards={[
        { title: "Suivi concierge", text: "Gardez les demandes et retours des concierges visibles depuis une vue unique.", actions: [{ label: "Ouvrir le suivi", href: "/dashboard/owner/conciergerie", variant: "primary" }] },
        { title: "Trouver un concierge", text: "Explorez de nouveaux profils lorsque vous avez besoin d'un nouveau relais terrain.", actions: [{ label: "Explorer", href: "/dashboard/owner/concierges", variant: "secondary" }] },
        { title: "Contacts concierge", text: "Reprenez les échanges et validez les prochaines étapes depuis vos conversations.", actions: [{ label: "Ouvrir les contacts", href: "/dashboard/owner/contacts", variant: "secondary" }] },
      ]}
    >
      <CompletionStatusCard
        title="Conciergerie"
        description="Complétez cette catégorie pour structurer vos demandes et votre relation avec les concierges."
        percentage={completion.percentage}
        completedCount={completion.completedCount}
        totalCount={completion.totalCount}
        missingItems={completion.missingItems}
        actionLabel="Voir le suivi concierge"
        actionHref="/dashboard/owner/conciergerie"
      />
    </CategoryOverviewPage>
  );
}
