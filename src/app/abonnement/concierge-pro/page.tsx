import { Suspense } from "react";
import ConciergeProSubscriptionPageClient from "./ConciergeProSubscriptionPageClient";

export default function ConciergeProSubscriptionPage() {
  return (
    <Suspense fallback={null}>
      <ConciergeProSubscriptionPageClient />
    </Suspense>
  );
}
