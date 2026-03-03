"use client";

import CreateHousingForm from "@/app/components/dashboard/housing/CreateHousingForm";

export default function AddLogementPage() {
  return <CreateHousingForm redirectPath="/dashboard/concierge/logements" />;
}
