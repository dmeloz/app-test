import { describe, expect, it } from "vitest";
import { menu } from "../mock/menu";
import {
  areRequiredSelectionsValid,
  cartItemCount,
  cartTotalCents,
  findProduct,
  lineSurchargeCents,
  lineTotalCents,
  lineUnitPriceCents,
} from "./cart-calculations";

describe("lineSurchargeCents / lineUnitPriceCents", () => {
  const entrecote = findProduct(menu, "entrecote")!;

  it("vaut zéro sans supplément sélectionné", () => {
    expect(lineSurchargeCents(entrecote, [])).toBe(0);
    expect(lineUnitPriceCents(entrecote, [])).toBe(entrecote.priceCents);
  });

  it("additionne les suppléments sélectionnés (fromage 2.50 + bacon 3.00)", () => {
    const selections = [
      { groupId: "cuisson", choiceIds: ["a-point"] },
      { groupId: "supplements-entrecote", choiceIds: ["fromage", "bacon"] },
    ];
    expect(lineSurchargeCents(entrecote, selections)).toBe(550);
    expect(lineUnitPriceCents(entrecote, selections)).toBe(entrecote.priceCents + 550);
  });

  it("ignore un identifiant de choix inconnu (robustesse)", () => {
    const selections = [{ groupId: "supplements-entrecote", choiceIds: ["inexistant"] }];
    expect(lineSurchargeCents(entrecote, selections)).toBe(0);
  });
});

describe("lineTotalCents / cartTotalCents / cartItemCount", () => {
  const entrecote = findProduct(menu, "entrecote")!;
  const eau = findProduct(menu, "eau-petillante")!;

  it("multiplie le prix unitaire par la quantité", () => {
    const line = {
      lineId: "l1",
      productId: entrecote.id,
      quantity: 2,
      selections: [{ groupId: "cuisson", choiceIds: ["saignant"] }],
    };
    expect(lineTotalCents(entrecote, line)).toBe(entrecote.priceCents * 2);
  });

  it("additionne plusieurs lignes de produits différents", () => {
    const lines = [
      {
        lineId: "l1",
        productId: entrecote.id,
        quantity: 1,
        selections: [{ groupId: "cuisson", choiceIds: ["a-point"] }],
      },
      { lineId: "l2", productId: eau.id, quantity: 2, selections: [] },
    ];
    expect(cartTotalCents(menu, lines)).toBe(entrecote.priceCents + eau.priceCents * 2);
    expect(cartItemCount(lines)).toBe(3);
  });

  it("gère le panier vide (cas limite zéro)", () => {
    expect(cartTotalCents(menu, [])).toBe(0);
    expect(cartItemCount([])).toBe(0);
  });

  it("ignore une ligne dont le produit n'existe plus dans le menu (robustesse)", () => {
    const lines = [{ lineId: "l1", productId: "inexistant", quantity: 1, selections: [] }];
    expect(cartTotalCents(menu, lines)).toBe(0);
  });
});

describe("areRequiredSelectionsValid — AC-P01-04", () => {
  const entrecote = findProduct(menu, "entrecote")!;

  it("refuse sans le choix de cuisson obligatoire (min=1)", () => {
    expect(areRequiredSelectionsValid(entrecote, [])).toBe(false);
  });

  it("accepte avec le choix de cuisson fait, suppléments optionnels absents", () => {
    expect(
      areRequiredSelectionsValid(entrecote, [{ groupId: "cuisson", choiceIds: ["bien-cuit"] }]),
    ).toBe(true);
  });

  it("refuse au-delà du maximum de suppléments (max=2)", () => {
    expect(
      areRequiredSelectionsValid(entrecote, [
        { groupId: "cuisson", choiceIds: ["a-point"] },
        { groupId: "supplements-entrecote", choiceIds: ["fromage", "bacon", "avocat"] },
      ]),
    ).toBe(false);
  });
});
