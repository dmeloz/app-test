import { describe, expect, it } from "vitest";
import { loadStateFromStorage, STORAGE_KEY } from "./cart-store";

// M3 (audit-1.md) : un état `localStorage` de mauvaise forme ne doit jamais faire planter le rendu
// (« t.reduce is not a function » constaté par l'audit) — `loadStateFromStorage` reçoit un
// stockage injecté (pas besoin de jsdom/`window`) pour rester testable ici (environnement `node`).
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
  channel: null,
  lines: [],
  slotId: null,
  asap: true,
  guest: { name: "", phone: "", note: "" },
  order: null,
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

  it("retourne l'état initial et purge la clé quand `lines` n'est pas un tableau (constat exact de l'audit)", () => {
    const storage = fakeStorage({
      [STORAGE_KEY]: JSON.stringify({ ...INITIAL_STATE, lines: "oops" }),
    });
    expect(loadStateFromStorage(storage)).toEqual(INITIAL_STATE);
    expect(storage.data.has(STORAGE_KEY)).toBe(false);
  });

  it("retourne l'état initial et purge la clé pour un statut de commande inconnu", () => {
    const storage = fakeStorage({
      [STORAGE_KEY]: JSON.stringify({
        ...INITIAL_STATE,
        order: { id: "x", status: "annulee-invalide", createdAt: "2026-01-01T00:00:00.000Z" },
      }),
    });
    expect(loadStateFromStorage(storage)).toEqual(INITIAL_STATE);
    expect(storage.data.has(STORAGE_KEY)).toBe(false);
  });

  it("retourne l'état initial et purge la clé pour une valeur racine qui n'est pas un objet", () => {
    const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify("juste une chaîne") });
    expect(loadStateFromStorage(storage)).toEqual(INITIAL_STATE);
    expect(storage.data.has(STORAGE_KEY)).toBe(false);
  });

  it("accepte un état valide et complet, sans le purger", () => {
    const validState = {
      channel: "delivery" as const,
      lines: [
        {
          lineId: "l1",
          productId: "entrecote",
          quantity: 2,
          selections: [{ groupId: "cuisson", choiceIds: ["a-point"] }],
        },
      ],
      slotId: "slot-1",
      asap: false,
      guest: { name: "Jean Fictif", phone: "+41 00 000 00 00", note: "" },
      order: null,
    };
    const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify(validState) });
    expect(loadStateFromStorage(storage)).toEqual(validState);
    expect(storage.data.has(STORAGE_KEY)).toBe(true);
  });
});
