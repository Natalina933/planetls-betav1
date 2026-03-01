import { Suspense } from "react";
import OwnerInvoicesPageClient from "./OwnerInvoicesPageClient";

export default function OwnerInvoicesPage() {
  return (
    <Suspense fallback={<section className="dashboard-grid">Chargement des factures...</section>}>
      <OwnerInvoicesPageClient />
    </Suspense>
  );
}
