"use client";

import { useEffect, useRef, useState } from "react";
import type { ConciergeSearchPayload, ConciergeSearchRow, ServerOptions } from "./conciergeSearchTypes";
import { buildOwnerConciergeSearchParams, type OwnerConciergeSearchFilters } from "./searchHelpers";

const emptyServerOptions: ServerOptions = {
  categories: [],
  services: [],
  propertyTypes: [],
};

type UseOwnerConciergeSearchResult = {
  items: ConciergeSearchRow[];
  loading: boolean;
  error: string | null;
  serverOptions: ServerOptions;
  search: (filters: OwnerConciergeSearchFilters) => Promise<ConciergeSearchRow[]>;
  clear: () => void;
  setError: (value: string | null) => void;
};

export function useOwnerConciergeSearch(): UseOwnerConciergeSearchResult {
  const latestRequestRef = useRef(0);
  const searchAbortRef = useRef<AbortController | null>(null);
  const [items, setItems] = useState<ConciergeSearchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverOptions, setServerOptions] = useState<ServerOptions>(emptyServerOptions);

  async function search(filters: OwnerConciergeSearchFilters) {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const params = buildOwnerConciergeSearchParams(filters);
      const response = await fetch(`/api/profiles/concierges?${params.toString()}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const payload = (await response.json()) as ConciergeSearchPayload & { error?: string };

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de charger les concierges.");
      }

      if (latestRequestRef.current !== requestId) {
        return [];
      }

      const nextItems = Array.isArray(payload?.items) ? payload.items : [];
      setItems(nextItems);
      setServerOptions({
        categories: Array.isArray(payload?.available_filters?.categories)
          ? payload.available_filters.categories
          : [],
        services: Array.isArray(payload?.available_filters?.services) ? payload.available_filters.services : [],
        propertyTypes: Array.isArray(payload?.available_filters?.property_types)
          ? payload.available_filters.property_types
          : [],
      });
      return nextItems;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return [];
      }

      if (latestRequestRef.current !== requestId) {
        return [];
      }

      setError(err instanceof Error ? err.message : "Impossible de charger les concierges.");
      return [];
    } finally {
      if (searchAbortRef.current === controller) {
        searchAbortRef.current = null;
      }
      if (latestRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  }

  function clear() {
    latestRequestRef.current += 1;
    searchAbortRef.current?.abort();
    searchAbortRef.current = null;
    setLoading(false);
    setError(null);
    setItems([]);
    setServerOptions(emptyServerOptions);
  }

  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort();
    };
  }, []);

  return {
    items,
    loading,
    error,
    serverOptions,
    search,
    clear,
    setError,
  };
}
