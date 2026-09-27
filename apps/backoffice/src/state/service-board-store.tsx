"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { menuItems } from "../mock/menu-items";
import { nextIncomingOrder } from "../mock/orders";
import type { BoardOrderStatus, LocalizedText, MockMenuItem, MockOrder } from "../mock/types";

export const STORAGE_KEY = "demo-backoffice-state-v1";

interface BoardState {
  readonly orders: readonly MockOrder[];
  readonly paused: boolean;
  readonly menuItems: readonly MockMenuItem[];
  readonly lastArrivalId: string | null;
}

const initialState: BoardState = {
  orders: [],
  paused: false,
  menuItems,
  lastArrivalId: null,
};

// M3 (audit-1.md) : même limite que `apps/storefront/src/state/cart-store.tsx` — un état de mauvaise
// forme (schéma changé entre deux déploiements, écriture manuelle dans les devtools) ne doit jamais
// faire planter le rendu (« x.orders.filter is not a function » constaté par l'audit) : il est
// rejeté ici, avant tout usage, et la clé corrompue est purgée par `loadStateFromStorage` ci-dessous.
function isValidLocalizedText(value: unknown): value is LocalizedText {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const text = value as Record<string, unknown>;
  return typeof text.fr === "string" && typeof text.en === "string";
}

function isValidOrderLine(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const line = value as Record<string, unknown>;
  return (
    isValidLocalizedText(line.name) &&
    typeof line.quantity === "number" &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0 &&
    Array.isArray(line.options) &&
    line.options.every(isValidLocalizedText)
  );
}

const VALID_BOARD_STATUSES: readonly BoardOrderStatus[] = ["new", "preparing", "ready", "refused"];

function isValidOrder(value: unknown): value is MockOrder {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const order = value as Record<string, unknown>;
  return (
    typeof order.id === "string" &&
    typeof order.number === "string" &&
    isValidLocalizedText(order.slotLabel) &&
    Array.isArray(order.lines) &&
    order.lines.every(isValidOrderLine) &&
    (order.note === undefined || isValidLocalizedText(order.note)) &&
    typeof order.status === "string" &&
    (VALID_BOARD_STATUSES as readonly string[]).includes(order.status) &&
    (order.refusalReason === undefined || typeof order.refusalReason === "string")
  );
}

function isValidMenuItem(value: unknown): value is MockMenuItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    isValidLocalizedText(item.name) &&
    typeof item.soldOut === "boolean"
  );
}

function isValidBoardState(value: unknown): value is BoardState {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const state = value as Record<string, unknown>;
  return (
    Array.isArray(state.orders) &&
    state.orders.every(isValidOrder) &&
    typeof state.paused === "boolean" &&
    Array.isArray(state.menuItems) &&
    state.menuItems.every(isValidMenuItem) &&
    (state.lastArrivalId === null || typeof state.lastArrivalId === "string")
  );
}

interface StorageLike {
  getItem(key: string): string | null;
  removeItem(key: string): void;
}

/**
 * Lit et valide l'état stocké (testable sans navigateur : le stockage est injecté). Si la valeur est
 * absente, non-JSON ou de forme inattendue, l'état initial est retourné **et la clé corrompue est
 * purgée** (M3, audit-1.md).
 */
export function loadStateFromStorage(storage: StorageLike): BoardState {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) {
    return initialState;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    storage.removeItem(STORAGE_KEY);
    return initialState;
  }
  if (!isValidBoardState(parsed)) {
    storage.removeItem(STORAGE_KEY);
    return initialState;
  }
  return parsed;
}

// État de démonstration uniquement (spec P01 §2 : en mémoire + `localStorage`, aucun appel réseau,
// aucune base) — même schéma que `apps/storefront/src/state/cart-store.tsx` (singleton du module via
// `useSyncExternalStore`, jamais un `setState` React appelé depuis un effet).
function loadState(): BoardState {
  try {
    if (typeof window === "undefined") {
      return initialState;
    }
    return loadStateFromStorage(window.localStorage);
  } catch {
    return initialState;
  }
}

function saveState(state: BoardState): void {
  try {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage indisponible : la démonstration continue en mémoire pour la session en cours.
  }
}

let currentState: BoardState = initialState;
if (typeof window !== "undefined") {
  currentState = loadState();
}
const listeners = new Set<() => void>();
// Portée module (pas un `useRef`) : un `useRef` se réinitialise si le composant démonte puis
// remonte (observé ici — cette version de React/Next commet parfois deux passes de montage même en
// production, hors StrictMode dev) ; seule une valeur au niveau du module survit à un remontage dans
// la même session de page et garantit un unique amorçage automatique (spec P01 §2, une seule
// commande fictive à l'arrivée).
let autoSeeded = false;

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): BoardState {
  return currentState;
}

function getServerSnapshot(): BoardState {
  return initialState;
}

function mutate(updater: (current: BoardState) => BoardState): void {
  currentState = updater(currentState);
  saveState(currentState);
  emitChange();
}

function setOrderStatus(
  orders: readonly MockOrder[],
  id: string,
  status: BoardOrderStatus,
  refusalReason?: string,
): readonly MockOrder[] {
  return orders.map((order) =>
    order.id === id
      ? { ...order, status, refusalReason: refusalReason ?? order.refusalReason }
      : order,
  );
}

export interface BoardApi extends BoardState {
  simulateIncomingOrder(): void;
  acceptOrder(id: string): void;
  refuseOrder(id: string, reason: string): void;
  markReady(id: string): void;
  togglePause(): void;
  toggleSoldOut(itemId: string): void;
  /** M3 (audit-1.md) : bouton visible « Réinitialiser la démo ». */
  resetDemo(): void;
}

/**
 * Hook d'accès au tableau de service de démonstration. Amorce automatiquement une première commande
 * fictive peu après le montage (« alerte visuelle à l'arrivée d'une commande », spec P01 §2) — un
 * court délai plutôt qu'un minuteur récurrent, pour un parcours e2e déterministe.
 */
export function useServiceBoard(): BoardApi {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const simulateIncomingOrder = useCallback(() => {
    mutate((current) => {
      if (current.paused) {
        return current;
      }
      const order = nextIncomingOrder();
      return { ...current, orders: [...current.orders, order], lastArrivalId: order.id };
    });
  }, []);

  useEffect(() => {
    if (autoSeeded || currentState.orders.length > 0) {
      return;
    }
    autoSeeded = true;
    const timer = setTimeout(() => {
      simulateIncomingOrder();
    }, 300);
    return () => clearTimeout(timer);
  }, [simulateIncomingOrder]);

  const acceptOrder = useCallback((id: string) => {
    mutate((current) => ({ ...current, orders: setOrderStatus(current.orders, id, "preparing") }));
  }, []);
  const refuseOrder = useCallback((id: string, reason: string) => {
    mutate((current) => ({
      ...current,
      orders: setOrderStatus(current.orders, id, "refused", reason),
    }));
  }, []);
  const markReady = useCallback((id: string) => {
    mutate((current) => ({ ...current, orders: setOrderStatus(current.orders, id, "ready") }));
  }, []);
  const togglePause = useCallback(() => {
    mutate((current) => ({ ...current, paused: !current.paused }));
  }, []);
  const toggleSoldOut = useCallback((itemId: string) => {
    mutate((current) => ({
      ...current,
      menuItems: current.menuItems.map((item) =>
        item.id === itemId ? { ...item, soldOut: !item.soldOut } : item,
      ),
    }));
  }, []);
  const resetDemo = useCallback(() => {
    mutate(() => initialState);
    // Rejoue l'amorçage automatique (spec P01 §2) : sans remontage du composant, l'effet
    // d'amorçage ne se relance pas de lui-même — reproduit ici le même délai de démonstration.
    autoSeeded = false;
    setTimeout(() => {
      if (!autoSeeded && currentState.orders.length === 0) {
        autoSeeded = true;
        simulateIncomingOrder();
      }
    }, 300);
  }, [simulateIncomingOrder]);

  return {
    ...state,
    simulateIncomingOrder,
    acceptOrder,
    refuseOrder,
    markReady,
    togglePause,
    toggleSoldOut,
    resetDemo,
  };
}
