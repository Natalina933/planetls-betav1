import { Suspense } from "react";
import { DashboardLoadingScreen } from "@/components/dashboard";
import { ConciergeProfileFeature } from "@/features/concierge-profile";

export default function ProfilePage() {
  return (
    <Suspense fallback={<DashboardLoadingScreen label="Chargement du profil..." />}>
      <ConciergeProfileFeature />
    </Suspense>
  );
}
