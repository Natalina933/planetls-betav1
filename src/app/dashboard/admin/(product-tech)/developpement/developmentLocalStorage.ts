import type { SetStateAction } from "react";

type StorageAccess = () => Pick<Storage, "getItem" | "setItem"> | null;

// Une instance par montage : aucun état utilisateur partagé pendant le rendu serveur.
// Le snapshot serveur reste vide pendant l’hydratation ; React lit ensuite le navigateur.
export function createDevelopmentLocalStorage<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => boolean = () => true,
  storageAccess: StorageAccess = () => typeof window === "undefined" ? null : window.localStorage,
) {
  let snapshot = fallback;
  let initialized = false;
  const listeners = new Set<() => void>();
  const getSnapshot = () => {
    if (!initialized) {
      initialized = true;
      try {
        const raw = storageAccess()?.getItem(key);
        const parsed: unknown = raw ? JSON.parse(raw) : fallback;
        snapshot = validate(parsed) ? parsed as T : fallback;
      } catch {
        snapshot = fallback;
      }
    }
    return snapshot;
  };
  return {
    getSnapshot,
    getServerSnapshot: () => fallback,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    set: (action: SetStateAction<T>) => {
      const previous = getSnapshot();
      const next = typeof action === "function" ? (action as (value: T) => T)(previous) : action;
      if (Object.is(next, previous)) return;
      snapshot = next;
      try { storageAccess()?.setItem(key, JSON.stringify(next)); } catch {
        // Le stockage bloqué ne doit pas empêcher l’interaction dans l’onglet courant.
      }
      listeners.forEach(listener => listener());
    },
  };
}

export const isFavoriteIdList = (value: unknown) => Array.isArray(value) && value.every(id => typeof id === "string");
