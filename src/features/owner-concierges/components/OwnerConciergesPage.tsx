"use client";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { GeographicConciergeSearch } from "./GeographicConciergeSearch";

const OwnerConciergesPageClient = dynamic(() => import("@/app/dashboard/owner/concierges/OwnerConciergesPageClient"));

export function OwnerConciergesPage() {
  const params = useSearchParams();
  // Existing prefilled contact flows stay on their established composer until the next lot.
  if (["housingId", "requestTitle", "requestDescription", "alertId"].some((key) => params.has(key))) return <OwnerConciergesPageClient />;
  return <GeographicConciergeSearch />;
}
