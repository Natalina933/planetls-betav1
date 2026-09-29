"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { DashboardLoadingScreen } from "@/components/dashboard";
import OwnerDashboardView from "@/features/owner-dashboard/OwnerDashboardView";
import { ownerDashboardContent as copy } from "@/features/owner-dashboard/ownerDashboardContent";
import OwnerPostSignupOnboarding from "./OwnerPostSignupOnboarding";
import { useOwnerDashboardData } from "./useOwnerDashboardData";

export default function OwnerDashboardPage() {
  const { user, loading, isAuthenticated } = useCurrentUser();
  const data = useOwnerDashboardData(isAuthenticated, { missionLimit: 24 });
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    setOnboardingOpen(user?.onboarding_complete === false);
  }, [user?.onboarding_complete]);
  if (loading || (isAuthenticated && data.loading)) return <DashboardLoadingScreen label={copy.loading} />;
  if (!isAuthenticated || !user) return null;
  if (data.error) return <div role="alert"><p>{data.error}</p><button onClick={() => window.location.reload()}>{copy.retry}</button></div>;
  return <>
    <OwnerDashboardView data={data} name={user.firstName || user.username || "Propriétaire"} userId={String(user.id)} />
    <OwnerPostSignupOnboarding
      open={onboardingOpen && user.onboarding_complete === false}
      onClose={() => setOnboardingOpen(false)}
    />
  </>;
}
