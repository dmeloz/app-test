import { describe, expect, it } from "vitest";
import { RESTAURANT_NAME } from "./restaurant";

// L8 (audit-1.md) : nom du restaurant fictif utilisé dans le titre des pages du back-office.
describe("restaurant (mock, backoffice)", () => {
  it("fournit un nom de restaurant fictif non vide", () => {
    expect(RESTAURANT_NAME).toBe("Le Belvédère Imaginaire");
  });
});
