import { Suspense } from "react";
import OwnerConciergesPageClient from "./OwnerConciergesPageClient";

export const dynamic = "force-dynamic";

export default function OwnerConciergesPage() {
  return (
    <Suspense fallback={null}>
      <OwnerConciergesPageClient />
    </Suspense>
  );
}
