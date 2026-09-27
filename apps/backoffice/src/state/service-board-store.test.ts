import { describe, expect, it } from "vitest";
import { loadStateFromStorage, STORAGE_KEY } from "./service-board-store";
import { menuItems } from "../mock/menu-items";

// M3 (audit-1.md) : même limite que
// `apps/storefront/src/state/cart-store.test.ts` — un état `localStorage` de mauvaise forme
// (« x.orders.filter is not a function » constaté par l'audit) ne doit jamais faire planter le
// rendu. `loadStateFromStorage` reçoit un stockage injecté (pas besoin de jsdom/`window`).
function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem(key: string): string | null {
      return data.has(key) ? data.get(key)! : null;
    },
    removeItem(key: string): void {
      data.delete(key);
    },
  };
}

const INITIAL_STATE = {
  orders: [],
  paused: false,
  menuItems,
  lastArrivalId: null,
};

describe("loadStateFromStorage — M3 (audit-1.md)", () => {
  it("retourne l'état initial quand la clé est absente (aucune purge nécessaire)", () => {
    const storage = fakeStorage();
    expect(loadStateFromStorage(storage)).toEqual(INITIAL_STATE);
  });

  it("retourne l'état initial et purge la clé quand le JSON est invalide", () => {
    const storage = fakeStorage({ [STORAGE_KEY]: "{ not valid json" });
    expect(loadStateFromStorage(storage)).toEqual(INITIAL_STATE);
    expect(storage.data.has(STORAGE_KEY)).toBe(false);
  });

  it("retourne l'état initial et purge la clé quand `orders` n'est pas un tableau (constat exact de l'audit)", () => {
    const storage = fakeStorage({
      [STORAGE_KEY]: JSON.stringify({ ...INITIAL_STATE, orders: "oops" }),
    });
    expect(loadStateFromStorage(storage)).toEqual(INITIAL_STATE);
    expect(storage.data.has(STORAGE_KEY)).toBe(false);
  });

  it("retourne l'état initial et purge la clé pour un statut de commande inconnu", () => {
    const storage = fakeStorage({
      [STORAGE_KEY]: JSON.stringify({
        ...INITIAL_STATE,
        orders: [
          {
            id: "o1",
            number: "#101",
            slotLabel: { fr: "18h", en: "6pm" },
            lines: [],
            status: "statut-invalide",
          },
        ],
      }),
    });
    expect(loadStateFromStorage(storage)).toEqual(INITIAL_STATE);
    expect(storage.data.has(STORAGE_KEY)).toBe(false);
  });

  it("retourne l'état initial et purge la clé pour une valeur racine qui n'est pas un objet", () => {
    const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify(42) });
    expect(loadStateFromStorage(storage)).toEqual(INITIAL_STATE);
    expect(storage.data.has(STORAGE_KEY)).toBe(false);
  });

  it("accepte un état valide et complet, sans le purger", () => {
    const validState = {
      orders: [
        {
          id: "o1",
          number: "#101",
          slotLabel: { fr: "18h", en: "6pm" },
          lines: [{ name: { fr: "Eau", en: "Water" }, quantity: 1, options: [] }],
          status: "new" as const,
        },
      ],
      paused: true,
      menuItems,
      lastArrivalId: "o1",
    };
    const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify(validState) });
    expect(loadStateFromStorage(storage)).toEqual(validState);
    expect(storage.data.has(STORAGE_KEY)).toBe(true);
  });
});
