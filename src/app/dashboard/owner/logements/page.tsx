"use client";

import HousingListPage from "@/app/components/dashboard/housing/HousingListPage";

export default function OwnerLogementsPage() {
  return (
    <HousingListPage
      title="Mes logements"
      addHref="/dashboard/owner/logements/create"
      detailHrefBase="/dashboard/owner/logements"
      persona="owner"
    />
  );
}
