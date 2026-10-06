"use client";
import dynamic from "next/dynamic";

const OwnerConciergesPageClient = dynamic(() => import("@/app/dashboard/owner/concierges/OwnerConciergesPageClient"));

export function OwnerConciergesPage() {
  return <OwnerConciergesPageClient />;
}
