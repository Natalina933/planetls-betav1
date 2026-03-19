"use client";

import CreateHousingForm from "@/components/dashboard/housing/CreateHousingForm";

export default function AddLogementPage() {
  return <CreateHousingForm redirectPath="/dashboard/concierge/logements" />;
}
