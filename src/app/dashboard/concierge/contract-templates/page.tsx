import Link from "next/link";
import ContractTemplateManager from "@/app/components/dashboard/concierge/ContractTemplateManager/ContractTemplateManager";

interface PageProps {
  searchParams?: {
    packageId?: string | string[];
    packageName?: string | string[];
  };
}

const pickFirst = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export default function ConciergeContractTemplatesPage({ searchParams }: PageProps) {
  const packageId = pickFirst(searchParams?.packageId);
  const packageName = pickFirst(searchParams?.packageName);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Modeles de Contrats</h1>
          <p style={{ margin: "0.35rem 0 0", color: "#666" }}>
            {packageId
              ? `Nouveau modele pour le pack: ${packageName ?? packageId}`
              : "Gerez vos modeles de contrats relies aux packs."}
          </p>
        </div>
        <Link href="/dashboard/concierge/services-packages">Retour aux packs</Link>
      </div>

      <ContractTemplateManager packageId={packageId} packageName={packageName} />
    </div>
  );
}
