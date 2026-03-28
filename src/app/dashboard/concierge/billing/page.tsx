"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import TariffBillingDesk from "@/app/components/tariffs/TariffBillingDesk";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";

export default function ConciergeBillingPage() {
  const searchParams = useSearchParams();
  const targetQuoteId = searchParams.get("quote");
  const source = searchParams.get("source");

  return (
    <ConciergeWorkspacePage
      eyebrow="Finances"
      title="Devis et factures"
      description="Préparez un devis clair, envoyez-le au propriétaire, puis transformez-le en facture depuis un seul espace de travail."
      chips={[
        "Devis",
        "Factures",
        source === "request" ? "Arrivée depuis une demande" : "Espace de production",
      ]}
      actions={[
        { label: "Mettre à jour mes tarifs", href: "/dashboard/concierge/pricing" },
        { label: "Gérer mes packs", href: "/dashboard/concierge/services-packages" },
        { label: "Voir mes demandes", href: "/dashboard/concierge/demandes" },
      ]}
      metrics={[]}
      cards={[]}
    >
      <section style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
        {source === "request" ? (
          <div
            style={{
              padding: "1rem",
              borderRadius: "18px",
              border: "1px solid rgba(184, 148, 30, 0.26)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250, 245, 235, 0.98))",
              color: "#3b3126",
            }}
          >
            <strong style={{ display: "block", marginBottom: "0.35rem" }}>
              Devis préparé depuis une demande
            </strong>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              {targetQuoteId
                ? "Le brouillon créé depuis la demande est présélectionné ci-dessous. Vérifiez-le, ajustez-le si besoin, puis envoyez-le."
                : "Vous arrivez depuis une demande. Le bureau devis et factures ci-dessous est prêt à prendre le relais."}
            </p>
          </div>
        ) : null}

        <TariffBillingDesk initialSelectedQuoteId={targetQuoteId ?? undefined} />
      </section>
    </ConciergeWorkspacePage>
  );
}
