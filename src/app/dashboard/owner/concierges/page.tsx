import { Suspense } from "react";
import { OwnerConciergesPage as OwnerConciergesFeaturePage } from "@/features/owner-concierges";

export const dynamic = "force-dynamic";

export default function OwnerConciergesPage() {
  return (
    <Suspense fallback={null}>
      <OwnerConciergesFeaturePage />
    </Suspense>
  );
}
