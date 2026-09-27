"use client";

import { useCallback, useSyncExternalStore } from "react";
import { menu } from "../mock/menu";
import { slots } from "../mock/slots";
import type { CartLine, CartLineSelection, Channel, GuestInfo, OrderStatus } from "../mock/types";

export const STORAGE_KEY = "demo-storefront-state-v1";

// N3 (audit-2.md) : ensembles des identifiants réellement présents dans le menu et les créneaux
// fictifs — utilisés pour l'intégrité référentielle ci-dessous (`sanitizeReferentialIntegrity`),
// jamais pour valider la *forme* des données (`isValidState` ci-dessus reste seul responsable de ça).
const KNOWN_PRODUCT_IDS = new Set(
  menu.flatMap((category) => category.products.map((product) => product.id)),
);
const KNOWN_SLOT_IDS = new Set(slots.map((slot) => slot.id));

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

// M3 (audit-1.md) : forme minimale de l'état attendu — un état de mauvaise forme (schéma changé
// entre deux déploiements, écriture manuelle dans les devtools, quota partiellement rempli) ne doit
// jamais faire planter le rendu (« t.reduce is not a function » constaté par l'audit) : il est
// rejeté ici, avant tout usage, et la clé corrompue est purgée par `loadStateFromStorage` ci-dessous.
function isValidChannel(value: unknown): value is Channel | null {
  return value === null || value === "pickup" || value === "delivery";
}

function isValidCartLineSelection(value: unknown): value is CartLineSelection {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const selection = value as Record<string, unknown>;
  return (
    typeof selection.groupId === "string" &&
    Array.isArray(selection.choiceIds) &&
    selection.choiceIds.every((choiceId) => typeof choiceId === "string")
  );
}

function isValidCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const line = value as Record<string, unknown>;
  return (
    typeof line.lineId === "string" &&
    typeof line.productId === "string" &&
    typeof line.quantity === "number" &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0 &&
    Array.isArray(line.selections) &&
    line.selections.every(isValidCartLineSelection)
  );
}

function isValidGuest(value: unknown): value is GuestInfo {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const guest = value as Record<string, unknown>;
  return (
    typeof guest.name === "string" &&
    typeof guest.phone === "string" &&
    typeof guest.note === "string"
  );
}

const VALID_ORDER_STATUSES: readonly OrderStatus[] = ["accepted", "preparing", "ready"];

function isValidOrder(value: unknown): value is DemoOrder | null {
  if (value === null) {
    return true;
  }
  if (typeof value !== "object") {
    return false;
  }
  const order = value as Record<string, unknown>;
  return (
    typeof order.id === "string" &&
    typeof order.status === "string" &&
    (VALID_ORDER_STATUSES as readonly string[]).includes(order.status) &&
    typeof order.createdAt === "string"
  );
}

function isValidState(value: unknown): value is StoreState {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const state = value as Record<string, unknown>;
  return (
    isValidChannel(state.channel) &&
    Array.isArray(state.lines) &&
    state.lines.every(isValidCartLine) &&
    (state.slotId === null || typeof state.slotId === "string") &&
    typeof state.asap === "boolean" &&
    isValidGuest(state.guest) &&
    isValidOrder(state.order)
  );
}

/**
 * N3 (audit-2.md) : une ligne dont `productId` ne correspond plus à aucun produit du menu fictif
 * (mock modifié entre deux déploiements, clé de stockage `-v1` inchangée), ou un `slotId` qui ne
 * correspond plus à aucun créneau, ne doivent pas laisser le panier dans un état incohérent (total à
 * 0 CHF, « Payer » activé malgré un panier sans produit réel) : la ligne est filtrée, le créneau
 * inconnu est ignoré (traité comme si aucun créneau n'était choisi), sans purger tout l'état pour
 * autant — contrairement à une donnée de mauvaise *forme* (M3, `isValidState` ci-dessus).
 */
export function sanitizeReferentialIntegrity(state: StoreState): StoreState {
  const knownLines = state.lines.filter((line) => KNOWN_PRODUCT_IDS.has(line.productId));
  const knownSlotId =
    state.slotId !== null && KNOWN_SLOT_IDS.has(state.slotId) ? state.slotId : null;
  if (knownLines.length === state.lines.length && knownSlotId === state.slotId) {
    return state;
  }
  return { ...state, lines: knownLines, slotId: knownSlotId };
}

interface StorageLike {
  getItem(key: string): string | null;
  removeItem(key: string): void;
}

/**
 * Lit et valide l'état stocké (testable sans navigateur : le stockage est injecté). Si la valeur est
 * absente, non-JSON ou de forme inattendue, l'état initial est retourné **et la clé corrompue est
 * purgée** (M3, audit-1.md) — la démonstration repart sur un état propre au lieu de replanter à
 * chaque chargement.
 */
export function loadStateFromStorage(storage: StorageLike): StoreState {
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
  if (!isValidState(parsed)) {
    storage.removeItem(STORAGE_KEY);
    return initialState;
  }
  return sanitizeReferentialIntegrity(parsed);
}

// État de démonstration uniquement (spec P01 §2 : en mémoire + `localStorage`, aucun appel réseau,
// aucune base). Accès à `localStorage` protégé par try/catch : la démo doit continuer à fonctionner
// (en mémoire) même si le stockage est indisponible (navigation privée, quota dépassé).
function loadState(): StoreState {
  try {
    if (typeof window === "undefined") {
      return initialState;
    }
    return loadStateFromStorage(window.localStorage);
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
  /** L10 (audit-1.md) : lignes modifiables — quantité ≤ 0 retire la ligne (comme `removeLine`). */
  updateLineQuantity(lineId: string, quantity: number): void;
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
    mutate((current) => ({
      ...current,
      lines: current.lines.filter((line) => line.lineId !== lineId),
    }));
  }, []);
  const updateLineQuantity = useCallback((lineId: string, quantity: number) => {
    mutate((current) => ({
      ...current,
      lines: current.lines
        .map((line) => (line.lineId === lineId ? { ...line, quantity } : line))
        .filter((line) => line.quantity > 0),
    }));
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
  // L10 (audit-1.md) : le panier et les coordonnées invité (nom, téléphone, note) sont purgés une
  // fois la commande de démonstration passée — pour ne pas les conserver indéfiniment dans
  // `localStorage` (`.claude/rules/security.md` : minimisation des données). Vider `lines` ici ne
  // suffit **pas**, à lui seul, à empêcher une seconde commande si l'utilisateur revient en arrière
  // sur `/paiement` : c'était inexact (N2, audit-2.md) — c'est `PaymentScreen` qui doit refuser toute
  // confirmation avec un panier vide, y compris après une commande, voir sa garde dédiée.
  const confirmPayment = useCallback(() => {
    mutate((current) => ({
      ...current,
      lines: [],
      guest: initialState.guest,
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
      return {
        ...current,
        order: { ...current.order, status: nextOrderStatus(current.order.status) },
      };
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
    updateLineQuantity,
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
