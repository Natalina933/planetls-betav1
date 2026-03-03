"use client";

import HousingListPage from "@/app/components/dashboard/housing/HousingListPage";

export default function OwnerLogementsPage() {
  return (
    <HousingListPage
      title="Mes logements"
      addHref="/dashboard/owner/logements/create"
      detailHrefBase="/dashboard/owner/logements"
      demoNoticeText="Exemples de démonstration affichés. Vos vrais logements sont masqués si les données de test ne sont pas encore rattachées à votre compte propriétaire."
    />
  );
}
