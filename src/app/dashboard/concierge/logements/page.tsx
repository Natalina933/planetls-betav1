"use client";

import HousingListPage from "@/components/dashboard/housing/HousingListPage";

export default function LogementsPage() {
  return (
    <HousingListPage
      title="Mes logements"
      addHref="/dashboard/concierge/logements/create"
      detailHrefBase="/dashboard/concierge/logements"
      persona="conciergerie"
    />
  );
}
