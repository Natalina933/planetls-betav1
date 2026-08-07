"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProductPersona } from "./personas";

const STORAGE_KEY = "planetls:product-personas:v1";
const STORAGE_VERSION = 1;

type StoredPersonas = { version: number; personas: ProductPersona[] };

function normalizePersonaImage(image: string) {
  if (
    image.startsWith("/") ||
    image.startsWith("blob:") ||
    image.startsWith("data:") ||
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  if (image.startsWith("\\")) {
    return image.replace(/\\/g, "/");
  }

  const normalizedPath = image.replace(/\\/g, "/");
  const publicIndex = normalizedPath.toLowerCase().lastIndexOf("/public/");

  if (publicIndex >= 0) {
    return normalizedPath.slice(publicIndex + "/public".length);
  }

  return normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
}

function normalizePersonas(personas: ProductPersona[]) {
  return personas.map((persona) => ({
    ...persona,
    image: normalizePersonaImage(persona.image),
  }));
}

function readStoredPersonas(initialPersonas: ProductPersona[]) {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return initialPersonas;
    const parsed = JSON.parse(value) as Partial<StoredPersonas>;
    return parsed.version === STORAGE_VERSION && Array.isArray(parsed.personas)
      ? normalizePersonas(parsed.personas)
      : initialPersonas;
  } catch {
    return initialPersonas;
  }
}

export function usePersonasStorage(initialPersonas: ProductPersona[]) {
  const [personas, setPersonas] = useState(initialPersonas);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    setPersonas(readStoredPersonas(normalizePersonas(initialPersonas)));
    setStorageReady(true);
  }, [initialPersonas]);

  const persist = useCallback((update: (current: ProductPersona[]) => ProductPersona[]) => {
    setPersonas((current) => {
      const next = normalizePersonas(update(current));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, personas: next } satisfies StoredPersonas));
      return next;
    });
  }, []);

  const savePersona = useCallback((updated: ProductPersona) => {
    persist((current) => current.map((persona) => persona.id === updated.id ? updated : persona));
  }, [persist]);

  const restorePersona = useCallback((id: string) => {
    const original = initialPersonas.find((persona) => persona.id === id);
    if (original) persist((current) => current.map((persona) => persona.id === id ? original : persona));
  }, [initialPersonas, persist]);

  const restoreAll = useCallback(() => persist(() => initialPersonas), [initialPersonas, persist]);

  return { personas, storageReady, savePersona, restorePersona, restoreAll };
}
