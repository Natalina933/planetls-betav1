"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PricingGridManager from "@/app/components/dashboard/concierge/PricingGridManager/PricingGridManager";

export default function ConciergePricingPage() {
  const searchParams = useSearchParams();
  const packageId = searchParams.get("packageId");
  const packageName = searchParams.get("packageName");

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Grille Tarifaire</h1>
          <p style={{ margin: "0.35rem 0 0", color: "#666" }}>
            {packageId
              ? `Creation d'un tarif pour le pack: ${packageName ?? packageId}`
              : "Creez vos tarifs par type de bien et type de prestation."}
          </p>
        </div>
        <Link href="/dashboard/concierge/services-packages">Retour aux packs</Link>
      </div>

      <PricingGridManager />
    </div>
  );
}
