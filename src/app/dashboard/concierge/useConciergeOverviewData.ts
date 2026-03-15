"use client";

import { useEffect, useState } from "react";
import { fetchJsonOrFallback } from "../shared";

type ConciergeProfile = Record<string, unknown> | null;
type ConciergeConversation = Record<string, unknown>;
type ConciergeHousing = Record<string, unknown>;
type ConciergeRequest = Record<string, unknown>;
type ConciergeBilling = {
  events?: Array<Record<string, unknown>>;
  subscription?: Record<string, unknown> | null;
} | null;
type ConciergePricingRow = Record<string, unknown>;
type ConciergePackageRow = Record<string, unknown>;

export function useConciergeOverviewData() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ConciergeProfile>(null);
  const [requests, setRequests] = useState<ConciergeRequest[]>([]);
  const [conversations, setConversations] = useState<ConciergeConversation[]>([]);
  const [housings, setHousings] = useState<ConciergeHousing[]>([]);
  const [billing, setBilling] = useState<ConciergeBilling>(null);
  const [pricingRows, setPricingRows] = useState<ConciergePricingRow[]>([]);
  const [packages, setPackages] = useState<ConciergePackageRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);

        const [
          nextProfile,
          nextRequests,
          nextConversations,
          nextHousings,
          nextBilling,
          nextPricingRows,
          nextPackages,
        ] = await Promise.all([
          fetchJsonOrFallback<Record<string, unknown> | null>("/api/profiles/current", null),
          fetchJsonOrFallback<{ items?: ConciergeRequest[] }>(
            "/api/service-requests?view=concierge&limit=30",
            { items: [] },
          ),
          fetchJsonOrFallback<{ items?: ConciergeConversation[] }>(
            "/api/messages/conversations?role=concierge&limit=60",
            { items: [] },
          ),
          fetchJsonOrFallback<ConciergeHousing[]>("/api/housing", []),
          fetchJsonOrFallback<ConciergeBilling>("/api/billing/history", null),
          fetchJsonOrFallback<ConciergePricingRow[]>("/api/pricing", []),
          fetchJsonOrFallback<ConciergePackageRow[]>("/api/services/packages", []),
        ]);

        if (cancelled) return;

        setProfile(nextProfile);
        setRequests(Array.isArray(nextRequests?.items) ? nextRequests.items : []);
        setConversations(Array.isArray(nextConversations?.items) ? nextConversations.items : []);
        setHousings(Array.isArray(nextHousings) ? nextHousings : []);
        setBilling(nextBilling);
        setPricingRows(Array.isArray(nextPricingRows) ? nextPricingRows : []);
        setPackages(Array.isArray(nextPackages) ? nextPackages : []);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    loading,
    profile,
    requests,
    conversations,
    housings,
    billing,
    pricingRows,
    packages,
  };
}
