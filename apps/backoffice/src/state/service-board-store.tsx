"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { menuItems } from "../mock/menu-items";
import { nextIncomingOrder } from "../mock/orders";
import type { BoardOrderStatus, MockMenuItem, MockOrder } from "../mock/types";

const STORAGE_KEY = "demo-backoffice-state-v1";

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

// État de démonstration uniquement (spec P01 §2 : en mémoire + `localStorage`, aucun appel réseau,
// aucune base) — même schéma que `apps/storefront/src/state/cart-store.tsx` (singleton du module via
// `useSyncExternalStore`, jamais un `setState` React appelé depuis un effet).
function loadState(): BoardState {
  try {
    if (typeof window === "undefined") {
      return initialState;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initialState;
    }
    const parsed = JSON.parse(raw) as Partial<BoardState>;
    return { ...initialState, ...parsed, menuItems: parsed.menuItems ?? menuItems };
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
}

/**
 * Hook d'accès au tableau de service de démonstration. Amorce automatiquement une première commande
 * fictive peu après le montage (« alerte visuelle à l'arrivée d'une commande », spec P01 §2) — un
 * court délai plutôt qu'un minuteur récurrent, pour un parcours e2e déterministe.
 */
export function useServiceBoard(): BoardApi {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const seeded = useRef(false);

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
    if (seeded.current || currentState.orders.length > 0) {
      return;
    }
    seeded.current = true;
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

  return {
    ...state,
    simulateIncomingOrder,
    acceptOrder,
    refuseOrder,
    markReady,
    togglePause,
    toggleSoldOut,
  };
}
