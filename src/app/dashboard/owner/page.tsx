"use client";

import { useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { DashboardLoadingScreen } from "@/components/dashboard";
import { FirstLoginOnboardingPopup, shouldShowFirstLoginPopup, type OnboardingActionStatus } from "@/features/onboarding-assistant";
import OwnerDashboardView from "@/features/owner-dashboard/OwnerDashboardView";
import { ownerDashboardContent as copy } from "@/features/owner-dashboard/ownerDashboardContent";
import { useOwnerDashboardData } from "./useOwnerDashboardData";

export default function OwnerDashboardPage() {
  const { user, loading, isAuthenticated } = useCurrentUser();
  const data = useOwnerDashboardData(isAuthenticated, { missionLimit: 24 });
  const [firstLoginOpen, setFirstLoginOpen] = useState(false);
  const actionStatus = useMemo<Record<string, OnboardingActionStatus>>(() => ({
    "configure-packs": data.properties.length > 0 ? "done" : "todo",
    "set-pricing": data.latestQuotes.length > 0 ? "done" : "todo",
    "prepare-docs": data.latestInvoices.length > 0 ? "done" : "todo",
  }), [data.properties.length, data.latestQuotes.length, data.latestInvoices.length]);
  useEffect(() => {
    if (!user?.id || data.loading || data.error) return;
    try {
      const seen = localStorage.getItem(`owner-onboarding-first-login-seen:${user.id}`);
      setFirstLoginOpen(shouldShowFirstLoginPopup({ firstLogin: !seen, completionState: "in_progress", actionStatus }));
    } catch { setFirstLoginOpen(false); }
  }, [user?.id, data.loading, data.error, actionStatus]);
  if (loading || (isAuthenticated && data.loading)) return <DashboardLoadingScreen label={copy.loading} />;
  if (!isAuthenticated || !user) return null;
  if (data.error) return <div role="alert"><p>{data.error}</p><button onClick={() => window.location.reload()}>{copy.retry}</button></div>;
  return <>
    <OwnerDashboardView data={data} name={user.firstName || user.username || "Propriétaire"} userId={String(user.id)} />
    <FirstLoginOnboardingPopup path="business+" open={firstLoginOpen} onClose={() => {
      setFirstLoginOpen(false);
      try { localStorage.setItem(`owner-onboarding-first-login-seen:${user.id}`, "1"); } catch { /* Closing remains available without browser storage. */ }
    }} />
  </>;
}
