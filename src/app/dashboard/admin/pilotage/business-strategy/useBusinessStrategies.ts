"use client";

import { useCallback, useEffect, useState } from "react";
import { createStrategy, type BusinessStrategy } from "./types";

const STORAGE_KEY = "planetls:business-strategy-center:v1";
const VERSION = 1;
type Store = { version: number; strategies: BusinessStrategy[]; activeId: string | null };

export function useBusinessStrategies() {
  const [strategies, setStrategies] = useState<BusinessStrategy[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) as Partial<Store> : null;
      if (parsed?.version === VERSION && Array.isArray(parsed.strategies)) {
        setStrategies(parsed.strategies);
        setActiveIdState(parsed.activeId ?? parsed.strategies[0]?.id ?? null);
      }
    } catch { /* Le centre repart vide si le stockage est illisible. */ }
    setReady(true);
  }, []);

  const persist = useCallback((next: BusinessStrategy[], nextActiveId: string | null) => {
    setStrategies(next); setActiveIdState(nextActiveId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, strategies: next, activeId: nextActiveId } satisfies Store));
  }, []);

  const create = useCallback(() => { const strategy = createStrategy(); persist([...strategies, strategy], strategy.id); }, [persist, strategies]);
  const update = useCallback((updated: BusinessStrategy) => persist(strategies.map((item) => item.id === updated.id ? updated : item), activeId), [activeId, persist, strategies]);
  const duplicate = useCallback((id: string) => { const source = strategies.find((item) => item.id === id); if (!source) return; const copy = { ...structuredClone(source), id: `${source.id}-copy-${Date.now()}`, name: `${source.name} — copie`, status: "draft" as const, createdAt: new Date().toISOString() }; persist([...strategies, copy], copy.id); }, [persist, strategies]);
  const setActiveId = useCallback((id: string) => persist(strategies, id), [persist, strategies]);

  return { strategies, activeId, active: strategies.find((item) => item.id === activeId) ?? null, ready, create, update, duplicate, setActiveId };
}