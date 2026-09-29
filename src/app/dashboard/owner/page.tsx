"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { DashboardLoadingScreen } from "@/components/dashboard";
import OwnerDashboardView from "@/features/owner-dashboard/OwnerDashboardView";
import { ownerDashboardContent as copy } from "@/features/owner-dashboard/ownerDashboardContent";
import { getOwnerOnboardingProgress, getOwnerProfilePreferences } from "@/features/owner-preferences/profilePreferences";
import OwnerPostSignupOnboarding from "./OwnerPostSignupOnboarding";
import { useOwnerDashboardData } from "./useOwnerDashboardData";

function getOnboardingDeferredKey(userId: string) {
  return `planetls:onboarding-deferred:owner:${userId}`;
}

export default function OwnerDashboardPage() {
  const { user, loading, isAuthenticated } = useCurrentUser();
  const data = useOwnerDashboardData(isAuthenticated, { missionLimit: 24 });
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    if (!user?.id || user.onboarding_complete !== false) {
      setOnboardingOpen(false);
      return;
    }

    let deferred = false;
    try {
      deferred = window.sessionStorage.getItem(getOnboardingDeferredKey(String(user.id))) === "true";
    } catch {
      deferred = false;
    }
    setOnboardingOpen(!deferred);
  }, [user?.id, user?.onboarding_complete]);

  if (loading || (isAuthenticated && data.loading)) return <DashboardLoadingScreen label={copy.loading} />;
  if (!isAuthenticated || !user) return null;
  if (data.error) return <div role="alert"><p>{data.error}</p><button onClick={() => window.location.reload()}>{copy.retry}</button></div>;

  const ownerPreferences = getOwnerProfilePreferences(user.availability_hours);
  const ownerProgress = getOwnerOnboardingProgress(ownerPreferences.ownerOnboardingV1);
  const resumeOwnerOnboarding = () => {
    try {
      window.sessionStorage.removeItem(getOnboardingDeferredKey(String(user.id)));
    } catch {
      // La configuration reste accessible même si sessionStorage est indisponible.
    }
    setOnboardingOpen(true);
  };
  const postponeOwnerOnboarding = () => {
    try {
      window.sessionStorage.setItem(getOnboardingDeferredKey(String(user.id)), "true");
    } catch {
      // Le report ne doit jamais bloquer la fermeture.
    }
    setOnboardingOpen(false);
  };

  return <>
    <OwnerDashboardView
      data={data}
      name={user.firstName || user.username || "Propriétaire"}
      userId={String(user.id)}
      configurationStatus={{
        completed: ownerProgress.completed,
        total: ownerProgress.total,
        isComplete: user.onboarding_complete === true || ownerProgress.isComplete,
        onResume: resumeOwnerOnboarding,
      }}
    />
    <OwnerPostSignupOnboarding
      open={onboardingOpen && user.onboarding_complete === false}
      currentStep={ownerProgress.nextStep}
      onClose={() => setOnboardingOpen(false)}
      onPostpone={postponeOwnerOnboarding}
    />
  </>;
}
