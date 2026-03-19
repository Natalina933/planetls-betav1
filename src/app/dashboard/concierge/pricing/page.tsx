import Link from "next/link";
import PricingGridManager from "@/components/dashboard/concierge/PricingGridManager/PricingGridManager";

interface PageProps {
  searchParams?:
    | {
        packageId?: string | string[];
        packageName?: string | string[];
      }
    | Promise<{
        packageId?: string | string[];
        packageName?: string | string[];
      }>;
}

const pickFirst = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export default async function ConciergePricingPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (searchParams && "then" in searchParams
    ? await searchParams
    : searchParams) ?? {};
  const packageId = pickFirst(resolvedSearchParams.packageId);
  const packageName = pickFirst(resolvedSearchParams.packageName);

  return (
    <section className="dashboard-grid">
      <div
        style={{
          display: "grid",
          gap: "1rem",
          padding: "1.5rem",
          borderRadius: 24,
          border: "1px solid rgba(184, 139, 74, 0.24)",
          background:
            "radial-gradient(circle at top right, rgba(212,175,55,0.14), transparent 34%), linear-gradient(145deg, #fffdf7 0%, #f4ead8 100%)",
          boxShadow: "0 16px 40px rgba(74,53,16,0.08)",
        }}
      >
        <span
          style={{
            fontSize: "0.8rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#9a7a3b",
          }}
        >
          Tarification concierge
        </span>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "grid", gap: "0.45rem" }}>
            <h1 style={{ margin: 0, color: "#3f2f14" }}>Grille tarifaire</h1>
            <p style={{ margin: 0, color: "#5f5237", maxWidth: "72ch", lineHeight: 1.55 }}>
              {packageId
                ? `Création ou ajustement d'un tarif lié au pack ${packageName ?? packageId}.`
                : "Structurez vos prestations, commissions et forfaits pour transformer votre activité de conciergerie en offre claire et vendable."}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href="/dashboard/concierge/services-packages" style={{ color: "#7b5b23", fontWeight: 700 }}>
              Voir mes packs
            </Link>
            <Link href="/dashboard/concierge/profile?tab=tarifs" style={{ color: "#7b5b23", fontWeight: 700 }}>
              Retour à ma conciergerie
            </Link>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          padding: "1rem",
          borderRadius: 22,
          border: "1px solid rgba(184, 139, 74, 0.18)",
          background: "rgba(255,255,255,0.94)",
          boxShadow: "0 12px 28px rgba(74,53,16,0.06)",
        }}
      >
        <PricingGridManager linkedPackageId={packageId} linkedPackageName={packageName} />
      </div>
    </section>
  );
}
