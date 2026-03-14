import { Suspense } from "react";
import { DashboardLoadingScreen } from "@/components/dashboard";
import ConciergeProfilePage from "./ConciergeProfilePage";

export default function ProfilePage() {
  return (
    <Suspense fallback={<DashboardLoadingScreen label="Chargement du profil..." />}>
      <ConciergeProfilePage />
    </Suspense>
  );
}
