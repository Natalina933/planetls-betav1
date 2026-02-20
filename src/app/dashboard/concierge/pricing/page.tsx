import Link from "next/link";
import PricingGridManager from "@/app/components/dashboard/concierge/PricingGridManager/PricingGridManager";

interface PageProps {
  searchParams?: {
    packageId?: string | string[];
    packageName?: string | string[];
  };
}

const pickFirst = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export default function ConciergePricingPage({ searchParams }: PageProps) {
  const packageId = pickFirst(searchParams?.packageId);
  const packageName = pickFirst(searchParams?.packageName);

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
