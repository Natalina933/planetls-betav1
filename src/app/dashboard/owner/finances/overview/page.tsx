"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { buildOwnerFinancesCompletion } from "@/app/dashboard/shared";
import { useOwnerDashboardData } from "../../useOwnerDashboardData";
import OwnerPerformancePage from "./OwnerPerformancePage";
import type { PerformanceReservation } from "./performanceData";

export default function OwnerFinancesOverviewPage() {
  const { isAuthenticated } = useCurrentUser();
  const data = useOwnerDashboardData(isAuthenticated);
  const [reservations, setReservations] = useState<PerformanceReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    async function loadReservations() {
      try {
        const response = await fetch("/api/owner/reservations", { cache: "no-store", signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error("Impossible de charger vos séjours. Réessayez dans un instant.");
        if (!controller.signal.aborted) setReservations(Array.isArray(payload.reservations) ? payload.reservations : []);
      } catch {
        if (!controller.signal.aborted) setError("Impossible de charger vos séjours. Réessayez dans un instant.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadReservations();
    return () => controller.abort();
  }, [isAuthenticated]);

  const completion = buildOwnerFinancesCompletion({
    quotes: data.quotes as Record<string, unknown>[],
    invoices: data.invoices as Record<string, unknown>[],
  });

  return <OwnerPerformancePage properties={data.properties} reservations={reservations}
    quotesCount={data.quotes.length} invoicesCount={data.invoices.length} completion={completion}
    loading={loading || data.loading} error={error || data.error} onRetry={() => window.location.reload()} />;
}
