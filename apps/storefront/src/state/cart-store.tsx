"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { CartLine, Channel, GuestInfo, OrderStatus } from "../mock/types";

const STORAGE_KEY = "demo-storefront-state-v1";

export interface DemoOrder {
  readonly id: string;
  readonly status: OrderStatus;
  readonly createdAt: string;
}

interface StoreState {
  readonly channel: Channel | null;
  readonly lines: readonly CartLine[];
  readonly slotId: string | null;
  readonly asap: boolean;
  readonly guest: GuestInfo;
  readonly order: DemoOrder | null;
}

const initialState: StoreState = {
  channel: null,
  lines: [],
  slotId: null,
  asap: true,
  guest: { name: "", phone: "", note: "" },
  order: null,
};

// État de démonstration uniquement (spec P01 §2 : en mémoire + `localStorage`, aucun appel réseau,
// aucune base). Accès à `localStorage` protégé par try/catch : la démo doit continuer à fonctionner
// (en mémoire) même si le stockage est indisponible (navigation privée, quota dépassé).
function loadState(): StoreState {
  try {
    if (typeof window === "undefined") {
      return initialState;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initialState;
    }
    const parsed = JSON.parse(raw) as Partial<StoreState>;
    return {
      ...initialState,
      ...parsed,
      guest: { ...initialState.guest, ...parsed.guest },
    };
  } catch {
    return initialState;
  }
}

function saveState(state: StoreState): void {
  try {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage indisponible : la démonstration continue en mémoire pour la session en cours.
  }
}

// Magasin externe minimal (singleton du module, un seul onglet de démonstration) — utilisé via
// `useSyncExternalStore`, l'API React conçue pour synchroniser un état venant d'un système externe
// (ici `localStorage`) sans provoquer de rendu en cascade ni de divergence serveur/client (contrairement
// à un `useEffect` qui appellerait `setState`, détecté par `react-hooks/set-state-in-effect`).
let currentState: StoreState = initialState;
// Hydratation unique au chargement du module côté navigateur (jamais côté serveur, `window` y est
// indéfini) — pas un effet React : exécuté une fois avant tout rendu, `getServerSnapshot` ci-dessous
// garantit que le premier rendu client (hydratation) reste identique au rendu serveur malgré tout.
if (typeof window !== "undefined") {
  currentState = loadState();
}
const listeners = new Set<() => void>();

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): StoreState {
  return currentState;
}

// Toujours l'état initial côté serveur (aucun `localStorage` disponible) — React réconcilie ensuite
// avec `getSnapshot()` après l'hydratation, sans avertissement de divergence.
function getServerSnapshot(): StoreState {
  return initialState;
}

function mutate(updater: (current: StoreState) => StoreState): void {
  currentState = updater(currentState);
  saveState(currentState);
  emitChange();
}

function nextOrderStatus(status: OrderStatus): OrderStatus {
  if (status === "accepted") {
    return "preparing";
  }
  if (status === "preparing") {
    return "ready";
  }
  return "ready";
}

export interface StoreApi extends StoreState {
  setChannel(channel: Channel): void;
  addLine(line: CartLine): void;
  removeLine(lineId: string): void;
  setSlot(slotId: string | null): void;
  setAsap(asap: boolean): void;
  setGuest(guest: GuestInfo): void;
  confirmPayment(): void;
  advanceOrder(): void;
  resetDemo(): void;
}

/**
 * Hook d'accès au panier/à la commande de démonstration. Aucun `<Provider>` requis : l'état est un
 * singleton du module (une démonstration = un onglet), lu au premier rendu client via
 * `window.localStorage` (`loadState`, protégé par try/catch).
 */
export function useCartStore(): StoreApi {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setChannel = useCallback((channel: Channel) => {
    mutate((current) => ({ ...current, channel }));
  }, []);
  const addLine = useCallback((line: CartLine) => {
    mutate((current) => ({ ...current, lines: [...current.lines, line] }));
  }, []);
  const removeLine = useCallback((lineId: string) => {
    mutate((current) => ({ ...current, lines: current.lines.filter((line) => line.lineId !== lineId) }));
  }, []);
  const setSlot = useCallback((slotId: string | null) => {
    mutate((current) => ({ ...current, slotId, asap: slotId === null ? current.asap : false }));
  }, []);
  const setAsap = useCallback((asap: boolean) => {
    mutate((current) => ({ ...current, asap, slotId: asap ? null : current.slotId }));
  }, []);
  const setGuest = useCallback((guest: GuestInfo) => {
    mutate((current) => ({ ...current, guest }));
  }, []);
  const confirmPayment = useCallback(() => {
    mutate((current) => ({
      ...current,
      order: {
        id: `DEMO-${Date.now().toString(36).toUpperCase()}`,
        status: "accepted",
        createdAt: new Date().toISOString(),
      },
    }));
  }, []);
  const advanceOrder = useCallback(() => {
    mutate((current) => {
      if (!current.order) {
        return current;
      }
      return { ...current, order: { ...current.order, status: nextOrderStatus(current.order.status) } };
    });
  }, []);
  const resetDemo = useCallback(() => {
    mutate(() => initialState);
  }, []);

  return {
    ...state,
    setChannel,
    addLine,
    removeLine,
    setSlot,
    setAsap,
    setGuest,
    confirmPayment,
    advanceOrder,
    resetDemo,
  };
}

// Point d'entrée réutilisé par les tests d'intégration légers si besoin (hydratation initiale).
export function loadInitialStateForTests(): StoreState {
  return loadState();
}
