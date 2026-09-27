import { describe, expect, it } from "vitest";
import { restaurant } from "./restaurant";

// L8 (audit-1.md) : nom du restaurant fictif — source unique (`restaurant.name`, donnée « tenant »),
// jamais dupliqué en dur dans un dictionnaire i18n (voir `i18n/dictionary.test.ts`).
describe("restaurant (mock)", () => {
  it("fournit un nom de restaurant fictif non vide", () => {
    expect(restaurant.name).toBe("Le Belvédère Imaginaire");
  });
});
